/* SILAB FCI — Charts (SVG, theme-aware) */
const { useState: useStateC } = React;

function useCssVar(name, dep) {
  const [v, setV] = useStateC('');
  React.useEffect(() => {
    setV(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
  }, [name, dep]);
  return v;
}

/* Vertical bar chart with hover */
function BarChart({ data, height = 180, color, accent }) {
  const max = Math.max(...data.map(d => d.value)) * 1.1;
  const [hi, setHi] = useStateC(null);
  const c = color || 'var(--primary)';
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height }}>
        {data.map((d, i) => (
          <div key={i} onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative', cursor: 'default' }}>
            {hi === i && (
              <div style={{ position: 'absolute', top: -2, transform: 'translateY(-100%)', background: 'var(--text)', color: 'var(--surface)', fontSize: 11, fontWeight: 700, padding: '3px 7px', borderRadius: 6, whiteSpace: 'nowrap', zIndex: 3 }}>{d.value}</div>
            )}
            <div style={{ width: '100%', maxWidth: 30, borderRadius: '6px 6px 2px 2px', height: `${(d.value / max) * 100}%`,
              background: hi === i ? (accent || 'var(--accent)') : c, transition: 'background .15s, height .4s cubic-bezier(.2,.8,.2,1)' }} />
            <span style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 6, fontWeight: 600 }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Horizontal bar list */
function HBarChart({ data, color, valueFmt }) {
  const max = Math.max(...data.map(d => d.value));
  const c = color || 'var(--primary)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 92, fontSize: 12, color: 'var(--text-2)', fontWeight: 500, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={d.name || d.label}>{d.label}</span>
          <div style={{ flex: 1, height: 9, background: 'var(--surface-3)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ width: `${(d.value / max) * 100}%`, height: '100%', background: c, borderRadius: 6, transition: 'width .5s cubic-bezier(.2,.8,.2,1)' }} />
          </div>
          <span className="mono" style={{ width: 44, fontSize: 11.5, color: 'var(--text)', fontWeight: 600, textAlign: 'right' }}>{valueFmt ? valueFmt(d.value) : d.value}</span>
        </div>
      ))}
    </div>
  );
}

/* Area/line chart */
function AreaChart({ data, height = 190, color }) {
  const W = 560, H = height, pad = { t: 14, r: 8, b: 24, l: 30 };
  const max = Math.max(...data.map(d => d.value)) * 1.12;
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const pts = data.map((d, i) => [pad.l + (i / (data.length - 1)) * iw, pad.t + ih - (d.value / max) * ih]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length-1][0].toFixed(1)} ${pad.t+ih} L${pad.l} ${pad.t+ih} Z`;
  const [hi, setHi] = useStateC(null);
  const c = color || 'var(--primary)';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.22" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, .25, .5, .75, 1].map((g, i) => (
        <line key={i} x1={pad.l} x2={W - pad.r} y1={pad.t + ih * g} y2={pad.t + ih * g} stroke="var(--border)" strokeWidth="1" strokeDasharray={i === 4 ? '0' : '3 4'} />
      ))}
      <path d={area} fill="url(#areaGrad)" />
      <path d={line} fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i} onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)}>
          <rect x={p[0] - iw/data.length/2} y={pad.t} width={iw/data.length} height={ih} fill="transparent" />
          <circle cx={p[0]} cy={p[1]} r={hi === i ? 5 : 3} fill="var(--surface)" stroke={c} strokeWidth="2.4" />
          {hi === i && <text x={p[0]} y={p[1] - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text)">{data[i].value}</text>}
          <text x={p[0]} y={H - 6} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--text-3)">{data[i].label}</text>
        </g>
      ))}
    </svg>
  );
}

/* Donut / inventory state */
function DonutChart({ data, size = 168, thickness = 22, centerLabel, centerValue }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = size / 2, r = R - thickness / 2;
  const circ = 2 * Math.PI * r;
  let off = 0;
  const [hi, setHi] = useStateC(null);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <g transform={`rotate(-90 ${R} ${R})`}>
          {data.map((d, i) => {
            const len = (d.value / total) * circ;
            const el = (
              <circle key={i} cx={R} cy={R} r={r} fill="none" stroke={d.color} strokeWidth={hi === i ? thickness + 4 : thickness}
                strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-off}
                onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)}
                style={{ transition: 'stroke-width .15s', cursor: 'default' }} />
            );
            off += len; return el;
          })}
        </g>
        <text x={R} y={R - 4} textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--text)">{centerValue ?? total}</text>
        <text x={R} y={R + 16} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-3)">{centerLabel || 'Total'}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
        {data.map((d, i) => (
          <div key={i} onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: hi === null || hi === i ? 1 : .5, transition: 'opacity .15s', cursor: 'default' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: 'var(--text-2)', flex: 1 }}>{d.label}</span>
            <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>{d.value}</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', width: 36, textAlign: 'right' }}>{Math.round(d.value / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { BarChart, HBarChart, AreaChart, DonutChart });
