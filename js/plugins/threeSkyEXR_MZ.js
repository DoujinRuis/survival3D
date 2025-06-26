/*:
 * @target MZ
 * @plugindesc EXR形式の空をThree.jsで描画するプラグイン
 * @author ミツキ
 * @help
 * EXRファイルを読み込んで、Three.jsのシーン背景・環境光として描画します。
 * 
 * ファイル配置例:
 *   - img/sky/rosendal_plains_2_4k.exr
 *   - js/libs/EXRLoader.bundle.js（先に読み込む必要あり）
 */

(() => {

  const filePath = "3D/textures/";
  const fileName = "DaySkyHDRI055A_4K-HDR.exr";
  const fullPath = filePath + fileName;

  Scene_Map.prototype.loadEXRSky = function () {
    const loader = new EXRLoaderModule.EXRLoader();
    loader.load(fullPath, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
  
      this._threeScene.background = texture;
      this._threeScene.environment = null; // 地面への影響なし
      this._threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
      this._threeRenderer.toneMappingExposure = 2.5; // 明るさ

  
    }, undefined, (err) => {
      console.error("[SkyLoader] EXRファイルの読み込みに失敗:", err);
    });
  };
  
  })();
  