package com.edhnexus.app.data

import android.os.Handler
import android.os.Looper
import com.edhnexus.app.domain.CommanderRef
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URI
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class ScryfallCommanderSearch(
    private val executor: ExecutorService = Executors.newSingleThreadExecutor(),
    private val mainHandler: Handler = Handler(Looper.getMainLooper()),
) : AutoCloseable {

    fun search(
        name: String,
        callback: (Result<List<CommanderRef>>) -> Unit,
    ) {
        if (name.isBlank()) {
            callback(Result.success(emptyList()))
            return
        }

        executor.execute {
            val result = runCatching { request(name.trim()) }
            mainHandler.post { callback(result) }
        }
    }

    private fun request(name: String): List<CommanderRef> {
        val query = URLEncoder.encode(
            "format:commander is:commander $name",
            StandardCharsets.UTF_8.toString(),
        )
        val connection = URI("https://api.scryfall.com/cards/search?q=$query")
            .toURL()
            .openConnection() as HttpURLConnection

        return connection.run {
            requestMethod = "GET"
            connectTimeout = 8_000
            readTimeout = 8_000
            setRequestProperty("Accept", "application/json")
            setRequestProperty("User-Agent", "EDHNexus/0.1 (github.com/edh-nexus/EDH-Nexus)")
            try {
                if (responseCode !in 200..299) {
                    error("Scryfall returned HTTP $responseCode")
                }
                val body = inputStream.bufferedReader().use { it.readText() }
                parseCards(JSONObject(body))
            } finally {
                disconnect()
            }
        }
    }

    private fun parseCards(response: JSONObject): List<CommanderRef> {
        val cards = response.getJSONArray("data")
        return buildList {
            for (index in 0 until minOf(cards.length(), MAX_RESULTS)) {
                val card = cards.getJSONObject(index)
                add(
                    CommanderRef(
                        oracleId = card.getString("oracle_id"),
                        name = card.getString("name"),
                        imageUrl = imageUrl(card),
                    ),
                )
            }
        }
    }

    private fun imageUrl(card: JSONObject): String? {
        card.optJSONObject("image_uris")?.optString("normal")?.takeIf { it.isNotBlank() }
            ?.let { return it }

        val faces = card.optJSONArray("card_faces") ?: return null
        if (faces.length() == 0) return null
        return faces.getJSONObject(0)
            .optJSONObject("image_uris")
            ?.optString("normal")
            ?.takeIf { it.isNotBlank() }
    }

    override fun close() {
        executor.shutdownNow()
    }

    companion object {
        private const val MAX_RESULTS = 20
    }
}

