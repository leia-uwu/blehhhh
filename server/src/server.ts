import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import { DisconnectReason } from "../../shared/src/constants.ts";
import { Game } from "./game/game.ts";

const app = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

const game = new Game();

app.get(
    "/play",
    upgradeWebSocket(() => {
        return {
            onClose(_event, socket) {
                game.onDisconnect(socket);
            },
            onMessage(event, socket) {
                if (!(event.data instanceof Buffer)) {
                    console.warn(`Invalid data type: ${typeof event.data}`);
                    socket.close(DisconnectReason.InvalidPacket);
                    return;
                }
                game.onMessage(socket, event.data);
            },
        };
    }),
);

const server = serve({
    fetch: app.fetch,
    port: 8000,
    hostname: "127.0.0.1",
});

injectWebSocket(server);
