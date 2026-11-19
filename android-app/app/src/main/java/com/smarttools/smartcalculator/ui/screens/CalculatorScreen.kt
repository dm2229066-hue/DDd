package com.smarttools.smartcalculator.ui.screens

import android.content.res.Configuration
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.dp
import com.smarttools.smartcalculator.ads.AdMobBannerSlot
import com.smarttools.smartcalculator.data.UserSettings
import com.smarttools.smartcalculator.ui.CalculatorUiState
import com.smarttools.smartcalculator.ui.CalculatorViewModel
import com.smarttools.smartcalculator.ui.components.CalcKey
import com.smarttools.smartcalculator.ui.components.CalculatorDisplay
import com.smarttools.smartcalculator.ui.components.KeyVariant
import com.smarttools.smartcalculator.ui.components.MemoryBar

@Composable
fun CalculatorScreen(
    uiState: CalculatorUiState,
    settings: UserSettings,
    viewModel: CalculatorViewModel,
    onTriggerInterstitial: () -> Unit
) {
    val view = LocalView.current
    val isLandscape = LocalConfiguration.current.orientation == Configuration.ORIENTATION_LANDSCAPE
    val feedback = { viewModel.triggerFeedback(view) }

    if (isLandscape) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Column(
                modifier = Modifier
                    .weight(0.45f)
                    .fillMaxHeight(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                AdMobBannerSlot(enabled = settings.adsEnabled)
                CalculatorDisplay(
                    expression = uiState.expression,
                    livePreview = uiState.livePreview,
                    errorMessage = uiState.errorMessage,
                    angleLabel = null,
                    hasMemory = settings.hasMemoryValue,
                    modifier = Modifier.weight(1f)
                )
                MemoryBar(
                    hasMemory = settings.hasMemoryValue,
                    onMc = viewModel::memoryClear,
                    onMr = viewModel::memoryRecall,
                    onMPlus = { viewModel.memoryAdd(false) },
                    onMMinus = { viewModel.memoryAdd(true) },
                    onFeedback = feedback
                )
            }
            BasicKeypadGrid(
                modifier = Modifier
                    .weight(0.55f)
                    .fillMaxHeight(),
                viewModel = viewModel,
                onFeedback = feedback,
                onEvaluate = { viewModel.evaluate(isScientific = false, onTriggerInterstitial) }
            )
        }
    } else {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // AdMob Banner kept at top above display, strictly separated from keypad keys
            AdMobBannerSlot(enabled = settings.adsEnabled)

            CalculatorDisplay(
                expression = uiState.expression,
                livePreview = uiState.livePreview,
                errorMessage = uiState.errorMessage,
                angleLabel = null,
                hasMemory = settings.hasMemoryValue
            )

            MemoryBar(
                hasMemory = settings.hasMemoryValue,
                onMc = viewModel::memoryClear,
                onMr = viewModel::memoryRecall,
                onMPlus = { viewModel.memoryAdd(false) },
                onMMinus = { viewModel.memoryAdd(true) },
                onFeedback = feedback
            )

            BasicKeypadGrid(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                viewModel = viewModel,
                onFeedback = feedback,
                onEvaluate = { viewModel.evaluate(isScientific = false, onTriggerInterstitial) }
            )
        }
    }
}

@Composable
private fun BasicKeypadGrid(
    modifier: Modifier,
    viewModel: CalculatorViewModel,
    onFeedback: () -> Unit,
    onEvaluate: () -> Unit
) {
    val rows = listOf(
        listOf(
            Triple("AC", KeyVariant.ACTION_CLEAR) { viewModel.clearAll() },
            Triple("( )", KeyVariant.FUNCTION) { viewModel.appendSmartParenthesis() },
            Triple("%", KeyVariant.FUNCTION) { viewModel.appendToken("%") },
            Triple("÷", KeyVariant.OPERATOR) { viewModel.appendOperator("÷") }
        ),
        listOf(
            Triple("7", KeyVariant.NUMBER) { viewModel.appendToken("7") },
            Triple("8", KeyVariant.NUMBER) { viewModel.appendToken("8") },
            Triple("9", KeyVariant.NUMBER) { viewModel.appendToken("9") },
            Triple("×", KeyVariant.OPERATOR) { viewModel.appendOperator("×") }
        ),
        listOf(
            Triple("4", KeyVariant.NUMBER) { viewModel.appendToken("4") },
            Triple("5", KeyVariant.NUMBER) { viewModel.appendToken("5") },
            Triple("6", KeyVariant.NUMBER) { viewModel.appendToken("6") },
            Triple("−", KeyVariant.OPERATOR) { viewModel.appendOperator("-") }
        ),
        listOf(
            Triple("1", KeyVariant.NUMBER) { viewModel.appendToken("1") },
            Triple("2", KeyVariant.NUMBER) { viewModel.appendToken("2") },
            Triple("3", KeyVariant.NUMBER) { viewModel.appendToken("3") },
            Triple("+", KeyVariant.OPERATOR) { viewModel.appendOperator("+") }
        ),
        listOf(
            Triple("+/-", KeyVariant.FUNCTION) { viewModel.toggleSign() },
            Triple("0", KeyVariant.NUMBER) { viewModel.appendToken("0") },
            Triple(".", KeyVariant.NUMBER) { viewModel.appendDecimal() },
            Triple("DEL", KeyVariant.ACTION_CLEAR) { viewModel.deleteLast() }
        )
    )

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        rows.forEach { row ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                row.forEach { (label, variant, action) ->
                    CalcKey(
                        label = label,
                        variant = variant,
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight(),
                        onFeedback = onFeedback,
                        onClick = action
                    )
                }
            }
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .weight(0.95f)
        ) {
            CalcKey(
                label = "=",
                variant = KeyVariant.EQUALS,
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(),
                onFeedback = onFeedback,
                onClick = onEvaluate
            )
        }
    }
}
