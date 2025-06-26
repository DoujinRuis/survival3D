
/*:
 * @target MZ
 * @plugindesc 3D世界を構築する
 * @author DoujinRuis
 * @help
 * 
 * 
 */


(() => {

// ★ Game_Systemに時間データを保持する
const _Game_System_initialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function() {
    _Game_System_initialize.call(this);
    this._survivalTime = {
        hour: 6,
        minute: 0,
        second: 0,
        accumulator: 0
    };
};

Game_System.prototype.getSurvivalTime = function() {
    return this._survivalTime;
};

Scene_Map.prototype._createTimeDisplay = function() {
    // すでに存在するか確認
    let div = document.getElementById('time-display');
    if (div) {
        this._timeElement = div; // 再利用
        return;
    }

    // なければ新規作成
    div = document.createElement('div');
    div.id = 'time-display'; // 👈 追加
    div.style.position = 'absolute';
    div.style.top = '10px';
    div.style.left = '10px';
    div.style.color = '#ffffff';
    div.style.fontSize = '18px';
    div.style.fontFamily = 'Arial, sans-serif';
    div.style.textShadow = '0 0 3px #000';
    div.style.zIndex = 20;

    document.body.appendChild(div);
    this._timeElement = div;
};


Scene_Map.prototype._updateGameTime = function() {
    const framesPerSecond = 60;
    const timeData = $gameSystem.getSurvivalTime();

    timeData.accumulator++;
    if (timeData.accumulator >= framesPerSecond) {
        timeData.accumulator = 0;
        timeData.second++;

        if (timeData.second >= 60) {
            timeData.second = 0;
            timeData.minute++;
            if (timeData.minute >= 60) {
                timeData.minute = 0;
                timeData.hour++;
                if (timeData.hour >= 24) {
                    timeData.hour = 0;
                }
            }
        }
    }

    // ★ 時間経過ごとの処理（中身は同じ）
    const actor = $gameParty.leader();

    if (timeData.accumulator === 0 && (timeData.hour + timeData.minute + timeData.second > 0)) {
        if (timeData.second % 10 === 0) {
            const currentWater = actor.water();
            actor.setWater(currentWater - 1);
        }
        if (timeData.second % 30 === 0) {
            const currentHunger = actor.hunger();
            actor.setHunger(currentHunger - 1);
        }
        const currentHp = actor.survivalHp();
        if (actor.water() <= 0) {
            actor.setSurvivalHp(currentHp - 3);
        }
        if (actor.hunger() <= 0) {
            actor.setSurvivalHp(actor.survivalHp() - 1);
        }
        if (actor.survivalHp() <= 0) {
            $gameSwitches.setValue(1, false);
            this.hudRemove();
            this._timeElement.style.display = 'none';
            if (document.exitPointerLock) document.exitPointerLock();
            SceneManager.goto(Scene_Gameover);
        }
    }

    this._refreshTimeDisplay();
};

Scene_Map.prototype._refreshTimeDisplay = function() {
    if (this._timeElement) {
        const timeData = $gameSystem.getSurvivalTime();
        const hh = String(timeData.hour).padStart(2, '0');
        const mm = String(timeData.minute).padStart(2, '0');
        const ss = String(timeData.second).padStart(2, '0');

        this._timeElement.innerHTML = `
            デバッグ用<br>
            時刻: ${hh}:${mm}:${ss}<br><br>
            <strong>操作説明</strong><br>
            WASDで移動<br>
            Shiftでダッシュ<br>
            Spaceでジャンプ<br>
            キャンセルでしゃがむ<br>
            Tabでインベントリ<br>
            EscとTabでポイントロック解除
        `;

        // ⭐ ここを追加！
        this._timeElement.style.color = 'black';
    }
};


const _Scene_Map_terminate = Scene_Map.prototype.terminate;
Scene_Map.prototype.terminate = function() {
    _Scene_Map_terminate.call(this);
    this.removeTimeDisplay(); // ここで削除
};


Scene_Map.prototype.removeTimeDisplay = function() {
    if (this._timeElement) {
        this._timeElement.remove();
        this._timeElement = null; // 念のため
    }
};



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

  Scene_Map.prototype.createCrosshair = function() {
    const crosshair = document.createElement('div');
    crosshair.id = 'crosshair';
    crosshair.style.position = 'absolute';
    crosshair.style.top = '50%';
    crosshair.style.left = '50%';
    crosshair.style.width = '8px';
    crosshair.style.height = '8px';
    crosshair.style.marginLeft = '-4px'; // 中央に合わせる
    crosshair.style.marginTop = '-4px';  // 中央に合わせる
    crosshair.style.backgroundColor = 'white';
    crosshair.style.borderRadius = '50%';
    crosshair.style.zIndex = '20';
    document.body.appendChild(crosshair);
};

})();