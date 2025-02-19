import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import { ByteStream } from "../../shared/src/byteStream.ts";
import { GameConstants } from "../../shared/src/constants.ts";

const app = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.get(
    "/play",
    upgradeWebSocket(c => {
        return {
            onMessage(event, ws) {
                if (!(event.data instanceof Buffer)) {
                    console.warn(`Invalid data type: ${typeof event.data}`);
                    ws.close();
                    return;
                }

                const stream = new ByteStream(event.data.buffer, event.data.byteOffset);

                const protocol = stream.readUint32();
                if (protocol !== GameConstants.protocol) {
                    ws.close();
                }
            },
            onClose: () => {
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
