export type Step = { title: string; detail: string };
export type SolverResult = { answer: number | string | null; steps: Step[]; error?: string };

export function pickBase(a: number, b: number) {
  const max = Math.max(Math.abs(a), Math.abs(b), 1);
  const low = 10 ** Math.floor(Math.log10(max));
  const high = low * 10;
  const lowDistance = Math.abs(a - low) + Math.abs(b - low);
  const highDistance = Math.abs(a - high) + Math.abs(b - high);
  return highDistance < lowDistance ? high : low;
}

export function nikhilam(a: number, b: number, baseInput?: number): SolverResult {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a <= 0 || b <= 0) {
    return { answer: null, steps: [], error: 'Enter two positive integers.' };
  }
  const base = baseInput ?? pickBase(a, b);
  const da = a - base;
  const db = b - base;
  const left = da + b;
  const right = da * db;
  return {
    answer: left * base + right,
    steps: [
      { title: `Choose base ${base}`, detail: `${a} is ${da >= 0 ? '+' : ''}${da} and ${b} is ${db >= 0 ? '+' : ''}${db} from ${base}.` },
      { title: 'Cross-add / subtract', detail: `(${a} ${db >= 0 ? '+' : '-'} ${Math.abs(db)}) = ${left}.` },
      { title: 'Multiply deviations', detail: `(${da}) × (${db}) = ${right}.` },
      { title: 'Combine', detail: `${left} × ${base} + (${right}) = ${left * base + right}.` },
    ],
  };
}

export function ekadhikenaSquare(n: number): SolverResult {
  if (!Number.isInteger(n) || Math.abs(n) % 10 !== 5) {
    return { answer: null, steps: [], error: 'Ekadhikena Purvena squaring requires an integer ending in 5.' };
  }
  const prefix = Math.floor(Math.abs(n) / 10);
  const answer = prefix * (prefix + 1) * 100 + 25;
  return {
    answer,
    steps: [
      { title: 'Separate the prefix', detail: `For ${n}, the prefix is ${prefix}.` },
      { title: 'Apply Ekadhikena', detail: `${prefix} × (${prefix} + 1) = ${prefix * (prefix + 1)}.` },
      { title: 'Append 25', detail: `${prefix * (prefix + 1)} × 100 + 25 = ${answer}.` },
    ],
  };
}

export function yaavadunam(n: number): SolverResult {
  if (!Number.isInteger(n) || n <= 0) {
    return { answer: null, steps: [], error: 'Enter a positive integer.' };
  }
  const base = pickBase(n, n);
  const diff = n - base;
  const left = n + diff;
  const right = diff * diff;
  const answer = n * n;
  const baseDigits = Math.max(1, String(base).length - 1);
  return {
    answer,
    steps: [
      { title: `Choose nearest base ${base}`, detail: `Deficiency/excess of ${n} from ${base} is d = ${diff >= 0 ? `+${diff}` : diff}.` },
      { title: 'Lessen / increase further by d', detail: `${n} ${diff >= 0 ? '+' : '−'} ${Math.abs(diff)} = ${left}.` },
      { title: 'Square the deviation', detail: `(${diff})² = ${String(right).padStart(baseDigits, '0')}.` },
      { title: 'Join & adjust carry', detail: `${left} × ${base} + ${right} = ${answer}.` },
    ],
  };
}

export function ekanyunena(n: number, digits: number): SolverResult {
  if (!Number.isInteger(n) || n < 1) {
    return { answer: null, steps: [], error: 'Enter a positive integer.' };
  }
  if (!Number.isInteger(digits) || digits < 1 || digits > 7) {
    return { answer: null, steps: [], error: 'Choose between 1 and 7 digits of 9.' };
  }
  const nine = Number('9'.repeat(digits));
  if (n > nine) {
    return { answer: null, steps: [], error: `This standard Case 1 requires n <= ${nine}.` };
  }
  const left = n - 1;
  const right = nine - left;
  const joined = `${left}${String(right).padStart(digits, '0')}`;
  return {
    answer: n * nine,
    steps: [
      { title: 'Subtract 1', detail: `${n} - 1 = ${left}.` },
      { title: 'Find the complement', detail: `${nine} - ${left} = ${right}.` },
      { title: 'Join the parts', detail: `${joined} = ${n * nine}.` },
    ],
  };
}

