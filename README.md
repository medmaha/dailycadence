# Cadence

A minimalist, offline-first home workout app that builds adaptive daily sessions based on your training history. No account required, no data leaves your device.

## Features

- 🏠 **Home Workouts**: Daily adaptive training sessions generated from your exercise history
- ⏱️ **Rest Timers**: Built-in rest timers between sets with adjustable durations
- 📝 **Set Logging**: Track reps, weight, and RPE for each exercise
- 🔄 **Exercise Swaps**: One-tap substitutions when you can't do an exercise
- 📊 **Progress Tracking**: Visual dashboards for streaks, volume trends, and body-part balance
- 🎬 **Exercise Animations**: Animated demonstrations for all exercises using workout-guide library
- ⏰ **Countdown Timers**: Start/pause timers for time-based and rep-based exercises
- 📱 **Offline-First**: Works completely offline with local storage
- 🔒 **Privacy-First**: All data stays on your device
- 🎯 **Adaptive**: Sessions adapt based on your recent training patterns

## Tech Stack

- **Frontend**: React with TanStack Start
- **Styling**: Tailwind CSS
- **State Management**: React hooks with localStorage persistence
- **Build Tool**: Vite
- **Exercise Animations**: [@bryllim/workout-guide](https://github.com/bryllim/workout-guide)

## Installation

### Prerequisites

- Node.js 18+ 
- npm, pnpm or yarn

### Development Setup

```bash
# Clone the repository
git clone https://github.com/medmaha/dailycadence.git
cd dailycadence

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

### First-Time Setup

1. Open the app and complete the onboarding flow
2. Set your training goal (strength, mobility, endurance, or general)
3. Select available equipment (bodyweight, bands, dumbbells, pull-up bar)
4. Choose session length (10, 20, 30, or 45 minutes)
5. Set your experience level (new, returning, or consistent)

### Daily Workouts

- Each day, Cadence generates a new workout based on your training history
- Workouts rotate focus across different body parts to prevent overtraining
- Session intensity adapts based on your recent training patterns

### During a Session

1. **Exercise Animation**: See animated demonstrations of each exercise
2. **Countdown Timer**: Use the built-in timer for time-based exercises or pacing
3. **Log Your Sets**: Enter actual reps, weight, and RPE for each set
4. **Rest Periods**: Built-in rest timers between sets (adjustable)
5. **Exercise Swaps**: Can't do an exercise? Tap to see alternatives

### Progress Tracking

- **Streak**: Track consecutive days of training
- **Volume Trends**: See your training volume over the last 4 weeks
- **Body-Part Balance**: Visual breakdown of which muscle groups you've trained
- **Session History**: Detailed log of all completed sessions

## Customization

### Workout Preferences

Navigate to Settings to adjust:
- Training goal
- Available equipment
- Session length
- Experience level

Changes immediately affect future workout generation.

## Exercise Library

Cadence includes exercises across 6 categories:

- **Push**: Push-ups, presses, dips
- **Pull**: Rows, pull-ups, pulldowns
- **Legs**: Squats, lunges, deadlifts
- **Core**: Planks, dead bugs, hollow holds
- **Mobility**: Stretches and range-of-motion work
- **Cardio**: Conditioning exercises

All exercises include:
- Animated demonstrations
- Form cues and technique tips
- Equipment requirements
- Difficulty levels

## Data & Privacy

- All data is stored locally on your device using localStorage
- No accounts, no cloud sync, no tracking
- Data never leaves your device
- Export your data: Access through browser dev tools → Application → Local Storage

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui-kit.tsx      # Design system components
│   ├── ExerciseAnimation.tsx  # Exercise demo animations
│   └── ExerciseCountdown.tsx # Timer component
├── lib/                # Business logic
│   ├── exercises.ts    # Exercise definitions and metadata
│   ├── exercise-animations.ts # Animation mappings
│   ├── generator.ts    # Workout generation logic
│   └── store.ts        # State management and persistence
├── routes/             # Page components
│   ├── index.tsx       # Home page with daily workout
│   ├── session.tsx     # Active workout session
│   ├── progress.tsx    # Progress tracking
│   ├── settings.tsx    # User preferences
│   └── onboarding.tsx  # First-time setup
└── server.ts           # Server-side entry point
```

## Contributing

Contributions are welcome! Areas for improvement:

- Additional exercises and variations
- Enhanced workout generation algorithms
- More detailed progress analytics
- Exercise video tutorials
- Multi-language support
- Accessibility improvements

### Development Guidelines

- Follow existing code style and patterns
- Add tests for new features
- Update documentation for user-facing changes
- Ensure offline functionality is maintained

### Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source. License details to be added.

## Acknowledgments

- Exercise animations powered by [@bryllim/workout-guide](https://github.com/bryllim/workout-guide)
- Original exercise artwork from [Everkinetic](https://github.com/everkinetic/data) under CC BY-SA 4.0
- Built with [TanStack Start](https://tanstack.com/start)

## Roadmap

- [ ] Export/import workout data
- [ ] Custom workout creation
- [ ] Exercise favorites
- [ ] Advanced analytics dashboard
- [ ] Progress photos
- [ ] Workout sharing
- [ ] Apple Health / Google Fit integration
- [ ] Progressive Web App (PWA) improvements

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing discussions
- Review documentation

---

**Built for people who want to train consistently without the noise.**

#### Made with 💖
By: [Mahammed Touray](https://github.com/medmaha)