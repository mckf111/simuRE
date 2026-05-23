import * as THREE from "three";
import "./styles.css";

const canvas = document.querySelector("#game-canvas");
const startOverlay = document.querySelector("#start-overlay");
const startButton = document.querySelector("#start-button");
const reticle = document.querySelector("#reticle");
const toast = document.querySelector("#toast");

const ui = {
  health: document.querySelector("#health-meter"),
  stamina: document.querySelector("#stamina-meter"),
  wave: document.querySelector("#wave-value"),
  threat: document.querySelector("#threat-value"),
  ammo: document.querySelector("#ammo-value"),
  reserve: document.querySelector("#reserve-value"),
  score: document.querySelector("#score-value"),
};

const arenaRadius = 42;
const playerRadius = 0.55;
const timer = new THREE.Timer();
timer.connect(document);
const tmpVector = new THREE.Vector3();
const tmpVectorB = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const aimRay = new THREE.Vector2(0.16, 0);

const state = {
  running: false,
  gameOver: false,
  wave: 1,
  waveBreak: 0,
  spawnTimer: 0,
  remainingToSpawn: 0,
  score: 0,
  toastTimer: 0,
  shake: 0,
};

const input = {
  keys: new Set(),
  aiming: false,
  lastMouseX: 0,
  lastMouseY: 0,
  hasMousePosition: false,
  mouseSensitivity: 0.0023,
};

const aim = {
  x: 0,
  y: 0,
  minMargin: 42,
};

const player = {
  position: new THREE.Vector3(0, 0, 10),
  velocity: new THREE.Vector3(),
  yaw: Math.PI,
  pitch: -0.08,
  health: 100,
  stamina: 100,
  ammo: 10,
  reserve: 30,
  maxAmmo: 10,
  reloadTimer: 0,
  meleeCooldown: 0,
  dodgeCooldown: 0,
  invulnerable: 0,
};

const supplies = [];
const enemies = [];
const enemyTargets = [];
const tracers = [];
const decals = [];

let audioContext;
let playerRig;
let weaponMuzzle;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0f0c);
scene.fog = new THREE.FogExp2(0x0a0f0c, 0.035);

const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 130);

const materials = {
  floor: new THREE.MeshStandardMaterial({ color: 0x24332b, roughness: 0.9, metalness: 0.02 }),
  wall: new THREE.MeshStandardMaterial({ color: 0x3d4335, roughness: 0.82 }),
  rust: new THREE.MeshStandardMaterial({ color: 0x8d3a29, roughness: 0.76, metalness: 0.04 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xc28a3e, roughness: 0.45, metalness: 0.22 }),
  fabric: new THREE.MeshStandardMaterial({ color: 0x405a4b, roughness: 0.88 }),
  enemy: new THREE.MeshStandardMaterial({ color: 0x7b2b2a, roughness: 0.85 }),
  enemyWeak: new THREE.MeshStandardMaterial({ color: 0xd88a3d, roughness: 0.55 }),
  black: new THREE.MeshStandardMaterial({ color: 0x0b0d0c, roughness: 0.7 }),
  supplyAmmo: new THREE.MeshStandardMaterial({ color: 0xd9a348, roughness: 0.5, emissive: 0x2d1700 }),
  supplyHealth: new THREE.MeshStandardMaterial({ color: 0x5aa174, roughness: 0.5, emissive: 0x06220d }),
  tracer: new THREE.LineBasicMaterial({ color: 0xffd990, transparent: true, opacity: 0.95 }),
  decal: new THREE.MeshBasicMaterial({ color: 0xf05b42, transparent: true, opacity: 0.8 }),
};

init();
animate();

function init() {
  resize();
  createLights();
  createArena();
  createPlayerRig();
  resetGame();
  bindEvents();
}

