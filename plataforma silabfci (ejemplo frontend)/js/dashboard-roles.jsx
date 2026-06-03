/* SILAB FCI — Role dashboards: Coordinación, Decano, Director */

/* ---------------- COORDINACIÓN (operativo) ---------------- */
function DashCoord({ navigate }) {
  const recent = DB.loans.slice(0, 7);
  const labAvail = DB.LABS.map(l => {
    const eqs = DB.equipment.filter(e => e.lab === l.id);
    const disp = eqs.reduce((s, e) => s + e.disp, 0), tot = eqs.reduce((s, e) => s + e.total, 0);
    return { ...l, disp, tot, pct: tot ? Math.round(disp / tot * 100) : 0 };
  });
  return (
    <Page>
      <PageHead title="Panel de Coordinación de Laboratorios" sub="Vista operativa del día · Martes 2 de junio, 2026"
        actions={<>
          <button className="btn btn-accent" onClick={() => navigate('equipment-form')}><Icon name="plus" size={15} />Registrar equipo</button>
          <button className="btn btn-primary" onClick={() => navigate('loan-wizard')}><Icon name="loans" size={15} />Crear préstamo</button>
        </>} />

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }} className="kpi-grid">
        {[['Registrar equipo', 'plus', 'equipment-form', 'primary'], ['Crear préstamo', 'loans', 'loan-wizard', 'blue'], ['Registrar devolución', 'returns', 'returns', 'green'], ['Generar reporte', 'fileText', 'reports', 'amber']].map(([lb, ic, rt, tn]) => (
          <button key={lb} onClick={() => navigate(rt)} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: '1px solid var(--border)', textAlign: 'left', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--primary)'; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', background: `var(--st-${tn === 'primary' ? 'green' : tn}-bg)`, color: `var(--st-${tn === 'primary' ? 'green' : tn})` }}><Icon name={ic} size={18} /></span>
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>{lb}</span>
            <Icon name="arrowRight" size={15} style={{ marginLeft: 'auto', color: 'var(--text-3)' }} />
          </button>
        ))}
      </div>

      {/* KPIs operativos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 16 }} className="kpi-grid">
        <KpiCard icon="loans" label="Préstamos del día" value="14" tone="blue" sub="6 entregados, 8 por entregar" />
        <KpiCard icon="returns" label="Equipos por devolver" value="23" tone="amber" sub="hoy y mañana" />
        <KpiCard icon="bell" label="Solicitudes pendientes" value={DB.kpis.pendientes} tone="purple" sub="esperan aprobación" onClick={() => navigate('loans')} />
        <KpiCard icon="alert" label="Equipos dañados" value={DB.kpis.danEq} tone="red" sub="por diagnosticar" />
        <KpiCard icon="wrench" label="Mantenimientos activos" value="5" tone="amber" sub="3 en proceso" onClick={() => navigate('maintenance')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }} className="chart-row">
        {/* Últimos movimientos */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-pad" style={{ paddingBottom: 0 }}>
            <CardTitle title="Últimos movimientos" sub="Préstamos y devoluciones recientes" icon="activities"
              action={<button className="btn btn-ghost btn-sm" onClick={() => navigate('loans')}>Ver todos<Icon name="chevronRight" size={13} /></button>} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Código</th><th>Solicitante</th><th>Equipos</th><th>Estado</th><th>Devolución</th></tr></thead>
              <tbody>
                {recent.map(l => (
                  <tr key={l.id} onClick={() => navigate('loan-detail:' + l.id)} style={{ cursor: 'pointer' }}>
                    <td className="mono" style={{ fontWeight: 600, fontSize: 12 }}>{l.id}</td>
                    <td><div style={{ fontWeight: 600 }}>{l.user}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{l.program}</div></td>
                    <td className="num">{l.count}</td>
                    <td><StatusBadge status={l.estado} map={LOAN_STATUS} /></td>
                    <td style={{ color: 'var(--text-2)' }} className="mono">{l.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disponibilidad por laboratorio */}
        <div className="card card-pad">
          <CardTitle title="Disponibilidad por laboratorio" sub="% de equipos disponibles" icon="labs" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {labAvail.map(l => (
              <div key={l.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{l.name}</span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{l.disp}/{l.tot}</span>
                </div>
                <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${l.pct}%`, height: '100%', borderRadius: 5, background: l.pct > 60 ? 'var(--st-green)' : l.pct > 30 ? 'var(--st-amber)' : 'var(--st-red)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}

/* ---------------- DECANO (ejecutivo) ---------------- */
function StatBig({ label, value, sub, tone = 'primary', icon }) {
  return (
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)' }}><Icon name={icon} size={15} /><span style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</span></div>
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.02em', color: `var(--${tone === 'primary' ? 'primary' : 'text'})` }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{sub}</div>
    </div>
  );
}
function DashDean({ navigate }) {
  const totalValue = DB.equipment.reduce((s, e) => s + e.value * e.total, 0);
  const projUse = [{ label: 'Brazo robótico FCI', value: 86 }, { label: 'Monitoreo ambiental', value: 64 }, { label: 'Telemedicina rural', value: 52 }, { label: 'Smart Campus IoT', value: 47 }, { label: 'Energía solar UM', value: 33 }];
  return (
    <Page max={1400}>
      <PageHead title="Vista ejecutiva — Decanatura" sub="Estado general del inventario de la Facultad de Ciencias e Ingeniería"
        actions={<>
          <button className="btn"><Icon name="calendar" size={15} />2026-1</button>
          <button className="btn btn-primary" onClick={() => navigate('reports')}><Icon name="fileText" size={15} />Reporte ejecutivo</button>
        </>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 }} className="kpi-grid">
        <StatBig icon="dollar" label="Valor estimado del inventario" value={DB.fmtMoneyShort(totalValue)} sub="+8.4% vs. semestre anterior" />
        <StatBig icon="inventory" label="Equipos activos" value={DB.kpis.totalEq} sub={`${DB.kpis.danEq} dados de baja`} tone="text" />
        <StatBig icon="trendUp" label="Tasa de utilización" value="73%" sub="promedio de la facultad" tone="text" />
        <StatBig icon="check" label="Eficiencia de devolución" value="94%" sub="préstamos devueltos a tiempo" tone="text" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 16 }} className="chart-row">
        <div className="card card-pad">
          <CardTitle title="Tendencia mensual de préstamos" sub="Indicador de actividad de laboratorios" icon="trendUp" />
          <AreaChart data={DB.loansByMonth} height={220} />
        </div>
        <div className="card card-pad">
          <CardTitle title="Uso de laboratorios por programa" icon="graduation" />
          <DonutChart data={DB.byProgram.map((p, i) => ({ label: p.label, value: p.value, color: ['var(--forest-700)', 'var(--lime-500)', 'var(--tech-600)', 'var(--st-amber)', 'var(--st-purple)'][i] }))} centerLabel="Préstamos" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }} className="chart-row-3">
        <div className="card card-pad">
          <CardTitle title="Equipos más utilizados" sub="Top 5 de la facultad" icon="reports" />
          <HBarChart data={DB.topEquip.slice(0, 5).map(e => ({ label: e.name.split(' ').slice(0,2).join(' '), value: e.uses }))} />
        </div>
        <div className="card card-pad">
          <CardTitle title="Proyectos que más usan recursos" icon="projects" />
          <HBarChart data={projUse} color="var(--tech-600)" />
        </div>
        <div className="card card-pad">
          <CardTitle title="Equipos dañados / dados de baja" icon="alert" />
          <DonutChart size={148} data={[{ label: 'Operativos', value: DB.kpis.totalEq - DB.kpis.danEq, color: 'var(--st-green)' }, { label: 'Dañados', value: DB.kpis.danEq, color: 'var(--st-red)' }, { label: 'En mant.', value: DB.kpis.mantEq, color: 'var(--st-amber)' }]} centerLabel="Total" centerValue={DB.kpis.totalEq} />
        </div>
      </div>
    </Page>
  );
}

/* ---------------- DIRECTOR DE PROGRAMA ---------------- */
function DashDirector({ navigate }) {
  const prog = 'Ing. de Sistemas';
  const bySubject = [{ label: 'Sistemas Embebidos', value: 64 }, { label: 'Redes de Datos', value: 51 }, { label: 'Circuitos II', value: 43 }, { label: 'Control Automático', value: 28 }, { label: 'Física III', value: 22 }];
  const profs = DB.PEOPLE.filter(p => p[1] === 'Profesor').slice(0, 4);
  const progLoans = DB.loans.filter(l => l.program === prog).slice(0, 6);
  return (
    <Page>
      <PageHead title={`Dirección de Programa — ${prog}`} sub="Indicadores de uso de laboratorios y equipos del programa · 2026-1"
        actions={<><button className="btn"><Icon name="graduation" size={15} />{prog}</button><button className="btn btn-primary" onClick={() => navigate('reports')}><Icon name="download" size={15} />Exportar</button></>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 }} className="kpi-grid">
        <KpiCard icon="users" label="Estudiantes con préstamos" value="142" tone="primary" sub="este semestre" />
        <KpiCard icon="loans" label="Préstamos activos" value="38" tone="blue" sub="del programa" onClick={() => navigate('loans')} />
        <KpiCard icon="subjects" label="Materias con uso de lab" value="9" tone="purple" sub="de 14 materias" />
        <KpiCard icon="projects" label="Proyectos asociados" value="7" tone="green" sub="usando recursos FCI" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }} className="chart-row">
        <div className="card card-pad">
          <CardTitle title="Materias con mayor uso de laboratorio" icon="subjects" />
          <HBarChart data={bySubject} color="var(--forest-700)" />
        </div>
        <div className="card card-pad">
          <CardTitle title="Profesores que más solicitan equipos" icon="user" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {profs.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: i < profs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--forest-600), var(--lime-500))', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 700 }}>{p[0].split(' ').map(x=>x[0]).slice(0,2).join('')}</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{p[0]}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p[2]}</div></div>
                <span className="badge badge-blue">{28 - i * 6} préstamos</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="card-pad" style={{ paddingBottom: 0 }}>
          <CardTitle title="Préstamos activos del programa" sub={prog} icon="loans" action={<button className="btn btn-ghost btn-sm" onClick={() => navigate('loans')}>Ver todos<Icon name="chevronRight" size={13} /></button>} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Código</th><th>Estudiante / Profesor</th><th>Materia</th><th>Equipos</th><th>Estado</th><th>Devolución</th></tr></thead>
            <tbody>
              {progLoans.map(l => (
                <tr key={l.id} onClick={() => navigate('loan-detail:' + l.id)} style={{ cursor: 'pointer' }}>
                  <td className="mono" style={{ fontWeight: 600, fontSize: 12 }}>{l.id}</td>
                  <td style={{ fontWeight: 600 }}>{l.user}</td>
                  <td style={{ color: 'var(--text-2)' }}>{l.subject}</td>
                  <td className="num">{l.count}</td>
                  <td><StatusBadge status={l.estado} map={LOAN_STATUS} /></td>
                  <td className="mono" style={{ color: 'var(--text-2)' }}>{l.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Page>
  );
}

Object.assign(window, { DashCoord, DashDean, DashDirector, StatBig });
