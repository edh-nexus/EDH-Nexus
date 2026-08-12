package com.edhnexus.app.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.edhnexus.app.data.ScryfallCommanderSearch
import com.edhnexus.app.domain.CommanderRef
import com.edhnexus.app.domain.MAX_PLAYERS
import com.edhnexus.app.domain.MIN_PLAYERS
import com.edhnexus.app.domain.PlayerDraft

@Composable
fun SetupScreen(
    drafts: List<PlayerDraft>,
    commanderSearch: ScryfallCommanderSearch,
    onPlayerCountChanged: (Int) -> Unit,
    onDraftChanged: (PlayerDraft) -> Unit,
    onStartGame: () -> Unit,
    onViewStats: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxSize()
            .padding(20.dp),
        horizontalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        Column(
            modifier = Modifier.widthIn(min = 190.dp, max = 250.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("EDH Nexus", style = MaterialTheme.typography.headlineLarge)
            Text(
                "Shared-device Commander tracker",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Text("Players", style = MaterialTheme.typography.titleMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                for (count in MIN_PLAYERS..MAX_PLAYERS) {
                    if (drafts.size == count) {
                        Button(onClick = { onPlayerCountChanged(count) }) { Text("$count") }
                    } else {
                        OutlinedButton(onClick = { onPlayerCountChanged(count) }) { Text("$count") }
                    }
                }
            }

            Spacer(Modifier.weight(1f))
            OutlinedButton(
                modifier = Modifier.fillMaxWidth(),
                onClick = onViewStats,
            ) {
                Text("Commander statistics")
            }
            Button(
                modifier = Modifier.fillMaxWidth(),
                enabled = drafts.all { it.commander != null },
                onClick = onStartGame,
            ) {
                Text("Start game")
            }
            if (drafts.any { it.commander == null }) {
                Text(
                    "Choose a commander for every seat to begin.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            itemsIndexed(drafts, key = { _, draft -> draft.seat }) { _, draft ->
                PlayerSetupCard(
                    draft = draft,
                    commanderSearch = commanderSearch,
                    onChanged = onDraftChanged,
                )
            }
        }
    }
}

@Composable
private fun PlayerSetupCard(
    draft: PlayerDraft,
    commanderSearch: ScryfallCommanderSearch,
    onChanged: (PlayerDraft) -> Unit,
) {
    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("${draft.seat + 1}", style = MaterialTheme.typography.headlineSmall)
            OutlinedTextField(
                modifier = Modifier.weight(1f),
                value = draft.playerName,
                singleLine = true,
                label = { Text("Player name") },
                onValueChange = { onChanged(draft.copy(playerName = it)) },
            )
            CommanderButton(
                modifier = Modifier.weight(1.2f),
                label = "Commander",
                selection = draft.commander,
                commanderSearch = commanderSearch,
                onSelected = { onChanged(draft.copy(commander = it)) },
            )
            CommanderButton(
                modifier = Modifier.weight(1.2f),
                label = "Partner / Background (optional)",
                selection = draft.partner,
                commanderSearch = commanderSearch,
                allowClear = true,
                onSelected = { onChanged(draft.copy(partner = it)) },
            )
        }
    }
}

@Composable
private fun CommanderButton(
    label: String,
    selection: CommanderRef?,
    commanderSearch: ScryfallCommanderSearch,
    onSelected: (CommanderRef?) -> Unit,
    modifier: Modifier = Modifier,
    allowClear: Boolean = false,
) {
    var showPicker by remember { mutableStateOf(false) }
    OutlinedButton(modifier = modifier, onClick = { showPicker = true }) {
        Text(selection?.name ?: label, maxLines = 2)
    }
    if (showPicker) {
        CommanderPickerDialog(
            title = label,
            commanderSearch = commanderSearch,
            allowClear = allowClear,
            onDismiss = { showPicker = false },
            onSelected = {
                onSelected(it)
                showPicker = false
            },
        )
    }
}

@Composable
private fun CommanderPickerDialog(
    title: String,
    commanderSearch: ScryfallCommanderSearch,
    allowClear: Boolean,
    onDismiss: () -> Unit,
    onSelected: (CommanderRef?) -> Unit,
) {
    var query by remember { mutableStateOf("") }
    var results by remember { mutableStateOf(emptyList<CommanderRef>()) }
    var searching by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .height(430.dp),
            shape = RoundedCornerShape(20.dp),
            tonalElevation = 8.dp,
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text(title, style = MaterialTheme.typography.headlineSmall)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        modifier = Modifier.weight(1f),
                        value = query,
                        singleLine = true,
                        label = { Text("Commander name") },
                        onValueChange = { query = it },
                    )
                    Button(
                        enabled = query.isNotBlank() && !searching,
                        onClick = {
                            searching = true
                            error = null
                            commanderSearch.search(query) { result ->
                                result.onSuccess { results = it }
                                    .onFailure { error = it.message ?: "Search failed" }
                                searching = false
                            }
                        },
                    ) {
                        Text("Search")
                    }
                }

                if (searching) {
                    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                error?.let { Text(it, color = MaterialTheme.colorScheme.error) }

                LazyColumn(modifier = Modifier.weight(1f)) {
                    items(results, key = { it.oracleId }) { commander ->
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelected(commander) }
                                .padding(vertical = 10.dp),
                        ) {
                            Text(commander.name, style = MaterialTheme.typography.titleMedium)
                            Text(
                                "Select this commander",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                ) {
                    if (allowClear) TextButton(onClick = { onSelected(null) }) { Text("Clear") }
                    TextButton(onClick = onDismiss) { Text("Cancel") }
                }
            }
        }
    }
}

