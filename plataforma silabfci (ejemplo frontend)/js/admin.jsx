/* SILAB FCI — Mantenimientos, Usuarios, Auditoría, Categorías, Config, Académicas */
const { useState: useStateA } = React;

const MAINT_STATUS = {
  programado: { label: 'Programado', cls: 'badge-purple' },
  proceso: { label: 'En proceso', cls: 'badge-amber' },
  finalizado: { label: 'Finalizado', cls: 'badge-green' },
  cancelado: { label: 'Cancelado', cls: 'badge-gray' },
};
function Maintenance({ navigate }) {
  const [open, setOpen] = useStateA(false);
  const rows = DB.equipment.slice(0, 9).map((e, i) => ({
    id: 'MT-' + (2026100 + i), eq: e.name, eqId: e.id,
    type: ['Calibración', 'Reparación', 'Preventivo', 'Diagnóstico'][i % 4],
    resp: ['Servicio técnico externo', 'Lab. de Electrónica', 'Proveedor', 'Coordinación'][i % 4],
    start: `2026-05-${String(10 + i).padStart(2, '0')}`, end: i % 3 === 0 ? '—' : `2026-05-${String(18 + i).padStart(2, '0')}`,
    cost: [280000, 420000, 0, 150000, 690000][i % 5],
    estado: ['proceso', 'finalizado', 'programado', 'finalizado', 'proceso', 'cancelado'][i % 6],
  }));
  return (
    <Page>
      <PageHead title="Mantenimientos" sub="Seguimiento de mantenimientos preventivos y correctivos."
        actions={<button className="btn btn-primary" onClick={() => setOpen(true)}><Icon name="plus" size={15} />Nuevo mantenimiento</button>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 }} className="kpi-grid">
        <KpiCard icon="wrench" label="En proceso" value="3" tone="amber" />
        <KpiCard icon="calendar" label="Programados" value="2" tone="purple" />
        <KpiCard icon="check" label="Finalizados (mes)" value="11" tone="green" />
        <KpiCard icon="dollar" label="Costo del mes" value="$2.4M" tone="primary" />
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Código</th><th>Equipo</th><th>Tipo</th><th>Responsable</th><th>Inicio</th><th>Fin</th><th className="num">Costo</th><th>Estado</th><th style={{ width: 44 }}></th></tr></thead>
            <tbody>{rows.map(m => (
              <tr key={m.id}>
                <td className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{m.id}</td>
                <td><div style={{ fontWeight: 600 }}>{m.eq}</div><div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.eqId}</div></td>
                <td>{m.type}</td><td style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{m.resp}</td>
                <td className="mono" style={{ color: 'var(--text-2)', fontSize: 12 }}>{m.start}</td><td className="mono" style={{ color: 'var(--text-2)', fontSize: 12 }}>{m.end}</td>
                <td className="num mono">{m.cost ? DB.fmtMoney(m.cost) : '—'}</td>
                <td><StatusBadge status={m.estado} map={MAINT_STATUS} /></td>
                <td><ActionMenu items={[{ icon: 'eye', label: 'Ver detalle' }, { icon: 'edit', label: 'Editar' }, { icon: 'check', label: 'Finalizar' }, { divider: true }, { icon: 'x', label: 'Cancelar', danger: true }]} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo mantenimiento" sub="Programa un mantenimiento para un equipo" width={560}
        footer={<><button className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={() => setOpen(false)}><Icon name="check" size={15} />Programar</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field"><label>Equipo *</label><select className="select">{DB.equipment.map(e => <option key={e.id}>{e.name} · {e.id}</option>)}</select></div>
          <div style={grid2}>
            <div className="field"><label>Tipo</label><select className="select"><option>Preventivo</option><option>Correctivo</option><option>Calibración</option><option>Diagnóstico</option></select></div>
            <div className="field"><label>Responsable</label><input className="input" placeholder="Servicio técnico" /></div>
            <div className="field"><label>Fecha de inicio</label><input className="input" type="date" /></div>
            <div className="field"><label>Fecha estimada fin</label><input className="input" type="date" /></div>
          </div>
          <div className="field"><label>Costo estimado (COP)</label><input className="input mono" placeholder="280.000" /></div>
          <div className="field"><label>Observaciones</label><textarea className="textarea" rows="2" /></div>
        </div>
      </Modal>
    </Page>
  );
}

/* ---------------- USUARIOS ---------------- */
const ROLE_BADGE = { 'Administrador': 'badge-purple', 'Coordinación de laboratorios': 'badge-blue', 'Decano': 'badge-green', 'Director de programa': 'badge-amber', 'Profesor': 'badge-gray', 'Estudiante': 'badge-gray', 'Monitor': 'badge-blue' };
function Users({ navigate }) {
  const [q, setQ] = useStateA(''); const [role, setRole] = useStateA('');
  const roles = ['Administrador', 'Coordinación de laboratorios', 'Decano', 'Director de programa', 'Profesor', 'Estudiante', 'Monitor'];
  const users = [
    ['Laura Ramírez', 'lramirez', 'Coordinación de laboratorios', 'Ing. Electrónica', true],
    ['Carlos Mejía', 'cmejia', 'Estudiante', 'Ing. de Sistemas', true],
    ['Andrea Torres', 'atorres', 'Profesor', 'Ing. Biomédica', true],
    ['Juan D. Patiño', 'jpatino', 'Monitor', 'Ing. de Sistemas', true],
    ['Roberto Ángel', 'rangel', 'Decano', 'Facultad CI', true],
    ['Felipe Castaño', 'fcastano', 'Director de programa', 'Ing. de Sistemas', true],
    ['Sofía Cardona', 'scardona', 'Estudiante', 'Ing. Industrial', false],
    ['Miguel Á. Ruiz', 'mruiz', 'Profesor', 'Ing. Ambiental', true],
    ['Valentina Gómez', 'vgomez', 'Estudiante', 'Ing. Electrónica', true],
    ['Admin Sistema', 'admin', 'Administrador', 'TI', true],
  ].map((u, i) => ({ name: u[0], email: `${u[1]}@umanizales.edu.co`, doc: `10${20000000 + i * 13731}`, role: u[2], prog: u[3], active: u[4] }));
  const filtered = users.filter(u => (!q || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())) && (!role || u.role === role));
  return (
    <Page>
      <PageHead title="Usuarios" sub={`${users.length} usuarios · ${users.filter(u => u.active).length} activos`}
        actions={<><button className="btn"><Icon name="download" size={15} />Exportar</button><button className="btn btn-primary"><Icon name="plus" size={15} />Nuevo usuario</button></>} />
      <div className="card" style={{ overflow: 'visible' }}>
        <div style={{ padding: 14, borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}><Icon name="search" size={15} /></span>
            <input className="input" style={{ paddingLeft: 34, height: 34 }} placeholder="Buscar por nombre o correo…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <FilterSelect label="Rol" value={role} onChange={setRole} options={roles} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Usuario</th><th>Documento</th><th>Rol</th><th>Programa</th><th>Estado</th><th style={{ width: 44 }}></th></tr></thead>
            <tbody>{filtered.map((u, i) => (
              <tr key={i}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--forest-600), var(--lime-500))', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 700, flexShrink: 0 }}>{u.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</span>
                  <div><div style={{ fontWeight: 600 }}>{u.name}</div><div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{u.email}</div></div>
                </div></td>
                <td className="mono" style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{u.doc}</td>
                <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{u.role}</span></td>
                <td style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{u.prog}</td>
                <td>{u.active ? <span className="badge badge-green"><span className="dot"/>Activo</span> : <span className="badge badge-gray"><span className="dot"/>Inactivo</span>}</td>
                <td><ActionMenu items={[{ icon: 'eye', label: 'Ver perfil' }, { icon: 'edit', label: 'Editar' }, { icon: 'loans', label: 'Ver préstamos' }, { divider: true }, { icon: 'x', label: u.active ? 'Desactivar' : 'Activar', danger: u.active }]} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </Page>
  );
}

/* ---------------- AUDITORÍA ---------------- */
const ACTION_BADGE = { CREAR: 'badge-green', EDITAR: 'badge-blue', ELIMINAR: 'badge-red', PRESTAR: 'badge-purple', DEVOLVER: 'badge-green', APROBAR: 'badge-amber' };
function Audit() {
  const [q, setQ] = useStateA(''); const [act, setAct] = useStateA('');
  const rows = DB.auditLog.filter(r => (!q || `${r.user} ${r.record}`.toLowerCase().includes(q.toLowerCase())) && (!act || r.action === act));
  return (
    <Page>
      <PageHead title="Auditoría" sub="Registro de todas las acciones realizadas en el sistema." actions={<button className="btn"><Icon name="download" size={15} />Exportar log</button>} />
      <div className="card" style={{ overflow: 'visible' }}>
        <div style={{ padding: 14, borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}><Icon name="search" size={15} /></span>
            <input className="input" style={{ paddingLeft: 34, height: 34 }} placeholder="Buscar por usuario o registro…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <FilterSelect label="Acción" value={act} onChange={setAct} options={Object.keys(ACTION_BADGE)} />
          <FilterSelect label="Fecha" value="" onChange={() => {}} options={['Hoy', 'Últimos 7 días', 'Este mes']} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Usuario</th><th>Acción</th><th>Tabla afectada</th><th>Registro</th><th>Fecha</th><th>Descripción</th></tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.user}</td>
                <td><span className={`badge ${ACTION_BADGE[r.action]}`}>{r.action}</span></td>
                <td className="mono" style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{r.table}</td>
                <td className="mono" style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{r.record}</td>
                <td className="mono" style={{ color: 'var(--text-3)', fontSize: 12 }}>{r.date}</td>
                <td style={{ color: 'var(--text-2)', fontSize: 12.5 }}>Acción {r.action.toLowerCase()} sobre {r.table} {r.record}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </Page>
  );
}

/* ---------------- CATEGORÍAS ---------------- */
function Categories() {
  const data = DB.CATS.map(c => ({ name: c, count: DB.equipment.filter(e => e.cat === c).reduce((s, e) => s + e.total, 0) || 4 }));
  return (
    <Page>
      <PageHead title="Categorías" sub="Clasificación de los equipos del inventario." actions={<button className="btn btn-primary"><Icon name="plus" size={15} />Nueva categoría</button>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 14 }} className="reports-grid">
        {data.map((c, i) => (
          <div key={c.name} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'var(--primary-soft)', color: 'var(--primary)', flexShrink: 0 }}><Icon name={['flask','cpu','locations','camera','wrench','activities','cpu','settings'][i % 8]} size={20} /></span>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>{c.count} equipos</div></div>
            <ActionMenu items={[{ icon: 'edit', label: 'Editar' }, { icon: 'trash', label: 'Eliminar', danger: true }]} />
          </div>
        ))}
      </div>
    </Page>
  );
}

