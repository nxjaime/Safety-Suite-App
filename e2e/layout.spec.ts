import { test, expect } from '@playwright/test';

const protectedRoutes = [
  { path: '/', heading: /operations pulse/i },
  { path: '/drivers', heading: /driver operations/i },
  { path: '/safety', heading: /safety intelligence center/i },
  { path: '/equipment', heading: /equipment command center/i },
  { path: '/maintenance', heading: /maintenance control/i },
  { path: '/work-orders', heading: /work order command/i }
] as const;

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
      await expect(page.getByRole('heading', { name: route.heading })).toBeVisible();

      const headerBox = await header.boundingBox();
      const firstSection = page.locator('main section').first();
      await expect(firstSection).toBeVisible();
      const sectionBox = await firstSection.boundingBox();

      expect(headerBox).not.toBeNull();
      expect(sectionBox).not.toBeNull();
      expect(sectionBox!.y).toBeGreaterThanOrEqual((headerBox!.y + headerBox!.height) - 1);
    });
  }
});
