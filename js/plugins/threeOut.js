








//   Scene_Map.prototype.playerCreate = function () {
//     this.setupCameraControls(); // 初期設定
//     this.createCrosshair(); // 中央視点
//   };

//   Scene_Map.prototype.setupCameraControls = function () {
//     // キーマッピング設定
//     Input.keyMapper[87] = 'w';     // W
//     Input.keyMapper[65] = 'a';     // A
//     Input.keyMapper[83] = 's';     // S
//     Input.keyMapper[68] = 'd';     // D
//     Input.keyMapper[32] = 'space'; // スペースキー
//     Input.keyMapper[17] = 'ctrl';  // 左Ctrlキーをしゃがみに使う

//     // カメラ制御用の初期化
//     this._cameraRotationX = 0;
//     this._cameraRotationY = 0;

//     this._isJumping = false;
//     this._jumpVelocity = 0;
//     this._cameraYBase = undefined;

//     // しゃがみ機能の変数
//     this._isCrouching = false;
//     this._crouchHeight = 0.5; // しゃがみで下がる量
//     this._targetCameraY = undefined; // 目標の高さ
//     this._crouchSpeedDown = 0.05; // しゃがみ込むとき
//     this._crouchSpeedUp = 0.15;   // 立ち上がるとき（速め）

//     // イベントリスナー登録
//     document.addEventListener('mousedown', this.onMouseDown.bind(this));
//     document.addEventListener('mouseup', this.onMouseUp.bind(this));
//     document.addEventListener('mousemove', this.onMouseMove.bind(this));

// };

//   Scene_Map.prototype.createCrosshair = function() {
//     const crosshair = document.createElement('div');
//     crosshair.id = 'crosshair';
//     crosshair.style.position = 'absolute';
//     crosshair.style.top = '50%';
//     crosshair.style.left = '50%';
//     crosshair.style.width = '8px';
//     crosshair.style.height = '8px';
//     crosshair.style.marginLeft = '-4px'; // 中央に合わせる
//     crosshair.style.marginTop = '-4px';  // 中央に合わせる
//     crosshair.style.backgroundColor = 'white';
//     crosshair.style.borderRadius = '50%';
//     crosshair.style.zIndex = '20';
//     document.body.appendChild(crosshair);
// };

//   Scene_Map.prototype.playerUpdate = function () {
//     if (!this._threeCamera) return;

//     // --- 基準高さの初期化 ---
//     if (this._cameraYBase === undefined) {
//         this._cameraYBase = this._threeCamera.position.y;
//     }

//     // カメラ移動（WASD）
//     this.updateWASDCameraControls();

//     this.updateGroundHeight();

//     // --- ジャンプ処理 ---
//     this.updatePlayerJump();

//     // --- しゃがみ処理 ---
//     this.updatePlayerCrouch();

//     // --- カメラの高さ補間 ---
//     this.interpolateCameraHeight();

//   };

//   Scene_Map.prototype.updateGroundHeight = function () {
//     if (!this._threeCamera || !this._model) return;

//     this._model.traverse(obj => {
//       if (obj.isMesh) {
//           obj.material.side = THREE.DoubleSide;
//       }
//     });

//     const raycaster = new THREE.Raycaster();
//     const down = new THREE.Vector3(0, -1, 0);
//     const cameraPos = this._threeCamera.position.clone();
//     cameraPos.y += 5; // ← 高さを持たせて Ray を上から地面に向けて発射

//     raycaster.set(cameraPos, down);

//     raycaster.set(cameraPos, down);
//     const intersects = raycaster.intersectObject(this._model, true);

//     if (intersects.length > 0) {
//         const groundY = intersects[0].point.y;
//         this._cameraYBase = groundY + 1.6;  // プレイヤーの目線の高さを調整
//     }
// };

//   // ジャンプ
//   Scene_Map.prototype.updatePlayerJump = function () {
//     if (Input.isTriggered('space') && !this._isJumping && !this._isCrouching) {
//         this._isJumping = true;
//         this._jumpVelocity = 0.15;
//     }

