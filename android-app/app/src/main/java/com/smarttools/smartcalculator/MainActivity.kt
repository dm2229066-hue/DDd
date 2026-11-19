package com.smarttools.smartcalculator

import android.os.Bundle
import android.view.KeyEvent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Calculate
import androidx.compose.material.icons.outlined.Functions
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.smarttools.smartcalculator.ads.AdMobManager
import com.smarttools.smartcalculator.ui.CalculatorViewModel
import com.smarttools.smartcalculator.ui.screens.AboutScreen
import com.smarttools.smartcalculator.ui.screens.CalculatorScreen
import com.smarttools.smartcalculator.ui.screens.HistoryScreen
import com.smarttools.smartcalculator.ui.screens.ScientificScreen
import com.smarttools.smartcalculator.ui.screens.SettingsScreen
import com.smarttools.smartcalculator.ui.theme.SmartCalculatorTheme

enum class AppDestination(val label: String) {
    BASIC("Basic"),
    SCIENTIFIC("Scientific"),
    HISTORY("History"),
    SETTINGS("Settings"),
    ABOUT("About")
}

class MainActivity : ComponentActivity() {

    private val viewModel: CalculatorViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        AdMobManager.requestConsentAndLoadAds(this, adsEnabled = true) {}

        setContent {
            val settings by viewModel.settings.collectAsState()
            val uiState by viewModel.uiState.collectAsState()
            val history by viewModel.history.collectAsState()
            var destination by rememberSaveable { mutableStateOf(AppDestination.BASIC) }

            SmartCalculatorTheme(themeMode = settings.themeMode) {
                Scaffold(
                    bottomBar = {
                        NavigationBar {
                            listOf(
                                AppDestination.BASIC to Icons.Outlined.Calculate,
                                AppDestination.SCIENTIFIC to Icons.Outlined.Functions,
                                AppDestination.HISTORY to Icons.Outlined.History,
                                AppDestination.SETTINGS to Icons.Outlined.Settings,
                                AppDestination.ABOUT to Icons.Outlined.Info
                            ).forEach { (tab, icon) ->
                                NavigationBarItem(
                                    selected = destination == tab,
                                    onClick = { destination = tab },
                                    icon = { Icon(icon, contentDescription = tab.label) },
                                    label = { Text(tab.label) }
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    androidx.compose.foundation.layout.Box(modifier = Modifier.padding(innerPadding)) {
                        when (destination) {
                            AppDestination.BASIC -> CalculatorScreen(
                                uiState = uiState,
                                settings = settings,
                                viewModel = viewModel,
                                onTriggerInterstitial = {
                                    AdMobManager.maybeShowInterstitial(this@MainActivity, settings.adsEnabled)
                                }
                            )
                            AppDestination.SCIENTIFIC -> ScientificScreen(
                                uiState = uiState,
                                settings = settings,
                                viewModel = viewModel,
                                onTriggerInterstitial = {
                                    AdMobManager.maybeShowInterstitial(this@MainActivity, settings.adsEnabled)
                                }
                            )
                            AppDestination.HISTORY -> HistoryScreen(
                                history = history,
                                onSelect = { value ->
                                    viewModel.loadFromHistory(value)
                                    destination = AppDestination.BASIC
                                },
                                onDeleteItem = viewModel::deleteHistoryItem,
                                onClearAll = viewModel::clearHistory
                            )
                            AppDestination.SETTINGS -> SettingsScreen(
                                settings = settings,
                                viewModel = viewModel,
                                onOpenAbout = { destination = AppDestination.ABOUT }
                            )
                            AppDestination.ABOUT -> AboutScreen()
                        }
                    }
                }
            }
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        val unicode = event?.unicodeChar ?: 0
        when {
            unicode in '0'.code..'9'.code -> {
                viewModel.appendToken(unicode.toChar().toString())
                return true
            }
            unicode == '+'.code -> { viewModel.appendOperator("+"); return true }
            unicode == '-'.code -> { viewModel.appendOperator("-"); return true }
            unicode == '*'.code -> { viewModel.appendOperator("×"); return true }
            unicode == '/'.code -> { viewModel.appendOperator("÷"); return true }
            unicode == '^'.code -> { viewModel.appendOperator("^"); return true }
            unicode == '%'.code -> { viewModel.appendToken("%"); return true }
            unicode == '('.code || unicode == ')'.code -> {
                viewModel.appendToken(unicode.toChar().toString())
                return true
            }
            unicode == '.'.code -> { viewModel.appendDecimal(); return true }
            keyCode == KeyEvent.KEYCODE_ENTER || keyCode == KeyEvent.KEYCODE_NUMPAD_ENTER -> {
                viewModel.evaluate(isScientific = false)
                return true
            }
            keyCode == KeyEvent.KEYCODE_DEL -> { viewModel.deleteLast(); return true }
            keyCode == KeyEvent.KEYCODE_ESCAPE -> { viewModel.clearAll(); return true }
        }
        return super.onKeyDown(keyCode, event)
    }
}
