package com.smarttools.smartcalculator.ui

import android.app.Application
import android.media.AudioManager
import android.view.HapticFeedbackConstants
import android.view.View
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.smarttools.smartcalculator.data.CalculationHistoryItem
import com.smarttools.smartcalculator.data.HistoryRepository
import com.smarttools.smartcalculator.data.SettingsRepository
import com.smarttools.smartcalculator.data.ThemeMode
import com.smarttools.smartcalculator.data.UserSettings
import com.smarttools.smartcalculator.engine.AngleUnit
import com.smarttools.smartcalculator.engine.CalculatorEngine
import com.smarttools.smartcalculator.engine.EvaluationResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CalculatorUiState(
    val expression: String = "",
    val livePreview: String = "",
    val errorMessage: String? = null,
    val justEvaluated: Boolean = false,
    val isInverseTrig: Boolean = false,
    val calculationCount: Int = 0
)

class CalculatorViewModel(application: Application) : AndroidViewModel(application) {

    private val settingsRepo = SettingsRepository(application)
    private val historyRepo = HistoryRepository(application)

    val settings: StateFlow<UserSettings> = settingsRepo.settingsFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, UserSettings())

    val history: StateFlow<List<CalculationHistoryItem>> = historyRepo.history

    private val _uiState = MutableStateFlow(CalculatorUiState())
    val uiState: StateFlow<CalculatorUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            historyRepo.load()
        }
    }

    fun triggerFeedback(view: View?) {
        val current = settings.value
        if (current.vibrationEnabled && view != null) {
            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
        }
        if (current.buttonSoundEnabled && view != null) {
            val audioManager = view.context.getSystemService(AudioManager::class.java)
            audioManager?.playSoundEffect(AudioManager.FX_KEY_CLICK, 0.5f)
        }
    }

    fun appendToken(token: String) {
        _uiState.update { state ->
            val startsFresh = state.justEvaluated && token.firstOrNull()?.let { it.isDigit() || it == '(' || it == 'π' || it == 'e' || it == '√' || it.isLetter() } == true
            val base = if (startsFresh) "" else state.expression
            val nextExpr = base + token
            recomputePreview(state.copy(expression = nextExpr, errorMessage = null, justEvaluated = false))
        }
    }

    fun appendOperator(op: String) {
        _uiState.update { state ->
            if (state.expression.isEmpty() && op != "-") return@update state
            val expr = state.expression
            val last = expr.lastOrNull()
            val operators = setOf('+', '-', '×', '÷', '^')
            val nextExpr = if (last != null && last in operators) {
                expr.dropLast(1) + op
            } else {
                expr + op
            }
            recomputePreview(state.copy(expression = nextExpr, errorMessage = null, justEvaluated = false))
        }
    }

    fun appendDecimal() {
        _uiState.update { state ->
            val expr = if (state.justEvaluated) "" else state.expression
            val segment = expr.takeLastWhile { it.isDigit() || it == '.' }
            if (segment.contains('.')) return@update state
            val prefix = if (segment.isEmpty()) "0." else "."
            recomputePreview(state.copy(expression = expr + prefix, errorMessage = null, justEvaluated = false))
        }
    }

    fun toggleSign() {
        _uiState.update { state ->
            val expr = state.expression
            if (expr.isEmpty()) {
                return@update state.copy(expression = "-", errorMessage = null)
            }
            val nextExpr = if (expr.startsWith("-(") && expr.endsWith(")")) {
                expr.substring(2, expr.length - 1)
            } else if (expr.startsWith("-") && expr.drop(1).all { it.isDigit() || it == '.' }) {
                expr.drop(1)
            } else if (expr.all { it.isDigit() || it == '.' }) {
                "-$expr"
            } else {
                "-($expr)"
            }
            recomputePreview(state.copy(expression = nextExpr, errorMessage = null, justEvaluated = false))
        }
    }

    fun appendSmartParenthesis() {
        _uiState.update { state ->
            val expr = if (state.justEvaluated) "" else state.expression
            val openCount = expr.count { it == '(' }
            val closeCount = expr.count { it == ')' }
            val last = expr.lastOrNull()
            val token = if (openCount > closeCount && last != null && (last.isDigit() || last == ')' || last == 'π' || last == 'e' || last == '!' || last == '%')) {
                ")"
            } else {
                "("
            }
            recomputePreview(state.copy(expression = expr + token, errorMessage = null, justEvaluated = false))
        }
    }

    fun clearAll() {
        _uiState.update {
            it.copy(expression = "", livePreview = "", errorMessage = null, justEvaluated = false)
        }
    }

    fun deleteLast() {
        _uiState.update { state ->
            if (state.expression.isEmpty()) return@update state
            val functions = listOf("asin(", "acos(", "atan(", "sqrt(", "sin(", "cos(", "tan(", "log(", "ln(")
            val matchedFn = functions.firstOrNull { state.expression.endsWith(it) }
            val nextExpr = if (matchedFn != null) {
                state.expression.dropLast(matchedFn.length)
            } else {
                state.expression.dropLast(1)
            }
            recomputePreview(state.copy(expression = nextExpr, errorMessage = null, justEvaluated = false))
        }
    }

    fun evaluate(isScientific: Boolean, onInterstitialTrigger: () -> Unit = {}) {
        val currentExpr = _uiState.value.expression.trim()
        if (currentExpr.isEmpty()) return

        val s = settings.value
        when (val result = CalculatorEngine.evaluate(currentExpr, s.angleUnit, s.decimalPrecision, s.thousandsSeparatorEnabled)) {
            is EvaluationResult.Success -> {
                val rawFormatted = CalculatorEngine.formatNumber(result.value, s.decimalPrecision, useThousandsSeparator = false)
                _uiState.update {
                    val nextCount = it.calculationCount + 1
                    if (nextCount % 12 == 0) onInterstitialTrigger()
                    it.copy(
                        expression = rawFormatted,
                        livePreview = result.formatted,
                        errorMessage = null,
                        justEvaluated = true,
                        calculationCount = nextCount
                    )
                }
                viewModelScope.launch {
                    historyRepo.addItem(
                        CalculationHistoryItem(
                            expression = currentExpr,
                            result = result.formatted,
                            isScientific = isScientific
                        )
                    )
                }
            }
            is EvaluationResult.Error -> {
                _uiState.update { it.copy(errorMessage = result.message, livePreview = "") }
            }
        }
    }

    fun toggleInverseTrig() {
        _uiState.update { it.copy(isInverseTrig = !it.isInverseTrig) }
    }

    fun toggleAngleUnit() {
        val next = if (settings.value.angleUnit == AngleUnit.DEG) AngleUnit.RAD else AngleUnit.DEG
        viewModelScope.launch {
            settingsRepo.setAngleUnit(next)
            _uiState.update { recomputePreview(it, overrideAngleUnit = next) }
        }
    }

    fun memoryClear() {
        viewModelScope.launch { settingsRepo.setMemory(0.0, false) }
    }

    fun memoryRecall() {
        val s = settings.value
        if (!s.hasMemoryValue) return
        val formatted = CalculatorEngine.formatNumber(s.memoryValue, s.decimalPrecision, useThousandsSeparator = false)
        appendToken(formatted)
    }

    fun memoryAdd(subtract: Boolean = false) {
        val expr = _uiState.value.expression.ifEmpty { "0" }
        val s = settings.value
        val eval = CalculatorEngine.evaluate(expr, s.angleUnit, s.decimalPrecision, false)
        if (eval is EvaluationResult.Success) {
            val delta = if (subtract) -eval.value else eval.value
            viewModelScope.launch {
                settingsRepo.setMemory(s.memoryValue + delta, true)
            }
        }
    }

    fun loadFromHistory(valueOrExpr: String) {
        _uiState.update {
            recomputePreview(it.copy(expression = valueOrExpr.replace(",", ""), errorMessage = null, justEvaluated = false))
        }
    }

    fun deleteHistoryItem(id: String) {
        viewModelScope.launch { historyRepo.deleteItem(id) }
    }

    fun clearHistory() {
        viewModelScope.launch { historyRepo.clearAll() }
    }

    fun setThemeMode(mode: ThemeMode) = viewModelScope.launch { settingsRepo.setThemeMode(mode) }
    fun setButtonSound(enabled: Boolean) = viewModelScope.launch { settingsRepo.setButtonSound(enabled) }
    fun setVibration(enabled: Boolean) = viewModelScope.launch { settingsRepo.setVibration(enabled) }
    fun setDecimalPrecision(precision: Int) = viewModelScope.launch {
        settingsRepo.setDecimalPrecision(precision)
        _uiState.update { recomputePreview(it, overridePrecision = precision) }
    }
    fun setThousandsSeparator(enabled: Boolean) = viewModelScope.launch {
        settingsRepo.setThousandsSeparator(enabled)
        _uiState.update { recomputePreview(it, overrideThousands = enabled) }
    }
    fun setAdsEnabled(enabled: Boolean) = viewModelScope.launch { settingsRepo.setAdsEnabled(enabled) }

    private fun recomputePreview(
        state: CalculatorUiState,
        overrideAngleUnit: AngleUnit? = null,
        overridePrecision: Int? = null,
        overrideThousands: Boolean? = null
    ): CalculatorUiState {
        if (state.expression.isBlank()) return state.copy(livePreview = "")
        val s = settings.value
        val result = CalculatorEngine.evaluate(
            state.expression,
            overrideAngleUnit ?: s.angleUnit,
            overridePrecision ?: s.decimalPrecision,
            overrideThousands ?: s.thousandsSeparatorEnabled
        )
        return when (result) {
            is EvaluationResult.Success -> state.copy(livePreview = result.formatted)
            is EvaluationResult.Error -> state.copy(livePreview = "")
        }
    }
}