//     if (this._isJumping) {
//         this._threeCamera.position.y += this._jumpVelocity;
//         this._jumpVelocity -= 0.01;

//         if (this._threeCamera.position.y <= this._cameraYBase) {
//             this._threeCamera.position.y = this._cameraYBase;
//             this._isJumping = false;
//             this._jumpVelocity = 0;
//         }
//     }
// };

// Scene_Map.prototype.updatePlayerCrouch = function () {
//     if (Input.isPressed('cancel') && !this._isJumping) {
//         if (!this._isCrouching) {
//             this._targetCameraY = this._cameraYBase - this._crouchHeight;
//             this._isCrouching = true;
//         }
//     } else {
//         if (this._isCrouching) {
//             this._targetCameraY = this._cameraYBase;
//             this._isCrouching = false;
//         }
//     }
// };

// Scene_Map.prototype.interpolateCameraHeight = function () {
//     if (this._targetCameraY === undefined || !this._threeCamera) return;

//     const currentY = this._threeCamera.position.y;
//     const dy = this._targetCameraY - currentY;
//     const speed = (dy < 0) ? this._crouchSpeedDown : this._crouchSpeedUp;

//     if (Math.abs(dy) < 0.01) {
//         this._threeCamera.position.y = this._targetCameraY;
//     } else {
//         this._threeCamera.position.y += dy * speed;
//     }
// };

//   Scene_Map.prototype.updateWASDCameraControls = function () {
//     const isShift = Input.isPressed('shift');
//     const baseSpeed = 0.1;
//     const boostSpeed = 0.3;
//     const crouchSpeedMultiplier = 0.4; // しゃがみ時のスピード低下率（例：40%）

//     let speed = isShift ? boostSpeed : baseSpeed;

//     // しゃがみ中は速度を減らす
//     if (this._isCrouching) {
//         speed *= crouchSpeedMultiplier;
//     }

//     const direction = new THREE.Vector3();
//     this._threeCamera.getWorldDirection(direction);
//     direction.y = 0;
//     direction.normalize();

//     const side = new THREE.Vector3().crossVectors(this._threeCamera.up, direction).normalize();

//     if (Input.isPressed('w')) {
//         this._threeCamera.position.add(direction.clone().multiplyScalar(speed));
//     }
//     if (Input.isPressed('s')) {
//         this._threeCamera.position.add(direction.clone().multiplyScalar(-speed));
//     }
//     if (Input.isPressed('a')) {
//         this._threeCamera.position.add(side.clone().multiplyScalar(speed));
//     }
//     if (Input.isPressed('d')) {
//         this._threeCamera.position.add(side.clone().multiplyScalar(-speed));
//     }
//   };

//   Scene_Map.prototype.onMouseDown = function (event) {
//     // 未使用でもOK
//   };

//   Scene_Map.prototype.onMouseUp = function (event) {
//     // 未使用でもOK
//   };

//   Scene_Map.prototype.onMouseMove = function (event) {
//     if (!this._threeCamera || document.pointerLockElement !== document.body) return;

//     const deltaX = event.movementX || 0;
//     const deltaY = event.movementY || 0;
//     const rotateSpeed = 0.002;

//     this._cameraRotationY -= deltaX * rotateSpeed;
//     this._cameraRotationX -= deltaY * rotateSpeed;

//     const maxAngle = Math.PI / 2 - 0.1;
//     this._cameraRotationX = Math.max(-maxAngle, Math.min(maxAngle, this._cameraRotationX));

//     const lookX = Math.sin(this._cameraRotationY) * Math.cos(this._cameraRotationX);
//     const lookY = Math.sin(this._cameraRotationX);
//     const lookZ = Math.cos(this._cameraRotationY) * Math.cos(this._cameraRotationX);

//     const lookTarget = new THREE.Vector3(
//       this._threeCamera.position.x + lookX,
//       this._threeCamera.position.y + lookY,
//       this._threeCamera.position.z + lookZ
//     );

