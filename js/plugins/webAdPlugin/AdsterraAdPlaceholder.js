/*:
 * @target MZ
 * @plugindesc スイッチがONのときだけ広告を表示するプラグイン💕広告設定を1つにまとめました✨
 * @author サラ
 *
 * @param AdSettings
 * @text 📦 広告表示設定
 * @type struct<AdConfig>
 * @desc 広告のサイズ、位置、スイッチ制御を一括設定♪
 *
 * @help
 * 指定したスイッチがONのときのみ、広告枠を作成＆表示します。
 * スイッチがOFFのときは要素自体が生成されません💕
 *
 * 📌「広告表示設定」でサイズや表示位置、表示スイッチも一括管理できます♪
 */

/*~struct~AdConfig:
 *
 * @param AdWidth
 * @text 広告の幅（px）
 * @type number
 * @min 1
 * @default 300
 *
 * @param AdHeight
 * @text 広告の高さ（px）
 * @type number
 * @min 1
 * @default 250
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
    const params = PluginManager.parameters("AdsterraAdPlaceholder");
    const adConfig = JSON.parse(params["AdSettings"] || "{}");
    const adWidth = Number(adConfig["AdWidth"] || 300);
    const adHeight = Number(adConfig["AdHeight"] || 250);
    const adX = Number(adConfig["AdX"] || 10);
    const adY = Number(adConfig["AdY"] || 10);
    const toggleSwitch = Number(adConfig["ToggleSwitch"] || 0);

    let adContainer = null;

    const createAdElement = () => {
        if (!adContainer) {
            adContainer = document.createElement("div");
            adContainer.id = "adContainer";
            adContainer.style.position = "absolute";
            adContainer.style.left = `${adX}px`;
            adContainer.style.top = `${adY}px`;
            adContainer.style.width = `${adWidth}px`;
            adContainer.style.height = `${adHeight}px`;
            adContainer.style.zIndex = "100";
            document.body.appendChild(adContainer);
    
            // スクリプトを正しく動作させるための挿入方法
            const script1 = document.createElement("script");
            script1.type = "text/javascript";
            script1.innerHTML = `
                atOptions = {
                    'key' : 'e9fe0543c0db8263dddf8f7235383a34',
                    'format' : 'iframe',
                    'height' : 250,
                    'width' : 300,
                    'params' : {}
                };
            `;
            adContainer.appendChild(script1);
    
            const script2 = document.createElement("script");
            script2.type = "text/javascript";
            script2.src = "//www.highperformanceformat.com/e9fe0543c0db8263dddf8f7235383a34/invoke.js";
            adContainer.appendChild(script2);
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
