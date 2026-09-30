// lib/idbStorage.ts
import type { PersistStorage, StorageValue } from "zustand/middleware";
import indexDB from "@/lib/indexedDb";

const STORE = "kv";
const hasIDB = () => typeof indexedDB !== "undefined"; // false during SSR

export function createIdbStorage<S>(): PersistStorage<S> {
    return {
        getItem: async (name) => {
            if (!hasIDB()) return null;
            try {
                const rec = await indexDB.getItem<{ id: string; value: StorageValue<S> }>(
                    STORE,
                    name,
                );
                return rec?.value ?? null;
            } catch (error) {
                console.error("IDB read failed", error);
                return null;
            }
        },
        setItem: async (name, value) => {
            if (!hasIDB()) return;
            try {
                await indexDB.putItem(STORE, { id: name, value });
            } catch (error) {
                console.error("IDB write failed", error);
            }
        },
        removeItem: async (name) => {
            if (!hasIDB()) return;
            try {
                await indexDB.deleteItem(STORE, name);
            } catch (error) {
                console.error("IDB delete failed", error);
            }
        },
    };
}