//     this._threeCamera.lookAt(lookTarget);
//   };

//   const _Scene_Map_terminate = Scene_Map.prototype.terminate;
//   Scene_Map.prototype.terminate = function () {
//     _Scene_Map_terminate.call(this);

//     document.removeEventListener('mousedown', this.onMouseDown);
//     document.removeEventListener('mouseup', this.onMouseUp);
//     document.removeEventListener('mousemove', this.onMouseMove);
    
//     const crosshair = document.getElementById('crosshair');
//     if (crosshair) {
//         document.body.removeChild(crosshair);
//     }
//   };











    /////////////////////////////////////////////////////////////////////////
    // アイテムのハイライト //////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////

    // Scene_Map.prototype.updatePickupHighlight = function () {
    //     if (!this._threeCamera || !this._threeScene) return;
    
    //     if (!this._raycaster) {
    //         this._raycaster = new THREE.Raycaster();
    //     }
    
    //     const allPickups = this.getAllPickups();
    //     if (allPickups.length === 0) return;
    
    //     const cameraDirection = new THREE.Vector3();
    //     this._threeCamera.getWorldDirection(cameraDirection);
    //     this._raycaster.set(this._threeCamera.position, cameraDirection);
    
    //     const maxDistance = 3;
    //     const intersects = this._raycaster.intersectObjects(allPickups, false);
    
    //     this.removeHighlight();
    
    //     if (intersects.length > 0) {
    //         const hit = intersects[0];
    //         const hitObject = hit.object;
    //         const distance = hit.distance;
        
    //         if (distance <= maxDistance) {
    //             this.highlightPickup(hitObject);
        
    //             // 👇 名前を表示
    //             const itemName = hitObject.userData.itemName || "アイテム";
    //             this.showPickupName(itemName);
        
    //             if (TouchInput.isTriggered()) {
    //                 this.pickupObject(hitObject);
        
    //                 // 取得したら名前も消す
    //                 this.hidePickupName();
    //             }
    //         } else {
    //             // 範囲外なら名前も消す
    //             this.hidePickupName();
    //         }
    //     } else {
    //         // ヒットしない場合も消す
    //         this.hidePickupName();
    //     }
    //     };
    
    //     Scene_Map.prototype.highlightPickup = function (object) {
    //         const outlineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 4 });
    //         const outlineGeometry = new THREE.EdgesGeometry(object.geometry);
    //         const outline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
    
    //         outline.position.copy(object.position);
    //         outline.rotation.copy(object.rotation);
    //         outline.scale.copy(object.scale.clone().multiplyScalar(1.02));
    
    //         this._threeScene.add(outline);
    //         this._currentOutline = outline;
    //     };
    
    //     Scene_Map.prototype.removeHighlight = function () {
    //         if (this._currentOutline) {
    //             this._threeScene.remove(this._currentOutline);
    //             this._currentOutline.geometry.dispose();
    //             this._currentOutline.material.dispose();
    //             this._currentOutline = null;
    //         }
    //     };
    
    
    //     // 管理用の全リスト
    //     Scene_Map.prototype.getAllPickupLists = function () {
    //         return [this._branches, this._stones, this._acorns];
    //     };
    
    //     Scene_Map.prototype.getAllPickups = function () {
    //         let pickups = [];
    //         const allLists = this.getAllPickupLists();
    //         for (const list of allLists) {
    //             if (list) pickups = pickups.concat(list);
    //         }
    //         return pickups;
    //     };

    //     Scene_Map.prototype.pickupObject = function (object) {
    //         const itemId = object.userData.itemId || 1;
    //         const itemAmount = object.userData.itemAmount || 1;
    //         const itemName = object.userData.itemName || "アイテム";
        
    //         $gameParty.gainItem($dataItems[itemId], itemAmount);
    //         this._threeScene.remove(object);
        
    //         const allLists = this.getAllPickupLists();
    //         for (const list of allLists) {
    //             if (list) {
    //                 const idx = list.indexOf(object);
    //                 if (idx !== -1) {
    //                     list.splice(idx, 1);
    //                 }
    //             }
    //         }
        
            // // アイテムサイズ情報（仮設定）
            // let width = 1;
            // let height = 1;
            // if (itemName === "木の枝") {
            //     width = 1;
            //     height = 5;
            // } else if (itemName === "どんぐり") {
            //     width = 1;
            //     height = 1;
            // }
        
            // ⭐ inventoryImageをuserDataからコピー
        //     this.addToCustomInventory(object.userData);

        
        //     this.removeHighlight();
        // };
        

