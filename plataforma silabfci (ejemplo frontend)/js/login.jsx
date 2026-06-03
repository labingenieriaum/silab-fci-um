/* SILAB FCI — Login */
const { useState: useStateL } = React;

function CircuitBg() {
  // Subtle tech/circuit decoration built from basic shapes
  return (
    <svg width="100%" height="100%" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, opacity: .5 }}>
      <defs>
        <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(255,255,255,.10)" />
        </pattern>
      </defs>
      <rect width="600" height="800" fill="url(#dots)" />
      <g stroke="rgba(155,201,92,.30)" strokeWidth="1.5" fill="none">
        <path d="M40 120 H180 V240 H320" /><circle cx="40" cy="120" r="4" fill="rgba(155,201,92,.6)" stroke="none" /><circle cx="320" cy="240" r="4" fill="rgba(155,201,92,.6)" stroke="none" />
        <path d="M500 80 V200 H400 V300" /><circle cx="500" cy="80" r="4" fill="rgba(155,201,92,.6)" stroke="none" />
        <path d="M120 560 H260 V680" /><circle cx="260" cy="680" r="4" fill="rgba(155,201,92,.6)" stroke="none" />
        <path d="M460 620 H540 V520 H420" /><circle cx="420" cy="520" r="4" fill="rgba(155,201,92,.6)" stroke="none" />
      </g>
      <g stroke="rgba(255,255,255,.12)" strokeWidth="1" fill="none">
        <path d="M0 400 H600" /><path d="M300 0 V800" />
      </g>
    </svg>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useStateL('coordinacion@umanizales.edu.co');
  const [pass, setPass] = useStateL('••••••••••');
  const [loading, setLoading] = useStateL(false);
  const submit = (e) => { e.preventDefault(); setLoading(true); setTimeout(() => onLogin(), 850); };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr', background: 'var(--bg)' }} className="login-wrap">
      <div className="login-grid" style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', minHeight: '100vh' }}>
        {/* Brand panel */}
        <div className="login-brand" style={{ position: 'relative', background: 'linear-gradient(150deg, #0c3b22 0%, #114a2c 55%, #0a3119 100%)', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '44px' }}>
          <CircuitBg />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 11, background: '#fff', display: 'grid', placeItems: 'center', padding: 4 }}>
              <img src={(window.__resources&&window.__resources.logoMark)||'assets/logo-mark.png'} alt="SILAB FCI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ color: '#fff', lineHeight: 1.1 }}>
              <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '.01em' }}>SILAB <span style={{ color: 'var(--lime-400)' }}>FCI</span></div>
              <div style={{ fontSize: 11.5, color: 'var(--sidebar-text-dim)' }}>Sistema de Inventario y Laboratorios</div>
            </div>
          </div>

          <div style={{ position: 'relative', maxWidth: 440 }}>
            <h1 style={{ color: '#fff', fontSize: 34, fontWeight: 800, lineHeight: 1.12, letterSpacing: '-.02em', margin: '0 0 14px' }}>
              Gestión integral de equipos y laboratorios
            </h1>
            <p style={{ color: 'var(--sidebar-text)', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
              Inventario, préstamos, devoluciones, mantenimientos y reportes de la Facultad de Ciencias e Ingeniería en una sola plataforma.
            </p>
            <div style={{ display: 'flex', gap: 26, marginTop: 30 }}>
              {[['+1.200', 'Equipos'], ['7', 'Laboratorios'], ['5', 'Programas']].map(([n, l]) => (
                <div key={l}>
                  <div style={{ color: 'var(--lime-400)', fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{n}</div>
                  <div style={{ color: 'var(--sidebar-text-dim)', fontSize: 12, marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative', color: 'var(--sidebar-text-dim)', fontSize: 11.5, display: 'flex', gap: 6, alignItems: 'center' }}>
            <Icon name="building" size={13} />Facultad de Ciencias e Ingeniería · Universidad de Manizales
          </div>
        </div>

        {/* Form panel */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', background: 'var(--surface)' }}>
          <form onSubmit={submit} style={{ width: '100%', maxWidth: 372 }} className="fade-in">
            <div className="login-mobile-logo" style={{ display: 'none', justifyContent: 'center', marginBottom: 24 }}>
              <img src={(window.__resources&&window.__resources.logoFull)||'assets/logo-full.png'} alt="SILAB FCI" style={{ height: 64 }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-.02em' }}>Iniciar sesión</h2>
            <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: '0 0 28px' }}>Ingresa con tu correo institucional</p>

            <div className="field" style={{ marginBottom: 16 }}>
              <label>Correo institucional</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}><Icon name="mail" size={16} /></span>
                <input className="input" style={{ paddingLeft: 36 }} value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@umanizales.edu.co" />
              </div>
            </div>

            <div className="field" style={{ marginBottom: 10 }}>
              <label>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}><Icon name="lock" size={16} /></span>
                <input className="input" type="password" style={{ paddingLeft: 36 }} value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-2)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)', width: 15, height: 15 }} /> Recordarme
              </label>
              <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>¿Olvidé mi contraseña?</a>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', height: 42, fontSize: 14, opacity: loading ? .8 : 1 }}>
              {loading ? <><span className="spin" style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />Verificando…</> : <>Iniciar sesión<Icon name="arrowRight" size={16} /></>}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} /><span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>acceso institucional</span><hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
            </div>
            <button type="button" onClick={() => { setLoading(true); setTimeout(onLogin, 600); }} className="btn" style={{ width: '100%', height: 40 }}>
              <Icon name="graduation" size={16} />Continuar con cuenta UManizales
            </button>

            <p style={{ fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center', marginTop: 26, lineHeight: 1.5 }}>
              Al ingresar aceptas las políticas de uso de laboratorios.<br />¿Problemas de acceso? Contacta a Coordinación de Laboratorios.
            </p>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin .7s linear infinite;margin-right:8px}
        @media(max-width:860px){.login-brand{display:none!important}.login-grid{grid-template-columns:1fr!important}.login-mobile-logo{display:flex!important}}`}</style>
    </div>
  );
}

window.Login = Login;
