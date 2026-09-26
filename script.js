/* ===== DETECTION ===== */
const IS_MOBILE = matchMedia('(max-width: 768px)').matches;
const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_TOUCH = matchMedia('(hover: none)').matches;

/* ===== THEME ===== */
const THEMES = {
  dark: {
    sceneBg: 0x050706,
    fogColor: '#050706',
    terrainLow: '#0B100D',
    terrainHigh: '#1A3328',
    wireColor: '#5CFF9A',
    particleColor: '#B7FFCE'
  },
  light: {
    sceneBg: 0xF5F3EF,
    fogColor: '#F5F3EF',
    terrainLow: '#EDEAE3',
    terrainHigh: '#C8C4B8',
    wireColor: '#0A7A3E',
    particleColor: '#0A9D5E'
  }
};

function getTheme() { return document.documentElement.dataset.theme || 'dark'; }

function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('portfolio-theme', t); } catch (e) {}
  applyThemeToScene(t);
}

function applyThemeToScene(t) {
  if (!scene) return;
  const c = THEMES[t];
  scene.background = new THREE.Color(c.sceneBg);
  if (terrainUniforms) {
    terrainUniforms.uColorLow.value.copy(hexToVec3(c.terrainLow));
    terrainUniforms.uColorHigh.value.copy(hexToVec3(c.terrainHigh));
    terrainUniforms.uFogColor.value.copy(hexToVec3(c.fogColor));
  }
  if (wireUniforms) {
    wireUniforms.uWireColor.value.copy(hexToVec3(c.wireColor));
    wireUniforms.uFogColor.value.copy(hexToVec3(c.fogColor));
  }
  if (particleUniforms) {
    particleUniforms.uColor.value.copy(hexToVec3(c.particleColor));
  }
}

/* ===== IMPORTS ===== */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ===== UTILS ===== */
function hexToVec3(hex) {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}
function smoothstep(t) { return t * t * (3 - 2 * t); }

function interpolateKey(keys, progress, key) {
  for (let i = 0; i < keys.length - 1; i++) {
    if (progress >= keys[i].p && progress <= keys[i + 1].p) {
      const t = (progress - keys[i].p) / (keys[i + 1].p - keys[i].p);
      const s = smoothstep(t);
      return [
        keys[i][key][0] + (keys[i + 1][key][0] - keys[i][key][0]) * s,
        keys[i][key][1] + (keys[i + 1][key][1] - keys[i][key][1]) * s,
        keys[i][key][2] + (keys[i + 1][key][2] - keys[i][key][2]) * s
      ];
    }
  }
  return keys[keys.length - 1][key];
}

function interpolateValue(keys, progress) {
  for (let i = 0; i < keys.length - 1; i++) {
    if (progress >= keys[i].p && progress <= keys[i + 1].p) {
      const t = (progress - keys[i].p) / (keys[i + 1].p - keys[i].p);
      const s = smoothstep(t);
      return keys[i].v + (keys[i + 1].v - keys[i].v) * s;
    }
  }
  return keys[keys.length - 1].v;
}

/* ===== SHADERS ===== */
const SNOISE = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
 const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
 vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
 vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;
 vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
 vec3 x1=x0-i1+1.0*C.xxx;vec3 x2=x0-i2+2.0*C.xxx;vec3 x3=x0-1.0+3.0*C.xxx;
 i=mod(i,289.0);
 vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
 float n_=1.0/7.0;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);
 vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
 vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
 vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
 vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
 vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
 vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
 return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const terrainVertex = `
uniform float uTime;
uniform float uWaveHeight;
varying float vElevation;
varying float vFogDepth;
${SNOISE}
void main() {
  vec3 pos = position;
  float n1 = snoise(vec3(pos.x * 0.03, pos.z * 0.03, uTime * 0.08));
  float n2 = snoise(vec3(pos.x * 0.06, pos.z * 0.06, uTime * 0.12)) * 0.5;
  float n3 = snoise(vec3(pos.x * 0.12, pos.z * 0.12, uTime * 0.2)) * 0.25;
  float elevation = (n1 + n2 + n3) * uWaveHeight;
  pos.y += elevation;
  vElevation = elevation;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vFogDepth = -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}`;

const terrainFragment = `
uniform vec3 uColorLow;
uniform vec3 uColorHigh;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uOpacity;
varying float vElevation;
varying float vFogDepth;
void main() {
  float mixFactor = smoothstep(-3.0, 5.0, vElevation);
  vec3 color = mix(uColorLow, uColorHigh, mixFactor);
  float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
  fogFactor = clamp(fogFactor, 0.0, 1.0);
  color = mix(color, uFogColor, fogFactor);
  gl_FragColor = vec4(color, uOpacity * (1.0 - fogFactor * 0.7));
}`;

