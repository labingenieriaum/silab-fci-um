/* SILAB FCI — Dashboards (general + roles) */
const { useState: useStateD } = React;

function Page({ children, max }) {
  return <div className="fade-in" style={{ padding: '20px 22px', maxWidth: max || 1500, margin: '0 auto' }}>{children}</div>;
}
function PageHead({ title, sub, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-.02em' }}>{title}</h1>
        {sub && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>{sub}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

const invStateData = () => {
  const e = DB.equipment;
  return [
    { label: 'Disponibles', value: DB.kpis.dispEq, color: 'var(--st-green)' },
    { label: 'Prestados', value: DB.kpis.prestEq, color: 'var(--st-blue)' },
    { label: 'En mantenimiento', value: DB.kpis.mantEq, color: 'var(--st-amber)' },
    { label: 'Dañados / baja', value: DB.kpis.danEq, color: 'var(--st-red)' },
  ];
};

function AlertCard({ a, navigate }) {
  const route = { vencido: 'loans', mant: 'maintenance', stock: 'inventory', pend: 'loans' }[a.type];
  return (
    <div style={{ display: 'flex', gap: 12, padding: 13, borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface-2)', alignItems: 'flex-start' }}>
      <span style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, display: 'grid', placeItems: 'center', background: `var(--st-${a.color}-bg)`, color: `var(--st-${a.color})` }}><Icon name={a.icon} size={17} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{a.title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{a.desc}</div>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(route)} style={{ color: 'var(--primary)', flexShrink: 0 }}>{a.cta}<Icon name="chevronRight" size={13} /></button>
    </div>
  );
}

function Dashboard({ navigate, user }) {
  const k = DB.kpis;
  return (
    <Page>
      <PageHead title={`Hola, ${user.name.split(' ')[0]} 👋`} sub="Resumen general del inventario y la operación · Periodo 2026-1"
        actions={<>
          <button className="btn"><Icon name="calendar" size={15} />Junio 2026</button>
          <button className="btn"><Icon name="download" size={15} />Exportar</button>
          <button className="btn btn-primary" onClick={() => navigate('loan-wizard')}><Icon name="plus" size={15} />Nuevo préstamo</button>
        </>} />

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }} className="kpi-grid">
        <KpiCard icon="inventory" label="Total de equipos" value={k.totalEq} tone="primary" delta="+3.2%" deltaUp sub="en 7 laboratorios" onClick={() => navigate('inventory')} />
        <KpiCard icon="check" label="Disponibles" value={k.dispEq} tone="green" sub={`${Math.round(k.dispEq/k.totalEq*100)}% del inventario`} onClick={() => navigate('inventory')} />
        <KpiCard icon="loans" label="Prestados" value={k.prestEq} tone="blue" delta="+12%" deltaUp sub="en uso actualmente" onClick={() => navigate('loans')} />
        <KpiCard icon="alert" label="Dañados" value={k.danEq} tone="red" sub="requieren revisión" onClick={() => navigate('maintenance')} />
        <KpiCard icon="wrench" label="En mantenimiento" value={k.mantEq} tone="amber" sub="2 superan el SLA" onClick={() => navigate('maintenance')} />
        <KpiCard icon="loans" label="Préstamos activos" value={k.prestActivos} tone="blue" sub="entregados y aprobados" onClick={() => navigate('loans')} />
        <KpiCard icon="clock" label="Préstamos vencidos" value={k.prestVencidos} tone="red" delta="+2" sub="con devolución atrasada" onClick={() => navigate('loans')} />
        <KpiCard icon="bell" label="Solicitudes pendientes" value={k.pendientes} tone="purple" sub="esperan aprobación" onClick={() => navigate('loans')} />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 14, marginBottom: 16 }} className="chart-row">
        <div className="card card-pad">
          <CardTitle title="Préstamos por mes" sub="Evolución de préstamos en 2026" icon="trendUp"
            action={<Segmented options={[{ value: 'm', label: 'Mes' }, { value: 'q', label: 'Trimestre' }]} value="m" onChange={() => {}} />} />
          <AreaChart data={DB.loansByMonth} height={210} />
        </div>
        <div className="card card-pad">
          <CardTitle title="Estado del inventario" sub="Distribución actual" icon="layers" />
          <DonutChart data={invStateData()} centerValue={DB.kpis.totalEq} centerLabel="Equipos" />
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }} className="chart-row-3">
        <div className="card card-pad">
          <CardTitle title="Equipos por categoría" icon="categories" />
          <BarChart data={DB.byCategory.slice(0, 6)} height={170} />
        </div>
        <div className="card card-pad">
          <CardTitle title="Uso por laboratorio" sub="Préstamos acumulados" icon="labs" />
          <HBarChart data={DB.byLab} color="var(--tech-600)" />
        </div>
        <div className="card card-pad">
          <CardTitle title="Préstamos por programa" icon="graduation" />
          <HBarChart data={DB.byProgram} color="var(--lime-600)" />
        </div>
      </div>

      {/* Top equipos + Alertas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }} className="chart-row">
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-pad" style={{ paddingBottom: 0 }}>
            <CardTitle title="Top 10 equipos más prestados" sub="Mayor demanda del semestre" icon="reports"
              action={<button className="btn btn-ghost btn-sm" onClick={() => navigate('reports')}>Ver reporte<Icon name="chevronRight" size={13} /></button>} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th style={{ width: 36 }}>#</th><th>Equipo</th><th>Categoría</th><th>Laboratorio</th><th className="num">Préstamos</th></tr></thead>
              <tbody>
                {DB.topEquip.map((e, i) => (
                  <tr key={e.id} onClick={() => navigate('equipment-detail:' + e.id)} style={{ cursor: 'pointer' }}>
                    <td style={{ color: 'var(--text-3)', fontWeight: 700 }}>{i + 1}</td>
                    <td><div style={{ fontWeight: 600 }}>{e.name}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }} className="mono">{e.id} · {e.brand}</div></td>
                    <td><span className="badge badge-gray">{e.cat}</span></td>
                    <td style={{ color: 'var(--text-2)' }}>{e.labCode}</td>
                    <td className="num"><span style={{ fontWeight: 700 }} className="mono">{e.uses}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card card-pad">
          <CardTitle title="Alertas" sub="Requieren tu atención" icon="alert" action={<span className="badge badge-red">{DB.alerts.length}</span>} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DB.alerts.map((a, i) => <AlertCard key={i} a={a} navigate={navigate} />)}
          </div>
        </div>
      </div>
    </Page>
  );
}

Object.assign(window, { Dashboard, Page, PageHead, invStateData, AlertCard });
