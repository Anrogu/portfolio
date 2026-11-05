# 🐟 Interactive 3D Web Portfolio

Welcome to my personal portfolio! This project is an immersive, 3D interactive web experience featuring a custom-designed, low-poly anglerfish. It showcases my work and skills through dynamic scroll-based camera navigation and real-time 3D rendering in the browser.

## 🚀 Key Features

*   **Immersive 3D Environment:** Navigate through a scene built around a custom low-poly anglerfish mesh.
*   **Scroll-Driven Navigation:** Camera movements, object rotations, and scene transitions are tightly bound to the user's scroll position.
*   **Fluid Scrolling:** Features a smooth, frictionless scrolling mechanic for a premium user experience.
*   **Optimized Web Rendering:** Lightweight 3D assets designed specifically for fast web performance without sacrificing visual quality.

## 🛠️ Tech Stack

This portfolio bridges the gap between 3D modeling and modern web development:

*   **3D Modeling:** Blender 🧊
*   **WebGL & 3D Rendering:** Three.js 🌐
*   **Animations:** GSAP (ScrollTrigger) 🎬
*   **Smooth Scroll:** Lenis 📜

## ⚙️ Prerequisites

To run this project locally, ensure you have the following installed:

*   [Node.js](https://nodejs.org/)
*   npm (or yarn/pnpm)

## 📦 Installation & Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Anrogu/portfolio.git
   cd portfolio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to the local host URL provided in your terminal (usually `http://localhost:5173` or `http://localhost:3000`) to view the 3D portfolio in action.

## 🎨 3D Assets

The central piece of this portfolio is the low-poly anglerfish. It was modeled, textured, and exported entirely in **Blender** before being integrated into the Three.js scene to allow the camera to navigate inside and around the model.

## 🤝 Contributing

Since this is a personal portfolio, direct contributions to the main design aren't actively sought, but if you spot a bug or a way to optimize the Three.js render loop, feel free to open an issue or pull request!

## 📄 License

Developed by Ángel Roberto Gutiérrez Ruiz ([Anrogu](https://github.com/Anrogu)).
