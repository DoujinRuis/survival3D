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

Scene_Map.prototype.initSkyShader = function () {
  if (!THREE.Sky) {
    console.error("[SkyLoader] THREE.Sky が存在しません！");
    return;
  }

  // Skyオブジェクトの作成とシーンへの追加
  this._sky = new THREE.Sky();
  // スケール：空のドームの大きさ（プレイヤー視点から見える範囲）
  this._sky.scale.setScalar(450000);
  this._threeScene.add(this._sky);


  const uniforms = this._sky.material.uniforms;
  // シェーダーパラメータ（大気の性質）設定
  // turbidity（濁度）：大気中のちり・水蒸気の量 → 値を大きくすると曇り空に
  // rayleigh（レイリー散乱）：空の青さに関係 → 値が大きいと青空が濃くなる
  // mieCoefficient（ミー散乱量）：太陽の周囲の光のにじみ → 値が大きいと白く霞む
  // mieDirectionalG（ミー散乱の方向性）：太陽光の広がり → 0に近いとシャープ、1に近いと柔らかい

  uniforms['turbidity'].value = 15;
  uniforms['rayleigh'].value = 1;
  uniforms['mieCoefficient'].value = 0.01;
  uniforms['mieDirectionalG'].value = 0.9;


  const sun = new THREE.Vector3();
  // 太陽の位置（球面座標で指定）
  // - elevation: 高度（上空45度）
  // - azimuth: 方位（南側）
  sun.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 10), THREE.MathUtils.degToRad(180));
  uniforms['sunPosition'].value.copy(sun);

  // レンダリングの明るさ補正（トーンマッピングと露出）
  this._threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  // toneMappingExposure を上げると全体が明るく、下げると暗くなる
  this._threeRenderer.toneMappingExposure = 0.9;

  // PMREM: Sky の環境光を反映するための処理
  const pmremGenerator = new THREE.PMREMGenerator(this._threeRenderer);
  pmremGenerator.compileEquirectangularShader();
  this._threeScene.environment = null // pmremGenerator.fromScene(this._sky).texture;

};



// 雨初期化
Scene_Map.prototype.initRainEffect = function () {
  const rainCount = 10000;
  const rainGeometry = new THREE.BufferGeometry();
  const rainPositions = new Float32Array(rainCount * 3);

  for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3 + 0] = Math.random() * 200 - 100; // X
    rainPositions[i * 3 + 1] = Math.random() * 100 + 50;  // Y
    rainPositions[i * 3 + 2] = Math.random() * 200 - 100; // Z
  }

  rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

  const rainMaterial = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 0.2,
    transparent: true,
    opacity: 0.6,
  });

  this._rain = new THREE.Points(rainGeometry, rainMaterial);
  this._threeScene.add(this._rain);

  console.log("[RainEffect] 雨エフェクト初期化完了");
};

// 雨更新
Scene_Map.prototype.updateRain = function () {
  if (!this._rain) return;

  const positions = this._rain.geometry.attributes.position.array;
  for (let i = 1; i < positions.length; i += 3) {
    positions[i] -= 1; // Y座標（高さ）を下げる
    if (positions[i] < 0) {
      positions[i] = 100; // 下に行きすぎたらリセット
    }
  }
  this._rain.geometry.attributes.position.needsUpdate = true;
};

// 雪初期化
Scene_Map.prototype.initSnowEffect = function () {
  const snowCount = 5000;
  const snowGeometry = new THREE.BufferGeometry();
  const snowPositions = new Float32Array(snowCount * 3);

  for (let i = 0; i < snowCount; i++) {
    snowPositions[i * 3 + 0] = Math.random() * 200 - 100; // X
    snowPositions[i * 3 + 1] = Math.random() * 100 + 50;  // Y
    snowPositions[i * 3 + 2] = Math.random() * 200 - 100; // Z
  }

  snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));

  const snowMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,          // 雪は少し大きめ
    transparent: true,
    opacity: 0.8,
  });

  this._snow = new THREE.Points(snowGeometry, snowMaterial);
  this._threeScene.add(this._snow);

  console.log("[SnowEffect] 雪エフェクト初期化完了");
};