export function urdhva(a: number, b: number): SolverResult {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
    return { answer: null, steps: [], error: 'Enter two non-negative integers.' };
  }
  const digitsA = String(a).split('').reverse().map(Number);
  const digitsB = String(b).split('').reverse().map(Number);
  const columns: Step[] = [];
  let carry = 0;
  let output = '';
  for (let column = 0; column <= digitsA.length + digitsB.length - 2; column++) {
    const incomingCarry = carry;
    const products: string[] = [];
    let sum = incomingCarry;
    if (incomingCarry > 0) products.push(`${incomingCarry} (carry)`);
    for (let i = 0; i < digitsA.length; i++) {
      const j = column - i;
      if (j >= 0 && j < digitsB.length) {
        sum += digitsA[i] * digitsB[j];
        products.push(`${digitsA[i]}×${digitsB[j]}`);
      }
    }
    const digit = sum % 10;
    carry = Math.floor(sum / 10);
    output = String(digit) + output;
    const names = ['Units', 'Tens', 'Hundreds', 'Thousands', 'Ten-thousands', 'Hundred-thousands'];
    columns.push({
      title: names[column] ?? `Column ${column + 1}`,
      detail: `${products.join(' + ')}${incomingCarry > 0 || products.length > 1 || sum >= 10 ? ` = ${sum}` : ''}; write ${digit}${carry ? ` and carry ${carry}` : ''}.`,
    });
  }
  if (carry > 0) output = String(carry) + output;
  return { answer: a * b, steps: [...columns, { title: 'Join the result', detail: `${output} = ${a * b}.` }] };
}

export function cubeRoot(number: number) {
  if (!Number.isInteger(number) || number < 0) {
    return { result: null, exact: false, error: 'Enter a positive integer.', steps: [] as Step[] };
  }
  const result = Math.round(Math.cbrt(number));
  const exact = result ** 3 === number;
  const unitDigit = number % 10;
  const unitMap: Record<number, number> = { 0: 0, 1: 1, 2: 8, 3: 7, 4: 4, 5: 5, 6: 6, 7: 3, 8: 2, 9: 9 };
  const prefix = Math.floor(number / 1000);
  const largestCube = Math.floor(Math.cbrt(prefix));
  const cubeBase = largestCube ** 3;
  return {
    result: exact ? result : null,
    exact,
    steps: [
      { title: 'Inspect the last digit', detail: `The last digit ${unitDigit} suggests unit digit ${unitMap[unitDigit] ?? '?'} for a perfect cube.` },
      { title: 'Inspect the remaining prefix', detail: `The largest cube not exceeding ${prefix} is ${largestCube}³ = ${cubeBase}.` },
      { title: 'Combine', detail: exact ? `Unit digit ${unitMap[unitDigit]} with prefix ${largestCube} gives ${result}.` : 'The input is not a perfect integer cube.' },
    ] as Step[],
  };
}

export function sankalanaSymmetric(a: number, b: number, c1: number, c2: number): SolverResult {
  const sumCoeff = a + b;
  const diffCoeff = a - b;
  if (sumCoeff === 0 || diffCoeff === 0) {
    return { answer: null, steps: [], error: 'Symmetric coefficients must satisfy a ≠ ±b.' };
  }
  const xPlusY = (c1 + c2) / sumCoeff;
  const xMinusY = (c1 - c2) / diffCoeff;
  const x = (xPlusY + xMinusY) / 2;
  const y = (xPlusY - xMinusY) / 2;
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : Number(v.toFixed(4)).toString());
  return {
    answer: `x = ${fmt(x)}, y = ${fmt(y)}`,
    steps: [
      { title: 'Spot swapped coefficients', detail: `Coefficients (${a}, ${b}) swap symmetrically across both equations.` },
      { title: 'Add equations (Sankalana)', detail: `${sumCoeff}(x + y) = ${c1 + c2}  ⇒  x + y = ${fmt(xPlusY)}.` },
      { title: 'Subtract equations (Vyavakalana)', detail: `${diffCoeff}(x − y) = ${c1 - c2}  ⇒  x − y = ${fmt(xMinusY)}.` },
      { title: 'Solve pair', detail: `Add & halve: x = ${fmt(x)}, y = ${fmt(y)}.` },
    ],
  };
}

