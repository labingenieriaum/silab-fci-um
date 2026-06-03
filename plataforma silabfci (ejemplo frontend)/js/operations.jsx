/* SILAB FCI — Devoluciones + Laboratorios/Ubicaciones */
const { useState: useStateR } = React;

/* ---------------- DEVOLUCIONES ---------------- */
function Returns({ navigate }) {
  const active = DB.loans.filter(l => ['entregado', 'vencido'].includes(l.estado));
  const [selLoan, setSelLoan] = useStateR(active[0]);
  const [q, setQ] = useStateR('');
  const [returned, setReturned] = useStateR({});
  const [cond, setCond] = useStateR({});
  const found = active.filter(l => !q || `${l.id} ${l.user}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <Page max={1100}>
      <PageHead title="Registrar devolución" sub="Busca un préstamo activo y registra la devolución de los equipos." />
      <div style={{ display: 'grid', gridTemplateColumns: '330px 1fr', gap: 14, alignItems: 'start' }} className="detail-grid">
        {/* Active loans list */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}><Icon name="search" size={15} /></span>
              <input className="input" style={{ paddingLeft: 34, height: 34 }} placeholder="Buscar préstamo activo…" value={q} onChange={e => setQ(e.target.value)} />
            </div>
          </div>
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            {found.map(l => (
              <button key={l.id} onClick={() => { setSelLoan(l); setReturned({}); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', border: 'none', borderBottom: '1px solid var(--border)', borderLeft: `3px solid ${selLoan?.id === l.id ? 'var(--primary)' : 'transparent'}`, background: selLoan?.id === l.id ? 'var(--primary-soft)' : 'transparent', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{l.id}</span>
                  <StatusBadge status={l.estado} map={LOAN_STATUS} />
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{l.user}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{l.count} equipos · vence {l.due}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Return form */}
        {selLoan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card card-pad">
              <CardTitle title={`Préstamo ${selLoan.id}`} sub={`${selLoan.user} · ${selLoan.program} · ${selLoan.subject}`} icon="loans"
                action={<button className="btn btn-ghost btn-sm" onClick={() => navigate('loan-detail:' + selLoan.id)}>Ver préstamo<Icon name="external" size={13} /></button>} />
              <div style={{ border: '1px solid var(--border)', borderRadius: 11, overflow: 'hidden' }}>
                <table className="tbl">
                  <thead><tr><th style={{ width: 40 }}><input type="checkbox" style={{ accentColor: 'var(--primary)' }} checked={Object.keys(returned).length === selLoan.items.length} onChange={e => setReturned(e.target.checked ? Object.fromEntries(selLoan.items.map(it => [it.id, true])) : {})} /></th><th>Equipo</th><th className="num">Cant.</th><th>Estado de devolución</th></tr></thead>
                  <tbody>{selLoan.items.map((it, i) => (
                    <tr key={i} style={{ background: returned[it.id] ? 'var(--st-green-bg)' : '' }}>
                      <td><input type="checkbox" checked={!!returned[it.id]} onChange={e => setReturned(r => ({ ...r, [it.id]: e.target.checked }))} style={{ accentColor: 'var(--primary)' }} /></td>
                      <td><div style={{ fontWeight: 600 }}>{it.name}</div><div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{it.id}</div></td>
                      <td className="num mono">{it.qty}</td>
                      <td><select className="select" style={{ height: 30, fontSize: 12, maxWidth: 180 }} value={cond[it.id] || 'bueno'} onChange={e => setCond(c => ({ ...c, [it.id]: e.target.value }))}>
                        <option value="bueno">Buen estado</option><option value="leve">Daño leve</option><option value="danado">Dañado</option><option value="incompleto">Incompleto</option>
                      </select></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>

            <div style={grid2}>
              <div className="card card-pad">
                <CardTitle title="Observaciones" icon="fileText" />
                <textarea className="textarea" rows="4" placeholder="Estado general, accesorios faltantes, novedades…" />
              </div>
              <div className="card card-pad">
                <CardTitle title="Evidencia fotográfica" icon="camera" />
                <div style={{ border: '1px dashed var(--border-2)', borderRadius: 11, padding: 24, textAlign: 'center', cursor: 'pointer' }}>
                  <Icon name="camera" size={26} style={{ color: 'var(--text-3)' }} />
                  <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 8 }}>Subir fotos de la devolución</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>Arrastra imágenes o haz clic · JPG, PNG</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}><b style={{ color: 'var(--text)' }}>{Object.values(returned).filter(Boolean).length}</b> de {selLoan.items.length} equipos marcados para devolución</span>
              <div style={{ display: 'flex', gap: 9 }}>
                <button className="btn" onClick={() => navigate('loans')}>Cancelar</button>
                <button className="btn btn-primary" onClick={() => navigate('loans')}><Icon name="check" size={15} />Confirmar devolución</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}

/* ---------------- LABORATORIOS / UBICACIONES ---------------- */
function TreeNode({ node, depth = 0, defaultOpen }) {
  const [open, setOpen] = useStateR(defaultOpen ?? depth < 1);
  const hasChildren = node.children && node.children.length;
  return (
    <div>
      <div onClick={() => hasChildren && setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', paddingLeft: 10 + depth * 22, borderRadius: 8, cursor: hasChildren ? 'pointer' : 'default' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <span style={{ width: 16, display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}>{hasChildren ? <Icon name="chevronRight" size={14} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }} /> : null}</span>
        <span style={{ color: node.color || 'var(--text-3)' }}><Icon name={node.icon} size={16} /></span>
        <span style={{ fontSize: 13, fontWeight: depth === 0 ? 700 : 500, flex: 1 }}>{node.name}</span>
        {node.count != null && <span className="badge badge-gray">{node.count} eq.</span>}
        {node.status && <StatusBadge status={node.status} />}
        <ActionMenu items={[{ icon: 'plus', label: 'Añadir ubicación hija' }, { icon: 'edit', label: 'Editar' }, { icon: 'move', label: 'Mover equipos' }, { divider: true }, { icon: 'trash', label: 'Eliminar', danger: true }]} />
      </div>
      {open && hasChildren && <div>{node.children.map((c, i) => <TreeNode key={i} node={c} depth={depth + 1} />)}</div>}
    </div>
  );
}
function Labs({ navigate }) {
  const tree = {
    name: 'Facultad de Ciencias e Ingeniería', icon: 'building', color: 'var(--primary)', count: DB.kpis.totalEq,
    children: DB.LABS.map(l => {
      const eqs = DB.equipment.filter(e => e.lab === l.id);
      const cnt = eqs.reduce((s, e) => s + e.total, 0);
      return {
        name: `${l.name} (${l.code})`, icon: 'labs', count: cnt, color: 'var(--st-blue)',
        children: [
          { name: 'Bodega principal', icon: 'box', count: Math.round(cnt * .6), children: [
            { name: 'Estante A', icon: 'layers', count: Math.round(cnt * .35), children: [
              { name: 'Nivel 1 · Caja 01', icon: 'inventory', count: Math.round(cnt * .2) },
              { name: 'Nivel 2 · Caja 02', icon: 'inventory', count: Math.round(cnt * .15) },
            ]},
            { name: 'Estante B', icon: 'layers', count: Math.round(cnt * .25) },
          ]},
          { name: 'Vitrina de instrumentos', icon: 'box', count: Math.round(cnt * .4), status: cnt > 30 ? 'disponible' : 'mantenimiento' },
        ],
      };
    }),
  };
  return (
    <Page max={1100}>
      <PageHead title="Laboratorios y ubicaciones" sub="Estructura jerárquica de almacenamiento de la facultad."
        actions={<><button className="btn"><Icon name="labs" size={15} />Nuevo laboratorio</button><button className="btn btn-primary"><Icon name="plus" size={15} />Nueva ubicación</button></>} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }} className="detail-grid">
        <div className="card card-pad">
          <CardTitle title="Árbol de ubicaciones" sub="Facultad › Laboratorio › Bodega › Estante › Nivel › Caja" icon="locations" />
          <div style={{ marginTop: 4 }}><TreeNode node={tree} defaultOpen /></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card card-pad">
            <CardTitle title="Resumen" icon="layers" />
            <InfoRow label="Laboratorios" mono>{DB.LABS.length}</InfoRow>
            <InfoRow label="Ubicaciones físicas" mono>148</InfoRow>
            <InfoRow label="Equipos ubicados" mono>{DB.kpis.totalEq}</InfoRow>
            <InfoRow label="Sin ubicar" mono>3</InfoRow>
          </div>
          <div className="card card-pad">
            <CardTitle title="Capacidad por laboratorio" icon="labs" />
            <HBarChart data={DB.LABS.map(l => ({ label: l.code, value: l.cap }))} color="var(--tech-600)" />
          </div>
        </div>
      </div>
    </Page>
  );
}

Object.assign(window, { Returns, Labs, TreeNode });
