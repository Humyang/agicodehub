
# AGICodeHub

A modern documentation and knowledge hub built with [VitePress](https://vitepress.dev/), [Vue 3](https://vuejs.org/), and [TypeScript](https://www.typescriptlang.org/).

## 🚀 Features

*   **Fast & Lightweight**: Powered by VitePress for lightning-fast static site generation.
*   **Modern Styling**: Integrated with [Tailwind CSS](https://tailwindcss.com/) for utility-first styling.
*   **Type Safe**: Built with TypeScript for better developer experience and code reliability.
*   **Code Quality**: Configured with ESLint and Stylelint to maintain high code standards.

## 🛠️ Tech Stack

*   **Framework**: Vue 3 + VitePress
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS + Stylus
*   **Package Manager**: PNPM
*   **Linting/Formatting**: ESLint, Stylelint

## 📋 Prerequisites

Ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (Check `.nvmrc` for the recommended version)
*   [PNPM](https://pnpm.io/) (Package manager)

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Humyang/agicodehub.git
    cd agicodehub
    ```

2.  **Install dependencies**
    ```bash
    pnpm install
    ```

3.  **Install global tools (Optional)**
    The project references `esbuild-runner` for running scripts:
    ```bash
    npm install -g esbuild-runner
    ```

## 💻 Usage

### Development Server
Start the local development server to view the site.
```bash
pnpm dev
# OR typically for VitePress
pnpm docs:dev
```

### Build for Production
Build the static site for deployment.
```bash
pnpm build
# OR
pnpm docs:build
```

### Linting
Check and fix code style issues.
```bash
pnpm lint
```

*(Note: Check the `package.json` file for the exact script names if the above do not work.)*

## 📂 Project Structure

```text
.
├── .vitepress/      # VitePress configuration and cache
├── scripts/         # Utility scripts (e.g., build or maintenance scripts)
├── src/             # Main source code and content (Markdown files, components)
├── generate_favicons.py # Python script for asset generation
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json    # TypeScript configuration
├── package.json     # Project dependencies and scripts
└── Readme.md        # Project documentation
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

[MIT](LICENSE) .