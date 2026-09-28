import { useEffect } from "react";
import { create } from "zustand";

type Loading = { loading: boolean, setLoading: (loading: boolean) => void }
const useLoad = create<Loading>((set) => ({
    loading: true,
    setLoading: (loading: boolean) => set({ loading })
}))

export function useLoading() {
    const loading = useLoad(s => s.loading)
    const setLoading = useLoad(s => s.setLoading)
    useEffect(() => {
        setLoading(false)
    }, [setLoading])
    return loading
}