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
        const geometry = new THREE.PlaneGeometry(this.width, this.height, this.segmentsX, this.segmentsZ);

        const texture = new THREE.TextureLoader().load(this.texturePath, () => {
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
        return mesh;
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }

    applyHeightMap(heightFunction) {
    const vertices = this.mesh.geometry.attributes.position;

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
}

}

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