// 雪更新
Scene_Map.prototype.updateSnow = function () {
  if (!this._snow) return;

  const positions = this._snow.geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 1] -= 0.2; // Y軸をゆっくり落とす
    positions[i + 0] += Math.sin(performance.now() * 0.001 + i) * 0.01; // 横にふらふら動かす
    if (positions[i + 1] < 0) {
      positions[i + 1] = 100; // 下に行ったらリセット
    }
  }
  this._snow.geometry.attributes.position.needsUpdate = true;
};

// 炎パーティクル初期化
Scene_Map.prototype.initFireEffect = function () {
  const fireCount = 300;
  const fireGeometry = new THREE.BufferGeometry();
  const firePositions = new Float32Array(fireCount * 3);
  const fireSpeeds = new Float32Array(fireCount);

  for (let i = 0; i < fireCount; i++) {
    firePositions[i * 3 + 0] = (Math.random() - 0.5) * 1; // Xちょっとばらけ
    firePositions[i * 3 + 1] = 0;                         // Yは地面スタート
    firePositions[i * 3 + 2] = (Math.random() - 0.5) * 1; // Zちょっとばらけ

    fireSpeeds[i] = Math.random() * 0.01 + 0.01; // 上昇スピード
  }

  fireGeometry.setAttribute('position', new THREE.BufferAttribute(firePositions, 3));
  fireGeometry.setAttribute('speed', new THREE.BufferAttribute(fireSpeeds, 1));

  const fireMaterial = new THREE.PointsMaterial({
    color: 0xff6600,  // オレンジ色
    size: 0.2,
    transparent: true,
    opacity: 0.8,
  });

  this._fire = new THREE.Points(fireGeometry, fireMaterial);
  this._threeScene.add(this._fire);

  console.log("[FireEffect] 焚き火パーティクル初期化完了");
};

// 炎更新
Scene_Map.prototype.updateFire = function () {
  if (!this._fire) return;

  const positions = this._fire.geometry.attributes.position.array;
  const speeds = this._fire.geometry.attributes.speed.array;

  for (let i = 0; i < speeds.length; i++) {
    positions[i * 3 + 1] += speeds[i]; // 上昇させる

    if (positions[i * 3 + 1] > 2.0) {
      // 上に行きすぎたらリセット
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 0] = (Math.random() - 0.5) * 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1;
    }
  }
  this._fire.geometry.attributes.position.needsUpdate = true;
};

// 星初期化
Scene_Map.prototype.initStarEffect = function () {
  const starCount = 1000;
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starOpacities = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3 + 0] = Math.random() * 300 - 150; // X
    starPositions[i * 3 + 1] = Math.random() * 100 + 50;  // Y（空高く）
    starPositions[i * 3 + 2] = Math.random() * 300 - 150; // Z

    starOpacities[i] = Math.random() * 0.5 + 0.5; // 初期の明るさ
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('opacity', new THREE.BufferAttribute(starOpacities, 1));

  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true,
    opacity: 1.0,
    depthWrite: false, // 星は奥行き無視して常に見える
  });

  this._stars = new THREE.Points(starGeometry, starMaterial);
  this._threeScene.add(this._stars);

  console.log("[StarEffect] 星エフェクト初期化完了");
};

// 星更新
Scene_Map.prototype.updateStar = function () {
  if (!this._stars) return;

  const time = performance.now() * 0.001;
  const opacities = this._stars.geometry.attributes.opacity.array;
  const material = this._stars.material;

  // 時間によって輝きをチカチカさせる
  let avgOpacity = 0;
  for (let i = 0; i < opacities.length; i++) {
    opacities[i] = 0.5 + Math.sin(time + i) * 0.3; // -0.3～+0.3振動
    avgOpacity += opacities[i];
  }
  avgOpacity /= opacities.length;

  // 全体の平均でMaterialの透明度を軽く変える（ふわふわ感）
  material.opacity = avgOpacity;

  this._stars.geometry.attributes.opacity.needsUpdate = true;
};

