/*:
 * @target MZ
 * @plugindesc SkyShaderで青空＋雲＋太陽を描画するサンプル（RPGツクールMZ用）
 * @author ミツキ
 *
 * @help
 * このプラグインはThree.jsのSkyクラスを使用して、
 * 空をリアルに描画します。
 */

(() => {
class SkyManager {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.sky = null;
    this.sun = new THREE.Vector3();
    this.clouds = null;
    this.rain = null;
    this.stars = null;
    this.fireflies = null;
    this.pmremGenerator = null;
  }

  initialize() {
    if (!THREE.Sky) {
      console.error("[SkyManager] THREE.Sky が存在しません！");
      return;
    }

    // 月の作成
    this.createMoon();
    console.log("▶ createMoon 呼び出し");

    // Sky作成
    this.sky = new THREE.Sky();
    this.sky.scale.setScalar(450000);
    this.scene.add(this.sky);

    // 大気パラメータ
    const uniforms = this.sky.material.uniforms;
    uniforms['turbidity'].value = 15;
    uniforms['rayleigh'].value = 1;
    uniforms['mieCoefficient'].value = 0.01;
    uniforms['mieDirectionalG'].value = 0.9;

    // 太陽の初期位置（高度10度、方位180度）
    this.sun.setFromSphericalCoords(1,
      THREE.MathUtils.degToRad(80),
      THREE.MathUtils.degToRad(180)
    );
    uniforms['sunPosition'].value.copy(this.sun);

    // トーンマッピング
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;

    // PMREM（Skyを反映した環境マップを生成）
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    const envMap = this.pmremGenerator.fromScene(this.sky).texture;
    this.scene.environment = envMap;

    console.log("[SkyManager] 空と環境光を初期化しました");
  }

updateSunPosition(hour) {
  if (!this.sky) return;

  const uniforms = this.sky.material.uniforms;

  const theta = THREE.MathUtils.degToRad((hour / 24) * 360);
  const phi = THREE.MathUtils.degToRad(90 - Math.cos((hour - 12) / 12 * Math.PI) * 90);

  this.sun.setFromSphericalCoords(1, phi, theta);
  uniforms['sunPosition'].value.copy(this.sun);

  // 🌙 自然な明るさに補間
  this.renderer.toneMappingExposure = this.getSmoothExposure(hour);

  const envMap = this.pmremGenerator.fromScene(this.sky).texture;
  this.scene.environment = envMap;
}

  createMoon() {
    const textureLoader = new THREE.TextureLoader();
    const moonTexture = textureLoader.load("3D/image/fullMoon.png"); // ← テクスチャ準備要

    const material = new THREE.SpriteMaterial({
      map: moonTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    });

    this._moon = new THREE.Sprite(material);
    this._moon.scale.set(125, 125, 1); // 固定サイズ

    this.scene.add(this._moon);
  }

  updateMoonPosition(hour) {
    if (!this._moon) return;

    const moonHour = (hour + 12) % 24;

    const theta = THREE.MathUtils.degToRad((moonHour / 24) * 360);
    const phi = THREE.MathUtils.degToRad(90 - Math.cos((moonHour - 12) / 12 * Math.PI) * 90);

    const pos = new THREE.Vector3();
    pos.setFromSphericalCoords(1, phi, theta);

    this._moon.position.copy(pos.multiplyScalar(1000));
  }

getSmoothExposure(hour) {
  // 朝（4:00〜6:00） 0.05 → 0.6（以前より抑えめ）
  if (hour >= 4 && hour < 6) {
    const t = (hour - 4) / 2;
    return this._lerp(0.05, 0.6, t);
  }

  // 昼（6:00〜16:00） 一定値（以前の0.9 → 0.6）
  if (hour >= 6 && hour < 16) {
    return 0.6;
  }

  // 夕（16:00〜18:00） 0.6 → 0.05
  if (hour >= 16 && hour < 18) {
    const t = (hour - 16) / 2;
    return this._lerp(0.6, 0.05, t);
  }

  // 夜間（18:00〜4:00）暗く固定
  return 0.2;
}

_lerp(a, b, t) {
  return a + (b - a) * t;
}

// 雲の初期化メソッド
initCloudEffect({
  groupCount = 10,
  cloudPerGroup = 30,
  spread = 10,
  size = 10.0,
  heightMin = 80,
  heightMax = 110
} = {}) {
  const cloudGroup = new THREE.Group();

  for (let g = 0; g < groupCount; g++) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(cloudPerGroup * 3);

    for (let i = 0; i < cloudPerGroup; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = (Math.random() - 0.5) * (spread * 0.5);
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: size,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });

    const cloud = new THREE.Points(geometry, material);
    cloud.position.set(
      Math.random() * 500 - 250,
      Math.random() * (heightMax - heightMin) + heightMin,
      Math.random() * 500 - 250
    );

    cloudGroup.add(cloud);
  }

  this.clouds = cloudGroup;
  this.scene.add(this.clouds);

  console.log("[SkyManager] 雲エフェクト初期化完了");
}

