# StudentFlow – AI-Powered Student Wellness Platform

StudentFlow is a free, offline-first Progressive Web App (PWA) that helps students balance academics with personal well-being. It combines intelligent schedule planning, wellness tracking, and burnout prevention — all in a single app that works on the web, Android, and iOS.

## Features

- **Smart Weekly Timetable** – Drag-and-drop planner with course, revision, rest, sport, social, admin, and meal slots.
- **Safe Mode (Burnout Detection)** – Monitors sleep, stress, and workload to alert you before burnout hits.
- **Focus Mode (Pomodoro)** – Built-in Pomodoro timer (25/5/15 min) with ambient sounds to keep you productive.
- **Wellness Journal** – Daily journal for tracking mood, sleep, and stress levels.
- **Analytics Dashboard** – Charts and trends for your well-being data over time.
- **Gamification** – Earn wisdom points, level up, and maintain streaks to stay motivated.
- **PDF Export** – Export your timetable and analytics as PDF reports.
- **Multilingual** – Supports French, English, and Arabic.
- **Offline-First** – Full Service Worker support; the app works without an internet connection.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, Tailwind CSS, Vanilla JavaScript |
| Charts | Chart.js |
| PDF Export | jsPDF |
| Icons | Lucide |
| Mobile | Capacitor 5 (Android & iOS) |
| PWA | Service Worker, Web App Manifest |
| CI/CD | Codemagic (Android builds), Netlify (web hosting) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- npm

### Install Dependencies

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

This starts a local server at `http://localhost:8080`.

### Build for Android

```bash
npm run sync
npm run open:android
```

### Build for iOS

```bash
npm run sync
npm run open:ios
```

## Project Structure

```
├── studentflow_ultimate_pro.html   # Main application (single-page)
├── index.html                      # Entry point (redirects to main app)
├── config.js                       # Centralized configuration constants
├── storage.js                      # State management & localStorage logic
├── audio.js                        # Ambient sound handling
├── sw.js                           # Service Worker for offline support
├── manifest.json                   # PWA manifest
├── capacitor.config.json           # Capacitor mobile config
├── icons/                          # App icons (48–512 px)
├── android/                        # Capacitor Android project
├── ios/                            # Capacitor iOS project
└── www/                            # Web build output (served by Capacitor)
```

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
