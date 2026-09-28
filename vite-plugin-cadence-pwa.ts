import * as fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { generateSW } from "workbox-build";

export function cadencePwaPlugin(): Plugin {
    let rootDir: string;
    let isProduction: boolean;

    return {
        name: "cadence-pwa",
        configResolved(config) {
            rootDir = config.root;
            isProduction = config.isProduction;
        },

        async configureServer(server) {
            if (isProduction || !server) return;
            const outDir = path.resolve(rootDir, "public")
            const swDest = path.join(outDir, "sw.js");
            await makeBuild({ swDest, outDir, mode: "development" })
        },

        async closeBundle(error) {
            if (!isProduction || error) return;

            const outDir = path.resolve(rootDir, "dist", "client")
            const swDest = path.join(outDir, "sw.js");
            await makeBuild({ swDest, outDir })

            // remove the precache workbox file
            const publicDir = path.resolve(rootDir, "public")
            fs.readdirSync(publicDir).find(file => {
                if (file.startsWith("workbox-") || file == "sw.js") {
                    fs.unlinkSync(path.resolve(publicDir, file))
                }
            })

        }
    }
};


async function makeBuild({ swDest, outDir, mode = "production", }: { mode?: "production" | "development", outDir: string, swDest: string }) {
    try {
        const { count, size, warnings } = await generateSW({
            mode,
            swDest,
            sourcemap: false,
            globDirectory: outDir,
            globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2,webmanifest}"],
            importScripts: [
                "/service-worker/push.js",
                "/service-worker/reminder.js",
                "/service-worker/assets-loader.js",
            ],
            navigateFallback: null,
            cleanupOutdatedCaches: true,
            runtimeCaching: [
                {
                    urlPattern: ({ url }) => url.pathname.startsWith("/assets/"),
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
        });

        if (warnings.length) console.warn("[PWA] warnings:", warnings);
        console.log(`✅ [PWA] Pre-cached ${count} files (${(size / 1024 / 1024).toFixed(2)} MB)`);
    } catch (err) {
        console.error("❌ [PWA] Failed to generate service worker:", err);
        throw err;
    }
}