/////////////////////////////////////////////////////////////////////////
// 2Dインベントリ操作 ////////////////////////////////////////////////////
////////////////////////\///////////////////////////////////////////////
        
// // 指定位置 (x, y) にアイテムを配置し、UI更新＆重量加算する。
// // グリッドを width x height の範囲で埋める。
// Scene_Map.prototype.placeItemInInventory = function(item, x, y, w, h) {
//     for (let dy = 0; dy < h; dy++) {
//         for (let dx = 0; dx < w; dx++) {
//             this._customInventoryGrid[y - dy][x + dx] = item;
//         }
//     }
//     this.refreshInventoryUI();
//     this._inventory2DWeight += item.weight || 0;
//     this.updateInventory2DWeight();
// };

// // カスタムインベントリにアイテムを追加する。
// // 指定位置があればそこに配置、なければ自動的に空きマスを探す。
// Scene_Map.prototype.addToCustomInventory = function(item, startX = null, startY = null) {
//     const w = item.width;
//     const h = item.height;
//     console.log( "w" , w );
//     console.log( "h" , h );

//     if (startX !== null && startY !== null) {
//         // 指定位置に置く
//         this.placeItemInInventory(item, startX, startY, w, h);
//         return true;
//     }

//     // 左下から探索して自動配置
//     for (let y = 4; y >= 0; y--) {
//         for (let x = 0; x < 5; x++) {
//             if (this.canPlaceItemAt(x, y, w, h)) {
//                 this.placeItemInInventory(item, x, y, w, h);
//                 return true;
//             }
//         }
//     }

//     console.log(`No space for ${item.name}`);
//     return false;
// };

        
// // 指定した(x, y)位置に、width x height サイズのアイテムを配置できるか判定する。
// // インベントリ外の範囲に収まっているか＆既存のアイテムと重なっていないかを確認する。
// Scene_Map.prototype.canPlaceItemAt = function(x, y, width, height) {
//     // 範囲外チェック
//     if (x + width > 5 || y - height + 1 < 0) {
//         return false;
//     }
//     // 配置予定の全セルを確認
//     for (let dy = 0; dy < height; dy++) {
//         for (let dx = 0; dx < width; dx++) {
//             if (this._customInventoryGrid[y - dy][x + dx]) {
//                 return false;  // すでに埋まっている
//             }
//         }
//     }
//     return true;
// };


// // インベントリ内の(x, y)位置のアイテムをドラッグ開始する。
// // フローティング画像を作り、マウス移動に合わせて画面上を追従させる。
// // 元のインベントリからは一旦アイテムを取り除く。
// Scene_Map.prototype.startDragItem = function (x, y) {
//     const item = this._customInventoryGrid[y][x];

//     console.log("item", item);
// console.log("item.userData", item.userData);

//     if (!item) return;

//     // ドラッグ対象のデータを保持
//     this._draggingItem = {
//         item: item,
//         originX: x,
//         originY: y,
//         currentRotation: item.rotation || 0
//     };

//     // アイテム画像を取得（userData.inventoryImage を想定）
//     const imageUrl = item.inventoryImage || '3D/image/default.png';
//     console.log("imageUrl", imageUrl);