function createLights() {
  const hemi = new THREE.HemisphereLight(0x9bb89d, 0x251713, 1.2);
  scene.add(hemi);

  const moon = new THREE.DirectionalLight(0xc8d7bd, 2.3);
  moon.position.set(-14, 24, 10);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.left = -42;
  moon.shadow.camera.right = 42;
  moon.shadow.camera.top = 42;
  moon.shadow.camera.bottom = -42;
  scene.add(moon);

  const lampPositions = [
    [-18, 3.2, -14],
    [16, 3.2, -20],
    [-22, 3.2, 20],
    [20, 3.2, 18],
  ];

  for (const [x, y, z] of lampPositions) {
    const lamp = new THREE.PointLight(0xffae62, 4.2, 20, 2);
    lamp.position.set(x, y, z);
    lamp.castShadow = true;
    scene.add(lamp);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 3.4, 8), materials.black);
    post.position.set(x, 1.7, z);
    post.castShadow = true;
    scene.add(post);

    const shade = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.22, 0.78), materials.brass);
    shade.position.set(x, y, z);
    shade.castShadow = true;
    scene.add(shade);
  }
}

function createArena() {
  const floor = new THREE.Mesh(new THREE.CircleGeometry(arenaRadius, 96), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(arenaRadius * 2, 28, 0x5d6f5c, 0x334338);
  grid.position.y = 0.012;
  grid.material.opacity = 0.28;
  grid.material.transparent = true;
  scene.add(grid);

  const wallGeometry = new THREE.BoxGeometry(5.8, 3.6, 1.2);
  for (let i = 0; i < 24; i += 1) {
    const angle = (i / 24) * Math.PI * 2;
    const wall = new THREE.Mesh(wallGeometry, materials.wall);
    wall.position.set(Math.sin(angle) * arenaRadius, 1.8, -Math.cos(angle) * arenaRadius);
    wall.rotation.y = angle;
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
  }

  const obstacleGeometry = new THREE.BoxGeometry(3.2, 1.45, 1.6);
  const coverLayout = [
    [-12, -10, 0.45],
    [11, -12, -0.35],
    [-18, 7, -0.2],
    [18, 8, 0.65],
    [-6, 18, 0.1],
    [8, 17, -0.62],
    [0, -22, 0.28],
  ];

  for (const [x, z, rotation] of coverLayout) {
    const obstacle = new THREE.Mesh(obstacleGeometry, materials.rust);
    obstacle.position.set(x, 0.72, z);
    obstacle.rotation.y = rotation;
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    scene.add(obstacle);
  }

  for (let i = 0; i < 34; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 18 + Math.random() * 22;
    const grass = new THREE.Mesh(
      new THREE.ConeGeometry(0.25 + Math.random() * 0.24, 1.2 + Math.random() * 1.4, 5),
      materials.fabric,
    );
    grass.position.set(Math.sin(angle) * radius, 0.55, -Math.cos(angle) * radius);
    grass.rotation.y = Math.random() * Math.PI;
    grass.castShadow = true;
    scene.add(grass);
  }
}

function createPlayerRig() {
  playerRig = new THREE.Group();

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.75, 4, 10), materials.fabric);
  torso.position.y = 1.08;
  torso.castShadow = true;
  playerRig.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), materials.brass);
  head.position.y = 1.78;
  head.castShadow = true;
  playerRig.add(head);

  const coat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.92, 0.36), materials.black);
  coat.position.set(0, 1.08, 0.06);
  coat.castShadow = true;
  playerRig.add(coat);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.9), materials.brass);
  arm.position.set(0.4, 1.3, -0.32);
  arm.rotation.x = 0.16;
  arm.castShadow = true;
  playerRig.add(arm);

  const weapon = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 1.05), materials.black);
  weapon.position.set(0.52, 1.24, -0.88);
  weapon.castShadow = true;
  playerRig.add(weapon);

  weaponMuzzle = new THREE.Object3D();
  weaponMuzzle.position.set(0.52, 1.24, -1.45);
  playerRig.add(weaponMuzzle);

  scene.add(playerRig);
}

