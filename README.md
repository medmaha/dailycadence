# Daily Cadence

A Progressive Web App that builds one adaptive home workout a day from what you trained recently. No equipment needed, works offline.

## Features

- **Adaptive Workout Generation**: Automatically generates a personalized workout each day based on your training history, goals, and available equipment
- **Smart Recovery**: Detects when you need a recovery day and adjusts intensity accordingly
- **Customizable Profile**: Set your training goal (strength, mobility, endurance, or general fitness), available equipment, session length, and experience level
- **Offline-First**: Works completely offline using IndexedDB for local storage
- **Progressive Web App**: Installable on mobile and desktop devices
- **Workout Reminders**: Set custom workout reminders with push notifications via OneSignal
- **Custom Ringtones**: Upload your own notification sounds for reminders
- **Session Tracking**: Log sets, reps, weight, and RPE with built-in rest timers
- **Streak Tracking**: Monitor your consistency with streak counters
- **Exercise Substitutions**: Swap exercises on the fly during a session

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React + SSR)
- **UI**: React 19, Tailwind CSS v4
- **State Management**: Zustand
- **Storage**: IndexedDB (via custom implementation)
- **Push Notifications**: OneSignal
- **Build Tool**: Vite
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/medmaha/dailycadence.git
cd dailycadence
```

2. Install dependencies:

```bash
pnpm install
```

3. Copy the environment example file:

```bash
cp .env.example .env
```

4. Configure your environment variables (see [Environment Variables](#environment-variables) below)

5. Run the development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required Variables

| Variable                 | Description                                                             |
| ------------------------ | ----------------------------------------------------------------------- |
| `APP_NAME`               | The name of the app (default: "Cadence")                                |
| `APP_VERSION`            | App version number                                                      |
| `ONESIGNAL_APP_ID`       | Your OneSignal App ID from [onesignal.com](https://onesignal.com)       |
| `ONESIGNAL_REST_API_KEY` | Your OneSignal REST API Key from [onesignal.com](https://onesignal.com) |
| `CRON_SECRET`            | Secret token for GitHub Actions cron job authentication                 |
| `VITE_PRODUCTION_URL`    | Your production deployment URL                                          |

### Optional Variables

| Variable                                        | Default         | Description                                                 |
| ----------------------------------------------- | --------------- | ----------------------------------------------------------- |
| `USE_DEVELOPMENT_HTTPS`                         | `true`          | Enable HTTPS in development                                 |
| `VITE_SERVICE_WORKER_FILE_PATH`                 | `sw.js`         | Service worker file path                                    |
| `VITE_RINGTONE_FILE`                            | `/reminder.mp3` | Default reminder sound file                                 |
| `VITE_RINGTONE_MAX_ITEMS`                       | `3`             | Maximum number of custom ringtones                          |
| `VITE_RINGTONE_MAX_FILE_SIZE_KB`                | `500`           | Maximum ringtone file size in KB                            |
| `VITE_RINGTONE_MAX_COMPRESS_SIZE_KB`            | `100`           | Maximum compressed ringtone size in KB                      |
| `VITE_REMINDER_MAX_ITEMS`                       | `10`            | Maximum number of reminders                                 |
| `VITE_REMINDER_RESCHEDULE_DAYS_OFFSET`          | `3`             | Days to offset when rescheduling reminders                  |
| `VITE_REMINDER_RESCHEDULE_PUSH_ON_CONTEXT_EDIT` | `false`         | Reschedule push notifications when editing reminder context |
| `ONESIGNAL_MAX_REMINDER_TO_SCHEDULE`            | `5`             | Maximum reminders to schedule at once                       |
| `ONESIGNAL_SCHEDULER_MAX_WINDOW_DAYS`           | `7`             | Maximum days ahead to schedule reminders                    |

### Setting Up OneSignal

1. Create an account at [onesignal.com](https://onesignal.com)
2. Create a new app (Web Push)
3. Navigate to Settings → Keys & IDs
4. Copy your App ID and REST API Key to your `.env` file

### Setting Up GitHub Actions for Reminders

1. Go to your GitHub repository Settings → Secrets and variables → Actions
2. Add the following secrets:
    - `CRON_SECRET`: Use the same value as in your `.env` file
    - `CRON_ENDPOINT`: Your deployed API endpoint (e.g., `https://your-domain.com/api/cron/reminders`)

