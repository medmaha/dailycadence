import { createHash } from "node:crypto";

export const generateUUIDFromString = (s: string) => {
    const h = createHash("sha1").update(s).digest("hex");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
};
