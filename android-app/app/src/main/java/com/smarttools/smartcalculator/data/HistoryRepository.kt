package com.smarttools.smartcalculator.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.UUID

data class CalculationHistoryItem(
    val id: String = UUID.randomUUID().toString(),
    val expression: String,
    val result: String,
    val timestampMillis: Long = System.currentTimeMillis(),
    val isScientific: Boolean = false
)

/**
 * Private internal-storage calculation history store.
 * Never exposes calculation logs to external storage or cloud backup.
 */
class HistoryRepository(private val context: Context) {

    private val historyFile: File
        get() = File(context.filesDir, "calculation_history.json")

    private val _history = MutableStateFlow<List<CalculationHistoryItem>>(emptyList())
    val history: StateFlow<List<CalculationHistoryItem>> = _history.asStateFlow()

    suspend fun load() = withContext(Dispatchers.IO) {
        if (!historyFile.exists()) {
            _history.value = emptyList()
            return@withContext
        }
        val items = runCatching {
            val array = JSONArray(historyFile.readText())
            buildList {
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    add(
                        CalculationHistoryItem(
                            id = obj.getString("id"),
                            expression = obj.getString("expression"),
                            result = obj.getString("result"),
                            timestampMillis = obj.getLong("timestampMillis"),
                            isScientific = obj.optBoolean("isScientific", false)
                        )
                    )
                }
            }
        }.getOrDefault(emptyList())
        _history.value = items
    }

    suspend fun addItem(item: CalculationHistoryItem) {
        val updated = listOf(item) + _history.value
        _history.value = updated.take(250)
        persist(_history.value)
    }

    suspend fun deleteItem(id: String) {
        val updated = _history.value.filterNot { it.id == id }
        _history.value = updated
        persist(updated)
    }

    suspend fun clearAll() {
        _history.value = emptyList()
        withContext(Dispatchers.IO) {
            if (historyFile.exists()) historyFile.delete()
        }
    }

    private suspend fun persist(items: List<CalculationHistoryItem>) = withContext(Dispatchers.IO) {
        val array = JSONArray()
        items.forEach { item ->
            array.put(
                JSONObject().apply {
                    put("id", item.id)
                    put("expression", item.expression)
                    put("result", item.result)
                    put("timestampMillis", item.timestampMillis)
                    put("isScientific", item.isScientific)
                }
            )
        }
        historyFile.writeText(array.toString())
    }
}
