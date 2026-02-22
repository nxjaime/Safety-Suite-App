import { test, expect } from '@playwright/test';

test.describe('App smoke flow', () => {
  test('redirects unauthenticated root access to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /sign in to safetyhub/i })).toBeVisible();
  });

  test('redirects unauthenticated protected pages to login', async ({ page }) => {
    await page.goto('/drivers');
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/safety');
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/equipment');
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/maintenance');
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/work-orders');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('renders login form fields and submit action', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('can switch from sign in to sign up mode', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /don't have an account\? create one/i }).click();
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
  });
});
