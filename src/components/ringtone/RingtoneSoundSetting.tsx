import { Eyebrow } from "@/components/ui-kit";
import { useRingtoneStore } from "@/stores/ringtoneStore";
import { ToggleSwitch } from "../ui/ToggleSwitch";

export function RingtoneSoundSetting() {
    const soundEnabled = useRingtoneStore((s) => s.soundEnabled);
    const setSoundEnabled = useRingtoneStore((s) => s.setSoundEnabled);

    return (
        <div>
            <Eyebrow>Sound</Eyebrow>
            <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Play sound with notifications</p>
                <ToggleSwitch
                    checked={soundEnabled || soundEnabled === null}
                    onChange={setSoundEnabled}
                    label="Play sound with notifications"
                />
            </div>
        </div>
    );
}
