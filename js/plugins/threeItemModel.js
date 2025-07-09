/*:
 * @target MZ
 * @plugindesc アイテムオブジェクト用
 * @author サラ
 * @help
 * アイテムオブジェクトを定義しています
 */


(() => {
    /////////////////////////////////////////////////////////////////////////
    // アイテムのモデリング //////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////
    
class SurvivalItem {
    constructor({
        geometry,
        texturePath,
        position = { x: 0, y: 0, z: 0 },
        rotation = { x: 0, y: 0, z: 0 },
        scale = { x: 1, y: 1, z: 1 },
        itemData = {}
    }) {
        const texture = new THREE.TextureLoader().load(texturePath);
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 1,
            metalness: 0,
            side: THREE.DoubleSide,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position.x, position.y, position.z);
        this.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
        this.mesh.scale.set(scale.x, scale.y, scale.z);

        this.mesh.userData = itemData;
        this.data = itemData;
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }

    get hydration() {
        return this.data.hydration || 0;
    }

    get capacity() {
        return this.data.capacity || 0;
    }
}

Scene_Map.prototype.createBranch = function(x, z) {
    const geometry = new THREE.CylinderGeometry(0.1, 0.1, 1.0, 8);

    const item = new SurvivalItem({
        geometry,
        texturePath: '3D/textures/bark_brown_02_diff_4k.jpg',
        position: { x: x, y: 0.1, z: z },
        rotation: { x: 0, y: 0, z: Math.PI / 2 },
        itemData: {
            itemId: 1,
            itemAmount: 1,
            itemName: "木の枝",
            width: 1,
            height: 5,
            weight: 100,
            inventoryImage: '3D/image/branch.png',
            hydration: 0,
            capacity: 0
        }
    });

    item.addToScene(this._threeScene);

    if (!this._branches) this._branches = [];
    this._branches.push(item);
};

Scene_Map.prototype.createAcorn = function(x, z) {
    const geometry = new THREE.SphereGeometry(0.15, 16, 16);

    const acorn = new SurvivalItem({
        geometry,
        texturePath: '3D/textures/wood_table_001_diff_4k.jpg',
        position: { x: x, y: 0.075, z: z },
        rotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 },
        scale: { x: 0.25, y: 0.325, z: 0.25 },
        itemData: {
            itemId: 2,
            itemAmount: 1,
            itemName: "どんぐり",
            width: 1,
            height: 1,
            weight: 1,
            inventoryImage: '3D/image/acorn.png',
            hydration: 2,   // 例：どんぐりの水分値（食べたとき用）
            capacity: 0     // 例：収納などに使えない
        }
    });

    acorn.addToScene(this._threeScene);

    if (!this._acorns) this._acorns = [];
    this._acorns.push(acorn);
};



    
///////////////////////////////////////////////////////////////////////
// GLTFモデル ////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

class GltfModelItem {
    constructor({
        modelPath,
        position = { x: 0, y: 0, z: 0 },
        rotation = { x: 0, y: 0, z: 0 },
        scale = { x: 1, y: 1, z: 1 },
        itemData = {},
        scene // THREE.Scene インスタンス
    }) {
        this.data = itemData;

        const loader = new THREE.GLTFLoader();
        loader.load(modelPath, (gltf) => {
            this.mesh = gltf.scene;
            this.mesh.position.set(position.x, position.y, position.z);
            this.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
            this.mesh.scale.set(scale.x, scale.y, scale.z);
            this.mesh.userData = itemData;

            scene.add(this.mesh);

            console.log("[GltfModelItem] モデル追加:", itemData.itemName);
        }, undefined, (err) => {
            console.error("[GltfModelItem] 読み込み失敗:", err);
        });
    }
}

Scene_Map.prototype.createKuromatu = function (x, z) {
    const itemData = {
        itemId: 3,
        itemAmount: 1,
        itemName: "黒松",
        width: 1,
        height: 1,
        weight: 5,
        inventoryImage: '3D/image/acorn.png',
        hydration: 1,
        capacity: 0
    };

    new GltfModelItem({
        modelPath: '3D/models/kuromatu.glb',  // GLB or GLTFファイル
        position: { x: x, y: 0.05, z: z },
        scale: { x: 0.3, y: 0.3, z: 0.3 },
        itemData,
        scene: this._threeScene
    });
};



    ///////////////////////////////////////////////////////////////////////
    // アイテム効果 ////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////

    const _Game_Actor_meetsItemConditions = Game_Actor.prototype.meetsItemConditions;
    Game_Actor.prototype.meetsItemConditions = function(item) {
        // 元の判定
        const base = _Game_Actor_meetsItemConditions.call(this, item);
    
        // 常時使用可能なら無条件OKにする
        if (item && item.occasion === 0) { // 0 = 常時
            return true;
        }
    
        return base;
    };
    


    const _Game_Actor_useItem = Game_Actor.prototype.useItem;
    Game_Actor.prototype.useItem = function(item) {
        _Game_Actor_useItem.call(this, item);
    
        if (item && item.id === 2) { // アイテムID 2 = どんぐり
            console.log("どんぐりを使ったよ！");
    
            // 水分回復
            const currentWater = this.water();
            this.setWater(Math.min(100, currentWater + 1));
    
            // 空腹回復
            const currentHunger = this.hunger();
            this.setHunger(Math.min(100, currentHunger + 2));
    
            // ★ デバッグログ
            console.log(`水分: ${this.water()} 空腹: ${this.hunger()}`);
        }
    };
    


})();
