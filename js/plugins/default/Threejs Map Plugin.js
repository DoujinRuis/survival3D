/*:
 * @target MZ
 * @plugindesc マップ画面にThree.jsで辺が黒い立体キューブを表示するテストプラグインです✨
 * @author サラ
 * @help
 * このプラグインをONにすると、マップ画面に3Dキューブが表示されます🟩
 * キューブの辺が黒色で表示されるので、立体的に見やすくなっています！
 *
 * 必須：
 * - js/libs/three.min.js を配置しておいてください！
 */

(() => {
  const _Scene_Map_create = Scene_Map.prototype.create;
  Scene_Map.prototype.create = function () {
    _Scene_Map_create.call(this);
    this.createThreeScene();
  };

  const _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function () {
    _Scene_Map_update.call(this);
    this.updateThreeScene();
  };

  const _Scene_Map_terminate = Scene_Map.prototype.terminate;
  Scene_Map.prototype.terminate = function () {
    _Scene_Map_terminate.call(this);
    this.terminateThreeScene();
  };

  Scene_Map.prototype.createThreeScene = function () {
    console.log("🌟 Three.js シーン作成中（エッジ付き）...");
    this._threeRenderer = new THREE.WebGLRenderer({ alpha: true });
    this._threeRenderer.setSize(Graphics.width, Graphics.height);
    this._threeRenderer.domElement.style.position = 'absolute';
    this._threeRenderer.domElement.style.zIndex = 10;
    document.body.appendChild(this._threeRenderer.domElement);

    this._threeScene = new THREE.Scene();
    this._threeCamera = new THREE.PerspectiveCamera(75, Graphics.width / Graphics.height, 0.1, 1000);
    this._threeCamera.position.z = 5;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    // メッシュ（本体）
    this._cube = new THREE.Mesh(geometry, material);
    this._threeScene.add(this._cube);

    // エッジライン（辺を描く）
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    this._cubeEdge = new THREE.LineSegments(edges, lineMaterial);
    this._cube.add(this._cubeEdge); // キューブに付属させる
  };

  Scene_Map.prototype.updateThreeScene = function () {
    if (this._threeRenderer && this._threeScene && this._threeCamera) {
      this._cube.rotation.x += 0.01;
      this._cube.rotation.y += 0.01;
      this._threeRenderer.render(this._threeScene, this._threeCamera);
    }
  };

  Scene_Map.prototype.terminateThreeScene = function () {
    if (this._threeRenderer && this._threeRenderer.domElement) {
      document.body.removeChild(this._threeRenderer.domElement);
      this._threeRenderer.dispose();
    }
  };
})();
