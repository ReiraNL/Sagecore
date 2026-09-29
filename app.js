const $=s=>document.querySelector(s);
const messages=$('#messages')||$('.messages');
const input=$('#messageInput')||$('textarea')||$('input[type=text]');
const send=$('#sendBtn')||$('#send')||$('.send-btn');
const mic=$('#micBtn')||$('#mic')||$('.mic-btn');
let history=JSON.parse(localStorage.getItem('sagecore.history')||'[]');
let speaking=true;
function status(v){ const el=$('#coreStatus')||$('.core-status')||$('.status'); if(el) el.textContent=v; document.body.dataset.state=v.toLowerCase(); }
function add(role,text){ if(!messages)return; const d=document.createElement('div'); d.className='message '+role; d.textContent=text; messages.appendChild(d); messages.scrollTop=messages.scrollHeight; }
history.forEach(m=>add(m.role,m.content));
async function ask(text){ if(!text.trim())return; add('user',text); history.push({role:'user',content:text}); localStorage.setItem('sagecore.history',JSON.stringify(history.slice(-40))); status('THINKING');
 try{ const r=await fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:history})}); const j=await r.json(); if(!r.ok) throw new Error(j.error||'AI service error'); const answer=j.answer; add('assistant',answer); history.push({role:'assistant',content:answer}); localStorage.setItem('sagecore.history',JSON.stringify(history.slice(-40))); if(speaking&&'speechSynthesis'in window){ status('SPEAKING'); speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(answer); u.lang='nl-NL'; u.onend=()=>status('READY'); speechSynthesis.speak(u);} else status('READY'); }
 catch(e){ add('assistant','Verbinding met de AI-service mislukt: '+e.message); status('OFFLINE'); }
}
if(send) send.onclick=()=>{const t=input.value;input.value='';ask(t)};
if(input) input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send?.click()}});
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
if(mic) mic.onclick=()=>{ if(!SR){alert('Spraakherkenning is op deze Safari-versie niet beschikbaar. Je kunt wel typen en gesproken antwoorden gebruiken.');return;} const r=new SR();r.lang='nl-NL';r.interimResults=true;status('LISTENING');r.onresult=e=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;if(input)input.value=t};r.onend=()=>{status('READY');if(input?.value.trim()){const t=input.value;input.value='';ask(t)}};r.onerror=()=>status('READY');r.start();};
if('serviceWorker'in navigator) addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));
status('READY');
