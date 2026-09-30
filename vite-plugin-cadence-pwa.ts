import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { generateSW } from "workbox-build";

export function cadencePwaPlugin(): Plugin {
    let resolvedConfig: any;
    return {
        name: "cadence-pwa",
        configResolved(config) {
            resolvedConfig = config;
        },
        async buildStart() {
            if (resolvedConfig.command === "serve") {
                const outDir = path.resolve(resolvedConfig.root, resolvedConfig.publicDir);
                const swDest = path.join(outDir, "sw.js");
                await makeBuild({ swDest, outDir });
            }
        },
        async writeBundle(options) {
            if (resolvedConfig.command === "build" && options.dir && options.dir.endsWith("client")) {
                const outDir = options.dir;
                const swDest = path.join(outDir, "sw.js");
                await makeBuild({ swDest, outDir });
            }
        },
    };
}

async function makeBuild({ swDest, outDir }: { outDir: string; swDest: string }) {
    try {
        const routesDir = path.resolve(process.cwd(), "src/routes");
        let additionalManifestEntries: { url: string; revision: string }[] = [];
        if (fs.existsSync(routesDir)) {
            const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.tsx') && !f.startsWith('__'));
            for (const route of routeFiles) {
                const revision = String(Date.now());
                let url
                if (route === 'index.tsx') {
                    url = "/"
                } else {
                    url = `/${route.replace('.tsx', '')}`
                }
                additionalManifestEntries.push({
                    url,
                    revision
                })
            }
        }

        console.log(`ℹ️ Building service-worker in ${swDest}`);
        const { count, size, warnings } = await generateSW({
            swDest,
            sourcemap: false,
            globDirectory: outDir,
            globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2,webmanifest,mp3}"],
            additionalManifestEntries,
            importScripts: [
                "./service-worker/push.js",
                // "./service-worker/reminder.js",
                // "./service-worker/assets-loader.js",
                "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js",
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
                {
                    urlPattern: ({ sameOrigin }) => sameOrigin,
                    handler: "StaleWhileRevalidate",
                    options: { cacheName: "app-assets" },
                },
            ],
        });

        if (warnings.length) console.warn("[PWA] warnings:", warnings);
        console.log(
            `✅ [PWA] ServiceWorker Pre-cached ${count} files (${(size / 1024 / 1024).toFixed(2)} MB)`,
        );
    } catch (err) {
        console.error("❌ [PWA] Failed while generating service-worker file:", err);
        throw err;
    }
}
