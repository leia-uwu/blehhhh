import { Application } from "pixi.js";
import { ByteStream } from "../../shared/src/byteStream.ts";
import { GameConstants } from "../../shared/src/constants.ts";

const app = new Application();

await app.init({
    canvas: document.getElementById("game-canvas") as HTMLCanvasElement,
    resizeTo: window,
    resolution: window.devicePixelRatio || 1,
    background: 0x000000,
});

const socket = new WebSocket("ws://127.0.0.1:8000/play");
socket.binaryType = "arraybuffer";

socket.onclose = () => {
};
socket.onerror = (event) => {
    console.log(event);
};
socket.onmessage = (event) => {
    console.log(event.data);
};
socket.onopen = () => {
    const stream = new ByteStream(16);
    stream.writeUint32(GameConstants.protocol);
    socket.send(stream.getBuffer());
};
