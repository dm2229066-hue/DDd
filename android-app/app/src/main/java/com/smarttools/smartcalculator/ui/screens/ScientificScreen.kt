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
import androidx.compose.ui.unit.sp
import com.smarttools.smartcalculator.data.UserSettings
import com.smarttools.smartcalculator.ui.CalculatorUiState
import com.smarttools.smartcalculator.ui.CalculatorViewModel
import com.smarttools.smartcalculator.ui.components.CalcKey
import com.smarttools.smartcalculator.ui.components.CalculatorDisplay
import com.smarttools.smartcalculator.ui.components.KeyVariant

@Composable
fun ScientificScreen(
    uiState: CalculatorUiState,
    settings: UserSettings,
    viewModel: CalculatorViewModel,
    onTriggerInterstitial: () -> Unit
) {
    val view = LocalView.current
    val isLandscape = LocalConfiguration.current.orientation == Configuration.ORIENTATION_LANDSCAPE
    val feedback = { viewModel.triggerFeedback(view) }
    val inv = uiState.isInverseTrig

    val sciRows = listOf(
        listOf(
            Triple(settings.angleUnit.name, KeyVariant.OPERATOR) { viewModel.toggleAngleUnit() },
            Triple(if (inv) "1st" else "2nd", KeyVariant.OPERATOR) { viewModel.toggleInverseTrig() },
            Triple(if (inv) "sin⁻¹" else "sin", KeyVariant.FUNCTION) { viewModel.appendToken(if (inv) "asin(" else "sin(") },
            Triple(if (inv) "cos⁻¹" else "cos", KeyVariant.FUNCTION) { viewModel.appendToken(if (inv) "acos(" else "cos(") },
            Triple(if (inv) "tan⁻¹" else "tan", KeyVariant.FUNCTION) { viewModel.appendToken(if (inv) "atan(" else "tan(") }
        ),
        listOf(
            Triple("√", KeyVariant.FUNCTION) { viewModel.appendToken("sqrt(") },
            Triple("x²", KeyVariant.FUNCTION) { viewModel.appendToken("^2") },
            Triple("x³", KeyVariant.FUNCTION) { viewModel.appendToken("^3") },
            Triple("xʸ", KeyVariant.FUNCTION) { viewModel.appendOperator("^") },
            Triple("n!", KeyVariant.FUNCTION) { viewModel.appendToken("!") }
        ),
        listOf(
            Triple("log", KeyVariant.FUNCTION) { viewModel.appendToken("log(") },
            Triple("ln", KeyVariant.FUNCTION) { viewModel.appendToken("ln(") },
            Triple("π", KeyVariant.FUNCTION) { viewModel.appendToken("π") },
            Triple("e", KeyVariant.FUNCTION) { viewModel.appendToken("e") },
            Triple("10ˣ", KeyVariant.FUNCTION) { viewModel.appendToken("10^") }
        )
    )

    val mainRows = listOf(
        listOf(
            Triple("AC", KeyVariant.ACTION_CLEAR) { viewModel.clearAll() },
            Triple("( )", KeyVariant.FUNCTION) { viewModel.appendSmartParenthesis() },
            Triple("%", KeyVariant.FUNCTION) { viewModel.appendToken("%") },
            Triple("DEL", KeyVariant.ACTION_CLEAR) { viewModel.deleteLast() },
            Triple("÷", KeyVariant.OPERATOR) { viewModel.appendOperator("÷") }
        ),
        listOf(
            Triple("7", KeyVariant.NUMBER) { viewModel.appendToken("7") },
            Triple("8", KeyVariant.NUMBER) { viewModel.appendToken("8") },
            Triple("9", KeyVariant.NUMBER) { viewModel.appendToken("9") },
            Triple("+/-", KeyVariant.FUNCTION) { viewModel.toggleSign() },
            Triple("×", KeyVariant.OPERATOR) { viewModel.appendOperator("×") }
        ),
        listOf(
            Triple("4", KeyVariant.NUMBER) { viewModel.appendToken("4") },
            Triple("5", KeyVariant.NUMBER) { viewModel.appendToken("5") },
            Triple("6", KeyVariant.NUMBER) { viewModel.appendToken("6") },
            Triple("(", KeyVariant.FUNCTION) { viewModel.appendToken("(") },
            Triple("−", KeyVariant.OPERATOR) { viewModel.appendOperator("-") }
        ),
        listOf(
            Triple("1", KeyVariant.NUMBER) { viewModel.appendToken("1") },
            Triple("2", KeyVariant.NUMBER) { viewModel.appendToken("2") },
            Triple("3", KeyVariant.NUMBER) { viewModel.appendToken("3") },
            Triple(")", KeyVariant.FUNCTION) { viewModel.appendToken(")") },
            Triple("+", KeyVariant.OPERATOR) { viewModel.appendOperator("+") }
        ),
        listOf(
            Triple("0", KeyVariant.NUMBER) { viewModel.appendToken("0") },
            Triple(".", KeyVariant.NUMBER) { viewModel.appendDecimal() },
            Triple("EE", KeyVariant.FUNCTION) { viewModel.appendToken("E") },
            Triple("MR", KeyVariant.FUNCTION) { viewModel.memoryRecall() },
            Triple("=", KeyVariant.EQUALS) { viewModel.evaluate(isScientific = true, onTriggerInterstitial) }
        )
    )

    if (isLandscape) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            CalculatorDisplay(
                expression = uiState.expression,
                livePreview = uiState.livePreview,
                errorMessage = uiState.errorMessage,
                angleLabel = settings.angleUnit.name,
                hasMemory = settings.hasMemoryValue,
                modifier = Modifier
                    .weight(0.35f)
                    .fillMaxHeight()
            )
            Column(
                modifier = Modifier
                    .weight(0.65f)
                    .fillMaxHeight(),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                (sciRows + mainRows).forEach { row ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        row.forEach { (label, variant, action) ->
                            CalcKey(
                                label = label,
                                variant = variant,
                                fontSize = 15.sp,
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight(),
                                onFeedback = feedback,
                                onClick = action
                            )
                        }
                    }
                }
            }
        }
    } else {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            CalculatorDisplay(
                expression = uiState.expression,
                livePreview = uiState.livePreview,
                errorMessage = uiState.errorMessage,
                angleLabel = settings.angleUnit.name,
                hasMemory = settings.hasMemoryValue
            )

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                (sciRows + mainRows).forEach { row ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        row.forEach { (label, variant, action) ->
                            CalcKey(
                                label = label,
                                variant = variant,
                                fontSize = if (label.length > 3) 13.sp else 16.sp,
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight(),
                                onFeedback = feedback,
                                onClick = action
                            )
                        }
                    }
                }
            }
        }
    }
}