function bindEvents() {
  window.addEventListener("resize", resize);

  window.addEventListener("keydown", (event) => {
    input.keys.add(event.code);
    if (event.code === "KeyF") {
      meleeAttack();
    }
    if (event.code === "KeyR") {
      startReload();
    }
    if (event.code === "Space") {
      event.preventDefault();
      dodge();
    }
  });

  window.addEventListener("keyup", (event) => {
    input.keys.delete(event.code);
  });

  window.addEventListener("mousemove", (event) => {
    if (state.gameOver) {
      return;
    }

    setAimPosition(event.clientX, event.clientY);

    if (state.running) {
      if (input.aiming && input.hasMousePosition) {
        rotateView(event.clientX - input.lastMouseX, event.clientY - input.lastMouseY);
      }
      input.lastMouseX = event.clientX;
      input.lastMouseY = event.clientY;
      input.hasMousePosition = true;
    }
  });

  window.addEventListener("mousedown", (event) => {
    if (state.running && !state.gameOver) {
      input.lastMouseX = event.clientX;
      input.lastMouseY = event.clientY;
      input.hasMousePosition = true;
      setAimPosition(event.clientX, event.clientY);
    }

    if (event.button === 2) {
      input.aiming = true;
      reticle.classList.add("is-aiming");
    }

    if (event.button === 0) {
      shoot();
    }
  });

  window.addEventListener("mouseup", (event) => {
    if (event.button === 2) {
      input.aiming = false;
      reticle.classList.remove("is-aiming");
    }
  });

  window.addEventListener("contextmenu", (event) => event.preventDefault());
  window.addEventListener("blur", () => {
    input.hasMousePosition = false;
    input.aiming = false;
    reticle.classList.remove("is-aiming");
  });
  startButton.addEventListener("click", (event) => {
    event.stopPropagation();
    startGame();
  });

  startOverlay.addEventListener("click", () => {
    startGame();
  });
}

function startGame() {
  if (state.running && !state.gameOver) {
    return;
  }

  if (state.gameOver) {
    resetGame();
  }

  state.running = true;
  startOverlay.classList.add("is-hidden");
  startOverlay.setAttribute("aria-hidden", "true");
  canvas.focus?.({ preventScroll: true });
  ensureAudio();
}

function resetGame() {
  clearActors();
  Object.assign(state, {
    running: false,
    gameOver: false,
    wave: 1,
    waveBreak: 0,
    spawnTimer: 0,
    remainingToSpawn: 0,
    score: 0,
    toastTimer: 0,
    shake: 0,
  });
  Object.assign(player, {
    health: 100,
    stamina: 100,
    ammo: 10,
    reserve: 30,
    reloadTimer: 0,
    pendingReload: false,
    meleeCooldown: 0,
    dodgeCooldown: 0,
    invulnerable: 0,
  });
  startButton.textContent = "开始巡逻";
  startOverlay.setAttribute("aria-hidden", "false");
  player.position.set(0, 0, 10);
  player.velocity.set(0, 0, 0);
  player.yaw = Math.PI;
  player.pitch = -0.08;
  startWave(1);
  updateUi();
}

function clearActors() {
  for (const enemy of enemies) {
    scene.remove(enemy.group);
  }
  for (const supply of supplies) {
    scene.remove(supply.mesh);
  }
  for (const tracer of tracers) {
    scene.remove(tracer.line);
  }
  for (const decal of decals) {
    scene.remove(decal.mesh);
  }

  enemies.length = 0;
  supplies.length = 0;
  enemyTargets.length = 0;
  tracers.length = 0;
  decals.length = 0;
}

function startWave(wave) {
  state.wave = wave;
  state.remainingToSpawn = 3 + wave * 2;
  state.spawnTimer = 0.4;
  showToast(`第 ${wave} 波`);
}

function animate(timestamp) {
  requestAnimationFrame(animate);
  timer.update(timestamp);
  const dt = Math.min(timer.getDelta(), 0.05);

  if (state.running) {
    updateGame(dt);
  }

  updateCamera(dt);
  renderer.render(scene, camera);
}

function updateGame(dt) {
  updatePlayer(dt);
  updateEnemies(dt);
  updateSupplies(dt);
  updateProjectiles(dt);
  updateWave(dt);
  updateUi(dt);

  if (player.health <= 0 && !state.gameOver) {
    endGame();
  }
}

