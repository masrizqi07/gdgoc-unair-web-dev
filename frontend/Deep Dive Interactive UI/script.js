/* Module version: register custom elements and wire global UI */
class DemoTabs extends HTMLElement{
  constructor(){ super(); this.attachShadow({mode:'open'}) }
  connectedCallback(){ this.render(); this.shadowRoot.addEventListener('click',e=>{if(e.target.matches('[data-id]')) this.show(e.target.dataset.id)}) }
  render(){ this.shadowRoot.innerHTML = `
    <style> :host{display:block} .tab-buttons{display:flex;gap:6px;margin-bottom:8px} button{padding:.35rem .6rem} .panel{padding:.5rem;border-radius:6px;background:var(--card)} </style>
    <div class="tab-buttons">
      <button data-id="a">A</button>
      <button data-id="b">B</button>
      <button data-id="c">C</button>
    </div>
    <div class="panel" data-id="a">Content A — click the buttons to switch panels.</div>
    <div class="panel" data-id="b" hidden>Content B — DOM manipulation example.</div>
    <div class="panel" data-id="c" hidden>Content C — lightweight state.</div>
  ` }
  show(id){ this.shadowRoot.querySelectorAll('[data-id]').forEach(el=>el.hidden=el.dataset.id!==id) }
}

class DragList extends HTMLElement{
  constructor(){ super(); this.attachShadow({mode:'open'}) }
  connectedCallback(){ this.render(); this.init(); }
  render(){ this.shadowRoot.innerHTML = `
    <style>ul{list-style:none;padding:0;margin:0} li{padding:.5rem;border:1px solid rgba(0,0,0,0.06);margin-bottom:.4rem;border-radius:6px;background:var(--card);cursor:grab}</style>
    <h3>Drag & Drop</h3>
    <ul id="list">
      <li draggable="true">Item 1</li>
      <li draggable="true">Item 2</li>
      <li draggable="true">Item 3</li>
    </ul>
  ` }
  init(){ const list=this.shadowRoot.getElementById('list'); let src=null; list.addEventListener('dragstart',e=>src=e.target); list.addEventListener('dragover',e=>e.preventDefault()); list.addEventListener('drop',e=>{e.preventDefault(); if(!e.target || e.target.tagName!=='LI') return; if(src===e.target) return; const nodes=[...list.children]; const s=nodes.indexOf(src), d=nodes.indexOf(e.target); if(s<d) e.target.after(src); else e.target.before(src); }) }
}

class TodoApp extends HTMLElement{
  constructor(){ super(); this.attachShadow({mode:'open'}); this.STORAGE='demo-todos-v1' }
  connectedCallback(){ this.render(); this.hook(); this.renderList(); }
  render(){ this.shadowRoot.innerHTML = `
    <style>form{display:flex;gap:8px} input{flex:1;padding:.5rem} ul{padding:0;list-style:none;margin-top:.6rem} li{display:flex;justify-content:space-between;padding:.4rem .6rem;border-bottom:1px dashed rgba(0,0,0,0.04)}</style>
    <form id="form"><input id="input" placeholder="Add new todo"><button>Add</button></form>
    <ul id="list"></ul>
  ` }
  hook(){ this.shadowRoot.getElementById('form').addEventListener('submit',e=>{e.preventDefault(); const v=this.shadowRoot.getElementById('input').value.trim(); if(!v) return; const arr=this.load(); arr.push(v); this.save(arr); this.shadowRoot.getElementById('input').value=''; this.renderList(); }) }
  load(){ return JSON.parse(localStorage.getItem(this.STORAGE)||'[]') }
  save(arr){ localStorage.setItem(this.STORAGE,JSON.stringify(arr)) }
  renderList(){ const list=this.shadowRoot.getElementById('list'); list.innerHTML=''; this.load().forEach((t,i)=>{ const li=document.createElement('li'); li.textContent=t; const rm=document.createElement('button'); rm.textContent='✕'; rm.addEventListener('click',()=>{ const a=this.load(); a.splice(i,1); this.save(a); this.renderList(); }); li.appendChild(rm); list.appendChild(li); }) }
}

class DomInspector extends HTMLElement{
  constructor(){ super(); this.attachShadow({mode:'open'}); this.active=false }
  connectedCallback(){ this.render(); this.shadowRoot.getElementById('toggle').addEventListener('click',()=>this.toggle()) }
  render(){ this.shadowRoot.innerHTML = `
    <style>#out{white-space:pre-wrap;background:linear-gradient(180deg,rgba(0,0,0,0.02),transparent);padding:.5rem;border-radius:6px;margin:.5rem 0}</style>
    <p>Select an element on the page to inspect live details below.</p>
    <div id="out">No element selected.</div>
    <button id="toggle">Start Inspecting</button>
  ` }
  toggle(){ this.active=!this.active; const btn=this.shadowRoot.getElementById('toggle'); btn.textContent=this.active?'Stop Inspecting':'Start Inspecting'; document.body.style.cursor=this.active?'crosshair':''; if(this.active) document.addEventListener('click',this.handler,true); else document.removeEventListener('click',this.handler,true) }
  handler = (e)=>{ e.preventDefault(); e.stopPropagation(); this.highlight(e.target); this.showInfo(e.target) }
  showInfo(el){ this.shadowRoot.getElementById('out').textContent = `tag: ${el.tagName.toLowerCase()}\nclasses: ${el.className || '-'}\ntext: ${el.textContent.trim().slice(0,120)}` }
  highlight(el){ document.querySelectorAll('.highlight').forEach(n=>n.classList.remove('highlight')); el.classList.add('highlight'); setTimeout(()=>el.classList.remove('highlight'),1200) }
}

customElements.define('demo-tabs', DemoTabs);
customElements.define('drag-list', DragList);
customElements.define('todo-app', TodoApp);
customElements.define('dom-inspector', DomInspector);

/* Global UI (theme + modal + tabs switching) */
document.addEventListener('DOMContentLoaded',()=>{
  // panel switching
  document.querySelectorAll('.tabs button').forEach(btn=> btn.addEventListener('click',()=>{
    document.querySelectorAll('main .panel').forEach(p=>{p.hidden = p.id!==btn.dataset.target; p.setAttribute('aria-hidden', p.hidden)})
    document.querySelectorAll('.tabs button').forEach(b=>b.setAttribute('aria-selected', b.dataset.target===btn.dataset.target))
  }))

  // theme
  const btn=document.getElementById('theme-toggle'); const body=document.body; const set=(dark)=>{body.classList.toggle('dark',dark); localStorage.setItem('ui-dark', dark?'1':'0')}
  set(localStorage.getItem('ui-dark')==='1'); btn.addEventListener('click',()=>set(!body.classList.contains('dark')))

  // modal
  const open=document.getElementById('open-modal'); const modal=document.getElementById('modal'); const close=document.getElementById('close-modal');
  open?.addEventListener('click',()=>{modal.hidden=false; modal.querySelector('.close').focus()});
  close?.addEventListener('click',()=>{modal.hidden=true; open?.focus()});
  modal?.addEventListener('click',e=>{ if(e.target===modal) modal.hidden=true })

  // keyboard highlight
  document.addEventListener('keydown',e=>{ if(e.key.toLowerCase()==='g'){ document.querySelector('.site-header')?.classList.add('highlight'); setTimeout(()=>document.querySelector('.site-header')?.classList.remove('highlight'),900) } })
});
