# LingoLab Frontend

LingoLab is a comprehensive language learning platform designed to facilitate interaction between teachers and students. It features advanced tools for assigning and grading speaking and writing tasks, tracking student progress, and managing classes effectively.

This repository contains the frontend application built with React, TypeScript, and Vite.

## 🚀 Features

### For Students
- **Interactive Dashboard**: Overview of assigned tasks and recent activity.
- **Assignments**: Dedicated interfaces for completing Speaking and Writing tasks.
- **Progress Tracking**: View detailed reports and track learning progress over time.
- **Profile Management**: Manage personal information and settings.

### For Teachers
- **Class Management**: specific tools to organize classes and manage student enrollments.
- **Task Creation**: Create and assign speaking and writing tasks with custom prompts.
- **Grading Interface**: Efficient tools for reviewing submissions and providing feedback.
- **Analytics & Reports**: detailed insights into student performance and class progress.

## 🛠️ Tech Stack

- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd lingolab_frontend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## 💻 Usage

### Development Server
To start the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### Production Build
To build the application for production:
```bash
npm run build
```

### Preview Production Build
To preview the production build locally:
```bash
npm run preview
```

### Linting
To run the linter:
```bash
npm run lint
```

## 📂 Project Structure

- `src/components`: Reusable UI components.
- `src/pages`: Application views (split into `student` and `teacher` directories).
- `src/services`: API service integrations.
- `src/stores`: Zustand state management stores.
- `src/hooks`: Custom React hooks.
- `src/types`: TypeScript type definitions.
- `src/lib`: Utility libraries and configurations.