/* ---------------- CONFIGURACIÓN ---------------- */
function Settings({ theme, setTheme }) {
  const sections = [
    { icon: 'building', title: 'Institución', desc: 'Datos de la facultad y la universidad' },
    { icon: 'users', title: 'Roles y permisos', desc: 'Gestión de roles del sistema' },
    { icon: 'bell', title: 'Notificaciones', desc: 'Alertas de vencimientos y stock' },
    { icon: 'loans', title: 'Reglas de préstamo', desc: 'Plazos, límites y aprobaciones' },
    { icon: 'qr', title: 'Etiquetado QR', desc: 'Formato de etiquetas e impresión' },
    { icon: 'fileText', title: 'Plantillas de reportes', desc: 'Encabezados y firmas' },
  ];
  return (
    <Page max={1000}>
      <PageHead title="Configuración" sub="Ajustes generales de la plataforma SILAB FCI." />
      <div className="card card-pad" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'var(--primary-soft)', color: 'var(--primary)' }}><Icon name={theme === 'dark' ? 'moon' : 'sun'} size={20} /></span>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>Apariencia</div><div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Tema de la interfaz</div></div>
        <Segmented options={[{ value: 'light', label: 'Claro', icon: 'sun' }, { value: 'dark', label: 'Oscuro', icon: 'moon' }]} value={theme} onChange={setTheme} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14 }} className="reports-grid">
        {sections.map(s => (
          <div key={s.title} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <span style={{ width: 40, height: 40, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'var(--surface-3)', color: 'var(--text-2)', flexShrink: 0 }}><Icon name={s.icon} size={18} /></span>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13.5 }}>{s.title}</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.desc}</div></div>
            <Icon name="chevronRight" size={16} style={{ color: 'var(--text-3)' }} />
          </div>
        ))}
      </div>
    </Page>
  );
}

