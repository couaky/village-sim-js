import * as BABYLON from 'babylonjs'
import { Container } from 'typedi';

import { ModelsManager } from './modelsManager';
import { Tree } from './tree';
import { TWO_PI, getRandomIntInclusive } from './utils';

interface RiverData {
    boundLeft: number;
    boundRight: number;
    points: BABYLON.Vector3[];
}

export class Terrain {
    scene: BABYLON.Scene;
    modelManager: ModelsManager;

    grassMat!: BABYLON.StandardMaterial;
    waterMat!: BABYLON.StandardMaterial;

    trees: Tree[] = [];
    river?: RiverData;

    // Settings
    private tileSize = 100;
    private halfTileSize = this.tileSize / 2;
    private riverWidth = 10;
    private riverEdgesWidth = 1;
    private halfRiverWidth = this.riverWidth / 2;
    private clusterSettings = {
        min: 2,
        max: 5,
        minTrees: 3,
        maxTrees: 10,
        spawnTry: 50,
        spawnDistInc: 0.5
    };
    private sparseSettings = {
        min: 10,
        max: 20,
        spawnTry: 10
    };

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        this.modelManager = Container.get(ModelsManager);
        this.initMaterials();
    }

    private initMaterials() {
        // Mat
        this.grassMat = new BABYLON.StandardMaterial("grass", this.scene);
        this.grassMat.diffuseColor = new BABYLON.Color3(0, 1, 0);
        this.grassMat.specularColor = new BABYLON.Color3(0, 0, 0);
        this.grassMat.emissiveColor = new BABYLON.Color3(0, 0, 0);
        this.grassMat.ambientColor = new BABYLON.Color3(1, 1, 1);

        this.waterMat = new BABYLON.StandardMaterial("water", this.scene);
        this.waterMat.diffuseColor = new BABYLON.Color3(0.34, 0.79, 1);
        this.waterMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        this.waterMat.emissiveColor = new BABYLON.Color3(0, 0, 0);
        this.waterMat.ambientColor = new BABYLON.Color3(1, 1, 1);
    }

    generate() {
        this.generateRiverAndTerrain();

        // TODO: Add rocks
        this.generateTrees();
    }

    private generateRiverAndTerrain() {
        // TODO: Clean code here, split in functions
        const tileSize = this.tileSize;
        const halfSize = this.halfTileSize;
        // Tile
        // const tilePoints = [
        //     new BABYLON.Vector3(-halfSize, 0, halfSize),
        //     new BABYLON.Vector3(halfSize, 0, halfSize),
        //     new BABYLON.Vector3(halfSize, 0, -halfSize),
        //     new BABYLON.Vector3(-halfSize, 0, -halfSize),
        //     new BABYLON.Vector3(-halfSize, 0, halfSize)
        // ];
        // const tileLines = BABYLON.Mesh.CreateLines('tile1', tilePoints, this.scene);

        // River
        const tileMargin = 5;
        const riverWidth = this.riverWidth;
        const riverEdgesWidth = this.riverEdgesWidth;
        const riverCorridorWidth = 10;
        const riverDepth = 1;

        const halfRiverWidth = this.halfRiverWidth;
        const totalMargin = tileMargin + riverEdgesWidth + riverCorridorWidth / 2;
        const riverCorridorCenter = -halfSize + totalMargin + Math.random() * (tileSize - totalMargin * 2);
        const riverCorridorLeft = riverCorridorCenter - (riverCorridorWidth / 2);
        const riverStep = tileSize / 10;
        const riverPoints = [];
        for (let step = 0; step <= tileSize; step += riverStep) {
            riverPoints.push(new BABYLON.Vector3(riverCorridorLeft + Math.random() * riverCorridorWidth, 0, -halfSize + step));
        }
        const riverSpline = BABYLON.Curve3.CreateCatmullRomSpline(riverPoints, 4);
        // const riverRomSpline = BABYLON.Mesh.CreateLines("river1", riverSpline.getPoints(), this.scene);
        // const riverRomSplineL = riverRomSpline.clone("river1Left");
        // riverRomSplineL.position.x = -halfRiverWidth;
        // const riverRomSplineR = riverRomSpline.clone("river1Right");
        // riverRomSplineR.position.x = halfRiverWidth;

        // Draw corridor
        const riverCorridorRight = riverCorridorLeft + riverCorridorWidth;
        // const corridorPoints = [
        //     new BABYLON.Vector3(riverCorridorLeft, 0, halfSize),
        //     new BABYLON.Vector3(riverCorridorRight, 0, halfSize),
        //     new BABYLON.Vector3(riverCorridorRight, 0, -halfSize),
        //     new BABYLON.Vector3(riverCorridorLeft, 0, -halfSize),
        //     new BABYLON.Vector3(riverCorridorLeft, 0, halfSize)
        // ];
        // const corridorLines = BABYLON.Mesh.CreateLines('corridor', corridorPoints, this.scene);

        const extCorridorLeft = riverCorridorLeft - halfRiverWidth - riverEdgesWidth - 1;
        const extCorridorRight = riverCorridorLeft + halfRiverWidth + riverCorridorWidth + riverEdgesWidth + 1;
        // const extCorridorPoints = [
        //     new BABYLON.Vector3(extCorridorLeft, 0, halfSize),
        //     new BABYLON.Vector3(extCorridorRight, 0, halfSize),
        //     new BABYLON.Vector3(extCorridorRight, 0, -halfSize),
        //     new BABYLON.Vector3(extCorridorLeft, 0, -halfSize),
        //     new BABYLON.Vector3(extCorridorLeft, 0, halfSize)
        // ];
        // const extCorridorLines = BABYLON.Mesh.CreateLines('extendedCorridor', extCorridorPoints, this.scene);

        const riverLeftPoints = riverSpline.getPoints().map(point => {
            let newPoint = point.clone();
            newPoint.x -= halfRiverWidth;
            newPoint.y = -riverDepth;
            return newPoint
        });
        const riverRightPoints = riverSpline.getPoints().map(point => {
            let newPoint = point.clone();
            newPoint.x += halfRiverWidth;
            newPoint.y = -riverDepth;
            return newPoint
        });

        const riverBedMesh = BABYLON.MeshBuilder.CreateRibbon(
            "riverMesh",
            { pathArray: [riverLeftPoints, riverRightPoints] },
            this.scene
        );
        riverBedMesh.material = this.waterMat;
        riverBedMesh.convertToFlatShadedMesh();

        const riverLeftBankCurves = riverLeftPoints.map(point => {
            let newPoint = point.clone();
            newPoint.x -= riverEdgesWidth;
            newPoint.y = 0;
            return newPoint
        });
        const riverLeftEdgeCurves = riverLeftBankCurves.map(point => {
            let newPoint = point.clone();
            newPoint.x = extCorridorLeft;
            return newPoint
        });
        const riverLeftMesh = BABYLON.MeshBuilder.CreateRibbon(
            "riverLeft",
            { pathArray: [riverLeftEdgeCurves, riverLeftBankCurves, riverLeftPoints] },
            this.scene
        );
        riverLeftMesh.material = this.grassMat;
        riverLeftMesh.convertToFlatShadedMesh();

        const riverRightBankCurves = riverRightPoints.map(point => {
            let newPoint = point.clone();
            newPoint.x += riverEdgesWidth;
            newPoint.y = 0;
            return newPoint
        });
        const riverRightEdgeCurves = riverRightBankCurves.map(point => {
            let newPoint = point.clone();
            newPoint.x = extCorridorRight;
            return newPoint
        });
        const riverRightMesh = BABYLON.MeshBuilder.CreateRibbon(
            "riverRight",
            { pathArray: [riverRightPoints, riverRightBankCurves, riverRightEdgeCurves] },
            this.scene
        );
        riverRightMesh.material = this.grassMat;
        riverRightMesh.convertToFlatShadedMesh();

        // Rest of terrain
        const leftTerrainMesh = new BABYLON.Mesh("leftTerrain", this.scene);
        leftTerrainMesh.material = this.grassMat;
        const leftTerrainPoints = [
            -halfSize, 0, halfSize,
            extCorridorLeft, 0, halfSize,
            extCorridorLeft, 0, -halfSize,
            -halfSize, 0, -halfSize
        ];
        const leftTerrainIndices = [
            0, 2, 1,
            0, 3, 2
        ];
        const leftTerrainNormals = [] as any;
        BABYLON.VertexData.ComputeNormals(leftTerrainPoints, leftTerrainIndices, leftTerrainNormals);
        const leftTerrainVertexData = new BABYLON.VertexData();
        leftTerrainVertexData.positions = leftTerrainPoints;
        leftTerrainVertexData.indices = leftTerrainIndices;
        leftTerrainVertexData.normals = leftTerrainNormals;
        leftTerrainVertexData.applyToMesh(leftTerrainMesh);

        const rightTerrainMesh = new BABYLON.Mesh("rightTerrain", this.scene);
        rightTerrainMesh.material = this.grassMat;
        const rightTerrainPoints = [
            extCorridorRight, 0, halfSize,
            halfSize, 0, halfSize,
            halfSize, 0, -halfSize,
            extCorridorRight, 0, -halfSize
        ];
        const rightTerrainIndices = [
            0, 2, 1,
            0, 3, 2
        ];
        const rightTerrainNormals = [] as any;
        BABYLON.VertexData.ComputeNormals(rightTerrainPoints, rightTerrainIndices, rightTerrainNormals);
        const rightTerrainVertexData = new BABYLON.VertexData();
        rightTerrainVertexData.positions = rightTerrainPoints;
        rightTerrainVertexData.indices = rightTerrainIndices;
        rightTerrainVertexData.normals = rightTerrainNormals;
        rightTerrainVertexData.applyToMesh(rightTerrainMesh);

        this.river = {
            boundLeft: extCorridorLeft,
            boundRight: extCorridorRight,
            points: riverSpline.getPoints()
        };

        console.log(`River has ${this.river.points.length} points`);

        // See: https://sketchfab.com/3d-models/medieval-village-0e7dd1fd2cd64f828b625021e30704d4
    }

    private generateTrees() {
        const clusterSettings = this.clusterSettings;
        const clusterCount = getRandomIntInclusive(clusterSettings.min, clusterSettings.max);
        console.log(`Will generate ${clusterCount} clusters`);
        for (let i = 0; i < clusterCount; i++) {
            this.generateTreeCluster();
        }

        const halfSize = this.halfTileSize;
        const sparseSettings = this.sparseSettings;
        const treeCount = getRandomIntInclusive(sparseSettings.min, sparseSettings.max);
        console.log(`Will generate ${treeCount} sparse trees`);
        for (let i = 0; i < treeCount; i++) {
            for (let tryIt = 0; tryIt < clusterSettings.spawnTry; tryIt++) {
                const treePos = BABYLON.Vector2.Random(-halfSize, halfSize);
                const spawnedTree = this.trySpawnTree(treePos);
                if (spawnedTree) {
                    break;
                }
            }
        }
    }

    private generateTreeCluster() {
        const halfSize = this.halfTileSize;
        const clusterCenter = BABYLON.Vector2.Random(-halfSize, halfSize);
        console.log(`Create cluster B at ${clusterCenter}`);
        const clusterSettings = this.clusterSettings;
        const treeCount = getRandomIntInclusive(clusterSettings.minTrees, clusterSettings.maxTrees);
        for (let i = 0; i < treeCount; i++) {
            let distance = 0;
            for (let tryIt = 0; tryIt < clusterSettings.spawnTry; tryIt++) {
                const angle = Math.random() * TWO_PI;
                let spawnDir = new BABYLON.Vector2(1, 0);
                spawnDir.rotateToRef(angle, spawnDir);
                spawnDir = spawnDir.multiplyByFloats(distance, distance);
                const spawnedTree = this.trySpawnTree(clusterCenter.add(spawnDir));
                if (spawnedTree) {
                    break;
                }
                distance += clusterSettings.spawnDistInc;
            }
        }
    }

    private trySpawnTree(spawnPosition: BABYLON.Vector2): Tree | undefined {
        // Out of terrain
        const halfSize = this.halfTileSize;
        if (spawnPosition.x < -halfSize || spawnPosition.x > halfSize || spawnPosition.y < -halfSize || spawnPosition.y > halfSize) {
            return undefined;
        }

        if (this.river) {
            if (spawnPosition.x > this.river.boundLeft && spawnPosition.x < this.river.boundRight) {
                const topIndex = this.river.points.findIndex(riverPoint => spawnPosition.y <= riverPoint.z);
                if (topIndex !== -1) {
                    const bottomIndex = Math.max(topIndex - 1, 0);
                    const left = Math.min(this.river.points[topIndex].x, this.river.points[bottomIndex].x) - this.halfRiverWidth - this.riverEdgesWidth;
                    const right = Math.max(this.river.points[topIndex].x, this.river.points[bottomIndex].x) + this.halfRiverWidth + this.riverEdgesWidth;
                    if (spawnPosition.x > left && spawnPosition.x < right) {
                        return undefined;
                    }
                }
            }
        }

        const treeOdds = [
            { maxOdd: 20,  modelName: 'PineS' },
            { maxOdd: 40,  modelName: 'PineM' },
            { maxOdd: 60,  modelName: 'PineL' },
            { maxOdd: 80,  modelName: 'TreeM' },
            { maxOdd: 100, modelName: 'TreeL' }
        ];
        const computedOdd = Math.random() * 100;
        const choosenTree = treeOdds.find(treeOdd => computedOdd < treeOdd.maxOdd);
        if (!choosenTree) {
            return undefined; // Should never happen
        }
        const spawnPos3 = new BABYLON.Vector3(spawnPosition.x, 0, spawnPosition.y);
        const boundingRadius = this.modelManager.getModelData(choosenTree.modelName).boundingRadius;
        const foundTooClose = this.trees.find(tree => {
            const distance = BABYLON.Vector3.Distance(tree.position, spawnPos3);
            return distance < (tree.boundingRadius + boundingRadius);
        });
        if (foundTooClose) {
            return undefined;
        }
        const createdTree = new Tree(choosenTree.modelName, spawnPos3, new BABYLON.Vector3(0, Math.random() * TWO_PI, 0));
        this.trees.push(createdTree);
        return createdTree;
    }
}
