/*:
 * @target MZ
 * @plugindesc マップ画面でWASDキーによるThree.jsカメラ操作だけを追加します✨ by サラ
 * @author サラ
 * @help
 * このプラグインはThree.jsを使ってマップ画面のカメラを
 * WASDキーで前後左右に移動できるようにします♪
 *
 * 注意：Three.jsカメラ（this._threeCamera）がScene_Mapで定義されている必要があります。
 *
 * 対応キー：
 *   W - 前進
 *   A - 左移動
 *   S - 後退
 *   D - 右移動
 */

(() => {



class FPSCameraController {
    constructor(camera) {
        this.camera = camera;

        this.rotationX = 0;
        this.rotationY = 0;

        this.moveSpeed = 0.05;

        this._isJumping = false;
        this._jumpVelocity = 0;
        this._cameraYBase = camera.position.y;

        this._isCrouching = false;
        this._crouchHeight = 0.5;
        this._targetCameraY = this._cameraYBase;
        this._crouchSpeedDown = 0.05;
        this._crouchSpeedUp = 0.15;


        this._setupInput();
    }

    _setupInput() {
        Input.keyMapper[87] = 'w'; // W
        Input.keyMapper[65] = 'a'; // A
        Input.keyMapper[83] = 's'; // S
        Input.keyMapper[68] = 'd'; // D
        Input.keyMapper[32] = 'space';
        Input.keyMapper[16] = 'shift'; // ← Shiftキー


        document.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement) {
                this._onMouseMove(event);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape' || event.code === 'Tab') {
                event.preventDefault(); // デフォルト動作の抑制（特にTab）

                if (document.pointerLockElement) {
                    document.exitPointerLock(); // ロック中なら解除
                } else {
                    const canvas = document.body.querySelector('canvas');
                    if (canvas) {
                        canvas.requestPointerLock(); // 解除中ならロック
                    }
                }
            }
        });


    }

    _onMouseMove(event) {
        const deltaX = event.movementX || 0;
        const deltaY = event.movementY || 0;
        const rotateSpeed = 0.002;

        this.rotationY -= deltaX * rotateSpeed;
        this.rotationX -= deltaY * rotateSpeed;

        const maxAngle = Math.PI / 2 - 0.1;
        this.rotationX = Math.max(-maxAngle, Math.min(maxAngle, this.rotationX));

        const lookX = Math.sin(this.rotationY) * Math.cos(this.rotationX);
        const lookY = Math.sin(this.rotationX);
        const lookZ = Math.cos(this.rotationY) * Math.cos(this.rotationX);

        const lookTarget = new THREE.Vector3(
            this.camera.position.x + lookX,
            this.camera.position.y + lookY,
            this.camera.position.z + lookZ
        );

        this.camera.lookAt(lookTarget);
    }

    update() {
    if (this._cameraYBase === undefined) {
        this._cameraYBase = this.camera.position.y;
        this._targetCameraY = this._cameraYBase;
    }

    const speed = this.getCurrentMoveSpeed();

    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    const side = new THREE.Vector3().crossVectors(this.camera.up, direction).normalize();

    if (Input.isPressed('w')) {
        this.camera.position.add(direction.clone().multiplyScalar(speed));
    }
    if (Input.isPressed('s')) {
        this.camera.position.add(direction.clone().multiplyScalar(-speed));
    }
    if (Input.isPressed('a')) {
        this.camera.position.add(side.clone().multiplyScalar(speed));
    }
    if (Input.isPressed('d')) {
        this.camera.position.add(side.clone().multiplyScalar(-speed));
    }

    this._updateJump();
    this._updateCrouch();
    this._interpolateCameraHeight();
    this._updateStamina();

}

getCurrentMoveSpeed() {
    const baseSpeed = this.moveSpeed;
    const dashSpeed = baseSpeed * 2.0;
    const lowStaminaDashSpeed = baseSpeed * 1.4; // ← スタミナ低下時のダッシュ速度
    const crouchSpeed = baseSpeed * 0.4;

    const actor = $gameParty.leader();

    // 疲労中は完全停止
    if (this._isFatigued) {
        console.log('[Move] 疲労中のため移動不可');
        return 0.0;
    }

    const isDashing = Input.isPressed('shift') && actor.stamina() > 0;

    if (this._isCrouching) {
        return crouchSpeed;
    } else if (isDashing) {
        if (actor.stamina() < 30) {
            console.log('[Move] スタミナ低下 → ダッシュ弱体化');
            return lowStaminaDashSpeed;
        }
        return dashSpeed;
    } else {
        return baseSpeed;
    }
}



