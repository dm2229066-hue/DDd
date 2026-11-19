package com.smarttools.smartcalculator.engine

import java.math.BigDecimal
import java.math.RoundingMode
import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.util.Locale
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.acos
import kotlin.math.asin
import kotlin.math.atan
import kotlin.math.cos
import kotlin.math.E
import kotlin.math.floor
import kotlin.math.ln
import kotlin.math.log10
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.math.tan

enum class AngleUnit {
    DEG, RAD
}

sealed interface EvaluationResult {
    data class Success(val value: Double, val formatted: String) : EvaluationResult
    data class Error(val message: String) : EvaluationResult
}

/**
 * Pure Kotlin recursive-descent BODMAS & scientific mathematical evaluator.
 * Handles brackets, implicit multiplication, unary operators, factorial,
 * trigonometry (DEG/RAD), inverse trigonometry, logarithms, roots, and powers.
 */
object CalculatorEngine {

    fun evaluate(
        expression: String,
        angleUnit: AngleUnit = AngleUnit.DEG,
        decimalPrecision: Int = 8,
        useThousandsSeparator: Boolean = true
    ): EvaluationResult {
        val cleaned = expression.trim()
        if (cleaned.isEmpty()) return EvaluationResult.Error("Empty expression")

        return try {
            val tokens = tokenize(cleaned)
            val parser = Parser(tokens, angleUnit)
            val rawValue = parser.parseExpression()
            if (!parser.isAtEnd()) {
                return EvaluationResult.Error("Syntax error")
            }
            if (rawValue.isNaN()) return EvaluationResult.Error("Domain error")
            if (rawValue.isInfinite()) return EvaluationResult.Error("Value overflow")

            val formatted = formatNumber(rawValue, decimalPrecision, useThousandsSeparator)
            EvaluationResult.Success(rawValue, formatted)
        } catch (e: ArithmeticException) {
            EvaluationResult.Error(e.message ?: "Math error")
        } catch (e: IllegalArgumentException) {
            EvaluationResult.Error(e.message ?: "Syntax error")
        }
    }

    fun formatNumber(
        value: Double,
        decimalPrecision: Int = 8,
        useThousandsSeparator: Boolean = true
    ): String {
        if (value.isNaN()) return "Domain error"
        if (value.isInfinite()) return "Overflow"

        val normalized = if (abs(value) < 1e-13) 0.0 else value
        val absVal = abs(normalized)

        // Scientific notation for very large or very small non-zero magnitudes
        if (absVal != 0.0 && (absVal >= 1e12 || absVal < 1e-7)) {
            val sciPrecision = decimalPrecision.coerceIn(1, 8)
            return String.format(Locale.US, "%.${sciPrecision}E", normalized)
                .replace(Regex("0+E"), "E")
                .replace(".E", "E")
        }

        val clampedPrecision = decimalPrecision.coerceIn(0, 10)
        val rounded = BigDecimal.valueOf(normalized)
            .setScale(clampedPrecision, RoundingMode.HALF_UP)
            .stripTrailingZeros()

        val plainString = if (rounded.compareTo(BigDecimal.ZERO) == 0) {
            "0"
        } else {
            rounded.toPlainString()
        }

        if (!useThousandsSeparator) return plainString

        val parts = plainString.split(".")
        val intPart = parts[0]
        val isNegative = intPart.startsWith("-")
        val digits = if (isNegative) intPart.substring(1) else intPart

        val symbols = DecimalFormatSymbols(Locale.US)
        val formatter = DecimalFormat("#,###", symbols)
        val groupedInt = formatter.format(BigDecimal(digits))
        val signedInt = if (isNegative) "-$groupedInt" else groupedInt

        return if (parts.size > 1) "$signedInt.${parts[1]}" else signedInt
    }

    private sealed interface Token {
        data class Number(val value: Double) : Token
        data class Operator(val symbol: String) : Token
        data class Function(val name: String) : Token
        data object LeftParen : Token
        data object RightParen : Token
        data object Factorial : Token
        data object Percent : Token
    }

