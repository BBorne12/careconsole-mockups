/*
  CareConsole mockup tasks, shared by worklist.html (Tasks column, Create Task,
  Complete, View All) and careconsole.html (All Assigned Tasks).
  Tasks live in localStorage "ccTasks":
    { id, pt, title, note, due (yyyy-mm-dd), rec ('Single' | 'Every 30 Days' | ...), end, by, status ('Not Completed' | 'Completed' | 'Canceled'), done }
  The mock's "today" is 6/29/2026. Layout follows CareConsole 3.0's Task.aspx dialog.
*/
(function () {
  'use strict';
  const KEY = 'ccTasks', ME = 'Borne, Ben', TODAY = '2026-06-29';
  const NAMES = ['Periodic Evaluation Note', 'Provider Appointment', 'Courtesy Call', 'Biometric/Symptom Check', 'Parameter Review', 'Medication Change', 'Post ER/Hospital Discharge',
    'Post Provider Appointment', 'Address Compliance', 'Device Issue Follow Up', 'Device Set Up/Installation', 'Intervention Follow Up', 'Other'];
  const MONTHLY = ['Every 30 Days', 'Every 60 Days', 'Every 90 Days', 'Every 120 Days', 'Every 6 Months', 'Every Year'];
  const SPECIFIC = ['Every Month', 'Every 2 Months', 'Every 3 Months', 'Every 6 Months', 'Every Year'];
  const WEEKLY = ['Single Week', 'Every Week', 'Every Other Week'];
  const store = (() => { try { localStorage.setItem('__p', '1'); localStorage.removeItem('__p'); return localStorage; } catch { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)) }; } })();
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = fromIso(s); d.setDate(d.getDate() + n); return iso(d); };
  const addMonths = (s, n) => { const d = fromIso(s); d.setMonth(d.getMonth() + n); return iso(d); };
  const mdy = s => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${m}/${d}/${y}`; };
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // ---------- Data ----------
  function seed() {
    const ids = (typeof CC_RAW !== 'undefined' ? CC_RAW.map(r => r.id) : ['robert', 'david', 'kyle', 'brad', 'miles', 'phil', 'bob', 'michelle', 'sarah']);
    const T = [];
    ids.forEach((id, i) => {
      T.push({ id: 't' + i + 'a', pt: id, title: 'Monthly Note', due: addDays(TODAY, 3 + i * 2), rec: 'Every 30 Days', end: '', by: ME, status: 'Not Completed', note: 'Monthly telehealth note.' });
      if (i % 3 === 0) T.push({ id: 't' + i + 'b', pt: id, title: 'Periodic Evaluation Note', due: addDays(TODAY, 10 + i), rec: 'Every 90 Days', end: '', by: ME, status: 'Not Completed', note: '' });
    });
    T.push({ id: 'tx1', pt: 'miles', title: 'Post ER/Hospital Discharge', due: addDays(TODAY, -1), rec: 'Single', end: '', by: ME, status: 'Not Completed', note: 'Call within 48 hours of discharge.' });
    T.push({ id: 'tx2', pt: 'david', title: 'Parameter Review', due: addDays(TODAY, -5), rec: 'Single', end: '', by: ME, status: 'Completed', note: 'BP parameters reviewed with PCP.', done: addDays(TODAY, -4) });
    return T;
  }
  function load() {
    let T = null; try { T = JSON.parse(store.getItem(KEY)); } catch { }
    if (!Array.isArray(T)) { T = seed(); save(T); }
    // Added later: created with Task Name "Other" and a custom name, as on the real site
    if (!T.some(t => t.id === 'tx16') && !store.getItem('ccTaskSeed16')) {
      T.push({ id: 'tx16', pt: 'miles', title: '16 Days Device Reported', due: addDays(TODAY, 1), rec: 'Every 30 Days', end: '', by: ME, status: 'Not Completed', note: 'Confirm the device has reported on at least 16 days in the current 30-day period.' });
      store.setItem('ccTaskSeed16', '1'); save(T);
    }
    return T;
  }
  const save = T => store.setItem(KEY, JSON.stringify(T));
  // Due date category as on the real Work List: -1 overdue, 0 due today, 1 due in the next 7 days, 2 due in the next 14 days, 3 later
  const category = t => { const d = Math.round((fromIso(t.due) - fromIso(TODAY)) / 864e5); return d < 0 ? -1 : d === 0 ? 0 : d <= 7 ? 1 : d <= 14 ? 2 : 3; };
  const open = (T, pt) => T.filter(t => t.pt === pt && t.status === 'Not Completed').sort((a, b) => a.due.localeCompare(b.due));
  function nextDue(t) {
    const r = t.rec, d = t.due;
    const n = { 'Every 30 Days': [30], 'Every 60 Days': [60], 'Every 90 Days': [90], 'Every 120 Days': [120], 'Every Week': [7], 'Every Other Week': [14], 'Every 6 Months': [0, 6], 'Every Year': [0, 12], 'Every Month': [0, 1], 'Every 2 Months': [0, 2], 'Every 3 Months': [0, 3] }[r];
    if (!n) return null;
    const nx = n[0] ? addDays(d, n[0]) : addMonths(d, n[1]);
    return t.end && nx > t.end ? null : nx;
  }
  function complete(ids) {
    const T = load(); let n = 0;
    ids.forEach(id => { const t = T.find(x => x.id === id); if (!t || t.status !== 'Not Completed') return; t.status = 'Completed'; t.done = TODAY; n++;
      const nx = nextDue(t); if (nx) T.push({ ...t, id: 't' + Date.now() + Math.random().toString(36).slice(2, 6), due: nx, status: 'Not Completed', done: undefined }); });
    save(T); return n;
  }

  // ---------- Create / edit dialog (CareConsole 3.0 Task.aspx) ----------
  const CSS = `
  .tkOv { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 100000; display: flex; align-items: flex-start; justify-content: center; padding: 30px 12px; overflow: auto; font-family: Poppins, Arial, sans-serif; }
  .tkDlg { background: #fff; width: 640px; max-width: 100%; border-radius: 4px; padding: 20px 26px; position: relative; color: #333; box-shadow: 0 6px 24px rgba(0,0,0,.35); font-size: 14px; }
  .tkDlg h2 { color: #004a98; margin: 0 0 4px; font-size: 22px; }
  .tkDlg .x { position: absolute; top: 14px; right: 18px; width: 28px; height: 28px; border: 2px solid #004a98; border-radius: 50%; background: none; color: #004a98; cursor: pointer; }
  .tkDlg label.f { display: block; font-weight: 600; margin: 12px 0 3px; } .tkDlg .req { color: #b3261e; }
  .tkDlg select, .tkDlg input[type=text], .tkDlg input[type=date], .tkDlg textarea { font: inherit; font-size: 14px; border: 1px solid #a9a9a9; padding: 3px 6px; border-radius: 2px; }
  .tkDlg textarea { width: 100%; height: 70px; box-sizing: border-box; resize: vertical; }
  .tkDlg .tabs { display: flex; gap: 2px; margin-top: 14px; border-bottom: 2px solid #004a98; }
  .tkDlg .tabs span { padding: 5px 14px; cursor: pointer; background: #e6eef8; color: #004a98; font-weight: 600; border-radius: 3px 3px 0 0; }
  .tkDlg .tabs span.on { background: #004a98; color: #fff; }
  .tkDlg .body { border: 1px solid #c8d3e3; border-top: 0; padding: 12px; display: grid; grid-template-columns: 130px 1fr; gap: 10px 10px; align-items: center; }
  .tkDlg .body b { font-weight: 600; }
  .tkDlg .err { color: #b3261e; font-size: 12px; min-height: 16px; margin-top: 8px; }
  .tkDlg .pts { color: #004a98; }
  .tkDlg .foot { display: flex; justify-content: center; gap: 8px; border-top: 3px solid #aaa; margin-top: 14px; padding-top: 10px; }
  .tkDlg .foot button { font: inherit; font-weight: 700; min-width: 120px; height: 42px; border-radius: 4px; border: 2px solid #004a98; cursor: pointer; background: #fff; color: #004a98; }
  .tkDlg .foot button.pri { background: #004a98; color: #fff; }
  .tkDlg .days label { margin-right: 8px; white-space: nowrap; }`;

  // opts: { patients: [{ id, name }], task (existing task to edit), onSaved() }
  function dialog(opts) {
    if (!document.getElementById('tkCss')) { const s = document.createElement('style'); s.id = 'tkCss'; s.textContent = CSS; document.head.appendChild(s); }
    const T = load(), t = opts.task ? T.find(x => x.id === opts.task) : null;
    const pts = t ? [{ id: t.pt, name: opts.patients?.[0]?.name || t.pt }] : opts.patients;
    const known = t && NAMES.includes(t.title);
    let tab = t ? (t.rec === 'Single' ? 'Single Task' : WEEKLY.includes(t.rec) ? 'Weekly Task' : 'Monthly Task') : 'Monthly Task';
    const ov = document.createElement('div'); ov.className = 'tkOv';
    ov.innerHTML = `<div class="tkDlg" role="dialog" aria-labelledby="tkH"><button class="x" data-close aria-label="Close">&#x2715;</button><h2 id="tkH">${t ? 'Edit Task' : 'Create New Task'}</h2><div>Create a task by entering task name and due date.</div>
      <div style="margin-top:10px"><b>Patient Name:</b> <span class="pts">${pts.map(p => esc(p.name)).join('; ')}</span></div>
      <label class="f" for="tkName">Task Name <span class="req">*</span></label><select id="tkName"><option value="">Select</option>${NAMES.map(n => `<option ${t && (known ? t.title === n : n === 'Other') ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <input type="text" id="tkOther" placeholder="Enter task name" maxlength="50" style="margin-left:8px;width:230px;${t && !known ? '' : 'display:none'}" value="${t && !known ? esc(t.title) : ''}">
      <label class="f" for="tkNote">Task Note</label><textarea id="tkNote">${esc(t ? t.note : '')}</textarea>
      <div class="tabs">${['Monthly Task', 'Weekly Task', 'Single Task'].map(x => `<span data-tab="${x}" class="${x === tab ? 'on' : ''}">${x}</span>`).join('')}</div><div class="body" id="tkBody"></div>
      <div class="err" id="tkErr"></div>
      <div class="foot"><button data-close>Close</button>${t && t.status === 'Not Completed' ? '<button id="tkCancel">Cancel Task</button>' : ''}<button class="pri" id="tkSave">${t ? 'Save' : 'Create'}</button></div></div>`;
    document.body.appendChild(ov);
    const $ = id => ov.querySelector('#' + id), err = m => $('tkErr').textContent = m;
    const opt = (list, cur) => `<option value="">Select</option>${list.map(x => `<option ${x === cur ? 'selected' : ''}>${x}</option>`).join('')}`;
    function draw() {
      ov.querySelectorAll('[data-tab]').forEach(s => s.classList.toggle('on', s.dataset.tab === tab));
      const due = t ? t.due : '', rec = t ? t.rec : '', end = t ? t.end : '', spec = SPECIFIC.includes(rec) && !MONTHLY.includes(rec);
      $('tkBody').innerHTML = tab === 'Monthly Task'
        ? `<b>First Due Date <span class="req">*</span></b><span><input type="date" id="tkDue" value="${due}"> <label><input type="checkbox" id="tkSpec" ${spec ? 'checked' : ''}> Use Specific Date</label></span>
           <b>Recurrence <span class="req">*</span></b><select id="tkRec">${opt(spec ? SPECIFIC : MONTHLY, rec)}</select>
           <b>End Date</b><span><input type="date" id="tkEnd" value="${end}" ${end ? '' : 'disabled'}> <label><input type="checkbox" id="tkNoEnd" ${end ? '' : 'checked'}> No End Date</label></span>`
        : tab === 'Weekly Task'
        ? `<b>First Due Date <span class="req">*</span></b><input type="date" id="tkDue" value="${due}">
           <b>Recurrence <span class="req">*</span></b><select id="tkRec">${opt(WEEKLY, rec)}</select>
           <b>Day(s)</b><span class="days">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<label><input type="checkbox"> ${d}</label>`).join('')}<label><input type="checkbox"> Everyday</label></span>
           <b>Time</b><span><select>${[...Array(12)].map((_, j) => `<option>${j + 1}</option>`).join('')}</select> : <select><option>00</option><option>15</option><option>30</option><option>45</option></select> <select><option>AM</option><option>PM</option></select> <label><input type="checkbox" checked> Any Time</label></span>
           <b>End Date</b><span><input type="date" id="tkEnd" value="${end}" ${end ? '' : 'disabled'}> <label><input type="checkbox" id="tkNoEnd" ${end ? '' : 'checked'}> No End Date</label></span>`
        : `<b>Due Date <span class="req">*</span></b><input type="date" id="tkDue" value="${due}">`;
      const sp = $('tkSpec'); if (sp) sp.onchange = () => { $('tkRec').innerHTML = opt(sp.checked ? SPECIFIC : MONTHLY, ''); };
      const ne = $('tkNoEnd'); if (ne) ne.onchange = () => { $('tkEnd').disabled = ne.checked; if (ne.checked) $('tkEnd').value = ''; };
    }
    draw();
    ov.querySelectorAll('[data-tab]').forEach(s => s.onclick = () => { tab = s.dataset.tab; draw(); });
    $('tkName').onchange = () => { const o = $('tkName').value === 'Other'; $('tkOther').style.display = o ? '' : 'none'; if (o) $('tkOther').focus(); };
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    ov.querySelectorAll('[data-close]').forEach(b => b.onclick = close);
    const cb = $('tkCancel'); if (cb) cb.onclick = () => { const L = load(), x = L.find(y => y.id === t.id); x.status = 'Canceled'; save(L); close(); opts.onSaved && opts.onSaved(); };
    $('tkSave').onclick = () => {
      const sel = $('tkName').value, name = sel === 'Other' ? $('tkOther').value.trim() : sel, due = $('tkDue').value, recEl = $('tkRec'), rec = tab === 'Single Task' ? 'Single' : recEl.value, endEl = $('tkEnd'), end = endEl && !endEl.disabled ? endEl.value : '';
      if (!sel) return err('Please select a Task Name.');
      if (!name) return err('Please enter the task name.');
      if (!due) return err(tab === 'Single Task' ? 'Please select the Due Date.' : 'Please select the First Due Date.');
      if (!rec) return err('Please select the Recurrence.');
      if (end && end < due) return err('End date cannot be earlier than first due date');
      const L = load(), fields = { title: name, note: $('tkNote').value.trim(), due, rec, end };
      if (t) Object.assign(L.find(y => y.id === t.id), fields);
      else pts.forEach((p, j) => L.push({ id: 't' + Date.now() + j, pt: p.id, by: ME, status: 'Not Completed', ...fields }));
      save(L); close(); opts.onSaved && opts.onSaved(t ? 1 : pts.length);
    };
    setTimeout(() => $('tkName').focus(), 0);
  }

  window.CCTasks = { load, save, open, category, complete, dialog, NAMES, TODAY, mdy, fromIso };
})();