function updatePlayer(dt) {
  updateKeyboardLook(dt);

  const forward = getForward();
  const right = getRight();
  const move = tmpVector.set(0, 0, 0);

  if (input.keys.has("KeyW")) move.add(forward);
  if (input.keys.has("KeyS")) move.sub(forward);
  if (input.keys.has("KeyD")) move.add(right);
  if (input.keys.has("KeyA")) move.sub(right);

  const wantsSprint = input.keys.has("ShiftLeft") || input.keys.has("ShiftRight");
  const canSprint = wantsSprint && player.stamina > 4 && !input.aiming && move.lengthSq() > 0;
  const baseSpeed = input.aiming ? 3.1 : canSprint ? 7.1 : 4.65;

  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(baseSpeed);
    player.velocity.lerp(move, 1 - Math.pow(0.001, dt));
  } else {
    player.velocity.multiplyScalar(Math.pow(0.001, dt));
  }

  if (canSprint) {
    player.stamina = Math.max(0, player.stamina - 24 * dt);
  } else {
    player.stamina = Math.min(100, player.stamina + (input.aiming ? 13 : 22) * dt);
  }

  player.position.addScaledVector(player.velocity, dt);
  keepInsideArena(player.position);

  player.reloadTimer = Math.max(0, player.reloadTimer - dt);
  if (player.reloadTimer === 0 && player.pendingReload) {
    finishReload();
  }
  player.dodgeCooldown = Math.max(0, player.dodgeCooldown - dt);
  player.meleeCooldown = Math.max(0, player.meleeCooldown - dt);
  player.invulnerable = Math.max(0, player.invulnerable - dt);

  playerRig.position.copy(player.position);
  playerRig.rotation.y = player.yaw;
}

function updateEnemies(dt) {
  const forward = getForward();
  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const enemy = enemies[i];
    enemy.hitCooldown = Math.max(0, enemy.hitCooldown - dt);
    enemy.attackTimer = Math.max(0, enemy.attackTimer - dt);
    enemy.stun = Math.max(0, enemy.stun - dt);

    tmpVector.copy(player.position).sub(enemy.position);
    const distance = tmpVector.length();
    const direction = distance > 0.001 ? tmpVector.normalize() : tmpVector.set(0, 0, 1);

    if (enemy.stun <= 0) {
      const flank = Math.sin(performance.now() * 0.0014 + enemy.seed) * enemy.flank;
      tmpVectorB.set(-direction.z, 0, direction.x).multiplyScalar(flank);
      direction.add(tmpVectorB).normalize();
      enemy.position.addScaledVector(direction, enemy.speed * dt);
      keepInsideArena(enemy.position);
      enemy.group.lookAt(player.position.x, enemy.group.position.y, player.position.z);
    }

    enemy.group.position.copy(enemy.position);
    enemy.group.position.y = Math.sin(performance.now() * 0.006 + enemy.seed) * 0.04;

    if (distance < 1.25 && enemy.attackTimer <= 0) {
      enemy.attackTimer = 1.2;
      if (player.invulnerable <= 0) {
        const guarded = input.aiming && forward.dot(direction.clone().negate()) > 0.45;
        damagePlayer(guarded ? 8 : 16);
      }
    }

    if (enemy.health <= 0) {
      killEnemy(i, enemy);
    }
  }
}

function updateSupplies(dt) {
  for (let i = supplies.length - 1; i >= 0; i -= 1) {
    const supply = supplies[i];
    supply.life -= dt;
    supply.mesh.rotation.y += dt * 1.8;
    supply.mesh.position.y = 0.42 + Math.sin(performance.now() * 0.004 + supply.seed) * 0.1;

    const distance = supply.mesh.position.distanceTo(player.position);
    if (distance < 1.35) {
      if (supply.kind === "ammo") {
        player.reserve = Math.min(54, player.reserve + 10);
        showToast("弹药 +10");
      } else {
        player.health = Math.min(100, player.health + 28);
        showToast("生命 +28");
      }
      scene.remove(supply.mesh);
      supplies.splice(i, 1);
      playTone(360, 0.06, "triangle", 0.04);
      continue;
    }

    if (supply.life <= 0) {
      scene.remove(supply.mesh);
      supplies.splice(i, 1);
    }
  }
}

function updateProjectiles(dt) {
  for (let i = tracers.length - 1; i >= 0; i -= 1) {
    const tracer = tracers[i];
    tracer.life -= dt;
    tracer.line.material.opacity = Math.max(0, tracer.life * 8);
    if (tracer.life <= 0) {
      scene.remove(tracer.line);
      tracers.splice(i, 1);
    }
  }

  for (let i = decals.length - 1; i >= 0; i -= 1) {
    const decal = decals[i];
    decal.life -= dt;
    decal.mesh.material.opacity = Math.max(0, decal.life * 0.8);
    if (decal.life <= 0) {
      scene.remove(decal.mesh);
      decals.splice(i, 1);
    }
  }
}

