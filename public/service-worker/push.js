console.debug("[SW-LOADED]: push-notification");

const CADENCE_DB_NAME = "cadence.pwa.app";
const CADENCE_DB_VERSION = 1;
const CADENCE_STORES = new Set(["kv"]);

/* ---------- DB ---------- */
function _cadenceOpenDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(CADENCE_DB_NAME, CADENCE_DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            for (const store of CADENCE_STORES) {
                if (!db.objectStoreNames.contains(store)) {
                    db.createObjectStore(store, { keyPath: "id" });
                }
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function _cadencePutItem(store, value) {
    const db = await _cadenceOpenDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).put(value);
        tx.oncomplete = () => {
            db.close();
            resolve();
        };
        tx.onerror = () => {
            db.close();
            reject(tx.error);
        };
        tx.onabort = () => {
            db.close();
            reject(tx.error);
        };
    });
}

async function _cadenceGetItem(store, id) {
    const db = await _cadenceOpenDB();
    return new Promise((resolve, reject) => {
        const req = db.transaction(store, "readonly").objectStore(store).get(id);
        req.onsuccess = () => {
            db.close();
            resolve(req.result);
        };
        req.onerror = () => {
            db.close();
            reject(req.error);
        };
    });
}

async function _cadenceGetAll(store) {
    const db = await _cadenceOpenDB();
    return new Promise((resolve, reject) => {
        const req = db.transaction(store, "readonly").objectStore(store).getAll();
        req.onsuccess = () => {
            db.close();
            resolve(req.result);
        };
        req.onerror = () => {
            db.close();
            reject(req.error);
        };
    });
}

async function _cadenceDeleteItem(store, id) {
    const db = await _cadenceOpenDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).delete(id);
        tx.oncomplete = () => {
            db.close();
            resolve();
        };
        tx.onerror = () => {
            db.close();
            reject(tx.error);
        };
        tx.onabort = () => {
            db.close();
            reject(tx.error);
        };
    });
}

/* ---------- Settings ---------- */
class CadencePWASettings {
    constructor({
        APP = "",
        PROFILE = "",
        RINGTONES = "",
        REMINDERS = "",
        EXERCISES = "",
        PUSH_NOTIFICATION = "",
        APP_NAME = "",
        APP_VERSION = 1,
    } = {}) {
        this.APP = APP;
        this.PROFILE = PROFILE;
        this.RINGTONES = RINGTONES;
        this.REMINDERS = REMINDERS;
        this.EXERCISES = EXERCISES;
        this.PUSH_NOTIFICATION = PUSH_NOTIFICATION;
        this.APP_NAME = APP_NAME;
        this.APP_VERSION = APP_VERSION;
    }
}

let _cadence_settingInstance;

async function _cadence_initSettings() {
    if (_cadence_settingInstance) return _cadence_settingInstance;

    // record shape: { id: "pwa.sw", ...settings fields }
    const stored = await _cadenceGetItem("kv", "pwa.sw");
    if (!stored) throw new Error("CadencePWASettings not configured");

    _cadence_settingInstance = new CadencePWASettings(stored.STORAGE_KEYS || {});
    return _cadence_settingInstance;
}

async function _cadence_isSoundEnabled() {
    try {
        await _cadence_initSettings();
        const soundSetting = await _cadenceGetItem("kv", `soundSetting`);
        return soundSetting.enabled !== false;
    } catch {
        return false;
    }
}

/* ---------- Audio: the page plays it, not the worker ---------- */
async function _cadence_playRingtone(ringId) {
    try {
        if (!(await _cadence_isSoundEnabled())) return;

        const ringtones = await _cadenceGetItem("kv", _cadence_settingInstance.RINGTONES);
        const ringTonesData = ringtones?.value?.state?.ringtones;

        const ringtone = ringTonesData ? ringTonesData.find((r) => r.id === ringId) : null;

        if (!ringtone) return;

        const clientList = await self.clients.matchAll({
            type: "window",
            includeUncontrolled: true,
        });
        for (const client of clientList) {
            client.postMessage({ type: "cadence:play-ringtone", ringtone });
        }
    } catch (error) {
        console.error(error);
    }
}

/* ---------- Events ---------- */
self.addEventListener("install", (event) => {
    event.waitUntil(
        _cadence_initSettings()
            .then(() => {
                console.log(
                    _cadence_settingInstance.APP_NAME
                        ? `${_cadence_settingInstance.APP_NAME} APP: SW Configured`
                        : "SW Error configuration",
                );
                self.skipWaiting();
            })
            .catch((e) => console.debug("Install: settings not ready yet", e)),
    );
});

// Claim any open clients/tabs once activated. This only happens when sw file is change
self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("push", async (event) => {
    if (event.data) {
        try {
            const results = event.data.json();
            const payload = results.data || results.custom.a;
            if (payload?.ringtoneId) _cadence_playRingtone(payload.ringtoneId).catch(console.error);
        } catch {
            const body = event.data.text();
            console.log("SW-PUSH:", { body });
        }
    }
});
