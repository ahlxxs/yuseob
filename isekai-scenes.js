/* 이세계 모험 배경: 보내주신 그림 + 코드로 그린 장소. 공부 15분마다 다음 장소로 이동.
   IsekaiJourney.start(canvas, 공부한초, 일시정지여부, 도착시호출) → 멈추는 함수 */
(()=>{

/* ───────── 도구 ───────── */
const TAU=Math.PI*2, DPR=Math.min(devicePixelRatio||1,1.5);
const rng=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const rr=(r,a,b)=>a+r()*(b-a);
const mod=(a,n)=>((a%n)+n)%n;
function mk(w,h){const c=document.createElement('canvas');c.width=Math.ceil(w*DPR);c.height=Math.ceil(h*DPR);const x=c.getContext('2d');x.scale(DPR,DPR);return [c,x]}
const rep=(W,px,m,fn)=>fn(px);   // 가장자리 넘친 부분은 build()에서 반대편으로 접어 붙여 이음새를 없앰
const waves=(r,a,ks=[1,2,3,5,9,17,31,57])=>ks.map((k,i)=>[k,a/Math.pow(1.7,i),r()*TAU]);
function ridge(x,W,h,base,ws,fromTop){
  x.beginPath();x.moveTo(0,fromTop?0:h);
  for(let p=0;p<=W;p+=2){let y=base;for(const[k,a,ph]of ws)y+=a*Math.sin(TAU*k*p/W+ph);x.lineTo(p,y)}
  x.lineTo(W,fromTop?0:h);x.closePath();
}
function vgrad(x,y0,y1,stops){const g=x.createLinearGradient(0,y0,0,y1);stops.forEach((c,i)=>g.addColorStop(i/(stops.length-1),c));return g}
function streaks(x,W,y0,y1,r,n,cols,w0,w1,alpha=.25){
  x.save();x.lineCap='round';
  for(let i=0;i<n;i++){const px=r()*W,py=rr(r,y0,y1),len=rr(r,8,60),wd=rr(r,w0,w1);
    x.globalAlpha=alpha*r();x.strokeStyle=cols[i%cols.length];x.lineWidth=wd;
    rep(W,px,4,q=>{x.beginPath();x.moveTo(q,py);x.lineTo(q+rr(r,-3,3),py+len);x.stroke()})}
  x.restore();
}
function cloud(x,cx,cy,s,r,lit,shade){
  const b=[];for(let i=0;i<46;i++){const dx=rr(r,-1,1);b.push([cx+dx*s*1.5,cy-Math.pow(r(),.8)*s*(1-Math.abs(dx)*.55),s*rr(r,.18,.42)])}
  b.sort((p,q)=>q[1]-p[1]);
  for(const[bx,by,br]of b){const g=x.createRadialGradient(bx-br*.35,by-br*.45,br*.05,bx,by+br*.2,br*1.05);g.addColorStop(0,lit);g.addColorStop(.55,lit);g.addColorStop(1,shade);x.fillStyle=g;x.beginPath();x.arc(bx,by,br,0,TAU);x.fill()}
}
function foliage(x,cx,cy,rad,r,[dk,md,lt],k=1){
  const n=Math.round((10+rad*.7)*k);
  const pass=(col,ox,oy,sc,cnt)=>{x.fillStyle=col;for(let i=0;i<cnt;i++){const a=r()*TAU,d=Math.sqrt(r())*rad;const br=rad*rr(r,.14,.32)*sc;
    x.beginPath();x.ellipse(cx+Math.cos(a)*d*1.15+ox,cy+Math.sin(a)*d*.8+oy,br,br*.82,r()*3,0,TAU);x.fill()}};
  pass(dk,rad*.08,rad*.12,1,n);pass(md,0,0,.85,n*.8|0);pass(lt,-rad*.2,-rad*.24,.55,n*.45|0);
  x.fillStyle=lt;for(let i=0;i<n;i++){const a=rr(r,Math.PI,TAU),d=Math.sqrt(r())*rad;x.beginPath();x.ellipse(cx+Math.cos(a)*d-rad*.1,cy+Math.sin(a)*d*.8-rad*.1,rad*.05,rad*.025,r()*3,0,TAU);x.fill()}
}
function tree(x,bx,gy,H,r,pal,bark,depth=4){
  const tips=[];x.lineCap='round';
  const br=(px,py,len,ang,wd,d)=>{const ex=px+Math.cos(ang)*len,ey=py+Math.sin(ang)*len,bend=rr(r,-.25,.25);
    x.strokeStyle=bark;x.lineWidth=wd;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+Math.cos(ang+bend)*len*.55,py+Math.sin(ang+bend)*len*.55,ex,ey);x.stroke();
    if(d===0){tips.push([ex,ey,len]);return}
    const n=d>=3?2:(r()<.5?2:3);for(let i=0;i<n;i++)br(ex,ey,len*rr(r,.62,.82),ang+(i-(n-1)/2)*rr(r,.45,.8)+rr(r,-.15,.15),wd*.66,d-1)};
  x.fillStyle=bark;x.beginPath();x.moveTo(bx-H*.07,gy);x.quadraticCurveTo(bx-H*.025,gy-H*.04,bx-H*.03,gy-H*.12);x.lineTo(bx+H*.03,gy-H*.12);x.quadraticCurveTo(bx+H*.025,gy-H*.04,bx+H*.08,gy);x.fill();
  br(bx,gy,H*.36,-Math.PI/2+rr(r,-.06,.06),H*.06,depth);
  tips.sort((a,b)=>b[1]-a[1]);
  for(const[tx,ty]of tips)foliage(x,tx,ty,H*rr(r,.1,.15),r,pal);
}
function trunk(x,cx,w,top,bot,r,dark,mid,light){
  const lean=rr(r,-w*.4,w*.4);
  const g=x.createLinearGradient(cx-w,0,cx+w,0);g.addColorStop(0,dark);g.addColorStop(.3,mid);g.addColorStop(.42,light);g.addColorStop(.7,dark);g.addColorStop(1,dark);
  x.fillStyle=g;x.beginPath();x.moveTo(cx-w*.9,bot);x.quadraticCurveTo(cx-w*.5+lean,(top+bot)/2,cx-w*.45+lean,top);x.lineTo(cx+w*.45+lean,top);x.quadraticCurveTo(cx+w*.5+lean,(top+bot)/2,cx+w*.95,bot);x.fill();
  // 뿌리
  x.beginPath();x.moveTo(cx-w*1.6,bot);x.quadraticCurveTo(cx-w*.6,bot-w*.6,cx-w*.5,bot-w*1.4);x.lineTo(cx+w*.5,bot-w*1.4);x.quadraticCurveTo(cx+w*.7,bot-w*.6,cx+w*1.7,bot);x.fill();
}
function grass(x,W,y0,y1,n,cols,r,hmin,hmax,lw=1.2){
  x.lineCap='round';
  for(let i=0;i<n;i++){const px=r()*W,py=rr(r,y0,y1),hh=rr(r,hmin,hmax),lean=rr(r,-.4,.4)*hh;x.strokeStyle=cols[i%cols.length];x.lineWidth=lw*rr(r,.6,1.4);
    rep(W,px,hh,q=>{x.beginPath();x.moveTo(q,py);x.quadraticCurveTo(q+lean*.3,py-hh*.6,q+lean,py-hh);x.stroke()})}
}
function glowPlant(x,px,py,s,r,leaf,glow,flower){
  x.save();x.shadowColor=glow;x.shadowBlur=s*1.6;
  const n=r()<.5?3:4;for(let i=0;i<n;i++){const a=-Math.PI/2+(i-(n-1)/2)*.9+rr(r,-.2,.2);
    x.fillStyle=leaf;x.beginPath();x.ellipse(px+Math.cos(a)*s*.6,py+Math.sin(a)*s*.45,s*.62,s*.4,a,0,TAU);x.fill()}
  x.fillStyle=flower;x.shadowColor=flower;x.beginPath();x.arc(px,py-s*.2,s*.18,0,TAU);x.fill();x.restore();
}

/* ───────── 실시간 효과 (매 프레임) ───────── */
function makeParts(n,seed){const r=rng(seed);return Array.from({length:n},()=>({x:r(),y:r(),p:r()*TAU,s:rr(r,.5,1.4),z:rr(r,.35,1)}))}
function glowDot(c,x,y,rad,col,a){const g=c.createRadialGradient(x,y,0,x,y,rad*4);g.addColorStop(0,`rgba(${col},${a})`);g.addColorStop(.25,`rgba(${col},${a*.45})`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.beginPath();c.arc(x,y,rad*4,0,TAU);c.fill()}
function drawParts(c,w,h,t,ps,kind,col,area=[0,1]){
  const u=h/100;
  for(const p of ps){
    if(kind==='firefly'){const x=mod(p.x*w-t*6*p.z+Math.sin(t*.6+p.p)*4*u,w),y=(area[0]+p.y*(area[1]-area[0]))*h+Math.sin(t*.8+p.p*2)*2*u;
      glowDot(c,x,y,.35*u*p.s,col,.5+.5*Math.sin(t*2.2+p.p*3))}
    else if(kind==='mote'){const x=mod(p.x*w-t*3*p.z+Math.sin(t*.3+p.p)*3*u,w),y=mod(p.y*h-t*1.5*p.z,h*(area[1]-area[0]))+area[0]*h;
      glowDot(c,x,y,.18*u*p.s,col,.35+.3*Math.sin(t+p.p))}
    else{const fall=kind==='petal'?7:10,x=mod(p.x*w-t*14*p.z+Math.sin(t*.9+p.p)*5*u,w),y=mod(p.y*h+t*fall*p.z,h+20)-10;
      c.save();c.translate(x,y);c.rotate(t*p.s+p.p);c.scale(1,Math.abs(Math.sin(t*1.3*p.s+p.p))*.8+.2);c.fillStyle=`rgba(${col},${.55+.35*p.z})`;
      c.beginPath();c.ellipse(0,0,.55*u*p.s,.3*u*p.s,0,0,TAU);c.fill();c.restore()}
  }
}
function rays(c,w,h,t,list,col){
  c.save();c.globalCompositeOperation='screen';
  list.forEach(([x0,top,wid,slant,a],i)=>{const al=a*(.7+.3*Math.sin(t*.35+i*1.9));const X=x0*w,T=top*h,dx=slant*h;
    const g=c.createLinearGradient(X,T,X+dx,h);g.addColorStop(0,`rgba(${col},${al})`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;
    c.beginPath();c.moveTo(X,T);c.lineTo(X+wid*w,T);c.lineTo(X+wid*w*2.2+dx,h);c.lineTo(X+dx,h);c.closePath();c.fill()});
  c.restore();
}
function shimmer(c,w,h,t,y0,y1,col,n=40,seed=7){
  const r=rng(seed);c.save();c.globalCompositeOperation='screen';
  for(let i=0;i<n;i++){const y=rr(r,y0,y1)*h,len=rr(r,10,40)*(y/h),x=mod(r()*w-t*rr(r,4,10),w),a=.25+.25*Math.sin(t*2+i);
    c.strokeStyle=`rgba(${col},${a})`;c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x+len,y);c.stroke()}
  c.restore();
}
function hero(c,x,gy,u,t,rim){
  const s=u*.75,ph=t*6.5,bob=Math.abs(Math.sin(ph))*s*.5;
  c.save();c.translate(x,gy);
  c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.ellipse(0,0,4.5*s,1*s,0,0,TAU);c.fill();
  c.translate(0,-bob);
  const a=Math.sin(ph)*.45;c.strokeStyle='#2a2333';c.lineWidth=1.4*s;c.lineCap='round';
  for(const k of[1,-1]){c.beginPath();c.moveTo(0,-5*s);c.lineTo(Math.sin(a*k)*4.5*s,bob*.9);c.stroke()}
  // 지팡이
  c.strokeStyle='#5a4128';c.lineWidth=.8*s;c.beginPath();c.moveTo(3.4*s,-15*s);c.lineTo(4.2*s+Math.sin(ph)*.6*s,bob);c.stroke();
  glowDot(c,3.4*s,-15.6*s,.9*s,rim,.95);
  // 망토
  const fl=Math.sin(ph*1.1)*.7*s;
  c.fillStyle='#3b3555';c.beginPath();c.moveTo(-2*s,-11.5*s);c.lineTo(2.2*s,-11.5*s);c.lineTo(3.2*s,-4.2*s);c.quadraticCurveTo(0,-3.4*s,-4.4*s+fl,-3.8*s);c.closePath();c.fill();
  c.strokeStyle=`rgba(${rim},.9)`;c.lineWidth=.5*s;c.beginPath();c.moveTo(2.2*s,-11.5*s);c.lineTo(3.2*s,-4.2*s);c.stroke();
  // 머리·모자
  c.fillStyle='#f0d6be';c.beginPath();c.arc(.5*s,-13.2*s,1.9*s,0,TAU);c.fill();
  c.fillStyle='#2b2643';c.beginPath();c.ellipse(.4*s,-14.6*s,4.4*s,1.05*s,-.05,0,TAU);c.fill();
  c.beginPath();c.moveTo(-1.9*s,-14.8*s);c.lineTo(2.4*s,-14.8*s);c.quadraticCurveTo(.4*s,-18*s,-2.6*s,-20.5*s);c.closePath();c.fill();
  c.strokeStyle=`rgba(${rim},.8)`;c.lineWidth=.4*s;c.beginPath();c.moveTo(2.4*s,-14.8*s);c.quadraticCurveTo(.4*s,-18*s,-2.6*s,-20.5*s);c.stroke();
  c.restore();
}

/* ───────── 장소 ─────────
   각 장소 = 하늘(고정) + 속도가 다른 여러 겹(가로로 이음새 없이 반복) + 실시간 효과 */
const SCENES={
forest:{name:'햇살 숲길',ref:'사진 4',desc:'연두빛 햇살이 비스듬히 쏟아지는 숲속 오솔길. 금빛 먼지와 나뭇잎이 흩날립니다.',
  ground:83,rim:'255,240,170',charAfter:2,
  sky(x,w,h){x.fillStyle=vgrad(x,0,h,['#dff3b0','#b9e07a','#6fa64a']);x.fillRect(0,0,w,h);
    const g=x.createRadialGradient(w*.12,0,0,w*.12,0,h*.9);g.addColorStop(0,'rgba(255,255,210,.95)');g.addColorStop(1,'rgba(255,255,210,0)');x.fillStyle=g;x.fillRect(0,0,w,h)},
  layers:[
    [1.5,4,(x,W,h,r,u)=>{for(let i=0;i<14;i++){const px=r()*W;rep(W,px,45*u,q=>{x.globalAlpha=.55;tree(x,q,h*.78,rr(r,50,75)*u,rng(i*97+3),['#8fbf6a','#a6d27c','#cdeaa0'],'#7f9f62',3)})}x.globalAlpha=1;
      x.fillStyle=vgrad(x,h*.5,h,['rgba(220,240,170,0)','rgba(220,240,170,.65)']);x.fillRect(0,h*.5,W,h*.5)}],
    [1.5,10,(x,W,h,r,u)=>{for(let i=0;i<6;i++){const px=(i+rr(r,.1,.9))*W/6;rep(W,px,30*u,q=>trunk(x,q,rr(r,2.5,4)*u,-5,h*.8,rng(i+40),'#1f2a17','#3e4a2a','#9ab35a'))}
      for(let i=0;i<9;i++){const px=r()*W;rep(W,px,35*u,q=>foliage(x,q,rr(r,-2,14)*u,rr(r,14,22)*u,rng(i+60),['#2c5a22','#4b8a2e','#bde36a']))}
      x.fillStyle=vgrad(x,h*.74,h,['#6fa63e','#3f6d26']);ridge(x,W,h,h*.78,waves(r,1.5*u));x.fill();
      x.fillStyle=vgrad(x,h*.8,h*.9,['#e7d79a','#b9a868']);ridge(x,W,h,h*.82,waves(r,.6*u,[2,3,7]));x.fill();
      x.fillStyle='#6fa63e';x.fillRect(0,h*.88,W,h*.12);
      grass(x,W,h*.76,h*.82,260,['#4f8a2e','#8cc24a','#c8ec7a'],r,1.5*u,4*u)}],
    [1,22,(x,W,h,r,u)=>{for(let i=0;i<7;i++){const px=r()*W;rep(W,px,20*u,q=>foliage(x,q,h*rr(r,.98,1.06),rr(r,8,15)*u,rng(i+80),['#173a16','#2f6a22','#9fd84e'],1.3))}
      grass(x,W,h*.95,h*1.02,160,['#1f4a1a','#3d7a26','#7fc040'],r,4*u,10*u,2)}]],
  live(c,w,h,t,u){rays(c,w,h,t,[[.02,0,.06,.55,.5],[.12,0,.04,.6,.35],[.22,0,.07,.5,.3]],'255,250,200');drawParts(c,w,h,t,this.p1||(this.p1=makeParts(40,1)),'mote','255,240,160');drawParts(c,w,h,t,this.p2||(this.p2=makeParts(10,2)),'leaf','150,210,70')}},

creek:{name:'빛 클로버 개울',ref:'사진 2',desc:'어두운 숲 사이로 빛나는 클로버가 피어난 개울. 반딧불이 천천히 떠다닙니다.',
  ground:72,rim:'210,255,120',charAfter:2,
  sky(x,w,h){x.fillStyle=vgrad(x,0,h,['#0b2016','#1d4a26','#122a1a']);x.fillRect(0,0,w,h);
    const g=x.createRadialGradient(w*.55,h*.55,0,w*.55,h*.55,h*.6);g.addColorStop(0,'rgba(220,255,90,.75)');g.addColorStop(.4,'rgba(140,210,60,.3)');g.addColorStop(1,'rgba(60,120,40,0)');x.fillStyle=g;x.fillRect(0,0,w,h)},
  layers:[
    [1.5,4,(x,W,h,r,u)=>{for(let i=0;i<16;i++){const px=r()*W;rep(W,px,6*u,q=>{x.globalAlpha=.55;trunk(x,q,rr(r,1.5,3)*u,-5,h*.72,rng(i+5),'#1a3a24','#2d5a34','#5f8f4a')})}x.globalAlpha=1;
      x.fillStyle=vgrad(x,h*.4,h*.75,['rgba(120,190,70,0)','rgba(120,190,70,.35)']);x.fillRect(0,h*.4,W,h*.35)}],
    [1.5,9,(x,W,h,r,u)=>{for(let i=0;i<5;i++){const px=(i+rr(r,.1,.9))*W/5;rep(W,px,20*u,q=>trunk(x,q,rr(r,4,7)*u,-5,h*.73,rng(i+30),'#0c140c','#1e2a18','#4d6a30'))}
      x.fillStyle=vgrad(x,h*.66,h*.78,['#7fc23a','#2a4a1a']);ridge(x,W,h,h*.7,waves(r,1.2*u,[2,3,5,11]));x.fill();
      x.fillStyle='#1b2a16';x.fillRect(0,h*.77,W,h*.23);
      for(let i=0;i<26;i++){const px=r()*W;rep(W,px,4*u,q=>glowPlant(x,q,h*rr(r,.67,.75),rr(r,1.2,2.4)*u,rng(i+100),'#b8f04a','rgba(200,255,80,.9)','#ffb84a'))}
      grass(x,W,h*.68,h*.76,180,['#5f9a2a','#a6e04a','#e3ff8a'],r,1*u,3*u)}],
    [1,18,(x,W,h,r,u)=>{x.fillStyle=vgrad(x,h*.76,h,['#26402c','#0f1a12']);x.fillRect(0,h*.76,W,h*.24);
      for(let i=0;i<30;i++){const px=r()*W,py=h*rr(r,.8,1),s=rr(r,.6,2)*u*(py/h);rep(W,px,4*u,q=>{x.fillStyle='rgba(120,130,110,.45)';x.beginPath();x.ellipse(q,py,s*2,s*.8,0,0,TAU);x.fill()})}
      x.save();x.filter='blur(4px)';for(let i=0;i<14;i++){const px=r()*W;rep(W,px,10*u,q=>{x.fillStyle='rgba(200,255,90,.25)';x.fillRect(q,h*rr(r,.78,.9),rr(r,4,12)*u,.6*u)})}x.restore();
      for(let i=0;i<12;i++){const px=r()*W,py=h*rr(r,.86,1.02);rep(W,px,6*u,q=>glowPlant(x,q,py,rr(r,2.5,4.5)*u,rng(i+200),'#9ee840','rgba(190,255,70,.95)','#ffae3a'))}}]],
  live(c,w,h,t,u){shimmer(c,w,h,t,.78,.98,'210,255,140',30);drawParts(c,w,h,t,this.p1||(this.p1=makeParts(45,3)),'firefly','255,200,80',[.1,.85]);drawParts(c,w,h,t,this.p2||(this.p2=makeParts(25,4)),'firefly','200,255,120',[.3,.8])}},

river:{name:'노을 강가',ref:'사진 1 · 요청하신 강가',desc:'해가 지는 강가를 따라 걷는 길. 강물에 노을이 길게 비칩니다.',
  ground:73,rim:'255,200,140',charAfter:3,
  sky(x,w,h){x.fillStyle=vgrad(x,0,h*.58,['#4d5fa8','#b77fa8','#f4a97a','#ffd59a']);x.fillRect(0,0,w,h*.58);
    const g=x.createRadialGradient(w*.68,h*.5,0,w*.68,h*.5,h*.45);g.addColorStop(0,'rgba(255,240,200,1)');g.addColorStop(.08,'rgba(255,230,170,.95)');g.addColorStop(.3,'rgba(255,190,120,.35)');g.addColorStop(1,'rgba(255,190,120,0)');x.fillStyle=g;x.fillRect(0,0,w,h*.6);
    const r=rng(9),u=h/100;for(let i=0;i<5;i++)cloud(x,rr(r,0,w),rr(r,10,30)*u,rr(r,6,10)*u,r,'rgba(255,215,190,.9)','rgba(170,110,150,.8)');
    x.fillStyle=vgrad(x,h*.56,h*.8,['#e9a07a','#7a5c86','#3b3d66']);x.fillRect(0,h*.56,w,h*.24);
    const rf=x.createLinearGradient(w*.6,0,w*.76,0);rf.addColorStop(0,'rgba(255,220,160,0)');rf.addColorStop(.5,'rgba(255,225,170,.7)');rf.addColorStop(1,'rgba(255,220,160,0)');x.fillStyle=rf;x.fillRect(w*.6,h*.56,w*.16,h*.24)},
  layers:[
    [1.5,2,(x,W,h,r,u)=>{x.fillStyle=vgrad(x,h*.4,h*.58,['#8a6f9e','#5c5585']);ridge(x,W,h,h*.5,waves(r,4*u));x.fill();x.fillStyle='#e9a07a';x.globalAlpha=.25;x.fillRect(0,h*.53,W,h*.03);x.globalAlpha=1}],
    [2,5,(x,W,h,r,u)=>{for(let i=0;i<30;i++){const px=r()*W;rep(W,px,8*u,q=>foliage(x,q,h*rr(r,.54,.57),rr(r,3,6)*u,rng(i+300),['#3a3556','#4e4670','#a87a8a'],.8))}
      for(let i=0;i<5;i++){const px=r()*W;rep(W,px,10*u,q=>{for(let j=0;j<4;j++){const hx=q+j*2.6*u,hy=h*.565;x.fillStyle='#4a3c50';x.fillRect(hx,hy-1.8*u,2.2*u,1.8*u);x.fillStyle='#7a4a4a';x.beginPath();x.moveTo(hx-.4*u,hy-1.8*u);x.lineTo(hx+1.1*u,hy-3*u);x.lineTo(hx+2.6*u,hy-1.8*u);x.fill();x.fillStyle='rgba(255,210,120,.9)';x.fillRect(hx+.8*u,hy-1.2*u,.5*u,.5*u)}})}
      x.fillStyle='#4a4268';x.fillRect(0,h*.565,W,h*.012)}],
    [1,14,(x,W,h,r,u)=>{x.fillStyle=vgrad(x,h*.7,h,['#7a8a4a','#3d4a2a','#1f2618']);ridge(x,W,h,h*.74,waves(r,1*u,[2,3,7,13]));x.fill();
      x.fillStyle=vgrad(x,h*.73,h*.78,['#d2b07a','#9a7a52']);ridge(x,W,h,h*.75,waves(r,.4*u,[3,5]));x.fill();x.fillStyle=vgrad(x,h*.77,h,['#55623a','#1f2618']);x.fillRect(0,h*.78,W,h*.22);
      for(let i=0;i<3;i++){const px=(i+rr(r,.2,.8))*W/3;rep(W,px,60*u,q=>tree(x,q,h*.75,rr(r,40,55)*u,rng(i+400),['#3b3a2a','#6e6a3a','#e0b070'],'#2e2418'))}
      grass(x,W,h*.7,h*.76,200,['#6a7a3a','#a8a050','#f0c070'],r,1.5*u,4*u);
      for(let i=0;i<40;i++){const px=r()*W,py=h*rr(r,.78,.95);rep(W,px,1*u,q=>{x.fillStyle=['#f4d36a','#f19aa0','#ffffff'][i%3];x.beginPath();x.arc(q,py,.4*u,0,TAU);x.fill()})}}],
    [1,26,(x,W,h,r,u)=>{grass(x,W,h*1,h*1.02,140,['#151a10','#232a16','#3a4020'],r,8*u,18*u,2.4);
      for(let i=0;i<14;i++){const px=r()*W;rep(W,px,4*u,q=>{x.fillStyle='#3a2a1a';x.beginPath();x.ellipse(q,h*.99-rr(r,8,16)*u,.5*u,2*u,0,0,TAU);x.fill()})}}]],
  live(c,w,h,t,u){shimmer(c,w,h,t,.6,.79,'255,220,170',60,11);drawParts(c,w,h,t,this.p1||(this.p1=makeParts(25,5)),'mote','255,220,160',[.3,.9])}},

cathedral:{name:'스테인드글라스 회랑',ref:'사진 5',desc:'덩굴이 뒤덮은 고딕 대성당. 스테인드글라스 사이로 햇빛 기둥이 내려옵니다.',
  ground:85,rim:'255,245,210',charAfter:2,
  sky(x,w,h){x.fillStyle=vgrad(x,0,h,['#1a2236','#2c3550','#4a4c5e']);x.fillRect(0,0,w,h)},
  layers:[
    [2,3,(x,W,h,r,u)=>{const step=24*u,n=Math.round(W/step),st=W/n;
      for(let i=0;i<n;i++){const cx=i*st+st/2,ww=7*u,top=h*.1,bot=h*.55;
        x.fillStyle='#232a3c';x.fillRect(i*st,0,3*u,h*.85);
        x.save();x.beginPath();x.moveTo(cx-ww,bot);x.lineTo(cx-ww,top+ww);x.quadraticCurveTo(cx-ww,top,cx,top-ww*.6);x.quadraticCurveTo(cx+ww,top,cx+ww,top+ww);x.lineTo(cx+ww,bot);x.closePath();x.clip();
        const cols=['#3a6fd0','#d04a5a','#e8c25a','#4ab08a','#8a5ad0','#f0e0b0'];
        for(let gy=top-ww;gy<bot;gy+=1.6*u)for(let gx=cx-ww;gx<cx+ww;gx+=1.6*u){x.fillStyle=cols[(r()*cols.length)|0];x.globalAlpha=rr(r,.55,.95);x.fillRect(gx,gy,1.5*u,1.5*u)}
        x.globalAlpha=1;x.fillStyle='rgba(255,250,230,.35)';x.fillRect(cx-ww,top-ww,ww*2,bot);x.restore();
        x.strokeStyle='#151a28';x.lineWidth=.5*u;x.beginPath();x.moveTo(cx,top-ww*.6);x.lineTo(cx,bot);x.moveTo(cx-ww,(top+bot)/2);x.lineTo(cx+ww,(top+bot)/2);x.stroke()}
      // 날개 달린 석상 (한 곳)
      const sx=W*.55,base=h*.85;x.fillStyle=vgrad(x,h*.62,base,['#d8d2bf','#9a9482']);x.fillRect(sx-5*u,h*.7,10*u,base-h*.7);x.fillRect(sx-7*u,h*.68,14*u,2*u);
      x.fillStyle=vgrad(x,h*.3,h*.68,['#f4eedc','#b8b09a']);
      for(const d of[-1,1]){x.beginPath();x.moveTo(sx,h*.44);x.quadraticCurveTo(sx+d*14*u,h*.3,sx+d*18*u,h*.36);x.quadraticCurveTo(sx+d*12*u,h*.42,sx+d*10*u,h*.52);x.quadraticCurveTo(sx+d*5*u,h*.5,sx,h*.5);x.fill()}
      x.beginPath();x.moveTo(sx-2.2*u,h*.44);x.lineTo(sx+2.2*u,h*.44);x.lineTo(sx+4*u,h*.68);x.lineTo(sx-4*u,h*.68);x.fill();x.beginPath();x.arc(sx,h*.415,2*u,0,TAU);x.fill();
      x.fillStyle=vgrad(x,h*.6,h*.85,['rgba(40,45,60,0)','rgba(40,45,60,.6)']);x.fillRect(0,h*.6,W,h*.25)}],
    [1,10,(x,W,h,r,u)=>{const step=34*u,n=Math.max(2,Math.round(W/step)),st=W/n;
      x.fillStyle=vgrad(x,h*.84,h,['#6a6a72','#3a3a44']);x.fillRect(0,h*.84,W,h*.16);
      x.strokeStyle='rgba(20,20,30,.35)';x.lineWidth=1;for(let i=0;i<n*4;i++){const px=i*st/4;x.beginPath();x.moveTo(px,h*.84);x.lineTo(px-(px-W/2)*.15,h);x.stroke()}
      for(const y of[.88,.93]){x.beginPath();x.moveTo(0,h*y);x.lineTo(W,h*y);x.stroke()}
      for(let i=0;i<n;i++){const cx=i*st,cw=5.5*u;
        const g=x.createLinearGradient(cx-cw,0,cx+cw,0);g.addColorStop(0,'#2a2c38');g.addColorStop(.35,'#8a8a90');g.addColorStop(.5,'#c8c4b8');g.addColorStop(1,'#33343f');
        x.fillStyle=g;x.fillRect(cx-cw,0,cw*2,h*.85);x.fillRect(cx-cw*1.4,h*.8,cw*2.8,h*.05);
        x.strokeStyle='#9a978e';x.lineWidth=2.4*u;x.beginPath();x.moveTo(cx+cw,h*.25);x.quadraticCurveTo(cx+st/2,-h*.05,cx+st-cw,h*.25);x.stroke();
        if(r()<.7){x.strokeStyle='#3f6a2a';x.lineWidth=.5*u;const len=rr(r,.25,.6)*h;x.beginPath();x.moveTo(cx+rr(r,-cw,cw),0);x.bezierCurveTo(cx+cw*2,len*.4,cx-cw*2,len*.7,cx+rr(r,-cw,cw),len);x.stroke();
          for(let k=0;k<18;k++){x.fillStyle=['#4f8a2e','#8ccf4a','#2f5a20'][k%3];x.beginPath();x.ellipse(cx+rr(r,-cw*1.6,cw*1.6),rr(r,0,len),.9*u,.5*u,r()*3,0,TAU);x.fill()}}
        foliage(x,cx+rr(r,-3,3)*u,h*.82,rr(r,4,7)*u,rng(i+500),['#2f5a20','#5a9a30','#b8ec6a'])}}],
    [1,22,(x,W,h,r,u)=>{for(let i=0;i<3;i++){const px=r()*W;rep(W,px,20*u,q=>{x.fillStyle='#2a1c14';x.fillRect(q,h*.94,26*u,6*u);x.fillStyle='#4a3424';x.fillRect(q,h*.93,26*u,1.2*u)})}
      for(let i=0;i<5;i++){const px=r()*W;rep(W,px,12*u,q=>foliage(x,q,h*1.02,rr(r,6,10)*u,rng(i+600),['#1f3f16','#3f7a24','#9fe050'],1.2))}}]],
  live(c,w,h,t,u){rays(c,w,h,t,[[.08,0,.05,.45,.45],[.32,0,.06,.45,.4],[.58,0,.05,.45,.35],[.82,0,.04,.45,.3]],'255,248,215');drawParts(c,w,h,t,this.p1||(this.p1=makeParts(50,6)),'mote','255,245,210');drawParts(c,w,h,t,this.p2||(this.p2=makeParts(8,7)),'petal','255,255,255')}},

worldtree:{name:'계단 논 평원',ref:'사진 1',desc:'구름 위까지 솟은 거대한 나무와 계단식 논밭이 펼쳐진 평원. 언덕길에서 내려다봅니다.',
  ground:84,rim:'255,250,220',charAfter:6,
  sky(x,w,h){x.fillStyle=vgrad(x,0,h*.6,['#245ea8','#4f8fd0','#a6d4ef']);x.fillRect(0,0,w,h*.65)},
  layers:[
    [1.5,1.5,(x,W,h,r,u)=>{for(let i=0;i<7;i++){const px=r()*W;rep(W,px,30*u,q=>cloud(x,q,rr(r,25,48)*u,rr(r,9,16)*u,rng(i+700),'#ffffff','#9db4cf'))}}],
    [2,3,(x,W,h,r,u)=>{const r2=rng(77);x.fillStyle=vgrad(x,h*.3,h*.62,['#7fa6bf','#5a8a7a']);ridge(x,W,h,h*.48,waves(r2,8*u,[1,2,3,4,7,13,27,53]));x.fill();
      x.fillStyle=vgrad(x,h*.38,h*.64,['#3f7a4a','#2c5a36']);ridge(x,W,h,h*.56,waves(r2,6*u,[1,2,3,5,9,19,41,83]));x.fill();x.save();x.clip();streaks(x,W,h*.4,h*.62,r,300,['#a8d080','#1e3a26'],1,3,.35);x.restore();
      x.fillStyle='rgba(255,255,255,.55)';for(let i=0;i<8;i++){const px=r()*W;rep(W,px,15*u,q=>{x.beginPath();x.ellipse(q,h*.6,rr(r,8,16)*u,1.2*u,0,0,TAU);x.fill()})}}],
    [1.5,5,(x,W,h,r,u)=>{
      x.fillStyle='#3f6a2a';x.fillRect(0,h*.6,W,h*.3);
      let y=h*.6;const cols=['#6fae3a','#8cc24a','#5a9a32','#a6d25a','#7fbf6a','#9cc9a0','#b8dca0'];
      while(y<h*.9){const d=(y/h-.58)/.32,rh=(.5+d*5)*u;let px=-r()*10*u;while(px<W){const pw=rr(r,5,18)*u*(.4+d);
        const g=x.createLinearGradient(0,y,0,y+rh);const c0=cols[(r()*cols.length)|0];g.addColorStop(0,c0);g.addColorStop(1,'#4f8a2e');x.fillStyle=g;
        x.beginPath();x.moveTo(px,y+rh);x.lineTo(px+pw*.08,y);x.lineTo(px+pw*.92,y);x.lineTo(px+pw,y+rh);x.fill();
        x.fillStyle='rgba(235,255,210,.4)';x.fillRect(px+pw*.08,y,pw*.84,Math.max(.6,.15*u));px+=pw+(.15+d*.25)*u}y+=rh+(.1+d*.2)*u}
      x.strokeStyle='rgba(205,232,255,.85)';x.lineWidth=.7*u;x.beginPath();x.moveTo(0,h*.8);for(let p=0;p<=W;p+=4)x.lineTo(p,h*.8+Math.sin(TAU*3*p/W)*3*u+Math.sin(TAU*7*p/W)*u);x.stroke();
      for(let i=0;i<10;i++){const px=r()*W,py=h*rr(r,.64,.78);rep(W,px,8*u,q=>{for(let j=0;j<6;j++){const hx=q+rr(r,-4,4)*u,hy=py+rr(r,-1,1)*u;x.fillStyle='#5a3a2a';x.fillRect(hx,hy-.8*u,1.4*u,.8*u);x.fillStyle='#8a4a3a';x.fillRect(hx-.2*u,hy-1.2*u,1.8*u,.5*u)}})}
      for(let i=0;i<14;i++){const px=r()*W;rep(W,px,6*u,q=>foliage(x,q,h*rr(r,.62,.8),rr(r,1.5,3)*u,rng(i+870),['#2a5a22','#3f7a2e','#8cc24a'],.6))}}],
    [1,0,(x,W,h,r,u)=>{
      // 세계수
      const tx=W*.64,gy=h*.68;
      const g=x.createLinearGradient(tx-14*u,0,tx+14*u,0);g.addColorStop(0,'#1e2a1c');g.addColorStop(.35,'#4a5a3a');g.addColorStop(.5,'#7a8a5a');g.addColorStop(1,'#1a2418');
      x.fillStyle=g;x.beginPath();x.moveTo(tx-26*u,gy);x.quadraticCurveTo(tx-12*u,gy-8*u,tx-10*u,gy-25*u);x.lineTo(tx-8*u,-5);x.lineTo(tx+9*u,-5);x.lineTo(tx+11*u,gy-25*u);x.quadraticCurveTo(tx+13*u,gy-8*u,tx+28*u,gy);x.fill();
      x.save();x.clip();streaks(x,W,0,gy,r,220,['#2a3a22','#9ab070','#3a5a2a'],.6,2.4,.5);x.restore();
      for(let i=0;i<18;i++)foliage(x,tx+rr(r,-12,12)*u,rr(r,30,66)*u,rr(r,2,4)*u,rng(i+800),['#2a4a22','#4a7a32','#9ac860'],.6);
      x.fillStyle='rgba(255,255,255,.85)';for(let i=0;i<14;i++){x.beginPath();x.ellipse(tx+rr(r,-24,24)*u,h*.32+rr(r,-1.5,1.5)*u,rr(r,5,10)*u,1.4*u,0,0,TAU);x.fill()}
      for(let i=0;i<12;i++)foliage(x,tx+rr(r,-30,30)*u,rr(r,-4,8)*u,rr(r,8,14)*u,rng(i+850),['#1c3a1c','#2f5a26','#6f9a4a'])}],
    [1,12,(x,W,h,r,u)=>{x.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<6;i++){const px=r()*W;rep(W,px,20*u,q=>{x.beginPath();x.ellipse(q,h*.75,rr(r,10,20)*u,1.8*u,0,0,TAU);x.fill()})}}],
    [1,22,(x,W,h,r,u)=>{x.fillStyle=vgrad(x,h*.8,h,['#3f7a2e','#1f3a18']);ridge(x,W,h,h*.85,waves(r,1.5*u,[1,2,3,7]));x.fill();
      x.fillStyle='#c8b080';ridge(x,W,h,h*.855,waves(r,.3*u,[2,5]));x.save();x.clip();x.fillRect(0,0,W,h*.88);x.restore();
      x.fillStyle=vgrad(x,h*.87,h,['#3f7a2e','#16300f']);x.fillRect(0,h*.875,W,h);
      grass(x,W,h*.83,h*.87,220,['#4f8a2e','#8cc24a','#c8ec7a'],r,1.5*u,4*u);
      for(let i=0;i<6;i++){const px=r()*W;rep(W,px,14*u,q=>foliage(x,q,h*rr(r,.95,1.02),rr(r,6,10)*u,rng(i+900),['#16300f','#2f5a1e','#7fb84a'],1.1))}}]],
  live(c,w,h,t,u){c.strokeStyle='rgba(30,40,60,.7)';c.lineWidth=.35*u;for(let i=0;i<5;i++){const x=mod(w*1.2-t*(10+i*2)-i*12*u,w*1.4)-w*.2,y=h*(.18+i*.03)+Math.sin(t+i)*u,f=Math.sin(t*6+i)*.8*u;c.beginPath();c.moveTo(x-1.4*u,y-f);c.quadraticCurveTo(x-.6*u,y-.6*u,x,y);c.quadraticCurveTo(x+.6*u,y-.6*u,x+1.4*u,y-f);c.stroke()}
    drawParts(c,w,h,t,this.p1||(this.p1=makeParts(15,8)),'mote','255,255,230',[.4,.9])}},

canyon:{name:'달빛 협곡',ref:'사진 3',desc:'협곡 깊은 곳에서 홀로 빛나는 하얀 나무와 꽃밭. 푸른 빛 알갱이가 떠오릅니다.',
  ground:81,rim:'170,230,255',charAfter:2,
  sky(x,w,h){x.fillStyle=vgrad(x,0,h*.5,['#0b1240','#2a3f8f','#5a7ac8']);x.fillRect(0,0,w,h);
    const r=rng(12);for(let i=0;i<70;i++){x.fillStyle=`rgba(255,255,255,${rr(r,.3,.9)})`;x.beginPath();x.arc(r()*w,r()*h*.3,rr(r,.4,1.2),0,TAU);x.fill()}
    const g=x.createRadialGradient(w*.5,0,0,w*.5,0,h*.6);g.addColorStop(0,'rgba(200,220,255,.5)');g.addColorStop(1,'rgba(200,220,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h)},
  layers:[
    [1.5,2,(x,W,h,r,u)=>{x.fillStyle=vgrad(x,h*.15,h*.8,['#b9d6f4','#6f93d0','#2a3f7f']);ridge(x,W,h,h*.3,waves(r,9*u,[1,2,3,6,13,29,61]));x.fill();
      x.save();x.clip();streaks(x,W,h*.15,h*.8,r,350,['#e4f0ff','#3a5590','#8fb0e0'],1.5,5,.22);x.restore();
      x.fillStyle=vgrad(x,0,h*.25,['#05081a','#101a3a']);ridge(x,W,h,h*.06,waves(r,5*u,[2,3,5,9,19]),true);x.fill()}],
    [1,0,(x,W,h,r,u)=>{x.fillStyle=vgrad(x,h*.66,h*.82,['#4a6aa8','#2a3a6a']);x.fillRect(0,h*.7,W,h*.3);
      const tx=W*.64,gy=h*.74;x.save();x.shadowColor='rgba(220,240,255,.9)';x.shadowBlur=30*u;x.fillStyle='rgba(232,244,255,.8)';for(let i=0;i<14;i++){const a=r()*TAU,d=Math.sqrt(r());x.beginPath();x.ellipse(tx+Math.cos(a)*d*18*u,gy-22*u+Math.sin(a)*d*8*u,rr(r,6,11)*u,rr(r,4,7)*u,0,0,TAU);x.fill()}x.restore();
      x.strokeStyle='#4a3a6a';x.lineCap='round';
      const br=(px,py,len,ang,wd,d)=>{const ex=px+Math.cos(ang)*len,ey=py+Math.sin(ang)*len;x.lineWidth=wd;x.beginPath();x.moveTo(px,py);x.lineTo(ex,ey);x.stroke();if(d)for(const s of[-1,1])br(ex,ey,len*.72,ang+s*rr(r,.4,.7),wd*.65,d-1)};
      br(tx,gy,9*u,-Math.PI/2,3*u,4);
      for(let i=0;i<260;i++){const a=r()*TAU,d=Math.sqrt(r());const bx=tx+Math.cos(a)*d*27*u,by=gy-22*u+Math.sin(a)*d*14*u,s=rr(r,.8,2.8)*u;x.fillStyle=`rgba(${r()<.3?'200,225,255':'255,255,255'},${rr(r,.5,.95)})`;x.beginPath();x.arc(bx,by,s,0,TAU);x.fill()}
      for(let i=0;i<500;i++){const px=r()*W,py=h*rr(r,.71,.82),s=rr(r,.2,.6)*u;rep(W,px,1*u,q=>{x.fillStyle=['#dfe9ff','#b8c8ff','#f0b8e0','#a0e8ff'][i%4];x.globalAlpha=rr(r,.5,1);x.beginPath();x.arc(q,py,s,0,TAU);x.fill()})}x.globalAlpha=1}],
    [1,16,(x,W,h,r,u)=>{x.fillStyle=vgrad(x,h*.8,h,['#3a4a8a','#1a2050']);x.fillRect(0,h*.8,W,h*.2);
      const cols=['#ffffff','#e6d8ff','#f7a8d8','#c8a8ff','#9ad8ff','#ffd0a0'];
      for(let i=0;i<900;i++){const py=h*rr(r,.79,1.02),depth=(py/h-.78)/.24,px=r()*W,s=(.3+depth*1.4)*u*rr(r,.6,1.2);
        rep(W,px,3*u,q=>{x.fillStyle=cols[(r()*cols.length)|0];x.globalAlpha=.5+depth*.5;x.beginPath();x.ellipse(q,py,s,s*.7,r()*3,0,TAU);x.fill()})}x.globalAlpha=1}]],
  live(c,w,h,t,u){drawParts(c,w,h,t,this.p1||(this.p1=makeParts(55,9)),'firefly','140,230,255',[.2,.95]);drawParts(c,w,h,t,this.p2||(this.p2=makeParts(14,10)),'petal','240,230,255')}}
};
/* ───────── 전경 소품: 이 층만 빠르게 흘러가서 걷는 느낌을 냄 ───────── */
function blossom(x,px,py,s,petal,center,r,n=5){
  for(let i=0;i<n;i++){const a=i/n*TAU+r()*.4;x.fillStyle=petal;x.beginPath();x.ellipse(px+Math.cos(a)*s*.5,py+Math.sin(a)*s*.32,s*.52,s*.28,a,0,TAU);x.fill();
    x.fillStyle='rgba(255,255,255,.22)';x.beginPath();x.ellipse(px+Math.cos(a)*s*.35,py+Math.sin(a)*s*.22,s*.3,s*.14,a,0,TAU);x.fill()}
  x.fillStyle=center;x.beginPath();x.arc(px,py,s*.16,0,TAU);x.fill();
}
function tulip(x,px,py,s,col,r){
  x.strokeStyle='#3f6a2a';x.lineWidth=s*.12;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+s*.2,py+s*1.2,px-s*.1,py+s*2.6);x.stroke();
  x.fillStyle='#4f8a32';x.beginPath();x.ellipse(px+s*.45,py+s*1.6,s*.18,s*.75,.5,0,TAU);x.fill();
  for(const[a,dx,l]of[[-.35,-.28,.85],[.35,.28,.85],[0,0,1]]){x.fillStyle=l===1?col:'rgba(0,0,0,.15)';x.beginPath();x.ellipse(px+dx*s,py-s*.45,s*.32,s*.62,a,0,TAU);x.fill();x.fillStyle=col;x.globalAlpha=l;x.beginPath();x.ellipse(px+dx*s,py-s*.45,s*.3,s*.6,a,0,TAU);x.fill();x.globalAlpha=1}
  x.fillStyle='rgba(255,255,255,.3)';x.beginPath();x.ellipse(px-s*.08,py-s*.7,s*.08,s*.3,0,0,TAU);x.fill();
}
function rock(x,px,py,s,r,dark,light){
  const n=8,pts=[];for(let i=0;i<n;i++){const a=Math.PI+i/(n-1)*Math.PI,k=rr(r,.75,1.1);pts.push([px+Math.cos(a)*s*k*1.3,py+Math.sin(a)*s*k*.8])}
  const g=x.createLinearGradient(px-s,py-s,px+s*.6,py);g.addColorStop(0,light);g.addColorStop(1,dark);x.fillStyle=g;
  x.beginPath();x.moveTo(px-s*1.35,py);pts.forEach(([a,b])=>x.lineTo(a,b));x.lineTo(px+s*1.35,py);x.closePath();x.fill();
  x.fillStyle='rgba(0,0,0,.25)';x.beginPath();x.ellipse(px,py,s*1.4,s*.2,0,0,TAU);x.fill();
}
// o: {y0, grass:{n,cols,h:[min,max]}, rocks:{n,s:[a,b],dark,light}, bush:{n,pal,s:[a,b]}, flowers:{n,type,cols,center,s:[a,b]}, fern:{n,col}}
const fg=(mul,speed,o,blur=0)=>[mul,speed,(x,W,h,r,u)=>{
  const items=[];
  const add=(n,f)=>{for(let i=0;i<n;i++){const py=h*rr(r,o.y0,1.03);items.push([py,f(r()*W,py,(py/h-o.y0)/(1.03-o.y0),rng((r()*1e9)|0))])}};
  if(o.rocks)add(o.rocks.n,(px,py,d,q)=>()=>rock(x,px,py,rr(q,...o.rocks.s)*u*(.5+d),q,o.rocks.dark,o.rocks.light));
  if(o.bush)add(o.bush.n,(px,py,d,q)=>()=>foliage(x,px,py,rr(q,...o.bush.s)*u*(.5+d),q,o.bush.pal,1.1));
  if(o.fern)add(o.fern.n,(px,py,d,q)=>()=>{const L=rr(q,8,16)*u*(.5+d);x.strokeStyle=o.fern.col;x.fillStyle=o.fern.col;x.lineWidth=.4*u;for(let k=0;k<5;k++){const a=-Math.PI/2+(k-2)*.45;x.beginPath();x.moveTo(px,py);const ex=px+Math.cos(a)*L,ey=py+Math.sin(a)*L*.8;x.quadraticCurveTo(px+Math.cos(a)*L*.4,py-L*.6,ex,ey);x.stroke();for(let j=1;j<8;j++){const t=j/8,lx=px+(ex-px)*t,ly=py+(ey-py)*t-Math.sin(t*Math.PI)*L*.15;x.beginPath();x.ellipse(lx,ly,L*.08*(1-t*.5),L*.025,a+1.2,0,TAU);x.fill()}}});
  if(o.flowers)add(o.flowers.n,(px,py,d,q)=>()=>{const sz=rr(q,...o.flowers.s)*u*(.35+d),col=o.flowers.cols[(q()*o.flowers.cols.length)|0];
    if(o.flowers.type==='tulip')tulip(x,px,py,sz,col,q);
    else{x.strokeStyle='#2f5a22';x.lineWidth=sz*.1;x.beginPath();x.moveTo(px,py);x.lineTo(px+sz*.2,py+sz*2);x.stroke();blossom(x,px,py,sz,col,o.flowers.center,q)}});
  items.sort((a,b)=>a[0]-b[0]);
  if(o.grass)grass(x,W,h*o.y0,h*1.03,o.grass.n,o.grass.cols,r,o.grass.h[0]*u,o.grass.h[1]*u,o.grass.lw||1.6);
  for(const[,f]of items)f();
},blur];
function birds(c,w,h,t,u,col,n=5){c.strokeStyle=col;c.lineWidth=.35*u;for(let i=0;i<n;i++){const x=mod(w*1.2-t*(10+i*2)-i*12*u,w*1.4)-w*.2,y=h*(.15+i*.035)+Math.sin(t+i)*u,f=Math.sin(t*6+i)*.8*u;c.beginPath();c.moveTo(x-1.4*u,y-f);c.quadraticCurveTo(x-.6*u,y-.6*u,x,y);c.quadraticCurveTo(x+.6*u,y-.6*u,x+1.4*u,y-f);c.stroke()}}
const IMG={};
const P=(o)=>({charAfter:0,...o});
const GRASS_DARK=['#13200f','#1f3318','#2c4620'];
const PHOTO={
ruins:P({img:'ruins',name:'고대 유적 계곡',ref:'새 사진 1',desc:'거대한 고리 유적이 서 있는 계곡. 앞쪽 바위와 단풍 덤불이 지나갑니다.',fy:.5,hx:.36,ground:80,scale:.55,rim:'255,230,170',
  layers:[fg(1,10,{y0:.82,grass:{n:160,cols:['#5a6a2a','#8a8a3a','#b0963a'],h:[1.5,4]},rocks:{n:5,s:[2,4],dark:'#4a4a48',light:'#a8a296'}}),
          fg(1,26,{y0:.92,rocks:{n:3,s:[5,9],dark:'#3a3a3a',light:'#8f8a80'},bush:{n:6,s:[5,9],pal:['#6a2a14','#b5521e','#e8a040']},grass:{n:90,cols:GRASS_DARK,h:[5,12]}},2)],
  live(c,w,h,t,u){birds(c,w,h,t,u,'rgba(60,50,40,.7)');drawParts(c,w,h,t,this.p1||(this.p1=makeParts(18,21)),'mote','255,240,190',[.3,.9])}}),
'violet-tree':P({img:'violet-tree',name:'보랏빛 세계수',ref:'새 사진 2',desc:'등나무처럼 늘어진 빛나는 나무 아래 꽃밭. 푸른 빛 알갱이가 떠오릅니다.',fy:.5,hx:.42,ground:89,scale:.55,rim:'170,230,255',
  layers:[fg(1,10,{y0:.86,flowers:{n:70,cols:['#c9a8ff','#ffffff','#a68cf0','#e6d0ff'],center:'#fff6c0',s:[.6,1.4]},grass:{n:140,cols:['#2a1f4a','#3e2f6a','#5a4a8a'],h:[1.5,4]}}),
          fg(1,24,{y0:.94,flowers:{n:10,cols:['#e8e0ff','#b8a0f0'],center:'#ffffff',s:[3,5]},grass:{n:80,cols:['#120c24','#1f1638','#2c2050'],h:[6,14]}},2)],
  live(c,w,h,t,u){drawParts(c,w,h,t,this.p1||(this.p1=makeParts(50,22)),'firefly','160,235,255',[.15,.95]);drawParts(c,w,h,t,this.p2||(this.p2=makeParts(14,23)),'petal','230,215,255')}}),
crystal:P({img:'crystal',name:'수정 분화구',ref:'새 사진 3',desc:'푸른 수정이 솟은 분화구 가장자리 초원. 바람에 풀이 눕고 지나갑니다.',fy:.6,hx:.3,ground:90,scale:.7,rim:'200,240,255',
  layers:[fg(1,10,{y0:.88,grass:{n:220,cols:['#5aa02a','#7fc23a','#a6dc5a'],h:[1.5,4]},rocks:{n:3,s:[1.5,3],dark:'#5a5a50',light:'#c8c4b0'}}),
          fg(1,26,{y0:.95,grass:{n:110,cols:['#2f6a1a','#4a8a26','#6fae3a'],h:[6,13]}},2)],
  live(c,w,h,t,u){drawParts(c,w,h,t,this.p1||(this.p1=makeParts(12,24)),'mote','220,250,255',[.2,.8])}}),
'light-pass':P({img:'light-pass',name:'빛의 협곡길',ref:'새 사진 4',desc:'검은 절벽 사이로 연둣빛 햇살이 고인 길. 하얀 깃털이 흩날립니다.',fy:.5,hx:.5,ground:83,scale:.65,rim:'230,255,150',
  layers:[fg(1,10,{y0:.84,grass:{n:180,cols:['#9ac828','#c8ec4a','#6a9a1a'],h:[1.5,4]},rocks:{n:4,s:[2,4],dark:'#20262a',light:'#5a6268'}}),
          fg(1,26,{y0:.93,rocks:{n:2,s:[6,10],dark:'#0e1214',light:'#2a3034'},grass:{n:100,cols:['#0a0f08','#131c0c','#1c2a10'],h:[6,16]}},2.5)],
  live(c,w,h,t,u){drawParts(c,w,h,t,this.p1||(this.p1=makeParts(16,25)),'petal','255,255,255');drawParts(c,w,h,t,this.p2||(this.p2=makeParts(20,26)),'mote','230,255,170',[.4,.95])}}),
'flower-cave':P({img:'flower-cave',name:'꽃의 동굴',ref:'새 사진 5',desc:'폭포가 흐르는 동굴 속 꽃밭. 앞쪽 튤립과 백합 사이를 지나갑니다.',fy:.5,hx:.4,ground:74,scale:.55,rim:'255,230,200',
  layers:[fg(1,10,{y0:.8,flowers:{n:90,cols:['#ff6fa0','#ffffff','#5a7aff','#c060e0'],center:'#ffe080',s:[.5,1.2]},grass:{n:120,cols:['#3a6a2a','#5a8a3a'],h:[1,3]}}),
          fg(1,24,{y0:.9,flowers:{n:14,type:'tulip',cols:['#ff5f8a','#ff8fb0','#f0405a','#ffffff'],s:[2.5,4.5]}},1.5)],
  live(c,w,h,t,u){drawParts(c,w,h,t,this.p1||(this.p1=makeParts(40,27)),'mote','255,235,180',[.1,.8])}}),
'blue-hill':P({img:'blue-hill',name:'푸른 꽃 언덕',ref:'새 사진 6',desc:'설산 아래 푸른 꽃이 끝없이 핀 언덕. 바람에 꽃잎이 날립니다.',fy:.5,hx:.6,ground:72,scale:.5,rim:'220,235,255',
  layers:[fg(1,9,{y0:.8,flowers:{n:110,cols:['#6f9aff','#a8c4ff','#4a6ae0','#ffffff'],center:'#2a3a80',s:[.5,1.1]},grass:{n:120,cols:['#2a4a6a','#3a6a5a'],h:[1,3]}}),
          fg(1,24,{y0:.9,flowers:{n:12,cols:['#5a86f0','#7aa0ff','#3a5ad0'],center:'#1a2050',s:[3,5.5]},grass:{n:70,cols:['#0f2418','#1a3a24','#2a5030'],h:[6,14]}},2)],
  live(c,w,h,t,u){drawParts(c,w,h,t,this.p1||(this.p1=makeParts(22,28)),'petal','170,200,255')}}),
'blossom-tree':P({img:'blossom-tree',name:'보라 꽃나무 그늘',ref:'새 사진 7',desc:'보랏빛 꽃이 핀 큰 나무 그늘 아래 풀밭. 하얀 꽃잎이 떨어집니다.',fy:.5,hx:.3,ground:84,scale:.65,rim:'255,245,220',
  layers:[fg(1,10,{y0:.84,flowers:{n:40,cols:['#e070c0','#ff9ad8','#ffffff'],center:'#ffe0a0',s:[.5,1]},grass:{n:200,cols:['#6aa03a','#9ac84a','#4a7a2a'],h:[1.5,4]},rocks:{n:3,s:[1.5,3],dark:'#6a6a60',light:'#d0ccc0'}}),
          fg(1,26,{y0:.93,grass:{n:110,cols:['#1f4018','#2f5a22','#477a30'],h:[6,14]}},2)],
  live(c,w,h,t,u){drawParts(c,w,h,t,this.p1||(this.p1=makeParts(26,29)),'petal','255,255,255')}}),
'forest-path':P({img:'forest-path',name:'숲속 오솔길',ref:'새 사진 8',desc:'빛이 스며드는 깊은 숲길. 앞쪽 붉은 덤불과 꽃이 스쳐 지나갑니다.',fy:.5,hx:.48,ground:70,scale:.45,rim:'255,250,210',
  layers:[fg(1,10,{y0:.82,flowers:{n:40,cols:['#ff8fb0','#ffffff','#c070ff'],center:'#ffe080',s:[.5,1]},grass:{n:160,cols:['#4a8a2a','#6fae3a','#9ad25a'],h:[1.5,4]}}),
          fg(1,24,{y0:.88,bush:{n:7,s:[6,11],pal:['#123a1a','#2a6a2a','#7fc25a']},fern:{n:5,col:'#1a4a24'}},2)],
  live(c,w,h,t,u){drawParts(c,w,h,t,this.p1||(this.p1=makeParts(30,30)),'mote','255,250,200',[.1,.8])}}),
'elf-castle':P({img:'elf-castle',name:'숲의 엘프 성',ref:'새 사진 9',desc:'거목 사이에 지어진 하얀 성. 붉은 새들이 날아다닙니다.',fy:.5,hx:.38,ground:88,scale:.55,rim:'210,255,230',
  layers:[fg(1,10,{y0:.85,grass:{n:180,cols:['#3a7a3a','#5aa04a','#8ac86a'],h:[1.5,4]},rocks:{n:3,s:[1.5,3],dark:'#3a4a40',light:'#9aaa98'}}),
          fg(1,24,{y0:.92,fern:{n:7,col:'#174a2a'},bush:{n:4,s:[5,9],pal:['#0f2a1a','#235a32','#6aae6a']}},2)],
  live(c,w,h,t,u){drawParts(c,w,h,t,this.p1||(this.p1=makeParts(8,31)),'petal','230,60,80');drawParts(c,w,h,t,this.p2||(this.p2=makeParts(25,32)),'mote','220,255,230',[.2,.9])}}),
'world-tree':P({img:'world-tree',name:'세계수 평원',ref:'사진 1',desc:'구름을 뚫고 솟은 세계수와 논밭. 앞쪽 풀숲 사이 언덕길을 걷습니다.',fy:.5,hx:.28,ground:92,scale:.55,rim:'255,250,220',
  layers:[fg(1,10,{y0:.9,grass:{n:200,cols:['#3f7a2e','#6fae3a','#a6d25a'],h:[1.5,4]}}),
          fg(1,24,{y0:.95,bush:{n:5,s:[5,9],pal:['#16300f','#2f5a1e','#7fb84a']},grass:{n:90,cols:GRASS_DARK,h:[5,12]}},2)],
  live(c,w,h,t,u){birds(c,w,h,t,u,'rgba(40,50,70,.6)')}}),
'firefly-creek':P({img:'firefly-creek',name:'반딧불 개울',ref:'사진 2',desc:'빛나는 클로버가 핀 숲속 개울. 반딧불이 떠다닙니다.',fy:.62,hx:.4,ground:86,scale:.6,rim:'210,255,120',
  layers:[fg(1,10,{y0:.88,rocks:{n:6,s:[1.5,3],dark:'#2a2a22',light:'#6a6a58'},grass:{n:80,cols:['#4a8a1a','#8ac83a'],h:[1,3]}}),
          fg(1,22,{y0:.93,grass:{n:60,cols:['#0f1a0a','#1a2a10'],h:[6,12]}},2)],
  live(c,w,h,t,u){drawParts(c,w,h,t,this.p1||(this.p1=makeParts(45,33)),'firefly','255,200,80',[.1,.9])}}),
'white-tree':P({img:'white-tree',name:'달빛 하얀 나무',ref:'사진 3',desc:'협곡 깊은 곳의 하얀 빛나무와 꽃밭. 꽃잎과 푸른 빛이 흩날립니다.',fy:.66,hx:.32,ground:86,scale:.6,rim:'170,230,255',
  layers:[fg(1,10,{y0:.86,flowers:{n:90,cols:['#ffffff','#f0b8e0','#b8c8ff','#a0e8ff'],center:'#fff0b0',s:[.5,1.1]}}),
          fg(1,24,{y0:.93,flowers:{n:10,cols:['#e070c0','#8a6ae0','#ffffff'],center:'#ffe0a0',s:[3,5]},grass:{n:60,cols:['#141838','#22285a'],h:[5,12]}},2)],
  live(c,w,h,t,u){drawParts(c,w,h,t,this.p1||(this.p1=makeParts(50,34)),'firefly','140,230,255',[.2,.95]);drawParts(c,w,h,t,this.p2||(this.p2=makeParts(14,35)),'petal','240,230,255')}}),
'sun-forest':P({img:'sun-forest',name:'햇살 숲',ref:'사진 4',desc:'연두빛 햇살이 쏟아지는 숲속 빈터. 금빛 먼지가 반짝입니다.',fy:.5,hx:.3,ground:82,scale:.6,rim:'240,255,170',
  layers:[fg(1,10,{y0:.84,grass:{n:180,cols:['#7ab82a','#a6dc4a','#5a9020'],h:[1.5,4]}}),
          fg(1,24,{y0:.9,bush:{n:6,s:[6,10],pal:['#143a14','#2f6a22','#a6e04a']}},2.5)],
  live(c,w,h,t,u){drawParts(c,w,h,t,this.p1||(this.p1=makeParts(40,36)),'mote','255,250,180',[.1,.9])}}),
'cathedral-photo':P({img:'cathedral',name:'버려진 대성당',ref:'사진 5',desc:'덩굴이 감싼 고딕 성당과 천사상. 빛줄기 속 먼지가 떠다닙니다.',fy:.55,hx:.28,ground:93,scale:.55,rim:'255,245,210',
  layers:[fg(1,12,{y0:.92,bush:{n:5,s:[2,4],pal:['#2f5a20','#5a9a30','#b8ec6a']}}),
          fg(1,26,{y0:.95,bush:{n:5,s:[5,9],pal:['#13260e','#2a5a1c','#7fbf40']},fern:{n:3,col:'#1f4a1a'}},2)],
  live(c,w,h,t,u){drawParts(c,w,h,t,this.p1||(this.p1=makeParts(45,37)),'mote','255,245,210',[.1,.9])}}),
};
PHOTO.tavern=P({img:'tavern',name:'모험가의 쉼터',ref:'주점 사진',desc:'모든 모험가가 처음 머무는 주점. 벽난로 불빛이 일렁입니다.',fy:.62,hx:.58,ground:90,scale:.5,rim:'255,190,120',idle:true,layers:[],
  live(c,w,h,t,u){c.fillStyle=`rgba(255,140,40,${.05+.03*Math.sin(t*7)*Math.sin(t*2.3)})`;c.fillRect(0,0,w,h);drawParts(c,w,h,t,this.p1||(this.p1=makeParts(30,38)),'mote','255,190,110',[.2,.95])}});
Object.assign(SCENES,PHOTO);
// 지도 위 위치 (지도 그림 기준 가로·세로 비율)
const MAP={tavern:[.38,.44],ruins:[.2,.72],'violet-tree':[.55,.06],crystal:[.57,.21],'light-pass':[.3,.1],'flower-cave':[.86,.68],'blue-hill':[.33,.34],'blossom-tree':[.78,.16],
  'forest-path':[.56,.33],'elf-castle':[.5,.87],'world-tree':[.1,.6],'firefly-creek':[.18,.42],'white-tree':[.68,.65],'sun-forest':[.12,.86],'cathedral-photo':[.07,.27],
  river:[.08,.73],canyon:[.74,.55],forest:[.62,.95],creek:[.84,.88],cathedral:[.88,.4],worldtree:[.48,.63]};

function cover(c,img,w,h,t,fy){
  if(!img||!img.complete||!img.naturalWidth){c.fillStyle='#111';c.fillRect(0,0,w,h);return}
  const z=1.07+.02*Math.sin(t/23),s=Math.max(w/img.naturalWidth,h/img.naturalHeight)*z,dw=img.naturalWidth*s,dh=img.naturalHeight*s;
  c.drawImage(img,(w-dw)/2+Math.sin(t/31)*w*.01,(h-dh)*fy,dw,dh);
}

const ORDER=['tavern','ruins','violet-tree','crystal','light-pass','flower-cave','blue-hill','blossom-tree','forest-path','elf-castle','world-tree','firefly-creek','white-tree','sun-forest','cathedral-photo','river','canyon','forest','creek','cathedral','worldtree'];   // 15분마다 다음 장소
const STAY=15, LOOP=STAY*ORDER.length;

/* ───────── 장소를 캔버스 조각으로 미리 그리기 ───────── */
function build(id,w,h){
  const S=SCENES[id],u=h/100;
  let sky=null;if(S.sky){let sx;[sky,sx]=mk(w,h);S.sky(sx,w,h)}
  const layers=S.layers.map(([mul,speed,fn,blur],i)=>{const W=Math.ceil(w*mul),M=Math.ceil(Math.min(W/2,70*u));
    const [big,bx]=mk(W+2*M,h);bx.translate(M,0);fn(bx,W,h,rng(i*131+id.length*17),u);
    const [c,x]=mk(W,h),d=DPR;
    if(blur)x.filter=`blur(${blur}px)`;   // 흐림은 마지막에 한 번만 (그릴 때마다 하면 매우 느림)
    x.drawImage(big,M*d,0,W*d,h*d,0,0,W,h);
    if(speed){x.drawImage(big,0,0,M*d,h*d,W-M,0,M,h);x.drawImage(big,(W+M)*d,0,M*d,h*d,0,0,M,h)}
    big.width=big.height=0;   // 임시 캔버스 즉시 해제 (아이패드는 캔버스 메모리 한도가 작음)
    return{c,W,speed}});
  return{id,S,sky,layers,w,h};
}
function free(B){if(!B)return;B.layers.forEach(L=>L.c.width=L.c.height=0);if(B.sky)B.sky.width=B.sky.height=0}
function draw(c,B,t,alpha=1){
  const{w,h,S}=B,u=h/100;c.save();c.globalAlpha=alpha;
  if(S.img)cover(c,IMG[S.img],w,h,t,S.fy??.5);else c.drawImage(B.sky,0,0,w,h);
  const H=()=>hero(c,w*(S.hx??.3),h*S.ground/100,u*(S.scale??1),S.idle?0:t,S.rim);
  if(!S.charAfter)H();
  B.layers.forEach((L,i)=>{const off=mod(t*L.speed*u*.6,L.W);c.drawImage(L.c,-off,0,L.W,h);if(L.W-off<w)c.drawImage(L.c,L.W-off,0,L.W,h);
    if(i===S.charAfter-1)H()});
  S.live.call(S,c,w,h,t,u);
  c.restore();
}


function start(cv,getStory,isPaused,onArrive,from='tavern'){
  const i0=Math.max(0,ORDER.indexOf(from));
  for(const S of Object.values(PHOTO))if(!IMG[S.img]){const im=new Image();im.src='img/isekai/'+S.img+'.jpg?v=5';IMG[S.img]=im}
  const ctx=cv.getContext('2d'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W0=0,H0=0,cache={},cur=null,prev=null,fadeAt=0,t=0,last=performance.now(),raf;
  const size=()=>{const r=cv.getBoundingClientRect();W0=r.width;H0=r.height;cv.width=W0*DPR;cv.height=H0*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);Object.values(cache).forEach(free);cache={}};
  const get=id=>cache[id]||(cache[id]=build(id,W0,H0));
  const loop=now=>{
    const dt=Math.min(.1,(now-last)/1000);last=now;if(!isPaused()&&!reduce)t+=dt;
    const id=ORDER[(i0+Math.floor(getStory()/60/STAY))%ORDER.length];
    if(id!==cur){prev=cur;cur=id;fadeAt=now;onArrive(SCENES[id].name,!prev,id);for(const k in cache)if(k!==cur&&k!==prev){free(cache[k]);delete cache[k]}}
    const k=Math.min(1,(now-fadeAt)/2200);
    if(prev&&k<1)draw(ctx,get(prev),t,1);
    draw(ctx,get(cur),t,prev?k:1);
    raf=requestAnimationFrame(loop)};
  // 주소창이 접히는 정도의 작은 높이 변화로는 다시 그리지 않음
  let rz;const onResize=()=>{clearTimeout(rz);rz=setTimeout(()=>{const r=cv.getBoundingClientRect();if(Math.abs(r.width-W0)>2||Math.abs(r.height-H0)>80)size()},150)};
  addEventListener('resize',onResize);size();raf=requestAnimationFrame(loop);
  return()=>{cancelAnimationFrame(raf);removeEventListener('resize',onResize);Object.values(cache).forEach(free);cache={}};
}
window.IsekaiJourney={start,STAY,places:ORDER.map(id=>({id,name:SCENES[id].name,desc:SCENES[id].desc,pos:MAP[id]}))};
})();
