# InPsyQ Landing Page

A modern, dark-themed, single-page marketing site for "InPsyQ" — a social sentiment analysis tool. Built with Next.js, TailwindCSS, and Framer Motion.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1.  Isolate the project directory:
    ```bash
    cd inpsyq-landing
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

## 🛠 Tech Stack

-   **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Animations:** [Framer Motion](https://www.framer.com/motion/)
-   **Icons:** [Lucide React](https://lucide.dev/)
-   **Language:** TypeScript

## 📂 Project Structure

-   `app/page.tsx`: Main entry point assembling all sections.
-   `app/layout.tsx`: Root layout configuration.
-   `components/`: Reusable UI components and page sections.
    -   `ui/FadeIn.tsx`: Wrapper for scroll-triggered animations.
    -   `BackgroundEffects.tsx`: Animated background gradients.
    -   Sections: `Hero`, `ProblemSection`, `SolutionSection`, etc.

## ✨ Features

-   **Dark Mode Aesthetic:** Custom color palette with deep backgrounds and neon accents.
-   **Scroll Animations:** Elements fade and slide in as you scroll.
-   **Responsive Design:** Fully optimized for mobile, tablet, and desktop.
-   **Smooth Scrolling:** Navigation links smoothly scroll to sections.
-   **Interactive Elements:** Hover effects on cards, buttons, and mockup visualizations.
