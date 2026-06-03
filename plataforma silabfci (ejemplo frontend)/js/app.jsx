/* SILAB FCI — App principal */
const { useState: useStateApp, useEffect: useEffectApp } = React;

function Spotlight({ open, onClose, navigate }) {
  const [q, setQ] = useStateApp('');
  useEffectApp(() => { if (open) setQ(''); }, [open]);
  if (!open) return null;
  const ql = q.toLowerCase();
  const navResults = Object.entries(ROUTE_TITLES).filter(([k, v]) => v.toLowerCase().includes(ql) && !k.includes('-')).slice(0, 5);
  const eqResults = q ? DB.equipment.filter(e => `${e.name} ${e.id}`.toLowerCase().includes(ql)).slice(0, 4) : [];
  const loanResults = q ? DB.loans.filter(l => `${l.id} ${l.user}`.toLowerCase().includes(ql)).slice(0, 3) : [];
  const go = (r) => { navigate(r); onClose(); };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,16,12,.45)', backdropFilter: 'blur(3px)', zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '12vh', animation: 'fadeIn .12s' }}>
      <div onClick={e => e.stopPropagation()} className="card" style={{ width: 600, maxWidth: '92%', boxShadow: 'var(--shadow-lg)', animation: 'scaleIn .14s', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <Icon name="search" size={18} style={{ color: 'var(--text-3)' }} />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar módulos, equipos, préstamos…" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: 'var(--text)' }} />
          <span className="kbd">ESC</span>
        </div>
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: 8 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', padding: '8px 10px 4px' }}>Navegación</div>
          {navResults.map(([k, v]) => (
            <button key={k} onClick={() => go(k)} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '9px 10px', border: 'none', background: 'transparent', borderRadius: 8, fontSize: 13.5, color: 'var(--text)', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Icon name={(NAV.flatMap(g => g.items).find(i => i.key === k) || {}).icon || 'dashboard'} size={16} style={{ color: 'var(--text-3)' }} />{v}<Icon name="arrowRight" size={13} style={{ marginLeft: 'auto', color: 'var(--text-3)' }} />
            </button>
          ))}
          {eqResults.length > 0 && <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', padding: '12px 10px 4px' }}>Equipos</div>}
          {eqResults.map(e => (
            <button key={e.id} onClick={() => go('equipment-detail:' + e.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '9px 10px', border: 'none', background: 'transparent', borderRadius: 8, textAlign: 'left' }} onMouseEnter={ev => ev.currentTarget.style.background = 'var(--surface-3)'} onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
              <Icon name="inventory" size={16} style={{ color: 'var(--text-3)' }} /><div><div style={{ fontSize: 13, fontWeight: 600 }}>{e.name}</div><div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{e.id} · {e.labCode}</div></div><div style={{ marginLeft: 'auto' }}><StatusBadge status={e.estado} /></div>
            </button>
          ))}
          {loanResults.length > 0 && <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', padding: '12px 10px 4px' }}>Préstamos</div>}
          {loanResults.map(l => (
            <button key={l.id} onClick={() => go('loan-detail:' + l.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '9px 10px', border: 'none', background: 'transparent', borderRadius: 8, textAlign: 'left' }} onMouseEnter={ev => ev.currentTarget.style.background = 'var(--surface-3)'} onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
              <Icon name="loans" size={16} style={{ color: 'var(--text-3)' }} /><div><div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{l.id}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{l.user}</div></div><div style={{ marginLeft: 'auto' }}><StatusBadge status={l.estado} map={LOAN_STATUS} /></div>
            </button>
          ))}
          {q && navResults.length + eqResults.length + loanResults.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Sin resultados para “{q}”</div>}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [logged, setLogged] = useStateApp(false);
  const [route, setRoute] = useStateApp('dashboard');
  const [theme, setTheme] = useStateApp(() => localStorage.getItem('silab-theme') || 'light');
  const [collapsed, setCollapsed] = useStateApp(false);
  const [mobileOpen, setMobileOpen] = useStateApp(false);
  const [spotlight, setSpotlight] = useStateApp(false);
  const [user, setUser] = useStateApp({ name: 'Laura Ramírez', initials: 'LR', role: 'Coordinación de laboratorios', email: 'lramirez@umanizales.edu.co' });

  useEffectApp(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('silab-theme', theme); }, [theme]);
  useEffectApp(() => { window.__silabLogout = () => { setLogged(false); setRoute('dashboard'); }; }, []);
  useEffectApp(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSpotlight(s => !s); }
      if (e.key === 'Escape') setSpotlight(false);
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);

  const navigate = (r) => { setRoute(r); document.querySelector('.main-scroll')?.scrollTo(0, 0); };

  if (!logged) return <Login onLogin={() => setLogged(true)} />;

  const base = route.split(':')[0];
  const arg = route.split(':')[1];
  let content;
  switch (base) {
    case 'dashboard':
      content = arg === 'dean' ? <DashDean navigate={navigate} /> : arg === 'director' ? <DashDirector navigate={navigate} /> : arg === 'coord' ? <DashCoord navigate={navigate} /> : <Dashboard navigate={navigate} user={user} />;
      break;
    case 'inventory': content = <Inventory navigate={navigate} />; break;
    case 'equipment': content = <Inventory navigate={navigate} />; break;
    case 'equipment-detail': content = <EquipmentDetail id={arg} navigate={navigate} />; break;
    case 'equipment-form': content = <EquipmentForm navigate={navigate} />; break;
    case 'loans': content = <Loans navigate={navigate} />; break;
    case 'loan-detail': content = <LoanDetail id={arg} navigate={navigate} />; break;
    case 'loan-wizard': content = <LoanWizard navigate={navigate} />; break;
    case 'returns': content = <Returns navigate={navigate} />; break;
    case 'maintenance': content = <Maintenance navigate={navigate} />; break;
    case 'labs': case 'locations': content = <Labs navigate={navigate} />; break;
    case 'categories': content = <Categories />; break;
    case 'subjects': content = <AcademicModule kind="subjects" navigate={navigate} />; break;
    case 'projects': content = <AcademicModule kind="projects" navigate={navigate} />; break;
    case 'activities': content = <AcademicModule kind="activities" navigate={navigate} />; break;
    case 'users': content = <Users navigate={navigate} />; break;
    case 'reports': content = <Reports navigate={navigate} />; break;
    case 'audit': content = <Audit />; break;
    case 'settings': content = <Settings theme={theme} setTheme={setTheme} />; break;
    default: content = <Dashboard navigate={navigate} user={user} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <Sidebar route={route} navigate={navigate} collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header route={route} navigate={navigate} theme={theme} setTheme={setTheme} onMenu={() => setMobileOpen(true)} openSpotlight={() => setSpotlight(true)} user={user} setUser={setUser} />
        <main className="main-scroll scroll-y" style={{ flex: 1, overflowY: 'auto' }}>{content}</main>
      </div>
      <Spotlight open={spotlight} onClose={() => setSpotlight(false)} navigate={navigate} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
