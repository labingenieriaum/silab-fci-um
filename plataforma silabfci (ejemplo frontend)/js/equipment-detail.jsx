/* SILAB FCI — Detalle de equipo + Formulario */
const { useState: useStateE } = React;

function InfoRow({ label, children, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{label}</span>
      <span className={mono ? 'mono' : ''} style={{ fontSize: 12.5, fontWeight: 600, textAlign: 'right' }}>{children}</span>
    </div>
  );
}
function ImgPlaceholder({ label, h = 200, r = 12 }) {
  return (
    <div style={{ height: h, borderRadius: r, border: '1px dashed var(--border-2)', display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden',
      background: 'repeating-linear-gradient(45deg, var(--surface-2), var(--surface-2) 10px, var(--surface-3) 10px, var(--surface-3) 20px)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--text-3)' }}>
        <Icon name="camera" size={26} />
        <span className="mono" style={{ fontSize: 11 }}>{label}</span>
      </div>
    </div>
  );
}

function EquipmentDetail({ id, navigate }) {
  const e = DB.equipment.find(x => x.id === id) || DB.equipment[0];
  const [tab, setTab] = useStateE('prestamos');
  const [qrOpen, setQrOpen] = useStateE(false);
  const loanHist = DB.loans.filter((_, i) => i % 3 === 0).slice(0, 5);

  const tabs = { prestamos: 'Historial de préstamos', mant: 'Mantenimientos', mov: 'Movimientos', files: 'Archivos' };

  return (
    <Page>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className="btn btn-icon" onClick={() => navigate('inventory')}><Icon name="chevronLeft" size={16} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-.02em' }}>{e.name}</h1>
            <StatusBadge status={e.estado} />
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-3)' }} className="mono">{e.id} · {e.brand} {e.model} · Serial {e.serial}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => navigate('equipment-form')}><Icon name="edit" size={15} />Editar</button>
          <button className="btn"><Icon name="move" size={15} />Mover</button>
          <button className="btn"><Icon name="wrench" size={15} />Mantenimiento</button>
          <button className="btn btn-primary" onClick={() => navigate('loan-wizard')}><Icon name="loans" size={15} />Prestar</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 14, alignItems: 'start' }} className="detail-grid">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card card-pad">
            <ImgPlaceholder label="foto del equipo" h={200} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 10 }}>
              {[0,1,2].map(i => <ImgPlaceholder key={i} label="" h={54} r={8} />)}
            </div>
          </div>

          {/* Stock */}
          <div className="card card-pad">
            <CardTitle title="Disponibilidad" icon="box" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              {[['Total', e.total, 'var(--text)'], ['Disponible', e.disp, 'var(--st-green)'], ['Prestado', e.prestado, 'var(--st-blue)'], ['Dañado/mant.', e.danados + e.mant, 'var(--st-amber)']].map(([l, v, c]) => (
                <div key={l} style={{ padding: 12, borderRadius: 10, background: 'var(--surface-2)', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* QR */}
          <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ padding: 8, background: '#fff', borderRadius: 10, border: '1px solid var(--border)' }}><QRCode value={e.id + e.serial} size={84} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Etiqueta QR</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', margin: '3px 0 10px' }}>Escanea para ver el equipo o registrar un préstamo rápido.</div>
              <button className="btn btn-sm" onClick={() => setQrOpen(true)}><Icon name="qr" size={14} />Generar etiqueta</button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="detail-grid">
            <div className="card card-pad">
              <CardTitle title="Información general" icon="fileText" />
              <InfoRow label="Categoría">{e.cat}</InfoRow>
              <InfoRow label="Marca">{e.brand}</InfoRow>
              <InfoRow label="Modelo">{e.model}</InfoRow>
              <InfoRow label="Serial" mono>{e.serial}</InfoRow>
              <InfoRow label="Valor estimado" mono>{DB.fmtMoney(e.value)}</InfoRow>
              <InfoRow label="Fecha de adquisición" mono>{e.acquired}</InfoRow>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Programa</span><span style={{ fontSize: 12.5, fontWeight: 600 }}>{e.program}</span>
              </div>
            </div>
            <div className="card card-pad">
              <CardTitle title="Ubicación actual" icon="locations" />
              <InfoRow label="Laboratorio">{e.labName}</InfoRow>
              <InfoRow label="Código de sala" mono>{e.labCode}</InfoRow>
              <InfoRow label="Estante">{e.shelf}</InfoRow>
              <InfoRow label="Nivel">Nivel 2</InfoRow>
              <InfoRow label="Caja/compartimento" mono>C-04</InfoRow>
              <div style={{ marginTop: 12 }}><ImgPlaceholder label="mapa de ubicación" h={92} /></div>
            </div>
          </div>

          {/* History tabs */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 2, padding: '10px 14px 0', borderBottom: '1px solid var(--border)' }}>
              {Object.entries(tabs).map(([k, v]) => (
                <button key={k} onClick={() => setTab(k)} style={{ padding: '8px 12px', border: 'none', background: 'transparent', fontSize: 12.5, fontWeight: 600, color: tab === k ? 'var(--primary)' : 'var(--text-3)', borderBottom: `2px solid ${tab === k ? 'var(--primary)' : 'transparent'}`, marginBottom: -1 }}>{v}</button>
              ))}
            </div>
            {tab === 'prestamos' && (
              <table className="tbl">
                <thead><tr><th>Código</th><th>Solicitante</th><th>Fecha</th><th>Devolución</th><th>Estado</th></tr></thead>
                <tbody>{loanHist.map(l => (
                  <tr key={l.id} onClick={() => navigate('loan-detail:' + l.id)} style={{ cursor: 'pointer' }}>
                    <td className="mono" style={{ fontWeight: 600, fontSize: 12 }}>{l.id}</td><td style={{ fontWeight: 600 }}>{l.user}</td>
                    <td className="mono" style={{ color: 'var(--text-2)' }}>{l.date}</td><td className="mono" style={{ color: 'var(--text-2)' }}>{l.due}</td>
                    <td><StatusBadge status={l.estado} map={LOAN_STATUS} /></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
            {tab === 'mant' && (
              <table className="tbl">
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Responsable</th><th>Costo</th><th>Estado</th></tr></thead>
                <tbody>
                  <tr><td className="mono">2026-03-12</td><td>Calibración</td><td>Servicio técnico</td><td className="mono">$280.000</td><td><span className="badge badge-green"><span className="dot"/>Finalizado</span></td></tr>
                  <tr><td className="mono">2025-09-04</td><td>Reparación</td><td>Lab. Electrónica</td><td className="mono">$420.000</td><td><span className="badge badge-green"><span className="dot"/>Finalizado</span></td></tr>
                </tbody>
              </table>
            )}
            {tab === 'mov' && (
              <div style={{ padding: 18 }}>
                <Timeline steps={[
                  { state: 'done', icon: 'move', title: 'Movido a ' + e.labName, date: '2026-02-01 · por Coordinación', desc: 'Reorganización de inventario semestral' },
                  { state: 'done', icon: 'check', title: 'Ingreso al inventario', date: e.acquired + ' · compra', desc: 'Alta inicial del equipo' },
                ]} />
              </div>
            )}
            {tab === 'files' && (
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }} className="detail-grid">
                {[['Manual técnico.pdf', 'fileText'], ['Factura de compra.pdf', 'fileText'], ['Garantía.pdf', 'fileText']].map(([f, ic]) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
                    <Icon name={ic} size={20} style={{ color: 'var(--st-red)' }} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>PDF · 2.1 MB</div></div><button className="btn btn-ghost btn-icon btn-sm"><Icon name="download" size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="Etiqueta QR" sub={`${e.name} · ${e.id}`} width={340}
        footer={<><button className="btn" onClick={() => setQrOpen(false)}>Cerrar</button><button className="btn btn-primary"><Icon name="printer" size={15} />Imprimir</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 10 }}>
          <div style={{ padding: 16, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}><QRCode value={e.id + e.serial} size={160} /></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700 }}>{e.name}</div><div className="mono" style={{ fontSize: 12, color: 'var(--text-3)' }}>{e.id} · {e.serial}</div></div>
        </div>
      </Modal>
    </Page>
  );
}

/* ---------------- FORM ---------------- */
function FormSection({ n, title, sub, children }) {
  return (
    <div className="card card-pad" style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', gap: 11, marginBottom: 16 }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 12.5, fontWeight: 800, flexShrink: 0 }}>{n}</span>
        <div><h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700 }}>{title}</h3>{sub && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-3)' }}>{sub}</p>}</div>
      </div>
      {children}
    </div>
  );
}
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };
const grid3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 };