const wireFragment = `
uniform vec3 uWireColor;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uOpacity;
varying float vFogDepth;
void main() {
  float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
  fogFactor = clamp(fogFactor, 0.0, 1.0);
  vec3 color = mix(uWireColor, uFogColor, fogFactor);
  gl_FragColor = vec4(color, uOpacity * (1.0 - fogFactor));
}`;

const particleVertex = `
attribute float aSize;
attribute float aOffset;
uniform float uTime;
uniform float uPixelRatio;
varying float vAlpha;
varying float vFogDepth;
void main() {
  vec3 pos = position;
  pos.y += sin(uTime * 0.5 + aOffset * 6.28) * 0.8;
  pos.x += cos(uTime * 0.3 + aOffset * 6.28) * 0.5;
  pos.z += sin(uTime * 0.2 + aOffset * 6.28) * 0.5;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vFogDepth = -mvPosition.z;
  vAlpha = smoothstep(120.0, 10.0, vFogDepth);
  gl_PointSize = aSize * uPixelRatio * (200.0 / max(vFogDepth, 1.0));
  gl_PointSize = max(gl_PointSize, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}`;

const particleFragment = `
uniform vec3 uColor;
uniform float uOpacity;
varying float vAlpha;
void main() {
  vec2 xy = gl_PointCoord - 0.5;
  float dist = length(xy);
  if (dist > 0.5) discard;
  float alpha = smoothstep(0.5, 0.0, dist) * vAlpha * uOpacity;
  gl_FragColor = vec4(uColor, alpha);
}`;

/* ===== KEYFRAMES ===== */
const cameraKeys = [
  { p: 0.00, pos: [0, 15, 25], look: [0, 0, 0] },
  { p: 0.12, pos: [0, 10, 5], look: [0, 0, -15] },
  { p: 0.25, pos: [0, 4, -20], look: [0, 1, -40] },
  { p: 0.42, pos: [0, 6, -60], look: [0, 3, -80] },
  { p: 0.60, pos: [0, 10, -100], look: [0, 5, -120] },
  { p: 0.75, pos: [0, 14, -140], look: [0, 8, -160] },
  { p: 0.88, pos: [0, 18, -180], look: [0, 12, -200] },
  { p: 1.00, pos: [0, 25, -220], look: [0, 18, -240] }
];

const uniformKeys = {
  uWaveHeight: [
    { p: 0.0, v: 3.0 }, { p: 0.25, v: 2.0 }, { p: 0.42, v: 4.0 },
    { p: 0.60, v: 2.5 }, { p: 0.75, v: 1.5 }, { p: 1.0, v: 0.5 }
  ],
  uFogDensity: [
    { p: 0.0, v: 0.012 }, { p: 0.25, v: 0.015 }, { p: 0.42, v: 0.018 },
    { p: 0.60, v: 0.022 }, { p: 0.75, v: 0.030 }, { p: 1.0, v: 0.05 }
  ],
  uTerrainOpacity: [
    { p: 0.0, v: 0.9 }, { p: 0.42, v: 0.85 }, { p: 0.75, v: 0.6 }, { p: 1.0, v: 0.15 }
  ],
  uWireOpacity: [
    { p: 0.0, v: 0.15 }, { p: 0.42, v: 0.18 }, { p: 0.75, v: 0.08 }, { p: 1.0, v: 0.02 }
  ],
  uParticleOpacity: [
    { p: 0.0, v: 0.6 }, { p: 0.25, v: 0.8 }, { p: 0.42, v: 0.7 },
    { p: 0.60, v: 0.5 }, { p: 0.75, v: 0.3 }, { p: 1.0, v: 0.1 }
  ]
};

/* ===== STATE ===== */
let scene, camera, renderer, composer;
let terrain, wireframe, particles;
let terrainUniforms, wireUniforms, particleUniforms;
let scrollProgress = 0, smoothScroll = 0;
let mouseX = 0, smoothMouseX = 0, mouseY = 0, smoothMouseY = 0;

