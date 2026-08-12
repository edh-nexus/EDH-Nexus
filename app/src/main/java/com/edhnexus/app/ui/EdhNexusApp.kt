package com.edhnexus.app.ui

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.edhnexus.app.data.GameHistoryStore
import com.edhnexus.app.data.ScryfallCommanderSearch
import com.edhnexus.app.domain.GameSession
import com.edhnexus.app.domain.PlayerDraft

private enum class AppScreen {
    Setup,
    Game,
    Stats,
}

@Composable
fun EdhNexusApp(
    historyStore: GameHistoryStore,
    commanderSearch: ScryfallCommanderSearch,
) {
    var screen by remember { mutableStateOf(AppScreen.Setup) }
    var drafts by remember { mutableStateOf(initialDrafts(4)) }
    var game by remember { mutableStateOf<GameSession?>(null) }
    var statsRevision by remember { mutableIntStateOf(0) }

    Scaffold(modifier = Modifier.fillMaxSize()) { padding ->
        when (screen) {
            AppScreen.Setup -> SetupScreen(
                modifier = Modifier.padding(padding),
                drafts = drafts,
                commanderSearch = commanderSearch,
                onPlayerCountChanged = { count -> drafts = drafts.resized(count) },
                onDraftChanged = { changed ->
                    drafts = drafts.map { if (it.seat == changed.seat) changed else it }
                },
                onStartGame = {
                    game = GameSession.fromDrafts(drafts, System.currentTimeMillis())
                    screen = AppScreen.Game
                },
                onViewStats = { screen = AppScreen.Stats },
            )

            AppScreen.Game -> SharedDeviceGameScreen(
                modifier = Modifier.padding(padding),
                session = requireNotNull(game),
                onSessionChanged = { game = it },
                onFinish = { winnerSeat ->
                    historyStore.recordCompletedGame(
                        session = requireNotNull(game),
                        winnerSeat = winnerSeat,
                        finishedAt = System.currentTimeMillis(),
                    )
                    statsRevision += 1
                    game = null
                    drafts = initialDrafts(drafts.size)
                    screen = AppScreen.Stats
                },
                onCancel = {
                    game = null
                    screen = AppScreen.Setup
                },
            )

            AppScreen.Stats -> StatsScreen(
                modifier = Modifier.padding(padding),
                revision = statsRevision,
                loadStats = historyStore::commanderStats,
                onBack = { screen = AppScreen.Setup },
            )
        }
    }
}

private fun initialDrafts(count: Int): List<PlayerDraft> =
    List(count) { seat -> PlayerDraft(seat = seat, playerName = "Player ${seat + 1}") }

private fun List<PlayerDraft>.resized(count: Int): List<PlayerDraft> = when {
    count < size -> take(count)
    count > size -> this + (size until count).map { seat ->
        PlayerDraft(seat = seat, playerName = "Player ${seat + 1}")
    }
    else -> this
}

