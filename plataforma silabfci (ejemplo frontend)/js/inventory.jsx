/* SILAB FCI — Inventario / Equipos */
const { useState: useStateI, useMemo: useMemoI } = React;

function FilterSelect({ label, value, onChange, options }) {
  return (
    <select className="select" value={value} onChange={e => onChange(e.target.value)} style={{ height: 34, fontSize: 12.5, width: 'auto', flex: '1 1 132px', minWidth: 120, maxWidth: 200, fontWeight: value ? 600 : 400, color: value ? 'var(--text)' : 'var(--text-3)' }}>
      <option value="">{label}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Inventory({ navigate }) {
  const [q, setQ] = useStateI('');
  const [cat, setCat] = useStateI(''); const [lab, setLab] = useStateI(''); const [estado, setEstado] = useStateI(''); const [marca, setMarca] = useStateI(''); const [prog, setProg] = useStateI('');
  const [sel, setSel] = useStateI([]);
  const [sort, setSort] = useStateI({ k: 'id', dir: 1 });
  const [page, setPage] = useStateI(0);
  const [moveModal, setMoveModal] = useStateI(null);
  const perPage = 9;

  const marcas = [...new Set(DB.equipment.map(e => e.brand))].sort();

  const filtered = useMemoI(() => {
    let r = DB.equipment.filter(e => {
      if (q && !(`${e.name} ${e.brand} ${e.model} ${e.id} ${e.serial}`.toLowerCase().includes(q.toLowerCase()))) return false;
      if (cat && e.cat !== cat) return false;
      if (lab && e.labName !== lab) return false;
      if (estado && e.estado !== estado) return false;
      if (marca && e.brand !== marca) return false;
      if (prog && e.program !== prog) return false;
      return true;
    });
    r = [...r].sort((a, b) => { const va = a[sort.k], vb = b[sort.k]; return (va > vb ? 1 : va < vb ? -1 : 0) * sort.dir; });
    return r;
  }, [q, cat, lab, estado, marca, prog, sort]);

  const pages = Math.ceil(filtered.length / perPage);
  const view = filtered.slice(page * perPage, page * perPage + perPage);
  const setSortK = (k) => setSort(s => ({ k, dir: s.k === k ? -s.dir : 1 }));
  const activeFilters = [cat, lab, estado, marca, prog].filter(Boolean).length;
  const clearFilters = () => { setCat(''); setLab(''); setEstado(''); setMarca(''); setProg(''); setQ(''); };

  const Th = ({ k, children, num }) => (
    <th onClick={() => setSortK(k)} className={num ? 'num' : ''} style={{ cursor: 'pointer', userSelect: 'none' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{children}{sort.k === k && <Icon name={sort.dir === 1 ? 'arrowUp' : 'arrowDown'} size={11} sw={2.5} />}</span>
    </th>
  );

  return (
    <Page>
      <PageHead title="Inventario de equipos" sub={`${DB.equipment.length} referencias · ${DB.kpis.totalEq} unidades en 7 laboratorios`}
        actions={<>
          <button className="btn"><Icon name="upload" size={15} />Importar Excel</button>
          <button className="btn"><Icon name="download" size={15} />Exportar</button>
          <button className="btn btn-primary" onClick={() => navigate('equipment-form')}><Icon name="plus" size={15} />Registrar equipo</button>
        </>} />

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {[['Disponibles', DB.kpis.dispEq, 'green'], ['Prestados', DB.kpis.prestEq, 'blue'], ['Mantenimiento', DB.kpis.mantEq, 'amber'], ['Dañados', DB.kpis.danEq, 'red']].map(([l, v, c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 13px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: `var(--st-${c})` }} />
            <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{l}</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{v}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: 'visible' }}>
        {/* Filters bar */}
        <div style={{ padding: 14, borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}><Icon name="search" size={15} /></span>
            <input className="input" style={{ paddingLeft: 34, height: 34 }} placeholder="Buscar por nombre, código, serial…" value={q} onChange={e => { setQ(e.target.value); setPage(0); }} />
          </div>
          <FilterSelect label="Categoría" value={cat} onChange={v => { setCat(v); setPage(0); }} options={DB.CATS} />
          <FilterSelect label="Laboratorio" value={lab} onChange={v => { setLab(v); setPage(0); }} options={DB.LABS.map(l => l.name)} />
          <FilterSelect label="Estado" value={estado} onChange={v => { setEstado(v); setPage(0); }} options={DB.STATES} />
          <FilterSelect label="Marca" value={marca} onChange={v => { setMarca(v); setPage(0); }} options={marcas} />
          <FilterSelect label="Programa" value={prog} onChange={v => { setProg(v); setPage(0); }} options={DB.PROGRAMS} />
          {(activeFilters > 0 || q) && <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ color: 'var(--st-red)' }}><Icon name="x" size={14} />Limpiar ({activeFilters})</button>}
        </div>

        {/* Selection bar */}
        {sel.length > 0 && (
          <div style={{ padding: '10px 14px', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--primary)' }}>{sel.length} seleccionados</span>
            <button className="btn btn-sm"><Icon name="move" size={13} />Mover ubicación</button>
            <button className="btn btn-sm"><Icon name="wrench" size={13} />Enviar a mantenimiento</button>
            <button className="btn btn-sm"><Icon name="download" size={13} />Exportar selección</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSel([])} style={{ marginLeft: 'auto' }}>Deseleccionar</button>
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 36 }}><input type="checkbox" style={{ accentColor: 'var(--primary)' }} checked={sel.length === view.length && view.length > 0} onChange={e => setSel(e.target.checked ? view.map(v => v.id) : [])} /></th>
                <Th k="id">Código</Th><Th k="name">Nombre</Th><Th k="cat">Categoría</Th><Th k="brand">Marca / Modelo</Th>
                <Th k="labName">Ubicación</Th><Th k="estado">Estado</Th><Th k="total" num>Total</Th><Th k="disp" num>Disp.</Th><Th k="prestado" num>Prest.</Th>
                <th style={{ width: 44 }}></th>
              </tr>
            </thead>
            <tbody>
              {view.map(e => (
                <tr key={e.id} onClick={() => navigate('equipment-detail:' + e.id)} style={{ cursor: 'pointer' }}>
                  <td onClick={ev => ev.stopPropagation()}><input type="checkbox" style={{ accentColor: 'var(--primary)' }} checked={sel.includes(e.id)} onChange={ev => setSel(s => ev.target.checked ? [...s, e.id] : s.filter(x => x !== e.id))} /></td>
                  <td className="mono" style={{ fontWeight: 600, fontSize: 12 }}>{e.id}</td>
                  <td style={{ fontWeight: 600, maxWidth: 200 }}>{e.name}</td>
                  <td><span className="badge badge-gray">{e.cat}</span></td>
                  <td><div style={{ fontSize: 12.5 }}>{e.brand}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{e.model}</div></td>
                  <td><div style={{ fontSize: 12.5 }}>{e.labCode}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{e.shelf}</div></td>
                  <td><StatusBadge status={e.estado} /></td>
                  <td className="num mono">{e.total}</td>
                  <td className="num mono" style={{ color: e.disp > 0 ? 'var(--st-green)' : 'var(--text-3)', fontWeight: 700 }}>{e.disp}</td>
                  <td className="num mono" style={{ color: 'var(--text-2)' }}>{e.prestado}</td>
                  <td onClick={ev => ev.stopPropagation()}>
                    <ActionMenu items={[
                      { icon: 'eye', label: 'Ver detalle', onClick: () => navigate('equipment-detail:' + e.id) },
                      { icon: 'edit', label: 'Editar', onClick: () => navigate('equipment-form') },
                      { icon: 'move', label: 'Mover ubicación', onClick: () => setMoveModal(e) },
                      { icon: 'loans', label: 'Prestar', onClick: () => navigate('loan-wizard') },
                      { divider: true },
                      { icon: 'wrench', label: 'Enviar a mantenimiento', onClick: () => navigate('maintenance') },
                      { icon: 'trash', label: 'Dar de baja', danger: true },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {view.length === 0 && <EmptyState icon="search" title="Sin resultados" desc="No hay equipos que coincidan con los filtros aplicados." action={<button className="btn" onClick={clearFilters}>Limpiar filtros</button>} />}

        {/* Pagination */}
        {view.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Mostrando <b style={{ color: 'var(--text)' }}>{page * perPage + 1}–{Math.min((page + 1) * perPage, filtered.length)}</b> de <b style={{ color: 'var(--text)' }}>{filtered.length}</b> equipos</span>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <button className="btn btn-sm btn-icon" disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ opacity: page === 0 ? .4 : 1 }}><Icon name="chevronLeft" size={15} /></button>
              {Array.from({ length: pages }, (_, i) => i).slice(Math.max(0, Math.min(page - 2, pages - 5)), Math.max(5, page + 3)).map(i => (
                <button key={i} className={`btn btn-sm ${i === page ? 'btn-primary' : ''}`} onClick={() => setPage(i)} style={{ minWidth: 30, padding: 0 }}>{i + 1}</button>
              ))}
              <button className="btn btn-sm btn-icon" disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)} style={{ opacity: page >= pages - 1 ? .4 : 1 }}><Icon name="chevronRight" size={15} /></button>
            </div>
          </div>
        )}
      </div>

      <Modal open={!!moveModal} onClose={() => setMoveModal(null)} title="Mover ubicación" sub={moveModal ? `${moveModal.name} · ${moveModal.id}` : ''}
        footer={<><button className="btn" onClick={() => setMoveModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={() => setMoveModal(null)}><Icon name="check" size={15} />Confirmar movimiento</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field"><label>Laboratorio destino</label><select className="select">{DB.LABS.map(l => <option key={l.id}>{l.name}</option>)}</select></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field"><label>Estante</label><select className="select"><option>Estante A-1</option><option>Estante B-2</option></select></div>
            <div className="field"><label>Nivel / caja</label><input className="input" placeholder="Nivel 2 · Caja 04" /></div>
          </div>
          <div className="field"><label>Motivo del movimiento</label><textarea className="textarea" rows="2" placeholder="Reorganización, traslado entre laboratorios…" /></div>
        </div>
      </Modal>
    </Page>
  );
}

Object.assign(window, { Inventory, FilterSelect });