function updateWave(dt) {
  if (state.remainingToSpawn > 0) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnEnemy();
      state.remainingToSpawn -= 1;
      state.spawnTimer = Math.max(0.42, 1.45 - state.wave * 0.08);
    }
    return;
  }

  if (enemies.length === 0) {
    state.waveBreak += dt;
    if (state.waveBreak > 2.5) {
      state.waveBreak = 0;
      player.reserve = Math.min(60, player.reserve + 8);
      startWave(state.wave + 1);
    }
  } else {
    state.waveBreak = 0;
  }
}

function updateCamera(dt) {
  const forward = getForward();
  const right = getRight();
  const shoulder = input.aiming ? 0.96 : 1.24;
  const distance = input.aiming ? 3.05 : 5.15;
  const height = input.aiming ? 1.58 : 1.82;

  const desired = tmpVector
    .copy(player.position)
    .addScaledVector(right, shoulder)
    .addScaledVector(forward, -distance);
  desired.y += height;

  if (state.shake > 0) {
    state.shake = Math.max(0, state.shake - dt * 6);
    desired.x += (Math.random() - 0.5) * state.shake * 0.26;
    desired.y += (Math.random() - 0.5) * state.shake * 0.16;
  }

  camera.position.lerp(desired, 1 - Math.pow(0.0001, dt));

  const lookAt = tmpVectorB
    .copy(player.position)
    .addScaledVector(forward, 10)
    .addScaledVector(right, input.aiming ? 1.35 : 1.1);
  lookAt.y += 1.45 + player.pitch * 3.2;
  camera.lookAt(lookAt);
}

function updateUi() {
  ui.health.style.transform = `scaleX(${Math.max(0, player.health) / 100})`;
  ui.stamina.style.transform = `scaleX(${player.stamina / 100})`;
  ui.wave.textContent = `${state.wave}`;
  ui.threat.textContent = `${enemies.length + state.remainingToSpawn}`;
  ui.ammo.textContent = player.pendingReload ? "--" : `${player.ammo}`;
  ui.reserve.textContent = `${player.reserve}`;
  ui.score.textContent = `${state.score}`;
}

function shoot() {
  if (!state.running || state.gameOver || player.reloadTimer > 0) {
    return;
  }

  if (player.ammo <= 0) {
    showToast("弹药耗尽");
    startReload();
    playTone(120, 0.05, "square", 0.03);
    return;
  }

  player.ammo -= 1;
  state.shake = Math.max(state.shake, input.aiming ? 0.18 : 0.3);
  playTone(95, 0.04, "sawtooth", 0.06);

  updateAimRay();
  raycaster.setFromCamera(aimRay, camera);
  const intersections = raycaster.intersectObjects(enemyTargets, true);
  const muzzlePosition = weaponMuzzle.getWorldPosition(new THREE.Vector3());
  let endPoint = raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, 60);

  if (intersections.length > 0) {
    const hit = intersections[0];
    endPoint = hit.point.clone();
    const enemy = findEnemyFromObject(hit.object);
    if (enemy) {
      const damage = hit.object.userData.weakPoint ? 85 : input.aiming ? 52 : 38;
      enemy.health -= damage;
      enemy.stun = Math.max(enemy.stun, 0.18);
      enemy.hitCooldown = 0.08;
      addImpact(hit.point);
      playTone(hit.object.userData.weakPoint ? 620 : 420, 0.04, "triangle", 0.04);
    }
  }

  addTracer(muzzlePosition, endPoint);

  if (player.ammo === 0) {
    showToast("弹药耗尽");
  }
}

function startReload() {
  if (player.pendingReload || player.reloadTimer > 0 || player.ammo === player.maxAmmo || player.reserve <= 0) {
    return;
  }

  player.pendingReload = true;
  player.reloadTimer = 1.15;
  showToast("装填中");
  playTone(260, 0.07, "triangle", 0.025);
}

