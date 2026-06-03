/* SILAB FCI — Reportes */
const { useState: useStateRep } = React;

const REPORTS = [
  { id: 'inv-full', icon: 'inventory', title: 'Inventario completo', desc: 'Todos los equipos de la facultad con su estado actual.', tone: 'primary' },
  { id: 'inv-lab', icon: 'labs', title: 'Inventario por laboratorio', desc: 'Equipos agrupados por laboratorio y ubicación.', tone: 'blue' },
  { id: 'inv-cat', icon: 'categories', title: 'Inventario por categoría', desc: 'Distribución de equipos por categoría.', tone: 'purple' },
  { id: 'loan-active', icon: 'loans', title: 'Préstamos activos', desc: 'Préstamos entregados pendientes de devolución.', tone: 'blue' },
  { id: 'loan-due', icon: 'clock', title: 'Préstamos vencidos', desc: 'Préstamos con devolución atrasada.', tone: 'red' },
  { id: 'hist-user', icon: 'user', title: 'Historial por usuario', desc: 'Préstamos y devoluciones por persona.', tone: 'green' },
  { id: 'use-subject', icon: 'subjects', title: 'Uso por materia', desc: 'Equipos y laboratorios usados por materia.', tone: 'amber' },
  { id: 'use-project', icon: 'projects', title: 'Uso por proyecto', desc: 'Recursos asignados a cada proyecto.', tone: 'purple' },
  { id: 'maint', icon: 'wrench', title: 'Equipos en mantenimiento', desc: 'Mantenimientos programados y en proceso.', tone: 'amber' },
  { id: 'damaged', icon: 'alert', title: 'Equipos dañados', desc: 'Equipos dañados o dados de baja.', tone: 'red' },
  { id: 'exec', icon: 'reports', title: 'Reporte ejecutivo · Decanatura', desc: 'Resumen ejecutivo para toma de decisiones.', tone: 'primary' },
];

function Reports({ navigate }) {
  const [sel, setSel] = useStateRep(null);
  const r = REPORTS.find(x => x.id === sel);
  return (
    <Page>
      <PageHead title="Reportes" sub="Genera, previsualiza y descarga reportes en PDF o Excel."
        actions={<button className="btn"><Icon name="calendar" size={15} />Periodo 2026-1</button>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }} className="reports-grid">
        {REPORTS.map(rep => (
          <div key={rep.id} className="card card-pad" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10, transition: 'box-shadow .15s, transform .15s, border-color .15s' }}
            onClick={() => setSel(rep.id)}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--border)'; }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, display: 'grid', placeItems: 'center', background: `var(--st-${rep.tone === 'primary' ? 'green' : rep.tone}-bg)`, color: `var(--st-${rep.tone === 'primary' ? 'green' : rep.tone})` }}><Icon name={rep.icon} size={20} /></span>
              <Icon name="arrowRight" size={16} style={{ color: 'var(--text-3)' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{rep.title}</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{rep.desc}</p>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 6 }}>
              <button className="btn btn-sm" onClick={e => { e.stopPropagation(); setSel(rep.id); }}><Icon name="fileText" size={13} />PDF</button>
              <button className="btn btn-sm" onClick={e => { e.stopPropagation(); setSel(rep.id); }}><Icon name="fileSpreadsheet" size={13} />Excel</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!sel} onClose={() => setSel(null)} title={r?.title} sub="Configura filtros y previsualiza antes de descargar" width={680}
        footer={<><button className="btn" onClick={() => setSel(null)}>Cerrar</button><button className="btn"><Icon name="fileSpreadsheet" size={15} />Descargar Excel</button><button className="btn btn-primary"><Icon name="download" size={15} />Descargar PDF</button></>}>
        {r && <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: 1, minWidth: 140 }}><label>Desde</label><input className="input" type="date" defaultValue="2026-01-01" /></div>
            <div className="field" style={{ flex: 1, minWidth: 140 }}><label>Hasta</label><input className="input" type="date" defaultValue="2026-06-02" /></div>
            <div className="field" style={{ flex: 1, minWidth: 140 }}><label>Laboratorio</label><select className="select"><option>Todos</option>{DB.LABS.map(l => <option key={l.id}>{l.name}</option>)}</select></div>
          </div>
          {/* Preview */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 11, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Vista previa</span>
              <span className="badge badge-green"><span className="dot"/>{DB.equipment.length} registros</span>
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              <table className="tbl">
                <thead><tr><th>Código</th><th>Nombre</th><th>Estado</th><th className="num">Disp.</th></tr></thead>
                <tbody>{DB.equipment.slice(0, 8).map(e => (
                  <tr key={e.id}><td className="mono" style={{ fontSize: 12 }}>{e.id}</td><td style={{ fontWeight: 600 }}>{e.name}</td><td><StatusBadge status={e.estado} /></td><td className="num mono">{e.disp}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>}
      </Modal>
    </Page>
  );
}

window.Reports = Reports;
