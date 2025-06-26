/*:
 * @target MZ
 * @plugindesc 地形モデルです
 * @author サラ
 * @help
 * 地形の描画に対してテクスチャを張っています
 */

(() => {

class GroundSurface {
    constructor({
        width = 50,
        height = 50,
        segmentsX = 1,
        segmentsZ = 1,
        texturePath = '3D/textures/forrest_ground_01_diff_4k.jpg',
        repeat = 5,
        positionY = 0
    }) {
        console.log("[GroundSurface] 初期化: size =", width, "x", height, "segments =", segmentsX, "x", segmentsZ);

        this.width = width;
        this.height = height;
        this.segmentsX = segmentsX;
        this.segmentsZ = segmentsZ;
        this.texturePath = texturePath;
        this.repeat = repeat;
        this.positionY = positionY;

        this.mesh = this._createGroundMesh();
    }

    _createGroundMesh() {
        console.log("[GroundSurface] テクスチャ読み込み:", this.texturePath);
        const geometry = new THREE.PlaneGeometry(this.width, this.height, this.segmentsX, this.segmentsZ);

        const texture = new THREE.TextureLoader().load(this.texturePath, () => {
            console.log("[GroundSurface] テクスチャロード成功");
        }, undefined, (err) => {
            console.error("[GroundSurface] テクスチャロード失敗:", err);
        });

        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(this.width / this.repeat, this.height / this.repeat);

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = this.positionY;
        mesh.userData = { type: 'ground' };

        console.log("[GroundSurface] メッシュ作成完了");
        return mesh;
    }

    addToScene(scene) {
        scene.add(this.mesh);
        console.log("[GroundSurface] シーンに追加完了");
    }

    applyHeightMap(heightFunction) {
    const vertices = this.mesh.geometry.attributes.position;
    console.log("[GroundSurface] 高さ変形開始: 頂点数 =", vertices.count);

    let maxY = -Infinity, minY = Infinity;

    for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i);
        const z = vertices.getZ ? vertices.getZ(i) : vertices.getY(i); // XY平面の可能性に対応
        const y = heightFunction(x, z);
        vertices.setZ ? vertices.setZ(i, y) : vertices.setY(i, y); // Y→Z へ適用

        if (y > maxY) maxY = y;
        if (y < minY) minY = y;
    }

    vertices.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();

    console.log("[GroundSurface] 高さ適用完了: minY =", minY, "maxY =", maxY);
}

}

// Scene_Map.prototype.createMountain = function () {
//     const size = 50;
//     const segments = 32;

//     const ground = new GroundSurface({
//         width: size,
//         height: size,
//         segmentsX: segments,
//         segmentsZ: segments,
//         texturePath: '3D/textures/forrest_ground_01_diff_4k.jpg',
//         repeat: 10,
//         positionY: 0
//     });

//     // 修正後の高さマップ（中心考慮）
//     const halfWidth = size / 2;
//     const halfHeight = size / 2;

//     ground.applyHeightMap((x, z) => {
//         const scale = 0.3;
//         const px = x - halfWidth;
//         const pz = z - halfHeight;
//         return Math.sin(px * scale) * Math.cos(pz * scale) * 4;
//     });

//     ground.addToScene(this._threeScene);
//     this._ground = ground;
// };


// ノーマルマップ無し
Scene_Map.prototype.createGround = function () {
    const groundSize = 50; // 地面の広さ（500×500）

    const geometry = new THREE.PlaneGeometry(groundSize, groundSize, 1, 1);

    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load('3D/textures/forrest_ground_01_diff_4k.jpg'); // 色テクスチャ

    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(groundSize / 10, groundSize / 10);

    const material = new THREE.MeshStandardMaterial({
        map: grassTexture,
        side: THREE.DoubleSide,
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;

    this._threeScene.add(ground);
};
    



})();