/* Procedural 3D bat for the "In the round" section.
 *
 * A bat is a surface of revolution, so there is no model file to download —
 * the silhouette is defined as a radius-along-length profile and lathed. That
 * keeps it a few kB of maths instead of a multi-megabyte GLTF, and it means
 * the grip's groove count and depth are parameters rather than baked geometry.
 *
 * Units are inches; the whole group is scaled at the end.
 */
import * as THREE from '../vendor/three.module.min.js';

const BAT_LENGTH   = 33;    // overall, knob face to barrel end
const GRIP_TOP     = 10.5;  // where the Pivot Point grip ends
const HANDLE_R     = 0.47;
const BARREL_R     = 1.30;
const GROOVES      = 5;
const PIVOT_Y      = 6.5;   // middle of the grip — what the camera frames

/* --- Profiles ----------------------------------------------------------- */

/** Pivot Point grip: integrated knob, palm swell, then the power grooves. */
function gripProfile() {
  const pts = [
    [0.00, 0.00],   // closed bottom face
    [0.94, 0.06],
    [1.03, 0.45],   // knob flare
    [1.00, 0.85],
    [0.82, 1.25],
    [0.74, 1.70],   // palm pad begins
  ];

  // Grooves: a damped cosine between the palm pad and the handle throat, so
  // each ridge is a little shallower than the one below it.
  const start = 1.9, end = 9.0, span = end - start;
  const steps = GROOVES * 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = start + t * span;
    // Raised to the 3rd power: ridges stay full and the cut between them
    // pinches, which is what makes them read as finger grooves rather than
    // as a wavy handle.
    const wave = Math.cos(t * GROOVES * Math.PI * 2);
    const shaped = Math.sign(wave) * Math.pow(Math.abs(wave), 0.55);
    const amp = 0.115 * (1 - t * 0.4);
    const base = 0.79 - t * 0.13;
    pts.push([base + shaped * amp, y]);
  }

  pts.push([0.60, 9.6], [0.50, 10.3], [HANDLE_R, GRIP_TOP]);
  return pts.map(([r, y]) => new THREE.Vector2(r, y));
}

/** Barrel: straight handle, taper, barrel, rounded end cap. */
function barrelProfile() {
  const pts = [
    [HANDLE_R, GRIP_TOP],
    [HANDLE_R, 14.0],
    [0.50, 16.5],
    [0.58, 18.5],
    [0.76, 20.5],
    [1.00, 22.5],
    [1.18, 24.0],
    [1.27, 25.5],
    [BARREL_R, 27.5],
    [BARREL_R, 31.6],
    [1.27, 32.3],
    [1.14, 32.75],
    [0.80, 32.98],
    [0.00, BAT_LENGTH],  // closed cap
  ];
  return pts.map(([r, y]) => new THREE.Vector2(r, y));
}

/* --- Scene -------------------------------------------------------------- */

