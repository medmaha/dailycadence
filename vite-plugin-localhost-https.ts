import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

export function localhostHTTPSPlugin(): Plugin {
    let certsInjected = false;
    return {
        name: "localhost-https",
        configurePreviewServer(server) {
            server.middlewares.use((req, res, next) => {
                // Polyfill setHeaders for HTTP/2 responses which lack it, as required by TanStack Start
                if (!res.setHeaders) {
                    (res as any).setHeaders = (headers: any) => {
                        if (headers && typeof headers.forEach === "function") {
                            headers.forEach((value: any, key: string) => res.setHeader(key, value));
                        } else if (typeof headers === "object" && headers !== null) {
                            for (const [key, value] of Object.entries(headers)) {
                                if (value !== undefined) res.setHeader(key, value as any);
                            }
                        }
                    };
                }
                next();
            });
        },
        async configResolved(config) {
            if (certsInjected) return;

            const useHTTPS = process.env["USE_DEVELOPMENT_HTTPS"] === "true";
            if (!useHTTPS) return;

            const { command, root } = config;

            if (command === "serve" && root) {
                const rootDir = config.root;
                const keyPath = path.resolve(rootDir, ".certs", "localhost-key.pem");
                const certPath = path.resolve(rootDir, ".certs", "localhost.pem");
                const hasCertificates = fs.existsSync(keyPath) && fs.existsSync(certPath);

                // Enable HTTPS only if the mkcert files are found locally
                if (!hasCertificates) {
                    console.warn(
                        "\x1b[33m%s\x1b[0m",
                        "⚠️ [Local SSL] Certificates not found. Falling back to HTTP.",
                    );
                    return;
                }

                const httpsPayload = {
                    key: fs.readFileSync(keyPath),
                    cert: fs.readFileSync(certPath),
                };

                if (config.server) config.server.https = httpsPayload;
                if (config.preview) config.preview.https = httpsPayload;
                certsInjected = true;

                console.log(
                    "\x1b[32m%s\x1b[0m",
                    "🛡️ [Local SSL] Secure dev/preview certificates injected successfully.",
                );
            }
        },
    };
}
