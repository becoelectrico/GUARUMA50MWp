/* =====================================================================
   Plataforma Guaruma 50 MW · Módulo RUTA REGULATORIA  (ruta #ruta-regulatoria)
   ---------------------------------------------------------------------
   Qué es: la ruta regulatoria de interconexión del proyecto. Qué pide cada
   ente (CND, EOR, CRIE, ENEE Transmisión, CREE, SEN y SERNA), en qué orden,
   qué bloquea a qué, plazos (días hábiles), ruta crítica, costos, por qué
   San Pedro Sula Sur es nodo RTR y lo que le toca a EHG.
   Objetivo: demostrar que los trámites llegan a tiempo para la puesta en
   marcha del 31 jul 2028 (Resumen Proyecto Solar CAHSA en Asana) partiendo
   de la solicitud de premisas al CND el 30 nov 2026 (fecha X), y señalar
   qué tiene que estar listo de nuestro lado.
   Datos: fijos en este archivo (actualizados al 20 oct 2026). No lee ni
   escribe OneDrive ni Asana.
     · S  = trámites con su detalle técnico/administrativo (pestaña Ruta)
     · T  = tareas del cronograma con dependencias [id, 'FS'|'SS', desfase]
     · plan() = cálculo de fechas en días hábiles y ruta crítica
     · renderCostos(), A (acciones), FER (feriados de Honduras)
   Cómo se monta: la plataforma (index.html) carga este archivo al entrar a
   #ruta-regulatoria y llama a mount(host). Todo vive en un Shadow DOM para
   que sus estilos no choquen con los de la plataforma; hereda sus colores,
   letra y tema claro/oscuro.
   ===================================================================== */