The workflow runs every 1.5 hours to trigger reminder notifications.

## Project Structure

```
src/
├── components/          # React components
│   ├── notification/   # Notification-related components
│   ├── reminder/       # Reminder management components
│   ├── ringtone/       # Custom ringtone components
│   ├── session/        # Workout session components
│   └── ui/             # UI primitives
├── functions/          # OneSignal integration
├── hooks/              # Custom React hooks
├── lib/                # Core business logic
│   ├── exercise-data.ts # Exercise library
│   ├── generator.ts     # Workout generation algorithm
│   ├── reminders.ts     # Reminder management
│   ├── scheduler.ts    # Notification scheduling
│   └── types.ts        # TypeScript types
├── routes/             # TanStack Router routes
│   ├── api/           # API endpoints
│   ├── index.tsx      # Home page
│   ├── onboarding.tsx # User setup flow
│   ├── session.tsx    # Active workout session
│   ├── settings.tsx   # Settings page
│   └── progress.tsx   # Progress tracking
├── stores/             # Zustand state stores
└── styles.css          # Global styles
```

## How It Works

### Workout Generation

The app uses a deterministic algorithm to generate workouts based on:

1. **User Profile**: Goal, equipment, session length, experience level
2. **Training History**: Recent sessions, muscle group rotation
3. **Recovery Needs**: Automatically inserts recovery days after intense training

The algorithm ensures:

- You never train the same muscle groups on consecutive days
- Workouts adapt to your available equipment
- Intensity scales with your experience level
- Recovery days prevent overtraining

### Exercise Library

Exercises are categorized by:

- **Region**: push, pull, legs, core, mobility, cardio
- **Equipment**: none, bands, dumbbells, pullupbar
- **Intensity**: 1 (easy/recovery), 2 (moderate), 3 (demanding)
- **Level**: new, returning, trained

### Data Storage

All user data is stored locally in IndexedDB, LocalStorage, Cookies:

- Profile settings
- Training history
- Active sessions
- Reminders
- Custom ringtones

No data is sent to external servers except for OneSignal push notifications.

## Development

### Code Style

The project uses:

- ESLint for linting
- Prettier for formatting
- TypeScript for type safety

Run linters:

```bash
pnpm lint
pnpm format
```

### Adding New Exercises

Edit `src/lib/exercise-data.ts` to add new exercises to the library. Each exercise requires:

- `id`: Unique identifier
- `name`: Display name
- `region`: Muscle group
- `equipment`: Required equipment
- `intensity`: Difficulty level (1-3)
- `minLevel`: Minimum user level (0-2)
- `unit`: "reps" or "seconds"
- `cue`: Form instruction
- `imageName`: Asset filename

## Deployment

The deployment platform can be configured in [`vite.config.ts`](vite.config.ts) by uncommenting the appropriate plugin for your target platform.

### Vercel (Default)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

The project includes Vercel-specific configuration using the `nitro` plugin in `vite.config.ts`.

### Netlify

1. Uncomment the netlify plugin in `vite.config.ts`:
    ```typescript
    import netlify from "@netlify/vite-plugin-tanstack-start";
    // Replace the nitro line with:
    process.env["NETLIFY"] ? netlify() : null,
    ```
2. Install the plugin: `pnpm add -D @netlify/vite-plugin-tanstack-start`
3. Connect your GitHub repository to Netlify
4. Add environment variables in Netlify dashboard
5. Deploy

### Cloudflare Workers/Pages

When deploying to Cloudflare Workers, you'll need to complete a few extra steps before your users can start using your app., refer to the [Tanstack-Start documentation](https://tanstack.com/start/latest/docs/framework/react/guide/hosting#cloudflare-workers-official-partner). Configure this in `vite.config.ts` with the appropriate Cloudflare plugin.

### Other Platforms

The app can be deployed to any platform that supports Node.js/Edge functions:

- AWS Amplify
- Deno Deploy
- Other Nitro-supported platforms

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [TanStack Start](https://tanstack.com/start)
- Exercise data from [@bryllim/workout-guide](https://www.npmjs.com/package/@bryllim/workout-guide)
- Icons from [Lucide React](https://lucide.dev)
- Push notifications powered by [OneSignal](https://onesignal.com)

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

### Build with 💖

By [Mahammed Touray](https://github.com/medmaha/dailycadence)
