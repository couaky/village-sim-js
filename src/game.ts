import * as BABYLON from 'babylonjs'
import { Container } from 'typedi';

import { ModelsManager } from './modelsManager';
import { Terrain } from './terrain';

export class Game {
    engine: BABYLON.Engine;
    scene: BABYLON.Scene;
    modelManager: ModelsManager;

    terrain: Terrain;

    constructor(readonly canvas: HTMLCanvasElement) {
        this.engine = new BABYLON.Engine(canvas)
        window.addEventListener('resize', () => {
            this.engine.resize();
        });

        this.modelManager = Container.get(ModelsManager);
        this.modelManager.init();

        this.scene = this.initScene(this.engine, this.canvas);
        this.terrain = new Terrain(this.scene);
    }

    debug(debugOn: boolean = true) {
        if (debugOn) {
            this.scene.debugLayer.show({ overlay: true });
        } else {
            this.scene.debugLayer.hide();
        }
    }

    run() {
        this.debug(false);
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    init() {
        this.terrain.generate();

        // this.modelManager.getModel('PineS').then(mesh => {
        //     for (let i = 0; i < 3; i++) {
        //         const newInstance = mesh.createInstance(`tree${i}`);
        //         newInstance.position.x = (i + 1) * 10
        //     }
        // }).catch(() => {
        //     console.error('Error when get model from model manager');
        // });
    }

    private initScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.52, 0.95, 1, 1);
        
        const camera = new BABYLON.ArcRotateCamera("camera1", 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene);
        camera.setTarget(BABYLON.Vector3.Zero());
        camera.attachControl(canvas, true);
        camera.setPosition(new BABYLON.Vector3(0, 50, -100));

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);
        light.intensity = 0.7;

        return scene;
    }
}
