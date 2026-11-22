(() => {
  'use strict';
  const $ = (q, ctx=document) => ctx.querySelector(q);
  const $$ = (q, ctx=document) => [...ctx.querySelectorAll(q)];
  const header = $('#site-header');
  const nav = $('#mobile-navigation');
  const toggle = $('.nav-toggle');
  const progress = $('.scroll-progress');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let navOpen = false;
  function setNav(open){
    navOpen = open;
    document.body.classList.toggle('menu-open', open);
    nav?.classList.toggle('open',open);
    nav?.setAttribute('aria-hidden',String(!open));
    toggle?.setAttribute('aria-expanded',String(open));
    toggle?.setAttribute('aria-label',open?'Close menu':'Open menu');
  }
  toggle?.addEventListener('click',()=>setNav(!navOpen));
  $$('.nav-overlay a').forEach(el=>el.addEventListener('click',()=>setNav(false)));
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape'){setNav(false);closeLightbox();}});
  let rafScroll=false;
  function onScroll(){
    if(rafScroll) return;
    rafScroll=true;
    requestAnimationFrame(()=>{
      const scroll=window.scrollY;
      header?.classList.toggle('is-scrolled',scroll>40);
      const max=document.documentElement.scrollHeight-window.innerHeight;
      if(progress) progress.style.width=(max>0?scroll/max*100:0)+'%';
      if(!reducedMotion && window.innerWidth>760){const photo=$('.hero-photo img');if(photo && scroll<window.innerHeight*1.5)photo.style.transform=`scale(1.08) translate3d(0,${Math.max(0,scroll)*.065}px,0)`;}
      rafScroll=false;
    });
  }
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  if('IntersectionObserver' in window && !reducedMotion){
    document.documentElement.classList.add('js-motion');
    const revealObs=new IntersectionObserver((entries,observer)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');observer.unobserve(e.target);}})},{threshold:.08,rootMargin:'0px 0px 35px 0px'});
    $$('.reveal').forEach(el=>revealObs.observe(el));
  }
  // Editorial menu: the image follows the active course while desktop visitors browse.
  const preview=$('#menu-preview-photo'),previewIndex=$('#menu-preview-index');
  const rows=$$('.menu-row');
  let currentSrc=preview?.getAttribute('src'),changeTimer;
  function setPreview(row){
    if(!preview || !row || window.innerWidth<=760)return;
    const src=row.getAttribute('data-preview');
    if(!src || src===currentSrc)return;
    currentSrc=src;
    clearTimeout(changeTimer);
    preview.classList.add('is-changing');
    changeTimer=setTimeout(()=>{
      preview.src=src;preview.alt=row.getAttribute('data-preview-alt')||'Selected course';
      const idx=rows.indexOf(row)+1;
      if(previewIndex)previewIndex.textContent=String(idx).padStart(2,'0')+' — 05';
      preview.onload=()=>preview.classList.remove('is-changing');
      setTimeout(()=>preview.classList.remove('is-changing'),350);
    },145);
  }
  rows.forEach(row=>{
    row.addEventListener('pointerenter',()=>setPreview(row));
    row.addEventListener('focus',()=>setPreview(row));
  });
  // Horizontal drinks carousel, native swipe on touch, controls on desktop.
  const slider=$('#drinks-slider');
  $$('[data-slider-prev],[data-slider-next]').forEach(btn=>btn.addEventListener('click',()=>{
    if(!slider)return;
    const card=slider.querySelector('.drink-tile');
    const width=(card?.getBoundingClientRect().width||280)+22;
    slider.scrollBy({left:btn.hasAttribute('data-slider-next')?width:-width,behavior:reducedMotion?'auto':'smooth'});
  }));
  // Modal gallery with keyboard and focus return.
  const lightbox=$('.lightbox'),lightboxImg=$('.lightbox img');let focusReturn=null;
  function closeLightbox(){if(!lightbox?.classList.contains('open'))return;lightbox.classList.remove('open');lightbox.setAttribute('aria-hidden','true');document.body.style.overflow='';focusReturn?.focus();}
  $$('[data-lightbox]').forEach(btn=>btn.addEventListener('click',()=>{if(!lightbox||!lightboxImg)return;focusReturn=btn;lightboxImg.src=btn.getAttribute('data-lightbox');lightboxImg.alt=btn.querySelector('img')?.alt||'Our photo';lightbox.classList.add('open');lightbox.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('.lightbox-close')?.focus();}));
  $('.lightbox-close')?.addEventListener('click',closeLightbox);
  lightbox?.addEventListener('click',ev=>{if(ev.target===lightbox)closeLightbox()});
  // Recipe category filters, with details closed only when hidden.
  const filterButtons=$$('[data-filter]'),recipes=$$('.recipe-accordion');
  function applyFilter(which){
    filterButtons.forEach(b=>{const active=b.dataset.filter===which;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
    recipes.forEach(recipe=>{const show=which==='all'||recipe.dataset.category===which;recipe.hidden=!show;if(!show)recipe.open=false;});
  }
  filterButtons.forEach(b=>b.addEventListener('click',()=>applyFilter(b.dataset.filter)));
  // Save recipe ingredient ticks and shopping ticks locally in the browser.
  const ingredientPrefix='ri-christmas-ingredient-';
  $$('[data-ing-key]').forEach(input=>{const key=ingredientPrefix+input.dataset.ingKey;try{input.checked=localStorage.getItem(key)==='1'}catch{}input.addEventListener('change',()=>{try{localStorage.setItem(key,input.checked?'1':'0')}catch{}})});
  const shopping=$$('[data-shop-item]');
  function updateShopping(){const checked=shopping.filter(i=>i.checked).length;const count=$('[data-shop-count]');if(count)count.textContent=`${checked} of ${shopping.length} items checked`;const bar=$('[data-shop-progress]');if(bar)bar.style.width=(shopping.length?checked/shopping.length*100:0)+'%';}
  shopping.forEach(input=>{const key='ri-christmas-shop-'+input.dataset.shopItem;try{input.checked=localStorage.getItem(key)==='1'}catch{}input.addEventListener('change',()=>{try{localStorage.setItem(key,input.checked?'1':'0')}catch{}updateShopping()});});updateShopping();
  $('[data-reset-shopping]')?.addEventListener('click',()=>{shopping.forEach(input=>{input.checked=false;try{localStorage.removeItem('ri-christmas-shop-'+input.dataset.shopItem)}catch{}});updateShopping()});
  $('[data-copy-shopping]')?.addEventListener('click',async(ev)=>{
    const list=shopping.filter(i=>!i.checked).map(i=>'• '+i.dataset.shopItem.split('/').slice(1).join('/')).join('\n');
    const text='OUR FIRST CHRISTMAS TOGETHER — SHOPPING LIST\n\n'+(list||'Everything is already checked!');
    try{await navigator.clipboard.writeText(text);ev.currentTarget.textContent='Copied to clipboard ✓';setTimeout(()=>ev.currentTarget.textContent='Copy shopping list ↗',1800)}catch{ev.currentTarget.textContent='Copy unavailable';setTimeout(()=>ev.currentTarget.textContent='Copy shopping list ↗',1800)}
  });
  // Deep links such as recipes.html#glazed-ham open the right recipe automatically.
  function handleHash(){const id=decodeURIComponent(location.hash.replace('#',''));if(!id)return;const target=document.getElementById(id);if(target?.matches('.recipe-accordion')){applyFilter('all');target.open=true;requestAnimationFrame(()=>setTimeout(()=>target.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'}),80));}}
  window.addEventListener('hashchange',handleHash);handleHash();
})();