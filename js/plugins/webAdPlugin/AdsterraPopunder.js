/*:
 * @target MZ
 * @plugindesc Adsterraのポップアンダー広告を表示します（スイッチON時に1回だけ）@profitableratecpm
 * @author あなた
 *
 * @param ShowSwitchId
 * @text 表示スイッチ番号
 * @type number
 * @min 1
 * @default 2
 * @desc このスイッチがONになるとポップアンダー広告が1回だけ表示されます。
 *
 * @help
 * このプラグインは、RPGツクールMZのゲームでAdsterraのポップアンダー広告を
 * スイッチ制御により1回だけ挿入するものです。
 *
 * 使用方法：
 * 1. Adsterraのポップアンダー用スクリプトが内部に埋め込まれています。
 * 2. プラグインパラメータのスイッチをONにすると1度だけ広告が発動します。
 * 3. 以後は再度スイッチOFF→ONしない限り発動しません。
 */

(() => {
    const parameters = PluginManager.parameters("AdsterraPopunder");
    const showSwitchId = Number(parameters["ShowSwitchId"] || 2);
    let lastSwitchState = false;
    let scriptInserted = false;

    const insertPopunderScript = () => {
        if (scriptInserted) return;
        scriptInserted = true;

        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "//pl26873575.profitableratecpm.com/56/a1/58/56a1581a3bc6f39f7a3c712ac195ed51.js";
        document.body.appendChild(script);
    };

    const _SceneManager_updateMain = SceneManager.updateMain;
    SceneManager.updateMain = function() {
        _SceneManager_updateMain.call(this);

        if ($gameSwitches) {
            const currentState = $gameSwitches.value(showSwitchId);
            if (currentState && !lastSwitchState) {
                insertPopunderScript();
            }
            lastSwitchState = currentState;
        }
    };
})();
