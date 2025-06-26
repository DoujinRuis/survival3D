/*:
 * @target MZ
 * @plugindesc Adsterraのネイティブバナー広告を表示するプラグイン💕スイッチでON/OFF制御も可能！
 * @author サラ
 *
 * @param AdSettings
 * @text 📦 広告表示設定
 * @type struct<NativeAdConfig>
 * @desc 広告のサイズ、位置、表示スイッチなどを一括設定できます
 *
 * @help
 * Adsterraのネイティブバナー広告を表示するプラグインです！
 * 指定したゲームスイッチがONのときのみ表示されます。
 *
 * 実際の広告コードは script で指定されます。
 */

/*~struct~NativeAdConfig:
 *
 * @param AdWidth
 * @text 広告の幅（px）
 * @type number
 * @min 1
 * @default 320
 *
 * @param AdHeight
 * @text 広告の高さ（px）
 * @type number
 * @min 1
 * @default 100
 *
 * @param AdX
 * @text X座標（px）
 * @type number
 * @default 10
 *
 * @param AdY
 * @text Y座標（px）
 * @type number
 * @default 10
 *
 * @param ToggleSwitch
 * @text 表示切替スイッチ番号
 * @type switch
 * @default 0
 */

(() => {
    const params = PluginManager.parameters("AdsterraNativeBanner");
    const adConfig = JSON.parse(params["AdSettings"] || "{}");
    const adWidth = Number(adConfig["AdWidth"] || 320);
    const adHeight = Number(adConfig["AdHeight"] || 100);
    const adX = Number(adConfig["AdX"] || 10);
    const adY = Number(adConfig["AdY"] || 10);
    const toggleSwitch = Number(adConfig["ToggleSwitch"] || 0);

    let adContainer = null;

    const createAdElement = () => {
        if (!document.getElementById("container-3b24b1ac392630710adcc3be456c82c6")) {
            const adDiv = document.createElement("div");
            adDiv.id = "container-3b24b1ac392630710adcc3be456c82c6";
            adDiv.style.position = "absolute";
            adDiv.style.left = "10px";
            adDiv.style.top = "300px";
            adDiv.style.zIndex = "100";
            document.body.appendChild(adDiv);
    
            const script = document.createElement("script");
            script.async = true;
            script.setAttribute("data-cfasync", "false");
            script.src = "//pl26237810.effectiveratecpm.com/3b24b1ac392630710adcc3be456c82c6/invoke.js";
            document.body.appendChild(script);
        }
    };
        
    

    const removeAdElement = () => {
        if (adContainer && adContainer.parentNode) {
            adContainer.parentNode.removeChild(adContainer);
            adContainer = null;
        }
    };

    const checkAdVisibility = () => {
        if (toggleSwitch > 0 && $gameSwitches) {
            const isOn = $gameSwitches.value(toggleSwitch);
            if (isOn) {
                createAdElement();
            } else {
                removeAdElement();
            }
        }
    };

    const _SceneManager_updateMain = SceneManager.updateMain;
    SceneManager.updateMain = function() {
        _SceneManager_updateMain.call(this);
        checkAdVisibility();
    };
})();
