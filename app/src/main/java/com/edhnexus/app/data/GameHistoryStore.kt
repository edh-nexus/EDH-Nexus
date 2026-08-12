package com.edhnexus.app.data

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.edhnexus.app.domain.CommanderStat
import com.edhnexus.app.domain.GameSession

class GameHistoryStore(context: Context) :
    SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                started_at INTEGER NOT NULL,
                finished_at INTEGER NOT NULL,
                winner_seat INTEGER NOT NULL
            )
            """.trimIndent(),
        )
        db.execSQL(
            """
            CREATE TABLE participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
                seat INTEGER NOT NULL,
                player_name TEXT NOT NULL,
                final_life INTEGER NOT NULL,
                won INTEGER NOT NULL CHECK (won IN (0, 1))
            )
            """.trimIndent(),
        )
        db.execSQL(
            """
            CREATE TABLE commanders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
                oracle_id TEXT NOT NULL,
                commander_name TEXT NOT NULL,
                position INTEGER NOT NULL
            )
            """.trimIndent(),
        )
        db.execSQL("CREATE INDEX commanders_oracle_id ON commanders(oracle_id)")
        db.execSQL("CREATE INDEX participants_game_id ON participants(game_id)")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) = Unit

    fun recordCompletedGame(session: GameSession, winnerSeat: Int, finishedAt: Long) {
        require(session.players.any { it.seat == winnerSeat }) { "Winner must be in this game" }

        writableDatabase.runInTransaction {
            val gameId = insertOrThrow(
                "games",
                null,
                ContentValues().apply {
                    put("started_at", session.startedAt)
                    put("finished_at", finishedAt)
                    put("winner_seat", winnerSeat)
                },
            )

            session.players.forEach { player ->
                val participantId = insertOrThrow(
                    "participants",
                    null,
                    ContentValues().apply {
                        put("game_id", gameId)
                        put("seat", player.seat)
                        put("player_name", player.playerName)
                        put("final_life", player.life)
                        put("won", if (player.seat == winnerSeat) 1 else 0)
                    },
                )

                player.commanders.forEachIndexed { position, commander ->
                    insertOrThrow(
                        "commanders",
                        null,
                        ContentValues().apply {
                            put("participant_id", participantId)
                            put("oracle_id", commander.oracleId)
                            put("commander_name", commander.name)
                            put("position", position)
                        },
                    )
                }
            }
        }
    }

    fun commanderStats(): List<CommanderStat> {
        val sql =
            """
            SELECT c.oracle_id, c.commander_name, COUNT(*) AS games, SUM(p.won) AS wins
            FROM commanders c
            JOIN participants p ON p.id = c.participant_id
            GROUP BY c.oracle_id, c.commander_name
            ORDER BY wins DESC, games DESC, c.commander_name COLLATE NOCASE
            """.trimIndent()

        return readableDatabase.rawQuery(sql, null).use { cursor ->
            buildList {
                while (cursor.moveToNext()) {
                    add(
                        CommanderStat(
                            oracleId = cursor.getString(0),
                            commanderName = cursor.getString(1),
                            games = cursor.getInt(2),
                            wins = cursor.getInt(3),
                        ),
                    )
                }
            }
        }
    }

    companion object {
        private const val DATABASE_NAME = "edh-nexus.db"
        private const val DATABASE_VERSION = 1
    }
}

private inline fun SQLiteDatabase.runInTransaction(block: SQLiteDatabase.() -> Unit) {
    beginTransaction()
    try {
        block()
        setTransactionSuccessful()
    } finally {
        endTransaction()
    }
}