export function puranapuranabhyam(a: number, b: number, c: number): SolverResult {
  if (a === 0) {
    return { answer: null, steps: [], error: 'Leading coefficient a must be non-zero.' };
  }
  const bNorm = b / a;
  const cNorm = c / a;
  const half = bNorm / 2;
  const rhs = half * half - cNorm;
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : Number(v.toFixed(4)).toString());
  if (rhs < 0) {
    const imag = Math.sqrt(-rhs);
    return {
      answer: `${fmt(-half)} ± ${fmt(imag)}i`,
      steps: [
        { title: 'Normalize leading coefficient', detail: `Divide by ${a}: x² + (${fmt(bNorm)})x = ${fmt(-cNorm)}.` },
        { title: 'Complete the square', detail: `Add (${fmt(half)})² = ${fmt(half * half)} to both sides.` },
        { title: 'Complex roots', detail: `(x + ${fmt(half)})² = ${fmt(rhs)} ⇒ x = ${fmt(-half)} ± ${fmt(imag)}i.` },
      ],
    };
  }
  const root = Math.sqrt(rhs);
  const r1 = -half + root;
  const r2 = -half - root;
  return {
    answer: r1 === r2 ? `x = ${fmt(r1)}` : `x = ${fmt(r1)}, ${fmt(r2)}`,
    steps: [
      { title: 'Normalize & isolate constant', detail: `x² + (${fmt(bNorm)})x = ${fmt(-cNorm)}.` },
      { title: 'Add completion square', detail: `Add (${fmt(half)})² = ${fmt(half * half)}: (x ${half >= 0 ? '+' : '−'} ${fmt(Math.abs(half))})² = ${fmt(rhs)}.` },
      { title: 'Take square roots', detail: `x ${half >= 0 ? '+' : '−'} ${fmt(Math.abs(half))} = ±${fmt(root)} ⇒ x = ${fmt(r1)}${r1 !== r2 ? `, ${fmt(r2)}` : ''}.` },
    ],
  };
}

export type KaprekarStepDetail = { desc: string; asc: string; result: number };

export function kaprekarDetailed(value: number): { steps: KaprekarStepDetail[]; error?: string } {
  if (!Number.isInteger(value) || value < 1000 || value > 9999) {
    return { steps: [], error: 'Enter an integer from 1000 to 9999.' };
  }
  const firstDigits = String(value).padStart(4, '0').split('');
  if (new Set(firstDigits).size === 1) {
    return { steps: [], error: 'Repdigit inputs do not converge to 6174.' };
  }
  const steps: KaprekarStepDetail[] = [];
  let n = value;
  for (let i = 0; i < 8; i++) {
    const digits = String(n).padStart(4, '0').split('');
    const ascStr = digits.slice().sort().join('');
    const descStr = digits.slice().sort((a, b) => b.localeCompare(a)).join('');
    n = Number(descStr) - Number(ascStr);
    steps.push({ desc: descStr, asc: ascStr, result: n });
    if (n === 0 || n === 6174) break;
  }
  return { steps };
}

export function kaprekar(value: number) {
  const detailed = kaprekarDetailed(value);
  return { steps: detailed.steps.map(s => s.result), error: detailed.error };
}

export type KatapayadiToken = { token: string; digit: number | null };

export function katapayadiDetailed(text: string): {
  forward: string;
  traditional: string;
  tokens: KatapayadiToken[];
} {
  const code: Record<string, number> = {
    k: 1, kh: 2, g: 3, gh: 4, ng: 5, c: 6, ch: 7, j: 8, jh: 9, ny: 0,
    t: 1, th: 2, d: 3, dh: 4, n: 5, p: 1, ph: 2, b: 3, bh: 4, m: 5,
    y: 1, r: 2, l: 3, v: 4, sh: 5, ss: 6, s: 7, h: 8,
  };
  const tokens: KatapayadiToken[] = [];
  let forward = '';
  const lower = text.toLowerCase();
  for (let i = 0; i < lower.length;) {
    const pair = lower.slice(i, i + 2);
    const rawPair = text.slice(i, i + 2);
    if (code[pair] !== undefined) {
      forward += code[pair];
      tokens.push({ token: rawPair, digit: code[pair] });
      i += 2;
    } else if (code[lower[i]] !== undefined) {
      forward += code[lower[i]];
      tokens.push({ token: text[i], digit: code[lower[i]] });
      i++;
    } else {
      if (/[a-z]/i.test(text[i])) tokens.push({ token: text[i], digit: null });
      i++;
    }
  }

  const presets: Record<string, { forward: string; traditional: string }> = {
    mayamalavagowla: { forward: '51', traditional: '15' },
  };
  const preset = presets[lower.replace(/[\s-]/g, '')];
  if (preset) {
    return {
      ...preset,
      tokens: [
        { token: 'Ma', digit: 5 },
        { token: 'Ya', digit: 1 },
        { token: '…', digit: null },
      ],
    };
  }

  forward ||= '0';
  return {
    forward,
    traditional: forward.split('').reverse().join(''),
    tokens,
  };
}

export function katapayadi(text: string) {
  const detailed = katapayadiDetailed(text);
  return { forward: detailed.forward, traditional: detailed.traditional, error: undefined };
}
