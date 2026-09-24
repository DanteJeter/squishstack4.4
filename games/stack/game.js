
const SQUISH_ART='characters.png';
document.querySelectorAll("[data-squish-art]").forEach(img=>{img.src=SQUISH_ART;});
'use strict';
const $=id=>document.getElementById(id), canvas=$('game'), ctx=canvas.getContext('2d');
const sheet=new Image();
const crops=[[65,96,393,369],[570,54,382,420],[1068,94,398,381],[69,557,393,380],[542,579,438,365],[1061,508,410,441]], sprites=[];
let loaded=false,mode='ready',stack=[],piece=null,score=0,best=0,camera=0,last=0,time=0,lossTime=0,muted=true,audioCtx=null,particles=[];
const W=88,H=68,ground=504;
function say(text){$('notice').textContent=text;}
let savedBest=0;
try{const stored=Number(localStorage.getItem('squishstack.best.v1'));best=Number.isSafeInteger(stored)&&stored>=0?stored:0;savedBest=best;muted=localStorage.getItem('squishstack.sound.v1')!=='on';}catch{}
function stats(){if(best>savedBest){try{localStorage.setItem('squishstack.best.v1',String(best));savedBest=best;}catch{}}
$('score').innerHTML=score+' <small>squishes</small>';$('best').textContent=best;}
function beep(freq){if(muted)return;try{audioCtx ||=new (window.AudioContext||window.webkitAudioContext)();audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.65,audioCtx.currentTime+.15);g.gain.setValueAtTime(.09,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.2);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.2);}catch{}}
sheet.onload=()=>{for(const [x,y,w,h] of crops){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(sheet,x,y,w,h,0,0,w,h);const d=g.getImageData(0,0,w,h);for(let i=0;i<d.data.length;i+=4){const r=d.data[i],b=d.data[i+2],gr=d.data[i+1],min=Math.min(r,b,gr),max=Math.max(r,b,gr);if(min>215&&max-min<35)d.data[i+3]=Math.round(255*Math.min(1,(255-min)/40));}g.putImageData(d,0,0);sprites.push(c);}loaded=true;};
sheet.onerror=()=>{say('Characters could not load. Refresh to try again.');$('start').disabled=true;};
sheet.src=SQUISH_ART;
function spawn(){
  const target=stack.length?stack[stack.length-1].x:240;
  let x=Math.random()<.5?54+Math.random()*22:404+Math.random()*22;
  // Every new piece must travel before it can make a safe landing.
  if(Math.abs(x-target)<125)x=target<240?404+Math.random()*22:54+Math.random()*22;
  const speed=(170+Math.min(score,20)*8)*(0.92+Math.random()*.16);
  piece={x,y:75-camera,v:0,vx:x<240?speed:-speed,type:score%6,falling:false,age:0};
  $('drop').disabled=false;
}
function requiredOverlap(){return W*Math.min(.82,.65+score*.009);}
function start(){if(!loaded){say('Loading your squishies…');return false;}mode='playing';stack=[];score=0;camera=0;particles=[];lossTime=0;stats();$('overlay').style.display='none';$('paused').hidden=true;$('pause').disabled=false;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pause game');say('Tap when you’re above the platform.');spawn();$('drop').focus({preventScroll:true});return true;}
function drop(){if(mode!=='playing'||!piece||piece.falling)return false;piece.falling=true;piece.v=60;$('drop').disabled=true;beep(380);return true;}
function togglePause(){if(mode==='playing'){mode='paused';$('paused').hidden=false;$('drop').disabled=true;$('pause').textContent='▶';$('pause').setAttribute('aria-label','Resume game');}else if(mode==='paused'){mode='playing';$('paused').hidden=true;$('drop').disabled=piece?.falling??true;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pause game');}}
function end(){mode='over';$('pause').disabled=true;$('drop').disabled=true;$('overlay').innerHTML='<div class="bubble">GOOD VIBES. GREAT TRY.</div><h2>Squish<br>Happens!</h2><p>You stacked <strong>'+score+' squish'+(score===1?'':'es')+'</strong>.<br>'+(score===best&&score>0?'Your best stack on this device!':'One more try? Your next stack is waiting.')+'</p><button class="primary" id="again">SQUISH AGAIN <span>↻</span></button><small>Device best: '+best+' squishes</small><a class="round-shop" href="#discover">Explore squishy toy styles ↗</a>';$('overlay').style.display='flex';$('again').onclick=start;say('');$('again').focus({preventScroll:true});}
function landed(){const support=stack.length?stack[stack.length-1]:{x:240,w:168,y:ground};const overlap=Math.max(0,Math.min(piece.x+W/2,support.x+(support.w||W)/2)-Math.max(piece.x-W/2,support.x-(support.w||W)/2));if(overlap<requiredOverlap()){mode='losing';lossTime=0;piece.v=120;piece.dx=piece.x<support.x?-110:110;say('Oops… a little too far!');beep(150);$('pause').disabled=true;return;}const offset=Math.abs(piece.x-support.x);piece.y=support.y-H;piece.age=0;piece.w=W;stack.push(piece);score++;best=Math.max(score,best);stats();beep(offset<12?800:550);say(offset<12?'Perfect squish!':offset<30?'Nice landing!':'That was close! Aim for the middle.');for(let i=0;i<12;i++)particles.push({x:piece.x,y:piece.y+camera+H/2,vx:(Math.random()-.5)*180,vy:-60-Math.random()*130,life:.7,c:['#ff54b1','#773be4','#ffdf45'][i%3]});camera=Math.max(0,H*stack.length-204);spawn();}
function update(dt){time+=dt;for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=250*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);for(const s of stack)s.age+=dt;if(mode==='playing'&&piece){if(!piece.falling){piece.x+=piece.vx*dt;if(piece.x>426){piece.x=852-piece.x;piece.vx=-Math.abs(piece.vx);}else if(piece.x<54){piece.x=108-piece.x;piece.vx=Math.abs(piece.vx);}piece.y=75-camera;}else{piece.v+=1050*dt;piece.y+=piece.v*dt;const target=(stack.length?stack[stack.length-1].y:ground)-H;if(piece.y>=target)landed();}}else if(mode==='losing'){lossTime+=dt;piece.v+=900*dt;piece.y+=piece.v*dt;piece.x+=piece.dx*dt;if(lossTime>1)end();}}
function character(type,x,y,w,h,angle=0){if(!loaded)return;ctx.save();ctx.translate(x,y+h/2);ctx.rotate(angle);ctx.drawImage(sprites[type],-w/2,-h/2,w,h);ctx.restore();}
function draw(){ctx.clearRect(0,0,480,560);ctx.fillStyle='#ffffff45';for(let i=0;i<18;i++){const x=(i*137+29)%480,y=(i*91+34)%560;ctx.beginPath();ctx.arc(x,y,2+(i%3),0,7);ctx.fill();}ctx.strokeStyle='#ffffff45';ctx.setLineDash([3,9]);ctx.beginPath();ctx.moveTo(240,45);ctx.lineTo(240,530);ctx.stroke();ctx.setLineDash([]);
const gy=ground+camera;ctx.fillStyle='#5e26b7';ctx.beginPath();ctx.roundRect(151,gy,178,19,9);ctx.fill();ctx.fillStyle='#9c63ef';ctx.beginPath();ctx.roundRect(151,gy,178,9,5);ctx.fill();
if(mode==='ready'){character(3,240,ground-H,88,H);character(2,228,ground-H*2,88,H);character(0,245,ground-H*3,88,H);}else{for(let i=0;i<stack.length;i++){const s=stack[i],bounce=s.age<.35?Math.sin(s.age/.35*Math.PI)*.17:0;let x=s.x,y=s.y+camera,a=0;if(mode==='losing'){x+=Math.sin(i+1)*lossTime*70;y+=lossTime*lossTime*140;a=Math.sin(i)*lossTime*.4;}if(y>-100&&y<650)character(s.type,x,y+H*bounce,W*(1+bounce),H*(1-bounce),a);}if(piece&&(mode==='playing'||mode==='paused'||mode==='losing')){if(!piece.falling){ctx.strokeStyle='#633c8055';ctx.setLineDash([4,7]);ctx.beginPath();ctx.moveTo(piece.x,piece.y+camera+H+8);ctx.lineTo(piece.x,(stack.length?stack[stack.length-1].y:ground)+camera);ctx.stroke();ctx.setLineDash([]);}character(piece.type,piece.x,piece.y+camera,W,H,mode==='losing'?lossTime*2:0);}}
for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/.7);ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,6,6);}ctx.globalAlpha=1;}
function frame(t){const dt=Math.min((t-last)/1000||0,.035);last=t;if(mode!=='paused'&&!document.hidden)update(dt);draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
$('start').onclick=start;$('drop').onclick=drop;canvas.addEventListener('pointerdown',()=>drop());$('restart').onclick=start;$('pause').onclick=togglePause;$('resume').onclick=togglePause;$('sound').onclick=()=>{muted=!muted;try{localStorage.setItem('squishstack.sound.v1',muted?'off':'on');}catch{}$('sound').textContent=muted?'Sound off':'Sound on';$('sound').setAttribute('aria-label',muted?'Turn sound on':'Turn sound off');$('sound').setAttribute('aria-pressed',String(!muted));beep(660);};
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&e.target.tagName!=='BUTTON'){e.preventDefault();if(mode==='ready'||mode==='over')start();else drop();}if(e.code==='KeyP')togglePause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')togglePause();});
// Keep a live round safe while a player visits another part of the site.
document.addEventListener('click',event=>{const link=event.target.closest?.('a[href^="#"]');if(link&&link.getAttribute('href')!=='#play'&&mode==='playing')togglePause();});


stats();$('sound').textContent=muted?'Sound off':'Sound on';$('sound').setAttribute('aria-label',muted?'Turn sound on':'Turn sound off');$('sound').setAttribute('aria-pressed',String(!muted));
window.addEventListener('storage',e=>{if(e.key==='squishstack.best.v1'){const value=Number(e.newValue);if(Number.isSafeInteger(value)&&value>best){best=value;savedBest=value;stats();}}});
