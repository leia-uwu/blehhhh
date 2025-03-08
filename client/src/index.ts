import { Application } from "pixi.js";
import { Game } from "./game.ts";

const app = new Application();
await app.init({
    canvas: document.getElementById("game-canvas") as HTMLCanvasElement,
    resizeTo: window,
    resolution: window.devicePixelRatio || 1,
    background: 0x000000,
});
const game = new Game(app);
game.connect();
