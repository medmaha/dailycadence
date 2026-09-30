import { Eyebrow } from "@/components/ui-kit";
import { Button } from "@/components/ui-kit";

interface SessionSummaryProps {
    minutes: number;
    sets: number;
    volume: number;
    onSeeProgress: () => void;
    onGoHome: () => void;
}

export function SessionSummary({
    minutes,
    sets,
    volume,
    onSeeProgress,
    onGoHome,
}: SessionSummaryProps) {
    return (
        <div className="animate-rise pt-16">
            <Eyebrow>Session complete</Eyebrow>
            <h1 className="mt-3 text-4xl font-semibold">That's logged.</h1>
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-6">
                <div>
                    <p className="tabular font-display text-3xl">{minutes}</p>
                    <p className="mt-1 text-xs text-muted-foreground">minutes</p>
                </div>
                <div>
                    <p className="tabular font-display text-3xl">{sets}</p>
                    <p className="mt-1 text-xs text-muted-foreground">sets</p>
                </div>
                <div>
                    <p className="tabular font-display text-3xl">{volume}</p>
                    <p className="mt-1 text-xs text-muted-foreground">volume</p>
                </div>
            </div>
            <div className="mt-10 flex gap-3">
                <Button size="lg" className="flex-1" onClick={onSeeProgress}>
                    See progress
                </Button>
                <Button variant="outline" size="lg" onClick={onGoHome}>
                    Home
                </Button>
            </div>
        </div>
    );
}
