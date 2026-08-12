package com.edhnexus.app.domain

data class CommanderRef(
    val oracleId: String,
    val name: String,
    val imageUrl: String? = null,
)

data class PlayerDraft(
    val seat: Int,
    val playerName: String,
    val commander: CommanderRef? = null,
    val partner: CommanderRef? = null,
)

data class PlayerGameState(
    val seat: Int,
    val playerName: String,
    val commanders: List<CommanderRef>,
    val life: Int = STARTING_LIFE,
)

data class GameSession(
    val startedAt: Long,
    val players: List<PlayerGameState>,
) {
    init {
        require(players.size in MIN_PLAYERS..MAX_PLAYERS) {
            "A shared-device game requires $MIN_PLAYERS to $MAX_PLAYERS players"
        }
        require(players.map { it.seat }.distinct().size == players.size) {
            "Every player must occupy a unique seat"
        }
    }

    fun adjustLife(seat: Int, delta: Int): GameSession = copy(
        players = players.map { player ->
            if (player.seat == seat) player.copy(life = player.life + delta) else player
        },
    )

    companion object {
        const val STARTING_LIFE = 40
        const val MIN_PLAYERS = 2
        const val MAX_PLAYERS = 6

        fun fromDrafts(drafts: List<PlayerDraft>, startedAt: Long): GameSession = GameSession(
            startedAt = startedAt,
            players = drafts.map { draft ->
                PlayerGameState(
                    seat = draft.seat,
                    playerName = draft.playerName.ifBlank { "Player ${draft.seat + 1}" },
                    commanders = listOfNotNull(draft.commander, draft.partner),
                )
            },
        )
    }
}

data class CommanderStat(
    val oracleId: String,
    val commanderName: String,
    val games: Int,
    val wins: Int,
) {
    val losses: Int get() = games - wins
    val winRate: Int get() = if (games == 0) 0 else (wins * 100) / games
}

const val STARTING_LIFE = GameSession.STARTING_LIFE
const val MIN_PLAYERS = GameSession.MIN_PLAYERS
const val MAX_PLAYERS = GameSession.MAX_PLAYERS

