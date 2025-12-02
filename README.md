# Expense Tracker

A client-side expense tracker demo with authentication (localStorage), expense CRUD, charts, budget alerts, recurring reminders, filtering/search, and a dashboard.

## Run locally

Start a simple static server from the project root and open the app in your browser:

```bash
cd /workspaces/Expense-Tracker
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

## Smoke test (automated)

A Puppeteer-based smoke test exercises main flows (register, login, add/edit/delete expense, set budget, add reminder).

Install dependencies and run the test:

```bash
# already has puppeteer dependency in package.json, install with npm
npm install
# then run
npm run smoke
```

Notes
- This is a demo app: all data (users, expenses, reminders) are stored in `localStorage` and are not secure. Do not use this as-is for production.
- The smoke test launches a headless Chromium and requires system libraries (libgtk, libgbm, libnss, libasound, etc.). The dev container may need those installed before running Puppeteer.

Design & visual updates
- Modern dark theme, Google Inter font, icons via Font Awesome, logo and hero SVG assets, improved cards, animations, and responsive layout.

If you'd like, I can:
- Add CI integration for the smoke test.
- Replace client-side auth with a small Express + SQLite backend for persistent storage.
- Expand dashboard analytics (monthly breakdowns, trends).