    private fun tokenize(input: String): List<Token> {
        val normalized = input
            .replace("×", "*")
            .replace("÷", "/")
            .replace("−", "-")
            .replace("π", "pi")
            .replace("√", "sqrt")
            .replace(",", "")
            .replace(" ", "")

        val raw = mutableListOf<Token>()
        var i = 0
        while (i < normalized.length) {
            val ch = normalized[i]
            when {
                ch.isDigit() || ch == '.' -> {
                    val start = i
                    var dotCount = 0
                    while (i < normalized.length && (normalized[i].isDigit() || normalized[i] == '.')) {
                        if (normalized[i] == '.') dotCount++
                        if (dotCount > 1) throw IllegalArgumentException("Invalid decimal")
                        i++
                    }
                    // Support scientific E notation inside numbers like 1.5E-4
                    if (i < normalized.length && (normalized[i] == 'E' || normalized[i] == 'e')) {
                        val nextIdx = i + 1
                        if (nextIdx < normalized.length && (normalized[nextIdx].isDigit() || normalized[nextIdx] == '+' || normalized[nextIdx] == '-')) {
                            i++
                            if (normalized[i] == '+' || normalized[i] == '-') i++
                            if (i >= normalized.length || !normalized[i].isDigit()) {
                                throw IllegalArgumentException("Invalid scientific notation")
                            }
                            while (i < normalized.length && normalized[i].isDigit()) i++
                        }
                    }
                    val numStr = normalized.substring(start, i)
                    val value = numStr.toDoubleOrNull() ?: throw IllegalArgumentException("Invalid number")
                    raw.add(Token.Number(value))
                }
                ch.isLetter() -> {
                    val start = i
                    while (i < normalized.length && (normalized[i].isLetter() || normalized[i].isDigit())) {
                        i++
                    }
                    when (val word = normalized.substring(start, i).lowercase(Locale.US)) {
                        "pi" -> raw.add(Token.Number(PI))
                        "e" -> raw.add(Token.Number(E))
                        "sin", "cos", "tan", "asin", "acos", "atan", "log", "ln", "sqrt" -> {
                            raw.add(Token.Function(word))
                        }
                        else -> throw IllegalArgumentException("Unknown symbol: $word")
                    }
                }
                ch == '(' -> {
                    raw.add(Token.LeftParen)
                    i++
                }
                ch == ')' -> {
                    raw.add(Token.RightParen)
                    i++
                }
                ch == '!' -> {
                    raw.add(Token.Factorial)
                    i++
                }
                ch == '%' -> {
                    raw.add(Token.Percent)
                    i++
                }
                ch in listOf('+', '-', '*', '/', '^') -> {
                    raw.add(Token.Operator(ch.toString()))
                    i++
                }
                else -> throw IllegalArgumentException("Unexpected character: $ch")
            }
        }

        // Insert implicit multiplication where appropriate: e.g. 2pi, 2(3), (2)(3), )sin(30)
        val result = mutableListOf<Token>()
        for (idx in raw.indices) {
            val current = raw[idx]
            if (idx > 0) {
                val prev = raw[idx - 1]
                val prevEndsValue = prev is Token.Number || prev is Token.RightParen || prev is Token.Factorial || prev is Token.Percent
                val currStartsValue = current is Token.Number || current is Token.LeftParen || current is Token.Function
                if (prevEndsValue && currStartsValue) {
                    result.add(Token.Operator("*"))
                }
            }
            result.add(current)
        }
        return result
    }