// 雲の更新メソッド
updateCloudEffect(speed = 0.01) {
  if (!this.clouds) return;

  this.clouds.children.forEach(cloud => {
    cloud.position.x += speed;
    if (cloud.position.x > 250) cloud.position.x = -250;
  });
}

  initRainEffect(count = 10000) {
    const rainGeometry = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      rainPositions[i * 3 + 0] = Math.random() * 200 - 100;
      rainPositions[i * 3 + 1] = Math.random() * 100 + 50;
      rainPositions[i * 3 + 2] = Math.random() * 200 - 100;
    }

    rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

    const rainMaterial = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.2,
      transparent: true,
      opacity: 0.6,
    });

    this.rain = new THREE.Points(rainGeometry, rainMaterial);
    this.scene.add(this.rain);

    console.log("[SkyManager] 雨エフェクト初期化完了");
  }

  updateRain() {
    if (!this.rain) return;

    const positions = this.rain.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {
      positions[i] -= 1;
      if (positions[i] < 0) positions[i] = 100;
    }
    this.rain.geometry.attributes.position.needsUpdate = true;
  }

  // 星初期化
  initStarEffect(starCount = 1000) {
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starOpacities = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3 + 0] = Math.random() * 300 - 150; // X
      starPositions[i * 3 + 1] = Math.random() * 100 + 50;  // Y
      starPositions[i * 3 + 2] = Math.random() * 300 - 150; // Z
      starOpacities[i] = Math.random() * 0.5 + 0.5;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('opacity', new THREE.BufferAttribute(starOpacities, 1));

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
    });

    this.stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.stars);

    console.log("[SkyManager] 星エフェクト初期化完了");
  }

  updateStarEffect() {
    if (!this.stars) return;

    const time = performance.now() * 0.001;
    const opacities = this.stars.geometry.attributes.opacity.array;
    const material = this.stars.material;

    let avgOpacity = 0;
    for (let i = 0; i < opacities.length; i++) {
      opacities[i] = 0.5 + Math.sin(time + i) * 0.3;
      avgOpacity += opacities[i];
    }

    avgOpacity /= opacities.length;
    material.opacity = avgOpacity;

    this.stars.geometry.attributes.opacity.needsUpdate = true;
  }

  // 蛍初期化
  initFireflyEffect(fireflyCount = 100) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(fireflyCount * 3);
  const phases = new Float32Array(fireflyCount);

  for (let i = 0; i < fireflyCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = Math.random() * 5 + 1;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    phases[i] = Math.random() * Math.PI * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

  const material = new THREE.PointsMaterial({
    color: 0x88ff88,
    size: 0.2,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });

  this.fireflies = new THREE.Points(geometry, material);
  this.scene.add(this.fireflies);

  console.log("[SkyManager] ホタルエフェクト初期化完了");
}

updateFireflyEffect() {
  if (!this.fireflies) return;

  const time = performance.now() * 0.001;
  const positions = this.fireflies.geometry.attributes.position.array;
  const phases = this.fireflies.geometry.attributes.phase.array;

  for (let i = 0; i < phases.length; i++) {
    const idx = i * 3;
    positions[idx + 1] += Math.sin(time + phases[i]) * 0.005;
    positions[idx + 0] += Math.cos(time + phases[i]) * 0.002;
    positions[idx + 2] += Math.sin(time * 0.5 + phases[i]) * 0.002;
  }

  const flicker = 0.5 + Math.sin(time * 2) * 0.3;
  this.fireflies.material.opacity = flicker;

  this.fireflies.geometry.attributes.position.needsUpdate = true;
}
}

// グローバル登録：Scene_Mapから使えるように
Scene_Map.prototype.createSkyManager = function () {
  this._skyManager = new SkyManager(this._threeScene, this._threeRenderer);
  this._skyManager.initialize();
  // this._skyManager.initRainEffect();
};

Scene_Map.prototype.updateSkyManager = function () {
  if (!this._skyManager) return;
  const time = $gameSystem.getSurvivalTime();
  const hour = time.hour + time.minute / 60;
  this._skyManager.updateSunPosition(hour);
  this._skyManager.updateMoonPosition(hour);
  // this._skyManager.updateRain();
};

///////////////////////////////////////////////////////////////////////////////////////////
// コンパスの設定 //////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////


class Direction3D {
  // Z+ 北 / Z- 南 / X+ 東 / X- 西
  static NORTH = new THREE.Vector3(0, 0, 1);
  static SOUTH = new THREE.Vector3(0, 0, -1);
  static EAST = new THREE.Vector3(1, 0, 0);
  static WEST = new THREE.Vector3(-1, 0, 0);

  // 任意の角度から方向ベクトルを取得（度）
  static fromAzimuth(deg) {
    const rad = THREE.MathUtils.degToRad(deg);
    return new THREE.Vector3(Math.sin(rad), 0, Math.cos(rad)).normalize();
  }

  // ベクトルから最も近い方角名を取得（誤差±45度）
  static getDirectionName(vec3) {
    const angle = Math.atan2(vec3.x, vec3.z); // atan2(x, z)
    const deg = (THREE.MathUtils.radToDeg(angle) + 360) % 360;

    if (deg >= 45 && deg < 135) return "EAST";
    if (deg >= 135 && deg < 225) return "SOUTH";
    if (deg >= 225 && deg < 315) return "WEST";
    return "NORTH";
  }
}

Scene_Map.prototype._createDirectionDisplay = function () {
  if (document.getElementById('direction-display')) return;

  const div = document.createElement('div');
  div.id = 'direction-display';
  div.style.position = 'absolute';
  div.style.top = '10px';
  div.style.right = '10px';
  div.style.color = 'white';
  div.style.fontSize = '20px';
  div.style.fontFamily = 'Arial, sans-serif';
  div.style.textShadow = '0 0 3px black';
  div.style.zIndex = 100;
  div.innerText = '方角: NORTH';
  document.body.appendChild(div);

  this._directionElement = div;
};

Scene_Map.prototype._updateDirectionDisplay = function (vec3) {
  if (!this._directionElement) return;
  const dir = Direction3D.getDirectionName(vec3);
  this._directionElement.innerText = `方角: ${dir}`;
};

Scene_Map.prototype._removeDirectionDisplay = function () {
  if (this._directionElement) {
    this._directionElement.remove();
    this._directionElement = null;
  }
};



})();


