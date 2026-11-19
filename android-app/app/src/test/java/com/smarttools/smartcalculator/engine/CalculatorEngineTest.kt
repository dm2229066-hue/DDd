package com.smarttools.smartcalculator.engine

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class CalculatorEngineTest {

    private fun assertSuccess(expr: String, expected: String, angleUnit: AngleUnit = AngleUnit.DEG, precision: Int = 8) {
        val result = CalculatorEngine.evaluate(expr, angleUnit, precision, useThousandsSeparator = true)
        assertTrue("Expected success for '$expr', got $result", result is EvaluationResult.Success)
        assertEquals(expected, (result as EvaluationResult.Success).formatted)
    }

    private fun assertError(expr: String, expectedMessage: String? = null) {
        val result = CalculatorEngine.evaluate(expr)
        assertTrue("Expected error for '$expr', got $result", result is EvaluationResult.Error)
        if (expectedMessage != null) {
            assertEquals(expectedMessage, (result as EvaluationResult.Error).message)
        }
    }

    @Test
    fun `basic arithmetic and BODMAS precedence`() {
        assertSuccess("2 + 3 × 4", "14")
        assertSuccess("(2 + 3) × 4", "20")
        assertSuccess("100 - 25 ÷ 5 + 3^2", "104")
        assertSuccess("((12 + 8) ÷ 4) × (3 + 2)", "25")
    }

    @Test
    fun `decimal and percentage calculations`() {
        assertSuccess("0.1 + 0.2", "0.3")
        assertSuccess("1234.5678 × 10", "12,345.678")
        assertSuccess("250 × 20%", "50")
    }

    @Test
    fun `scientific trigonometry in DEG and RAD`() {
        assertSuccess("sin(30)", "0.5", AngleUnit.DEG)
        assertSuccess("cos(60)", "0.5", AngleUnit.DEG)
        assertSuccess("tan(45)", "1", AngleUnit.DEG)
        assertSuccess("asin(0.5)", "30", AngleUnit.DEG)
        assertSuccess("cos(π)", "-1", AngleUnit.RAD)
        assertSuccess("sin(π ÷ 2)", "1", AngleUnit.RAD)
    }

    @Test
    fun `logarithms powers roots and factorials`() {
        assertSuccess("√(144)", "12")
        assertSuccess("2^10", "1,024")
        assertSuccess("log(1000)", "3")
        assertSuccess("ln(e)", "1")
        assertSuccess("5!", "120")
        assertSuccess("0!", "1")
    }

    @Test
    fun `division by zero and domain error safety`() {
        assertError("42 ÷ 0", "Cannot divide by zero")
        assertError("√(-9)", "Domain error")
        assertError("log(0)", "Domain error")
        assertError("asin(2)", "Domain error")
        assertError("(-3)!", "Factorial requires non-negative integer")
        assertError("tan(90)", "Undefined tangent")
    }
}