// 蛍初期化
Scene_Map.prototype.initFireflyEffect = function () {
  const fireflyCount = 100;
  const fireflyGeometry = new THREE.BufferGeometry();
  const fireflyPositions = new Float32Array(fireflyCount * 3);
  const fireflyPhases = new Float32Array(fireflyCount); // 個別のチカチカ周期

  for (let i = 0; i < fireflyCount; i++) {
    fireflyPositions[i * 3 + 0] = (Math.random() - 0.5) * 20; // X周囲ランダム
    fireflyPositions[i * 3 + 1] = Math.random() * 5 + 1;       // Y地面から少し上
    fireflyPositions[i * 3 + 2] = (Math.random() - 0.5) * 20; // Z周囲ランダム

    fireflyPhases[i] = Math.random() * Math.PI * 2; // 個別フェーズ
  }

  fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));
  fireflyGeometry.setAttribute('phase', new THREE.BufferAttribute(fireflyPhases, 1));

  const fireflyMaterial = new THREE.PointsMaterial({
    color: 0x88ff88, // 黄緑色
    size: 0.2,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });

  this._fireflies = new THREE.Points(fireflyGeometry, fireflyMaterial);
  this._threeScene.add(this._fireflies);

  console.log("[FireflyEffect] ホタルエフェクト初期化完了");
};

// 蛍更新
Scene_Map.prototype.updateFirefly = function () {
  if (!this._fireflies) return;

  const time = performance.now() * 0.001;
  const positions = this._fireflies.geometry.attributes.position.array;
  const phases = this._fireflies.geometry.attributes.phase.array;

  for (let i = 0; i < phases.length; i++) {
    const baseIndex = i * 3;

    // 軽く上下に揺れる
    positions[baseIndex + 1] += Math.sin(time + phases[i]) * 0.005;

    // 左右にもふらふら漂う
    positions[baseIndex + 0] += Math.cos(time + phases[i]) * 0.002;
    positions[baseIndex + 2] += Math.sin(time * 0.5 + phases[i]) * 0.002;
  }

  // チカチカする（materialの透明度で全体調整）
  const intensity = 0.5 + Math.sin(time * 2) * 0.3; // -0.3～+0.3
  this._fireflies.material.opacity = intensity;

  this._fireflies.geometry.attributes.position.needsUpdate = true;
};

// 雲初期化
Scene_Map.prototype.initCloudEffect = function () {
  const cloudGroup = new THREE.Group(); // グループ作る！

  const groupCount = 10; // 10個くらいの雲の塊を作る
  for (let g = 0; g < groupCount; g++) {
    const cloudCount = 30; // 1グループに30粒くらい
    const cloudGeometry = new THREE.BufferGeometry();
    const cloudPositions = new Float32Array(cloudCount * 3);

    for (let i = 0; i < cloudCount; i++) {
      cloudPositions[i * 3 + 0] = (Math.random() - 0.5) * 10; // 10m以内で広げる
      cloudPositions[i * 3 + 1] = (Math.random() - 0.5) * 5;  // Yも少しばらける
      cloudPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    cloudGeometry.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3));

    const cloudMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 10.0,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });

    const cloud = new THREE.Points(cloudGeometry, cloudMaterial);

    // グループごとにランダム配置
    cloud.position.set(
      Math.random() * 500 - 250,
      Math.random() * 30 + 80,
      Math.random() * 500 - 250
    );

    cloudGroup.add(cloud);
  }

  this._clouds = cloudGroup;
  this._threeScene.add(this._clouds);

  console.log("[CloudEffect] 雲エフェクト初期化完了");
};

// 雲更新
Scene_Map.prototype.updateCloud = function () {
  if (!this._clouds) return;

  this._clouds.children.forEach(cloud => {
    cloud.position.x += 0.01; // それぞれの雲の塊を流す

    if (cloud.position.x > 250) {
      cloud.position.x = -250; // 端まで行ったら戻す
    }
  });
};


})();


