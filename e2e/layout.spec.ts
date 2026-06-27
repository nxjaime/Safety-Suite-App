import { test, expect } from '@playwright/test';

const protectedRoutes = [
  { path: '/', heading: /operations pulse/i },
  { path: '/dashboard', heading: /operations pulse/i },
  { path: '/drivers', heading: /driver operations/i },
  { path: '/tasks', heading: /tasks & follow-ups/i },
  { path: '/safety', heading: /safety intelligence center/i },
  { path: '/equipment', heading: /equipment command center/i },
  { path: '/maintenance', heading: /maintenance control/i },
  { path: '/work-orders', heading: /work order command/i },
  { path: '/training', heading: /training & development/i },
  { path: '/admin', heading: /admin & enterprise controls/i }
] as const;

const mobileNavRoutes = [
  { label: 'Status Board', path: '/dashboard', heading: /operations pulse/i },
  { label: 'Drivers', path: '/drivers', heading: /driver operations/i },
  { label: 'Equipment', path: '/equipment', heading: /equipment command center/i },
  { label: 'Tasks', path: '/tasks', heading: /tasks & follow-ups/i },
  { label: 'Work Orders', path: '/work-orders', heading: /work order command/i },
  { label: 'Training', path: '/training', heading: /training & development/i },
  { label: 'Admin Dashboard', path: '/admin', heading: /admin & enterprise controls/i }
] as const;

const clearToastOverlays = async (page: import('@playwright/test').Page) => {
  await page.locator('[data-rht-toaster]').evaluateAll((nodes) => {
    for (const node of nodes) {
      node.remove();
    }
  });
};

test.describe('Layout regression', () => {
  test('login page heading is not clipped at top of viewport', async ({ page }) => {
    await page.goto('/login');

    const heading = page.getByRole('heading', { name: /sign in to safetyhub/i });
    await expect(heading).toBeVisible();

    const box = await heading.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThan(0);
  });

  for (const route of protectedRoutes) {
    test(`protected route ${route.path} is not clipped by fixed header`, async ({ page }) => {
      await page.goto(route.path);

      const header = page.locator('header').first();
      await expect(header).toBeVisible();
      const contentHeading = page.getByRole('heading', { name: route.heading }).first();
      await expect(contentHeading).toBeVisible();

      const headerBox = await header.boundingBox();
      const headingBox = await contentHeading.boundingBox();

      expect(headerBox).not.toBeNull();
      expect(headingBox).not.toBeNull();
      expect(headingBox!.y).toBeGreaterThanOrEqual((headerBox!.y + headerBox!.height) - 1);
    });
  }

  for (const width of [390, 768, 1280]) {
    test(`header content remains visible at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/dashboard');

      const header = page.locator('header').first();
      await expect(header).toBeVisible();
      await expect(page.getByRole('heading', { name: /status board/i })).toBeVisible();

      const headerBox = await header.boundingBox();
      const contentHeading = page.getByRole('heading', { name: /operations pulse/i }).first();
      await expect(contentHeading).toBeVisible();
      const headingBox = await contentHeading.boundingBox();

      expect(headerBox).not.toBeNull();
      expect(headingBox).not.toBeNull();
      expect(headerBox!.x).toBeGreaterThanOrEqual(0);
      expect(headerBox!.width).toBeLessThanOrEqual(width);
      expect(headingBox!.y).toBeGreaterThanOrEqual((headerBox!.y + headerBox!.height) - 1);
    });
  }

  test('mobile drawer navigation reaches primary routes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/dashboard');

    for (const route of mobileNavRoutes) {
      await clearToastOverlays(page);
      await page.getByRole('button', { name: /open navigation/i }).click();
      const dialog = page.getByRole('dialog', { name: /navigation/i });
      await expect(dialog).toBeVisible();
      await clearToastOverlays(page);
      await dialog.getByRole('link', { name: route.label, exact: true }).click();
      await expect(dialog).toBeHidden();
      await expect(page).toHaveURL(new RegExp(`${route.path.replace('/', '\\/')}$`));
      await expect(page.getByRole('heading', { name: route.heading })).toBeVisible();
    }
  });

  test('driver portal is usable on a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/driver-portal');

    await expect(page.getByText(/driver portal/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
  });
});
