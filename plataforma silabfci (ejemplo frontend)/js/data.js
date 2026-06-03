/* SILAB FCI — Mock data (realista, facultad de ingeniería) */
(function () {
  const PROGRAMS = ['Ing. de Sistemas', 'Ing. Electrónica', 'Ing. Industrial', 'Ing. Biomédica', 'Ing. Ambiental'];
  const LABS = [
    { id: 'LAB-A1', name: 'Lab. de Electrónica', code: 'A-101', cap: 24 },
    { id: 'LAB-A2', name: 'Lab. de Redes y Telecom.', code: 'A-204', cap: 20 },
    { id: 'LAB-B1', name: 'Lab. de Cómputo', code: 'B-110', cap: 40 },
    { id: 'LAB-B2', name: 'Lab. de Automatización', code: 'B-220', cap: 18 },
    { id: 'LAB-C1', name: 'Lab. de Física', code: 'C-105', cap: 30 },
    { id: 'LAB-C2', name: 'Lab. de Biomédica', code: 'C-210', cap: 16 },
    { id: 'LAB-D1', name: 'Lab. de Materiales', code: 'D-101', cap: 22 },
  ];
  const CATS = ['Instrumentación', 'Cómputo', 'Redes', 'Audiovisual', 'Herramientas', 'Energía', 'Sensórica', 'Robótica'];
  const STATES = ['disponible', 'prestado', 'danado', 'mantenimiento', 'baja'];

  const EQUIP_SEED = [
    ['Osciloscopio digital', 'Tektronix', 'TBS1102B', 'Instrumentación', 'LAB-A1', 2480000],
    ['Multímetro de banco', 'Fluke', '8846A', 'Instrumentación', 'LAB-A1', 1950000],
    ['Generador de funciones', 'Rigol', 'DG1022Z', 'Instrumentación', 'LAB-A1', 1320000],
    ['Fuente DC programable', 'Keysight', 'E3631A', 'Energía', 'LAB-A1', 3100000],
    ['Estación de soldadura', 'Weller', 'WE1010', 'Herramientas', 'LAB-A1', 690000],
    ['Analizador de espectro', 'Rohde&Schwarz', 'FPC1000', 'Instrumentación', 'LAB-A2', 8200000],
    ['Router empresarial', 'Cisco', 'ISR-4331', 'Redes', 'LAB-A2', 4400000],
    ['Switch administrable', 'Cisco', 'C9200-24P', 'Redes', 'LAB-A2', 3650000],
    ['Access point WiFi 6', 'Ubiquiti', 'U6-Pro', 'Redes', 'LAB-A2', 540000],
    ['Workstation gráfica', 'Dell', 'Precision 3660', 'Cómputo', 'LAB-B1', 6800000],
    ['Monitor 27" 4K', 'LG', '27UP850', 'Cómputo', 'LAB-B1', 1450000],
    ['Servidor de cómputo', 'HPE', 'ProLiant DL380', 'Cómputo', 'LAB-B1', 18500000],
    ['Brazo robótico educativo', 'Dobot', 'Magician', 'Robótica', 'LAB-B2', 5200000],
    ['PLC modular', 'Siemens', 'S7-1200', 'Automatización', 'LAB-B2', 2900000],
    ['Variador de frecuencia', 'ABB', 'ACS580', 'Energía', 'LAB-B2', 2150000],
    ['Kit de sensores IoT', 'Arduino', 'Explore IoT', 'Sensórica', 'LAB-B2', 380000],
    ['Microscopio digital', 'Leica', 'DM750', 'Instrumentación', 'LAB-C1', 5600000],
    ['Cámara térmica', 'FLIR', 'E8-XT', 'Sensórica', 'LAB-C1', 7400000],
    ['Balanza analítica', 'Mettler', 'ME204', 'Instrumentación', 'LAB-C1', 3950000],
    ['Electrocardiógrafo', 'Mindray', 'BeneHeart R12', 'Biomédica', 'LAB-C2', 9800000],
    ['Simulador de paciente', 'Laerdal', 'SimMan', 'Biomédica', 'LAB-C2', 22000000],
    ['Pulsioxímetro', 'Masimo', 'Rad-G', 'Sensórica', 'LAB-C2', 1250000],
    ['Durómetro', 'Mitutoyo', 'HR-400', 'Instrumentación', 'LAB-D1', 6300000],
    ['Máquina universal de ensayos', 'Instron', '34SC', 'Instrumentación', 'LAB-D1', 41000000],
    ['Proyector láser', 'Epson', 'EB-L200F', 'Audiovisual', 'LAB-B1', 2750000],
    ['Cámara DSLR', 'Canon', 'EOS 90D', 'Audiovisual', 'LAB-A2', 3200000],
    ['Impresora 3D', 'Prusa', 'MK4', 'Herramientas', 'LAB-B2', 2400000],
    ['Taladro de banco', 'Bosch', 'PBD 40', 'Herramientas', 'LAB-D1', 880000],
    ['Fuente de alimentación', 'Siglent', 'SPD3303X', 'Energía', 'LAB-A1', 1480000],
    ['Analizador lógico', 'Saleae', 'Logic Pro 16', 'Instrumentación', 'LAB-A2', 1900000],
  ];

  function rng(seed) { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
  const r = rng(42);
  const pick = (a) => a[Math.floor(r() * a.length)];

  const equipment = EQUIP_SEED.map((e, i) => {
    const total = 1 + Math.floor(r() * 8);
    const danados = r() < 0.18 ? Math.floor(r() * 2) : 0;
    const mant = r() < 0.15 ? 1 : 0;
    const prestado = Math.floor(r() * Math.max(0, total - danados - mant));
    const disp = total - prestado - danados - mant;
    let estado = 'disponible';
    if (disp <= 0 && prestado > 0) estado = 'prestado';
    if (mant > 0 && disp <= 0) estado = 'mantenimiento';
    if (danados >= total) estado = 'danado';
    const lab = LABS.find(l => l.id === e[4]);
    return {
      id: `EQ-${String(1001 + i)}`,
      name: e[0], brand: e[1], model: e[2], cat: e[3],
      serial: `${e[1].slice(0,2).toUpperCase()}${Math.floor(100000 + r()*899999)}`,
      lab: e[4], labName: lab.name, labCode: lab.code,
      shelf: `Estante ${pick(['A','B','C','D'])}-${1+Math.floor(r()*6)}`,
      value: e[5], total, disp, prestado, danados, mant, estado,
      acquired: `20${20 + Math.floor(r()*5)}-${String(1+Math.floor(r()*12)).padStart(2,'0')}-${String(1+Math.floor(r()*28)).padStart(2,'0')}`,
      program: pick(PROGRAMS),
      uses: Math.floor(r() * 140),
    };
  });

  const PEOPLE = [
    ['Laura Ramírez', 'Profesor', 'Ing. Electrónica'], ['Carlos Mejía', 'Estudiante', 'Ing. de Sistemas'],
    ['Andrea Torres', 'Profesor', 'Ing. Biomédica'], ['Juan D. Patiño', 'Monitor', 'Ing. de Sistemas'],
    ['Sofía Cardona', 'Estudiante', 'Ing. Industrial'], ['Miguel Ángel Ruiz', 'Profesor', 'Ing. Ambiental'],
    ['Valentina Gómez', 'Estudiante', 'Ing. Electrónica'], ['Felipe Castaño', 'Profesor', 'Ing. de Sistemas'],
    ['Daniela Ospina', 'Monitor', 'Ing. Biomédica'], ['Sebastián Loaiza', 'Estudiante', 'Ing. Industrial'],
  ];
  const LOAN_STATES = ['solicitado', 'aprobado', 'entregado', 'devuelto', 'vencido', 'cancelado', 'rechazado'];
  const SUBJECTS = ['Circuitos II', 'Redes de Datos', 'Instrumentación Biomédica', 'Control Automático', 'Física III', 'Resistencia de Materiales', 'Sistemas Embebidos'];

  const loans = Array.from({ length: 28 }, (_, i) => {
    const p = pick(PEOPLE);
    const st = i < 6 ? 'vencido' : pick(LOAN_STATES);
    const n = 1 + Math.floor(r() * 3);
    const items = Array.from({ length: n }, () => { const eq = pick(equipment); return { id: eq.id, name: eq.name, qty: 1 + Math.floor(r()*2) }; });
    const month = 1 + Math.floor(r() * 5);
    return {
      id: `PR-2026-${String(101 + i)}`,
      user: p[0], role: p[1], program: p[2],
      subject: pick(SUBJECTS), lab: pick(LABS).name,
      items, count: items.reduce((s, x) => s + x.qty, 0),
      estado: st,
      date: `2026-0${month}-${String(1 + Math.floor(r()*27)).padStart(2,'0')}`,
      due: `2026-0${month}-${String(15 + Math.floor(r()*13)).padStart(2,'0')}`,
      prof: pick(PEOPLE.filter(x => x[1] === 'Profesor'))[0],
    };
  });

  // KPIs
  const totalEq = equipment.reduce((s, e) => s + e.total, 0);
  const dispEq = equipment.reduce((s, e) => s + e.disp, 0);
  const prestEq = equipment.reduce((s, e) => s + e.prestado, 0);
  const danEq = equipment.reduce((s, e) => s + e.danados, 0);
  const mantEq = equipment.reduce((s, e) => s + e.mant, 0);

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const loansByMonth = [42, 58, 71, 65, 88, 94, 39, 47, 102, 118, 96, 61].map((v, i) => ({ label: months[i], value: v }));

  const byCategory = CATS.map(c => ({ label: c, value: equipment.filter(e => e.cat === c).reduce((s, e) => s + e.total, 0) || (2 + Math.floor(Math.random()*6)) }));
  const byLab = LABS.map(l => ({ label: l.code, name: l.name, value: equipment.filter(e => e.lab === l.id).reduce((s, e) => s + e.uses, 0) }));
  const byProgram = PROGRAMS.map((p, i) => ({ label: p, value: [320, 245, 188, 142, 96][i] }));
  const topEquip = [...equipment].sort((a, b) => b.uses - a.uses).slice(0, 10);

  const alerts = [
    { type: 'vencido', icon: 'clock', color: 'red', title: '6 préstamos con devolución vencida', desc: 'El más antiguo lleva 9 días de retraso', cta: 'Ver préstamos' },
    { type: 'mant', icon: 'wrench', color: 'amber', title: `${mantEq} equipos en mantenimiento`, desc: '2 superan el tiempo estimado de reparación', cta: 'Ver mantenimientos' },
    { type: 'stock', icon: 'box', color: 'purple', title: '4 referencias con bajo stock', desc: 'Sensores IoT y access points por debajo del mínimo', cta: 'Ver inventario' },
    { type: 'pend', icon: 'bell', color: 'blue', title: '8 solicitudes pendientes de aprobación', desc: '3 ingresaron en las últimas 24 horas', cta: 'Revisar solicitudes' },
  ];

  const auditLog = Array.from({ length: 12 }, (_, i) => {
    const acts = ['CREAR', 'EDITAR', 'ELIMINAR', 'PRESTAR', 'DEVOLVER', 'APROBAR'];
    const tbls = ['equipos', 'prestamos', 'usuarios', 'mantenimientos', 'ubicaciones'];
    const p = pick(PEOPLE);
    return { id: i, user: p[0], action: pick(acts), table: pick(tbls), record: `#${1000 + Math.floor(r()*8000)}`, date: `2026-06-0${1+Math.floor(r()*2)} ${String(8+Math.floor(r()*10)).padStart(2,'0')}:${String(Math.floor(r()*59)).padStart(2,'0')}` };
  });

  window.DB = {
    PROGRAMS, LABS, CATS, STATES, equipment, loans, PEOPLE, SUBJECTS,
    kpis: { totalEq, dispEq, prestEq, danEq, mantEq, prestActivos: loans.filter(l => ['entregado','aprobado'].includes(l.estado)).length, prestVencidos: loans.filter(l => l.estado === 'vencido').length, pendientes: loans.filter(l => l.estado === 'solicitado').length },
    loansByMonth, byCategory, byLab, byProgram, topEquip, alerts, auditLog,
    fmtMoney: (n) => '$' + n.toLocaleString('es-CO'),
    fmtMoneyShort: (n) => n >= 1e6 ? '$' + (n/1e6).toFixed(1) + 'M' : '$' + (n/1e3).toFixed(0) + 'K',
  };
})();
