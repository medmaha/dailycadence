import { useLoading } from '@/hooks/loading'
import { startReminderChecks } from '@/lib/scheduler'
import { useEffect } from 'react'

export default function StartReminderChecks() {
    const isLoading = useLoading()
    useEffect(()=>{
        if (!isLoading){
            void startReminderChecks()
        }
    },[isLoading])
  return null
}
