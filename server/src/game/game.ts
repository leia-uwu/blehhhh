import { WSContext } from "hono/ws";
import { DisconnectReason, GameConstants } from "../../../shared/src/constants.ts";
import { ByteStream } from "../../../shared/src/net/byteStream.ts";
import { clientToServerPackets, ConnectPacket } from "../../../shared/src/net/net.ts";

export class Game {
    lastUpdateTime: number;

    // todo: sockets should be wrapped inside a player class or smth
    // this is just to get it to work for now :3
    sockets = new Set<WSContext>();

    constructor() {
        this.lastUpdateTime = Date.now();
        setInterval(this.update.bind(this), 1000 / 30);
    }

    update() {
        const now = Date.now();
        // divided by 1000 because i like to have delta time based on seconds
        // so when multiplying stuff like speed values by it
        // the speed value will be in units / second
        const deltaTime = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;
    }

    onDisconnect(socket: WSContext) {
        this.sockets.delete(socket);
    }
    onMessage(socket: WSContext, buffer: Buffer) {
        const stream = new ByteStream(buffer.buffer, buffer.byteOffset);
        const packet = clientToServerPackets.deserializePacket(stream);
        if (!packet) return;

        // sockets are added to the set after sending a ConnectPacket
        if (!this.sockets.has(socket) && packet instanceof ConnectPacket) {
            if (packet.protocol !== GameConstants.protocol) {
                socket.close(
                    DisconnectReason.InvalidProtocol,
                    DisconnectReason[DisconnectReason.InvalidProtocol],
                );
                return;
            }
            console.log(`Player ${packet.name} connected!`);
            this.sockets.add(socket);
            return;
        }
        // only process other packets if we first received the connect packet
        if (!this.sockets.has(socket)) return;
        // tbd...
    }
}
