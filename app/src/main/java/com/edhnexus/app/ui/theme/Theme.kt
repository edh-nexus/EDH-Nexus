package com.edhnexus.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val NexusColors = darkColorScheme(
    primary = Color(0xFFA78BFA),
    onPrimary = Color(0xFF160C2E),
    secondary = Color(0xFF5EEAD4),
    background = Color(0xFF080A10),
    surface = Color(0xFF121621),
    surfaceVariant = Color(0xFF1C2331),
    onBackground = Color(0xFFF8FAFC),
    onSurface = Color(0xFFF8FAFC),
)

@Composable
fun EdhNexusTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = NexusColors,
        content = content,
    )
}