function finishReload() {
  const needed = player.maxAmmo - player.ammo;
  const loaded = Math.min(needed, player.reserve);
  player.ammo += loaded;
  player.reserve -= loaded;
  player.pendingReload = false;
  playTone(340, 0.05, "triangle", 0.035);
}

function dodge() {
  if (!state.running || state.gameOver || player.dodgeCooldown > 0 || player.stamina < 32) {
    return;
  }

  const forward = getForward();
  const right = getRight();
  const direction = tmpVector.set(0, 0, 0);
  if (input.keys.has("KeyS")) direction.sub(forward);
  else direction.add(forward);
  if (input.keys.has("KeyA")) direction.sub(right);
  if (input.keys.has("KeyD")) direction.add(right);

  direction.normalize();
  player.velocity.addScaledVector(direction, 9.5);
  player.stamina -= 32;
  player.invulnerable = 0.35;
  player.dodgeCooldown = 0.82;
  state.shake = Math.max(state.shake, 0.18);
}

function meleeAttack() {
  if (!state.running || state.gameOver || player.meleeCooldown > 0 || player.stamina < 18) {
    return;
  }

  const forward = getForward();
  let hits = 0;
  player.meleeCooldown = 0.72;
  player.stamina = Math.max(0, player.stamina - 18);
  state.shake = Math.max(state.shake, 0.22);

  for (const enemy of enemies) {
    tmpVector.copy(enemy.position).sub(player.position);
    const distance = tmpVector.length();
    if (distance > 2.45 || distance < 0.001) {
      continue;
    }

    const direction = tmpVector.normalize();
    if (forward.dot(direction) < 0.35) {
      continue;
    }

    enemy.health -= 58;
    enemy.stun = Math.max(enemy.stun, 0.38);
    enemy.position.addScaledVector(direction, 1.25);
    keepInsideArena(enemy.position);
    hits += 1;
    addImpact(enemy.position.clone().setY(1.2));
  }

  showToast(hits > 0 ? "近战命中" : "挥空");
  playTone(hits > 0 ? 240 : 150, 0.07, "square", hits > 0 ? 0.055 : 0.03);
}

function damagePlayer(amount) {
  player.health = Math.max(0, player.health - amount);
  player.invulnerable = 0.5;
  state.shake = Math.max(state.shake, 0.48);
  showToast("受击");
  playTone(70, 0.1, "sawtooth", 0.06);
}

function spawnEnemy() {
  const angle = Math.random() * Math.PI * 2;
  const radius = arenaRadius - 3;
  const enemy = {
    position: new THREE.Vector3(Math.sin(angle) * radius, 0, -Math.cos(angle) * radius),
    health: 90 + state.wave * 12,
    speed: 1.9 + Math.min(1.5, state.wave * 0.14) + Math.random() * 0.35,
    attackTimer: Math.random() * 0.8,
    hitCooldown: 0,
    stun: 0,
    flank: 0.36 + Math.random() * 0.42,
    seed: Math.random() * 100,
    group: createEnemyMesh(),
  };

  enemy.group.position.copy(enemy.position);
  enemy.group.userData.enemy = enemy;
  scene.add(enemy.group);
  enemies.push(enemy);
}

function createEnemyMesh() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.9, 4, 10), materials.enemy);
  body.position.y = 1.02;
  body.castShadow = true;
  body.userData.enemyBody = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), materials.enemyWeak);
  head.position.y = 1.78;
  head.castShadow = true;
  head.userData.weakPoint = true;
  group.add(head);

  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.22, 0.24), materials.enemy);
  shoulder.position.y = 1.34;
  shoulder.castShadow = true;
  group.add(shoulder);

  enemyTargets.push(body, head, shoulder);
  return group;
}

function killEnemy(index, enemy) {
  state.score += 100 + state.wave * 15;
  if (Math.random() < 0.42) {
    spawnSupply(enemy.position, Math.random() < 0.68 ? "ammo" : "health");
  }

  removeEnemyTargets(enemy.group);
  scene.remove(enemy.group);
  enemies.splice(index, 1);
  playTone(190, 0.08, "triangle", 0.05);
}

function removeEnemyTargets(group) {
  group.traverse((child) => {
    const index = enemyTargets.indexOf(child);
    if (index >= 0) {
      enemyTargets.splice(index, 1);
    }
  });
}

