/* SILAB FCI — Préstamos: lista + detalle */
const { useState: useStateLo, useMemo: useMemoLo } = React;

function Loans({ navigate }) {
  const [q, setQ] = useStateLo('');
  const [estado, setEstado] = useStateLo('');
  const [prog, setProg] = useStateLo('');
  const [tab, setTab] = useStateLo('todos');

  const tabCounts = {
    todos: DB.loans.length,
    solicitado: DB.loans.filter(l => l.estado === 'solicitado').length,
    aprobado: DB.loans.filter(l => l.estado === 'aprobado').length,
    entregado: DB.loans.filter(l => l.estado === 'entregado').length,
    vencido: DB.loans.filter(l => l.estado === 'vencido').length,
  };

  const filtered = useMemoLo(() => DB.loans.filter(l => {
    if (tab !== 'todos' && l.estado !== tab) return false;
    if (q && !(`${l.id} ${l.user} ${l.subject}`.toLowerCase().includes(q.toLowerCase()))) return false;
    if (estado && l.estado !== estado) return false;
    if (prog && l.program !== prog) return false;
    return true;
  }), [q, estado, prog, tab]);

  return (
    <Page>
      <PageHead title="Préstamos" sub={`${DB.loans.length} préstamos registrados · ${tabCounts.vencido} vencidos requieren atención`}
        actions={<>
          <button className="btn"><Icon name="download" size={15} />Exportar</button>
          <button className="btn btn-primary" onClick={() => navigate('loan-wizard')}><Icon name="plus" size={15} />Nueva solicitud</button>
        </>} />

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {[['todos', 'Todos'], ['solicitado', 'Solicitados'], ['aprobado', 'Aprobados'], ['entregado', 'Entregados'], ['vencido', 'Vencidos']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 14px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: tab === k ? 'var(--primary)' : 'var(--text-3)', borderBottom: `2px solid ${tab === k ? 'var(--primary)' : 'transparent'}`, marginBottom: -1, whiteSpace: 'nowrap' }}>
            {l}<span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: tab === k ? 'var(--primary-soft)' : 'var(--surface-3)', color: tab === k ? 'var(--primary)' : 'var(--text-3)' }}>{tabCounts[k]}</span>
          </button>
        ))}
      </div>

      <div className="card" style={{ overflow: 'visible' }}>
        <div style={{ padding: 14, borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}><Icon name="search" size={15} /></span>
            <input className="input" style={{ paddingLeft: 34, height: 34 }} placeholder="Buscar por código, usuario, materia…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <FilterSelect label="Estado" value={estado} onChange={setEstado} options={Object.keys(LOAN_STATUS)} />
          <FilterSelect label="Programa" value={prog} onChange={setProg} options={DB.PROGRAMS} />
          <button className="btn btn-sm" style={{ marginLeft: 'auto' }}><Icon name="filter" size={14} />Más filtros</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Código</th><th>Solicitante</th><th>Programa</th><th>Materia / Proyecto</th><th>Laboratorio</th><th className="num">Equipos</th><th>Préstamo</th><th>Devolución</th><th>Estado</th><th style={{ width: 44 }}></th></tr></thead>
            <tbody>
              {filtered.map(l => {
                const vencido = l.estado === 'vencido';
                return (
                  <tr key={l.id} onClick={() => navigate('loan-detail:' + l.id)} style={{ cursor: 'pointer' }}>
                    <td className="mono" style={{ fontWeight: 600, fontSize: 12 }}>{l.id}</td>
                    <td><div style={{ fontWeight: 600 }}>{l.user}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{l.role}</div></td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{l.program}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{l.subject}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{l.lab}</td>
                    <td className="num mono">{l.count}</td>
                    <td className="mono" style={{ color: 'var(--text-2)', fontSize: 12 }}>{l.date}</td>
                    <td className="mono" style={{ color: vencido ? 'var(--st-red)' : 'var(--text-2)', fontSize: 12, fontWeight: vencido ? 700 : 400 }}>{l.due}</td>
                    <td><StatusBadge status={l.estado} map={LOAN_STATUS} /></td>
                    <td onClick={ev => ev.stopPropagation()}>
                      <ActionMenu items={[
                        { icon: 'eye', label: 'Ver detalle', onClick: () => navigate('loan-detail:' + l.id) },
                        { icon: 'check', label: 'Aprobar' }, { icon: 'loans', label: 'Registrar entrega' },
                        { icon: 'returns', label: 'Registrar devolución', onClick: () => navigate('returns') },
                        { divider: true }, { icon: 'fileText', label: 'Generar PDF' }, { icon: 'x', label: 'Rechazar', danger: true },
                      ]} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState icon="loans" title="Sin préstamos" desc="No hay préstamos que coincidan con los filtros." />}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-3)' }}>{filtered.length} préstamos</div>
      </div>
    </Page>
  );
}

/* ---------------- DETALLE ---------------- */
function LoanDetail({ id, navigate }) {
  const l = DB.loans.find(x => x.id === id) || DB.loans[0];
  const order = ['solicitado', 'aprobado', 'entregado', 'devuelto'];
  const curIdx = order.indexOf(l.estado === 'vencido' ? 'entregado' : l.estado);
  const steps = order.map((s, i) => ({
    title: { solicitado: 'Solicitado', aprobado: 'Aprobado', entregado: 'Entregado', devuelto: 'Devuelto' }[s],
    icon: { solicitado: 'fileText', aprobado: 'check', entregado: 'loans', devuelto: 'returns' }[s],
    date: i <= curIdx ? `2026-0${i + 1}-${10 + i * 3} · 1${i}:${20 + i}` : '',
    state: i < curIdx ? 'done' : i === curIdx ? (l.estado === 'devuelto' && i === 3 ? 'done' : 'active') : 'pending',
  }));

  return (
    <Page max={1100}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className="btn btn-icon" onClick={() => navigate('loans')}><Icon name="chevronLeft" size={16} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><h1 style={{ margin: 0, fontSize: 21, fontWeight: 800 }} className="mono">{l.id}</h1><StatusBadge status={l.estado} map={LOAN_STATUS} /></div>
          <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-3)' }}>Solicitado el {l.date} por {l.user}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn"><Icon name="printer" size={15} />PDF</button>
          {l.estado === 'solicitado' && <><button className="btn btn-danger"><Icon name="x" size={15} />Rechazar</button><button className="btn btn-primary"><Icon name="check" size={15} />Aprobar</button></>}
          {l.estado === 'aprobado' && <button className="btn btn-primary"><Icon name="loans" size={15} />Registrar entrega</button>}
          {(l.estado === 'entregado' || l.estado === 'vencido') && <button className="btn btn-primary" onClick={() => navigate('returns')}><Icon name="returns" size={15} />Registrar devolución</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14, alignItems: 'start' }} className="detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {l.estado === 'vencido' && (
            <div style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 12, background: 'var(--st-red-bg)', border: '1px solid var(--st-red)', alignItems: 'center' }}>
              <Icon name="alert" size={20} style={{ color: 'var(--st-red)' }} />
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--st-red)' }}>Devolución vencida</div><div style={{ fontSize: 12, color: 'var(--text-2)' }}>La fecha estimada de devolución ({l.due}) ya pasó. Contacta al solicitante.</div></div>
              <button className="btn btn-sm"><Icon name="mail" size={13} />Notificar</button>
            </div>
          )}
          <div className="card card-pad">
            <CardTitle title="Información del solicitante" icon="user" />
            <div style={grid2}>
              <InfoRow label="Solicitante">{l.user}</InfoRow><InfoRow label="Tipo de usuario">{l.role}</InfoRow>
              <InfoRow label="Programa">{l.program}</InfoRow><InfoRow label="Profesor responsable">{l.prof}</InfoRow>
              <InfoRow label="Materia / contexto">{l.subject}</InfoRow><InfoRow label="Laboratorio de uso">{l.lab}</InfoRow>
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-pad" style={{ paddingBottom: 12 }}><CardTitle title={`Equipos prestados (${l.items.length})`} icon="inventory" /></div>
            <table className="tbl">
              <thead><tr><th>Código</th><th>Equipo</th><th className="num">Cantidad</th><th>Entrega</th><th>Devolución</th></tr></thead>
              <tbody>{l.items.map((it, i) => (
                <tr key={i}><td className="mono" style={{ fontWeight: 600, fontSize: 12 }}>{it.id}</td><td style={{ fontWeight: 600 }}>{it.name}</td><td className="num mono">{it.qty}</td>
                  <td><span className="badge badge-green"><span className="dot"/>OK</span></td>
                  <td>{l.estado === 'devuelto' ? <span className="badge badge-green"><span className="dot"/>Devuelto</span> : <span className="badge badge-gray"><span className="dot"/>Pendiente</span>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <div className="card card-pad">
            <CardTitle title="Observaciones" icon="fileText" />
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>Equipos solicitados para prácticas de la materia {l.subject}. El solicitante se compromete a devolver en las mismas condiciones. Uso exclusivo en {l.lab}.</p>
          </div>
        </div>

        {/* Timeline column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card card-pad">
            <CardTitle title="Línea de tiempo" icon="activities" />
            <Timeline steps={steps} />
          </div>
          <div className="card card-pad">
            <CardTitle title="Resumen" icon="fileText" />
            <InfoRow label="Fecha de préstamo" mono>{l.date}</InfoRow>
            <InfoRow label="Devolución estimada" mono>{l.due}</InfoRow>
            <InfoRow label="Total de equipos" mono>{l.count}</InfoRow>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Estado</span><StatusBadge status={l.estado} map={LOAN_STATUS} /></div>
          </div>
        </div>
      </div>
    </Page>
  );
}

Object.assign(window, { Loans, LoanDetail });