//     // ドラッグ中のフローティング画像を作成
//     const dragImage = document.createElement('div');
//     dragImage.id = 'drag-image';
//     dragImage.style.position = 'absolute';
//     dragImage.style.pointerEvents = 'none';  // クリックを邪魔しない
//     dragImage.style.width = '80px';
//     dragImage.style.height = '80px';
//     dragImage.style.background = 'rgba(255,255,255,0.9)';
//     dragImage.style.border = '1px solid #000';
//     dragImage.style.display = 'flex';
//     dragImage.style.alignItems = 'center';
//     dragImage.style.justifyContent = 'center';
//     dragImage.style.fontSize = '12px';
//     dragImage.style.backgroundImage = `url("${imageUrl}")`;
//     dragImage.style.backgroundSize = 'cover';
//     dragImage.style.backgroundPosition = 'center';
//     dragImage.style.zIndex = '9999';

//     document.body.appendChild(dragImage);

//     // ⭐ 最初の配置（TouchInput経由で現在位置を取得）
//     const mouseX = TouchInput.x || 0;
//     const mouseY = TouchInput.y || 0;
//     dragImage.style.left = `${mouseX - 40}px`;
//     dragImage.style.top = `${mouseY - 40}px`;

//     // マウスムーブで追従させる
//     this._onMouseMoveDrag = (e) => {
//         dragImage.style.left = `${e.pageX - 40}px`;  // 中心合わせ
//         dragImage.style.top = `${e.pageY - 40}px`;
//     };
//     document.addEventListener('mousemove', this._onMouseMoveDrag);

//     // インベントリからアイテムを消去（仮の「取り出し」）
//     this.removeItemFromGrid(item);
//     // 💡 この段階では UI リフレッシュは行わず、見た目は保つ
// };


// // ドロップ処理を行う。
// // ドラッグ中のアイテムを(x, y)に配置できるか判定し、
// // 成功すれば配置、失敗なら元の位置に戻す。
// // ドラッグ用の追従画像もここで片付ける。
// Scene_Map.prototype.onDropItem = function (e, x, y) {
//     if (!this._draggingItem) {
//         console.warn('ドロップ時、ドラッグ中のアイテムが存在しません。');
//         return;
//     }

//     const item = this._draggingItem.item;
//     const rotated = this._draggingItem.currentRotation % 180 !== 0;
//     const w = rotated ? item.height : item.width;
//     const h = rotated ? item.width : item.height;

//     if (this.canPlaceItemAt(x, y, w, h)) {
//         // 成功：配置
//         this.placeItemInInventory(item, x, y, w, h);
//     } else {
//         console.log('ドロップ失敗: スペース不足');
//         // 失敗：元の位置に戻す
//         this.addToCustomInventory(item, this._draggingItem.originX, this._draggingItem.originY);
//     }

//     // ドラッグ中の追従画像を削除
//     const dragImage = document.getElementById('drag-image');
//     if (dragImage) {
//         dragImage.remove();
//     }
//     document.removeEventListener('mousemove', this._onMouseMoveDrag);
//     this._onMouseMoveDrag = null;

//     // UI更新と状態リセット
//     this.refreshInventoryUI();
//     this._draggingItem = null;
// };

// // インベントリ全体をリフレッシュして見た目を更新する。
// // 各スロットに対応するアイテムを描画（画像 or テキスト）。
// Scene_Map.prototype.refreshInventoryUI = function () {
//     const cellSize = this._inventorySlots[0].offsetWidth;

//     for (let y = 0; y < 5; y++) {
//         for (let x = 0; x < 5; x++) {
//             const slotIndex = y * 5 + x;
//             const slot = this._inventorySlots[slotIndex];
//             const item = this._customInventoryGrid[y][x];

//             // スロットを初期化
//             this.resetInventorySlot(slot);

//             if (item) {
//                 if (item.name === '木の枝') {
//                     this.handleBranchSlot(slot, item, x, y);
//                 } else if (item.name === 'どんぐり') {
//                     this.setSlotImage(slot, "3D/image/acorn.png");
//                 } else {
//                     this.setSlotText(slot, item.name);
//                 }
//             }
//         }
//     }
// };

