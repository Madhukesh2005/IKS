export type Step = { title: string; detail: string };
export type SolverResult = { answer: number | null; steps: Step[]; error?: string };

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
  const unitMap: Record<number, number> = { 0:0,1:1,2:8,3:7,4:4,5:5,6:6,7:3,8:2,9:9 };
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

export function kaprekar(value: number) {
  if (!Number.isInteger(value) || value < 1000 || value > 9999) {
    return { steps: [] as number[], error: 'Enter an integer from 1000 to 9999.' };
  }
  const firstDigits = String(value).padStart(4, '0').split('');
  if (new Set(firstDigits).size === 1) {
    return { steps: [] as number[], error: 'Repdigit inputs do not converge to 6174.' };
  }
  const steps: number[] = [];
  let n = value;
  for (let i = 0; i < 8; i++) {
    const digits = String(n).padStart(4, '0').split('');
    const asc = Number(digits.slice().sort().join(''));
    const desc = Number(digits.slice().sort((a, b) => b.localeCompare(a)).join(''));
    n = desc - asc;
    steps.push(n);
    if (n === 0 || n === 6174) break;
  }
  return { steps };
}

export function katapayadi(text: string) {
  const presets: Record<string, { forward: string; traditional: string }> = {
    mayamalavagowla: { forward: '51', traditional: '15' },
  };
  const preset = presets[text.toLowerCase().replace(/[\s-]/g, '')];
  if (preset) return { ...preset, error: undefined };

  const code: Record<string, number> = {
    k:1, kh:2, g:3, gh:4, ng:5, c:6, ch:7, j:8, jh:9, ny:0,
    t:1, th:2, d:3, dh:4, n:5, p:1, ph:2, b:3, bh:4, m:5,
    y:1, r:2, l:3, v:4, sh:5, ss:6, s:7, h:8,
  };
  let forward = '';
  const lower = text.toLowerCase();
  for (let i = 0; i < lower.length;) {
    const pair = lower.slice(i, i + 2);
    if (code[pair] !== undefined) { forward += code[pair]; i += 2; }
    else if (code[lower[i]] !== undefined) { forward += code[lower[i]]; i++; }
    else i++;
  }
  forward ||= '0';
  return { forward, traditional: forward.split('').reverse().join(''), error: undefined };
}
