/* SILAB FCI — Wizard de solicitud de préstamo */
const { useState: useStateW } = React;

function Stepper({ steps, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 22 }}>
      {steps.map((s, i) => {
        const done = i < current, active = i === current;
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
              <span style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 12.5, fontWeight: 700, flexShrink: 0,
                background: done ? 'var(--st-green)' : active ? 'var(--primary)' : 'var(--surface-3)', color: done || active ? '#fff' : 'var(--text-3)', border: active ? '3px solid var(--primary-soft)' : 'none' }}>
                {done ? <Icon name="check" size={15} sw={3} /> : i + 1}
              </span>
              <span className="step-label" style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? 'var(--text)' : done ? 'var(--text-2)' : 'var(--text-3)', whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: done ? 'var(--st-green)' : 'var(--border)', margin: '0 12px', minWidth: 16 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function LoanWizard({ navigate }) {
  const [step, setStep] = useStateW(0);
  const [cart, setCart] = useStateW([DB.equipment[0], DB.equipment[5]]);
  const [q, setQ] = useStateW('');
  const steps = ['Solicitante', 'Contexto', 'Equipos', 'Fechas', 'Resumen'];
  const avail = DB.equipment.filter(e => e.disp > 0 && (!q || e.name.toLowerCase().includes(q.toLowerCase()))).slice(0, 8);
  const inCart = (id) => cart.some(c => c.id === id);
  const toggle = (e) => setCart(c => inCart(e.id) ? c.filter(x => x.id !== e.id) : [...c, e]);

  return (
    <Page max={920}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button className="btn btn-icon" onClick={() => navigate('loans')}><Icon name="chevronLeft" size={16} /></button>
        <div><h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-.02em' }}>Nueva solicitud de préstamo</h1><p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-3)' }}>Completa los pasos para registrar la solicitud.</p></div>
      </div>

      <div className="card card-pad">
        <Stepper steps={steps} current={step} />
        <hr className="divider" style={{ margin: '0 0 20px' }} />

        {step === 0 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Datos del solicitante</h3>
            <div style={grid2}>
              <div className="field"><label>Usuario *</label><select className="select"><option value="">Buscar usuario…</option>{DB.PEOPLE.map((p, i) => <option key={i}>{p[0]}</option>)}</select></div>
              <div className="field"><label>Tipo de usuario</label><select className="select"><option>Estudiante</option><option>Profesor</option><option>Monitor</option></select></div>
              <div className="field"><label>Programa</label><select className="select">{DB.PROGRAMS.map(p => <option key={p}>{p}</option>)}</select></div>
              <div className="field"><label>Correo institucional</label><input className="input" placeholder="usuario@umanizales.edu.co" /></div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Contexto del uso</h3>
            <div className="field"><label>Tipo de uso</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Clase / materia', 'Proyecto de investigación', 'Actividad extracurricular', 'Trabajo de grado'].map((t, i) => (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 9, border: `1px solid ${i === 0 ? 'var(--primary)' : 'var(--border-2)'}`, background: i === 0 ? 'var(--primary-soft)' : 'var(--surface)', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: i === 0 ? 'var(--primary)' : 'var(--text-2)' }}>
                    <input type="radio" name="uso" defaultChecked={i === 0} style={{ accentColor: 'var(--primary)' }} />{t}
                  </label>
                ))}
              </div>
            </div>
            <div style={grid2}>
              <div className="field"><label>Materia</label><select className="select">{DB.SUBJECTS.map(s => <option key={s}>{s}</option>)}</select></div>
              <div className="field"><label>Proyecto</label><select className="select"><option value="">Ninguno</option><option>Smart Campus IoT</option><option>Monitoreo ambiental</option></select></div>
              <div className="field"><label>Profesor responsable</label><select className="select">{DB.PEOPLE.filter(p => p[1] === 'Profesor').map((p, i) => <option key={i}>{p[0]}</option>)}</select></div>
              <div className="field"><label>Salón / laboratorio de uso</label><select className="select">{DB.LABS.map(l => <option key={l.id}>{l.name}</option>)}</select></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Selección de equipos</h3>
              <span className="badge badge-blue">{cart.length} en la solicitud</span>
            </div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}><Icon name="search" size={15} /></span>
              <input className="input" style={{ paddingLeft: 34 }} placeholder="Buscar equipos disponibles…" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 11, overflow: 'hidden', maxHeight: 290, overflowY: 'auto' }}>
              <table className="tbl">
                <thead><tr><th style={{ width: 40 }}></th><th>Equipo</th><th>Categoría</th><th>Ubicación</th><th className="num">Disp.</th></tr></thead>
                <tbody>{avail.map(e => (
                  <tr key={e.id} onClick={() => toggle(e)} style={{ cursor: 'pointer', background: inCart(e.id) ? 'var(--primary-soft)' : '' }}>
                    <td><input type="checkbox" checked={inCart(e.id)} onChange={() => toggle(e)} style={{ accentColor: 'var(--primary)' }} /></td>
                    <td><div style={{ fontWeight: 600 }}>{e.name}</div><div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{e.id}</div></td>
                    <td><span className="badge badge-gray">{e.cat}</span></td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{e.labCode}</td>
                    <td className="num mono" style={{ color: 'var(--st-green)', fontWeight: 700 }}>{e.disp}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Fechas y observaciones</h3>
            <div style={grid2}>
              <div className="field"><label>Fecha de préstamo *</label><input className="input" type="date" defaultValue="2026-06-02" /></div>
              <div className="field"><label>Fecha estimada de devolución *</label><input className="input" type="date" defaultValue="2026-06-16" /></div>
            </div>
            <div className="field"><label>Observaciones</label><textarea className="textarea" rows="3" placeholder="Condiciones especiales, accesorios incluidos…" /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-2)' }}><input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)' }} />El solicitante acepta el reglamento de uso de equipos de la FCI.</label>
          </div>
        )}

        {step === 4 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Resumen de la solicitud</h3>
            <div style={grid2}>
              <div className="card card-pad" style={{ background: 'var(--surface-2)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Solicitante</div>
                <InfoRow label="Usuario">Carlos Mejía</InfoRow><InfoRow label="Tipo">Estudiante</InfoRow><InfoRow label="Programa">Ing. de Sistemas</InfoRow><InfoRow label="Responsable">Felipe Castaño</InfoRow>
              </div>
              <div className="card card-pad" style={{ background: 'var(--surface-2)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Contexto y fechas</div>
                <InfoRow label="Materia">Sistemas Embebidos</InfoRow><InfoRow label="Laboratorio">Lab. de Electrónica</InfoRow><InfoRow label="Préstamo" mono>2026-06-02</InfoRow><InfoRow label="Devolución" mono>2026-06-16</InfoRow>
              </div>
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>Equipos seleccionados ({cart.length})</div>
              <table className="tbl">
                <thead><tr><th>Código</th><th>Equipo</th><th>Categoría</th><th className="num">Cantidad</th></tr></thead>
                <tbody>{cart.map(e => (<tr key={e.id}><td className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{e.id}</td><td style={{ fontWeight: 600 }}>{e.name}</td><td><span className="badge badge-gray">{e.cat}</span></td><td className="num mono">1</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        <hr className="divider" style={{ margin: '20px 0 16px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn" onClick={() => step === 0 ? navigate('loans') : setStep(s => s - 1)}><Icon name="chevronLeft" size={15} />{step === 0 ? 'Cancelar' : 'Anterior'}</button>
          {step < 4
            ? <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>Continuar<Icon name="arrowRight" size={15} /></button>
            : <button className="btn btn-primary" onClick={() => navigate('loans')}><Icon name="check" size={15} />Enviar solicitud</button>}
        </div>
      </div>
    </Page>
  );
}

Object.assign(window, { LoanWizard, Stepper });