// // 各スロットをリセットする。
// // 背景やテキスト、子要素をクリアする。
// Scene_Map.prototype.resetInventorySlot = function(slot) {
//     slot.style.backgroundColor = 'rgba(50, 50, 50, 0.5)';
//     slot.style.backgroundImage = '';
//     slot.innerText = '';
//     while (slot.firstChild) {
//         slot.removeChild(slot.firstChild);
//     }
// };

// // スロットに画像を設定する。
// // 画像パス、サイズ、位置を指定できる。
// Scene_Map.prototype.setSlotImage = function(slot, imgPath, size = 'cover', position = 'center') {
//     slot.style.backgroundImage = `url("${imgPath}")`;
//     slot.style.backgroundSize = size;
//     slot.style.backgroundPosition = position;
//     slot.style.backgroundRepeat = 'no-repeat';
// };

// // スロットにテキスト表示を設定する。
// // アイテム名の先頭文字を表示。
// Scene_Map.prototype.setSlotText = function(slot, name) {
//     slot.style.backgroundColor = 'rgba(150, 75, 0, 0.8)';
//     slot.innerText = name[0];
//     slot.style.color = 'white';
//     slot.style.textAlign = 'center';
//     slot.style.fontSize = '16px';
// };

// // 木の枝専用：5マス縦長の画像を分割表示する。
// // 各スロットに適した背景位置を設定。
// Scene_Map.prototype.handleBranchSlot = function(slot, item, x, y) {
//     const originY = this.findItemOriginY(item, x);
//     const segment = y - originY; // 0〜4

//     if (segment >= 0 && segment < 5) {
//         this.setSlotImage(
//             slot,
//             "3D/image/branch.png",
//             '100% 500%',
//             `0% ${segment * 20}%`
//         );
//     }
// };

// // 木の枝など縦長アイテムの「先頭マス（最上段）」を探す。
// // 指定列 x の中で、このアイテムの開始位置を返す。
// Scene_Map.prototype.findItemOriginY = function(item, x) {
//     for (let y = 0; y < 5; y++) {
//         if (this._customInventoryGrid[y][x] === item &&
//             this._customInventoryGrid[y - 1]?.[x] !== item) {
//             return y;
//         }
//     }
//     return -1;
// };

// // 指定アイテムをインベントリの全マスから削除する。
// // グリッド上の null 置き換えを行う。
// Scene_Map.prototype.removeItemFromGrid = function (item) {
//     for (let y = 0; y < 5; y++) {
//         for (let x = 0; x < 5; x++) {
//             if (this._customInventoryGrid[y][x] === item) {
//                 this._customInventoryGrid[y][x] = null;
//             }
//         }
//     }
// };

        
        
////////////////////////////////////////////////////////////////////////
// アイテム名の表示 /////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

// 画面中央付近に「アイテム名を表示するウィンドウ」を作成する。
// すでに作成済みの場合はスキップする（二重作成防止）。
Scene_Map.prototype._createPickupNameWindow = function() {
    if (this._pickupNameElement) return;  // 二重作成防止

    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.top = '50%';
    div.style.left = '50%';
    div.style.transform = 'translate(-50%, -150%)';  // 画面中央より少し上
    div.style.color = '#ffffff';
    div.style.fontSize = '20px';
    div.style.fontFamily = 'Arial, sans-serif';
    div.style.textShadow = '0 0 5px #000';
    div.style.pointerEvents = 'none';  // クリック判定を邪魔しない
    div.style.zIndex = 20;
    div.style.display = 'none';  // 初期は非表示

    document.body.appendChild(div);
    this._pickupNameElement = div;  // 内部的に保存
};

// _pickupNameElement に指定したテキストを表示する。
// （地面に落ちているアイテムの名前を画面に出す時に使う）
Scene_Map.prototype.showPickupName = function(name) {
    if (this._pickupNameElement) {
        this._pickupNameElement.innerText = name;
        this._pickupNameElement.style.display = 'block';
    }
};

// _pickupNameElement を非表示にする。
// （ピックアップ対象がなくなった or 範囲外になった時などに呼ばれる）
Scene_Map.prototype.hidePickupName = function() {
    if (this._pickupNameElement) {
        this._pickupNameElement.style.display = 'none';
    }
};


