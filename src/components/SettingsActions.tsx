import { Button } from "@/components/ui-kit";

interface SettingsActionsProps {
    onRunSetup: () => void;
    onEraseData: () => void;
}

export function SettingsActions({ onRunSetup, onEraseData }: SettingsActionsProps) {
    return (
        <>
            <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="outline" onClick={onRunSetup}>
                    Run setup again
                </Button>
                <Button variant="ghost" onClick={onEraseData}>
                    Erase all data
                </Button>
            </div>

            <p className="mt-8 text-xs text-muted-foreground">
                Everything stays on this device, so sessions and timers keep working with no
                connection.
            </p>
        </>
    );
}
