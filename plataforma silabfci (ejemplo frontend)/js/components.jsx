/* SILAB FCI — Shared components */
const { useState, useEffect, useRef } = React;

/* ---------- Status maps ---------- */
const EQ_STATUS = {
  disponible:    { label: 'Disponible',    cls: 'badge-green' },
  prestado:      { label: 'Prestado',      cls: 'badge-blue' },
  danado:        { label: 'Dañado',        cls: 'badge-red' },
  mantenimiento: { label: 'Mantenimiento', cls: 'badge-amber' },
  baja:          { label: 'Dado de baja',  cls: 'badge-gray' },
};
const LOAN_STATUS = {
  solicitado: { label: 'Solicitado', cls: 'badge-purple' },
  aprobado:   { label: 'Aprobado',   cls: 'badge-blue' },
  entregado:  { label: 'Entregado',  cls: 'badge-amber' },
  devuelto:   { label: 'Devuelto',   cls: 'badge-green' },
  vencido:    { label: 'Vencido',    cls: 'badge-redhot' },
  cancelado:  { label: 'Cancelado',  cls: 'badge-gray' },
  rechazado:  { label: 'Rechazado',  cls: 'badge-gray' },
};
function StatusBadge({ status, map }) {
  const m = (map || EQ_STATUS)[status] || { label: status, cls: 'badge-gray' };
  return <span className={`badge ${m.cls}`}><span className="dot" />{m.label}</span>;
}

/* ---------- KPI Card ---------- */
function KpiCard({ icon, label, value, delta, deltaUp, tone = 'primary', sub, onClick }) {
  const tones = {
    primary: 'var(--primary)', green: 'var(--st-green)', blue: 'var(--st-blue)',
    red: 'var(--st-red)', amber: 'var(--st-amber)', purple: 'var(--st-purple)', gray: 'var(--st-gray)',
  };
  const col = tones[tone];
  return (
    <div className="card" onClick={onClick} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow .15s, transform .15s' }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 600 }}>{label}</span>
        <span style={{ width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center', background: `color-mix(in srgb, ${col} 12%, transparent)`, color: col }}>
          <Icon name={icon} size={17} />
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1, color: 'var(--text)' }}>{value}</span>
        {delta && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 700, marginBottom: 2, color: deltaUp ? 'var(--st-green)' : 'var(--st-red)' }}>
            <Icon name={deltaUp ? 'trendUp' : 'trendDown'} size={13} />{delta}
          </span>
        )}
      </div>
      {sub && <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{sub}</span>}
    </div>
  );
}

