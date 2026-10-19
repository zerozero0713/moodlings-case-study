const navItems=[...document.querySelectorAll('.mood-nav-link')];
const sections=[...document.querySelectorAll('.mood-section, .fidelity-anchor')];
const states=[...document.querySelectorAll('.hero-state')];
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coverCardTravel=84;
const coverCardAfterTravel=36;
const docRoot=document.documentElement;
const rootStyle=docRoot.style;
const cover=document.querySelector('.hero-visual');
let animationDistance=Math.max(1,innerHeight);
let scrollFrame=0;
let resizeFrame=0;
let coverNavLive=false;
document.querySelectorAll('video[autoplay]').forEach(video=>{
  if(reduceMotion){video.removeAttribute('autoplay');video.pause();}
});
if(!reduceMotion){
  const videoObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    const video=entry.target;
    if(entry.isIntersecting){video.play().catch(()=>{});}else{video.pause();}
  }),{threshold:.15});
  document.querySelectorAll('video[loop]').forEach(video=>videoObserver.observe(video));
}

function setHeroState(progress,animationDistance=900){
  if(states.length===1){
    const p=Math.max(0,Math.min(1,progress));
    // During the opening phase, the cards travel one physical pixel for every
    // scroll pixel, matching the rising paper panel. The title and background
    // stay fixed until the center card reaches the second title line.
    const scrollTravel=p*Math.max(1,animationDistance);
    const leadTravel=Math.min(coverCardTravel,scrollTravel);
    const remainingDistance=Math.max(1,animationDistance-coverCardTravel);
    const afterPose=Math.max(0,Math.min(1,(scrollTravel-coverCardTravel)/remainingDistance));
    const cardOffset=leadTravel+coverCardAfterTravel*afterPose;
    // Raise the rounded cover edge by exactly the same amount as the cards.
    // Their visible crop therefore stays constant while the cards keep moving.
    rootStyle.setProperty('--cover-cut',`${leadTravel}px`);
    rootStyle.setProperty('--cover-card-shift',`${-cardOffset}px`);
    const nextNavLive=p>.72;
    if(nextNavLive!==coverNavLive){coverNavLive=nextNavLive;docRoot.classList.toggle('cover-nav-live',nextNavLive)}
    return;
  }
  // The Figma frames are key poses, not hard slide stops. Interpolate between
  // the first three poses so the cover feels like the reference recording.
  const p=Math.max(0,Math.min(1,progress));
  const poses=states.slice(0,3);
  const travel=Math.min(1,p/0.9)*2;
  const base=Math.min(1,Math.floor(travel));
  const mix=travel-base;
  poses.forEach((state,i)=>{
    let opacity=0;
    if(i===base) opacity=1-mix;
    if(i===base+1) opacity=mix;
    if(p>0.9 && i===2) opacity=1-(p-0.9)/0.1;
    state.style.opacity=opacity.toFixed(4);
    state.style.transform=`translateY(${(1-opacity)*10}px) scale(${0.985+opacity*0.015})`;
    state.classList.toggle('is-visible',opacity>0.01);
  });
  if(states[3]){states[3].style.opacity='0';states[3].classList.remove('is-visible')}
  const nextNavLive=p>0.86;
  if(nextNavLive!==coverNavLive){coverNavLive=nextNavLive;docRoot.classList.toggle('cover-nav-live',nextNavLive)}
}
if(states.length===1){
  states[0].style.opacity='1';
  states[0].style.transform='none';
  states[0].classList.add('is-visible');
}
setHeroState(0);

function updateActiveNav(){
  const probe=scrollY+innerHeight*.45;
  let activeKey='intro';
  sections.forEach(section=>{
    const top=section.getBoundingClientRect().top+scrollY;
    if(top<=probe)activeKey=section.dataset.nav||activeKey;
  });
  navItems.forEach(item=>item.classList.toggle('is-active',item.dataset.target===activeKey));
}

function updateScroll(){
  if(!cover)return;
  const progress=Math.max(0,Math.min(1,scrollY/animationDistance));
  // Once the center card reaches the title, every cover layer joins the cards
  // and paper panel at the same 1:1 scroll rate.
  const sharedTravel=Math.max(0,progress*animationDistance-coverCardTravel);
  rootStyle.setProperty('--cover-frame-y',`${-sharedTravel}px`);
  setHeroState(progress,animationDistance);
  updateActiveNav();
}
function requestScrollUpdate(){
  if(scrollFrame)return;
  scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;updateScroll()});
}
function syncLayout(){
  const scale=innerWidth/1440;
  const safeScale=Math.max(.45,scale);
  animationDistance=Math.max(1,innerHeight);
  rootStyle.setProperty('--intro-scale',scale.toFixed(4));
  rootStyle.setProperty('--intro-height',`${1010*scale}px`);
  rootStyle.setProperty('--section1-scale',scale.toFixed(4));
  rootStyle.setProperty('--section1-height',`${838*scale}px`);
  rootStyle.setProperty('--section2-scale',scale.toFixed(4));
  rootStyle.setProperty('--section2-height',`${758*scale}px`);
  rootStyle.setProperty('--section3-scale',scale.toFixed(4));
  rootStyle.setProperty('--section3-height',`${758*scale}px`);
  rootStyle.setProperty('--section4-scale',scale.toFixed(4));
  rootStyle.setProperty('--section4-height',`${758*scale}px`);
  rootStyle.setProperty('--connecting-scale',scale.toFixed(4));
  rootStyle.setProperty('--connecting-height',`${1486*scale}px`);
  rootStyle.setProperty('--section5-scale',scale.toFixed(4));
  rootStyle.setProperty('--section5-height',`${1185*scale}px`);
  rootStyle.setProperty('--cover-scale',safeScale.toFixed(4));
  rootStyle.setProperty('--cover-height',`${816*safeScale}px`);
  rootStyle.setProperty('--cover-radius',`${50*safeScale}px`);
  rootStyle.setProperty('--cover-gap',`${144*safeScale}px`);
  updateScroll();
}
addEventListener('scroll',requestScrollUpdate,{passive:true});
addEventListener('resize',()=>{
  if(resizeFrame)return;
  resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;syncLayout()});
},{passive:true});
syncLayout();
navItems.forEach(item=>item.addEventListener('click',()=>{
  const key=item.dataset.target;
  const target=document.querySelector(`.fidelity-anchor[data-nav="${key}"]`) || document.getElementById(key);
  target?.scrollIntoView({behavior:reduceMotion?'auto':'smooth'});
}));
