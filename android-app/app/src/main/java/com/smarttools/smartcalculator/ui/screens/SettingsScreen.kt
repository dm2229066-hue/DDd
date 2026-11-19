package com.smarttools.smartcalculator.ui.screens

import android.app.Activity
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.smarttools.smartcalculator.ads.AdMobManager
import com.smarttools.smartcalculator.data.ThemeMode
import com.smarttools.smartcalculator.data.UserSettings
import com.smarttools.smartcalculator.ui.CalculatorViewModel
import kotlin.math.roundToInt

@Composable
fun SettingsScreen(
    settings: UserSettings,
    viewModel: CalculatorViewModel,
    onOpenAbout: () -> Unit
) {
    val context = LocalContext.current
    var showPrivacyDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "Settings",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground
        )

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surface
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Appearance", style = MaterialTheme.typography.titleMedium)
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(
                        ThemeMode.SYSTEM to "System Default",
                        ThemeMode.DARK to "Dark Mode",
                        ThemeMode.LIGHT to "Light Mode"
                    ).forEach { (mode, label) ->
                        FilterChip(
                            selected = settings.themeMode == mode,
                            onClick = { viewModel.setThemeMode(mode) },
                            label = { Text(label) }
                        )
                    }
                }
            }
        }

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surface
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                SettingToggleRow(
                    title = "Button Sound",
                    subtitle = "Play tactile click sound on keypad press",
                    checked = settings.buttonSoundEnabled,
                    onCheckedChange = viewModel::setButtonSound
                )
                SettingToggleRow(
                    title = "Vibration Feedback",
                    subtitle = "Haptic pulse on button press",
                    checked = settings.vibrationEnabled,
                    onCheckedChange = viewModel::setVibration
                )
                SettingToggleRow(
                    title = "Thousands Separator",
                    subtitle = "Format numbers like 1,234,567.89",
                    checked = settings.thousandsSeparatorEnabled,
                    onCheckedChange = viewModel::setThousandsSeparator
                )
                Column {
                    Text(
                        text = "Decimal Precision: ${settings.decimalPrecision} digits",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Slider(
                        value = settings.decimalPrecision.toFloat(),
                        onValueChange = { viewModel.setDecimalPrecision(it.roundToInt()) },
                        valueRange = 0f..10f,
                        steps = 9
                    )
                }
            }
        }

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surface
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                SettingToggleRow(
                    title = "AdMob Test Ads",
                    subtitle = "Configurable Google AdMob test banner & interstitials",
                    checked = settings.adsEnabled,
                    onCheckedChange = viewModel::setAdsEnabled
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = {
                        (context as? Activity)?.let { AdMobManager.showPrivacyOptions(it) }
                    }) {
                        Text("Ad Consent Settings")
                    }
                    TextButton(onClick = {
                        (context as? Activity)?.let { act ->
                            AdMobManager.showRewardedAd(act) {
                                viewModel.setAdsEnabled(false)
                            }
                        }
                    }) {
                        Text("Watch Rewarded Ad (Ad-Free Session)")
                    }
                }
            }
        }

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surface
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = { viewModel.clearHistory() },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Clear Calculation History")
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showPrivacyDialog = true }
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Privacy Policy", style = MaterialTheme.typography.titleMedium)
                    Text("View", color = MaterialTheme.colorScheme.primary)
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onOpenAbout() }
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("About Application", style = MaterialTheme.typography.titleMedium)
                    Text("v1.0.0", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }

    if (showPrivacyDialog) {
        AlertDialog(
            onDismissRequest = { showPrivacyDialog = false },
            title = { Text("Privacy Policy") },
            text = {
                Text(
                    "Smart Calculator performs all mathematical calculations and history storage locally on your device. " +
                        "No calculation expressions or personal files are uploaded to external servers. " +
                        "Optional AdMob ads use Google Mobile Ads SDK with UMP user consent controls."
                )
            },
            confirmButton = {
                TextButton(onClick = { showPrivacyDialog = false }) { Text("Close") }
            }
        )
    }
}

@Composable
private fun SettingToggleRow(
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f).padding(end = 12.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Switch(checked = checked, onCheckedChange = onCheckedChange)
    }
}
