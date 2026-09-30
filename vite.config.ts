import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import { nitro } from "nitro/vite";
// import netlify from "@netlify/vite-plugin-tanstack-start";

import { cadencePwaPlugin } from "./vite-plugin-cadence-pwa";
import { localhostHTTPSPlugin } from "./vite-plugin-localhost-https";

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
        localhostHTTPSPlugin(),
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
