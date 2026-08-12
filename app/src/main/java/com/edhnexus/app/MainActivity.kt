package com.edhnexus.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.edhnexus.app.data.GameHistoryStore
import com.edhnexus.app.data.ScryfallCommanderSearch
import com.edhnexus.app.ui.EdhNexusApp
import com.edhnexus.app.ui.theme.EdhNexusTheme

class MainActivity : ComponentActivity() {
    private lateinit var historyStore: GameHistoryStore
    private lateinit var commanderSearch: ScryfallCommanderSearch

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        historyStore = GameHistoryStore(applicationContext)
        commanderSearch = ScryfallCommanderSearch()

        setContent {
            EdhNexusTheme {
                EdhNexusApp(
                    historyStore = historyStore,
                    commanderSearch = commanderSearch,
                )
            }
        }
    }

    override fun onDestroy() {
        commanderSearch.close()
        historyStore.close()
        super.onDestroy()
    }
}

