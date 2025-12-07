# Deploying to Vercel

This project is built with **Vite** and is ready for deployment on Vercel.

## Option 1: Deploy via GitHub (Recommended)

1.  **Push your code** to a GitHub repository.
2.  Log in to [Vercel](https://vercel.com/) and go to your Dashboard.
3.  Click **"Add New..."** -> **"Project"**.
4.  Import your GitHub repository.
5.  **Configure Project**:
    *   **Framework Preset**: Vite (should be detected automatically).
    *   **Root Directory**: `./` (default).
    *   **Build Command**: `npm run build` (default).
    *   **Output Directory**: `dist` (default).
6.  **Environment Variables**:
    *   Expand the **"Environment Variables"** section.
    *   Add the following variables (copy values from your `.env` file):
        *   `VITE_SUPABASE_URL`
        *   `VITE_SUPABASE_ANON_KEY`
7.  Click **"Deploy"**.

## Option 2: Deploy via CLI

If you have the Vercel CLI installed:

1.  Run:
    ```bash
    vercel
    ```
2.  Follow the prompts to log in and set up the project.
3.  When asked for settings, accept the defaults (Vite detection is usually correct).
4.  Add environment variables via the Vercel Dashboard after the first deployment, or using `vercel env add`.

## Post-Deployment

*   Your app will be live at a `*.vercel.app` URL.
*   Ensure your Supabase project URL is accessible from the internet (it is by default).
