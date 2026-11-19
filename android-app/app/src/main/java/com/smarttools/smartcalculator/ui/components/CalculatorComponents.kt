package com.smarttools.smartcalculator.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class KeyVariant {
    NUMBER, OPERATOR, FUNCTION, ACTION_CLEAR, EQUALS
}

@Composable
fun CalculatorDisplay(
    expression: String,
    livePreview: String,
    errorMessage: String?,
    angleLabel: String?,
    hasMemory: Boolean,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 18.dp),
            horizontalAlignment = Alignment.End
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = listOfNotNull(
                        angleLabel,
                        if (hasMemory) "M" else null
                    ).joinToString(" · "),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(scrollState, reverseScrolling = true),
                contentAlignment = Alignment.CenterEnd
            ) {
                Text(
                    text = expression.ifEmpty { "0" },
                    style = MaterialTheme.typography.displayLarge.copy(
                        fontSize = if (expression.length > 14) 30.sp else 42.sp
                    ),
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    textAlign = TextAlign.End
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = errorMessage ?: livePreview,
                style = MaterialTheme.typography.headlineMedium.copy(fontSize = 22.sp),
                color = if (errorMessage != null) {
                    MaterialTheme.colorScheme.error
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant
                },
                maxLines = 1
            )
        }
    }
}

@Composable
fun MemoryBar(
    hasMemory: Boolean,
    onMc: () -> Unit,
    onMr: () -> Unit,
    onMPlus: () -> Unit,
    onMMinus: () -> Unit,
    onFeedback: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        listOf(
            Triple("MC", hasMemory, onMc),
            Triple("MR", hasMemory, onMr),
            Triple("M+", true, onMPlus),
            Triple("M-", true, onMMinus)
        ).forEach { (label, enabled, action) ->
            Surface(
                modifier = Modifier
                    .weight(1f)
                    .height(38.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .clickable(enabled = enabled) {
                        onFeedback()
                        action()
                    },
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = if (enabled) 0.7f else 0.3f),
                shape = RoundedCornerShape(12.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = label,
                        style = MaterialTheme.typography.labelMedium,
                        color = if (enabled) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                    )
                }
            }
        }
    }
}

@Composable
fun CalcKey(
    label: String,
    variant: KeyVariant = KeyVariant.NUMBER,
    fontSize: TextUnit = 20.sp,
    modifier: Modifier = Modifier,
    onFeedback: () -> Unit,
    onClick: () -> Unit
) {
    val view = LocalView.current
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.94f else 1f,
        animationSpec = tween(durationMillis = 100),
        label = "keyScale"
    )

    val containerColor = when (variant) {
        KeyVariant.NUMBER -> MaterialTheme.colorScheme.surface
        KeyVariant.FUNCTION -> MaterialTheme.colorScheme.surfaceVariant
        KeyVariant.OPERATOR -> MaterialTheme.colorScheme.secondary.copy(alpha = 0.16f)
        KeyVariant.ACTION_CLEAR -> MaterialTheme.colorScheme.error.copy(alpha = 0.14f)
        KeyVariant.EQUALS -> MaterialTheme.colorScheme.primary
    }

    val contentColor = when (variant) {
        KeyVariant.NUMBER -> MaterialTheme.colorScheme.onSurface
        KeyVariant.FUNCTION -> MaterialTheme.colorScheme.onSurface
        KeyVariant.OPERATOR -> MaterialTheme.colorScheme.secondary
        KeyVariant.ACTION_CLEAR -> MaterialTheme.colorScheme.error
        KeyVariant.EQUALS -> MaterialTheme.colorScheme.onPrimary
    }

    val backgroundModifier = if (variant == KeyVariant.EQUALS) {
        Modifier.background(
            Brush.linearGradient(
                listOf(Color(0xFFF59E0B), Color(0xFFD97706))
            )
        )
    } else {
        Modifier.background(containerColor)
    }

    Box(
        modifier = modifier
            .scale(scale)
            .clip(RoundedCornerShape(18.dp))
            .then(backgroundModifier)
            .clickable(
                interactionSource = interactionSource,
                indication = null
            ) {
                onFeedback()
                onClick()
            },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            fontSize = fontSize,
            fontWeight = FontWeight.SemiBold,
            color = contentColor,
            maxLines = 1
        )
    }
}
