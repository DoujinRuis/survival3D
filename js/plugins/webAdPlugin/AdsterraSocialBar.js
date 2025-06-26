/*:
 * @target MZ
 * @plugindesc AdsterraのSocial Bar広告をゲーム内に表示します。
 * @author あなた
 *
 * @param ShowSwitchId
 * @text 表示スイッチ番号
 * @type number
 * @min 1
 * @default 1
 * @desc 指定スイッチがONのときにSocial Barを表示します。
 *
 * @help
 * このプラグインはAdsterraのSocial BarをRPGツクールMZのゲームに表示します。
 *
 * 使用方法：
 * 1. AdsterraのSocial Barスクリプトタグをこのプラグイン内に埋め込んであります。
 * 2. 指定したスイッチ番号がONになると、自動的に表示されます。
 *
 * 利用例：
 * スイッチ1をONにするとSocial Bar広告が表示されます。
 */



(() => {
    const parameters = PluginManager.parameters("AdsterraSocialBar");
    const showSwitchId = Number(parameters["ShowSwitchId"] || 1);
    let scriptInserted = false;

    const insertAdsterraSocialBarScript = () => {
        if (scriptInserted) return;
        scriptInserted = true;

        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "//pl26871731.profitableratecpm.com/f9/0b/ae/f90bae3327dacb15f3985b534d56f078.js";
        document.body.appendChild(script);
    };

    const _SceneManager_updateMain = SceneManager.updateMain;
    SceneManager.updateMain = function() {
        _SceneManager_updateMain.call(this);

        if ($gameSwitches && $gameSwitches.value(showSwitchId)) {
            insertAdsterraSocialBarScript();
        }
    };

    
})();
