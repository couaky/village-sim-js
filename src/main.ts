import 'reflect-metadata';

import { Game } from './game';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
    const game = new Game(canvas);
    game.run();
    game.init();
});
