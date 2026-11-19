package com.smarttools.smartcalculator.data

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.doublePreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.smarttools.smartcalculator.engine.AngleUnit
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "smart_calculator_prefs")

enum class ThemeMode {
    SYSTEM, DARK, LIGHT
}

data class UserSettings(
    val themeMode: ThemeMode = ThemeMode.SYSTEM,
    val buttonSoundEnabled: Boolean = true,
    val vibrationEnabled: Boolean = true,
    val decimalPrecision: Int = 8,
    val thousandsSeparatorEnabled: Boolean = true,
    val angleUnit: AngleUnit = AngleUnit.DEG,
    val memoryValue: Double = 0.0,
    val hasMemoryValue: Boolean = false,
    val adsEnabled: Boolean = true
)

class SettingsRepository(private val context: Context) {

    private object Keys {
        val THEME_MODE = stringPreferencesKey("theme_mode")
        val BUTTON_SOUND = booleanPreferencesKey("button_sound")
        val VIBRATION = booleanPreferencesKey("vibration")
        val DECIMAL_PRECISION = intPreferencesKey("decimal_precision")
        val THOUSANDS_SEPARATOR = booleanPreferencesKey("thousands_separator")
        val ANGLE_UNIT = stringPreferencesKey("angle_unit")
        val MEMORY_VALUE = doublePreferencesKey("memory_value")
        val HAS_MEMORY = booleanPreferencesKey("has_memory")
        val ADS_ENABLED = booleanPreferencesKey("ads_enabled")
    }

    val settingsFlow: Flow<UserSettings> = context.dataStore.data.map { prefs ->
        UserSettings(
            themeMode = runCatching {
                ThemeMode.valueOf(prefs[Keys.THEME_MODE] ?: ThemeMode.SYSTEM.name)
            }.getOrDefault(ThemeMode.SYSTEM),
            buttonSoundEnabled = prefs[Keys.BUTTON_SOUND] ?: true,
            vibrationEnabled = prefs[Keys.VIBRATION] ?: true,
            decimalPrecision = (prefs[Keys.DECIMAL_PRECISION] ?: 8).coerceIn(0, 10),
            thousandsSeparatorEnabled = prefs[Keys.THOUSANDS_SEPARATOR] ?: true,
            angleUnit = runCatching {
                AngleUnit.valueOf(prefs[Keys.ANGLE_UNIT] ?: AngleUnit.DEG.name)
            }.getOrDefault(AngleUnit.DEG),
            memoryValue = prefs[Keys.MEMORY_VALUE] ?: 0.0,
            hasMemoryValue = prefs[Keys.HAS_MEMORY] ?: false,
            adsEnabled = prefs[Keys.ADS_ENABLED] ?: true
        )
    }

    suspend fun setThemeMode(mode: ThemeMode) {
        context.dataStore.edit { it[Keys.THEME_MODE] = mode.name }
    }

    suspend fun setButtonSound(enabled: Boolean) {
        context.dataStore.edit { it[Keys.BUTTON_SOUND] = enabled }
    }

    suspend fun setVibration(enabled: Boolean) {
        context.dataStore.edit { it[Keys.VIBRATION] = enabled }
    }

    suspend fun setDecimalPrecision(precision: Int) {
        context.dataStore.edit { it[Keys.DECIMAL_PRECISION] = precision.coerceIn(0, 10) }
    }

    suspend fun setThousandsSeparator(enabled: Boolean) {
        context.dataStore.edit { it[Keys.THOUSANDS_SEPARATOR] = enabled }
    }

    suspend fun setAngleUnit(unit: AngleUnit) {
        context.dataStore.edit { it[Keys.ANGLE_UNIT] = unit.name }
    }

    suspend fun setMemory(value: Double, hasValue: Boolean) {
        context.dataStore.edit {
            it[Keys.MEMORY_VALUE] = value
            it[Keys.HAS_MEMORY] = hasValue
        }
    }

    suspend fun setAdsEnabled(enabled: Boolean) {
        context.dataStore.edit { it[Keys.ADS_ENABLED] = enabled }
    }
}
