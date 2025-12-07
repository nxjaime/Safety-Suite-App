---
description: Build the application for production
---

This workflow builds the application for production deployment.

1.  **Install Dependencies** (if not already installed)
    Ensure all dependencies are up to date.
    ```bash
    npm install
    ```

2.  **Run Build Script**
    Compile TypeScript and bundle the application using Vite.
    // turbo
    ```bash
    npm run build
    ```

3.  **Verify Build Output**
    Check if the `dist` directory was created.
    ```bash
    ls -F dist
    ```

4.  **Preview Build** (Optional)
    Run a local server to preview the production build.
    ```bash
    npm run preview
    ```