(function () {
'use strict';

const CSS = `
/* Tokens: heredan los de la plataforma (--bg, --surface, --ink, --line, --ok, --warn, --info, --font…); aquí solo los propios del módulo */
:host{display:block;min-width:0;max-width:100%;
  --rr-navy:var(--ink); --muted:var(--ink-2); --accent:var(--orange); --accent-soft:color-mix(in srgb,var(--orange) 13%,var(--surface)); --crit:var(--bad);
  --font-display:var(--font); --font-body:var(--font); --font-mono:var(--font);
  /* colores por ente */
  --c-cnd:#1f4e79;--c-eor:#6b5ca5;--c-crie:#8a3b6e;--c-ett:#2f7d78;--c-cree:#b0611b;--c-sen:#4f7a2a;--c-serna:#7a6a3a; --c-ehg:var(--orange);
  font-family:var(--font);font-size:14px;line-height:1.5;color:var(--ink)}
:host([data-theme="dark"]){--c-cnd:#6d9fd1;--c-eor:#a597de;--c-crie:#d07fb0;--c-ett:#5cc0b8;--c-cree:#e0955a;--c-sen:#93c26b;--c-serna:#c9b77a}
/* Layout: expediente técnico — cabecera de ficha, pestañas, panel de pasos con detalle lateral; paleta EHG (azul marino + naranja) */
*{box-sizing:border-box}
.wrap{max-width:1120px;margin:0 auto;display:flex;flex-direction:column;gap:22px}
h1,h2,h3{font-family:var(--font-display);text-wrap:balance;margin:0;color:var(--rr-navy)}
h1{font-size:clamp(26px,5vw,38px);font-weight:800;letter-spacing:-.01em;line-height:1.1}
h2{font-size:21px;font-weight:700}
h3{font-size:16px;font-weight:700}
p{margin:0}
.eyebrow{font-family:var(--font-mono);font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.mono{font-family:var(--font-mono);font-variant-numeric:tabular-nums}
header.top{display:flex;flex-direction:column;gap:8px;border-bottom:3px solid var(--accent);padding-bottom:16px}
header.top .sub{color:var(--muted);max-width:68ch}
/* ficha */
.ficha{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:6px;overflow:hidden}
.ficha>div{background:var(--surface);padding:14px 16px;display:flex;flex-direction:column;gap:4px;min-width:0}
.ficha .val{font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--rr-navy)}
.ficha .note{font-size:13px;color:var(--muted)}
.ficha .val.hot{color:var(--accent)}
/* tabs */
nav.tabs{display:flex;gap:6px;flex-wrap:wrap;position:sticky;top:var(--rr-top,0px);z-index:5;background:var(--bg);padding-block:8px;border-bottom:1px solid var(--line)}
nav.tabs button{font:600 14px var(--font-body);border:1px solid var(--line);background:var(--surface);color:var(--ink);padding:8px 14px;border-radius:999px;cursor:pointer}
nav.tabs button[aria-selected="true"]{background:var(--rr-navy);color:var(--surface);border-color:var(--rr-navy)}
nav.tabs button:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
section.panel{display:flex;flex-direction:column;gap:16px}
.lead{max-width:72ch;color:var(--ink)}
.callout{background:var(--accent-soft);border-left:4px solid var(--accent);padding:12px 14px;border-radius:0 6px 6px 0;max-width:80ch}
.callout b{color:var(--ink)}
/* legend */
.legend{display:flex;flex-wrap:wrap;gap:8px 14px;font-size:13px;color:var(--muted)}
.legend span{display:inline-flex;align-items:center;gap:6px}
.dot{width:10px;height:10px;border-radius:3px;display:inline-block;flex:none}
/* ruta */
.ruta{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:18px;align-items:start}
@media (max-width:820px){.ruta{grid-template-columns:1fr}}
.fases{display:flex;flex-direction:column;gap:14px}
.fase h3{font-size:13px;font-family:var(--font-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:600;margin-bottom:6px}
.steps{display:flex;flex-direction:column;gap:6px}
.step{display:grid;grid-template-columns:6px 1fr auto;gap:10px;align-items:center;text-align:left;width:100%;background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:9px 12px 9px 0;cursor:pointer;color:var(--ink);font:inherit}
.step .bar{align-self:stretch;border-radius:6px 0 0 6px}
.step .t{font-weight:600;font-size:14.5px;line-height:1.3}
.step .e{font-size:12px;color:var(--muted)}
.step .d{font-family:var(--font-mono);font-size:12px;color:var(--muted);white-space:nowrap}
.step[aria-pressed="true"]{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}
.detalle{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:18px;display:flex;flex-direction:column;gap:14px;position:sticky;top:calc(var(--rr-top,0px) + 56px);min-width:0}
@media (max-width:820px){.detalle{position:static}}
.detalle .head{display:flex;flex-direction:column;gap:4px}
.chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:2px 9px;border-radius:999px;border:1px solid currentColor;width:max-content}
.kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.kv>div{border-top:1px solid var(--line);padding-top:6px;min-width:0}
.kv .k{font-size:11.5px;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.cols2{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px}
.cols2 ul{margin:6px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:4px;font-size:14px}
.tag{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:2px 7px;border-radius:4px}
.tag.norma{background:color-mix(in srgb,var(--ok) 15%,transparent);color:var(--ok)}
.tag.est{background:color-mix(in srgb,var(--warn) 18%,transparent);color:var(--warn)}
.tag.conf{background:color-mix(in srgb,var(--crit) 14%,transparent);color:var(--crit)}
.tag.proy{background:color-mix(in srgb,var(--info) 15%,transparent);color:var(--info)}
.base{font-size:12.5px;color:var(--muted)}
/* gantt controls */
.controls{display:flex;flex-wrap:wrap;gap:12px 20px;align-items:end;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:14px 16px}
.controls label{display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:var(--muted);font-weight:600}
.controls input,.controls select{font:500 15px var(--font-body);padding:7px 10px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--ink)}
.result{display:flex;flex-direction:column;gap:2px}
.result .big{font-family:var(--font-display);font-size:22px;font-weight:800;color:var(--accent)}
.gantt-scroll{overflow-x:auto;border:1px solid var(--line);border-radius:8px;background:var(--surface)}
.gantt{min-width:900px;position:relative}
.g-head,.g-row{display:grid;grid-template-columns:230px 1fr}
.g-head{position:sticky;top:0;background:var(--surface);border-bottom:1px solid var(--line);z-index:2}
.g-lab{padding:7px 10px;font-size:13px;border-right:1px solid var(--line);position:sticky;left:0;background:var(--surface);z-index:1;line-height:1.25}
.g-lab small{display:block;color:var(--muted);font-size:11.5px}
.g-track{position:relative;height:100%;min-height:40px}
.g-months{position:relative;height:30px}
.g-month{position:absolute;top:0;bottom:0;border-left:1px solid var(--line);font-family:var(--font-mono);font-size:10.5px;color:var(--muted);padding:8px 0 0 4px;white-space:nowrap}
.g-row{border-bottom:1px solid color-mix(in srgb,var(--line) 70%,transparent)}
.g-row:last-child{border-bottom:0}
.g-grid{position:absolute;inset:0;pointer-events:none}
.g-grid i{position:absolute;top:0;bottom:0;border-left:1px dashed color-mix(in srgb,var(--line) 80%,transparent)}
.g-bar{position:absolute;top:10px;height:20px;border-radius:4px;cursor:pointer;border:0;padding:0}
.g-bar.est{background-image:repeating-linear-gradient(45deg,transparent 0 5px,rgba(255,255,255,.28) 5px 10px)}
.g-bar.ref{opacity:.45}
.g-txt{position:absolute;top:12px;font-family:var(--font-mono);font-size:10.5px;color:var(--muted);white-space:nowrap;pointer-events:none}
.g-today{position:absolute;top:0;bottom:0;border-left:2px solid var(--crit);z-index:1;pointer-events:none}
.hitos{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}
.hito{background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:10px 12px;display:flex;flex-direction:column;gap:2px}
.hito .when{font-family:var(--font-mono);font-size:13px;color:var(--rr-navy);font-weight:600}
.hito.alert{border-color:var(--crit)}
.hito.alert .when{color:var(--crit)}
/* tablas */
.tbl-scroll{overflow-x:auto;border:1px solid var(--line);border-radius:8px;background:var(--surface)}
table{border-collapse:collapse;width:100%;min-width:720px;font-size:14px}
th,td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-family:var(--font-mono);font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);background:color-mix(in srgb,var(--rr-navy) 6%,var(--surface))}
td.num{font-family:var(--font-mono);font-variant-numeric:tabular-nums;white-space:nowrap;text-align:right}
tr:last-child td{border-bottom:0}
/* checklist */
.check{display:flex;flex-direction:column;gap:8px}
.check label{display:grid;grid-template-columns:22px 1fr auto;gap:10px;align-items:start;background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:10px 12px;cursor:pointer}
.check input{width:18px;height:18px;margin-top:2px;accent-color:var(--accent)}
.check .who{font-size:12px;color:var(--muted);white-space:nowrap}
.check input:checked+span{text-decoration:line-through;color:var(--muted)}
.fuentes{font-size:13px;color:var(--muted);display:flex;flex-direction:column;gap:4px}
.fuentes a{color:var(--rr-navy)}
@media (prefers-reduced-motion:no-preference){.step,.g-bar{transition:box-shadow .15s,transform .15s}.g-bar:hover{transform:scaleY(1.15)}}
/* cronograma con dependencias */
.board{position:relative;overflow:auto;max-height:68vh;border:1px solid var(--line);border-radius:8px;background:var(--surface)}
.ggrid{position:relative}
.grow{display:flex;height:32px;border-bottom:1px solid color-mix(in srgb,var(--line) 55%,transparent)}
.grow.sec{height:30px;background:color-mix(in srgb,var(--rr-navy) 6%,var(--surface))}
.grow.head{height:34px;position:sticky;top:0;z-index:6;background:var(--surface);border-bottom:1px solid var(--line)}
.glab{position:sticky;left:0;z-index:4;width:290px;flex:none;background:var(--surface);border-right:1px solid var(--line);display:flex;align-items:center;gap:8px;padding:0 10px;font-size:13px;min-width:0}
.grow.sec .glab{background:color-mix(in srgb,var(--rr-navy) 6%,var(--surface));font-weight:700;font-size:12.5px}
.grow.head .glab{z-index:7;font-family:var(--font-mono);font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.glab .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;background:none;border:0;padding:0;font:inherit;color:var(--ink);text-align:left;min-width:0;flex:1}
.sw{width:10px;height:10px;border-radius:3px;flex:none;display:inline-block}
.sec-btn{background:none;border:0;padding:0;font:inherit;color:var(--ink);cursor:pointer;display:flex;gap:8px;align-items:center;width:100%;text-align:left}
.car{font-family:var(--font-mono);font-size:11px;color:var(--muted);width:10px}
.grow.sel .glab{background:var(--accent-soft)}
.gtrk{position:relative;flex:none}
.gmonths{position:absolute;inset:0}
.gmo{position:absolute;top:0;bottom:0;border-left:1px solid var(--line);font-family:var(--font-mono);font-size:10.5px;color:var(--muted);padding:9px 0 0 5px;white-space:nowrap}
.gv{position:absolute;top:34px;bottom:0;pointer-events:none}
.gv i{position:absolute;top:0;bottom:0;border-left:1px dashed color-mix(in srgb,var(--line) 70%,transparent)}
.gtoday{position:absolute;top:34px;bottom:0;border-left:2px solid var(--crit);z-index:2;pointer-events:none}
.gtoday::after{content:"hoy";position:absolute;top:-1px;left:3px;font-family:var(--font-mono);font-size:10px;color:var(--crit)}
.gmeta{position:absolute;top:34px;bottom:0;border-left:2px dashed var(--ok);z-index:2;pointer-events:none}
.gmeta::after{content:"meta 22 m";position:absolute;top:-1px;left:3px;font-family:var(--font-mono);font-size:10px;color:var(--ok);white-space:nowrap}
.gb{position:absolute;top:7px;height:18px;border-radius:4px;border:0;padding:0;cursor:pointer;z-index:3}
.gb.est{background-image:repeating-linear-gradient(45deg,transparent 0 5px,rgba(255,255,255,.3) 5px 10px)}
.gb.crit,.gms.crit{box-shadow:0 0 0 2px var(--crit)}
.gb.sel,.gms.sel{box-shadow:0 0 0 3px var(--accent)}
.gb.dim,.gms.dim{opacity:.28}
.gms{position:absolute;top:8px;width:15px;height:15px;transform:rotate(45deg);border:0;padding:0;cursor:pointer;z-index:3;margin-left:-7px}
.btxt{position:absolute;top:8px;font-family:var(--font-mono);font-size:10.5px;color:var(--muted);white-space:nowrap;pointer-events:none;z-index:3}
svg.arrows{position:absolute;top:0;pointer-events:none;z-index:2;overflow:visible}
svg.arrows path{fill:none;stroke:var(--muted);stroke-width:1.2;opacity:.35}
svg.arrows path.crit{stroke:var(--crit);opacity:.75;stroke-width:1.6}
svg.arrows path.hl{stroke:var(--accent);opacity:1;stroke-width:2.2}
svg.arrows path.dim{opacity:.08}
.lg-bar{width:22px;height:10px;border-radius:3px;background:var(--c-cnd);display:inline-block}
.lg-bar.est{background-image:repeating-linear-gradient(45deg,transparent 0 4px,rgba(255,255,255,.4) 4px 8px)}
.lg-bar.crit{box-shadow:0 0 0 2px var(--crit)}
.lg-ms{width:10px;height:10px;transform:rotate(45deg);background:var(--c-cnd);display:inline-block}
.controls .chk{flex-direction:row;align-items:center;gap:7px;font-size:13px;color:var(--ink);font-weight:500;padding-bottom:8px}
.controls .chk input{width:16px;height:16px;padding:0;accent-color:var(--accent)}
.result .big.late{color:var(--crit)}
.btn{font:600 14px var(--font-body);border:1px solid var(--rr-navy);background:var(--surface);color:var(--rr-navy);padding:8px 14px;border-radius:6px;cursor:pointer}
.btn:hover{background:var(--accent-soft)}
.gdet{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:16px;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr);gap:18px}
@media (max-width:900px){.gdet{grid-template-columns:1fr}}
.gcol{display:flex;flex-direction:column;gap:8px;min-width:0}
.tag.crit{background:color-mix(in srgb,var(--crit) 14%,transparent);color:var(--crit)}
.gkv{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:13.5px;margin:0}
.gkv dt{color:var(--muted);font-size:11.5px;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.05em;padding-top:2px}
.gkv dd{margin:0}
.dl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.dl li button{width:100%;text-align:left;display:grid;grid-template-columns:10px 1fr auto;gap:8px;align-items:center;background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:7px 10px;font:inherit;font-size:13px;color:var(--ink);cursor:pointer}
.dl li button:hover{border-color:var(--accent)}
.dl .dt{font-family:var(--font-mono);font-size:11.5px;color:var(--muted);white-space:nowrap}
.dl .drv{color:var(--crit);font-weight:600}
.empty,.gnote{font-size:13px;color:var(--muted)}
.linkbtn{background:none;border:0;padding:0;font:600 13px var(--font-body);color:var(--rr-navy);text-decoration:underline;cursor:pointer;width:max-content}
/* ventana Asana */
.modal{position:fixed;inset:0;z-index:90;background:color-mix(in srgb,var(--ink) 45%,transparent);display:flex;align-items:flex-start;justify-content:center;
  padding-top:calc(env(safe-area-inset-top,0px) + 24px);padding-bottom:24px;padding-left:max(12px,env(safe-area-inset-left,0px));padding-right:max(12px,env(safe-area-inset-right,0px));overflow:auto}
.modal-box{background:var(--surface);border:1px solid var(--line);border-radius:10px;max-width:1080px;width:100%;padding:18px;display:flex;flex-direction:column;gap:14px;min-width:0}
.modal-head{display:flex;justify-content:space-between;gap:12px;align-items:start}
.xbtn{font:600 20px var(--font-body);line-height:1;background:none;border:1px solid var(--line);color:var(--ink);border-radius:6px;width:34px;height:34px;cursor:pointer;flex:none}
ul.tight{margin:4px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:3px}
.ok{color:var(--ok);font-weight:600}.bad{color:var(--crit);font-weight:600}
@media (max-width:600px){.glab{width:190px}}

[hidden]{display:none!important}
/* ---------- Armonía con la plataforma (mismo encabezado, pestañas, paneles y botones) ---------- */
.wrap{max-width:none;gap:20px}
header.top{border-bottom:0;padding-bottom:0;gap:6px}
h1{font-size:clamp(22px,2.6vw,30px);font-weight:650;font-variation-settings:"wdth" 118;letter-spacing:-.005em;line-height:1.1}
h2{font-size:16px;font-weight:620;font-variation-settings:"wdth" 108}
h3{font-size:14px;font-weight:600}
header.top .sub{font-size:13.5px;color:var(--ink-2)}
.eyebrow{font-size:11px;letter-spacing:.06em;color:var(--ink-3)}
.ficha,.detalle,.controls,.tbl-scroll,.gantt-scroll,.board,.gdet{border-radius:var(--r,10px);box-shadow:var(--shadow)}
.ficha .val{font-size:24px;font-weight:620;font-variation-settings:"wdth" 110;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.ficha .val.hot{color:var(--orange)}
nav.tabs{gap:4px;padding:0;background:var(--bg)}
nav.tabs button{border:0;border-radius:0;background:none;padding:10px 12px;color:var(--ink-2);border-bottom:2px solid transparent;margin-bottom:-1px;font-weight:550;font-size:14px}
nav.tabs button:hover{color:var(--ink)}
nav.tabs button[aria-selected="true"]{background:none;color:var(--ink);border-bottom-color:var(--orange)}
.btn{display:inline-flex;align-items:center;height:36px;border-radius:8px;border-color:var(--line);color:var(--ink);font-weight:550}
.btn:hover{background:var(--surface-2);border-color:var(--ink-3)}
.controls input,.controls select{height:36px;border-radius:8px;background:var(--surface)}
.result .big{font-weight:650;font-variation-settings:"wdth" 110}
.fuentes a,.linkbtn{color:var(--info)}
.modal-box{border-radius:12px;box-shadow:var(--shadow)}
.detalle{scroll-margin-top:calc(var(--rr-top,0px) + 56px)}
`;

const HTML = `
<div class="wrap">
  <header class="top">
    <span class="eyebrow">Proyecto Solar GUARUMA 50 MW · EHG · Matriz regulatoria · actualizado 20 oct 2026 · fecha X: 30 nov 2026</span>
    <h1>Ruta regulatoria de interconexión</h1>
    <p class="sub">Qué pide cada ente (CND, EOR, CRIE, ENEE Transmisión, CREE y SEN), en qué orden, qué bloquea a qué, cuánto tarda y cuánto cuesta. Toca cualquier paso para ver el detalle técnico y administrativo.</p>
  </header>

  <div class="ficha">
    <div><span class="eyebrow">Punto de conexión</span><span class="val hot">Sí es RTR</span><span class="note">S/E San Pedro Sula Sur 138 kV y 230 kV están en la RTR 2026 del EOR. Aplica trámite regional ante CRIE.</span></div>
    <div><span class="eyebrow">Duración hasta contrato</span><span class="val mono" id="f-dur">—</span><span class="note">De la solicitud de premisas a la firma del contrato de conexión.</span></div>
    <div><span class="eyebrow">Garantía CND</span><span class="val mono" id="f-gar">—</span><span class="note">USD 16.74 por kW de la potencia que declaremos en las premisas.</span></div>
    <div><span class="eyebrow">Operación comercial (ejemplo)</span><span class="val mono" id="f-cod">—</span><span class="note">Con la obra según el cronograma de 22 meses (Resumen en Asana).</span></div>
  </div>

  <nav class="tabs" role="tablist" aria-label="Secciones">
    <button role="tab" id="tab-ruta" aria-selected="true" data-tab="ruta">Ruta paso a paso</button>
    <button role="tab" id="tab-gantt" aria-selected="false" data-tab="gantt">Cronograma y dependencias</button>
    <button role="tab" id="tab-costos" aria-selected="false" data-tab="costos">Costos</button>
    <button role="tab" id="tab-rtr" aria-selected="false" data-tab="rtr">¿Por qué RTR?</button>
    <button role="tab" id="tab-acciones" aria-selected="false" data-tab="acciones">Lo que nos toca</button>
  </nav>

  <!-- RUTA -->
  <section class="panel" id="p-ruta" data-panel="ruta">
    <p class="lead">El proceso tiene tres carriles que corren en paralelo: la conexión eléctrica (CND → EOR → CRIE → ENEE Transmisión), los permisos del sector (SEN y CREE) y la licencia ambiental (SERNA, ya en curso con EIA). El carril de conexión es el que define la fecha.</p>
    <div class="legend" id="legend"></div>
    <div class="ruta">
      <div class="fases" id="fases"></div>
      <aside class="detalle" id="detalle" aria-live="polite"></aside>
    </div>
  </section>

  <!-- GANTT -->
  <section class="panel" id="p-gantt" data-panel="gantt" hidden>
    <p class="lead">Cada barra es un trámite y cada flecha dice qué tiene que terminar antes. Toca una tarea para ver qué la bloquea y qué desbloquea al terminar. El borde rojo marca la ruta crítica, la cadena que fija la fecha de operación comercial. Las barras rayadas son plazos estimados; las lisas, plazos de norma.</p>
    <div class="controls">
      <label for="fx">Fecha X (solicitud de premisas)<input type="date" id="fx" value="2026-11-30"></label>
      <label for="pot">Potencia a declarar<select id="pot">
        <option value="42600">42.6 MW AC (Etapa I)</option>
        <option value="50000">50 MW</option>
        <option value="75000">75 MW (con expansión)</option>
      </select></label>
      <label for="zoom">Escala<select id="zoom"><option value="3.2">Semanas</option><option value="1.6" selected>Meses</option><option value="0.8">Trimestres</option></select></label>
      <label class="chk" for="fer"><input type="checkbox" id="fer">Descontar feriados de Honduras</label>
      <label class="chk" for="soloCrit"><input type="checkbox" id="soloCrit">Resaltar solo la ruta crítica</label>
      <button type="button" class="btn" id="open-asana">Comparar con Asana</button>
    </div>
    <div class="controls">
      <div class="result"><span class="eyebrow">Premisas presentadas</span><span class="big mono" id="r-x">—</span></div>
      <div class="result"><span class="eyebrow">Contrato firmado</span><span class="big mono" id="r-cont">—</span></div>
      <div class="result"><span class="eyebrow">Operación comercial</span><span class="big mono" id="r-cod">—</span></div>
      <div class="result"><span class="eyebrow">Frente a la meta (31 jul 2028)</span><span class="big mono" id="r-gap">—</span></div>
    </div>
    <div class="legend">
      <span><i class="lg-bar"></i>Plazo de norma</span>
      <span><i class="lg-bar est"></i>Plazo estimado</span>
      <span><i class="lg-ms"></i>Hito</span>
      <span><i class="lg-bar crit"></i>Ruta crítica</span>
      <span><i style="width:2px;height:12px;background:var(--crit);display:inline-block"></i>Hoy</span>
      <span><i style="width:0;height:12px;border-left:2px dashed var(--ok);display:inline-block"></i>Meta ≤22 meses</span>
    </div>
    <div class="board" id="board"><div class="ggrid" id="ggrid"></div></div>
    <div class="gdet" id="gdet" aria-live="polite"></div>
    <h3>Fechas que no se pueden pasar</h3>
    <div class="hitos" id="hitos"></div>
    <div class="callout"><b>Lectura del ejemplo:</b> con la obra según el cronograma de 22 meses, los trámites terminan con holgura: contrato de conexión en octubre 2027 y resolución SEN para construir en diciembre 2027, justo antes del montaje. Lo que define el 31 jul 2028 es el cierre: la solicitud de conexión a ENEE Transmisión tiene que entrar a más tardar en abril 2028 y las pruebas de conexión deben correr en paralelo con las de la planta. El otro riesgo es arrancar la obra civil antes de la resolución SEN.</div>
    <p class="gnote">Plazos en días hábiles. Con la casilla de feriados se descuentan Navidad, Año Nuevo, Semana Santa, 14 de abril, 1 de mayo, 15 de septiembre y la Semana Morazánica. Las tareas de preparación de EHG arrancan en las fechas de hoy; si alguna se atrasa, empuja la fecha X.</p>
  </section>

  <!-- VENTANA ASANA -->
  <div class="modal" id="asana" role="dialog" aria-modal="true" aria-labelledby="asana-t" hidden>
    <div class="modal-box">
      <div class="modal-head">
        <div><span class="eyebrow">Proyectos en Asana · leídos el 20 oct 2026</span><h2 id="asana-t">Comparación con Asana</h2></div>
        <button type="button" class="xbtn" id="close-asana" aria-label="Cerrar">×</button>
      </div>
      <p class="callout">En Asana hay dos proyectos. <b>"Resumen Proyecto Solar CAHSA"</b> tiene el cronograma de 22 meses (puesta en marcha 31 jul 2028) y es el que usa esta página para la obra y las pruebas. <b>"Proyecto de planta solar CAHSA 50 MW"</b> es el detallado: está ajustado hasta la ingeniería de detalle, pero de diseño de subestación a pruebas sigue con fechas viejas (puesta en marcha 14 ene 2029). En los dos, los trámites están resumidos en pocas tareas.</p>
      <div class="tbl-scroll"><table>
        <thead><tr><th style="width:150px">En Asana</th><th>Lo que tiene Asana</th><th>Lo que dice la norma</th><th>Qué ajustar</th></tr></thead>
        <tbody>
          <tr><td><b>Procedimiento con CND/ENEE</b><br><span class="gnote">5 tareas</span></td>
            <td>Reunión con la CND (30 nov) → carta de resolución (1 dic) → "Procedimiento con CND/ENEE" en un solo bloque (2 dic – 16 abr) → autorización de puesta en servicio (19–29 abr 2027) → aprobación (30 abr 2027).</td>
            <td>Premisas (30 dh) → estudios → solicitud de acceso FS02 con garantía (40 dh) → observaciones → resolución de acceso (21 jun 2027). La puesta en servicio es al final, después de construir (dic 2028).</td>
            <td><ul class="tight"><li>Partir el bloque en premisas, acceso, garantía y observaciones.</li><li>La "carta de resolución" no sale en 1 día.</li><li class="bad">Mover la puesta en servicio a 2028.</li></ul></td></tr>
          <tr><td><b>Procedimiento con EOR</b><br><span class="gnote">9 tareas</span></td>
            <td>Contacto (5 ene 2027) → solicitud de BDR y premisas → revisión → alcance → elaboración → entrega (28 ene) → estudios eléctricos (29 ene – 5 mar) → revisión del EOR (8 mar – 29 abr) → resolución del EOR (30 abr).</td>
            <td>El EOR arranca cuando el CND le informa el proyecto (≈7 dic 2026), no por contacto directo. Premisas y BDR en 26 dh. Estudios ~10 semanas. El EOR revisa y recomienda; quien resuelve es la CRIE.</td>
            <td><ul class="tight"><li class="ok">Los pasos de premisas coinciden.</li><li>Hacer que dependa de las premisas del CND.</li><li>Estudios de 5 a ~10 semanas.</li><li>Cambiar "Resolución de EOR" por "Informe del EOR a la CRIE".</li></ul></td></tr>
          <tr><td><b>Procedimiento con CRIE</b><br><span class="gnote">4 tareas</span></td>
            <td>Solicitud de conexión a la RTR (12–23 jul 2027) → evaluación (26 jul – 10 sep) → autorización de puesta en servicio (13 sep – 14 oct) → autorización de la CRIE (15 oct 2027). Depende solo de la licencia ambiental.</td>
            <td>Necesita la resolución de acceso del CND además de la licencia (o constancia de trámite). Resolución de la CRIE ≈14 sep 2027. La autorización de puesta en servicio la da el EOR al final, tras las pruebas.</td>
            <td><ul class="tight"><li>Agregar dependencia de la resolución del CND.</li><li class="ok">La fecha de la CRIE es parecida.</li><li>Mover la puesta en servicio a 2028.</li></ul></td></tr>
          <tr><td><b>Resumen Proyecto Solar CAHSA</b><br><span class="gnote">sección Permisos</span></td>
            <td>CND/ENEE 30 nov – 30 abr 2027; EOR 5 ene – 30 abr 2027; CRIE 10 jul – 15 oct 2027 (después de la licencia, 9 jul); obtención de permisos 30 oct 2027. Obra civil subestación desde 15 dic 2026; montaje 6 dic 2027 – 31 may 2028; puesta en marcha 3–31 jul 2028.</td>
            <td>Resolución de acceso del CND 21 jun 2027 (7 semanas después). CRIE 12 jul – 5 oct 2027 (coincide). Contrato de conexión 19 oct 2027 y resolución SEN para construir 1 dic 2027, justo antes del montaje. La solicitud de conexión a ENEE Transmisión debe entrar a más tardar el 17 abr 2028.</td>
            <td><ul class="tight"><li class="ok">La CRIE y el montaje cuadran.</li><li>Mover el fin de CND/ENEE a junio 2027.</li><li>Agregar la solicitud de conexión (abr 2028) y la resolución SEN (dic 2027).</li><li class="bad">Obra civil antes de la resolución SEN: confirmar con Legal.</li></ul></td></tr>
          <tr><td><b>No está en Asana</b></td>
            <td colspan="2">PCU y contrato de acceso con ENEE Transmisión; inscripción en el registro de la CREE; carril SEN (constancia de inicio, permiso municipal, permiso de estudio CREE, resolución para construir); garantía bancaria; pruebas de conexión y certificación de operación; tareas de preparación de EHG (respuesta de ENEE, unifilar de SÓLIDA, poder legal, consultor, equipos con datos garantizados).</td>
            <td>Crear una sección "ENEE Transmisión" y otra "SEN y CREE", y meter la preparación en la de CND/ENEE.</td></tr>
        </tbody>
      </table></div>
    </div>
  </div>
  <!-- COSTOS -->
  <section class="panel" id="p-costos" data-panel="costos" hidden>
    <p class="lead">Cada costo lleva una etiqueta según qué tan firme es: <span class="tag norma">Norma</span> está fijado en una norma o acuerdo, <span class="tag proy">Proyecto</span> sale del presupuesto de la presentación del proyecto, <span class="tag est">Estimado</span> es referencia de mercado que hay que cotizar, y <span class="tag conf">Por confirmar</span> no encontré tarifa publicada.</p>
    <div class="tbl-scroll"><table id="t-costos"><thead><tr><th>Concepto</th><th>Ente</th><th>Monto</th><th>Tipo</th><th>Nota</th></tr></thead><tbody></tbody></table></div>
    <div class="callout"><b>Ojo con la garantía:</b> no es un gasto, es una garantía bancaria que se devuelve si conectamos a tiempo. El costo real es la comisión del banco. Si no se conecta dentro de los 3 meses siguientes a la fecha declarada, se ejecuta y el dinero pasa a ENEE Transmisión. Por eso conviene declarar la potencia de la Etapa I y tramitar la expansión aparte.</div>
  </section>

  <!-- RTR -->
  <section class="panel" id="p-rtr" data-panel="rtr" hidden>
    <h2>San Pedro Sula Sur es parte de la Red de Transmisión Regional</h2>
    <p class="lead">El EOR publica cada año qué instalaciones forman la RTR. En el informe final de la RTR 2026 (28 de noviembre de 2025) aparecen las dos opciones que vimos en la visita:</p>
    <div class="tbl-scroll"><table><thead><tr><th>Elemento</th><th>Bus PSS/E</th><th>Cómo entra a la RTR</th><th>Bahía nuestra</th></tr></thead><tbody>
      <tr><td>San Pedro Sula Sur 138 kV</td><td class="mono">3203 · SPS B558</td><td>Nodo de control. Ya recibe generación de Brassavola, Chumbagua, Envasa, Green Valley, Cuyuagual y PFV El Pollito, entre otras.</td><td class="mono">51E68</td></tr>
      <tr><td>San Pedro Sula Sur 230 kV</td><td class="mono">3257 · SPS 230</td><td>Nodo de la RTR preliminar: ruta que une SPS 138 kV con San Buenaventura 230 kV (SIEPAC).</td><td class="mono">68T53</td></tr>
      <tr><td>Autotransformadores 230/138 kV</td><td class="mono">T663 · T664</td><td>Parte de la misma ruta.</td><td>—</td></tr>
      <tr><td>Línea SPS – San Buenaventura 230 kV</td><td class="mono">3257 → 3300</td><td>Tramo de la RTR preliminar.</td><td>—</td></tr>
    </tbody></table></div>
    <div class="callout"><b>Qué significa:</b> sea 138 o 230 kV, el proyecto se conecta a un nodo RTR. Además del acceso nacional del CND, hay que pedir premisas regionales al EOR, hacer estudios que cumplan los Criterios de Calidad, Seguridad y Desempeño (CCSD) del RMER y obtener la aprobación de la CRIE antes de la conexión física. La lista RTR se actualiza cada año; conviene pedirle al CND que lo confirme por escrito en la solicitud de premisas.</div>
  </section>

  <!-- ACCIONES -->
  <section class="panel" id="p-acciones" data-panel="acciones" hidden>
    <p class="lead">Para que ningún atraso sea de nuestro lado, esto es lo que debe estar listo antes y durante la fecha X. Las marcas se guardan solo en tu navegador.</p>
    <div class="check" id="check"></div>
  </section>

  <div class="fuentes">
    <span class="eyebrow">Fuentes</span>
    <a href="https://www.cree.gob.hn/norma-tecnica-de-acceso-conexion-y-uso-de-la-red-de-transmision/" target="_blank" rel="noopener">CREE – Norma Técnica de Acceso, Conexión y Uso de la Red de Transmisión (NT-ACUT)</a>
    <a href="https://www.tsc.gob.hn/web/leyes/Acuerdo-SEN-110-2025.pdf" target="_blank" rel="noopener">SEN – Acuerdo SEN-110-2025, Guía de Construcción de Proyectos con Energía Renovable</a>
    <a href="https://www.asep.gob.pa/wp-content/uploads/electricidad/reglamentaciones/mercado_mayorista/regionales/mercado_electrico_regional/procedimiento-acceso-a-la-rtr.pdf" target="_blank" rel="noopener">CRIE – Procedimiento de solicitudes de conexión a la RTR (CRIE-P-03-2014)</a>
    <a href="https://www.grupoice.com/wps/wcm/connect/d44ba1d0-a746-409a-94b0-3fb7c978f157/DPS-03-NORM-001.pdf?MOD=AJPERES&amp;CVID=o.a2FTI" target="_blank" rel="noopener">RMER Libro III, numerales 4.5.2 y 4.5.3 (resumen en procedimiento ICE)</a>
    <a href="https://www.enteoperador.org/archivos/download/Informe_de_Identificacion_de_la_RTR-2026_vfinal.pdf" target="_blank" rel="noopener">EOR – Identificación de la RTR para el año 2026, informe final</a>
    <a href="https://cnd.enee.hn/wp-content/uploads/2026/07/Formato-de-Solicitud-de-Acceso-a-la-Red-de-Transmision-FS02-CND-290726.pdf" target="_blank" rel="noopener">CND – Formulario FS02 Solicitud de Acceso a la Red de Transmisión (v1.1, jul 2026)</a>
    <a href="https://www.latribuna.hn/2026/10/05/gobierno-asegura-que-empresas-de-ee-uu-muestran-interes-en-sector-electrico-de-honduras/" target="_blank" rel="noopener">Ley de Justicia Energética, Decreto 198-2026 (vigente desde 29 sep 2026)</a>
  </div>
</div>`;

/* ---------- Lógica de la página (datos, cálculos y dibujo) ---------- */
function run(R, signal) {
const ENTES={
  CND:{n:"CND (Operador del Sistema)",c:"--c-cnd"},
  EOR:{n:"EOR (Ente Operador Regional)",c:"--c-eor"},
  CRIE:{n:"CRIE (regulador regional)",c:"--c-crie"},
  ETT:{n:"ENEE Transmisión",c:"--c-ett"},
  CREE:{n:"CREE",c:"--c-cree"},
  SEN:{n:"SEN / DGEREE",c:"--c-sen"},
  SERNA:{n:"SERNA",c:"--c-serna"},
  EHG:{n:"EHG y consultores",c:"--c-ehg"}
};
// dur en días hábiles. dep: [[id,'FS'|'SS',lag]]
const S=[
 {id:"p1",fase:"1 · Premisas",ente:"CND",t:"Premisas técnicas nacionales",dur:30,dep:[],tipo:"norma",
  adm:["Carta de solicitud con datos generales de EHG","Copia del poder del representante legal","Firma del acuerdo de confidencialidad para recibir la base de datos","Pedir que el CND confirme por escrito que el nodo es RTR"],
  tec:["Punto de conexión con coordenadas: bahía 51E68 (138 kV) o 68T53 (230 kV)","Diagrama unifilar preliminar y características técnicas (FV + BESS + transformador)","Generación prevista en el punto de conexión para 4 años","La potencia que se declare aquí fija el monto de la garantía"],
  res:"Documento de premisas técnicas y base de datos del SIN.",plazo:"30 días hábiles. Vigencia 6 meses (prórroga hasta 3).",costo:"Base de datos sin costo.",base:"NT-ACUT arts. 7, 8, 17 y 18 · SEN-110-2025 art. 8"},
 {id:"p2",fase:"1 · Premisas",ente:"EOR",t:"Premisas regionales y Base de Datos Regional",dur:26,dep:[["p1","SS",5]],tipo:"norma",
  adm:["El CND informa el proyecto al EOR","Convenio de confidencialidad con el EOR antes de recibir la base regional"],
  tec:["EOR define alcances con el CND (5 días hábiles)","EOR elabora premisas regionales (5 días hábiles)","EOR actualiza la base de datos regional (15 días hábiles) y la entrega (1 día)","Usar el software del EOR (PSS/E)"],
  res:"Premisas regionales y BDR con código del EOR.",plazo:"26 días hábiles desde que el EOR recibe la información.",costo:"No encontré cargo publicado.",base:"Procedimiento CRIE-P-03-2014, numeral 3.2"},
 {id:"est",fase:"2 · Estudios y acceso nacional",ente:"EHG",t:"Estudios eléctricos nacionales y regionales",dur:50,dep:[["p1","FS",0],["p2","FS",0]],tipo:"est",
  adm:["Contrato con el consultor (FUNKEN o Perham)","Identificar al profesional colegiado o consultor internacional que firma"],
  tec:["Flujo de carga, cortocircuito y contingencias N-1","Estabilidad transitoria, de frecuencia y de tensión","Transitorios electromagnéticos y requerimientos de transmisión","Cumplir los CCSD del RMER por ser nodo RTR","Datos definitivos y garantizados de inversores, BESS y transformador","Control potencia/frecuencia y de tensión según la NT de Servicios Complementarios","Entregar archivos reproducibles"],
  res:"Informe de estudios en PDF y bases de datos.",plazo:"Estimado 10 semanas. Debe terminar antes de que venzan las premisas.",costo:"US$ 71,689 en el presupuesto del proyecto (estudio eléctrico de prefactibilidad).",base:"NT-ACUT arts. 22 a 30 y Anexo 1"},
 {id:"acc",fase:"2 · Estudios y acceso nacional",ente:"CND",t:"Solicitud de acceso y garantía",dur:40,dep:[["est","FS",0]],tipo:"norma",
  adm:["Formulario FS02 presentado por escrito firmado por abogado, con poder","Datos de la empresa y fecha prevista de operación comercial","Garantía bancaria incondicional a favor del Operador del Sistema (USD 16.74/kW), vigente 4 meses desde el mes de conexión"],
  tec:["Diseño básico de las instalaciones","Estudios eléctricos según las premisas","Bases de datos de los estudios"],
  res:"Resolución favorable de derecho de acceso. Vigencia 6 meses: en ese tiempo hay que pedir la PCU y entrar a la CRIE.",plazo:"El CND dictamina en máximo 40 días hábiles.",costo:"Garantía según potencia declarada (ver Costos).",base:"NT-ACUT arts. 19, 20 y 21"},
 {id:"obs",fase:"2 · Estudios y acceso nacional",ente:"EHG",t:"Atención de observaciones del CND",dur:20,dep:[["acc","FS",0]],tipo:"est",
  adm:["Responder por escrito cada observación"],tec:["Ajustes de estudios o del proyecto que pida el CND"],
  res:"Resolución favorable definitiva.",plazo:"Estimado una ronda de 4 semanas.",costo:"Incluido en el contrato del consultor, si se negocia así.",base:"NT-ACUT art. 21"},
 {id:"crie",fase:"3 · Aprobación regional",ente:"CRIE",t:"Solicitud de conexión a la RTR",dur:60,dep:[["obs","FS",0]],tipo:"norma",
  adm:["Carta a la CRIE en español y digital, con copia al EOR, ENEE Transmisión y CND","Estudio de Impacto Ambiental y licencia ambiental de planta, subestación y línea (o constancia de trámite)","Permiso de generación o constancia de que está en gestión","Constancia del CND de cumplir los requisitos nacionales"],
  tec:["Estudios eléctricos regionales con las premisas del EOR","Diseño básico según el capítulo 16 del Libro III del RMER","Unifilares, especificaciones, ubicación exacta, punto de conexión y límite de propiedad"],
  res:"Resolución de la CRIE que aprueba la conexión. Sin ella no hay conexión física.",plazo:"Transmisor y CND informan en 15 días hábiles, el EOR en 20 y la CRIE resuelve en 15 (15 más si hay observaciones). Estimado total con apertura del expediente: 60 días hábiles.",costo:"No encontré cargo publicado.",base:"RMER Libro III 4.5.2 y 4.5.3 · NT-ACUT arts. 10 y 57"},
 {id:"reg",fase:"3 · Aprobación regional",ente:"CREE",t:"Inscripción en el Registro Público de Empresas",dur:30,dep:[["obs","SS",0]],tipo:"est",
  adm:["Formulario de inscripción como empresa generadora","Documentos legales de EHG (escritura, RTN, poderes) y técnicos de la planta"],
  tec:["Datos técnicos de la central y del punto de conexión"],
  res:"Resolución de la CREE y ficha de inscripción. Se necesita antes de firmar el contrato.",plazo:"Por confirmar con la CREE (estimado 6 semanas).",costo:"Por confirmar.",base:"SEN-110-2025 art. 23 · NT-ACUT art. 33"},
 {id:"pcu",fase:"4 · Contrato con el transmisor",ente:"ETT",t:"Propuesta de Conexión y Uso (PCU)",dur:40,dep:[["obs","FS",0]],tipo:"norma",
  adm:["Carta pidiendo la PCU","Resolución favorable del CND","Cronograma de ejecución y fecha de operación comercial"],
  tec:["Información geográfica 1:50,000 en UTM con trazado de la línea","Diseño básico del punto de conexión, protecciones, comunicaciones y medición","Parámetros de transformadores y líneas"],
  res:"PCU por escrito. Vigencia 6 meses, prorrogable.",plazo:"10 días hábiles para revisar si está completa y 30 para entregar la PCU.",costo:"Se pactan los pagos por revisión de diseño, supervisión y pruebas.",base:"NT-ACUT arts. 31 a 33"},
 {id:"cont",fase:"4 · Contrato con el transmisor",ente:"ETT",t:"Contrato de Acceso, Conexión y Uso",dur:45,dep:[["pcu","FS",0],["reg","FS",0]],tipo:"norma",
  adm:["Negociar condiciones, garantías y pagos","Notificar al CND la firma dentro de 20 días"],
  tec:["Frontera del punto de conexión, instalaciones de uso común, medición comercial y responsables de operación y mantenimiento"],
  res:"Contrato firmado. Se remite copia a la SEN.",plazo:"Máximo 45 días hábiles una vez que hay acuerdo.",costo:"Según contrato. Si no hay acuerdo, la CREE fija la remuneración.",base:"NT-ACUT arts. 33 a 38 · SEN-110-2025 art. 22"},
 {id:"dd",fase:"5 · Construcción y puesta en servicio",ente:"EOR",t:"Diseño técnico de detalle y ajustes",dur:40,dep:[["crie","FS",0]],tipo:"est",
  adm:["Requiere la solicitud aprobada por la CRIE"],
  tec:["Diseño de detalle con ajustes de control, supervisión, protección y operación","Revisión de CND y ENEE Transmisión; el EOR recomienda a la CRIE","Luego, parametrización de protecciones y controles aprobada por el EOR"],
  res:"Diseño de detalle y ajustes aprobados.",plazo:"Sin plazo fijo en el procedimiento; estimado 8 semanas.",costo:"Ingeniería de detalle (presupuesto del proyecto).",base:"Procedimiento CRIE-P-03-2014, numerales 5.2 y 5.3"},
 {id:"sen3",fase:"5 · Construcción y puesta en servicio",ente:"SEN",t:"Resolución para la construcción",dur:30,dep:[["cont","FS",0]],tipo:"norma",
  adm:["Licencia ambiental, contrato de conexión, registro CREE, estudios de factibilidad e informe de cumplimiento"],tec:["Estudios técnicos finales"],
  res:"Resolución de la SEN para construir.",plazo:"Máximo 30 días hábiles con requisitos completos.",costo:"—",base:"SEN-110-2025 art. 25"},
 {id:"obra",fase:"5 · Construcción y puesta en servicio",ente:"EHG",t:"Construcción subestación y línea (cronograma 22 meses)",dur:0,dep:[],tipo:"ref",
  adm:["Obra civil desde el 15 dic 2026, antes de la resolución del CND y de la resolución SEN para construir: confirmar con Legal qué se puede adelantar","Montaje electromecánico del 6 dic 2027 al 31 may 2028, después de la resolución SEN"],tec:["Transformador 65 MVA: compra del 15 nov 2026 al 30 sep 2027","Pruebas de subestación 1–15 jun 2028 y de planta 16–30 jun 2028"],
  res:"Instalaciones listas para las pruebas de conexión.",plazo:"Según el Resumen del proyecto en Asana (22 meses).",costo:"Parte del CAPEX.",base:"Resumen Proyecto Solar CAHSA (Asana)"},
 {id:"conx",fase:"5 · Construcción y puesta en servicio",ente:"ETT",t:"Solicitud de conexión y pruebas",dur:60,dep:[["obra","FS",0],["dd","FS",0],["cont","FS",0]],tipo:"est",
  adm:["Solicitud a ENEE Transmisión con copia al CND, con contrato y cronograma","Documentos de pruebas 10 días antes y solicitud de despeje 20 días antes","Certificado de verificación del equipo de medición"],
  tec:["Diseño detallado, unifilares, trifilares, especificaciones y pruebas de laboratorio","Estudios de coordinación de protecciones","Pruebas de protecciones, medición, SCADA con el CND, control de tensión y AGC (planta mayor de 8 MW)","Solicitud de pruebas en la RTR (SOLMANT) coordinada por el EOR"],
  res:"Constancia de pruebas del CND y aprobación de puesta en servicio del EOR.",plazo:"ENEE Transmisión revisa en 20 días hábiles (10 más si hay correcciones); el CND emite constancia en 10.",costo:"Las pruebas corren por cuenta de EHG.",base:"NT-ACUT arts. 42 a 52 y Anexo 2"},
 {id:"cod",fase:"5 · Construcción y puesta en servicio",ente:"CND",t:"Certificación de inicio de operación",dur:5,dep:[["conx","FS",0]],tipo:"est",
  adm:["Ficha CREE, licencia ambiental vigente, permiso CRIE y oficialización de la medición"],tec:["Información técnica de las pruebas"],
  res:"Certificación de puesta en operación.",plazo:"Tras la aceptación de ENEE Transmisión.",costo:"—",base:"NT-ACUT art. 53 y Anexo 3"},
 {id:"sen1",fase:"Carril SEN y CREE (paralelo)",ente:"SEN",t:"Constancia de inicio de proceso",dur:10,dep:[],tipo:"norma",
  adm:["Solicitud de apoyo técnico por ventanilla única","Perfil del proyecto: objetivos, ubicación, RTN, cronograma, costos, riesgos e impactos preliminares","Pago de L 22,000 en TGR"],
  tec:["Evaluación preliminar del recurso solar"],
  res:"Constancia de inicio. Se pide luego para otros trámites.",plazo:"10 días hábiles.",costo:"L 22,000.",base:"SEN-110-2025 art. 7"},
 {id:"sen2",fase:"Carril SEN y CREE (paralelo)",ente:"SEN",t:"Prospección, mesas de diálogo y permiso municipal",dur:70,dep:[["sen1","FS",0]],tipo:"est",
  adm:["SEN y SERNA hacen el análisis preliminar (20 días hábiles)","Mesas de diálogo con comunidad y municipalidad (30 días hábiles)","Permiso de prefactibilidad de la Municipalidad de Villanueva"],
  tec:["Información de prospección y premisas del CND"],
  res:"Permiso municipal, requisito para la etapa de estudios.",plazo:"50 días hábiles de norma más el plazo municipal (estimado 4 semanas).",costo:"Por confirmar (tasa municipal).",base:"SEN-110-2025 arts. 9 a 12"},
 {id:"cree1",fase:"Carril SEN y CREE (paralelo)",ente:"CREE",t:"Permiso de estudio",dur:60,dep:[["sen2","FS",0]],tipo:"norma",
  adm:["Solicitud a la CREE; la SEN remite el expediente en 10 días hábiles"],tec:["Expediente técnico del proyecto"],
  res:"Certificación del permiso de estudio.",plazo:"Máximo 60 días hábiles.",costo:"Por confirmar.",base:"SEN-110-2025 art. 14 · LGIE art. 7 d)"},
 {id:"lic",fase:"Carril SEN y CREE (paralelo)",ente:"SERNA",t:"Licencia ambiental (en curso con EIA)",dur:120,dep:[],tipo:"est",
  adm:["Aviso de inicio firmado el 16 oct; publicaciones el 21 oct","Constancias IHAH y COPECO previstas para el 14 feb 2027","Validar si SERNA pide la constancia SEN que exige la guía"],
  tec:["Diseño básico de SÓLIDA como insumo"],
  res:"Licencia ambiental. La CRIE la pide (o constancia de trámite).",plazo:"Estimado; depende de SERNA.",costo:"US$ 59,538.14 contrato EIA.",base:"SEN-110-2025 arts. 18 a 20"}
];
const byId=Object.fromEntries(S.map(s=>[s.id,s]));

// ---- fechas hábiles (con feriados opcionales)
const FER=new Set(["2026-12-24","2026-12-25","2026-12-31","2027-01-01","2027-03-25","2027-03-26","2027-04-14","2027-05-01","2027-09-15","2027-10-06","2027-10-07","2027-10-08","2027-12-24","2027-12-25","2027-12-31","2028-01-01","2028-04-13","2028-04-14","2028-05-01","2028-09-15","2028-10-04","2028-10-05","2028-10-06","2028-12-24","2028-12-25"]);
let useFer=false;
const iso=d=>d.toISOString().slice(0,10);
const isBD=d=>{const w=d.getUTCDay();return w!==0&&w!==6&&!(useFer&&FER.has(iso(d)))};
function nextBD(d){d=new Date(d);while(!isBD(d))d.setUTCDate(d.getUTCDate()+1);return d}
function addBD(d,n){d=new Date(d);let k=0;while(k<n){d.setUTCDate(d.getUTCDate()+1);if(isBD(d))k++}return d}
const MES=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const fmt=d=>d.getUTCDate()+" "+MES[d.getUTCMonth()]+" "+d.getUTCFullYear();
const fmtM=d=>MES[d.getUTCMonth()]+" "+d.getUTCFullYear();
const D=s=>new Date(s+"T00:00:00Z");
const months=(a,b)=>((b-a)/86400000/30.44);

// ---- cronograma: secciones y tareas con dependencias
const SEC={
  prep:{n:"Preparación EHG (antes de la fecha X)",c:"--c-ehg"},
  cnd:{n:"Procedimiento con CND/ENEE",c:"--c-cnd"},
  eor:{n:"Procedimiento con EOR",c:"--c-eor"},
  est:{n:"Estudios eléctricos",c:"--info"},
  amb:{n:"Licencia ambiental",c:"--c-serna"},
  crie:{n:"Procedimiento con CRIE",c:"--c-crie"},
  ett:{n:"ENEE Transmisión: PCU y contrato",c:"--c-ett"},
  sen:{n:"SEN y CREE (carril paralelo)",c:"--c-sen"},
  obra:{n:"Construcción y puesta en servicio",c:"--muted"}
};
const T=[
 {id:"r1",s:"prep",t:"Respuesta formal de ENEE sobre el punto de conexión",dur:15,base:"2026-10-21",tipo:"est",who:"Ing. Arturo",req:"Carta del 30 sep a ENEE (Ing. René Madrid). Hoy solo hay indicación verbal de 138 kV.",por:"Define la bahía (51E68 o 68T53) y la tensión que se declaran en las premisas."},
 {id:"r2",s:"prep",t:"Unifilar preliminar y generación a 4 años (SÓLIDA)",dur:20,base:"2026-10-19",tipo:"est",who:"SÓLIDA / C. Vallejos",req:"Ingeniería básica arrancó el 19 oct; diseño básico esperado a mediados de noviembre.",por:"Sin unifilar y sin generación prevista el CND no recibe la solicitud de premisas."},
 {id:"r3",s:"prep",t:"Poder del representante legal y escrito de abogado",dur:15,base:"2026-10-26",tipo:"est",who:"Abog. Pascua / Legal EHG",req:"Revisión de las escrituras de EHG (enviadas el 13 oct).",por:"La solicitud de premisas y el formulario FS02 se presentan por escrito con poder."},
 {id:"r4",s:"prep",t:"Contratar consultor de estudios eléctricos",dur:25,base:"2026-10-26",tipo:"est",who:"C. Vallejos / G. Dubón",req:"Cotizar FUNKEN y Perham con alcance nacional + RTR (CCSD del RMER) y plazo dentro de la vigencia de las premisas.",por:"El consultor debe estar listo para arrancar en cuanto lleguen las premisas."},
 {id:"r5",s:"prep",t:"Elegir inversores, BESS y transformador (datos garantizados)",dur:50,base:"2026-10-21",tipo:"est",who:"Gerencia Técnica / SÓLIDA",req:"Cotización de SIEYUAN (60 MVA) y selección de inversores.",por:"El CND no acepta estudios con datos que no sean los definitivos y garantizados."},
 {id:"r6",s:"prep",t:"Garantía bancaria USD 16.74/kW",dur:30,dep:[["x","SS",0]],tipo:"est",who:"Administración EHG",req:"Definir la potencia declarada. 42.6 MW ≈ US$ 713 k.",por:"Va adjunta a la solicitud de acceso; sin ella el CND no emite resolución."},
 {id:"x",s:"cnd",t:"Presentar solicitud de premisas (fecha X)",dur:0,base:"X",dep:[["r1","FS"],["r2","FS"],["r3","FS"]],tipo:"norma",who:"C. Vallejos",req:"Carta con datos de EHG, poder, punto de conexión con coordenadas, unifilar y generación a 4 años. Pedir confirmación escrita de nodo RTR.",por:"Arranca todo el carril de conexión."},
 {id:"p1",s:"cnd",t:"Elaboración de premisas técnicas (CND)",dur:30,dep:[["x","FS"]],tipo:"norma",who:"CND",req:"Firma del acuerdo de confidencialidad para recibir la base de datos.",por:"Premisas y base de datos del SIN. Vigencia 6 meses, prórroga de hasta 3."},
 {id:"p2",s:"eor",t:"Premisas regionales y BDR (EOR)",dur:26,dep:[["p1","SS",5]],tipo:"norma",who:"EOR",req:"El CND informa el proyecto al EOR. Convenio de confidencialidad con el EOR.",por:"Alcance 5 dh, premisas 5 dh, base regional 15 dh y entrega 1 dh."},
 {id:"est",s:"est",t:"Estudios eléctricos nacionales y RTR",dur:50,dep:[["p1","FS"],["p2","FS"],["r4","FS"],["r5","FS"]],tipo:"est",who:"Consultor (FUNKEN o Perham)",req:"Flujo de carga, cortocircuito, N-1, estabilidad transitoria, de frecuencia y de tensión. Cumplir CCSD del RMER.",por:"Informe en PDF y bases de datos. Tiene que entrar antes de que venzan las premisas."},
 {id:"acc",s:"cnd",t:"Solicitud de acceso FS02 y revisión del CND",dur:40,dep:[["est","FS"],["r6","FS"]],tipo:"norma",who:"EHG → CND",req:"FS02 con escrito de abogado, diseño básico, estudios, fecha de operación comercial y garantía.",por:"El CND dictamina en máximo 40 dh."},
 {id:"obs",s:"cnd",t:"Atención de observaciones del CND",dur:20,dep:[["acc","FS"]],tipo:"est",who:"EHG / consultor",req:"Respuesta escrita a cada observación.",por:"Estimado: una ronda de 4 semanas."},
 {id:"res",s:"cnd",t:"Resolución de acceso del CND",dur:0,dep:[["obs","FS"]],tipo:"norma",who:"CND",req:"—",por:"Vale 6 meses: en ese plazo hay que pedir la PCU y entrar a la CRIE."},
 {id:"lic",s:"amb",t:"Licencia ambiental",base:"2026-10-06",fin:"2027-07-09",tipo:"est",who:"EIA / SERNA",req:"Fechas del Resumen en Asana (6 oct 2026 – 9 jul 2027). IHAH y COPECO previstas para el 14 feb 2027. Que cubra por escrito parque, línea y subestación.",por:"La CRIE la pide para la solicitud de conexión a la RTR (acepta constancia de trámite, lo que permitiría adelantarla)."},
 {id:"crie",s:"crie",t:"Solicitud de conexión a la RTR y evaluación",dur:60,dep:[["res","FS"],["lic","FS"]],tipo:"norma",who:"CRIE / EOR / CND / ENEE",req:"Carta con copias, licencia ambiental, permiso de generación o constancia, constancia del CND, estudios regionales y diseño básico.",por:"Transmisor y CND 15 dh, EOR 20 dh, CRIE 15 dh (+15 si hay observaciones)."},
 {id:"crieR",s:"crie",t:"Resolución de la CRIE",dur:0,dep:[["crie","FS"]],tipo:"norma",who:"CRIE",req:"—",por:"Sin ella no hay conexión física a la RTR."},
 {id:"pcu",s:"ett",t:"Propuesta de Conexión y Uso (PCU)",dur:40,dep:[["res","FS"]],tipo:"norma",who:"ENEE Transmisión",req:"Carta, resolución del CND, cronograma, trazado de línea en UTM, diseño del punto de conexión.",por:"10 dh para revisar y 30 dh para entregar la PCU. Vigencia 6 meses."},
 {id:"reg",s:"sen",t:"Inscripción en el Registro de Empresas (CREE)",dur:30,dep:[["acc","FS"]],tipo:"est",who:"Legal EHG → CREE",req:"Formulario, escritura, RTN y poderes de EHG, datos técnicos de la central.",por:"Se necesita antes de firmar el contrato de conexión."},
 {id:"cont",s:"ett",t:"Contrato de Acceso, Conexión y Uso",dur:45,dep:[["pcu","FS"],["reg","FS"]],tipo:"norma",who:"EHG / ENEE Transmisión",req:"Negociar condiciones, garantías y pagos. Notificar al CND en 20 días.",por:"Máximo 45 dh. Copia a la SEN."},
 {id:"sen1",s:"sen",t:"Constancia de inicio de proceso (SEN)",dur:10,base:"X",tipo:"norma",who:"C. Vallejos / Legal",req:"Perfil del proyecto por ventanilla única y pago de L 22,000. No depende de SÓLIDA: se puede adelantar.",por:"Abre el carril SEN."},
 {id:"sen2",s:"sen",t:"Prospección, mesas de diálogo y permiso municipal",dur:70,dep:[["sen1","FS"]],tipo:"est",who:"SEN / SERNA / Municipalidad",req:"Análisis preliminar 20 dh, mesas de diálogo 30 dh, permiso de prefactibilidad de Villanueva.",por:"Permiso municipal para pasar a la etapa de estudios."},
 {id:"cree1",s:"sen",t:"Permiso de estudio (CREE)",dur:60,dep:[["sen2","FS"]],tipo:"norma",who:"CREE",req:"La SEN remite el expediente en 10 dh.",por:"Máximo 60 dh."},
 {id:"sen3",s:"sen",t:"Resolución para la construcción (SEN)",dur:30,dep:[["cont","FS"],["lic","FS"],["reg","FS"]],tipo:"norma",who:"SEN",req:"Licencia ambiental, contrato de conexión, registro CREE, estudios de factibilidad.",por:"Máximo 30 dh con requisitos completos."},
 {id:"trafo",s:"obra",t:"Compra y fabricación del transformador 65 MVA",base:"2026-11-15",fin:"2027-09-30",dep:[["r5","SS",0]],tipo:"est",who:"EHG / proveedor",req:"Capacidad definida (60 o 65 MVA) y datos garantizados, que también usan los estudios eléctricos.",por:"Equipo de mayor plazo de entrega. Fechas del Resumen en Asana."},
 {id:"obra",s:"obra",t:"Obra civil subestación (a riesgo)",base:"2026-12-15",fin:"2027-07-30",tipo:"est",who:"EHG / Equipos Industriales",req:"Arranca antes de la resolución del CND y de la resolución SEN para construir: confirmar con Legal qué se puede adelantar.",por:"Descapote, vías, fundaciones, cuarto de control y losa BESS. Fechas del Resumen en Asana."},
 {id:"dd",s:"obra",t:"Diseño de detalle y ajustes (EOR)",dur:40,dep:[["crieR","FS"]],tipo:"est",who:"EOR / CND / ENEE",req:"Ajustes de protección, control y supervisión.",por:"Estimado 8 semanas."},
 {id:"mont",s:"obra",t:"Montaje electromecánico subestación",base:"2027-12-06",fin:"2028-05-31",dep:[["sen3","FS"],["dd","FS"],["trafo","FS"],["obra","FS"]],tipo:"est",who:"EHG / Equipos Industriales",req:"Resolución SEN para construir, diseño de detalle aprobado y transformador en sitio.",por:"Fechas del Resumen en Asana (6 dic 2027 – 31 may 2028)."},
 {id:"conx",s:"obra",t:"Solicitud de conexión a ENEE Transmisión",dur:30,base:"2028-04-17",dep:[["cont","FS"],["dd","FS"],["sen3","FS"]],tipo:"norma",who:"EHG → ENEE Transmisión / CND",req:"Solicitud con contrato y cronograma, diseño detallado, unifilares y trifilares, coordinación de protecciones, protocolos de pruebas, despeje en la RTR (SOLMANT) con 20 días de aviso.",por:"ENEE revisa en 20 dh (+10 si hay correcciones). Fecha límite calculada hacia atrás para que todo esté aprobado antes de las pruebas."},
 {id:"pruS",s:"obra",t:"Pruebas de equipos subestación",base:"2028-06-01",fin:"2028-06-15",dep:[["mont","FS"]],tipo:"est",who:"EHG",req:"Montaje terminado.",por:"Fechas del Resumen en Asana."},
 {id:"pruP",s:"obra",t:"Pruebas de equipos planta solar",base:"2028-06-16",fin:"2028-06-30",dep:[["pruS","FS"]],tipo:"est",who:"EHG",req:"Subestación probada.",por:"Fechas del Resumen en Asana."},
 {id:"conxP",s:"obra",t:"Pruebas de conexión y constancia del CND",dur:20,dep:[["pruS","FS"],["conx","FS"]],tipo:"est",who:"ENEE Transmisión / CND / EOR",req:"Pruebas de protecciones, medición, SCADA con el CND, control de tensión y AGC. Aprobación de puesta en servicio del EOR.",por:"Constancia de pruebas del CND en 10 dh. Corre en paralelo con las pruebas de la planta."},
 {id:"cod",s:"obra",t:"Certificación de operación comercial (CND)",dur:5,dep:[["conxP","FS"],["pruP","FS"]],tipo:"norma",who:"CND",req:"Ficha CREE, licencia vigente, permiso CRIE y medición oficializada.",por:"Entrada en operación comercial. Meta: 31 jul 2028."}
];
const TB=Object.fromEntries(T.map(t=>[t.id,t]));
T.forEach(t=>{t.dep=t.dep||[];t.next=[]});
T.forEach(t=>t.dep.forEach(([d])=>TB[d].next.push(t.id)));
function plan(X){
  const r={};
  const calc=id=>{
    if(r[id])return r[id];const t=TB[id];
    const base=t.base==="X"?X:(t.base?D(t.base):null);
    if(t.fin){let n=0,d=nextBD(D(t.base));const f=D(t.fin);while(d<f){d.setUTCDate(d.getUTCDate()+1);if(isBD(d))n++}t.dur=n}
    let st=base?nextBD(base):null,drv=base?"base":null;
    t.dep.forEach(([d,typ,lag])=>{const p=calc(d);const c=typ==="SS"?addBD(p.s,lag||0):(TB[d].dur===0?nextBD(p.e):addBD(p.e,1));
      if(!st||c>st){st=c;drv=d}});
    st=nextBD(st);r[id]={s:st,e:t.dur?addBD(st,t.dur):st,drv};return r[id]};
  T.forEach(t=>calc(t.id));
  const crit=new Set();let k="cod";while(k&&k!=="base"&&TB[k]){crit.add(k);k=r[k].drv}
  return {r,crit};
}
// ---- leyenda
const leg=R.getElementById("legend");
Object.entries(ENTES).forEach(([k,v])=>{leg.insertAdjacentHTML("beforeend",`<span><i class="dot" style="background:var(${v.c})"></i>${v.n}</span>`)});

// ---- ruta
const fasesEl=R.getElementById("fases");const det=R.getElementById("detalle");
const grupos=[...new Set(S.map(s=>s.fase))];
grupos.forEach(g=>{
  const div=document.createElement("div");div.className="fase";div.innerHTML=`<h3>${g}</h3><div class="steps"></div>`;
  const cont=div.querySelector(".steps");
  S.filter(s=>s.fase===g).forEach(s=>{
    const b=document.createElement("button");b.className="step";b.type="button";b.dataset.id=s.id;b.setAttribute("aria-pressed","false");
    b.innerHTML=`<span class="bar" style="background:var(${ENTES[s.ente].c})"></span><span><span class="t">${s.t}</span><br><span class="e">${ENTES[s.ente].n}</span></span><span class="d">${s.dur?s.dur+" dh":"plan"}</span>`;
    b.addEventListener("click",()=>show(s.id));cont.appendChild(b)});
  fasesEl.appendChild(div)});
const TAG={norma:'<span class="tag norma">Plazo de norma</span>',est:'<span class="tag est">Plazo estimado</span>',ref:'<span class="tag proy">Referencia del proyecto</span>'};
function show(id){
  const s=byId[id];R.querySelectorAll(".step").forEach(b=>b.setAttribute("aria-pressed",b.dataset.id===id?"true":"false"));
  const p=last&&last[id];
  det.innerHTML=`<div class="head"><span class="chip" style="color:var(${ENTES[s.ente].c})">${ENTES[s.ente].n}</span><h2>${s.t}</h2><div>${TAG[s.tipo]}</div></div>
  <div class="kv"><div><div class="k">Plazo</div>${s.plazo}</div><div><div class="k">En el ejemplo</div><span class="mono">${p?fmt(p.s)+" → "+fmt(p.e):"—"}</span></div><div><div class="k">Costo</div>${s.costo}</div></div>
  <div class="cols2"><div><h3>Administrativo</h3><ul>${s.adm.map(x=>`<li>${x}</li>`).join("")}</ul></div><div><h3>Técnico</h3><ul>${s.tec.map(x=>`<li>${x}</li>`).join("")}</ul></div></div>
  <div><div class="k eyebrow">Resultado</div><p>${s.res}</p></div>
  <p class="base">Base: ${s.base}</p>`;
}

// ---- cronograma con dependencias
let last=null,P=null,gsel="x",collapsed={};
try{collapsed=JSON.parse(localStorage.getItem("guaruma-gantt-col")||"{}")}catch(e){}
const board=R.getElementById("board"),ggrid=R.getElementById("ggrid"),gdet=R.getElementById("gdet");
const LAB=()=>window.matchMedia("(max-width:600px)").matches?190:290;
const META=D("2028-07-31"),HOY=D("2026-10-20");
function renderGantt(){
  const {r,crit}=P;const px=+R.getElementById("zoom").value;
  const all=Object.values(r);
  const minD=new Date(Math.min(...all.map(o=>o.s)));
  const start=new Date(Date.UTC(minD.getUTCFullYear(),minD.getUTCMonth(),1));
  const maxD=new Date(Math.max(...all.map(o=>o.e),META));
  const end=new Date(Date.UTC(maxD.getUTCFullYear(),maxD.getUTCMonth()+2,1));
  const W=Math.round((end-start)/864e5*px),xOf=d=>(d-start)/864e5*px,L=LAB();
  let mo="",vg="";
  for(let m=new Date(start);m<end;m.setUTCMonth(m.getUTCMonth()+1)){const l=xOf(m);const show=px>=1.6||m.getUTCMonth()%3===0;
    mo+=`<span class="gmo" style="left:${l}px">${show?MES[m.getUTCMonth()]+(m.getUTCMonth()===0||px<1.6?" "+String(m.getUTCFullYear()).slice(2):""):""}</span>`;vg+=`<i style="left:${l}px"></i>`}
  let h=`<div class="grow head"><div class="glab">Tarea</div><div class="gtrk" style="width:${W}px"><div class="gmonths">${mo}</div></div></div>`;
  const ypos={};let y=34;const only=R.getElementById("soloCrit").checked;
  Object.entries(SEC).forEach(([sk,sv])=>{
    const ts=T.filter(t=>t.s===sk);const col=!!collapsed[sk];
    h+=`<div class="grow sec"><div class="glab"><button type="button" class="sec-btn" data-sec="${sk}" aria-expanded="${!col}"><span class="car">${col?"▸":"▾"}</span><i class="sw" style="background:var(${sv.c})"></i>${sv.n}</button></div><div class="gtrk" style="width:${W}px"></div></div>`;y+=30;
    if(col)return;
    ts.forEach(t=>{const o=r[t.id],l=xOf(o.s);ypos[t.id]=y+16;
      const cls=[crit.has(t.id)?"crit":"",t.id===gsel?"sel":"",only&&!crit.has(t.id)?"dim":""].join(" ");
      let mark;
      if(t.dur===0)mark=`<button type="button" class="gms ${cls}" data-tid="${t.id}" aria-label="${t.t}: ${fmt(o.s)}" style="left:${l}px;background:var(${sv.c})"></button><span class="btxt" style="left:${l+12}px">${fmt(o.s)}</span>`;
      else{const w=Math.max(xOf(o.e)-l,4);const tr=l+w+190>W;
        mark=`<button type="button" class="gb ${t.tipo==="est"?"est":""} ${cls}" data-tid="${t.id}" aria-label="${t.t}: ${fmt(o.s)} a ${fmt(o.e)}" style="left:${l}px;width:${w}px;background-color:var(${sv.c})"></button><span class="btxt" style="${tr?`right:${W-l+6}px`:`left:${l+w+6}px`}">${fmt(o.s)} → ${fmt(o.e)}</span>`}
      h+=`<div class="grow${t.id===gsel?" sel":""}"><div class="glab"><i class="sw" style="background:var(${sv.c})"></i><button type="button" class="nm" data-tid="${t.id}" title="${t.t}">${t.t}</button></div><div class="gtrk" style="width:${W}px">${mark}</div></div>`;y+=32});
  });
  let ar="";
  T.forEach(t=>t.dep.forEach(([d,typ])=>{
    if(ypos[d]==null||ypos[t.id]==null)return;
    const pd=r[d],x1=TB[d].dur===0?xOf(pd.s)+8:(typ==="SS"?xOf(pd.s):xOf(pd.e)),y1=ypos[d];
    const x2=xOf(r[t.id].s)-(t.dur===0?8:1),y2=ypos[t.id];
    const isC=crit.has(t.id)&&r[t.id].drv===d,isH=(t.id===gsel||d===gsel);
    const pth=x2-x1>16?`M${x1} ${y1} H${x2-8} V${y2} H${x2}`:`M${x1} ${y1} h8 V${(y1+y2)/2} H${x2-10} V${y2} H${x2}`;
    ar+=`<path class="${isH?"hl":(isC?"crit":(only?"dim":""))}" d="${pth}" marker-end="url(#ah${isH?"h":(isC?"c":"")})"/>`}));
  h+=`<svg class="arrows" width="${W}" height="${y}" style="left:${L}px"><defs>
    <marker id="ah" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8z" style="fill:var(--muted);stroke:none;opacity:.6"/></marker>
    <marker id="ahc" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8z" style="fill:var(--crit);stroke:none"/></marker>
    <marker id="ahh" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8z" style="fill:var(--accent);stroke:none"/></marker></defs>${ar}</svg>`;
  h+=`<div class="gv" style="left:${L}px;width:${W}px">${vg}</div>`;
  if(HOY>=start&&HOY<=end)h+=`<span class="gtoday" style="left:${L+xOf(HOY)}px"></span>`;
  h+=`<span class="gmeta" style="left:${L+xOf(META)}px"></span>`;
  const sx=board.scrollLeft,sy=board.scrollTop;
  ggrid.innerHTML=h;ggrid.style.width=(L+W)+"px";ggrid.style.height=y+"px";
  board.scrollLeft=sx;board.scrollTop=sy;
  showGDet();
}
function gitem(id,extra){const t=TB[id],o=P.r[id];
  return `<li><button type="button" data-tid="${id}" data-go="1"><i class="sw" style="background:var(${SEC[t.s].c})"></i><span>${t.t}${extra||""}</span><span class="dt">${t.dur?fmt(o.e):fmt(o.s)}</span></button></li>`}
function showGDet(){
  const t=TB[gsel],o=P.r[gsel],sv=SEC[t.s],drv=o.drv;
  const before=t.dep.map(([d,typ])=>gitem(d,(drv===d?' <span class="drv">· es la que lo frena</span>':"")+(typ==="SS"?' <span class="dt">(basta que arranque)</span>':""))).join("");
  const after=t.next.map(n=>gitem(n)).join("");
  const freno=(t.base==="X"&&drv&&drv!=="base")?`<p class="callout">La fecha X se corre al <b>${fmt(o.s)}</b> porque "${TB[drv].t}" no termina a tiempo.</p>`:"";
  gdet.innerHTML=`<div class="gcol">
      <span class="chip" style="color:var(${sv.c})">${sv.n}</span><h2>${t.t}</h2>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><span class="tag ${t.tipo}">${t.tipo==="norma"?"Plazo de norma":"Plazo estimado"}</span>${P.crit.has(gsel)?'<span class="tag crit">Ruta crítica</span>':""}</div>
      <dl class="gkv"><dt>Fechas</dt><dd class="mono">${t.dur?fmt(o.s)+" → "+fmt(o.e):fmt(o.s)}</dd>
      <dt>Duración</dt><dd>${t.dur?t.dur+" días hábiles":"Hito"}</dd>
      <dt>Responsable</dt><dd>${t.who}</dd><dt>Qué se necesita</dt><dd>${t.req}</dd><dt>Resultado</dt><dd>${t.por}</dd></dl>
      ${byId[gsel]?`<button type="button" class="linkbtn" data-ruta="${gsel}">Ver detalle técnico y administrativo</button>`:""}${freno}</div>
    <div class="gcol"><h3>Lo bloquea (tiene que terminar antes)</h3>${before?`<ul class="dl">${before}</ul>`:`<p class="empty">${t.base==="X"?"Solo la fecha X.":"Nada: puede arrancar ya."}</p>`}</div>
    <div class="gcol"><h3>Al terminar desbloquea</h3>${after?`<ul class="dl">${after}</ul>`:'<p class="empty">Es el final de la cadena.</p>'}</div>`;
}
function gclick(e){
  const r=e.target.closest("[data-ruta]");if(r){select("ruta");show(r.dataset.ruta);det.scrollIntoView({behavior:"smooth",block:"start"});return}
  const b=e.target.closest("[data-tid]");
  if(b){gsel=b.dataset.tid;const t=TB[gsel];if(collapsed[t.s])collapsed[t.s]=false;renderGantt();
    if(b.dataset.go){const m=ggrid.querySelector(`[data-tid="${gsel}"].gb,[data-tid="${gsel}"].gms`);if(m)board.scrollTo({left:Math.max(0,parseFloat(m.style.left)-120),top:Math.max(0,m.closest(".grow").offsetTop-120),behavior:"smooth"})}
    return}
  const s=e.target.closest("[data-sec]");
  if(s){collapsed[s.dataset.sec]=!collapsed[s.dataset.sec];try{localStorage.setItem("guaruma-gantt-col",JSON.stringify(collapsed))}catch(err){}renderGantt()}
}
board.addEventListener("click",gclick);gdet.addEventListener("click",gclick);

function render(){
  useFer=R.getElementById("fer").checked;
  const v=R.getElementById("fx").value||"2026-11-30";
  P=plan(D(v));last=P.r;const r=P.r;
  renderGantt();
  const kw=+R.getElementById("pot").value;const gar=kw*16.74;
  const usd=n=>"US$ "+n.toLocaleString("en-US",{maximumFractionDigits:0});
  R.getElementById("f-gar").textContent=usd(gar);
  R.getElementById("f-dur").textContent="≈ "+months(r.x.s,r.cont.e).toFixed(1)+" meses";
  R.getElementById("f-cod").textContent=fmtM(r.cod.e);
  R.getElementById("r-x").textContent=fmt(r.x.s);
  R.getElementById("r-cont").textContent=fmt(r.cont.e);
  R.getElementById("r-cod").textContent=fmt(r.cod.e);
  const gap=months(META,r.cod.e);const g=R.getElementById("r-gap");
  g.textContent=gap>0?"+"+gap.toFixed(1)+" meses":Math.abs(gap).toFixed(1)+" meses antes";g.className="big mono"+(gap>0?" late":"");
  const venceP=new Date(r.p1.e);venceP.setUTCMonth(venceP.getUTCMonth()+6);
  const venceR=new Date(r.res.s);venceR.setUTCMonth(venceR.getUTCMonth()+6);
  const H=[
    {w:fmt(venceP),t:"Vencen las premisas nacionales. Los estudios deben entrar al CND antes ("+fmt(r.acc.s)+" en el ejemplo).",a:r.acc.s>venceP},
    {w:fmt(venceR),t:"Vence la resolución del CND. Antes hay que pedir la PCU y presentar a la CRIE.",a:r.crie.s>venceR},
    {w:fmt(r.crieR.s),t:"Resolución de la CRIE en el ejemplo. Necesita licencia ambiental o constancia de trámite.",a:r.lic.e>r.crie.s},
    {w:fmt(r.conx.s),t:"Último día para presentar la solicitud de conexión a ENEE Transmisión, para que esté aprobada antes de las pruebas del 1 jun 2028.",a:r.conx.s>D("2028-04-17")},
    {w:fmt(r.sen3.e),t:"Resolución SEN para construir. La obra civil de la subestación arranca el 15 dic 2026, antes de esta fecha: confirmar con Legal.",a:true},
    {w:fmt(META),t:"Puesta en marcha del cronograma de 22 meses (Resumen en Asana). En el ejemplo la operación comercial sale el "+fmt(r.cod.e)+".",a:r.cod.e>META}
  ];
  R.getElementById("hitos").innerHTML=H.map(x=>`<div class="hito${x.a?" alert":""}"><span class="when">${x.w}</span><span>${x.t}</span></div>`).join("");
  renderCostos(kw,gar);
  const sel=R.querySelector('.step[aria-pressed="true"]');show(sel?sel.dataset.id:"p1");
  try{localStorage.setItem("guaruma-pot",String(kw))}catch(e){}
}

// ---- ventana Asana
const modal=R.getElementById("asana");
function openAsana(){modal.hidden=false;R.getElementById("close-asana").focus()}
function closeAsana(){modal.hidden=true;R.getElementById("open-asana").focus()}
R.getElementById("open-asana").addEventListener("click",openAsana);
R.getElementById("close-asana").addEventListener("click",closeAsana);
modal.addEventListener("click",e=>{if(e.target===modal)closeAsana()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.hidden)closeAsana()},{signal});
// ---- costos
function renderCostos(kw,gar){
  const usd=n=>"US$ "+n.toLocaleString("en-US",{maximumFractionDigits:0});
  const C=[
    ["Constancia de inicio de proceso","SEN","L 22,000","norma","Pago en TGR por apertura y análisis del expediente."],
    ["Garantía de acceso a la red ("+(kw/1000).toLocaleString("en-US")+" MW)","CND",usd(gar),"norma","USD 16.74/kW. Garantía bancaria, no gasto; se ejecuta si no se conecta a tiempo."],
    ["Comisión bancaria de la garantía","Banco",usd(gar*0.015)+" / año","est","Referencia 1–2 % anual del monto; cotizar con el banco."],
    ["Premisas y base de datos del CND","CND","Sin costo","norma","La NT-ACUT dice que la base de datos se entrega sin costo."],
    ["Premisas regionales y trámite ante CRIE","EOR / CRIE","—","conf","No encontré cargo publicado por el trámite de conexión."],
    ["Estudios eléctricos de conexión (nacional + RTR)","Consultor","US$ 71,689","proy","Monto del estudio eléctrico en la presentación del proyecto."],
    ["Estudio de coordinación de protecciones y transitorios","Consultor","US$ 15,000 – 35,000","est","Se pide en la solicitud de conexión; puede ir en el mismo contrato."],
    ["Revisión de diseño, supervisión y pruebas del punto de conexión","ENEE Transmisión","Según contrato","conf","Se pacta en el contrato; si no hay acuerdo, lo fija la CREE."],
    ["Pruebas de conexión (protecciones, SCADA, AGC)","EHG","Según contratista","est","Por cuenta de EHG, incluidas repeticiones."],
    ["Permiso de estudio e inscripción en registro","CREE","—","conf","Confirmar si hay tasa."],
    ["Permiso municipal de prefactibilidad","Municipalidad de Villanueva","—","conf","Tasa municipal por confirmar."],
    ["Estudio de impacto ambiental","EIA","US$ 59,538.14","proy","Contrato 00001-2026."],
    ["Permisos y trámites (bolsa total)","Varios","US$ 136,830.52","proy","Monto de permisos y trámites en la presentación; revisar si cubre lo de arriba."]
  ];
  const lbl={norma:"Norma",proy:"Proyecto",est:"Estimado",conf:"Por confirmar"};
  R.querySelector("#t-costos tbody").innerHTML=C.map(c=>`<tr><td>${c[0]}</td><td>${c[1]}</td><td class="num">${c[2]}</td><td><span class="tag ${c[3]}">${lbl[c[3]]}</span></td><td>${c[4]}</td></tr>`).join("");
}

// ---- acciones
const A=[
 ["Decidir 138 kV (51E68) o 230 kV (68T53)","Gerencia / Ing. Arturo"],
 ["Definir la potencia a declarar en premisas (Etapa I vs. expansión)","Gerencia Técnica"],
 ["Pedir a SÓLIDA el unifilar preliminar y la generación prevista a 4 años","C. Vallejos / SÓLIDA"],
 ["Preparar poder del representante legal y escrito de abogado","Abog. Pascua / Legal EHG"],
 ["Presentar la solicitud de premisas al CND (fecha X)","C. Vallejos"],
 ["Pedir al CND confirmación escrita de nodo RTR y contacto en el EOR","C. Vallejos"],
 ["Cotizar estudios eléctricos con FUNKEN y Perham con alcance nacional + RTR y plazo dentro de la vigencia","C. Vallejos / G. Dubón"],
 ["Gestionar con el banco la garantía de USD 16.74/kW","Administración EHG"],
 ["Iniciar la constancia SEN (L 22,000) y el permiso municipal","C. Vallejos / Legal"],
 ["Validar con EIA si SERNA pedirá la constancia SEN de la guía SEN-110-2025","C. Vallejos / EIA"],
 ["Confirmar requisitos y tasas de registro y permiso de estudio con la CREE","Legal EHG"],
 ["Dar seguimiento al paso del ODS/CND al nuevo OSM (Decreto 198-2026)","Ing. Arturo"]
];
let saved={};try{saved=JSON.parse(localStorage.getItem("guaruma-check")||"{}")}catch(e){}
const ch=R.getElementById("check");
A.forEach((a,i)=>{const id="chk"+i;ch.insertAdjacentHTML("beforeend",`<label for="${id}"><input type="checkbox" id="${id}" ${saved[i]?"checked":""}><span>${a[0]}</span><span class="who">${a[1]}</span></label>`)});
ch.addEventListener("change",e=>{const i=e.target.id.slice(3);saved[i]=e.target.checked;try{localStorage.setItem("guaruma-check",JSON.stringify(saved))}catch(err){}});

// ---- tabs
function select(tab){R.querySelectorAll("nav.tabs button").forEach(b=>b.setAttribute("aria-selected",b.dataset.tab===tab?"true":"false"));
  R.querySelectorAll("[data-panel]").forEach(p=>p.hidden=p.dataset.panel!==tab)}
R.querySelectorAll("nav.tabs button").forEach(b=>b.addEventListener("click",()=>select(b.dataset.tab)));
const hash=(location.hash||"").slice(1);if(["ruta","gantt","costos","rtr","acciones"].includes(hash))select(hash);

try{const p=localStorage.getItem("guaruma-pot");if(p)R.getElementById("pot").value=p}catch(e){}
["fx","pot","zoom","fer","soloCrit"].forEach(id=>R.getElementById(id).addEventListener("change",render));
let rz;window.addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(()=>{if(P)renderGantt()},150)},{signal});
render();
if(hash==="asana"){select("gantt");openAsana()}
}

/* ---------- Montaje dentro de la plataforma ---------- */
function mount(host) {
  const R = host.shadowRoot || host.attachShadow({ mode: 'open' });
  R.innerHTML = '<style>' + CSS + '</style>' + HTML;
  const ac = new AbortController();
  const root = document.documentElement, mq = matchMedia('(prefers-color-scheme: dark)');
  const sync = () => {
    host.dataset.theme = root.dataset.theme || (mq.matches ? 'dark' : 'light');
    const top = document.querySelector('header.top');
    host.style.setProperty('--rr-top', (top && getComputedStyle(top).position === 'sticky' ? top.offsetHeight : 0) + 'px');
  };
  sync();
  const mo = new MutationObserver(sync); mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  mq.addEventListener('change', sync, { signal: ac.signal });
  addEventListener('resize', sync, { signal: ac.signal });
  run(R, ac.signal);
  return () => { ac.abort(); mo.disconnect(); };
}

(window.GuarumaModulos = window.GuarumaModulos || {})['ruta-regulatoria'] = { mount };
})();