_updateStamina() {

    const actor = $gameParty.leader();
    const isMoving = Input.isPressed('w') || Input.isPressed('a') || Input.isPressed('s') || Input.isPressed('d');
    const isDashing = Input.isPressed('shift') && actor.stamina() > 0 && isMoving;

    if (this._isFatigued) {
        this._fatigueTimer--;

        if (this._fatigueTimer <= 0) {
            this._isFatigued = false;
            console.log('[Stamina] 疲労解除');
        }

        return; // 疲労中は処理停止
    }

    if (isDashing) {
        const stamina = actor.stamina();
        const next = Math.max(0, stamina - 0.5);
        actor.setStamina(next);
        console.log(`[Stamina] 減少: ${next}`);

        if (next === 0) {
            this._isFatigued = true;
            this._fatigueTimer = 120; // 約2秒（1フレーム約16ms想定）
            console.log('[Stamina] 疲労状態に移行');
        }

    } else {
        const stamina = actor.stamina();
        if (stamina < 100 && !this._isFatigued) {
            const next = stamina + 0.2;
            actor.setStamina(next);
            console.log(`[Stamina] 回復: ${next}`);
        }
    }

}


    _updateJump() {
        // ジャンプ開始時に基準高さを設定
        if (Input.isTriggered('space') && !this._isJumping && !this._isCrouching) {
            this._isJumping = true;
            this._jumpVelocity = 0.15;
            this._cameraYBase = this.camera.position.y;
        }

        // ジャンプ中の処理
        if (this._isJumping) {
            this.camera.position.y += this._jumpVelocity;
            this._jumpVelocity -= 0.01;

            // 着地判定
            if (this.camera.position.y <= this._cameraYBase) {
                this.camera.position.y = this._cameraYBase;
                this._isJumping = false;
                this._jumpVelocity = 0;
            }
        }
    }


    _updateCrouch() {
        if (Input.isPressed('cancel') && !this._isJumping) {
            if (!this._isCrouching) {
                this._targetCameraY = this._cameraYBase - this._crouchHeight;
                this._isCrouching = true;
            }
        } else {
            if (this._isCrouching) {
                this._targetCameraY = this._cameraYBase;
                this._isCrouching = false;
            }
        }
    }

    _interpolateCameraHeight() {
        if (this._isJumping) return; // ← これを追加！

        const currentY = this.camera.position.y;
        const dy = this._targetCameraY - currentY;
        const speed = (dy < 0) ? this._crouchSpeedDown : this._crouchSpeedUp;

        if (Math.abs(dy) < 0.01) {
            this.camera.position.y = this._targetCameraY;
        } else {
            this.camera.position.y += dy * speed;
        }
    }

    enablePointerLock() {
        document.body.requestPointerLock();
    }

    disablePointerLock() {
        document.exitPointerLock();
    }

    // コンパス機能用
    getForwardVector() {
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir); // カメラの向き（正面）
        return dir.normalize();
    }


}

Scene_Map.prototype.playerCreate = function () {
    this._cameraController = new FPSCameraController(this._threeCamera);
    this._cameraController.enablePointerLock();
};


Scene_Map.prototype.playerUpdate = function () {
    if (this._cameraController) {
        this._cameraController.update();
    }
};


  ///////////////////////////////////////////////////////////////////////
  // アクターの初期設定 //////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////

class Game_Actor_SurvivalExtension {
    static initMembers(actor) {
        actor._survivalHp = 100;
        actor._water = 100;
        actor._hunger = 100;
        actor._stamina = 100;
        actor._temperature = 36.5;
        actor._mental = 100;
        actor._fatigue = 0;
        actor._oxygen = 100;

        this._fatigueTimer = 0;     // 秒数（例：120で2秒）
        this._isFatigued = false;   // 行動不能フラグ


        actor._cameraController = null; // ← FPSCameraControllerの保持先
    }

    static setCameraController(actor, camera) {
        actor._cameraController = new FPSCameraController(camera);
    }

    static getCameraController(actor) {
        return actor._cameraController;
    }

