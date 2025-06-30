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

        this.moveSpeed = 0.1;

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

    const isDashing = Input.isPressed('shift');
    const baseSpeed = this.moveSpeed;
    const dashSpeed = baseSpeed * 2.0;
    const crouchSpeed = baseSpeed * 0.4;

    const speed = this._isCrouching
        ? crouchSpeed
        : (isDashing ? dashSpeed : baseSpeed);

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

    const _Game_Actor_initMembers = Game_Actor.prototype.initMembers;
    Game_Actor.prototype.initMembers = function() {
        _Game_Actor_initMembers.call(this);
        // ★ 実データ
        this._survivalHp = 100;
        this._water = 100;
        this._hunger = 100;
        // ★ 予約用
        this._stamina = 100;
        this._temperature = 36.5;
        this._mental = 100;
        this._fatigue = 0;
        this._oxygen = 100;
    };

    // ---------- HP ----------
    Game_Actor.prototype.survivalHp = function() {
        return this._survivalHp;
    };
    Game_Actor.prototype.setSurvivalHp = function(value) {
        this._survivalHp = Math.max(0, Math.min(100, value)); // 0～100で制御
    };

    // ---------- 水分 ----------
    Game_Actor.prototype.water = function() {
        return this._water;
    };
    Game_Actor.prototype.setWater = function(value) {
        this._water = Math.max(0, Math.min(100, value));
    };

    // ---------- 空腹 ----------
    Game_Actor.prototype.hunger = function() {
        return this._hunger;
    };
    Game_Actor.prototype.setHunger = function(value) {
        this._hunger = Math.max(0, Math.min(100, value));
    };

    // ---------- 追加予約用 ----------
    Game_Actor.prototype.stamina = function() { return this._stamina; };
    Game_Actor.prototype.setStamina = function(value) { this._stamina = value; };

    Game_Actor.prototype.temperature = function() { return this._temperature; };
    Game_Actor.prototype.setTemperature = function(value) { this._temperature = value; };

    Game_Actor.prototype.mental = function() { return this._mental; };
    Game_Actor.prototype.setMental = function(value) { this._mental = value; };

    Game_Actor.prototype.fatigue = function() { return this._fatigue; };
    Game_Actor.prototype.setFatigue = function(value) { this._fatigue = value; };

    Game_Actor.prototype.oxygen = function() { return this._oxygen; };
    Game_Actor.prototype.setOxygen = function(value) { this._oxygen = value; };


    Scene_Map.prototype.hudCreate = function () {

        if (document.getElementById('hud-overlay')) return;
    
        // HUD全体
        const hud = document.createElement('div');
        hud.id = 'hud-overlay';
        hud.style.position = 'absolute';
        hud.style.bottom = '20px';
        hud.style.left = '20px';
        hud.style.width = '220px';
        hud.style.background = 'rgba(0, 0, 0, 0.5)';
        hud.style.padding = '10px';
        hud.style.borderRadius = '8px';
        hud.style.fontFamily = 'Arial, sans-serif';
        hud.style.color = 'white';
        hud.style.zIndex = '1000';
    
        // ゲージを作る関数
        const createGaugeRow = (labelText, barId, barColor) => {
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
            bar.style.width = '100%';
            bar.style.height = '100%';
            bar.style.background = barColor;
    
            barBackground.appendChild(bar);
            row.appendChild(barBackground);
    
            return row;
        };
    
        // HPゲージ
        hud.appendChild(createGaugeRow('HP', 'hp-bar', 'red'));
        // 水分ゲージ
        hud.appendChild(createGaugeRow('水分', 'water-bar', 'cyan'));
        // 空腹ゲージ
        hud.appendChild(createGaugeRow('空腹', 'hunger-bar', 'yellow'));
    
        // 追加
        document.body.appendChild(hud);
    
        
    };

    Scene_Map.prototype.hudUpdate = function () {
        if (document.getElementById('hud-overlay')) {
            const actor = $gameParty.leader();
        
            const hp = actor.survivalHp();
            const water = actor.water();
            const hunger = actor.hunger();
        
            document.getElementById('hp-bar').style.width = `${hp}%`;
            document.getElementById('water-bar').style.width = `${water}%`;
            document.getElementById('hunger-bar').style.width = `${hunger}%`;
        }

    };
    
    Scene_Map.prototype.hudRemove = function () {
        const hud = document.getElementById('hud-overlay');
        if (hud) {
            hud.remove();
        }
    };
    






})();


