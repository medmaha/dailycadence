import { Link, useRouterState } from "@tanstack/react-router";
import {
    InputHTMLAttributes,
    TextareaHTMLAttributes,
    useEffect,
    useRef,
    type ButtonHTMLAttributes,
    type ReactNode,
} from "react";

import { cn } from "@/lib/utils";
import PWAInstallation from "./PWAInstallation";

export function Screen({
    children,
    className,
    nav = true,
}: {
    children: ReactNode;
    className?: string;
    nav?: boolean;
}) {
    return (
        <div className="min-h-screen bg-background">
            <div
                className={cn(
                    "mx-auto w-full max-w-xl",
                    "px-5 pt-8 max-sm:px-3",
                    "max-sm:pt-[max(32px,env(safe-area-inset-top))]",
                    "pb-[max(2rem,env(safe-area-inset-bottom))]",
                    nav && "pb-[max(6rem,env(safe-area-inset-bottom))]",
                    className,
                )}
            >
                {children}
                <PWAInstallation />
            </div>
            {nav ? <TabBar /> : null}
        </div>
    );
}

const TABS = [
    { to: "/", label: "Today" },
    { to: "/progress", label: "Progress" },
    { to: "/settings", label: "Setup" },
] as const;

function TabBar() {
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    return (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/85 backdrop-blur-xl">
            <div className="mx-auto flex max-w-xl items-stretch justify-between px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
                {TABS.map((t) => {
                    const active = pathname === t.to;
                    return (
                        <Link
                            key={t.to}
                            to={t.to}
                            className={cn(
                                "ring-focus flex-1 rounded-lg px-3 py-2 text-center text-[0.8rem] font-medium tracking-wide transition-colors",
                                active
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <span className="relative">
                                {t.label}
                                {active ? (
                                    <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left animate-sweep bg-primary" />
                                ) : null}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

export function Eyebrow({ children }: { children: ReactNode }) {
    return (
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {children}
        </p>
    );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost" | "outline" | "quiet" | "danger";
    size?: "md" | "lg" | "icon";
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
    return (
        <button
            {...props}
            className={cn(
                "ring-focus inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:animate-pop disabled:pointer-events-none disabled:opacity-40",
                size === "lg" && "px-6 py-4 text-base",
                size === "md" && "px-4 py-2.5 text-sm",
                size === "icon" && "p-1 w-8 h-8",
                variant === "primary" &&
                    "bg-primary text-primary-foreground shadow-glow hover:brightness-105",
                variant === "outline" &&
                    "border border-border-strong bg-surface text-foreground hover:bg-surface-2",
                variant === "ghost" && "text-muted-foreground hover:text-foreground",
                variant === "quiet" && "bg-surface-2 text-foreground hover:brightness-110",
                variant === "danger" &&
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                className,
            )}
        />
    );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={cn(
                "w-full rounded-lg border border-input bg-surface text-foreground/90 p-3 text-sm outline-none focus:ring-2 focus:ring-ring",
                className,
            )}
            {...props}
        />
    );
}
export function Textarea({
    rows,
    className,
    ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            rows={rows || 2}
            className={cn(
                "w-full rounded-lg border border-input bg-surface text-foreground/90 p-3 text-sm outline-none focus:ring-2 focus:ring-ring",
                className,
            )}
            {...props}
        />
    );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn("card-surface p-5", className)}>{children}</div>;
}

export function Chip({
    children,
    selected,
    onClick,
    className,
}: {
    children: ReactNode;
    selected?: boolean;
    onClick?: () => void;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "ring-focus rounded-full border px-3.5 py-1.5 text-sm transition-colors active:animate-pop",
                selected
                    ? "border-primary bg-primary/12 text-primary"
                    : "border-border-strong text-muted-foreground hover:text-foreground",
                className,
            )}
        >
            {children}
        </button>
    );
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
    return (
        <div>
            <p className="tabular font-display text-3xl">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
    );
}

type DialogProps = {
    title: string;
    isOpen: boolean;
    children: ReactNode;
    onClose: () => void;
    className?: string;
};

export function Dialog({ isOpen, onClose, title, children, className }: DialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialogElement = dialogRef.current;
        if (!dialogElement) return;

        if (isOpen) {
            if (!dialogElement.open) {
                dialogElement.showModal();
            }
        } else {
            if (dialogElement.open) {
                dialogElement.close();
            }
        }
    }, [isOpen]);

    // Handle user clicking the backdrop to close
    const handleBackdropClick: React.MouseEventHandler<HTMLDialogElement> = (event) => {
        if (event.target === dialogRef.current) {
            onClose();
        }
    };

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            onClick={handleBackdropClick}
            className={cn(
                "w-full max-sm:max-w-[95svw] max-w-md p-4 border-0 rounded-lg shadow-xl mx-auto my-auto bg-white text-slate-800 backdrop:bg-black/50 backdrop:backdrop-blur-sm",
                className,
            )}
        >
            <div className="flex items-center justify-between mb-4 max-sm:max-h-[90svw] h-full max-h-[75svh]">
                {title && <h2 className="text-xl font-semibold tracking-tight">{title}</h2>}
                <button
                    type="button"
                    onClick={onClose}
                    className="text-2xl text-slate-400 hover:text-slate-600 transition-colors p-1 leading-none"
                    aria-label="Close dialog"
                >
                    &times;
                </button>
            </div>
            <div className="text-sm text-slate-600">{children}</div>
        </dialog>
    );
}
