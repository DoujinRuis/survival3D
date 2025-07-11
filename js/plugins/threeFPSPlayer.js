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
        Input.keyMapper[16] = 'shift';
        Input.keyMapper[69] = 'e';


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
    this._updateTerrainFollow();



}

_shouldFollowTerrain() {
    return !this._isJumping && !this._isCrouching;
}

_updateTerrainFollow() {
    if (!$gameMap || !SceneManager._scene._ground) return;
    if (!this._shouldFollowTerrain()) return;

    const ground = SceneManager._scene._ground;
    const pos = this.camera.position;
    const terrainY = ground.getHeightAt(pos.x, pos.z);
    const targetY = terrainY + 1.6;
    const currentY = this.camera.position.y;
    const dy = targetY - currentY;

    this.camera.position.y += dy * 0.2; // ← 滑らかに補間
}


getCurrentMoveSpeed() {
    const baseSpeed = this.moveSpeed;
    const dashSpeed = baseSpeed * 2.0;
    const lowStaminaDashSpeed = baseSpeed * 1.4; // ← スタミナ低下時のダッシュ速度
    const crouchSpeed = baseSpeed * 0.4;

    const actor = $gameParty.leader();

    // 疲労中は完全停止
    if (this._isFatigued) {
        return 0.0;
    }

    const isDashing = Input.isPressed('shift') && actor.stamina() > 0;

    if (this._isCrouching) {
        return crouchSpeed;
    } else if (isDashing) {
        if (actor.stamina() < 30) {
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
        }

        return; // 疲労中は処理停止
    }

    if (isDashing) {
        const stamina = actor.stamina();
        const next = Math.max(0, stamina - 0.5);
        actor.setStamina(next);

        if (next === 0) {
            this._isFatigued = true;
            this._fatigueTimer = 120; // 約2秒（1フレーム約16ms想定）
        }

    } else {
        const stamina = actor.stamina();
        if (stamina < 100 && !this._isFatigued) {
            const next = stamina + 0.2;
            actor.setStamina(next);
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




class DiggingController {
    constructor(sceneMap) {
        this.sceneMap = sceneMap;
        this.camera = sceneMap._threeCamera;
        this.scene = sceneMap._threeScene;

        this._raycaster = new THREE.Raycaster();

        this._createUI();
        this._raycaster.camera = this.camera;
        this._isPromptVisible = false;


    }

    _createUI() {
        const prompt = document.createElement('div');
        prompt.id = 'dig-prompt';
        prompt.innerText = 'Eキーで穴を掘る';
        Object.assign(prompt.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '20px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: '8px 16px',
            borderRadius: '6px',
            zIndex: '1000',
            display: 'none'
        });
        document.body.appendChild(prompt);
        this._promptElement = prompt;

        Input.keyMapper[69] = 'e'; // Eキー
    }

    // update() {
    //     if (!this.camera || !this.scene || !this._promptElement) return;

    //     const dir = new THREE.Vector3();
    //     this.camera.getWorldDirection(dir);

    //     // ✅ プレイヤーが真下を向いているか確認
    //     const threshold = 0.9; // -1 に近いほど真下
    //     const lookingDown = dir.y < -threshold;

    //     if (!lookingDown) {
    //         this._promptElement.style.display = 'none';
    //         return;
    //     }

    //     this._raycaster.set(this.camera.position, dir);
    //     this._raycaster.camera = this.camera;

    //     // ✅ VoxelChunk のメッシュグループを対象にする
    //     const chunk = SceneManager._scene._chunk;
    //     if (!chunk) return;

    //     const intersects = this._raycaster.intersectObjects(chunk.meshGroup.children, false);
    //     const hit = intersects[0];

    //     // if (hit) {
    //     //     this._promptElement.style.display = 'block';

    //     //     if (Input.isTriggered('e')) {
    //     //         const pos = hit.point;
    //     //         chunk.removeBlockAtWorldPosition(pos);
    //     //     }
    //     // } else {
    //     //     this._promptElement.style.display = 'none';
    //     // }

    //     if (hit) {
    //         this._promptElement.style.display = 'block';
    //         this._isPromptVisible = true;

    //         if (this._isPromptVisible && Input.isTriggered('e')) {
    //             const pos = hit.point;
    //             SceneManager._scene._chunk.removeBlockAtWorldPosition(pos);
    //             console.log("UI visible?", this._isPromptVisible);

    //         }
    //     } else {
    //         this._promptElement.style.display = 'none';
    //         this._isPromptVisible = false;
    //     }
    // }

    // update() {
    //     if (!this.camera || !this.scene || !this._promptElement) return;

    //     const dir = new THREE.Vector3();
    //     this.camera.getWorldDirection(dir);

    //     // ✅ プレイヤーが真下を向いているか確認
    //     const threshold = 0.9; // -1 に近いほど真下
    //     const lookingDown = dir.y < -threshold;
    //     if (!lookingDown) {
    //         this._promptElement.style.display = 'none';
    //         return;
    //     }

    //     this._raycaster.set(this.camera.position, dir);
    //     this._raycaster.camera = this.camera;

    //     const chunk = SceneManager._scene._chunk;
    //     if (!chunk) return;

    //     const intersects = this._raycaster.intersectObjects(chunk.meshGroup.children, false);
    //     if (intersects.length === 0) {
    //         this._promptElement.style.display = 'none';
    //         return;
    //     }

    //     // ✅ 視線がブロックに当たっていて、真下を向いている → UI表示
    //     const hit = intersects[0];
    //     this._promptElement.style.display = 'block';

    //     // ✅ UIが出ている今だけ掘削許可
    //     if (Input.isTriggered('e')) {
    //         const pos = hit.point;
    //         chunk.removeBlockAtWorldPosition(pos);
    //     }
    // }

    update() {
    if (!this.camera || !this.scene || !this._promptElement) return;

    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);

    const threshold = 0.9;
    const lookingDown = dir.y < -threshold;

    console.log(`[掘削UI] 視線ベクトルY: ${dir.y.toFixed(3)} → 真下判定: ${lookingDown}`);

    if (!lookingDown) {
        this._promptElement.style.display = 'none';
        this._isPromptVisible = false;
        console.log(`[掘削UI] 下を向いていないため非表示`);
        return;
    }

    this._raycaster.set(this.camera.position, dir);
    this._raycaster.camera = this.camera;

    const chunk = SceneManager._scene._chunk;
    if (!chunk) {
        console.warn("[掘削UI] chunkが存在しない");
        return;
    }

    const intersects = this._raycaster.intersectObjects(chunk.meshGroup.children, false);
    const hit = intersects.length > 0 ? intersects[0] : null;

    if (hit) {
        this._promptElement.style.display = 'block';
        this._isPromptVisible = true;
        console.log(`[掘削UI] ヒット → 表示ON`, hit.point);
    } else {
        this._promptElement.style.display = 'none';
        this._isPromptVisible = false;
        console.log(`[掘削UI] ヒットなし → 表示OFF`);
        return;
    }

    // ✅ 表示されているときのみ掘削許可
    if (this._isPromptVisible && Input.isTriggered('e')) {
        const pos = hit.point;
        console.log(`[掘削] Eキー → 掘削実行 at`, pos);
        chunk.removeBlockAtWorldPosition(pos);
    } else if (Input.isTriggered('e')) {
        console.log(`[掘削] Eキー押されたが、UI非表示 → 無視`);
    }
}


    remove() {
        if (this._promptElement) {
            this._promptElement.remove();
            this._promptElement = null;
        }
    }
}



Scene_Map.prototype.playerCreate = function () {
    this._cameraController = new FPSCameraController(this._threeCamera);
    this._cameraController.enablePointerLock();

    this._diggingController = new DiggingController(this);
};


Scene_Map.prototype.playerUpdate = function () {
    if (this._cameraController) {
        this._cameraController.update();
    }

    if (this._diggingController) {
        this._diggingController.update();
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

        hud.appendChild(this.createGaugeRow('HP', 'hp-bar', 'red'));
        hud.appendChild(this.createGaugeRow('水分', 'water-bar', 'cyan'));
        hud.appendChild(this.createGaugeRow('空腹', 'hunger-bar', 'yellow'));
        hud.appendChild(this.createGaugeRow('スタミナ', 'stamina-bar', 'lime'));

        document.body.appendChild(hud);

        this.createCompass();
        this.createPointer();
        console.log( "SurvivalHUD.create" ,  );
    }

    static createGaugeRow(labelText, barId, barColor) {
        const row = document.createElement('div');
        row.style.marginBottom = '8px';

        const label = document.createElement('span');
        label.innerText = labelText;
        row.appendChild(label);

        const barBackground = document.createElement('div');
        Object.assign(barBackground.style, {
            background: '#333',
            width: '100%',
            height: '10px',
            borderRadius: '5px',
            overflow: 'hidden',
            marginTop: '4px',
        });

        const bar = document.createElement('div');
        bar.id = barId;
        Object.assign(bar.style, {
            width: '100%',
            height: '100%',
            background: barColor,
        });

        barBackground.appendChild(bar);
        row.appendChild(barBackground);
        return row;
    }

    static createCompass() {
        const compass = document.createElement('div');
        compass.id = 'hud-compass';
        Object.assign(compass.style, {
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '20px',
            background: 'rgba(0, 0, 0, 0.6)',
            textAlign: 'center',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            zIndex: '1000',
            borderRadius: '6px',
        });
        compass.innerText = '方位: N';
        document.body.appendChild(compass);
    }

    static updateCompass(forwardVec) {
        const compass = document.getElementById('hud-compass');
        if (!compass || !forwardVec) return;

        const angle = Math.atan2(forwardVec.x, forwardVec.z); // Y軸回転
        const deg = (angle * 180) / Math.PI;
        const compassDir = this._directionFromAngle(deg);
        compass.innerText = `方位: ${compassDir}`;
    }

    static _directionFromAngle(deg) {
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const idx = Math.round(((deg + 360) % 360) / 45) % 8;
        return dirs[idx];
    }

    static createPointer() {
        const crosshair = document.createElement('div');
        crosshair.id = 'hud-crosshair';
        Object.assign(crosshair.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '8px',
            height: '8px',
            marginLeft: '-4px',
            marginTop: '-4px',
            backgroundColor: 'white',
            borderRadius: '50%',
            zIndex: '1000',
        });
        document.body.appendChild(crosshair);
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

    static updateBarSmoothly(barId, targetValue) {
        const bar = document.getElementById(barId);
        if (!bar) return;

        const computedWidth = parseFloat(window.getComputedStyle(bar).width);
        const parentWidth = parseFloat(window.getComputedStyle(bar.parentElement).width);
        const currentPercent = (computedWidth / parentWidth) * 100;
        const newPercent = currentPercent + (targetValue - currentPercent) * 0.1;

        bar.style.width = `${Math.max(0, Math.min(100, newPercent)).toFixed(1)}%`;
    }

    static remove() {
        ['hud-overlay', 'hud-compass', 'hud-crosshair'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }
}


Scene_Map.prototype.hudCreate = function () {
    SurvivalHUD.create();
};

Scene_Map.prototype.hudUpdate = function () {
    SurvivalHUD.update();

    if (this._cameraController) {
        const forwardVec = this._cameraController.getForwardVector();
        SurvivalHUD.updateCompass(forwardVec);
    }
};


Scene_Map.prototype.hudRemove = function () {
    SurvivalHUD.remove();
};





})();


