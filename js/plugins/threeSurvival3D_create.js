/*:
 * @target MZ
 * @plugindesc createとupdateとterminateがメインです
 * @author サラ
 * @help
 * このプラグインは3D描画のメインプログラムです
 * 
 * 
 */

(() => {

  // const loaderPath = "js/libs/GLTFLoader.bundle.js";
  // const loadGLTFLoader = () => {
  //   return new Promise((resolve, reject) => {
  //     const script = document.createElement("script");
  //     script.src = loaderPath;
  //     script.onload = () => {
  //       if (typeof GLTFLoader === "function") {
  //         THREE.GLTFLoader = GLTFLoader(THREE);
  //       }
  //       resolve();
  //     };
  //     script.onerror = reject;
  //     document.body.appendChild(script);
  //   });
  // };


  // Three.jsの基本初期化だけをする関数
  const initThreeEnvironment = async function () {
    // await loadGLTFLoader(); // 必要なライブラリロード（将来他にも使うため）

    // Three.jsレンダラー作成
    this._threeRenderer = new THREE.WebGLRenderer({ alpha: true });
    this._threeRenderer.setSize(Graphics.width, Graphics.height);
    this._threeRenderer.domElement.style.position = 'absolute';
    this._threeRenderer.domElement.style.zIndex = 10;
    document.body.appendChild(this._threeRenderer.domElement);

    // Three.jsシーン作成
    this._threeScene = new THREE.Scene();

    // Three.jsカメラ作成
    this._threeCamera = new THREE.PerspectiveCamera(
      60,
      Graphics.width / Graphics.height,
      0.1,
      1000
    );
    this._threeCamera.position.set(0, 1, 5);

    // 環境光と方向ライトを追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);

    this._threeScene.add(ambientLight, directionalLight);
  };



  const _Scene_Map_create = Scene_Map.prototype.create;
  Scene_Map.prototype.create = async function () {
    _Scene_Map_create.call(this);

    this._groundTiles = new Set();

    const threeDSwitch = $gameSwitches.value(1);
    if (threeDSwitch) {
      await initThreeEnvironment.call(this); // まず環境を作る

      this.playerCreate();

      this.loadEXRSky();
      this.createGround();

      this.createBranch(2, 2);
      this.createAcorn(3, 3);


      this._createTimeDisplay();
      // モデル読み込みとかは別にする

      this.hudCreate();

      this.createCrosshair();



    }
  };

  const _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function () {
    _Scene_Map_update.call(this);

    if (this._threeRenderer && this._threeScene && this._threeCamera) {
      this._threeRenderer.render(this._threeScene, this._threeCamera);
    }

    if ($gameSwitches.value(1) && !this._skyInitialized && this._threeScene && this._threeRenderer) {
      // this.initSkyShader();
      // this.initRainEffect();    // 雨初期化
      // this.initSnowEffect();    // 雪初期化
      // this.initFireEffect();    // 炎初期化
      // this.initStarEffect();    // 星初期化
      // this.initFireflyEffect(); // 蛍初期化
      // this.initCloudEffect();   // 雲初期化

      this._skyInitialized = true;
      
    }

    this.playerUpdate(); // ← FPSの移動＆スタミナ減少

    this.hudUpdate();
    // 時間の表示
    this._updateGameTime();
    // this.hudUpdate();

    //if (Input.isTriggered('tab')) this.inventory2DToggle();

    // if(this._rain) this.updateRain();    // 雨更新
    // if(this._snow) this.updateSnow();    // 雪更新
    // if(this._fire) this.updateFire();    // 炎更新
    // if(this._stars) this.updateStar();   // 星更新
    // if(this._fireflies) this.updateFirefly(); // 蛍更新
    // if(this._clouds) this.updateCloud(); // 雲更新
  };

  const _Scene_Map_terminate = Scene_Map.prototype.terminate;
  Scene_Map.prototype.terminate = function () {
    _Scene_Map_terminate.call(this);
    if (this._threeRenderer && this._threeRenderer.domElement) {
      document.body.removeChild(this._threeRenderer.domElement);
      this._threeRenderer.dispose();
    }
    // ★ Pointer Lockを解除
    if (document.exitPointerLock) document.exitPointerLock();
  };




})();
