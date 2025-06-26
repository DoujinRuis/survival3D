/*:
 * @target MZ
 * @plugindesc PayPal連携ショッププラグイン（商品準備＋ショップ表示）💰
 * @author DoujinRuis
 *
 * @command RegisterItem
 * @text 商品準備
 * @desc アイテムまたは装備をショップに登録します。
 *
 * @arg Type
 * @type select
 * @option アイテム
 * @value item
 * @option 武器
 * @value weapon
 * @option 防具
 * @value armor
 *
 * @arg Id
 * @text データベースID
 * @type number
 *
 * @arg Price
 * @text 金額（円）
 * @type number
 * 
 * @arg Count
 * @text 付与個数
 * @type number
 * @default 1

 *
 * @command ShowShop
 * @text ショップ呼び出し
 * @desc オリジナルのショップシーンを表示します。
 *
 * @help
 * このプラグインはPayPal連携ショップを作成します。
 * 商品準備 → ショップ呼び出しの順に使ってください。
 */


(() => {

const pluginName = "paypalShopWebhook";
const payItems = [];

// プラグインコマンドで商品を登録
PluginManager.registerCommand(pluginName, "RegisterItem", args => {
    const id = Number(args.Id);
    const type = args.Type;
    const exists = payItems.some(item => item.id === id && item.type === type);
    if (!exists) {
        payItems.push({
            type: type,
            id: id,
            price: Number(args.Price),
            count: Number(args.Count) || 1  // ← 新規追加
        });
    }
});

PluginManager.registerCommand(pluginName, "ShowShop", () => {
    SceneManager.push(Scene_PayShop);
});

class Scene_PayShop extends Scene_MenuBase {
    create() {
        super.create();

    if (!DataManager.isDatabaseLoaded()) {
        console.warn("データベースの読み込みが完了していません！");
        this.popScene(); // シーンを閉じちゃうか、エラー表示してもOK
        return;
    }

        // 重複商品を除去（type+idでユニーク）
        const unique = [];
        const seen = new Set();
        for (const item of payItems) {
            const key = item.type + ":" + item.id;
            if (!seen.has(key)) {
                unique.push(item);
                seen.add(key);
            }
        }
        this._uniquePayItems = unique;

        this.createHelpWindow();
        this.createReceiveButton();
        this.createPayWindow();
    }

    createPayWindow() {
        const rect = new Rectangle(0, 0, Graphics.boxWidth, Graphics.boxHeight - 180);
        this._payWindow = new Window_PayShop(rect, this._uniquePayItems);
        this._payWindow.setHandler("ok", this.onBuy.bind(this));
        this._payWindow.setHandler("cancel", this.popScene.bind(this));
        this._payWindow.setHelpWindow(this._helpWindow);
        this.addWindow(this._payWindow);
    }

    onBuy() {
        const item = this._payWindow.currentItem();
        if (!item) return;

        fetch("https://doujin-ruis.pigboat.jp/walletWork/get_user_id.php")
            .then(res => res.text())
            .then(uid => {
                const userId = uid.trim();

                // 初期の customId（仮）
                const baseCustomId = `${userId}-${item.type}-${item.id}-${item.count}`;
                const price = item.price;

                const url = `https://doujin-ruis.pigboat.jp/walletWork/create_order.php?customId=${encodeURIComponent(baseCustomId)}&price=${price}`;
                return fetch(url);
            })
            .then(res => res.json())
            .then(data => {
                console.log("create_order.php の応答:", data);
                if (!data || !data.approve_url || !data.order_id) {
                    throw new Error("注文生成に失敗しました");
                }

                // 最終的な unique customId に更新
                const fullCustomId = `${item.type}-${item.id}-${item.count}-${data.order_id}`;
                item.customId = fullCustomId;

                // ローカルストレージの重複も防げる
                window.open(data.approve_url, "_blank");

                setTimeout(() => {
                console.log("時間経過によりショップ画面を閉じます");
                SceneManager.pop();
            }, 20000); // 20秒後に自動戻り
            })
            .catch(err => {
                console.error("購入処理エラー:", err);
                alert("購入処理に失敗しました。");
            });
    }

    createReceiveButton() {
        if (this._receiveButtonElement) return; // 重複生成防止

        const button = document.createElement("button");
        button.id = "receiveButton";
        button.textContent = "受け取る";
        button.style.position = "absolute";
        button.style.left = "10px"; // 必要に応じて調整
        button.style.bottom = "10px"; // 画面下部に配置
        button.style.zIndex = 100;
        button.style.fontSize = "20px";
        button.style.padding = "10px 20px";

        button.addEventListener("click", () => {
            this.onReceive();
        });

        document.body.appendChild(button);
        this._receiveButtonElement = button;
    }

    terminate() {
        super.terminate();
        if (this._receiveButtonElement) {
            document.body.removeChild(this._receiveButtonElement);
            this._receiveButtonElement = null;
        }
    }

    onReceive() {
        const item = this._payWindow.currentItem();
        if (!item || !item.customId) {
            console.warn("受け取るアイテムが未選択または customId 未設定");
            return;
        }

        const key = "received_" + item.customId;
        const count = item.count || 1;

        if (localStorage.getItem(key)) {
            alert("このアイテムはすでに受け取っています。");
            return;
        }

        fetch("https://doujin-ruis.pigboat.jp/walletWork/verify_purchase.php")
            .then(res => res.json())
            .then(purchases => {
                console.log("購入確認レスポンス:", purchases);
                const found = purchases.some(entry =>
                    entry.type === item.type &&
                    Number(entry.id) === item.id &&
                    Number(entry.count) === count
                );

                if (found) {
                    let dataItem;
                    switch (item.type) {
                        case "item": dataItem = $dataItems[item.id]; break;
                        case "weapon": dataItem = $dataWeapons[item.id]; break;
                        case "armor": dataItem = $dataArmors[item.id]; break;
                    }
                    if (dataItem) {
                        $gameParty.gainItem(dataItem, count);
                        alert(`${dataItem.name} を ${count} 個受け取りました！`);
                        localStorage.setItem(key, "1");
                        this.popScene();
                    }
                } else {
                    alert("購入が確認できませんでした。");
                    console.warn("一致しなかったアイテム:", item);
                }
            })
            .catch(err => {
                console.error("購入確認失敗:", err);
                alert("購入確認に失敗しました。");
            });
        }

    createHelpWindow() {
        const rect = new Rectangle(
            0,
            Graphics.boxHeight - 180, // 商品ウィンドウのすぐ下
            Graphics.boxWidth,
            108
        );
        this._helpWindow = new Window_Help(rect);
        this.addWindow(this._helpWindow);
    }

    setHelpWindow(helpWindow) {
        this._helpWindow = helpWindow;
        this.callUpdateHelp(); // 初期表示更新
    }

    callUpdateHelp() {
    if (this._helpWindow) {
        const item = this.currentItem();

        let dataItem;
        switch (item.type) {
            case "item":
                dataItem = $dataItems[item.id];
                break;
            case "weapon":
                dataItem = $dataWeapons[item.id];
                break;
            case "armor":
                dataItem = $dataArmors[item.id];
                break;
            default:
                console.warn("[DEBUG] item.type 未定義または無効:", item.type);
        }

        if (dataItem) {
            const description = dataItem.description || dataItem.note || "(説明なし)";
            this._helpWindow.setText(description);
        } else {
            this._helpWindow.setText("");
        }

    } else {
        console.warn("[DEBUG] _helpWindow が存在しません");
    }
    }

    select(index) {
        super.select(index);
        this.callUpdateHelp(); // 選択が変わるたびに説明を更新
    }

}

class Window_PayShop extends Window_Selectable {
    initialize(rect) {
        super.initialize(rect);
        this._data = payItems;
        this.refresh();
        this.select(0);
        this.activate();
    }

    maxItems() {
        return this._data.length;
    }

    currentItem() {
        return this._data[this.index()] || null;
    }

    drawItem(index) {
        const item = this._data[index];
        const name = this.itemName(item);
        console.log( "item" , item );
        console.log( "name" , name );
        const price = item.price ?? "?";
        const rect = this.itemRect(index);
        this.drawText(`${name} - ¥${price}`, rect.x, rect.y, rect.width);
    }

    itemName(item) {
        switch (item.type) {
            case "item": return $dataItems[item.id].name || "???";
            case "weapon": return $dataWeapons[item.id].name || "???";
            case "armor": return $dataArmors[item.id].name || "???";
            default: return "???";
        }
    }

    itemHeight() {
        return 36;
    }

    setHelpWindow(helpWindow) {
        this._helpWindow = helpWindow;
        this.updateHelp();
    }

    updateHelp() {
        if (!this._helpWindow) return;
        const item = this.currentItem();
        let data;
        switch (item.type) {
            case "item": data = $dataItems[item.id]; break;
            case "weapon": data = $dataWeapons[item.id]; break;
            case "armor": data = $dataArmors[item.id]; break;
        }
        const desc = data.description || data.note || "(説明なし)";
        this._helpWindow.setText(desc);
    }

    select(index) {
        super.select(index);
        this.updateHelp();
    }
}




})();
