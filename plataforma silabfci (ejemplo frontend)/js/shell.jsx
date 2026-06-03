/* SILAB FCI — App shell: Sidebar + Header + Layout */
const { useState: useStateS, useEffect: useEffectS, useRef: useRefS } = React;

const NAV = [
{ section: 'Principal', items: [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' }]
},
{ section: 'Operación', items: [
  { key: 'loans', label: 'Préstamos', icon: 'loans', badge: 8 },
  { key: 'returns', label: 'Devoluciones', icon: 'returns' },
  { key: 'maintenance', label: 'Mantenimientos', icon: 'maintenance' }]
},
{ section: 'Catálogo', items: [
  { key: 'inventory', label: 'Inventario', icon: 'inventory' },
  { key: 'equipment', label: 'Equipos', icon: 'equipment' },
  { key: 'categories', label: 'Categorías', icon: 'categories' },
  { key: 'labs', label: 'Laboratorios', icon: 'labs' },
  { key: 'locations', label: 'Ubicaciones', icon: 'locations' }]
},
{ section: 'Académico', items: [
  { key: 'subjects', label: 'Materias', icon: 'subjects' },
  { key: 'projects', label: 'Proyectos', icon: 'projects' },
  { key: 'activities', label: 'Actividades', icon: 'activities' }]
},
{ section: 'Administración', items: [
  { key: 'users', label: 'Usuarios', icon: 'users' },
  { key: 'reports', label: 'Reportes', icon: 'reports' },
  { key: 'audit', label: 'Auditoría', icon: 'audit' },
  { key: 'settings', label: 'Configuración', icon: 'settings' }]
}];


const ROUTE_TITLES = {
  dashboard: 'Dashboard', loans: 'Préstamos', returns: 'Devoluciones', maintenance: 'Mantenimientos',
  inventory: 'Inventario', equipment: 'Equipos', categories: 'Categorías', labs: 'Laboratorios',
  locations: 'Ubicaciones', subjects: 'Materias', projects: 'Proyectos', activities: 'Actividades',
  users: 'Usuarios', reports: 'Reportes', audit: 'Auditoría', settings: 'Configuración',
  'equipment-detail': 'Detalle de equipo', 'loan-detail': 'Detalle de préstamo',
  'loan-wizard': 'Nueva solicitud', 'equipment-form': 'Registrar equipo'
};

function Sidebar({ route, navigate, collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const baseKey = route.split(':')[0];
  const activeMap = { 'equipment-detail': 'equipment', 'equipment-form': 'equipment', 'loan-detail': 'loans', 'loan-wizard': 'loans' };
  const active = activeMap[baseKey] || baseKey;
  const w = collapsed ? 68 : 246;
  return (
    <>
      {mobileOpen && <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 90 }} className="sb-overlay" />}
      <aside className={`sb ${mobileOpen ? 'sb-mobile-open' : ''}`} style={{ width: w, background: 'linear-gradient(180deg, var(--sidebar-bg), var(--sidebar-bg-2))', display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width .2s', zIndex: 100, position: 'relative' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '16px 0' : '16px 16px', height: 60, justifyContent: collapsed ? 'center' : 'flex-start', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, padding: 3, boxShadow: '0 0 0 1px rgba(255,255,255,.1)' }}>
            <img src={(window.__resources&&window.__resources.logoMark)||'assets/logo-mark.png'} alt="SILAB FCI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          {!collapsed &&
          <div style={{ lineHeight: 1.1, overflow: 'hidden' }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '.01em' }}>SIILAB <span style={{ color: 'var(--lime-400)' }}>FCI</span></div>
              <div style={{ fontSize: 10, color: 'var(--sidebar-text-dim)', whiteSpace: 'nowrap' }}>Infraestructura y Laboratorios</div>
            </div>
          }
        </div>

        <nav className="scroll-y sb-nav" style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowX: 'hidden' }}>
          {NAV.map((grp, gi) =>
          <div key={gi} style={{ marginBottom: 6 }}>
              {!collapsed && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--sidebar-text-dim)', padding: '10px 10px 5px' }}>{grp.section}</div>}
              {collapsed && gi > 0 && <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,.08)', margin: '8px 6px' }} />}
              {grp.items.map((it) => {
              const on = active === it.key;
              return (
                <button key={it.key} onClick={() => {navigate(it.key);setMobileOpen(false);}} title={collapsed ? it.label : ''}
                style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', height: 38, padding: collapsed ? 0 : '0 10px', justifyContent: collapsed ? 'center' : 'flex-start',
                  border: 'none', borderRadius: 9, background: on ? 'var(--sidebar-active)' : 'transparent', color: on ? '#fff' : 'var(--sidebar-text)',
                  fontSize: 13, fontWeight: on ? 600 : 500, textAlign: 'left', position: 'relative', transition: 'background .12s, color .12s', marginBottom: 1 }}
                onMouseEnter={(e) => {if (!on) e.currentTarget.style.background = 'rgba(255,255,255,.06)';}}
                onMouseLeave={(e) => {if (!on) e.currentTarget.style.background = 'transparent';}}>
                    {on && <span style={{ position: 'absolute', left: collapsed ? 6 : -2, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: 3, background: 'var(--sidebar-active-bar)' }} />}
                    <Icon name={it.icon} size={18} sw={on ? 2.1 : 1.9} />
                    {!collapsed && <span style={{ flex: 1 }}>{it.label}</span>}
                    {!collapsed && it.badge && <span style={{ fontSize: 10.5, fontWeight: 700, background: 'var(--lime-500)', color: '#0c3b22', borderRadius: 20, minWidth: 18, height: 18, padding: '0 5px', display: 'grid', placeItems: 'center' }}>{it.badge}</span>}
                  </button>);

            })}
            </div>
          )}
        </nav>

        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,.08)', flexShrink: 0 }}>
          <button onClick={() => setCollapsed((c) => !c)} className="sb-collapse"
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', height: 34, padding: collapsed ? 0 : '0 10px', justifyContent: collapsed ? 'center' : 'flex-start', border: 'none', borderRadius: 8, background: 'transparent', color: 'var(--sidebar-text-dim)', fontSize: 12.5, fontWeight: 500 }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.06)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <span style={{ transform: collapsed ? 'rotate(180deg)' : 'none', display: 'inline-flex', transition: 'transform .2s' }}><Icon name="chevronsLeft" size={17} /></span>
            {!collapsed && <span>Contraer menú</span>}
          </button>
        </div>
      </aside>
    </>);

}

