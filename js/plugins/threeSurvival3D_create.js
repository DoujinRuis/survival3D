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

  const loaderPath = "js/libs/GLTFLoader.bundle.js";
  const loadGLTFLoader = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = loaderPath;
      script.onload = () => {
        if (typeof GLTFLoader === "function") {
          THREE.GLTFLoader = GLTFLoader(THREE);
        }
        resolve();
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };


  // Three.jsの基本初期化だけをする関数
  const initThreeEnvironment = async function () {
    await loadGLTFLoader(); // 必要なライブラリロード（将来他にも使うため）

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

      this.createSkyController();
      this.createGround();
      this.hudCreate();
    }
  };

  const _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function () {
    _Scene_Map_update.call(this);

    if (this._threeRenderer && this._threeScene && this._threeCamera) {
      this._threeRenderer.render(this._threeScene, this._threeCamera);
    }

    this.updateSkyController();

    this.playerUpdate(); // ← FPSの移動＆スタミナ減少

    this.hudUpdate();
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


})();
