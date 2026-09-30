import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { STORAGE_KEYS } from "./keys";

type AppStore = {
    deviceId: string;
    setDeviceId: (deviceId: string) => void;
    dateJoined: number | null;
    setDateJoined: (dateJoined: number) => void;
};

export const useAppStore = create<AppStore>()(
    persist(
        (set, get) => ({
            deviceId: "",
            dateJoined: null,
            setDeviceId: (deviceId) => {
                if (!get().deviceId && deviceId) {
                    set({ deviceId });
                }
            },
            setDateJoined: (dateJoined) => {
                if (!get().dateJoined && dateJoined) {
                    set({ dateJoined });
                }
            },
        }),
        {
            name: STORAGE_KEYS.APP,
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
