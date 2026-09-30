import { STORAGE_KEYS } from "../stores/keys";

const DB_NAME = "cadence.pwa.app";
const STORES = ["kv", "_queue"];

export async function initIndexedDB() {
    await putItem("kv", { id: "pwa.sw", STORAGE_KEYS });
}

function createMissingStores(db: IDBDatabase) {
    for (const s of STORES) {
        if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: "id" });
    }
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined") return;

        const req = indexedDB.open(DB_NAME);
        req.onupgradeneeded = () => createMissingStores(req.result);
        req.onerror = () => reject(req.error);

        req.onsuccess = () => {
            const db = req.result;
            const missing = STORES.filter((s) => !db.objectStoreNames.contains(s));
            if (missing.length === 0) {
                db.onversionchange = () => db.close();
                return resolve(db);
            }

            // Stores missing: upgrade by one version to create them
            const nextVersion = db.version + 1;
            db.close();

            const up = indexedDB.open(DB_NAME, nextVersion);
            up.onupgradeneeded = () => createMissingStores(up.result);
            up.onsuccess = () => {
                up.result.onversionchange = () => up.result.close();
                resolve(up.result);
            };
            up.onerror = () => reject(up.error);
            up.onblocked = () =>
                console.warn("IndexedDB upgrade blocked by another open connection");
        };
    });
}

async function putItem<T>(store: string, value: T): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).put(value);
        tx.oncomplete = () => {
            db.close();
            resolve();
        };
        tx.onerror = tx.onabort = () => {
            db.close();
            reject(tx.error);
        };
    });
}

async function getItem<T>(store: string, id: string): Promise<T | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const req = db.transaction(store, "readonly").objectStore(store).get(id);
        req.onsuccess = () => {
            db.close();
            resolve(req.result as T | undefined);
        };
        req.onerror = () => {
            db.close();
            reject(req.error);
        };
    });
}

async function getAll<T>(store: string): Promise<T[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const req = db.transaction(store, "readonly").objectStore(store).getAll();
        req.onsuccess = () => {
            db.close();
            resolve(req.result as T[]);
        };
        req.onerror = () => {
            db.close();
            reject(req.error);
        };
    });
}

async function deleteItem(store: string, id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).delete(id);
        tx.oncomplete = () => {
            db.close();
            resolve();
        };
        tx.onerror = tx.onabort = () => {
            db.close();
            reject(tx.error);
        };
    });
}

const indexDB = { getAll, putItem, getItem, deleteItem };
export default indexDB;
