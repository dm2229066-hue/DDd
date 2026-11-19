export type AngleUnit = 'DEG' | 'RAD';

export type EvaluationResult =
  | { ok: true; value: number; formatted: string }
  | { ok: false; message: string };

type Token =
  | { type: 'number'; value: number }
  | { type: 'operator'; symbol: '+' | '-' | '*' | '/' | '^' }
  | { type: 'function'; name: string }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'factorial' }
  | { type: 'percent' };

const SUPPORTED_FUNCTIONS = new Set([
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'log',
  'ln',
  'sqrt',
]);

export function formatNumber(
  value: number,
  decimalPrecision: number = 8,
  useThousandsSeparator: boolean = true
): string {
  if (Number.isNaN(value)) return 'Domain error';
  if (!Number.isFinite(value)) return 'Overflow';

  const normalized = Math.abs(value) < 1e-13 ? 0 : value;
  const absVal = Math.abs(normalized);

  if (absVal !== 0 && (absVal >= 1e12 || absVal < 1e-7)) {
    const sciPrec = Math.min(8, Math.max(1, decimalPrecision));
    return normalized
      .toExponential(sciPrec)
      .replace(/\.?0+e/, 'e')
      .replace('e', 'E');
  }

  const clamped = Math.min(10, Math.max(0, Math.round(decimalPrecision)));
  const fixed = normalized.toFixed(clamped);
  const trimmed = clamped > 0 ? fixed.replace(/\.?0+$/, '') : fixed;
  const cleanZero = trimmed === '-0' ? '0' : trimmed;

  if (!useThousandsSeparator) return cleanZero;

  const [intPart, decPart] = cleanZero.split('.');
  const isNeg = intPart.startsWith('-');
  const digits = isNeg ? intPart.slice(1) : intPart;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const signed = isNeg ? `-${grouped}` : grouped;

  return decPart !== undefined ? `${signed}.${decPart}` : signed;
}

function tokenize(input: string): Token[] {
  const normalized = input
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')
    .replace(/,/g, '')
    .replace(/\s+/g, '');

  const raw: Token[] = [];
  let i = 0;

  while (i < normalized.length) {
    const ch = normalized[i];

    if ((ch >= '0' && ch <= '9') || ch === '.') {
      const start = i;
      let dots = 0;
      while (i < normalized.length && ((normalized[i] >= '0' && normalized[i] <= '9') || normalized[i] === '.')) {
        if (normalized[i] === '.') dots++;
        if (dots > 1) throw new Error('Invalid decimal');
        i++;
      }
      if (i < normalized.length && (normalized[i] === 'E' || normalized[i] === 'e')) {
        const next = normalized[i + 1];
        if (next && ((next >= '0' && next <= '9') || next === '+' || next === '-')) {
          i++;
          if (normalized[i] === '+' || normalized[i] === '-') i++;
          if (i >= normalized.length || normalized[i] < '0' || normalized[i] > '9') {
            throw new Error('Invalid scientific notation');
          }
          while (i < normalized.length && normalized[i] >= '0' && normalized[i] <= '9') i++;
        }
      }
      const num = Number(normalized.slice(start, i));
      if (Number.isNaN(num)) throw new Error('Invalid number');
      raw.push({ type: 'number', value: num });
    } else if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
      const start = i;
      while (i < normalized.length && /[a-zA-Z0-9]/.test(normalized[i])) i++;
      const word = normalized.slice(start, i).toLowerCase();
      if (word === 'pi') {
        raw.push({ type: 'number', value: Math.PI });
      } else if (word === 'e') {
        raw.push({ type: 'number', value: Math.E });
      } else if (SUPPORTED_FUNCTIONS.has(word)) {
        raw.push({ type: 'function', name: word });
      } else {
        throw new Error(`Unknown symbol: ${word}`);
      }
    } else if (ch === '(') {
      raw.push({ type: 'lparen' });
      i++;
    } else if (ch === ')') {
      raw.push({ type: 'rparen' });
      i++;
    } else if (ch === '!') {
      raw.push({ type: 'factorial' });
      i++;
    } else if (ch === '%') {
      raw.push({ type: 'percent' });
      i++;
    } else if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^') {
      raw.push({ type: 'operator', symbol: ch });
      i++;
    } else {
      throw new Error(`Unexpected character: ${ch}`);
    }
  }

  // Implicit multiplication (e.g., 2π, 3(4+5), (2)(3), 2sin(30))
  const result: Token[] = [];
  for (let idx = 0; idx < raw.length; idx++) {
    const curr = raw[idx];
    if (idx > 0) {
      const prev = raw[idx - 1];
      const prevEndsValue =
        prev.type === 'number' ||
        prev.type === 'rparen' ||
        prev.type === 'factorial' ||
        prev.type === 'percent';
      const currStartsValue =
        curr.type === 'number' || curr.type === 'lparen' || curr.type === 'function';
      if (prevEndsValue && currStartsValue) {
        result.push({ type: 'operator', symbol: '*' });
      }
    }
    result.push(curr);
  }
  return result;
}

class Parser {
  private pos = 0;

  constructor(private readonly tokens: Token[], private readonly angleUnit: AngleUnit) {}

