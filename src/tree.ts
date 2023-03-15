import * as BABYLON from 'babylonjs'
import { Container } from 'typedi';

import { ModelsManager } from './modelsManager';

interface FakeMesh {
    position: BABYLON.Vector3;
    rotation: BABYLON.Vector3;
}

let treeId = 0;

export class Tree {

    preloadData: FakeMesh;
    boundingRadius: number;
    mesh?: BABYLON.InstancedMesh;

    constructor(modelName: string, position: BABYLON.Vector3, rotation: BABYLON.Vector3) {
        this.preloadData = { position: position, rotation: rotation };
        const modelManager = Container.get(ModelsManager);
        this.boundingRadius = modelManager.getModelData(modelName).boundingRadius;
        modelManager.getModel(modelName).then(mesh => {
            this.mesh = mesh.createInstance(`tree${treeId++}`);
            this.mesh.position = this.preloadData.position;
            this.mesh.rotation = this.preloadData.rotation;
        });
    }

    get position(): BABYLON.Vector3 {
        return this.mesh ? this.mesh.position: this.preloadData.position;
    }
}
