import "./lib/error-capture";

import { consumeLastCapturedError, describeStatus } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
    fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
    if (!serverEntryPromise) {
        serverEntryPromise = import("@tanstack/react-start/server-entry").then(
            (m) => (m.default ?? m) as ServerEntry,
        );
    }
    return serverEntryPromise;
}

// html swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} - try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
    if (response.status < 500) return response;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return response;

    const body = await response.clone().text();
    if (!isHTMLSwallowedErrorBody(body)) return response;

    const err: any = consumeLastCapturedError() ?? new Error(`HTML swallowed SSR error: ${body}`);
    console.error(err);
    return new Response(renderErrorPage(), {
        status: Number(describeStatus(err) || 500),
        headers: { "content-type": "text/html; charset=utf-8" },
    });
}

function isHTMLSwallowedErrorBody(body: string): boolean {
    try {
        const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
        return payload.unhandled === true && payload.message === "HTTPError";
    } catch {
        return false;
    }
}

export default {
    async fetch(request: Request, env: unknown, ctx: unknown) {
        try {
            const handler = await getServerEntry();
            const response = await handler.fetch(request, env, ctx);
            return await normalizeCatastrophicSsrResponse(response);
        } catch (error) {
            console.error(error);
            return new Response(renderErrorPage(), {
                status: 500,
                headers: { "content-type": "text/html; charset=utf-8" },
            });
        }
    },
};