/* ---------- Card header ---------- */
function CardTitle({ title, sub, action, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {icon && <span style={{ color: 'var(--text-3)' }}><Icon name={icon} size={17} /></span>}
        <div>
          <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>{title}</h3>
          {sub && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-3)' }}>{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ---------- Action menu (row actions) ---------- */
function ActionMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}><Icon name="more" size={16} /></button>
      {open && (
        <div className="card fade-in" style={{ position: 'absolute', right: 0, top: '110%', zIndex: 50, minWidth: 184, padding: 5, boxShadow: 'var(--shadow-lg)', animationDuration: '.12s' }}>
          {items.map((it, i) => it.divider ? <hr key={i} className="divider" style={{ margin: '4px 0' }} /> : (
            <button key={i} onClick={(e) => { e.stopPropagation(); setOpen(false); it.onClick && it.onClick(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 9px', border: 'none', background: 'transparent', borderRadius: 7, fontSize: 12.5, fontWeight: 500, color: it.danger ? 'var(--st-red)' : 'var(--text)', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {it.icon && <Icon name={it.icon} size={15} />}{it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Modal ---------- */
function Modal({ open, onClose, title, sub, children, footer, width = 520 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,16,12,.5)', backdropFilter: 'blur(3px)', zIndex: 200, display: 'grid', placeItems: 'center', padding: 20, animation: 'fadeIn .15s' }}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width, maxWidth: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)', animation: 'scaleIn .16s ease' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <div><h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>{sub && <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-3)' }}>{sub}</p>}</div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div className="scroll-y" style={{ padding: 20, flex: 1 }}>{children}</div>
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, padding: '14px 20px', borderTop: '1px solid var(--border)' }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Drawer (right) ---------- */
function Drawer({ open, onClose, title, sub, children, footer, width = 460 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,16,12,.5)', backdropFilter: 'blur(3px)', zIndex: 200, animation: 'fadeIn .15s' }}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width, maxWidth: '100%', background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)', animation: 'slideInRight .22s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <div><h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>{sub && <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-3)' }}>{sub}</p>}</div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div className="scroll-y" style={{ padding: 20, flex: 1 }}>{children}</div>
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, padding: '14px 20px', borderTop: '1px solid var(--border)' }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Empty state ---------- */
function EmptyState({ icon = 'box', title, desc, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', textAlign: 'center', gap: 4 }}>
      <span style={{ width: 52, height: 52, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'var(--surface-3)', color: 'var(--text-3)', marginBottom: 8 }}><Icon name={icon} size={24} /></span>
      <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 700 }}>{title}</h4>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', maxWidth: 320 }}>{desc}</p>
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

/* ---------- Timeline ---------- */
function Timeline({ steps }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {steps.map((s, i) => {
        const done = s.state === 'done', active = s.state === 'active';
        const col = done ? 'var(--st-green)' : active ? 'var(--primary)' : 'var(--border-2)';
        return (
          <div key={i} style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
                background: done ? 'var(--st-green-bg)' : active ? 'var(--primary-soft)' : 'var(--surface-3)', color: col, border: `2px solid ${col}` }}>
                {done ? <Icon name="check" size={13} sw={3} /> : <Icon name={s.icon || 'clock'} size={12} />}
              </span>
              {i < steps.length - 1 && <span style={{ width: 2, flex: 1, minHeight: 26, background: done ? 'var(--st-green)' : 'var(--border)' }} />}
            </div>
            <div style={{ paddingBottom: i < steps.length - 1 ? 18 : 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: active || done ? 'var(--text)' : 'var(--text-3)' }}>{s.title}</div>
              {s.date && <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>{s.date}</div>}
              {s.desc && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>{s.desc}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Pseudo-QR (deterministic grid of squares) ---------- */
function QRCode({ value = 'SILAB', size = 132 }) {
  const n = 21;
  let h = 0; for (let i = 0; i < value.length; i++) h = (h * 131 + value.charCodeAt(i)) >>> 0;
  const rng = () => { h = (h * 1103515245 + 12345) & 0x7fffffff; return h / 0x7fffffff; };
  const cell = size / n;
  const isFinder = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const rects = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (isFinder(x, y)) continue;
    if (rng() > 0.52) rects.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} />);
  }
  const finder = (ox, oy) => (
    <g key={`f${ox}${oy}`}>
      <rect x={ox * cell} y={oy * cell} width={cell * 7} height={cell * 7} rx={cell} fill="none" stroke="currentColor" strokeWidth={cell} />
      <rect x={(ox + 2) * cell} y={(oy + 2) * cell} width={cell * 3} height={cell * 3} rx={cell * .6} />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="currentColor" style={{ color: 'var(--text)', display: 'block' }}>
      {rects}{finder(0,0)}{finder(n-7,0)}{finder(0,n-7)}
    </svg>
  );
}

/* ---------- Segmented control ---------- */
function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', background: 'var(--surface-3)', borderRadius: 9, padding: 3, gap: 2 }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 12px', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
            background: value === o.value ? 'var(--surface)' : 'transparent', color: value === o.value ? 'var(--text)' : 'var(--text-2)', boxShadow: value === o.value ? 'var(--shadow-sm)' : 'none', transition: 'all .12s' }}>
          {o.icon && <Icon name={o.icon} size={14} />}{o.label}
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { StatusBadge, EQ_STATUS, LOAN_STATUS, KpiCard, CardTitle, ActionMenu, Modal, Drawer, EmptyState, Timeline, QRCode, Segmented });
