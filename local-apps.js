// Adds a second browser window to the simulated VA desktop that runs the
// Omnivisor Faux mockup (omnivisor.html). "Fauxtronic" is a fictional vendor.
(() => {
  'use strict';
  if (!window.VADesk) return;
  const $ = id => document.getElementById(id);

  const css = document.createElement('style');
  css.textContent = `
  .ico-chrome { border-radius: 50%; background: conic-gradient(from -60deg, #db4437 0 120deg, #f4b400 0 240deg, #0f9d58 0 360deg); position: relative; }
  .ico-chrome::after { content: ''; position: absolute; inset: 30%; border-radius: 50%; background: #4285f4; box-shadow: 0 0 0 2px #fff; }
  .win.chrome .bTabs { background: #dee1e6; }
  .win.chrome .bTab .fav.ov { background: #1d3f8f; }
  .win.chrome .bFavs .fav.ov { background: #1d3f8f; }
  .ovLocal { margin-left: auto; font-size: 11px; color: #a33; padding-right: 6px; }`;
  document.head.appendChild(css);

  const RZ = '<div class="grip"></div>' + ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(d => `<div class="rz ${d}" data-rz="${d}"></div>`).join('');
  const w = document.createElement('div');
  w.className = 'win browser chrome hidden';
  w.id = 'win-ov';
  w.style.cssText = 'left:190px;top:60px;width:1180px;height:720px';
  w.innerHTML = `
  <div class="titlebar" data-drag><div class="tIco appIco ico-chrome"></div><div class="tText" id="ovTitle">Omnivisor Faux</div>
    <div class="tBtns"><button data-min title="Minimize">&#8211;</button><button data-max title="Maximize">&#9744;</button><button class="x" data-close title="Close">&#10005;</button></div></div>
  <div class="bTabs"><div class="bTab"><div class="fav ov">OV</div><span id="ovTab">Omnivisor Faux</span><span style="color:#888">&#10005;</span></div><div class="bTab newT" style="min-width:30px;background:transparent">+</div></div>
  <div class="bBar">
    <button id="ovBack" title="Back">&#8592;</button><button id="ovFwd" title="Forward">&#8594;</button><button id="ovReload" title="Refresh">&#8635;</button>
    <div class="addr"><span class="lock">&#128274;</span><span><span class="host">vaomnivisor.fauxtronic.example</span><span class="path" id="ovPath">/OmnivisorFaux/Login.aspx</span></span></div>
    <button title="Bookmark">&#9734;</button><button title="Customize and control">&#8942;</button>
  </div>
  <div class="bFavs"><a id="ovFavHome"><span class="fav ov">OV</span>VA Omnivisor Faux</a><a><span class="fav" style="background:#888">VA</span>VA Intranet</a></div>
  <div class="bView"><iframe id="ovFrame" title="Omnivisor Faux" allow="clipboard-read; clipboard-write"></iframe></div>
  ${RZ}`;
  $('win-cerner').after(w);

  // Taskbar button after PowerChart
  const tb = document.createElement('button');
  tb.className = 'tbBtn'; tb.id = 'tb-ov';
  tb.innerHTML = '<div class="appIco ico-chrome"></div><span class="tbTip" id="ovTip">Omnivisor Faux - Browser</span>';
  $('tb-cerner').after(tb);

  // Desktop icon and Start menu entry
  const dicon = document.createElement('div');
  dicon.className = 'dicon';
  dicon.innerHTML = '<div class="ico appIco ico-chrome"></div>Omnivisor Faux';
  const lastIcon = [...document.querySelectorAll('.dicon')].pop();
  if (lastIcon) lastIcon.after(dicon);
  const app = document.createElement('div');
  app.className = 'app';
  app.innerHTML = '<div class="appIco ico-chrome"></div>Omnivisor Faux';
  const apps = document.querySelector('#startMenu .apps');
  if (apps) apps.appendChild(app);

  VADesk.addWindow('ov', w);
  w.dataset.closed = '1';
  const frame = $('ovFrame');
  const open = () => { $('startMenu').classList.remove('open'); if (!frame.src) frame.src = 'omnivisor.html'; VADesk.showWin('ov'); };
  dicon.addEventListener('dblclick', open);
  app.addEventListener('click', open);
  tb.addEventListener('click', () => { if (!frame.src) frame.src = 'omnivisor.html'; }, true);

  if (innerWidth < 1100) w.classList.add('max');
  else { w.style.left = '190px'; w.style.top = '60px'; w.style.width = Math.min(1500, innerWidth - 220) + 'px'; w.style.height = (innerHeight - 44 - 60 - 16) + 'px'; }

  frame.addEventListener('load', () => {
    let title = 'Omnivisor Faux', path = '';
    try { title = frame.contentDocument.title || title; path = frame.contentWindow.ovPath || ''; } catch { }
    $('ovTab').textContent = title;
    $('ovTitle').textContent = title + ' - Browser';
    $('ovTip').textContent = $('ovTitle').textContent;
    $('ovPath').textContent = path || '/OmnivisorFaux/Login.aspx';
  });
  // The page reports its own "address" as the user moves between screens
  window.addEventListener('message', e => {
    if (e.source !== frame.contentWindow || !e.data || e.data.type !== 'ov-nav') return;
    $('ovPath').textContent = e.data.path;
    $('ovTab').textContent = e.data.title;
    $('ovTitle').textContent = e.data.title + ' - Browser';
    $('ovTip').textContent = $('ovTitle').textContent;
  });
  $('ovBack').onclick = () => { try { frame.contentWindow.ovBack(); } catch { } };
  $('ovFwd').onclick = () => { };
  $('ovReload').onclick = () => { try { frame.contentWindow.location.reload(); } catch { frame.src = frame.src; } };
  $('ovFavHome').onclick = () => { frame.src = 'omnivisor.html'; };

  VADesk.onUnlock(() => { });
})();
