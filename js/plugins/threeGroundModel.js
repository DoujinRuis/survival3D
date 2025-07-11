/*:
 * @target MZ
 * @plugindesc 地形モデルです
 * @author サラ
 * @help
 * 地形の描画に対してテクスチャを張っています
 */

(() => {

// class GroundSurface {
//     constructor({
//         width = 50,
//         height = 50,
//         segmentsX = 1,
//         segmentsZ = 1,
//         texturePath = '3D/textures/forrest_ground_01_diff_4k.jpg',
//         repeat = 5,
//         positionY = 0,
//     }) {
//         this.width = width;
//         this.height = height;
//         this.segmentsX = segmentsX;
//         this.segmentsZ = segmentsZ;
//         this.texturePath = texturePath;
//         this.repeat = repeat;
//         this.positionY = positionY;
//         this._heightMapCache = []; // 各頂点の現在の高さ（indexで管理）
//         this.mesh = this._createGroundMesh();
//     }

//     _createGroundMesh() {
//         const geometry = new THREE.PlaneGeometry(this.width, this.height, this.segmentsX, this.segmentsZ);

//         const texture = new THREE.TextureLoader().load(this.texturePath, () => {
//         }, undefined, (err) => {
//             console.error("[GroundSurface] テクスチャロード失敗:", err);
//         });

//         texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
//         texture.repeat.set(this.width / this.repeat, this.height / this.repeat);

//         const material = new THREE.MeshStandardMaterial({
//             map: texture,
//             side: THREE.DoubleSide
//         });

//         const mesh = new THREE.Mesh(geometry, material);
//         mesh.rotation.x = -Math.PI / 2;
//         mesh.position.y = this.positionY;
//         mesh.userData = { type: 'ground' };
//         return mesh;
//     }

//     addToScene(scene) {
//         scene.add(this.mesh);
//     }

//     // applyHeightMap(heightFunction) {
//     //     const vertices = this.mesh.geometry.attributes.position;

//     //     let maxY = -Infinity, minY = Infinity;

//     //     for (let i = 0; i < vertices.count; i++) {
//     //         const x = vertices.getX(i);
//     //         const z = vertices.getZ ? vertices.getZ(i) : vertices.getY(i); // XY平面の可能性に対応
//     //         const y = heightFunction(x, z);
//     //         vertices.setZ ? vertices.setZ(i, y) : vertices.setY(i, y); // Y→Z へ適用

//     //         if (y > maxY) maxY = y;
//     //         if (y < minY) minY = y;
//     //     }

//     //     vertices.needsUpdate = true;
//     //     this.mesh.geometry.computeVertexNormals();
//     // }

//     applyHeightMap(heightFunction) {
//         const posAttr = this.mesh.geometry.attributes.position;
//         const count = posAttr.count;

//         this._heightMapCache = new Array(count);

//         for (let i = 0; i < count; i++) {
//             const x = posAttr.getX(i);
//             const z = posAttr.getZ ? posAttr.getZ(i) : posAttr.getY(i);
//             const y = heightFunction(x, z);

//             if (posAttr.setZ) posAttr.setZ(i, y);
//             else posAttr.setY(i, y);

//             this._heightMapCache[i] = y;
//         }

//         posAttr.needsUpdate = true;
//         this.mesh.geometry.computeVertexNormals();
//     }

//     applyHeightPatch(heightFunction, centerX, centerZ, radius) {
//         const posAttr = this.mesh.geometry.attributes.position;
//         const count = posAttr.count;

//         for (let i = 0; i < count; i++) {
//             const x = posAttr.getX(i);
//             const z = posAttr.getZ ? posAttr.getZ(i) : posAttr.getY(i);

//             const dx = x - centerX;
//             const dz = z - centerZ;
//             const dist = Math.sqrt(dx * dx + dz * dz);
//             if (dist > radius) continue;

//             const patchY = heightFunction(x, z);

//             if (posAttr.setZ) posAttr.setZ(i, patchY);
//             else posAttr.setY(i, patchY);

//             this._heightMapCache[i] = patchY;
//         }

//         posAttr.needsUpdate = true;
//         this.mesh.geometry.computeVertexNormals();
//     }

//     getHeightAt(x, z) {
//         const geom = this.mesh.geometry;
//         const posAttr = geom.attributes.position;

//         const segmentsX = this.segmentsX;
//         const segmentsZ = this.segmentsZ;
//         const width = this.width;
//         const height = this.height;

//         const halfWidth = width / 2;
//         const halfHeight = height / 2;

//         const stepX = width / segmentsX;
//         const stepZ = height / segmentsZ;

//         const i = Math.floor((x + halfWidth) / stepX);
//         const j = Math.floor((z + halfHeight) / stepZ);

//         const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

//         const ii = clamp(i, 0, segmentsX);
//         const jj = clamp(j, 0, segmentsZ);

//         const index = jj * (segmentsX + 1) + ii;

//         const y = posAttr.getZ(index); // Zが高さ（applyHeightMapと同じ）
//         return y;
//     }


// }
    
// Scene_Map.prototype.createGround = function () {
//     const ground = new GroundSurface({
//         width: 50,
//         height: 50,
//         segmentsX: 50, // ← これで凹凸や穴が表現できる
//         segmentsZ: 50,
//         texturePath: '3D/textures/forrest_ground_01_diff_4k.jpg',
//         repeat: 10,
//         positionY: 0
//     });

//     this._holeList = [];
//     this._ground = ground;
//     ground.addToScene(this._threeScene);
// };

// Scene_Map.prototype.digHoleAt = function(x, z) {
//     const radius = 3.0;
//     const depth = -1.2;

//     const heightFunc = function(px, pz) {
//         const dx = px - x;
//         const dz = pz - z;
//         const dist = Math.sqrt(dx * dx + dz * dz);

//         if (dist < radius) {
//             const norm = dist / radius;
//             return depth * (1 - norm * norm); // 滑らかな凹み
//         }

//         return SceneManager._scene._ground.getHeightAt(px, pz); // 現在の高さを維持
//     };

//     this._ground.applyHeightPatch(heightFunc, x, z, radius);
// };







class VoxelChunk {
    constructor(scene, width = 16, height = 1, depth = 16) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.blockSize = 1.0;

        const total = width * height * depth;
        this.blocks = new Array(total).fill(1); // 1 = 土, 0 = 空

        this.meshGroup = new THREE.Group();
        this.scene.add(this.meshGroup);

        this._rebuildMesh();
    }

    index(x, y, z) {
        return x + this.width * (y + this.height * z);
    }

    getBlock(x, y, z) {
        const i = this.index(x, y, z);
        return this.blocks[i];
    }

    setBlock(x, y, z, value) {
        const i = this.index(x, y, z);
        this.blocks[i] = value;
    }

    _rebuildMesh() {
        this.meshGroup.clear();

        const geometry = new THREE.BoxGeometry(this.blockSize, this.blockSize, this.blockSize);
        const material = new THREE.MeshStandardMaterial({ color: 0x886633 });

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                for (let z = 0; z < this.depth; z++) {
                    if (this.getBlock(x, y, z) === 1) {
                        const mesh = new THREE.Mesh(geometry, material);
                        mesh.position.set(
                            x * this.blockSize,
                            y * this.blockSize,
                            z * this.blockSize
                        );
                        mesh.userData = { block: { x, y, z } };
                        this.meshGroup.add(mesh);
                    }
                }
            }
        }
    }

    removeBlockAtWorldPosition(pos) {
        const bs = this.blockSize;
        const x = Math.floor(pos.x / bs);
        const y = Math.floor(pos.y / bs);
        const z = Math.floor(pos.z / bs);

        if (x < 0 || x >= this.width || y < 0 || y >= this.height || z < 0 || z >= this.depth) return;

        this.setBlock(x, y, z, 0);
        this._rebuildMesh();
    }
}

Scene_Map.prototype.createGround = function () {
    const scene = this._threeScene;
    this._chunk = new VoxelChunk(scene, 16, 1, 16);
};

// Scene_Map.prototype.updateDigBlock = function () {
//     if (!this._chunk || !this._threeCamera) return;

//     const raycaster = new THREE.Raycaster();
//     const dir = new THREE.Vector3();
//     this._threeCamera.getWorldDirection(dir);
//     raycaster.set(this._threeCamera.position, dir);

//     const intersects = raycaster.intersectObjects(this._chunk.meshGroup.children);
//     if (intersects.length > 0) {
//         const hit = intersects[0];

//         // UI表示もできる：'Eキーでブロックを掘る'など

//         if (Input.isTriggered('e')) {
//             const pos = hit.point;
//             this._chunk.removeBlockAtWorldPosition(pos);
//         }
//     }
// };


})();