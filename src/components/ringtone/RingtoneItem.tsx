import { Button } from "@/components/ui-kit";
import { deleteRingtone, playRingtone, type Ringtone } from "@/lib/ringtones";
import { cn } from "@/lib/utils";
import { PlayIcon, Trash2Icon } from "lucide-react";

type RingtoneItemProps = { ringtone: Ringtone; className?: string; onClick?: () => void };
export function RingtoneItem({ ringtone, className, onClick }: RingtoneItemProps) {
    const handleDeleteRingtone = (id: string) => {
        if (confirm("Are you sure you want to delete this ringtone?")) {
            deleteRingtone(id);
        }
    };
    const handlePlayRingtone = (ringtone: Ringtone) => {
        playRingtone(ringtone);
    };
    return (
        <div
            key={ringtone.id}
            onClick={onClick}
            className={cn(
                "flex items-center justify-between rounded-md border border-border bg-surface p-1.5 px-2.5",
                className,
            )}
        >
            <div className="flex-1">
                <p className="font-medium text-xs capitalize text-foreground/60">{ringtone.name}</p>
                <p className="text-[12px] text-foreground/50">
                    {Math.round((ringtone.dataUrl.length * 0.75) / 1024)}KB
                </p>
            </div>
            <div className="flex gap-2">
                <Button
                    variant="primary"
                    size="icon"
                    className="bg-primary/10 w-7 h-7 hover:bg-primary/20 border border-primary/50"
                    onClick={() => handlePlayRingtone(ringtone)}
                >
                    <PlayIcon className="w-4 h-4 text-white fill-white" />
                </Button>
                {!ringtone.isDefault && (
                    <Button
                        variant="danger"
                        size="icon"
                        className="bg-destructive/10 w-7 h-7 hover:bg-destructive/20 border border-destructive/50"
                        onClick={() => handleDeleteRingtone(ringtone.id)}
                    >
                        <Trash2Icon className="w-4 h-4 text-white fill-white" />
                    </Button>
                )}
            </div>
        </div>
    );
}
