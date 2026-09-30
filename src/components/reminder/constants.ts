export const DAYS = [
    { id: 0, label: "Sun" },
    { id: 1, label: "Mon" },
    { id: 2, label: "Tue" },
    { id: 3, label: "Wed" },
    { id: 4, label: "Thu" },
    { id: 5, label: "Fri" },
    { id: 6, label: "Sat" },
];

export const ALL_DAYS = DAYS.map((d) => d.id);
export const DEFAULT_MESSAGE = "Time for your daily workout!";
export const DEFAULT_RINGTONE_ID = "default";

/**
 * Returns a random message that can be used for a reminder
 * @returns string
 */
export const getDefaultMessage = (): string => {
    const index = Math.floor(Math.random() * DEFAULT_MESSAGES.length);
    return DEFAULT_MESSAGES[index] ?? DEFAULT_MESSAGES[0]!;
};

const DEFAULT_MESSAGES: readonly string[] = [
    "Your 15-min home workout is ready. Let's go! 💪",
    "Time to move! A quick session will make your day better.",
    "Small steps add up. Show up for your workout today.",
    "Your future self will thank you. Start your session now.",
    "Ready when you are. Just 15 minutes to get stronger.",
    "Don't break the streak! Your workout is waiting.",
    "Lace up and get moving. You've got this! 🔥",
    "A little movement goes a long way. Let's do it.",
    "Your body's ready. Are you? Time for your workout.",
    "Make it count today. Your session starts now.",
    "Energy comes from moving. Kick off your session now! ⚡",
    "No excuses, just 15 minutes. Let's get after it.",
    "Consistency beats intensity. Show up for today's workout.",
    "Your workout won't do itself. Time to start! 🏃",
    "Feel stronger, sleep better, think clearer. Begin your session.",
];
