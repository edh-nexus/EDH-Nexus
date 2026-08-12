package com.edhnexus.app.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class GameSessionTest {
    private val commander = CommanderRef("oracle-1", "Atraxa, Praetors' Voice")

    @Test
    fun allPlayersStartAtFortyLife() {
        val session = GameSession.fromDrafts(
            drafts = (0 until 4).map { seat ->
                PlayerDraft(seat, "Player ${seat + 1}", commander)
            },
            startedAt = 100L,
        )

        assertEquals(listOf(40, 40, 40, 40), session.players.map { it.life })
    }

    @Test
    fun lifeChangesOnlyForSelectedSeat() {
        val session = GameSession.fromDrafts(
            drafts = (0 until 2).map { PlayerDraft(it, "P$it", commander) },
            startedAt = 100L,
        )

        val updated = session.adjustLife(seat = 1, delta = -5)

        assertEquals(40, updated.players[0].life)
        assertEquals(35, updated.players[1].life)
    }

    @Test
    fun rejectsMoreThanSixPlayers() {
        assertThrows(IllegalArgumentException::class.java) {
            GameSession.fromDrafts(
                drafts = (0 until 7).map { PlayerDraft(it, "P$it", commander) },
                startedAt = 100L,
            )
        }
    }

    @Test
    fun commanderStatsCalculateLossesAndWinRate() {
        val stats = CommanderStat("id", "Commander", games = 4, wins = 3)
        assertEquals(1, stats.losses)
        assertEquals(75, stats.winRate)
    }
}

