import { pickBase } from '../math';

type SutraDiagramProps = {
  sutra: string;
  numbers: number[];
  activeStep: number | null;
  className?: string;
};

export default function SutraDiagram({ sutra, numbers, activeStep, className = '' }: SutraDiagramProps) {
  if (sutra === 'nikhilam' && numbers.length >= 2) {
    const [a, b] = numbers;
    if (!Number.isInteger(a) || !Number.isInteger(b) || a <= 0 || b <= 0) return null;
    const base = pickBase(a, b);
    const da = a - base;
    const db = b - base;
    const left = a + db;
    const right = da * db;
    return (
      <div className={`sutra-diagram bg-optical-dots ${className}`} aria-label="Nikhilam deviation diagram">
        <div className="sutra-diagram-head">
          <span>Nikhilam Base Lattice</span>
          <b>Base = {base}</b>
        </div>
        <div className="diagram-grid-2col">
          <div className={`diagram-node ${activeStep === 0 || activeStep === 1 ? 'active' : ''}`}>
            <small>Row A · Cross Left</small>
            <strong>
              {a} <em>({da >= 0 ? `+${da}` : da})</em>
            </strong>
            <small>
              {a} {db >= 0 ? '+' : '−'} {Math.abs(db)} = <em>{left}</em>
            </small>
          </div>
          <span className="diagram-op">×</span>
          <div className={`diagram-node ${activeStep === 0 || activeStep === 2 ? 'active' : ''}`}>
            <small>Row B · Deviations</small>
            <strong>
              {b} <em>({db >= 0 ? `+${db}` : db})</em>
            </strong>
            <small>
              ({da}) × ({db}) = <em>{right}</em>
            </small>
          </div>
        </div>
      </div>
    );
  }

  if (sutra === 'ekadhikena' && numbers.length >= 1) {
    const n = Math.abs(numbers[0]);
    if (!Number.isInteger(n) || n % 10 !== 5) return null;
    const p = Math.floor(n / 10);
    return (
      <div className={`sutra-diagram bg-optical-dots ${className}`} aria-label="Ekadhikena split diagram">
        <div className="sutra-diagram-head">
          <span>Ekadhikena Split Block</span>
          <b>p = {p}</b>
        </div>
        <div className="diagram-grid-2col">
          <div className={`diagram-node ${activeStep === 0 || activeStep === 1 ? 'active' : ''}`}>
            <small>One More Than Previous</small>
            <strong>
              {p} × {p + 1} = <em>{p * (p + 1)}</em>
            </strong>
          </div>
          <span className="diagram-op">|</span>
          <div className={`diagram-node ${activeStep === 2 ? 'active' : ''}`}>
            <small>Terminal 5² Block</small>
            <strong>
              5² = <em>25</em>
            </strong>
          </div>
        </div>
      </div>
    );
  }

  if (sutra === 'ekanyunena' && numbers.length >= 2) {
    const [x, y] = numbers;
    const nine = /^9+$/.test(String(y)) ? y : /^9+$/.test(String(x)) ? x : null;
    const n = nine === y ? x : nine === x ? y : null;
    if (nine === null || n === null || n < 1 || n > nine) return null;
    const digits = String(nine).length;
    const left = n - 1;
    const right = nine - left;
    return (
      <div className={`sutra-diagram bg-optical-dots ${className}`} aria-label="Ekanyunena complement diagram">
        <div className="sutra-diagram-head">
          <span>Ekanyunena Complement Pair</span>
          <b>{digits} Nines</b>
        </div>
        <div className="diagram-grid-2col">
          <div className={`diagram-node ${activeStep === 0 ? 'active' : ''}`}>
            <small>One Less ({n} − 1)</small>
            <strong>
              <em>{left}</em>
            </strong>
          </div>
          <span className="diagram-op">|</span>
          <div className={`diagram-node ${activeStep === 1 || activeStep === 2 ? 'active' : ''}`}>
            <small>
              Complement ({nine} − {left})
            </small>
            <strong>
              <em>{String(right).padStart(digits, '0')}</em>
            </strong>
          </div>
        </div>
      </div>
    );
  }

  if (sutra === 'yaavadunam' && numbers.length >= 1) {
    const n = numbers[0];
    if (!Number.isInteger(n) || n <= 0) return null;
    const base = pickBase(n, n);
    const diff = n - base;
    return (
      <div className={`sutra-diagram bg-optical-dots ${className}`} aria-label="Yaavadunam deficiency diagram">
        <div className="sutra-diagram-head">
          <span>Yaavadunam Base Deficiency</span>
          <b>Base = {base}</b>
        </div>
        <div className="diagram-grid-2col">
          <div className={`diagram-node ${activeStep === 0 || activeStep === 1 ? 'active' : ''}`}>
            <small>Shift by d = {diff >= 0 ? `+${diff}` : diff}</small>
            <strong>
              {n} {diff >= 0 ? '+' : '−'} {Math.abs(diff)} = <em>{n + diff}</em>
            </strong>
          </div>
          <span className="diagram-op">|</span>
          <div className={`diagram-node ${activeStep === 2 || activeStep === 3 ? 'active' : ''}`}>
            <small>Square Deficiency</small>
            <strong>
              ({diff})² = <em>{diff * diff}</em>
            </strong>
          </div>
        </div>
      </div>
    );
  }

  if (sutra === 'vilokanam' && numbers.length >= 1) {
    const n = numbers[0];
    if (!Number.isInteger(n) || n < 0) return null;
    const unitMap: Record<number, number> = { 0: 0, 1: 1, 2: 8, 3: 7, 4: 4, 5: 5, 6: 6, 7: 3, 8: 2, 9: 9 };
    const prefix = Math.floor(n / 1000);
    const tail = String(n % 1000).padStart(3, '0');
    const tens = Math.floor(Math.cbrt(prefix));
    const unit = unitMap[n % 10];
    return (
      <div className={`sutra-diagram bg-optical-dots ${className}`} aria-label="Vilokanam cube split diagram">
        <div className="sutra-diagram-head">
          <span>Vilokanam 3-Digit Partition</span>
          <b>{n}</b>
        </div>
        <div className="diagram-grid-2col">
          <div className={`diagram-node ${activeStep === 1 ? 'active' : ''}`}>
            <small>Prefix Cube Bound</small>
            <strong>
              {prefix} → <em>{tens}</em>
            </strong>
          </div>
          <span className="diagram-op">|</span>
          <div className={`diagram-node ${activeStep === 0 ? 'active' : ''}`}>
            <small>Last 3 Digits · Mirror</small>
            <strong>
              {tail} → <em>{unit}</em>
            </strong>
          </div>
        </div>
      </div>
    );
  }

  if (sutra === 'urdhva' && numbers.length >= 2) {
    const [a, b] = numbers;
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) return null;
    const strA = String(a);
    const strB = String(b);
    const len = Math.max(strA.length, strB.length);
    if (len > 4) return null;
    const padA = strA.padStart(len, '0').split('');
    const padB = strB.padStart(len, '0').split('');
    const totalCols = len * 2 - 1;
    const activeCol = activeStep !== null && activeStep < totalCols ? totalCols - 1 - activeStep : null;

    const svgW = Math.max(220, len * 76 + 44);
    const stepX = (svgW - 88) / Math.max(1, len - 1 || 1);
    const xPos = (idx: number) => (len === 1 ? svgW / 2 : 44 + idx * stepX);

    const lines: { x1: number; y1: number; x2: number; y2: number; col: number }[] = [];
    for (let i = 0; i < len; i++) {
      for (let j = 0; j < len; j++) {
        lines.push({ x1: xPos(i), y1: 34, x2: xPos(j), y2: 92, col: i + j });
      }
    }

    return (
      <div className={`sutra-diagram bg-optical-dots ${className}`} aria-label="Urdhva vertical and crosswise lattice">
        <div className="sutra-diagram-head">
          <span>Urdhva-Tiryagbhyam Lattice</span>
          <b>{activeStep !== null && activeStep < totalCols ? `Column ${activeStep + 1}` : 'Hover steps to trace'}</b>
        </div>
        <svg className="diagram-urdhva-svg" viewBox={`0 0 ${svgW} 124`} role="img" aria-label="Crosswise digit pairing">
          {lines.map((line, idx) => {
            const isHighlighted = activeCol === null || line.col === activeCol;
            const isFocused = activeCol !== null && line.col === activeCol;
            return (
              <line
                key={idx}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={isFocused ? '#ea580c' : 'currentColor'}
                strokeOpacity={isFocused ? 0.95 : isHighlighted ? 0.24 : 0.08}
                strokeWidth={isFocused ? 2.4 : 1.2}
                strokeLinecap="round"
              />
            );
          })}
          {padA.map((digit, i) => (
            <text key={`a-${i}`} x={xPos(i)} y="24" textAnchor="middle" fontSize="17">
              {digit}
            </text>
          ))}
          {padB.map((digit, j) => (
            <text key={`b-${j}`} x={xPos(j)} y="114" textAnchor="middle" fontSize="17">
              {digit}
            </text>
          ))}
        </svg>
      </div>
    );
  }

  return null;
}