/* ---------------- ACADÉMICAS (Materias, Proyectos, Actividades) ---------------- */
function AcademicModule({ kind, navigate }) {
  const cfg = {
    subjects: { title: 'Materias', sub: 'Materias que utilizan laboratorios y equipos.', icon: 'subjects', col: 'Materia',
      rows: DB.SUBJECTS.map((s, i) => ({ name: s, prog: DB.PROGRAMS[i % DB.PROGRAMS.length], prof: DB.PEOPLE.filter(p => p[1] === 'Profesor')[i % 4][0], loans: 12 + i * 7 })) },
    projects: { title: 'Proyectos', sub: 'Proyectos de investigación y aula con uso de recursos.', icon: 'projects', col: 'Proyecto',
      rows: ['Smart Campus IoT', 'Monitoreo ambiental', 'Telemedicina rural', 'Energía solar UM', 'Brazo robótico FCI', 'Visión artificial'].map((s, i) => ({ name: s, prog: DB.PROGRAMS[i % DB.PROGRAMS.length], prof: DB.PEOPLE.filter(p => p[1] === 'Profesor')[i % 4][0], loans: 8 + i * 9 })) },
    activities: { title: 'Actividades', sub: 'Actividades académicas y extracurriculares.', icon: 'activities', col: 'Actividad',
      rows: ['Semillero de Robótica', 'Hackathon FCI 2026', 'Feria de Ingeniería', 'Taller de Arduino', 'Olimpiadas de Electrónica'].map((s, i) => ({ name: s, prog: DB.PROGRAMS[i % DB.PROGRAMS.length], prof: DB.PEOPLE.filter(p => p[1] === 'Profesor')[i % 4][0], loans: 5 + i * 6 })) },
  }[kind];
  return (
    <Page>
      <PageHead title={cfg.title} sub={cfg.sub} actions={<button className="btn btn-primary"><Icon name="plus" size={15} />Nuevo</button>} />
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>{cfg.col}</th><th>Programa</th><th>Responsable</th><th className="num">Préstamos</th><th style={{ width: 44 }}></th></tr></thead>
            <tbody>{cfg.rows.map((r, i) => (
              <tr key={i} style={{ cursor: 'pointer' }}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={cfg.icon} size={16} /></span><span style={{ fontWeight: 600 }}>{r.name}</span></div></td>
                <td style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{r.prog}</td>
                <td style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{r.prof}</td>
                <td className="num"><span className="badge badge-blue">{r.loans}</span></td>
                <td><ActionMenu items={[{ icon: 'eye', label: 'Ver detalle' }, { icon: 'edit', label: 'Editar' }, { icon: 'loans', label: 'Ver préstamos', onClick: () => navigate('loans') }]} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </Page>
  );
}

Object.assign(window, { Maintenance, Users, Audit, Categories, Settings, AcademicModule, MAINT_STATUS });
