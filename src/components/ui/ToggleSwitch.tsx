type ToggleSwitchProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
};

export function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                checked ? "bg-primary" : "bg-surface-2"
            }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    checked ? "translate-x-6" : "translate-x-1"
                }`}
            />
        </button>
    );
}