///////////////////////////////////////////////////////////////
// 疑似3Dインベントリ //////////////////////////////////////////
//////////////////////////////////////////////////////////////

// Scene_Map.prototype.inventory3DCreate = function() {
//     if (document.getElementById('inventory-3d')) return;
//     console.log("inventory3DCreate");

//     // 3Dインベントリの箱を作る
//     this.createInventory3DElements();

//     // データ構造を初期化する
//     this.initInventory3DGrid();

//     // 重量表示UIを作る
//     this.createInventory3DWeightDisplay();
// };

// Scene_Map.prototype.createInventory3DElements = function() {
//     const container = document.createElement('div');
//     container.id = 'inventory-3d';
//     container.style.position = 'absolute';
//     container.style.top = '50%';
//     container.style.left = '50%';
//     container.style.transform = 'translate(-50%, -50%) rotateX(30deg) rotateY(-20deg)';
//     container.style.width = '400px';
//     container.style.height = '400px';
//     container.style.transformStyle = 'preserve-3d';
//     container.style.zIndex = '1001';
//     container.style.display = 'none';  // 初期は非表示

//     // === 各面を作る ===
//     const floor = document.createElement('div');
//     floor.className = 'inventory3d-face floor';
//     container.appendChild(floor);

//     const wallLeft = document.createElement('div');
//     wallLeft.className = 'inventory3d-face wall-left';
//     container.appendChild(wallLeft);

//     const wallBack = document.createElement('div');
//     wallBack.className = 'inventory3d-face wall-back';
//     container.appendChild(wallBack);

//     document.body.appendChild(container);
// };

// Scene_Map.prototype.initInventory3DGrid = function() {
//     this._inventory3DGrid = {
//         floor: Array.from({ length: 5 }, () => Array(5).fill(null)),
//         wallLeft: Array.from({ length: 5 }, () => Array(5).fill(null)),
//         wallBack: Array.from({ length: 5 }, () => Array(5).fill(null)),
//     };
//     this._inventory3DWeight = 0;
//     this._inventory3DMaxWeight = 10000;  // 10kg
// };

// Scene_Map.prototype.createInventory3DWeightDisplay = function() {
//     const weightDisplay = document.createElement('div');
//     weightDisplay.id = 'inventory-3d-weight';
//     weightDisplay.style.position = 'absolute';
//     weightDisplay.style.top = '10px';
//     weightDisplay.style.right = '10px';
//     weightDisplay.style.background = 'rgba(0,0,0,0.7)';
//     weightDisplay.style.color = 'white';
//     weightDisplay.style.padding = '5px 10px';
//     weightDisplay.style.borderRadius = '4px';
//     weightDisplay.style.zIndex = '1002';
//     weightDisplay.innerText = `重量: 0g / ${this._inventory3DMaxWeight / 1000}kg`;
//     document.body.appendChild(weightDisplay);
// };

    
// Scene_Map.prototype.inject3DInventoryStyles = function() {
//     if (document.getElementById('inventory-3d-styles')) return;

//     const style = document.createElement('style');
//     style.id = 'inventory-3d-styles';
//     style.innerHTML = `
//     #inventory-3d .inventory3d-face {
//         position: absolute;
//         width: 400px;
//         height: 400px;
//         background: rgba(0, 0, 0, 0.5);
//         border: 1px solid #333;
//         box-sizing: border-box;
//     }

//     #inventory-3d .floor {
//         transform: rotateX(-90deg) translateZ(200px) rotate(var(--floor-rotate, 0deg));
//         background-image:
//             linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
//             linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
//         background-size: 80px 80px;
//     }

//     #inventory-3d .wall-left {
//         transform: rotateY(-270deg) translateZ(200px) rotate(var(--wall-left-rotate, 0deg));
//         background-image:
//             linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
//             linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
//         background-size: 80px 80px;
//     }

