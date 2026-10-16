(function(){
  'use strict';
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function html({markup,title,subtitle,base}){
    return `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${escape(base)}"><title>${escape(title)}</title><style>
      *{box-sizing:border-box}body{margin:20px;font:14px Arial,sans-serif;color:#17283e;background:white}h1{font-size:23px;margin:0 0 8px}.toolbar{display:flex;gap:12px;margin:20px 0}.toolbar button{padding:12px 18px;background:#324cd4;color:white;border:0;border-radius:8px;cursor:pointer}.schedule-poster-header,.schedule-print-note,.calendar-legend,.calendar-class button{display:none}.schedule-calendar-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:11px}.schedule-calendar-table th,.schedule-calendar-table td{border:1px solid #c6cfdb;padding:7px;vertical-align:top}.schedule-calendar-table thead th{background:#e8edf7}.schedule-calendar-table tbody th{width:85px}.calendar-class{padding:6px;margin:3px 0;background:color-mix(in srgb,var(--class-color,#dbe8fb) 20%,white);border-left:3px solid var(--class-color,#324cd4);break-inside:avoid}.calendar-class strong,.calendar-class span,.calendar-class small,.calendar-class em{display:block;font-size:11px;line-height:1.35}.calendar-empty{min-height:20px;color:#8b95a2}img{max-width:60px}.schedule-calendar-wrap{overflow:visible}
      @page{size:landscape;margin:10mm}@media print{body{margin:0}.toolbar,.print-help{display:none}thead{display:table-header-group}tr{break-inside:avoid}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
      </style><h1>${escape(title)}</h1><p>${escape(subtitle)}</p><p class="print-help">En la ventana de impresión puedes elegir una impresora o Guardar como PDF.</p><div class="toolbar"><button id="print">Imprimir o guardar PDF</button><button id="close">Cerrar</button></div>${markup}</html>`;
  }
  function open(options){
    const page=window.open('','ade-horario','width=1100,height=760');if(!page)return false;
    page.opener=null;page.document.open();page.document.write(html({...options,base:document.baseURI}));page.document.close();
    page.document.getElementById('print').addEventListener('click',()=>page.print());
    page.document.getElementById('close').addEventListener('click',()=>page.close());page.focus();return true;
  }
  window.AdeSchedulePrint=Object.freeze({html,open});
})();
