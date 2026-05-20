# SEO Automation Frontend

Professional React + TypeScript + Tailwind CSS frontend for the SEO Automation System.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## Features

- Modern dark-themed sidebar navigation
- Animated dashboard with real-time charts
- SEO score rings with color-coded indicators
- Interactive data tables with sorting
- Modal dialogs with Framer Motion animations
- Responsive design for all screen sizes
- Toast notifications for user feedback
- JWT authentication with protected routes

## Quick Start

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:3000` with API proxy to `http://localhost:5000`.

## Build for Production

```bash
npm run build
```

Output goes to `dist/` directory.

## Project Structure

```
src/
  components/
    ui/           # Reusable UI components (Button, Card, Modal, etc.)
    layout/       # Layout components (Sidebar, Header, AppLayout)
  pages/          # Page components (Dashboard, Websites, Audits, etc.)
  services/       # API service layer
  context/        # React context (Auth)
  hooks/          # Custom React hooks
  lib/            # Utility functions