/* ===== THREE.JS INIT ===== */
function initThree() {
  const canvas = document.getElementById('scene');
  if (!canvas) return;

  const theme = THEMES[getTheme()];
  scene = new THREE.Scene();
  scene.background = new THREE.Color(theme.sceneBg);

  camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
  camera.position.set(0, 15, 25);
  camera.lookAt(0, 0, 0);

  const dpr = IS_MOBILE ? Math.min(devicePixelRatio, 1.5) : Math.min(devicePixelRatio, 2);
  renderer = new THREE.WebGL1Renderer({ canvas, antialias: !IS_MOBILE, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight, false);

  createTerrain();
  createParticles();
  if (!IS_MOBILE) createPostProcessing();
}

function createTerrain() {
  const segX = IS_MOBILE ? 60 : 150;
  const segZ = IS_MOBILE ? 100 : 250;
  const geo = new THREE.PlaneGeometry(300, 700, segX, segZ);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, -50);

  const theme = THEMES[getTheme()];

  terrainUniforms = {
    uTime: { value: 0 },
    uWaveHeight: { value: 3.0 },
    uColorLow: { value: hexToVec3(theme.terrainLow) },
    uColorHigh: { value: hexToVec3(theme.terrainHigh) },
    uFogColor: { value: hexToVec3(theme.fogColor) },
    uFogDensity: { value: 0.015 },
    uOpacity: { value: 0.9 }
  };

  const terrainMat = new THREE.ShaderMaterial({
    uniforms: terrainUniforms,
    vertexShader: terrainVertex,
    fragmentShader: terrainFragment,
    transparent: true,
    depthWrite: false
  });

  terrain = new THREE.Mesh(geo, terrainMat);
  terrain.frustumCulled = false;
  scene.add(terrain);

  wireUniforms = {
    uTime: { value: 0 },
    uWaveHeight: { value: 3.0 },
    uWireColor: { value: hexToVec3(theme.wireColor) },
    uFogColor: { value: hexToVec3(theme.fogColor) },
    uFogDensity: { value: 0.015 },
    uOpacity: { value: 0.15 }
  };

  const wireMat = new THREE.ShaderMaterial({
    uniforms: wireUniforms,
    vertexShader: terrainVertex,
    fragmentShader: wireFragment,
    wireframe: true,
    transparent: true,
    depthWrite: false
  });

  wireframe = new THREE.Mesh(geo, wireMat);
  wireframe.frustumCulled = false;
  scene.add(wireframe);
}

function createParticles() {
  const count = IS_MOBILE ? 500 : 2000;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const offsets = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 240;
    positions[i * 3 + 1] = Math.random() * 40;
    positions[i * 3 + 2] = 30 - Math.random() * 280;
    sizes[i] = 2 + Math.random() * 4;
    offsets[i] = Math.random();
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));

  const theme = THEMES[getTheme()];
  const dpr = IS_MOBILE ? Math.min(devicePixelRatio, 1.5) : Math.min(devicePixelRatio, 2);

  particleUniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: dpr },
    uColor: { value: hexToVec3(theme.particleColor) },
    uOpacity: { value: 0.6 }
  };

  const mat = new THREE.ShaderMaterial({
    uniforms: particleUniforms,
    vertexShader: particleVertex,
    fragmentShader: particleFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  particles = new THREE.Points(geo, mat);
  particles.frustumCulled = false;
  scene.add(particles);
}

function createPostProcessing() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(innerWidth, innerHeight),
    0.5, 0.4, 0.85
  );
  composer.addPass(bloom);
}

/* ===== SCROLL ===== */
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  scrollProgress = max > 0 ? Math.max(0, Math.min(1, scrollY / max)) : 0;
  const bar = document.getElementById('scrollProgress');
  if (bar) bar.style.width = (scrollProgress * 100) + '%';
}