//     #inventory-3d .wall-back {
//         transform: translateZ(200px) rotate(var(--wall-back-rotate, 0deg));
//         background-image:
//             linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
//             linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
//         background-size: 80px 80px;
//     }

//     #inventory-3d .inventory3d-cell {
//         box-sizing: border-box;
//         pointer-events: none;
//     }

//     #inventory-3d .inventory3d-item-panel {
//         box-sizing: border-box;
//         pointer-events: none;
//         text-align: center;
//         color: #000;
//         font-weight: bold;
//         backface-visibility: hidden;
//     }

//     #inventory-3d .inventory3d-box-face {
//     box-sizing: border-box;
//     backface-visibility: hidden;
//     pointer-events: none;
//     }

//     `;
//     document.head.appendChild(style);
// };



// Scene_Map.prototype.updateInventory3DWeight = function() {
//     const weightDiv = document.getElementById('inventory-3d-weight');
//     if (!weightDiv) return;

//     const kg = (this._inventory3DWeight / 1000).toFixed(2);
//     const maxKg = (this._inventory3DMaxWeight / 1000).toFixed(2);
//     weightDiv.innerText = `重量: ${kg}kg / ${maxKg}kg`;
// };


///////////////////////////////////////////////////////////////
// 疑似3Dインベントリ 操作 /////////////////////////////////////
//////////////////////////////////////////////////////////////

// Scene_Map.prototype.addItemTo3DInventory = function(item) {
//     const floor = document.querySelector('#inventory-3d .floor');
//     if (!floor) return;

//     const gridSize = 5;
//     const cellSize = 400 / gridSize;  // 80px

//     let placed = false;
//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             if (this._inventory3DGrid.floor[row][col] === null) {
//                 // データ構造に登録
//                 this._inventory3DGrid.floor[row][col] = {
//                     name: item.name,
//                     width: item.width,
//                     height: item.height,
//                     depth: item.depth || 1,
//                     weight: item.weight || 0
//                 };

//                 // 重さを足す
//                 this._inventory3DWeight += item.weight || 0;
//                 this.updateInventory3DWeight();

//                 // 見た目を作る
//                 const cell = document.createElement('div');
//                 cell.className = 'inventory3d-cell';
//                 cell.style.position = 'absolute';
//                 cell.style.width = `${cellSize}px`;
//                 cell.style.height = `${cellSize}px`;
//                 cell.style.left = `${col * cellSize}px`;
//                 cell.style.bottom = `${row * cellSize}px`;
//                 cell.style.background = 'rgba(255, 255, 255, 0.7)';
//                 cell.style.border = '1px solid #666';
//                 cell.style.perspective = '400px';  // 立体効果のため
//                 cell.style.display = 'flex';
//                 cell.style.alignItems = 'center';
//                 cell.style.justifyContent = 'center';
//                 cell.style.fontSize = '12px';
//                 cell.innerText = item.name;

//                 // テキスト用の立つパネルを作る
//                 const itemPanel = document.createElement('div');
//                 itemPanel.className = 'inventory3d-item-panel';
//                 itemPanel.style.width = '80px';
//                 itemPanel.style.height = '80px';
//                 itemPanel.style.background = 'rgba(255, 255, 255, 0.9)';
//                 itemPanel.style.border = '1px solid #000';
//                 itemPanel.style.display = 'flex';
//                 itemPanel.style.alignItems = 'center';
//                 itemPanel.style.justifyContent = 'center';
//                 itemPanel.style.fontSize = '12px';
//                 itemPanel.innerText = item.name;

//                 // 壁っぽく配置
//                 itemPanel.style.transform = 'rotateX(90deg) translateZ(40px)';
//                 itemPanel.style.transformOrigin = 'bottom center';

//                 cell.appendChild(itemPanel);
//                 floor.appendChild(cell);

                

//                 placed = true;
//                 break;
//             }
//         }
//         if (placed) break;
//     }

//     if (!placed) {
//         console.log("3Dインベントリが満杯です！");
//     }
// };