export function mount(container, opts = {}) {
  const canvas = container.querySelector('canvas');
  const hotspots = Array.from(container.querySelectorAll('[data-hotspot]'));

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 300);

  // This section is about the grip, so frame the grip: rotate about the middle
  // of it rather than the middle of the bat. The grip then holds the centre of
  // the frame while the barrel sweeps in and out of shot above it.
  const bat = new THREE.Group();
  const pivot = new THREE.Group();
  pivot.position.y = -PIVOT_Y;
  bat.add(pivot);

  // No environment map is loaded, so metalness has to stay low — a metallic
  // surface with nothing to reflect just renders black. The read comes from
  // the light rig instead.
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x2a2724, roughness: 0.88, metalness: 0.02,
  });
  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0x8d9197, roughness: 0.44, metalness: 0.12,
  });
  const bandMat = new THREE.MeshStandardMaterial({
    color: 0xe68a18, roughness: 0.36, metalness: 0.08,
    emissive: 0x2a1300, emissiveIntensity: 0.4,
  });

  const grip = new THREE.Mesh(new THREE.LatheGeometry(gripProfile(), 96), gripMat);
  const barrel = new THREE.Mesh(new THREE.LatheGeometry(barrelProfile(), 96), barrelMat);

  // Brand band on the parallel section of the barrel, sitting just proud of
  // the surface so it is never swallowed by it.
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(1.335, 1.335, 0.85, 96, 1, true),
    bandMat
  );
  band.position.y = 28.4;

  pivot.add(grip, barrel, band);
  scene.add(bat);

  /* Lighting. No environment map is loaded, so metalness stays low and the
     shape is carried by a key, a warm rim and a cool fill. */
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));

  // Sky/ground bounce stands in for the missing environment map.
  scene.add(new THREE.HemisphereLight(0xdfe7f2, 0x120d08, 1.1));

  const key = new THREE.DirectionalLight(0xfff4e6, 3.1);
  key.position.set(-7, 10, 13);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xff8a1f, 3.6);
  rim.position.set(8, -4, -9);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0xa8c0dc, 1.3);
  fill.position.set(9, 1, 7);
  scene.add(fill);

  /* --- Layout ---------------------------------------------------------
   * The bat is 33 units long and leans ~22°, so it needs about 31 units of
   * height and 13 of width. Derive the camera distance from the field of
   * view rather than hard-coding it, so any container shape frames it the
   * same way — narrow viewports pull back on width, wide ones on height.
   */
  const FIT_H = 27;
  const FIT_W = 15;
  let w = 0, h = 0;

  function resize() {
    const r = container.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));

    renderer.setSize(w, h, false);
    camera.aspect = w / h;

    const halfFov = Math.tan((camera.fov * Math.PI) / 360);
    const forHeight = (FIT_H / 2) / halfFov;
    const forWidth = (FIT_W / 2) / halfFov / camera.aspect;
    camera.position.z = Math.max(forHeight, forWidth);

    camera.updateProjectionMatrix();
  }

  /* --- Hotspots -------------------------------------------------------- */
  // Each label is anchored to a point in bat space and reprojected per frame.
  const anchors = hotspots.map((el) => {
    const y = parseFloat(el.getAttribute('data-hotspot'));
    return { el, point: new THREE.Vector3(0, y - PIVOT_Y, 0.95) };
  });

  const projected = new THREE.Vector3();

  function placeHotspots() {
    for (const a of anchors) {
      projected.copy(a.point).applyMatrix4(bat.matrixWorld).project(camera);
      const behind = projected.z > 1;
      a.el.style.transform =
        'translate(-50%,-50%) translate(' +
        ((projected.x * 0.5 + 0.5) * w).toFixed(1) + 'px,' +
        ((-projected.y * 0.5 + 0.5) * h).toFixed(1) + 'px)';
      a.el.style.opacity = behind ? '0' : '1';
    }
  }

  /* --- Motion ---------------------------------------------------------- */
  // Resting pose: leaning back, barrel up, seen slightly from below.
  const REST_X = 0.22, REST_Z = -0.38;
  let spin = 0;
  let targetX = REST_X, targetZ = REST_Z;
  let curX = REST_X, curZ = REST_Z;
  let scrollTurn = 0, scrollTarget = 0;
  let running = false, frame = 0;
  const idle = opts.idle !== false;

  function onPointer(e) {
    const r = container.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 2 - 1;
    const py = ((e.clientY - r.top) / r.height) * 2 - 1;
    targetX = REST_X + py * 0.34;
    targetZ = REST_Z - px * 0.42;
  }

  function onLeave() { targetX = REST_X; targetZ = REST_Z; }

  function onScroll() {
    const r = container.getBoundingClientRect();
    const mid = (r.top + r.height / 2) / window.innerHeight;  // 1 → 0 passing up
    scrollTarget = (0.5 - mid) * 2.4;
  }

  function tick() {
    if (!running) return;
    frame = requestAnimationFrame(tick);

    if (idle) spin += 0.0032;
    scrollTurn += (scrollTarget - scrollTurn) * 0.07;
    curX += (targetX - curX) * 0.07;
    curZ += (targetZ - curZ) * 0.07;

    bat.rotation.set(curX, spin + scrollTurn, curZ);
    bat.updateMatrixWorld();

    renderer.render(scene, camera);
    placeHotspots();
  }

  function start() {
    if (running) return;
    running = true;
    resize();
    onScroll();
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frame);
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    container.addEventListener('pointermove', onPointer, { passive: true });
    container.addEventListener('pointerleave', onLeave, { passive: true });
  }

  // Only burn frames while the section is on screen.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries[0].isIntersecting ? start() : stop();
    }, { threshold: 0.01 }).observe(container);
  } else {
    start();
  }

  container.setAttribute('data-ready', 'true');

  return { start, stop, resize };
}
