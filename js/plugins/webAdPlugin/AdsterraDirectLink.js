/*:
 * @target MZ
 * @plugindesc Adsterraのダイレクトリンクボタンを表示します（スイッチONで表示・クリックで外部へ移動）@profitableratecpm
 * @author あなた
 *
 * @param ShowSwitchId
 * @text 表示スイッチ番号
 * @type number
 * @min 1
 * @default 3
 * @desc スイッチがONになるとボタンが画面下に表示され、クリックで外部リンクへ移動します。
 *
 * @param ButtonText
 * @text ボタンの表示テキスト
 * @type string
 * @default 広告を見る
 *
 * @help
 * このプラグインは、スイッチがONになったときに
 * HTMLベースのボタンを画面下部に表示し、クリックでAdsterraのダイレクトリンクへ遷移します。
 */

(() => {
    const params = PluginManager.parameters("AdsterraDirectLink");
    const showSwitchId = Number(params["ShowSwitchId"] || 3);
    const buttonText = String(params["ButtonText"] || "広告を見る");
    const linkUrl = "https://www.profitableratecpm.com/rbyw0kwsyr?key=058afa4824ee854e8a1e65acc0963cec";

    let buttonElement = null;

    const createAdButton = () => {
        if (buttonElement) return;

        buttonElement = document.createElement("button");
        buttonElement.id = "adsterra-direct-link-button";
        buttonElement.textContent = buttonText;
        buttonElement.style.position = "absolute";
        buttonElement.style.left = "10px";
        buttonElement.style.bottom = "10px";
        buttonElement.style.zIndex = 100;
        buttonElement.style.padding = "10px 20px";
        buttonElement.style.fontSize = "18px";
        buttonElement.style.cursor = "pointer";

        buttonElement.addEventListener("click", () => {
            window.open(linkUrl, "_blank");
        });

        document.body.appendChild(buttonElement);
    };

    const removeAdButton = () => {
        if (buttonElement) {
            document.body.removeChild(buttonElement);
            buttonElement = null;
        }
    };

    const _SceneManager_updateMain = SceneManager.updateMain;
    SceneManager.updateMain = function () {
        _SceneManager_updateMain.call(this);

        if ($gameSwitches && $gameSwitches.value(showSwitchId)) {
            createAdButton();
        } else {
            removeAdButton();
        }
    };

    const _SceneManager_terminate = SceneManager.terminate;
    SceneManager.terminate = function () {
        _SceneManager_terminate.call(this);
        removeAdButton();
    };
})();