function Header({ route, navigate, theme, setTheme, onMenu, openSpotlight, user, setUser }) {
  const baseKey = route.split(':')[0];
  const [notifOpen, setNotifOpen] = useStateS(false);
  const [profileOpen, setProfileOpen] = useStateS(false);
  const [quickOpen, setQuickOpen] = useStateS(false);
  const notifRef = useRefS(null),profRef = useRefS(null),quickRef = useRefS(null);
  useEffectS(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profRef.current && !profRef.current.contains(e.target)) setProfileOpen(false);
      if (quickRef.current && !quickRef.current.contains(e.target)) setQuickOpen(false);
    };
    document.addEventListener('mousedown', h);return () => document.removeEventListener('mousedown', h);
  }, []);

  const crumbDetail = { 'equipment-detail': ['Equipos', 'equipment'], 'loan-detail': ['Préstamos', 'loans'], 'loan-wizard': ['Préstamos', 'loans'], 'equipment-form': ['Equipos', 'equipment'] };
  const parent = crumbDetail[baseKey];

  return (
    <header style={{ height: 60, flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', position: 'sticky', top: 0, zIndex: 60 }}>
      <button className="btn btn-ghost btn-icon hdr-menu" onClick={onMenu} style={{ display: 'none' }}><Icon name="menu" size={19} /></button>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        <span style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 500 }} className="crumb-home">SILAB</span>
        <Icon name="chevronRight" size={13} style={{ color: 'var(--text-3)' }} className="crumb-home" />
        {parent && <>
          <button onClick={() => navigate(parent[1])} style={{ background: 'none', border: 'none', fontSize: 12.5, color: 'var(--text-3)', fontWeight: 500, padding: 0 }}>{parent[0]}</button>
          <Icon name="chevronRight" size={13} style={{ color: 'var(--text-3)' }} />
        </>}
        <span style={{ fontSize: 14.5, color: 'var(--text)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ROUTE_TITLES[baseKey] || 'SILAB'}</span>
      </div>

      {/* Search */}
      <button onClick={openSpotlight} className="hdr-search" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 9, height: 36, padding: '0 12px', minWidth: 230, maxWidth: 360, flex: '0 1 320px', border: '1px solid var(--border-2)', borderRadius: 10, background: 'var(--surface-2)', color: 'var(--text-3)', fontSize: 13, cursor: 'text' }}>
        <Icon name="search" size={16} />
        <span style={{ flex: 1, textAlign: 'left' }}>Buscar equipos, préstamos…</span>
        <span className="kbd">⌘K</span>
      </button>

      {/* Quick actions */}
      <div ref={quickRef} style={{ position: 'relative' }} className="hdr-quick">
        <button className="btn btn-primary btn-sm" onClick={() => setQuickOpen((o) => !o)} style={{ height: 36 }}><Icon name="plus" size={15} />Acciones<Icon name="chevronDown" size={13} /></button>
        {quickOpen &&
        <div className="card fade-in" style={{ position: 'absolute', right: 0, top: '112%', zIndex: 70, minWidth: 210, padding: 5, boxShadow: 'var(--shadow-lg)', animationDuration: '.12s' }}>
            {[['equipment-form', 'plus', 'Registrar equipo'], ['loan-wizard', 'loans', 'Crear préstamo'], ['returns', 'returns', 'Registrar devolución'], ['maintenance', 'wrench', 'Nuevo mantenimiento'], ['reports', 'fileText', 'Generar reporte']].map(([k, ic, lb]) =>
          <button key={k} onClick={() => {setQuickOpen(false);navigate(k);}} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 9px', border: 'none', background: 'transparent', borderRadius: 7, fontSize: 13, fontWeight: 500, color: 'var(--text)', textAlign: 'left' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><Icon name={ic} size={15} style={{ color: 'var(--text-3)' }} />{lb}</button>
          )}
          </div>
        }
      </div>

      {/* Theme */}
      <button className="btn btn-ghost btn-icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Cambiar tema" style={{ height: 36, width: 36 }}>
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
      </button>

      {/* Notifications */}
      <div ref={notifRef} style={{ position: 'relative' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => setNotifOpen((o) => !o)} style={{ height: 36, width: 36, position: 'relative' }}>
          <Icon name="bell" size={17} />
          <span style={{ position: 'absolute', top: 6, right: 7, width: 7, height: 7, borderRadius: '50%', background: 'var(--st-red)', border: '1.5px solid var(--surface)' }} />
        </button>
        {notifOpen &&
        <div className="card fade-in" style={{ position: 'absolute', right: 0, top: '112%', zIndex: 70, width: 320, padding: 0, boxShadow: 'var(--shadow-lg)', animationDuration: '.12s', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>Notificaciones</span>
              <span className="badge badge-red">4 nuevas</span>
            </div>
            <div style={{ maxHeight: 290, overflowY: 'auto' }}>
              {DB.alerts.map((a, i) =>
            <div key={i} onClick={() => {setNotifOpen(false);navigate(a.type === 'pend' ? 'loans' : a.type === 'mant' ? 'maintenance' : a.type === 'stock' ? 'inventory' : 'loans');}}
            style={{ display: 'flex', gap: 10, padding: '11px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: 'grid', placeItems: 'center', background: `var(--st-${a.color === 'red' ? 'red' : a.color}-bg)`, color: `var(--st-${a.color === 'red' ? 'red' : a.color})` }}><Icon name={a.icon} size={15} /></span>
                  <div><div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{a.title}</div><div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>{a.desc}</div></div>
                </div>
            )}
            </div>
            <button onClick={() => {setNotifOpen(false);}} style={{ width: '100%', padding: '10px', border: 'none', background: 'var(--surface-2)', color: 'var(--primary)', fontWeight: 600, fontSize: 12.5 }}>Ver todas las alertas</button>
          </div>
        }
      </div>

      {/* Profile */}
      <div ref={profRef} style={{ position: 'relative' }}>
        <button onClick={() => setProfileOpen((o) => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 6px 0 4px', border: 'none', background: 'transparent', borderRadius: 10 }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
          <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--forest-600), var(--lime-500))', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12.5, fontWeight: 700 }}>{user.initials}</span>
          <div className="hdr-profile-name" style={{ lineHeight: 1.15, textAlign: 'left' }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>{user.name}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{user.role}</div>
          </div>
          <Icon name="chevronDown" size={13} style={{ color: 'var(--text-3)' }} />
        </button>
        {profileOpen &&
        <div className="card fade-in" style={{ position: 'absolute', right: 0, top: '108%', zIndex: 70, width: 248, padding: 6, boxShadow: 'var(--shadow-lg)', animationDuration: '.12s' }}>
            <div style={{ padding: '10px 10px 12px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{user.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{user.email}</div>
            </div>
            <div style={{ padding: '4px 8px 6px', fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Cambiar vista por rol</div>
            {['Administrador', 'Coordinación de laboratorios', 'Decano', 'Director de programa'].map((r) =>
          <button key={r} onClick={() => {setUser((u) => ({ ...u, role: r }));setProfileOpen(false);if (r === 'Decano') navigate('dashboard:dean');else if (r === 'Director de programa') navigate('dashboard:director');else if (r === 'Coordinación de laboratorios') navigate('dashboard:coord');else navigate('dashboard');}}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 9px', border: 'none', background: user.role === r ? 'var(--primary-soft)' : 'transparent', borderRadius: 7, fontSize: 12.5, fontWeight: user.role === r ? 700 : 500, color: user.role === r ? 'var(--primary)' : 'var(--text)', textAlign: 'left' }}
          onMouseEnter={(e) => {if (user.role !== r) e.currentTarget.style.background = 'var(--surface-3)';}} onMouseLeave={(e) => {if (user.role !== r) e.currentTarget.style.background = 'transparent';}}>
                <Icon name="user" size={14} />{r}{user.role === r && <Icon name="check" size={14} style={{ marginLeft: 'auto' }} />}
              </button>
          )}
            <hr className="divider" style={{ margin: '6px 0' }} />
            <button onClick={() => {setProfileOpen(false);navigate('settings');}} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 9px', border: 'none', background: 'transparent', borderRadius: 7, fontSize: 12.5, fontWeight: 500, color: 'var(--text)', textAlign: 'left' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><Icon name="settings" size={14} />Configuración</button>
            <button onClick={() => {window.__silabLogout && window.__silabLogout();}} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 9px', border: 'none', background: 'transparent', borderRadius: 7, fontSize: 12.5, fontWeight: 500, color: 'var(--st-red)', textAlign: 'left' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--st-red-bg)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><Icon name="logout" size={14} />Cerrar sesión</button>
          </div>
        }
      </div>
    </header>);

}

Object.assign(window, { Sidebar, Header, NAV, ROUTE_TITLES });