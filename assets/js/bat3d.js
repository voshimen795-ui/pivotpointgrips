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
const PIVOT_Y      = BAT_LENGTH / 2;  // spin about the middle of the bat

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

/**
 * Brand mark for the barrel, drawn to a canvas and wrapped round it.
 *
 * This is not decoration — it is what makes the rotation visible at all. A
 * lathed bat is a surface of revolution, so spinning it about its own axis
 * changes neither its silhouette nor its shading: without something
 * asymmetric on the barrel the turntable would look completely frozen. The
 * wordmark travelling around is the motion cue, exactly as it is on a real
 * bat.
 *
 * Canvas x wraps the circumference and y runs along the bat, so the text is
 * drawn rotated a quarter turn.
 */
function brandTexture(variant) {
  // Canvas aspect matches the decal's real proportions (2.5 units around by
  // 6.5 along) so the type is not stretched by the mapping.
  const W = 512, H = 1280;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;

  const g = c.getContext('2d');
  g.clearRect(0, 0, W, H);

  // Dark panel behind the type. Orange on the bare light barrel is too low
  // in contrast to read at this size, and a solid shape is also a much
  // stronger motion cue as it travels round.
  const pad = 34, r = 38;
  g.fillStyle = 'rgba(15, 13, 11, .95)';
  g.beginPath();
  g.roundRect(pad, pad, W - pad * 2, H - pad * 2, r);
  g.fill();

  g.strokeStyle = 'rgba(230, 138, 24, .5)';
  g.lineWidth = 5;
  g.stroke();

  g.translate(W / 2, H / 2);
  g.rotate(-Math.PI / 2);
  g.textAlign = 'center';
  g.textBaseline = 'middle';

  g.fillStyle = '#e68a18';
  if (variant === 'alt') {
    // Opposite face. A second mark means something is always entering or
    // leaving view, so the turntable never has a dead half-rotation.
    g.font = '800 290px Archivo, "Helvetica Neue", Arial, sans-serif';
    g.fillText('PPG', 0, 0);
  } else {
    g.font = '800 186px Archivo, "Helvetica Neue", Arial, sans-serif';
    g.fillText('PIVOT POINT', 0, 0);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Radius of the barrel at a given height, by interpolating its profile. */
function barrelRadiusAt(y) {
  const pts = barrelProfile();
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (y >= a.y && y <= b.y) {
      const t = b.y === a.y ? 0 : (y - a.y) / (b.y - a.y);
      return a.x + (b.x - a.x) * t;
    }
  }
  return BARREL_R;
}

/**
 * Profile for a decal that hugs the barrel.
 *
 * The barrel is not a cone over this span — it curves from the taper into the
 * parallel section — so a straight cone shell dips under the surface in the
 * middle and the decal gets sliced in half by the bat it is supposed to sit
 * on. Sampling the barrel's own profile and offsetting it outward keeps the
 * shell proud everywhere. Samples are evenly spaced in y so the lathe's v
 * coordinate stays linear and the type is not stretched.
 */
function decalProfile(yFrom, yTo, offset, samples = 48) {
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const y = yFrom + (yTo - yFrom) * (i / samples);
    pts.push(new THREE.Vector2(barrelRadiusAt(y) + offset, y));
  }
  return pts;
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

  // Three nested groups, because the spin and the lean must not be the same
  // rotation. Applied to one object, a Y spin on top of a Z lean sweeps the
  // bat around a cone and swings the barrel out of frame. Nested, `spinner`
  // turns the bat about its own long axis inside a `bat` group that holds the
  // lean — so the silhouette never changes and the whole bat stays in shot.
  //
  //   bat      lean (pointer) + slow float
  //   └ spinner   turntable rotation about the bat's own axis
  //     └ pivot     recentres the 0..33 model on the origin
  const bat = new THREE.Group();
  const spinner = new THREE.Group();
  const pivot = new THREE.Group();
  pivot.position.y = -PIVOT_Y;
  spinner.add(pivot);
  bat.add(spinner);

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

  // Accent band on the taper. Radii are taken from the barrel profile at this
  // height and nudged out, so it sits proud along its whole length instead of
  // sinking into the cone.
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(1.09, 1.045, 0.7, 96, 1, true),
    bandMat
  );
  band.position.y = 22.8;

  // Wordmark shells over the barrel — see brandTexture().
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  function decalMaterial(variant) {
    const mat = new THREE.MeshStandardMaterial({
      map: brandTexture(variant),
      transparent: true,
      roughness: 0.42,
      metalness: 0.06,
      depthWrite: false,
    });
    mat.map.anisotropy = maxAniso;
    return mat;
  }

  // A partial cylinder, not a full one. Wrapped all the way round, the cap
  // height of the type spans ~93 degrees of circumference and the letters
  // curve out of sight; across a 99-degree arc they sit almost flat, the way
  // a decal does on a real barrel. Centred on theta = 0, which faces +Z —
  // so a spin of 0 puts the wordmark straight at the camera.
  const BRAND_ARC = Math.PI * 0.62;
  const decalGeo = new THREE.LatheGeometry(
    decalProfile(24.9, 30.4, 0.022), 64, -BRAND_ARC / 2, BRAND_ARC
  );

  const brand = new THREE.Mesh(decalGeo, decalMaterial('main'));

  const brandAlt = new THREE.Mesh(decalGeo, decalMaterial('alt'));
  brandAlt.rotation.y = Math.PI;

  pivot.add(grip, barrel, band, brand, brandAlt);
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
  const FIT_H = 40;
  const FIT_W = 22;
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
    if (!anchors.length) return;
    for (const a of anchors) {
      projected.copy(a.point).applyMatrix4(spinner.matrixWorld).project(camera);
      const behind = projected.z > 1;
      a.el.style.transform =
        'translate(-50%,-50%) translate(' +
        ((projected.x * 0.5 + 0.5) * w).toFixed(1) + 'px,' +
        ((-projected.y * 0.5 + 0.5) * h).toFixed(1) + 'px)';
      a.el.style.opacity = behind ? '0' : '1';
    }
  }

  /* --- Motion ----------------------------------------------------------
   * Everything is per second, not per frame. A fixed increment per frame
   * runs at double speed on a 120Hz phone and jumps after a tab has been
   * backgrounded; timing it off the rAF clock makes the turntable identical
   * everywhere, which is most of what "smooth" actually means here.
   */
  // Only a slight tilt toward the camera: more than this and perspective
  // drops the knob end out of the bottom of the frame.
  const REST_X = 0.06, REST_Z = -0.30;
  const SPIN_RATE = 0.78;                // rad/s — a full turn every ~8s
  const DAMP = 6;                        // settle rate for pointer follow
  const FLOAT_AMP = 0.5;                 // gentle vertical drift, world units
  const FLOAT_RATE = 0.42;

  // Start with the wordmark facing the viewer rather than hidden round the
  // back, so the section looks right the moment it appears.
  let spin = typeof opts.spin === 'number' ? opts.spin : 0;
  let elapsed = 0;
  let targetX = REST_X, targetZ = REST_Z;
  let curX = REST_X, curZ = REST_Z;
  let scrollTurn = 0, scrollTarget = 0;
  let running = false, frame = 0, last = 0;
  const idle = opts.idle !== false;

  function onPointer(e) {
    const r = container.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 2 - 1;
    const py = ((e.clientY - r.top) / r.height) * 2 - 1;
    // Kept modest: a big lean shortens the bat on screen and costs the fit.
    targetX = REST_X + py * 0.24;
    targetZ = REST_Z - px * 0.26;
  }

  function onLeave() { targetX = REST_X; targetZ = REST_Z; }

  function onScroll() {
    const r = container.getBoundingClientRect();
    const mid = (r.top + r.height / 2) / window.innerHeight;  // 1 → 0 passing up
    scrollTarget = (0.5 - mid) * 1.6;
  }

  function tick(now) {
    if (!running) return;
    frame = requestAnimationFrame(tick);

    // Clamped so a backgrounded tab resumes instead of snapping forward.
    const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
    last = now;
    elapsed += dt;

    // Frame-rate independent exponential smoothing.
    const k = 1 - Math.exp(-DAMP * dt);

    if (idle) spin += SPIN_RATE * dt;
    scrollTurn += (scrollTarget - scrollTurn) * k;
    curX += (targetX - curX) * k;
    curZ += (targetZ - curZ) * k;

    spinner.rotation.y = spin + scrollTurn;
    bat.rotation.x = curX;
    bat.rotation.z = curZ;
    bat.position.y = Math.sin(elapsed * FLOAT_RATE) * FLOAT_AMP;
    bat.updateMatrixWorld();

    renderer.render(scene, camera);
    placeHotspots();
  }

  function start() {
    if (running) return;
    running = true;
    resize();
    onScroll();
    // Reset the clock, or the first frame after a pause gets a stale delta.
    last = performance.now();
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
