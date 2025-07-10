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

  class TimeManager {
  constructor() {
    this._data = {
      hour: 6,
      minute: 0,
      second: 0,
      day: 1,
      accumulator: 0
    };
    this._initTimeDisplay();
  }

  _initTimeDisplay() {
    let div = document.getElementById('time-display');
    if (!div) {
      div = document.createElement('div');
      div.id = 'time-display';
      Object.assign(div.style, {
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: '#ffffff',
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        textShadow: '0 0 3px #000',
        zIndex: 20
      });
      document.body.appendChild(div);
    }
    this._timeElement = div;
  }

  update() {
    const framesPerSecond = 60;
    const t = this._data;
    t.accumulator++;

    if (t.accumulator >= framesPerSecond) {
      t.accumulator = 0;
      t.second++;
      if (t.second >= 60) {
        t.second = 0;
        t.minute++;
        if (t.minute >= 60) {
          t.minute = 0;
          t.hour++;
          if (t.hour >= 24) {
            t.hour = 0;
            t.day++;
          }
        }
      }
    }

    this._refreshDisplay();
  }

  _refreshDisplay() {
    const t = this._data;
    const hh = String(t.hour).padStart(2, '0');
    const mm = String(t.minute).padStart(2, '0');
    const ss = String(t.second).padStart(2, '0');
    const dd = t.day;

    this._timeElement.innerHTML = `
      <strong>${dd}日目</strong><br>
      時刻: ${hh}:${mm}:${ss}<br><br>
      <strong>操作説明</strong><br>
      WASDで移動 / Shiftでダッシュ<br>
      Spaceでジャンプ / Tabでインベントリ<br>
      EscとTabでロック解除
    `;
  }

  get hour() {
    return this._data.hour;
  }

  terminate() {
    if (this._timeElement) {
      this._timeElement.remove();
      this._timeElement = null;
    }
  }
}

  ///////////////////////////////////////////////////////////////////////////////////////////
  // 空の設定 /////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////

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
      this.timeManager = new TimeManager();
    }

    initialize() {
      if (!THREE.Sky) {
        console.error("[SkyManager] THREE.Sky が存在しません！");
        return;
      }

      // 月の作成
      this.createMoon();

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
      const weather = $gameSystem.weatherType();
      const factor = this._weatherLightFactor(weather); // ← 天候による光の係数

      let baseExposure;

      // 朝（4:00〜6:00） 0.05 → 0.6（以前より抑えめ）
      if (hour >= 4 && hour < 6) {
        const t = (hour - 4) / 2;
        baseExposure = this._lerp(0.05, 0.6, t);
      }
      // 昼（6:00〜16:00）一定
      else if (hour >= 6 && hour < 16) {
        baseExposure = 0.6;
      }
      // 夕（16:00〜18:00）0.6 → 0.05
      else if (hour >= 16 && hour < 18) {
        const t = (hour - 16) / 2;
        baseExposure = this._lerp(0.6, 0.05, t);
      }
      // 夜間（18:00〜4:00）暗く固定
      else {
        baseExposure = 0.2;
      }

      // ⭐ 天候による明るさ調整
      return baseExposure * factor;
    }

    _lerp(a, b, t) {
      return a + (b - a) * t;
    }

    _weatherLightFactor(weather) {
      switch (weather) {
        case 'clear': return 1.0;
        case 'fine':  return 0.9;
        case 'cloudy': return 0.6;
        case 'rain':  return 0.4; // ☔ 雨はさらに暗く
        default: return 1.0;
      }
    }

    // 雲の初期化メソッド
    /**
     * 雲を生成してシーンに追加する（パラメータで晴れ／曇りを切り替え可能）
     * @param {Object} options - 雲生成のオプション
     * @param {number} options.groupCount - 雲のグループ数
     * @param {number} options.cloudPerGroup - グループ内の粒数
     * @param {number} options.spread - 各雲グループ内の広がり
     * @param {number} options.size - 雲粒のサイズ
     * @param {number} options.opacity - 雲の透明度
     * @param {number} options.heightMin - 雲の高さ最小値
     * @param {number} options.heightMax - 雲の高さ最大値
     * @param {string} options.color - 雲の色（例："#ffffff"）
     */
    initCloudEffect({
      groupCount = 10,
      cloudPerGroup = 30,
      spread = 10,
      size = 10,
      opacity = 0.4,
      heightMin = 80,
      heightMax = 110,
      color = 0xffffff
    } = {}) {
      if (this.clouds) {
        this.scene.remove(this.clouds);
        this.clouds = null;
      }

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
          color: color,
          size: size,
          transparent: true,
          opacity: opacity,
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
    }


    // 雲の更新メソッド
    updateCloudEffect(speed = 0.01) {
      if (!this.clouds) return;

      this.clouds.children.forEach(cloud => {
        cloud.position.x += speed;
        if (cloud.position.x > 250) cloud.position.x = -250;
      });
    }

    /**
     * 雲の表示／非表示と種類（fine/cloudy）を切り替える
     * @param {boolean} visible - 表示するか
     * @param {string} [type] - 雲の種類：'fine' または 'cloudy'
     */
    setCloudVisibility(visible, type = 'fine') {
      if (visible) {
        // すでに雲がある場合は削除して置き換え
        if (this.clouds) {
          this.scene.remove(this.clouds);
          this.clouds = null;
        }

        if (type === 'fine') {
          this.initCloudEffect({
            groupCount: 10,
            cloudPerGroup: 30,
            spread: 20,
            size: 15,
            opacity: 0.3,
            heightMin: 80,
            heightMax: 110,
            color: 0xffffff
          });
        } else if (type === 'cloudy') {
          this.initCloudEffect({
            groupCount: 100,
            cloudPerGroup: 30,
            spread: 30,
            size: 30,
            opacity: 0.6,
            heightMin: 80,
            heightMax: 100,
            color: 0x888888
          });
        } else {
          console.warn(`[SkyManager] 不明な雲タイプ: ${type}`);
        }
      } else {
        // 非表示にする場合
        if (this.clouds) {
          this.scene.remove(this.clouds);
          this.clouds = null;
        }
      }
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

      setRainActive(active) {
        if (active && !this.rain) {
          this.initRainEffect();
        } else if (!active && this.rain) {
          this.scene.remove(this.rain);
          this.rain = null;
        }
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

  // // グローバル登録：Scene_Mapから使えるように
  // Scene_Map.prototype.createSkyManager = function () {
  //   this._skyManager = new SkyManager(this._threeScene, this._threeRenderer);
  //   this._skyManager.initialize();
  // };

  ///////////////////////////////////////////////////////////////////////////////////////////
  // 天候の設定 /////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////

  class WeatherManager {
    constructor(skyManager) {
      this.skyManager = skyManager;
      this._current = null;
    }

    update() {
      const type = $gameSystem.weatherType();
      if (type !== this._current) {
        this._current = type;
        this._applyWeather(type);
      }
    }

    _applyWeather(type) {
      if (type === 'clear') {
        this.skyManager.setCloudVisibility(false);
      } 
      else if (type === 'fine') {
        this.skyManager.setCloudVisibility(false);
        this.skyManager.setCloudVisibility(true, 'fine');
      } 
      else if (type === 'cloudy') {
        this.skyManager.setCloudVisibility(false);
        this.skyManager.setCloudVisibility(true, 'cloudy');
      }
      else if (type === 'rain') {
        this.skyManager.setCloudVisibility(false);
        this.skyManager.setCloudVisibility(true, 'cloudy');
        this.skyManager.setRainActive(true);
      }
    }


    setCloudVisibility(visible) {
      if (visible && !this.clouds) this._createLightClouds();
      if (!visible && this.clouds) {
        this.scene.remove(this.clouds);
        this.clouds = null;
      }
    }

    setRainActive(active) {
      if (active && !this._rain) this._createRainEffect();
      if (!active && this._rain) {
        this.scene.remove(this._rain);
        this._rain = null;
      }
    }

  }


  // 初期化：createSkyManager の直後に追加
  Scene_Map.prototype.createWeatherManager = function () {
    this._weatherManager = new WeatherManager(this._threeScene);
    this._weatherManager.setWeather($gameSystem.weatherType()); // Game_Systemに保存された天気
  };

  // 更新：updateSkyManager の後に呼び出し
  Scene_Map.prototype.updateWeatherManager = function () {
    if (this._weatherManager) {
      this._weatherManager.update();
    }
  };

  Game_System.prototype.weatherType = function () {
    return this._weatherType || 'clear';
  };

  Game_System.prototype.setWeatherType = function (type) {
    this._weatherType = type;
  };

Game_System.prototype.decideRandomWeather = function () {
  // ⭐ デバッグスイッチと変数をチェック
  const isDebug = true; // デバッグスイッチ ON のとき
  const override = 'rain'; // 手動で天候文字列を代入

  const valid = ['clear', 'fine', 'cloudy', 'rain'];

  let weather;

  if (isDebug && valid.includes(override)) {
    weather = override;
  } else {
    const r = Math.random();
    if (r < 0.2) weather = 'clear';
    else if (r < 0.4) weather = 'fine';
    else if (r < 0.7) weather = 'cloudy';
    else weather = 'rain'; // ← 追加：30% のうちの一部が雨
    console.log(`[Weather] ランダム天候決定: ${weather}`);
  }

  this.setWeatherType(weather);
};

  ///////////////////////////////////////////////////////////////////////////////////////////
  // 空のまとめ /////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////

  class SkyController {
    constructor(scene, renderer) {
      this.scene = scene;
      this.renderer = renderer;
      this._skyManager = new SkyManager(scene, renderer);
      this._weatherManager = new WeatherManager(this._skyManager);
      this._timeManager = new TimeManager();
    }

    initialize() {
      $gameSystem.decideRandomWeather();       // ← ★先に天候を決定！

      this._skyManager.initialize();           // ← 雲はまだ出さない
      this._weatherManager.update();           // ← 状態に応じて雲だけ出す
    }


    update() {
      this._timeManager.update(); // ← ここで戻り値を使ってないので変数不要
      const hour = this._timeManager.hour;
      this._skyManager.updateSunPosition(hour);
      this._skyManager.updateMoonPosition(hour);
      this._weatherManager.update(); // 状態が変わっていれば反映
      this._skyManager.updateCloudEffect();
      this._skyManager.updateRain();
    }
  }

  // 初期化
  Scene_Map.prototype.createSkyController = function () {
    this._skyController = new SkyController(this._threeScene, this._threeRenderer);
    this._skyController.initialize();
  };

  // 更新
  Scene_Map.prototype.updateSkyController = function () {
    if (this._skyController) {
      this._skyController.update();
    }
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

  ///////////////////////////////////////////////////////////////////////////////////////////
  // その他の設定 ///////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////

  // デフォルトのメニュー画面無効化
  const _Scene_Map_callMenu = Scene_Map.prototype.callMenu;
  Scene_Map.prototype.callMenu = function() {
      if ($gameSwitches.value(1)) {
          // 3Dシーンのときはメニューを無効化する
          return;
      }

      // それ以外は通常通り
      _Scene_Map_callMenu.call(this);
  };

    Scene_Map.prototype.createCrosshair = function() {
    const crosshair = document.createElement('div');
    crosshair.id = 'crosshair';
    crosshair.style.position = 'absolute';
    crosshair.style.top = '50%';
    crosshair.style.left = '50%';
    crosshair.style.width = '8px';
    crosshair.style.height = '8px';
    crosshair.style.marginLeft = '-4px'; // 中央に合わせる
    crosshair.style.marginTop = '-4px';  // 中央に合わせる
    crosshair.style.backgroundColor = 'white';
    crosshair.style.borderRadius = '50%';
    crosshair.style.zIndex = '20';
    document.body.appendChild(crosshair);
};

})();