    static defineProperties() {
        const props = [
            ['survivalHp', '_survivalHp'],
            ['water', '_water'],
            ['hunger', '_hunger'],
            ['stamina', '_stamina'],
            ['temperature', '_temperature'],
            ['mental', '_mental'],
            ['fatigue', '_fatigue'],
            ['oxygen', '_oxygen'],
        ];

        for (const [prop, key] of props) {
            Game_Actor.prototype[prop] = function () {
                return this[key];
            };
            Game_Actor.prototype[`set${prop.charAt(0).toUpperCase() + prop.slice(1)}`] = function (value) {
                if (['survivalHp', 'water', 'hunger'].includes(prop)) {
                    this[key] = Math.max(0, Math.min(100, value));
                } else {
                    this[key] = value;
                }
            };
        }
    }
}

const _Game_Actor_initMembers = Game_Actor.prototype.initMembers;
Game_Actor.prototype.initMembers = function () {
    _Game_Actor_initMembers.call(this);
    Game_Actor_SurvivalExtension.initMembers(this);
};

Game_Actor_SurvivalExtension.defineProperties();




class SurvivalHUD {
 // HUDを生成
    static create() {
        if (document.getElementById('hud-overlay')) return;

        const hud = document.createElement('div');
        hud.id = 'hud-overlay';
        Object.assign(hud.style, {
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            width: '220px',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '10px',
            borderRadius: '8px',
            fontFamily: 'Arial, sans-serif',
            color: 'white',
            zIndex: '1000',
        });

        // 各ゲージを追加
        hud.appendChild(SurvivalHUD.createGaugeRow('HP', 'hp-bar', 'red'));
        hud.appendChild(SurvivalHUD.createGaugeRow('水分', 'water-bar', 'cyan'));
        hud.appendChild(SurvivalHUD.createGaugeRow('空腹', 'hunger-bar', 'yellow'));
        hud.appendChild(SurvivalHUD.createGaugeRow('スタミナ', 'stamina-bar', 'lime'));


        document.body.appendChild(hud);
    }

    // ゲージの行を生成
    static createGaugeRow(labelText, barId, barColor) {
        const row = document.createElement('div');
        row.style.marginBottom = '8px';

        const label = document.createElement('span');
        label.innerText = labelText;
        row.appendChild(label);

        const barBackground = document.createElement('div');
        barBackground.style.background = '#333';
        barBackground.style.width = '100%';
        barBackground.style.height = '10px';
        barBackground.style.borderRadius = '5px';
        barBackground.style.overflow = 'hidden';
        barBackground.style.marginTop = '4px';

        const bar = document.createElement('div');
        bar.id = barId;
        bar.style.width = '100%'; // 初期化
        bar.style.height = '100%';
        bar.style.background = barColor;

        barBackground.appendChild(bar);
        row.appendChild(barBackground);

        return row;
    }

static update() {
    const hud = document.getElementById('hud-overlay');
    if (!hud) return;

    const actor = $gameParty.leader();
    this.updateBarSmoothly('hp-bar', actor.survivalHp());
    this.updateBarSmoothly('water-bar', actor.water());
    this.updateBarSmoothly('hunger-bar', actor.hunger());
    this.updateBarSmoothly('stamina-bar', actor.stamina());
}

// HUDのゲージバー（HP・スタミナなど）を滑らかに更新する処理
static updateBarSmoothly(barId, targetValue) {
    const bar = document.getElementById(barId);
    if (!bar) return;

    // 実際に表示されている幅を取得
    const computedWidth = parseFloat(window.getComputedStyle(bar).width);
    const parentWidth = parseFloat(window.getComputedStyle(bar.parentElement).width);
    const currentPercent = (computedWidth / parentWidth) * 100;

    const newPercent = currentPercent + (targetValue - currentPercent) * 0.1;

    bar.style.width = `${Math.max(0, Math.min(100, newPercent)).toFixed(1)}%`;
}



    static remove() {
        const hud = document.getElementById('hud-overlay');
        if (hud) hud.remove();
    }
}

Scene_Map.prototype.hudCreate = function () {
    SurvivalHUD.create();
};

Scene_Map.prototype.hudUpdate = function () {
    SurvivalHUD.update();
};

Scene_Map.prototype.hudRemove = function () {
    SurvivalHUD.remove();
};





})();


