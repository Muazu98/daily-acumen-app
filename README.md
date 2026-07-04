# Daily Acumen 

A lightweight, offline-first daily activity tracker designed for high-friction environments. Built to survive Wi-Fi dead zones and combat task paralysis with extreme simplicity and a little bit of passive aggression.

## 💡 Why This Exists
This application was built out of necessity between clinical rotations and ward rounds. Standard productivity apps are often too bloated or require constant internet connectivity—a luxury not always available in low-resource settings or deep inside hospital corridors. Daily Acumen is designed to load instantly, store data locally, and get out of your way so you can focus on the work that matters.

## ⚡ Core Features

*   **Offline-First Architecture:** Powered by Dexie.js and IndexedDB. Read, write, and complete tasks entirely off the grid. Data synchronizes and persists locally on the device.
*   **Time-Aware UI:** The application environment dynamically shifts between a bright, sun-themed UI during the day and a deep, calming moon-and-stars aesthetic at night.
*   **Deep Work Focus Mode:** A specialized toggle that hides the noise. It masks all pending tasks except the absolute oldest one, forcing single-tasking and preventing attention fragmentation.
*   **Quick-Triage Chips:** One-tap logging for recurring daily habits (e.g., reading papers, logging updates) to reduce typing friction on mobile.
*   **Accountability & Micro-Interactions:** Tasks left pending for over 24 hours trigger a visual shift and slightly judgmental dynamic copy to break procrastination. Checking off a task triggers a custom confetti burst for immediate dopamine feedback.

## 🛠 Tech Stack

*   **Frontend:** React, Vite
*   **Styling:** Tailwind CSS v4, Framer Motion (animations), Lucide React (icons)
*   **Database:** Dexie.js (IndexedDB wrapper)
*   **Interactions:** Canvas-Confetti

## 🚀 Local Development

To spin this up on your local machine:

1. Clone the repository:
   ```bash
   git clone [https://github.com/YOUR_GITHUB_USERNAME/Daily-acumen-app.git](https://github.com/YOUR_GITHUB_USERNAME/Daily-acumen-app.git)



    🌍 Deployment
This project is optimized as a static site and is currently deployed on Vercel with zero backend configuration required. Once deployed, open the link on any mobile device and select "Add to Home Screen" for the full Progressive Web App (PWA) experience.

Built by Muadhu.