  isAtEnd(): boolean {
    return this.pos >= this.tokens.length;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  parseExpression(): number {
    let left = this.parseTerm();
    while (true) {
      const tok = this.peek();
      if (tok?.type === 'operator' && (tok.symbol === '+' || tok.symbol === '-')) {
        this.consume();
        const right = this.parseTerm();
        left = tok.symbol === '+' ? left + right : left - right;
      } else {
        break;
      }
    }
    return left;
  }

  private parseTerm(): number {
    let left = this.parsePower();
    while (true) {
      const tok = this.peek();
      if (tok?.type === 'operator' && (tok.symbol === '*' || tok.symbol === '/')) {
        this.consume();
        const right = this.parsePower();
        if (tok.symbol === '*') {
          left *= right;
        } else {
          if (Math.abs(right) === 0) throw new Error('Cannot divide by zero');
          left /= right;
        }
      } else {
        break;
      }
    }
    return left;
  }

  private parsePower(): number {
    const base = this.parseUnary();
    const tok = this.peek();
    if (tok?.type === 'operator' && tok.symbol === '^') {
      this.consume();
      const exponent = this.parsePower();
      const res = Math.pow(base, exponent);
      if (Number.isNaN(res)) throw new Error('Domain error');
      return res;
    }
    return base;
  }

  private parseUnary(): number {
    const tok = this.peek();
    if (tok?.type === 'operator' && tok.symbol === '+') {
      this.consume();
      return this.parseUnary();
    }
    if (tok?.type === 'operator' && tok.symbol === '-') {
      this.consume();
      return -this.parseUnary();
    }
    return this.parsePostfix();
  }

  private parsePostfix(): number {
    let val = this.parsePrimary();
    while (true) {
      const tok = this.peek();
      if (tok?.type === 'factorial') {
        this.consume();
        val = this.factorial(val);
      } else if (tok?.type === 'percent') {
        this.consume();
        val /= 100;
      } else {
        break;
      }
    }
    return val;
  }

  private parsePrimary(): number {
    const tok = this.peek();
    if (!tok) throw new Error('Syntax error');

    if (tok.type === 'number') {
      this.consume();
      return tok.value;
    }

    if (tok.type === 'function') {
      this.consume();
      let arg: number;
      if (this.peek()?.type === 'lparen') {
        this.consume();
        arg = this.parseExpression();
        if (this.peek()?.type !== 'rparen') {
          throw new Error('Missing closing bracket');
        }
        this.consume();
      } else {
        arg = this.parseUnary();
      }
      return this.applyFunction(tok.name, arg);
    }

    if (tok.type === 'lparen') {
      this.consume();
      const inner = this.parseExpression();
      if (this.peek()?.type !== 'rparen') {
        throw new Error('Missing closing bracket');
      }
      this.consume();
      return inner;
    }

    throw new Error('Syntax error');
  }

  private applyFunction(name: string, arg: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    switch (name) {
      case 'sqrt':
        if (arg < 0) throw new Error('Domain error');
        return Math.sqrt(arg);
      case 'sin': {
        const rad = this.angleUnit === 'DEG' ? toRad(arg) : arg;
        const res = Math.sin(rad);
        return Math.abs(res) < 1e-14 ? 0 : res;
      }
      case 'cos': {
        const rad = this.angleUnit === 'DEG' ? toRad(arg) : arg;
        const res = Math.cos(rad);
        return Math.abs(res) < 1e-14 ? 0 : res;
      }
      case 'tan': {
        const rad = this.angleUnit === 'DEG' ? toRad(arg) : arg;
        if (Math.abs(Math.cos(rad)) < 1e-14) throw new Error('Undefined tangent');
        const res = Math.tan(rad);
        return Math.abs(res) < 1e-14 ? 0 : res;
      }
      case 'asin': {
        if (arg < -1 || arg > 1) throw new Error('Domain error');
        const rad = Math.asin(arg);
        return this.angleUnit === 'DEG' ? toDeg(rad) : rad;
      }
      case 'acos': {
        if (arg < -1 || arg > 1) throw new Error('Domain error');
        const rad = Math.acos(arg);
        return this.angleUnit === 'DEG' ? toDeg(rad) : rad;
      }
      case 'atan': {
        const rad = Math.atan(arg);
        return this.angleUnit === 'DEG' ? toDeg(rad) : rad;
      }
      case 'log':
        if (arg <= 0) throw new Error('Domain error');
        return Math.log10(arg);
      case 'ln':
        if (arg <= 0) throw new Error('Domain error');
        return Math.log(arg);
      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }

  private factorial(n: number): number {
    if (n < 0 || !Number.isInteger(n)) {
      throw new Error('Factorial requires non-negative integer');
    }
    if (n > 170) {
      throw new Error('Value overflow');
    }
    let acc = 1;
    for (let k = 2; k <= n; k++) acc *= k;
    return acc;
  }
}

export function evaluateExpression(
  expression: string,
  angleUnit: AngleUnit = 'DEG',
  decimalPrecision: number = 8,
  useThousandsSeparator: boolean = true
): EvaluationResult {
  const cleaned = expression.trim();
  if (!cleaned) return { ok: false, message: 'Empty expression' };

  try {
    const tokens = tokenize(cleaned);
    const parser = new Parser(tokens, angleUnit);
    const rawValue = parser.parseExpression();
    if (!parser.isAtEnd()) {
      return { ok: false, message: 'Syntax error' };
    }
    if (Number.isNaN(rawValue)) return { ok: false, message: 'Domain error' };
    if (!Number.isFinite(rawValue)) return { ok: false, message: 'Value overflow' };

    return {
      ok: true,
      value: rawValue,
      formatted: formatNumber(rawValue, decimalPrecision, useThousandsSeparator),
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Syntax error',
    };
  }
}
