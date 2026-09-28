import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
// import netlify from "@netlify/vite-plugin-tanstack-start";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import { cadencePwaPlugin } from "./vite-plugin-cadence-pwa"

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        tailwindcss(),
        tanstackStart({
            server: {
                entry: "./src/server.ts",
            },
        }),
        cadencePwaPlugin(),
        process.env["VERCEL"] ? nitro() : null,
        // process.env["NETLIFY"] ? netlify() : null,
        react(),
    ],
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
    assetsInclude: ["**/*.png"],
});
