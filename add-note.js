/*
  "Add a Note" dialog with a visit timer, shared by the CareConsole mockup pages
  (Work List "Write a Note" icon and Patient Record > Past Notes).

  ccAddNote({ pt, name, edit, onSaved })
    pt      patient id (e.g. 'kyle')
    name    patient name to show
    edit    id of an existing note to modify (optional)
    onSaved called with the saved note

  Notes are kept in localStorage "ccCareNotes" as an array of
  { id, pt, author, date, contactType, noteTitle, durationMinutes, startTime, endTime, startTimeSource, comments }.
  The mock's "today" is 6/29/2026, so new notes default to that date; times use the real clock.
*/
(function () {
  'use strict';
  const KEY = 'ccCareNotes', AUTHOR = 'Borne, Ben', MOCK_TODAY = '2026-06-29';
  const TITLES = ['RPM-HT Tech Education Note/Template', 'RPM-HT L2 Tech Education Note/Template', 'RPM-HT Intervention Note Template', 'RPM-HT L2 Intervention Note/Template',
    'RPM-HT Provider Notification', 'RPM-HT Assessment Treatment Plan Note/Template', 'RPM-HT L2 Assessment Treatment Plan Note/Template', 'RPM-HT Periodic Evaluation',
    'RPM-HT Continuum of Care', 'RPM-HT Note', 'RPM-HT Discharge Note'];
  const TYPES = ['Phone', 'VVC', 'In person', 'Portal message', 'Other'];
  const store = (() => {
    try { localStorage.setItem('__probe', '1'); localStorage.removeItem('__probe'); return localStorage; }
    catch { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; }
  })();
  const load = () => { try { return JSON.parse(store.getItem(KEY)) || []; } catch { return []; } };
  const save = list => store.setItem(KEY, JSON.stringify(list));
  const pad = n => String(n).padStart(2, '0');
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const wrap = t => ((t % 1440) + 1440) % 1440;
  const toTimeValue = t => `${pad(Math.floor(wrap(t) / 60))}:${pad(wrap(t) % 60)}`;
  const fmt12 = t => { const h = Math.floor(wrap(t) / 60), m = wrap(t) % 60; return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`; };
  const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const toMin = v => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };

  const CSS = `
  .anOv { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 16px; font-family: Arial, Helvetica, sans-serif; }
  .anModal { background: #fff; width: 100%; max-width: 980px; max-height: calc(100vh - 32px); overflow: auto; border-radius: 4px; padding: 20px 28px; position: relative; color: #333; box-shadow: 0 6px 24px rgba(0,0,0,.35); }
  .anModal h1 { color: #004a98; font-size: 24px; font-weight: bold; margin: 0 0 18px; }
  .anClose { position: absolute; top: 16px; right: 22px; width: 30px; height: 30px; border: 2px solid #004a98; border-radius: 50%; background: none; color: #004a98; font-size: 16px; cursor: pointer; line-height: 1; }
  .anForm { display: grid; grid-template-columns: 130px minmax(0, 1fr); gap: 12px 14px; align-items: center; font-size: 14px; }
  .anForm > label, .anForm > .anL { font-weight: bold; }
  .anReq { color: #b3261e; }
  .anModal input, .anModal select, .anModal textarea { font: inherit; font-size: 14px; border: 1px solid #a9a9a9; padding: 3px 6px; border-radius: 2px; }
  .anModal textarea { width: 100%; min-height: 150px; resize: vertical; box-sizing: border-box; }
  .anRow { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .anSub { font-size: 13px; color: #666; }
  .anStep { display: inline-flex; }
  .anStep input { width: 60px; text-align: center; border-radius: 0; border-left: 0; border-right: 0; -moz-appearance: textfield; appearance: textfield; }
  .anStep input::-webkit-inner-spin-button, .anStep input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .anStep button { width: 30px; font-size: 16px; border: 1px solid #a9a9a9; background: #f4f4f4; cursor: pointer; }
  .anChip { font: inherit; font-size: 13px; padding: 3px 11px; border: 1px solid #004a98; background: #fff; color: #004a98; border-radius: 999px; cursor: pointer; }
  .anChip.sel { background: #004a98; color: #fff; }
  .anChip:disabled, .anStep button:disabled { opacity: .45; cursor: not-allowed; }
  .anTimer { font: inherit; font-size: 13px; font-weight: bold; padding: 4px 12px; border: 2px solid #004a98; background: #fff; color: #004a98; border-radius: 4px; cursor: pointer; }
  .anTimer.run { border-color: #b3261e; color: #b3261e; }
  .anDur { margin-top: 5px; font-size: 13px; color: #666; } .anDur b { color: #333; }
  .anErr { display: block; font-size: 12px; color: #b3261e; margin-top: 3px; } .anErr:empty { display: none; }
  .anAct { border-top: 3px solid #aaa; margin-top: 22px; padding-top: 10px; display: flex; justify-content: center; gap: 6px; }
  .anAct button { font: inherit; font-size: 16px; font-weight: bold; min-width: 150px; height: 50px; border-radius: 4px; cursor: pointer; border: 2px solid #004a98; }
  .anCancel { background: #fff; color: #004a98; } .anSubmit { background: #004a98; color: #fff; }
  .anToast { position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%); background: #2e7d32; color: #fff; padding: 8px 18px; border-radius: 4px; z-index: 100001; font: 14px Arial, sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,.3); }`;

  function toast(msg) { const t = document.createElement('div'); t.className = 'anToast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3000); }

  function open(opts) {
    if (!document.getElementById('anCss')) { const s = document.createElement('style'); s.id = 'anCss'; s.textContent = CSS; document.head.appendChild(s); }
    const editing = opts.edit ? load().find(n => n.id === opts.edit) : null;
    const ov = document.createElement('div'); ov.className = 'anOv';
    ov.innerHTML = `<div class="anModal" role="dialog" aria-labelledby="anTitle"><button class="anClose" data-x aria-label="Close">&#x2715;</button><h1 id="anTitle">${editing ? 'Modify Note' : 'Add a Note'}</h1>
      <div class="anForm">
        <span class="anL">Patient:</span><span>${esc(opts.name)}</span>
        <label for="anDate">Date:<span class="anReq">*</span></label><div><input id="anDate" type="date"><span class="anErr" id="anEDate"></span></div>
        <label for="anType">Contact type:<span class="anReq">*</span></label><div><select id="anType"><option value="">Select type</option>${TYPES.map(t => `<option>${t}</option>`).join('')}</select><span class="anErr" id="anEType"></span></div>
        <label for="anNT">Note title:<span class="anReq">*</span></label><div><select id="anNT"><option value="">Select note title</option>${TITLES.map(t => `<option>${t}</option>`).join('')}</select><span class="anErr" id="anETitle"></span></div>
        <label for="anMin">Time spent:<span class="anReq">*</span></label><div>
          <div class="anRow"><div class="anStep"><button type="button" id="anMinus" aria-label="Subtract 1 minute">&minus;</button><input id="anMin" type="number" min="1" step="1" inputmode="numeric"><button type="button" id="anPlus" aria-label="Add 1 minute">+</button></div>
            <span class="anSub">min</span>${[5, 10, 15, 20, 30].map(m => `<button type="button" class="anChip" data-min="${m}">${m} min</button>`).join('')}
            <span class="anSub">or</span><button type="button" class="anTimer" id="anTimer">&#9654; Start timer</button></div>
          <div class="anDur" id="anSum">&ndash;</div><span class="anErr" id="anETime"></span></div>
        <label for="anH">Start time:</label><div class="anRow"><select id="anH" aria-label="Start hour"><option value="">--</option></select><select id="anM" aria-label="Start minute"><option value="">--</option></select><select id="anP" aria-label="AM or PM"><option value="">--</option><option>AM</option><option>PM</option></select>
          <span class="anSub">Filled in as the current time minus time spent. Change it if the visit ended earlier.</span></div>
        <label for="anCom" style="align-self:start;padding-top:4px">Comments:<span class="anReq">*</span></label><div><textarea id="anCom"></textarea><span class="anErr" id="anECom"></span></div>
      </div>
      <div class="anAct"><button type="button" class="anCancel" data-x>Cancel</button><button type="button" class="anSubmit" id="anSubmit">Submit</button></div></div>`;
    document.body.appendChild(ov);
    const $ = id => ov.querySelector('#' + id);
    const minEl = $('anMin'), timerBtn = $('anTimer'), sumEl = $('anSum');
    const chips = [...ov.querySelectorAll('.anChip')], steps = [$('anMinus'), $('anPlus')];
    const startSel = [$('anH'), $('anM'), $('anP')], [hourEl, minuteEl, periodEl] = startSel;
    for (let h = 1; h <= 12; h++) hourEl.add(new Option(h, h));
    for (let m = 0; m < 60; m++) minuteEl.add(new Option(pad(m), pad(m)));
    let timerId = null, timerStart = null, startSource = null; // 'auto' | 'timer' | 'entered'

    const getMinutes = () => { const n = Number(minEl.value); return minEl.value !== '' && Number.isInteger(n) && n > 0 ? n : null; };
    const getStart = () => startSel.some(s => !s.value) ? null : (Number(hourEl.value) % 12 + (periodEl.value === 'PM' ? 12 : 0)) * 60 + Number(minuteEl.value);
    function setStart(t) {
      if (t === null) { startSel.forEach(s => s.value = ''); return; }
      const h = Math.floor(wrap(t) / 60); hourEl.value = h % 12 || 12; minuteEl.value = pad(wrap(t) % 60); periodEl.value = h < 12 ? 'AM' : 'PM';
    }
    function resolveTimes() {
      const dur = getMinutes(); if (dur === null) return null;
      const entered = getStart(), start = entered ?? nowMin() - dur;
      return { dur, start, end: start + dur, source: entered === null ? 'defaulted' : startSource || 'entered' };
    }
    function updateSummary() {
      chips.forEach(c => c.classList.toggle('sel', Number(c.dataset.min) === getMinutes()));
      if (timerId) return;
      const t = resolveTimes();
      sumEl.innerHTML = !t ? '&ndash;' : `<b>${t.dur} min</b> &middot; ${fmt12(t.start)} &ndash; ${fmt12(t.end)}${t.source === 'defaulted' ? ' <i>(start time estimated)</i>' : ''}`;
    }
    function autoFillStart() {
      if (startSource !== null && startSource !== 'auto') return;
      const dur = getMinutes(); setStart(dur === null ? null : nowMin() - dur); startSource = dur === null ? null : 'auto';
    }
    function setMinutes(n) { minEl.value = n; $('anETime').textContent = ''; autoFillStart(); updateSummary(); }
    function setRunning(r) {
      timerBtn.innerHTML = r ? '&#9632; Stop timer' : '&#9654; Start timer'; timerBtn.classList.toggle('run', r);
      minEl.readOnly = r; [...chips, ...steps].forEach(b => b.disabled = r);
    }
    const tick = () => { const s = Math.floor((Date.now() - timerStart) / 1000); sumEl.innerHTML = `<b>${Math.floor(s / 60)}m ${pad(s % 60)}s</b> (running)`; };
    timerBtn.onclick = () => {
      if (!timerId) { timerStart = Date.now(); setStart(nowMin()); startSource = 'timer'; minEl.value = ''; $('anETime').textContent = ''; updateSummary(); setRunning(true); tick(); timerId = setInterval(tick, 1000); }
      else { clearInterval(timerId); timerId = null; setRunning(false); setMinutes(Math.max(1, Math.round((Date.now() - timerStart) / 60000))); }
    };
    chips.forEach(c => c.onclick = () => setMinutes(Number(c.dataset.min)));
    $('anMinus').onclick = () => setMinutes(Math.max(1, (getMinutes() ?? 2) - 1));
    $('anPlus').onclick = () => setMinutes((getMinutes() ?? 0) + 1);
    minEl.oninput = () => { $('anETime').textContent = ''; autoFillStart(); updateSummary(); };
    startSel.forEach(s => s.onchange = () => {
      if (!s.value) { setStart(null); startSource = null; }
      else { const h = Math.floor(nowMin() / 60); if (!hourEl.value) hourEl.value = h % 12 || 12; if (!minuteEl.value) minuteEl.value = '00'; if (!periodEl.value) periodEl.value = h < 12 ? 'AM' : 'PM'; startSource = 'entered'; }
      updateSummary();
    });
    const refresh = setInterval(() => { if (getStart() === null) updateSummary(); }, 30000);
    $('anType').onchange = () => $('anEType').textContent = '';
    $('anNT').onchange = () => $('anETitle').textContent = '';
    $('anCom').oninput = () => $('anECom').textContent = '';
    $('anDate').oninput = () => $('anEDate').textContent = '';

    if (editing) {
      $('anDate').value = editing.date; $('anType').value = editing.contactType; $('anNT').value = editing.noteTitle;
      minEl.value = editing.durationMinutes; setStart(toMin(editing.startTime)); startSource = 'entered'; $('anCom').value = editing.comments; updateSummary();
    } else $('anDate').value = MOCK_TODAY;

    function close() { if (timerId && !confirm('The timer is still running. Close without saving this note?')) return; clearInterval(timerId); clearInterval(refresh); ov.remove(); document.removeEventListener('keydown', onKey); }
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    ov.querySelectorAll('[data-x]').forEach(b => b.onclick = close);

    $('anSubmit').onclick = () => {
      let ok = true;
      if (!$('anDate').value) { $('anEDate').textContent = 'Enter a date'; ok = false; }
      if (!$('anType').value) { $('anEType').textContent = 'Select a contact type'; ok = false; }
      if (!$('anNT').value) { $('anETitle').textContent = 'Select a note title'; ok = false; }
      if (timerId) { $('anETime').textContent = 'Stop the timer first'; ok = false; }
      else if (getMinutes() === null) { $('anETime').textContent = 'Enter time spent in whole minutes'; ok = false; }
      if (!$('anCom').value.trim()) { $('anECom').textContent = 'Enter a comment'; ok = false; }
      if (!ok) return;
      const t = resolveTimes();
      const note = { id: editing ? editing.id : 'n' + Date.now(), pt: opts.pt, author: editing ? editing.author : AUTHOR, date: $('anDate').value,
        contactType: $('anType').value, noteTitle: $('anNT').value, durationMinutes: t.dur, startTime: toTimeValue(t.start), endTime: toTimeValue(t.end),
        startTimeSource: t.source, comments: $('anCom').value.trim() };
      save([...load().filter(n => n.id !== note.id), note]);
      clearInterval(refresh); ov.remove(); document.removeEventListener('keydown', onKey);
      toast(editing ? 'Note updated' : 'Note saved');
      if (opts.onSaved) opts.onSaved(note);
    };
    setTimeout(() => $('anType').focus(), 0);
  }

  window.ccAddNote = open;
  window.ccCareNotes = { load, fmt12: v => fmt12(toMin(v)) };
})();
