const prefersReduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const petalBox=document.getElementById("petals");
const glow=document.getElementById("cursorGlow");

if(!prefersReduced){
  for(let i=0;i<30;i++){
    const p=document.createElement("span");
    p.style.left=(Math.random()*100)+"vw";
    p.style.animationDuration=(8+Math.random()*11)+"s";
    p.style.animationDelay=(-Math.random()*16)+"s";
    p.style.opacity=(.18+Math.random()*.7).toFixed(2);
    p.style.width=(5+Math.random()*6)+"px";
    p.style.height=(3+Math.random()*4)+"px";
    petalBox.appendChild(p);
  }

  window.addEventListener("pointermove",e=>{
    glow.style.left=e.clientX+"px";
    glow.style.top=e.clientY+"px";
  },{passive:true});

  document.querySelectorAll(".skill-card,.project-card").forEach(card=>{
    card.addEventListener("pointermove",e=>{
      const r=card.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5;
      const y=(e.clientY-r.top)/r.height-.5;
      card.style.transform="perspective(1000px) rotateX("+(-y*4)+"deg) rotateY("+(x*5)+"deg) translateZ(10px)";
    });
    card.addEventListener("pointerleave",()=>{card.style.transform=""});
  });

  document.querySelectorAll(".magnetic").forEach(button=>{
    button.addEventListener("pointermove",e=>{
      const r=button.getBoundingClientRect();
      const x=(e.clientX-(r.left+r.width/2))*0.14;
      const y=(e.clientY-(r.top+r.height/2))*0.14;
      button.style.transform="translate3d("+x+"px,"+y+"px,0)";
    });
    button.addEventListener("pointerleave",()=>{button.style.transform=""});
  });
}

const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
},{threshold:.12,rootMargin:"0px 0px -40px 0px"});
document.querySelectorAll(".reveal").forEach((el,i)=>{
  if(!prefersReduced) el.style.transitionDelay=Math.min(i*35,240)+"ms";
  observer.observe(el);
});

document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener("click",e=>{
    const target=document.querySelector(a.getAttribute("href"));
    if(target){e.preventDefault();target.scrollIntoView({behavior:prefersReduced?"auto":"smooth",block:"start"});}
  });
});
