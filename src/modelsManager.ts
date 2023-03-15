import * as BABYLON from 'babylonjs'
import 'babylonjs-loaders';

import { Service } from 'typedi';

// TODO: Add bbox ?
interface ModelData {
    rootUrl: string;
    fileName: string;
    boundingRadius: number;
    meshPromise?: Promise<BABYLON.Mesh>;
}

const ROOT = './models/';
const GAME_MAP: Map<string, ModelData> = new Map([
    ['PineS', { rootUrl: ROOT, fileName: 'PineS.glb', boundingRadius: 1.7 }],
    ['PineM', { rootUrl: ROOT, fileName: 'PineM.glb', boundingRadius: 3   }],
    ['PineL', { rootUrl: ROOT, fileName: 'PineL.glb', boundingRadius: 4.2 }],
    ['TreeM', { rootUrl: ROOT, fileName: 'TreeM.glb', boundingRadius: 3.2 }],
    ['TreeL', { rootUrl: ROOT, fileName: 'TreeL.glb', boundingRadius: 2.7 }]
]);

@Service()
export class ModelsManager {
    modelsMap: Map<string, ModelData> = new Map();

    constructor() {
        console.log('Create model manager');
    }

    init() {
        console.log('Init model manager');
        this.modelsMap = GAME_MAP;
    }

    getModelData(modelName: string): ModelData {
        const modelData = this.modelsMap.get(modelName);
        if (!modelData) {
            throw new Error(`Bad model: ${modelName}`);
        }
        return modelData;
    }

    getModel(modelName: string): Promise<BABYLON.Mesh> {
        const model = this.modelsMap.get(modelName);

        if (!model) {
            return Promise.reject(`Model ${modelName} not found`);
        }

        if (!model.meshPromise) {
            model.meshPromise = new Promise((resolve, reject) => {
                BABYLON.SceneLoader.LoadAssetContainer(model.rootUrl, model.fileName, undefined,
                    (container) => {
                        const mergedMesh = BABYLON.Mesh.MergeMeshes(container.meshes.slice(1) as BABYLON.Mesh[], undefined, undefined, undefined, undefined, true);
                        if (!mergedMesh) {
                            console.error(`Merged mesh from ${modelName} is null`);
                            reject();
                        }
                        mergedMesh!.isVisible = false;
                        resolve(mergedMesh as BABYLON.Mesh);
                    },
                    undefined,
                    (scene, message) => {
                        console.error(`Error while loading ${modelName}: ${message}`);
                        reject(message);
                    }
                );
            });
        }

        return model.meshPromise;
    }
}