/* ===== ANIMATION ===== */
function updateScene() {
  const t = performance.now() / 1000;
  const timeScale = REDUCED_MOTION ? 0.1 : 1;

  smoothScroll += (scrollProgress - smoothScroll) * 0.06;
  smoothMouseX += (mouseX - smoothMouseX) * 0.04;
  smoothMouseY += (mouseY - smoothMouseY) * 0.04;

  const pos = interpolateKey(cameraKeys, smoothScroll, 'pos');
  const look = interpolateKey(cameraKeys, smoothScroll, 'look');
  const parallax = IS_TOUCH ? 0 : 2;

  camera.position.set(
    pos[0] + smoothMouseX * parallax,
    pos[1] + smoothMouseY * parallax,
    pos[2]
  );
  camera.lookAt(
    look[0] + smoothMouseX * parallax * 0.5,
    look[1],
    look[2]
  );

  const waveHeight = interpolateValue(uniformKeys.uWaveHeight, smoothScroll);
  const fogDensity = interpolateValue(uniformKeys.uFogDensity, smoothScroll);
  const terrainOpacity = interpolateValue(uniformKeys.uTerrainOpacity, smoothScroll);
  const wireOpacity = interpolateValue(uniformKeys.uWireOpacity, smoothScroll);
  const particleOpacity = interpolateValue(uniformKeys.uParticleOpacity, smoothScroll);

  if (terrainUniforms) {
    terrainUniforms.uTime.value = t * timeScale;
    terrainUniforms.uWaveHeight.value = waveHeight;
    terrainUniforms.uFogDensity.value = fogDensity;
    terrainUniforms.uOpacity.value = terrainOpacity;
  }
  if (wireUniforms) {
    wireUniforms.uTime.value = t * timeScale;
    wireUniforms.uWaveHeight.value = waveHeight;
    wireUniforms.uFogDensity.value = fogDensity;
    wireUniforms.uOpacity.value = wireOpacity;
  }
  if (particleUniforms) {
    particleUniforms.uTime.value = t * timeScale;
    particleUniforms.uOpacity.value = particleOpacity;
  }
}

function animate() {
  requestAnimationFrame(animate);
  updateScene();
  if (composer) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}

/* ===== RESIZE ===== */
function onResize() {
  const w = innerWidth, h = innerHeight;
  const mobile = matchMedia('(max-width: 768px)').matches;
  const dpr = mobile ? Math.min(devicePixelRatio, 1.5) : Math.min(devicePixelRatio, 2);
  if (renderer) {
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
  }
  if (camera) {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  if (composer) {
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
  }
  if (particleUniforms) {
    particleUniforms.uPixelRatio.value = dpr;
  }
  onScroll();
}

/* ===== INTERACTIONS ===== */
function initThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  const icon = document.getElementById('themeIcon');
  if (!toggle || !icon) return;
  icon.textContent = getTheme() === 'dark' ? '🌙' : '☀️';
  toggle.addEventListener('click', () => {
    const newTheme = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    icon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
  });
}

function initCursor() {
  const dot = document.getElementById('cursorDot');
  const glow = document.getElementById('cursorGlow');
  if (!dot || !glow) return;
  let x = 0, y = 0, gx = 0, gy = 0;
  document.addEventListener('mousemove', e => {
    x = e.clientX; y = e.clientY;
    dot.style.left = x + 'px';
    dot.style.top = y + 'px';
  }, { passive: true });
  function loop() {
    gx += (x - gx) * 0.12;
    gy += (y - gy) * 0.12;
    glow.style.left = gx + 'px';
    glow.style.top = gy + 'px';
    requestAnimationFrame(loop);
  }
  loop();
  document.querySelectorAll('a, button, .magnetic, .exp-tag, .skill-items span').forEach(el => {
    el.addEventListener('mouseenter', () => glow.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => glow.classList.remove('cursor-hover'));
  });
}

function initMagnetic() {
  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

function initNav() {
  const navLinks = document.querySelectorAll('[data-nav]');
  const sections = document.querySelectorAll('section[id]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        const hasMatch = [...navLinks].some(link => link.dataset.nav === id);
        if (hasMatch) {
          navLinks.forEach(link => link.classList.toggle('active', link.dataset.nav === id));
        }
      }
    });
  }, { threshold: 0.3, rootMargin: '-10% 0px -10% 0px' });
  sections.forEach(s => observer.observe(s));
}

function initReveals() {
  if (REDUCED_MOTION) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('revealed'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.section').forEach(s => observer.observe(s));
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
      }
    });
  });
}

/* ===== INIT ===== */
function init() {
  initThemeToggle();
  try {
    initThree();
    animate();
  } catch (e) {
    console.error('3D init failed:', e);
  }
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  if (!IS_TOUCH) {
    addEventListener('mousemove', e => {
      mouseX = (e.clientX / innerWidth) * 2 - 1;
      mouseY = -((e.clientY / innerHeight) * 2 - 1);
    }, { passive: true });
  }
  addEventListener('resize', onResize);
  if (!IS_TOUCH && !REDUCED_MOTION) {
    initCursor();
    initMagnetic();
  }
  initNav();
  initReveals();
  initSmoothScroll();
  const scrollHint = document.querySelector('.scroll-hint');
  if (scrollHint) {
    addEventListener('scroll', () => {
      scrollHint.style.opacity = scrollY > 100 ? '0' : '';
    }, { passive: true });
  }
}

init();