function EquipmentForm({ navigate }) {
  return (
    <Page max={900}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button className="btn btn-icon" onClick={() => navigate('inventory')}><Icon name="chevronLeft" size={16} /></button>
        <div><h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-.02em' }}>Registrar equipo</h1><p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-3)' }}>Completa la información para dar de alta un equipo en el inventario.</p></div>
      </div>

      <FormSection n="1" title="Información básica">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={grid2}>
            <div className="field"><label>Nombre del equipo *</label><input className="input" placeholder="Osciloscopio digital" /></div>
            <div className="field"><label>Código interno *</label><input className="input mono" placeholder="EQ-1031" /></div>
          </div>
          <div style={grid3}>
            <div className="field"><label>Categoría *</label><select className="select"><option value="">Seleccionar…</option>{DB.CATS.map(c => <option key={c}>{c}</option>)}</select></div>
            <div className="field"><label>Marca</label><input className="input" placeholder="Tektronix" /></div>
            <div className="field"><label>Modelo</label><input className="input" placeholder="TBS1102B" /></div>
          </div>
          <div style={grid2}>
            <div className="field"><label>Serial</label><input className="input mono" placeholder="TK123456" /></div>
            <div className="field"><label>Programa asociado</label><select className="select"><option value="">General (facultad)</option>{DB.PROGRAMS.map(p => <option key={p}>{p}</option>)}</select></div>
          </div>
          <div className="field"><label>Descripción</label><textarea className="textarea" rows="2" placeholder="Características técnicas relevantes del equipo…" /></div>
        </div>
      </FormSection>

      <FormSection n="2" title="Inventario y valoración">
        <div style={grid3}>
          <div className="field"><label>Cantidad total *</label><input className="input mono" type="number" defaultValue="1" /></div>
          <div className="field"><label>Cantidad disponible</label><input className="input mono" type="number" defaultValue="1" /></div>
          <div className="field"><label>Estado *</label><select className="select">{DB.STATES.map(s => <option key={s}>{(EQ_STATUS[s]||{}).label || s}</option>)}</select></div>
          <div className="field"><label>Valor estimado (COP)</label><input className="input mono" placeholder="2.480.000" /></div>
          <div className="field"><label>Fecha de adquisición</label><input className="input" type="date" /></div>
          <div className="field"><label>Vida útil (años)</label><input className="input mono" type="number" defaultValue="5" /></div>
        </div>
      </FormSection>

      <FormSection n="3" title="Ubicación física">
        <div style={grid3}>
          <div className="field"><label>Laboratorio *</label><select className="select">{DB.LABS.map(l => <option key={l.id}>{l.name}</option>)}</select></div>
          <div className="field"><label>Bodega</label><input className="input" placeholder="Bodega A" /></div>
          <div className="field"><label>Estante</label><input className="input" placeholder="Estante B-2" /></div>
          <div className="field"><label>Nivel</label><input className="input" placeholder="Nivel 2" /></div>
          <div className="field"><label>Caja / compartimento</label><input className="input" placeholder="C-04" /></div>
        </div>
      </FormSection>

      <FormSection n="4" title="Archivos adjuntos" sub="Foto, manual y documento de compra">
        <div style={grid3}>
          {['Foto del equipo', 'Manual técnico', 'Documento de compra'].map(l => (
            <div key={l} style={{ border: '1px dashed var(--border-2)', borderRadius: 11, padding: 18, textAlign: 'center', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-2)'}>
              <Icon name="upload" size={20} style={{ color: 'var(--text-3)' }} />
              <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 6 }}>{l}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Arrastra o haz clic</div>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection n="5" title="Observaciones">
        <div className="field"><textarea className="textarea" rows="3" placeholder="Notas adicionales, condiciones de uso, restricciones…" /></div>
      </FormSection>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, position: 'sticky', bottom: 0, padding: '14px 0', background: 'linear-gradient(transparent, var(--bg) 40%)' }}>
        <button className="btn" onClick={() => navigate('inventory')}>Cancelar</button>
        <button className="btn"><Icon name="fileText" size={15} />Guardar borrador</button>
        <button className="btn btn-primary" onClick={() => navigate('inventory')}><Icon name="check" size={15} />Registrar equipo</button>
      </div>
    </Page>
  );
}

Object.assign(window, { EquipmentDetail, EquipmentForm, FormSection, InfoRow, ImgPlaceholder, grid2, grid3 });
