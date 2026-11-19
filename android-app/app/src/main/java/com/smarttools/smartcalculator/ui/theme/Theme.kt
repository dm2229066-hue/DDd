package com.smarttools.smartcalculator.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.smarttools.smartcalculator.data.ThemeMode

val ObsidianBackground = Color(0xFF090D16)
val ObsidianSurface = Color(0xFF111827)
val ObsidianSurfaceVariant = Color(0xFF1E293B)
val LightBackground = Color(0xFFF8FAFC)
val LightSurface = Color(0xFFFFFFFF)
val LightSurfaceVariant = Color(0xFFE2E8F0)

val AccentAmber = Color(0xFFF59E0B)
val AccentAmberDark = Color(0xFFD97706)
val AccentIndigo = Color(0xFF6366F1)

private val DarkColors = darkColorScheme(
    primary = AccentAmber,
    onPrimary = Color(0xFF090D16),
    secondary = AccentIndigo,
    onSecondary = Color.White,
    background = ObsidianBackground,
    onBackground = Color(0xFFF8FAFC),
    surface = ObsidianSurface,
    onSurface = Color(0xFFF8FAFC),
    surfaceVariant = ObsidianSurfaceVariant,
    onSurfaceVariant = Color(0xFF94A3B8),
    outline = Color(0xFF334155),
    error = Color(0xFFEF4444)
)

private val LightColors = lightColorScheme(
    primary = AccentAmberDark,
    onPrimary = Color.White,
    secondary = AccentIndigo,
    onSecondary = Color.White,
    background = LightBackground,
    onBackground = Color(0xFF0F172A),
    surface = LightSurface,
    onSurface = Color(0xFF0F172A),
    surfaceVariant = LightSurfaceVariant,
    onSurfaceVariant = Color(0xFF475569),
    outline = Color(0xFFCBD5E1),
    error = Color(0xFFDC2626)
)

private val AppTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 44.sp,
        lineHeight = 52.sp,
        fontFeatureSettings = "tnum"
    ),
    headlineMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 24.sp,
        lineHeight = 32.sp
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Medium,
        fontSize = 16.sp,
        lineHeight = 24.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp
    ),
    labelMedium = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp
    )
)

@Composable
fun SmartCalculatorTheme(
    themeMode: ThemeMode,
    content: @Composable () -> Unit
) {
    val useDark = when (themeMode) {
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
        ThemeMode.DARK -> true
        ThemeMode.LIGHT -> false
    }
    MaterialTheme(
        colorScheme = if (useDark) DarkColors else LightColors,
        typography = AppTypography,
        content = content
    )
}