    private class Parser(
        private val tokens: List<Token>,
        private val angleUnit: AngleUnit
    ) {
        private var pos = 0

        fun isAtEnd(): Boolean = pos >= tokens.size

        private fun peek(): Token? = tokens.getOrNull(pos)

        private fun consume(): Token = tokens[pos++]

        fun parseExpression(): Double {
            var left = parseTerm()
            while (true) {
                val op = (peek() as? Token.Operator)?.symbol
                if (op == "+" || op == "-") {
                    consume()
                    val right = parseTerm()
                    left = if (op == "+") left + right else left - right
                } else {
                    break
                }
            }
            return left
        }

        private fun parseTerm(): Double {
            var left = parsePower()
            while (true) {
                val op = (peek() as? Token.Operator)?.symbol
                if (op == "*" || op == "/") {
                    consume()
                    val right = parsePower()
                    left = if (op == "*") {
                        left * right
                    } else {
                        if (abs(right) == 0.0) throw ArithmeticException("Cannot divide by zero")
                        left / right
                    }
                } else {
                    break
                }
            }
            return left
        }

        private fun parsePower(): Double {
            val base = parseUnary()
            val op = (peek() as? Token.Operator)?.symbol
            return if (op == "^") {
                consume()
                val exponent = parsePower() // Right-associative
                val result = base.pow(exponent)
                if (result.isNaN()) throw ArithmeticException("Domain error")
                result
            } else {
                base
            }
        }

        private fun parseUnary(): Double {
            val op = (peek() as? Token.Operator)?.symbol
            return when (op) {
                "+" -> {
                    consume()
                    parseUnary()
                }
                "-" -> {
                    consume()
                    -parseUnary()
                }
                else -> parsePostfix()
            }
        }

        private fun parsePostfix(): Double {
            var value = parsePrimary()
            while (true) {
                when (peek()) {
                    is Token.Factorial -> {
                        consume()
                        value = factorial(value)
                    }
                    is Token.Percent -> {
                        consume()
                        value /= 100.0
                    }
                    else -> break
                }
            }
            return value
        }

        private fun parsePrimary(): Double {
            return when (val token = peek()) {
                is Token.Number -> {
                    consume()
                    token.value
                }
                is Token.Function -> {
                    consume()
                    val arg = if (peek() is Token.LeftParen) {
                        consume()
                        val inner = parseExpression()
                        if (peek() !is Token.RightParen) {
                            throw IllegalArgumentException("Missing closing bracket")
                        }
                        consume()
                        inner
                    } else {
                        parseUnary()
                    }
                    applyFunction(token.name, arg)
                }
                is Token.LeftParen -> {
                    consume()
                    val inner = parseExpression()
                    if (peek() !is Token.RightParen) {
                        throw IllegalArgumentException("Missing closing bracket")
                    }
                    consume()
                    inner
                }
                else -> throw IllegalArgumentException("Syntax error")
            }
        }

        private fun applyFunction(name: String, arg: Double): Double {
            return when (name) {
                "sqrt" -> {
                    if (arg < 0.0) throw ArithmeticException("Domain error")
                    sqrt(arg)
                }
                "sin" -> {
                    val rad = if (angleUnit == AngleUnit.DEG) Math.toRadians(arg) else arg
                    val res = sin(rad)
                    if (abs(res) < 1e-14) 0.0 else res
                }
                "cos" -> {
                    val rad = if (angleUnit == AngleUnit.DEG) Math.toRadians(arg) else arg
                    val res = cos(rad)
                    if (abs(res) < 1e-14) 0.0 else res
                }
                "tan" -> {
                    val rad = if (angleUnit == AngleUnit.DEG) Math.toRadians(arg) else arg
                    if (abs(cos(rad)) < 1e-14) throw ArithmeticException("Undefined tangent")
                    val res = tan(rad)
                    if (abs(res) < 1e-14) 0.0 else res
                }
                "asin" -> {
                    if (arg < -1.0 || arg > 1.0) throw ArithmeticException("Domain error")
                    val rad = asin(arg)
                    if (angleUnit == AngleUnit.DEG) Math.toDegrees(rad) else rad
                }
                "acos" -> {
                    if (arg < -1.0 || arg > 1.0) throw ArithmeticException("Domain error")
                    val rad = acos(arg)
                    if (angleUnit == AngleUnit.DEG) Math.toDegrees(rad) else rad
                }
                "atan" -> {
                    val rad = atan(arg)
                    if (angleUnit == AngleUnit.DEG) Math.toDegrees(rad) else rad
                }
                "log" -> {
                    if (arg <= 0.0) throw ArithmeticException("Domain error")
                    log10(arg)
                }
                "ln" -> {
                    if (arg <= 0.0) throw ArithmeticException("Domain error")
                    ln(arg)
                }
                else -> throw IllegalArgumentException("Unknown function: $name")
            }
        }

        private fun factorial(n: Double): Double {
            if (n < 0.0 || n != floor(n)) {
                throw ArithmeticException("Factorial requires non-negative integer")
            }
            if (n > 170.0) {
                throw ArithmeticException("Value overflow")
            }
            var acc = 1.0
            for (k in 2..n.toInt()) {
                acc *= k.toDouble()
            }
            return acc
        }
    }
}