function spawnSupply(position, kind) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.42, 0.72),
    kind === "ammo" ? materials.supplyAmmo : materials.supplyHealth,
  );
  mesh.position.copy(position);
  mesh.position.y = 0.42;
  mesh.castShadow = true;
  scene.add(mesh);
  supplies.push({ mesh, kind, life: 14, seed: Math.random() * 100 });
}

function addTracer(start, end) {
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const line = new THREE.Line(geometry, materials.tracer.clone());
  scene.add(line);
  tracers.push({ line, life: 0.12 });
}

function addImpact(position) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), materials.decal.clone());
  mesh.position.copy(position);
  mesh.castShadow = false;
  scene.add(mesh);
  decals.push({ mesh, life: 0.9 });
}

function findEnemyFromObject(object) {
  let current = object;
  while (current) {
    if (current.userData.enemy) {
      return current.userData.enemy;
    }
    current = current.parent;
  }
  return null;
}

function getForward() {
  return new THREE.Vector3(Math.sin(player.yaw), 0, -Math.cos(player.yaw)).normalize();
}

function rotateView(deltaX, deltaY) {
  const sensitivity = input.aiming ? input.mouseSensitivity * 0.55 : input.mouseSensitivity;
  player.yaw -= deltaX * sensitivity;
  player.pitch -= deltaY * sensitivity;
  player.pitch = THREE.MathUtils.clamp(player.pitch, -0.48, 0.38);
}

function setAimPosition(x, y) {
  aim.x = THREE.MathUtils.clamp(x, aim.minMargin, window.innerWidth - aim.minMargin);
  aim.y = THREE.MathUtils.clamp(y, aim.minMargin, window.innerHeight - aim.minMargin);
  updateReticle();
}

function resetAimPosition() {
  setAimPosition(window.innerWidth * 0.58, window.innerHeight * 0.5);
  input.lastMouseX = aim.x;
  input.lastMouseY = aim.y;
  input.hasMousePosition = false;
}

function updateReticle() {
  reticle.style.left = `${aim.x}px`;
  reticle.style.top = `${aim.y}px`;
}

function updateAimRay() {
  aimRay.set((aim.x / window.innerWidth) * 2 - 1, -(aim.y / window.innerHeight) * 2 + 1);
}

function updateKeyboardLook(dt) {
  const lookSpeed = input.aiming ? 1.2 : 1.8;

  if (input.keys.has("ArrowLeft")) {
    player.yaw += lookSpeed * dt;
  }
  if (input.keys.has("ArrowRight")) {
    player.yaw -= lookSpeed * dt;
  }
  if (input.keys.has("ArrowUp")) {
    player.pitch += lookSpeed * 0.6 * dt;
  }
  if (input.keys.has("ArrowDown")) {
    player.pitch -= lookSpeed * 0.6 * dt;
  }

  player.pitch = THREE.MathUtils.clamp(player.pitch, -0.48, 0.38);
}

function getRight() {
  return new THREE.Vector3(Math.cos(player.yaw), 0, Math.sin(player.yaw)).normalize();
}

function keepInsideArena(position) {
  const flatLength = Math.hypot(position.x, position.z);
  const limit = arenaRadius - playerRadius - 1.2;
  if (flatLength > limit) {
    position.x = (position.x / flatLength) * limit;
    position.z = (position.z / flatLength) * limit;
  }
}

function endGame() {
  state.gameOver = true;
  state.running = false;
  startButton.textContent = "重新部署";
  startOverlay.classList.remove("is-hidden");
  startOverlay.setAttribute("aria-hidden", "false");
  showToast("已倒下");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 820);
}

function ensureAudio() {
  try {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) {
      return;
    }

    if (!audioContext) {
      audioContext = new AudioContextConstructor();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume?.().catch(() => {});
    }
  } catch {
    audioContext = null;
  }
}

function playTone(frequency, duration, type, gain) {
  if (!audioContext) {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  volume.gain.value = gain;
  volume.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
  oscillator.connect(volume);
  volume.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  if (aim.x === 0 && aim.y === 0) {
    resetAimPosition();
  } else {
    setAimPosition(aim.x, aim.y);
  }
}
