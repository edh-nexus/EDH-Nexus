package com.edhnexus.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.edhnexus.app.domain.CommanderStat

@Composable
fun StatsScreen(
    revision: Int,
    loadStats: () -> List<CommanderStat>,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val stats = remember(revision) { loadStats() }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text("Commander statistics", style = MaterialTheme.typography.headlineLarge)
                Text(
                    "Wins and losses recorded on this device",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            OutlinedButton(onClick = onBack) { Text("New game") }
        }

        if (stats.isEmpty()) {
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Text("No completed games yet", style = MaterialTheme.typography.headlineSmall)
                Text("Finish a game and choose its winner to create statistics.")
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(stats, key = { it.oracleId }) { stat ->
                    CommanderStatCard(stat)
                }
            }
        }
    }
}

@Composable
private fun CommanderStatCard(stat: CommanderStat) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(stat.commanderName, fontWeight = FontWeight.Bold)
                Text("${stat.games} games")
            }
            Text("${stat.wins}W", color = MaterialTheme.colorScheme.secondary)
            Text("  ${stat.losses}L  ")
            Text("${stat.winRate}%", fontWeight = FontWeight.Bold)
        }
    }
}

