import { defineConfig } from "vite";

export default defineConfig({
    build: {
        target: "es2022",
        rollupOptions: {
            output: {
                manualChunks(id, _chunkInfo) {
                    if (id.includes("node_modules")) {
                        return "vendor";
                    }
                },
            }
        }
    },
    server: {
        port: 3000,
        host: "0.0.0.0",
    },
    preview: {
        port: 3000,
        host: "0.0.0.0",
    },
});
