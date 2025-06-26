  ////////////////////////////////////////////////////////////////////////
  // リュックの設定 //////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////

  Scene_Map.prototype.initInventoryData = function () {
    // 5x5の2D配列を作る（nullは空、オブジェクトが入れば埋まっている）
    this._customInventoryGrid = Array.from({ length: 5 }, () => Array(5).fill(null));
    // グリッドのslot参照を保存（後でUI更新しやすくする）
    this._inventorySlots = [];
  };


Scene_Map.prototype.inventoryCreate = function() {
    if (document.getElementById('inventory-overlay')) return;

    const inventoryDiv = document.createElement('div');
    inventoryDiv.id = 'inventory-overlay';
    inventoryDiv.style.position = 'absolute';
    inventoryDiv.style.top = '50%';
    inventoryDiv.style.left = '50%';
    inventoryDiv.style.transform = 'translate(-50%, -50%)';
    inventoryDiv.style.width = '400px';
    inventoryDiv.style.height = '400px';
    inventoryDiv.style.border = '2px solid black';
    inventoryDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    inventoryDiv.style.zIndex = '1000';

    
    // === グリッド作成 ===
    const gridSize = 5; // 5x5 グリッド
    inventoryDiv.style.display = 'grid';
    inventoryDiv.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    inventoryDiv.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    inventoryDiv.style.gap = '2px'; // スロット間の隙間
    
    for (let i = 0; i < gridSize * gridSize; i++) {
        const slot = document.createElement('div');
        slot.style.border = '1px solid #666';
        slot.style.backgroundColor = 'rgba(50, 50, 50, 0.5)';
        slot.style.width = '100%';
        slot.style.height = '100%';
        slot.style.boxSizing = 'border-box';
        inventoryDiv.appendChild(slot);
        this._inventorySlots.push(slot);
    
        const slotX = i % gridSize;
        const slotY = Math.floor(i / gridSize);
    
        slot.dataset.x = slotX;
        slot.dataset.y = slotY;
    
        // ドラッグ開始
        slot.addEventListener('mousedown', (e) => {
            this.startDragItem(slotX, slotY);
        });
    
        // ドラッグ終了（ここに付ける！）
        slot.addEventListener('mouseup', (e) => {
            this.onDropItem(e, slotX, slotY);
        });
    }

    // 初期は隠しておく（display: grid は維持したまま！）
    inventoryDiv.style.display = 'none';
    this._inventory2DWeight = 0;      // 現在の総重量（グラム）
    this._inventory2DMaxWeight = 10000;  // 例: 10kg = 10000g

    const weightDisplay2D = document.createElement('div');
    weightDisplay2D.id = 'inventory-2d-weight';
    weightDisplay2D.style.position = 'absolute';
    weightDisplay2D.style.top = '10px';
    weightDisplay2D.style.right = '10px';
    weightDisplay2D.style.background = 'rgba(0,0,0,0.7)';
    weightDisplay2D.style.color = 'white';
    weightDisplay2D.style.padding = '5px 10px';
    weightDisplay2D.style.borderRadius = '4px';
    weightDisplay2D.style.zIndex = '1002';
    weightDisplay2D.innerText = `重量: 0g / ${this._inventory2DMaxWeight / 1000}kg`;
    weightDisplay2D.style.display = 'none';
    document.body.appendChild(weightDisplay2D);

    document.body.appendChild(inventoryDiv);
};

Scene_Map.prototype.updateInventory2DWeight = function() {
    const weightDiv = document.getElementById('inventory-2d-weight');
    if (!weightDiv) return;

    const kg = (this._inventory2DWeight / 1000).toFixed(2);
    const maxKg = (this._inventory2DMaxWeight / 1000).toFixed(2);
    weightDiv.innerText = `重量: ${kg}kg / ${maxKg}kg`;
};


/////////////////////////////////////////////////////////////////////////
// インベントリの表示切替 ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

// 2Dインベントリのトグル
Scene_Map.prototype.inventory2DToggle = function() {
    const inventoryDiv = document.getElementById('inventory-overlay');
    const weightDiv = document.getElementById('inventory-2d-weight');
    if (!inventoryDiv || !weightDiv) return;

    const isCurrentlyVisible = inventoryDiv.style.display === 'grid';

    if (isCurrentlyVisible) {
        // 閉じる
        inventoryDiv.style.display = 'none';
        weightDiv.style.display = 'none';
        this.lockPointer();
        this._draggingItem = null;
    } else {
        // 開く
        inventoryDiv.style.display = 'grid';
        weightDiv.style.display = 'block';
        this.unlockPointer();
    }
};

// ポインターロック
Scene_Map.prototype.lockPointer = function() {
    if (document.body.requestPointerLock) {
        document.body.requestPointerLock();
    }
};

// ポインターロック解除
Scene_Map.prototype.unlockPointer = function() {
    if (document.exitPointerLock) {
        document.exitPointerLock();
    }
};
