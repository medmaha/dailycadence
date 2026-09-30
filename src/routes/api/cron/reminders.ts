// src/routes/api/cron/reminders.ts
import { createFileRoute } from "@tanstack/react-router";
import { sendSlot } from "@/functions/onesignal";
import { generateUUIDFromString } from "@/lib/utils.server";
import { readEnv } from "@/lib/helpers";

export const Route = createFileRoute("/api/cron/reminders")({
    server: {
        handlers: {
            POST: async ({ request }) => {
                const secret = readEnv("CRON_SECRET");
                if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
                    return new Response("Unauthorized", { status: 401 });
                }
                const now = new Date();
                const hh = String(now.getUTCHours()).padStart(2, "0");
                const mm = now.getUTCMinutes() < 30 ? "00" : "30";
                const slot = `${hh}:${mm}`;
                const key = generateUUIDFromString(`${now.toISOString().slice(0, 10)}-${slot}`);
                const result = await sendSlot(slot, key);
                return Response.json({ slot, result });
            },
        },
    },
});
