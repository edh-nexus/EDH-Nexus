package com.edhnexus.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.edhnexus.app.domain.GameSession
import com.edhnexus.app.domain.PlayerGameState

private val SeatColors = listOf(
    Color(0xFF312E81),
    Color(0xFF7F1D1D),
    Color(0xFF14532D),
    Color(0xFF713F12),
    Color(0xFF164E63),
    Color(0xFF581C87),
)

@Composable
fun SharedDeviceGameScreen(
    session: GameSession,
    onSessionChanged: (GameSession) -> Unit,
    onFinish: (winnerSeat: Int) -> Unit,
    onCancel: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var showFinish by remember { mutableStateOf(false) }
    var showCancel by remember { mutableStateOf(false) }
    val columns = when (session.players.size) {
        2 -> 1
        3, 4 -> 2
        else -> 3
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            session.players.chunked(columns).forEachIndexed { rowIndex, rowPlayers ->
                Row(modifier = Modifier.weight(1f)) {
                    rowPlayers.forEach { player ->
                        PlayerLifePanel(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxSize()
                                .padding(4.dp)
                                .rotate(if (rowIndex == 0) 180f else 0f),
                            player = player,
                            color = SeatColors[player.seat % SeatColors.size],
                            onLifeChanged = { delta ->
                                onSessionChanged(session.adjustLife(player.seat, delta))
                            },
                        )
                    }
                    repeat(columns - rowPlayers.size) {
                        Spacer(Modifier.weight(1f))
                    }
                }
            }
        }

        Surface(
            modifier = Modifier.align(Alignment.Center),
            shape = RoundedCornerShape(20.dp),
            tonalElevation = 10.dp,
        ) {
            Row(
                modifier = Modifier.padding(6.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                OutlinedButton(onClick = { showCancel = true }) { Text("Cancel") }
                Button(onClick = { showFinish = true }) { Text("Finish") }
            }
        }
    }

    if (showFinish) {
        WinnerDialog(
            players = session.players,
            onDismiss = { showFinish = false },
            onWinner = onFinish,
        )
    }
    if (showCancel) {
        AlertDialog(
            onDismissRequest = { showCancel = false },
            title = { Text("Cancel this game?") },
            text = { Text("The unfinished game will not be included in statistics.") },
            confirmButton = {
                TextButton(onClick = onCancel) { Text("Cancel game") }
            },
            dismissButton = {
                TextButton(onClick = { showCancel = false }) { Text("Keep playing") }
            },
        )
    }
}

@Composable
private fun PlayerLifePanel(
    player: PlayerGameState,
    color: Color,
    onLifeChanged: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .background(color, RoundedCornerShape(18.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                player.playerName,
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.titleMedium,
            )
            Text(
                player.commanders.joinToString(" + ") { it.name },
                maxLines = 2,
                textAlign = TextAlign.Center,
                style = MaterialTheme.typography.bodySmall,
            )
        }

        Text(
            text = player.life.toString(),
            fontSize = 58.sp,
            lineHeight = 60.sp,
            fontWeight = FontWeight.Black,
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly,
        ) {
            LifeButton("−5") { onLifeChanged(-5) }
            LifeButton("−1") { onLifeChanged(-1) }
            LifeButton("+1") { onLifeChanged(1) }
            LifeButton("+5") { onLifeChanged(5) }
        }
    }
}

@Composable
private fun LifeButton(label: String, onClick: () -> Unit) {
    Button(onClick = onClick) {
        Text(label, fontSize = 18.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun WinnerDialog(
    players: List<PlayerGameState>,
    onDismiss: () -> Unit,
    onWinner: (Int) -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Who won?") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                players.forEach { player ->
                    Button(
                        modifier = Modifier.fillMaxWidth(),
                        onClick = { onWinner(player.seat) },
                    ) {
                        Text(
                            "${player.playerName} — ${player.commanders.joinToString(" + ") { it.name }}",
                            maxLines = 2,
                        )
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Keep playing") }
        },
    )
}
