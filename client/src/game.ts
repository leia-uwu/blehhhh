import { Application } from "pixi.js";
import { ByteStream } from "../../shared/src/net/byteStream.ts";
import {
    clientToServerPackets,
    ConnectPacket,
    Packet,
    serverToClientPackets,
} from "../../shared/src/net/net.ts";

export class Game {
    pixi: Application;
    ws?: WebSocket;

    constructor(pixi: Application) {
        this.pixi = pixi;
    }

    connect() {
        if (this.ws && this.ws.readyState !== this.ws.CLOSED) return;

        this.ws = new WebSocket("ws://127.0.0.1:8000/play");
        this.ws.binaryType = "arraybuffer";

        this.ws.onclose = (event) => {
            console.error("Connection closed, code:", event.code, "reason:", event.reason);
        };

        this.ws.onerror = () => {};

        this.ws.onmessage = (event) => {
            this.onMessage(event.data);
        };

        this.ws.onopen = () => {
            const packet = new ConnectPacket();
            packet.name = "A gay"; // todo: username field lmao
            this.sendPacket(packet);
        };
    }

    onMessage(data: ArrayBuffer) {
        const stream = new ByteStream(data);
        const packets = serverToClientPackets.deserializeAllPackets(stream);
        for (const packet of packets) {
            // ...
        }
    }

    stream = new ByteStream(1024);
    sendPacket(packet: Packet) {
        if (!this.ws || this.ws.readyState !== this.ws.OPEN) {
            return;
        }
        // reuse this stream by just setting the index back to 0
        // instead of allocating a new one every time
        this.stream.index = 0;
        clientToServerPackets.serializePacket(this.stream, packet);
        this.ws.send(this.stream.getSerializedData());
    }
}
