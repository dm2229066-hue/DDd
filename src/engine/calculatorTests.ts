import { AngleUnit, evaluateExpression, formatNumber } from './calculatorEngine';

export interface TestCase {
  id: string;
  category: 'Basic & BODMAS' | 'Decimals & Formatting' | 'Scientific' | 'Edge Cases & Errors';
  name: string;
  expression: string;
  angleUnit?: AngleUnit;
  precision?: number;
  thousands?: boolean;
  expectedSuccess: boolean;
  expectedOutput: string;
}

export interface TestExecutionResult extends TestCase {
  passed: boolean;
  actualOutput: string;
  durationMs: number;
}

export const CALCULATOR_TEST_CASES: TestCase[] = [
  {
    id: 'bodmas-1',
    category: 'Basic & BODMAS',
    name: 'Operator precedence (multiplication before addition)',
    expression: '2 + 3 × 4',
    expectedSuccess: true,
    expectedOutput: '14',
  },
  {
    id: 'bodmas-2',
    category: 'Basic & BODMAS',
    name: 'Parentheses override precedence',
    expression: '(2 + 3) × 4',
    expectedSuccess: true,
    expectedOutput: '20',
  },
  {
    id: 'bodmas-3',
    category: 'Basic & BODMAS',
    name: 'Nested brackets with division and exponents',
    expression: '((12 + 8) ÷ 4) × (3 + 2^2)',
    expectedSuccess: true,
    expectedOutput: '35',
  },
  {
    id: 'bodmas-4',
    category: 'Basic & BODMAS',
    name: 'Implicit multiplication with brackets',
    expression: '3(4 + 5) − 2(1 + 2)',
    expectedSuccess: true,
    expectedOutput: '21',
  },
  {
    id: 'bodmas-5',
    category: 'Basic & BODMAS',
    name: 'Negative unary prefix evaluation',
    expression: '-15 + 42 × 2',
    expectedSuccess: true,
    expectedOutput: '69',
  },
  {
    id: 'dec-1',
    category: 'Decimals & Formatting',
    name: 'Floating point precision stabilization (0.1 + 0.2)',
    expression: '0.1 + 0.2',
    expectedSuccess: true,
    expectedOutput: '0.3',
  },
  {
    id: 'dec-2',
    category: 'Decimals & Formatting',
    name: 'Thousands separator grouping',
    expression: '12345.678 × 100',
    thousands: true,
    expectedSuccess: true,
    expectedOutput: '1,234,567.8',
  },
  {
    id: 'dec-3',
    category: 'Decimals & Formatting',
    name: 'Custom decimal precision rounding (2 digits)',
    expression: '22 ÷ 7',
    precision: 2,
    expectedSuccess: true,
    expectedOutput: '3.14',
  },
  {
    id: 'dec-4',
    category: 'Decimals & Formatting',
    name: 'Percentage calculation',
    expression: '250 × 20%',
    expectedSuccess: true,
    expectedOutput: '50',
  },
  {
    id: 'dec-5',
    category: 'Decimals & Formatting',
    name: 'Scientific notation for extreme magnitudes',
    expression: '10^15 × 2.5',
    expectedSuccess: true,
    expectedOutput: '2.5E+15',
  },
  {
    id: 'sci-1',
    category: 'Scientific',
    name: 'Sine in Degree mode: sin(30°)',
    expression: 'sin(30)',
    angleUnit: 'DEG',
    expectedSuccess: true,
    expectedOutput: '0.5',
  },
  {
    id: 'sci-2',
    category: 'Scientific',
    name: 'Cosine in Radian mode: cos(π)',
    expression: 'cos(π)',
    angleUnit: 'RAD',
    expectedSuccess: true,
    expectedOutput: '-1',
  },
  {
    id: 'sci-3',
    category: 'Scientific',
    name: 'Inverse sine in Degree mode: sin⁻¹(0.5)',
    expression: 'asin(0.5)',
    angleUnit: 'DEG',
    expectedSuccess: true,
    expectedOutput: '30',
  },
  {
    id: 'sci-4',
    category: 'Scientific',
    name: 'Base-10 logarithm & natural log',
    expression: 'log(1000) + ln(e)',
    expectedSuccess: true,
    expectedOutput: '4',
  },
  {
    id: 'sci-5',
    category: 'Scientific',
    name: 'Square root, cube & power',
    expression: '√(144) + 2^3',
    expectedSuccess: true,
    expectedOutput: '20',
  },
  {
    id: 'sci-6',
    category: 'Scientific',
    name: 'Factorial (5! + 0!)',
    expression: '5! + 0!',
    expectedSuccess: true,
    expectedOutput: '121',
  },
  {
    id: 'err-1',
    category: 'Edge Cases & Errors',
    name: 'Division by zero protection',
    expression: '42 ÷ 0',
    expectedSuccess: false,
    expectedOutput: 'Cannot divide by zero',
  },
  {
    id: 'err-2',
    category: 'Edge Cases & Errors',
    name: 'Negative square root domain check',
    expression: '√(-9)',
    expectedSuccess: false,
    expectedOutput: 'Domain error',
  },
  {
    id: 'err-3',
    category: 'Edge Cases & Errors',
    name: 'Logarithm of zero protection',
    expression: 'log(0)',
    expectedSuccess: false,
    expectedOutput: 'Domain error',
  },
  {
    id: 'err-4',
    category: 'Edge Cases & Errors',
    name: 'Inverse trig out-of-domain protection',
    expression: 'asin(2)',
    expectedSuccess: false,
    expectedOutput: 'Domain error',
  },
  {
    id: 'err-5',
    category: 'Edge Cases & Errors',
    name: 'Negative factorial domain protection',
    expression: '(-3)!',
    expectedSuccess: false,
    expectedOutput: 'Factorial requires non-negative integer',
  },
  {
    id: 'err-6',
    category: 'Edge Cases & Errors',
    name: 'Undefined tan(90°) protection',
    expression: 'tan(90)',
    angleUnit: 'DEG',
    expectedSuccess: false,
    expectedOutput: 'Undefined tangent',
  },
];

export function runCalculatorTestSuite(): TestExecutionResult[] {
  return CALCULATOR_TEST_CASES.map((tc) => {
    const start = performance.now();
    const res = evaluateExpression(
      tc.expression,
      tc.angleUnit ?? 'DEG',
      tc.precision ?? 8,
      tc.thousands ?? true
    );
    const durationMs = Number((performance.now() - start).toFixed(3));

    if (res.ok) {
      const actual = res.formatted;
      return {
        ...tc,
        passed: tc.expectedSuccess && actual === tc.expectedOutput,
        actualOutput: actual,
        durationMs,
      };
    } else {
      return {
        ...tc,
        passed: !tc.expectedSuccess && res.message === tc.expectedOutput,
        actualOutput: res.message,
        durationMs,
      };
    }
  });
}

export { formatNumber };
