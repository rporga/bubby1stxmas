(()=>{'use strict';document.documentElement.classList.add('js');const body=document.body;const page=body.dataset.page;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
// A calm, perceptible field of drifting gold dust and occasional four-point stars.
// The canvas is decorative, pointer-transparent, and disabled for reduced motion.
const canvas=document.querySelector('[data-gold-dust]');
if(canvas&&!reduced){
  const ctx=canvas.getContext('2d',{alpha:true});
  let w=0,h=0,dpr=1,dots=[],frame=0,last=0,isVisible=true;
  let pointer={x:0,y:0},smoothed={x:0,y:0};
  const density=page==='cover'?113:page==='menu'?78:70;
  function buildField(){
    dpr=Math.min(2,window.devicePixelRatio||1);
    w=window.innerWidth; h=window.innerHeight;
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const n=Math.max(28,Math.round(density*(w/1440*.55+.45)));
    dots=Array.from({length:n},()=>({
      x:Math.random()*w,y:Math.random()*h,
      radius:Math.random()*1.35+.6,
      large:Math.random()<.16,
      phase:Math.random()*Math.PI*2,
      alpha:.25+Math.random()*.42,
      speed:.018+Math.random()*.10,
      drift:Math.random()*.12-.06
    }));
  }
  buildField();
  window.addEventListener('resize',buildField,{passive:true});
  window.addEventListener('pointermove',e=>{
    pointer.x=(e.clientX/w-.5)*9;pointer.y=(e.clientY/h-.5)*7;
  },{passive:true});
  function paint(t){
    if(!isVisible)return;
    frame=requestAnimationFrame(paint);
    if(t-last<28)return;
    const dt=Math.min(75,Math.max(0,t-last||32))/32;
    last=t;
    smoothed.x+=(pointer.x-smoothed.x)*.012;
    smoothed.y+=(pointer.y-smoothed.y)*.012;
    ctx.clearRect(0,0,w,h);
    for(const p of dots){
      const flicker=.78+.22*Math.sin(t*.00115+p.phase);
      const opacity=p.alpha*flicker;
      const x=p.x+smoothed.x,y=p.y+smoothed.y;
      ctx.globalAlpha=opacity;
      if(p.large){
        const r=p.radius*1.7;
        ctx.fillStyle='#ffe4a4';
        ctx.shadowColor='rgba(243,194,100,.92)';ctx.shadowBlur=8;
        ctx.beginPath();ctx.arc(x,y,r*.47,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;ctx.strokeStyle='#f8dca3';ctx.lineWidth=.65;
        ctx.beginPath();ctx.moveTo(x-r*1.8,y);ctx.lineTo(x+r*1.8,y);
        ctx.moveTo(x,y-r*2.25);ctx.lineTo(x,y+r*2.25);ctx.stroke();
      }else{
        ctx.fillStyle='#e8bb72';ctx.shadowColor='rgba(239,186,91,.7)';ctx.shadowBlur=3;
        ctx.beginPath();ctx.arc(x,y,p.radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      }
      p.y-=p.speed*dt;
      p.x+=p.drift*dt;
      if(p.y < -12){p.y=h+12;p.x=Math.random()*w;}
      if(p.x < -12)p.x=w+12;
      if(p.x > w+12)p.x=-12;
    }
    ctx.globalAlpha=1;ctx.shadowBlur=0;
  }
  frame=requestAnimationFrame(paint);
  document.addEventListener('visibilitychange',()=>{
    isVisible=!document.hidden;
    if(!isVisible)cancelAnimationFrame(frame);
    else{last=0;frame=requestAnimationFrame(paint)}
  });
}
// Fit every line of the cover title, including long calligraphic swashes.
// This also works when the web font arrives after the first paint.
function fitCoverTitle(){
  const holder=document.querySelector('.cover-content');if(!holder)return;
  const maxWidth=Math.min(holder.clientWidth-10,innerWidth-30);
  for(const node of holder.querySelectorAll('.cover-overline,.cover-script,.cover-end')){
    node.style.fontSize='';
    const size=parseFloat(getComputedStyle(node).fontSize);
    const natural=node.scrollWidth;
    if(natural>maxWidth)node.style.fontSize=`${Math.floor(size*maxWidth/natural*.975)}px`;
  }
}
if(page==='cover'){
  fitCoverTitle();
  if(document.fonts?.ready)document.fonts.ready.then(fitCoverTitle);
  window.addEventListener('resize',fitCoverTitle,{passive:true});
}
// Page turn: a gentle paper tilt as navigation moves to the next chapter.
function navigate(url){if(!url)return;if(reduced){location.href=url;return;}body.classList.add('is-turning');setTimeout(()=>location.assign(url),360)}
document.querySelectorAll('a.page-link').forEach(a=>{a.addEventListener('click',e=>{if(e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;const target=a.getAttribute('href');if(!target||target.includes('#'))return;e.preventDefault();navigate(target);})});
// On small screens a horizontal swipe feels like turning a chapter.
if(['cover','menu','letter'].includes(page)){let start=null;const next={cover:'menu.html',menu:'letter.html',letter:null},prev={cover:null,menu:'index.html',letter:'menu.html'};document.addEventListener('touchstart',e=>{if(innerWidth>680||e.touches.length!==1)return;const el=e.target;if(el.closest('a,button,summary,input')){start=null;return;}start={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});document.addEventListener('touchend',e=>{if(!start||innerWidth>680)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;start=null;if(Math.abs(dx)<85||Math.abs(dy)>Math.abs(dx)*.52)return;const url=dx<0?next[page]:prev[page];if(url)navigate(url);},{passive:true});}
// Print menu rows appear slowly, as if unfolding the printed menu.
const reveal=document.querySelectorAll('.reveal');if(reveal.length){if('IntersectionObserver'in window&&!reduced){const io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}},{rootMargin:'0px 0px 50px 0px',threshold:.04});reveal.forEach(el=>io.observe(el))}else reveal.forEach(el=>el.classList.add('is-visible'))}
// Recipes are fully linkable via menu anchors; filter without removing content.
const cards=[...document.querySelectorAll('.recipe-card')];const buttons=[...document.querySelectorAll('[data-filter]')];buttons.forEach(button=>button.addEventListener('click',()=>{let cat=button.dataset.filter;buttons.forEach(b=>{const active=b===button;b.classList.toggle('is-current',active);b.setAttribute('aria-pressed',active?'true':'false')});cards.forEach(c=>c.hidden=cat!=='all'&&c.dataset.category!==cat)}));function openAnchor(){const id=decodeURIComponent(location.hash.replace(/^#/,''));if(!id)return;const recipe=document.getElementById(id);if(recipe?.matches('.recipe-card')){buttons[0]?.click();recipe.open=true;setTimeout(()=>recipe.scrollIntoView({block:'start',behavior:reduced?'auto':'smooth'}),130)}}openAnchor();addEventListener('hashchange',openAnchor);
})();
