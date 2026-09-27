import { VitePWA } from "vite-plugin-pwa";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import netlify from "@netlify/vite-plugin-tanstack-start";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        tailwindcss(),
        tanstackStart({
            server: {
                entry: "./src/server.ts",
            },
        }),
        VitePWA({
            strategies: "generateSW",
            registerType: "autoUpdate",
            injectRegister: null,
            filename: "sw.js",
            manifest: false,
            devOptions: {
                enabled: true,
                type: "classic",
            },
            workbox: {
                importScripts: ['/service-worker/push.js', '/service-worker/reminder.js', '/service-worker/assets-loader.js'],
                globPatterns: [
                    "**/*.{js,css,html,png,svg,ico,woff2,webmanifest}",
                ],
                // disableDevLogs: true,
                navigateFallback: null,
                cleanupOutdatedCaches: true,
                runtimeCaching: [
                    {
                        urlPattern: ({ url }) =>
                            url.origin === self.location.origin &&
                            url.pathname.startsWith("/assets/"),
                        handler: "CacheFirst",
                        options: { cacheName: "assets" },
                    },
                    {
                        urlPattern: ({ url }) => url.origin === "https://cdn.jsdelivr.net",
                        handler: "CacheFirst",
                        options: { cacheName: "jsdelivr" },
                    },
                    {
                        urlPattern: ({ url }) =>
                            url.origin === "https://fonts.googleapis.com" ||
                            url.origin === "https://fonts.gstatic.com",
                        handler: "StaleWhileRevalidate",
                        options: { cacheName: "fonts" },
                    },
                ],
            },
        }),
        process.env["VERCEL"] ? nitro() : null,
        process.env["NETLIFY"] ? netlify() : null,
        react(),
    ],
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
    assetsInclude: ["**/*.png"],
});
