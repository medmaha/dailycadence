import { InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface LogFieldProps {
  label: string;
  value: string;
  hintText: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function LogField({
  label,
  value,
  hintText,
  onChange,
  placeholder,
}: LogFieldProps) {
  return (
    <label className="block">
      <div className="flex items-center gap-1">
        <span className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground pl-1 truncate flex-1">
          {label}
        </span>
        <Tooltip>
          <TooltipTrigger>
            <InfoIcon className="w-3 h-3" />
          </TooltipTrigger>
          <TooltipContent className="bg-secondary text-secondary-foreground border border-secondary-foreground/60 shadow-2xl py-4 px-3">
            {hintText}
          </TooltipContent>
        </Tooltip>
      </div>
      <input
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
        className="tabular ring-focus mt-1 sm:mt-1.5 w-full rounded-xl border border-input bg-surface p-2 font-display text-lg sm:text-xl sm:p-3 outline-none placeholder:text-muted-foreground/60"
      />
    </label>
  );
}