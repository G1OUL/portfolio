document.addEventListener('DOMContentLoaded',()=>{
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const heading=document.getElementById('animatedHeading');
  if(heading){
    const lines=['Shaping tomorrow','with vision and action.'];
    const initialDelay=200,charDelay=30;
    heading.innerHTML='';
    lines.forEach((line,lineIndex)=>{
      const lineWrap=document.createElement('span');
      lineWrap.className='heading-line';
      [...line].forEach((char,charIndex)=>{
        const span=document.createElement('span');
        span.className='char';
        span.textContent=char===' ' ? '\u00A0' : char;
        lineWrap.appendChild(span);
        if(reduced) span.classList.add('visible');
        else window.setTimeout(()=>span.classList.add('visible'),initialDelay+(lineIndex*line.length*charDelay)+(charIndex*charDelay));
      });
      heading.appendChild(lineWrap);
    });
  }

  const timed=[
    [document.querySelector('.hero-sub'),800],
    [document.querySelector('.hero-actions'),1200],
    [document.querySelector('.hero-side'),1400]
  ];
  timed.forEach(([el,delay])=>{
    if(!el) return;
    if(reduced) el.classList.add('visible');
    else window.setTimeout(()=>el.classList.add('visible'),delay);
  });

  const io=new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  },{threshold:.12,rootMargin:'0px 0px -50px'});
  document.querySelectorAll('.reveal').forEach((el,i)=>{
    if(!reduced) el.style.transitionDelay=Math.min(i*40,220)+'ms';
    io.observe(el);
  });

  const video=document.querySelector('.hero-video');
  if(video){
    video.play().catch(()=>{});
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden) video.pause();
      else video.play().catch(()=>{});
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      const target=document.querySelector(a.getAttribute('href'));
      if(target){e.preventDefault();target.scrollIntoView({behavior:reduced?'auto':'smooth'});}
    });
  });
});
