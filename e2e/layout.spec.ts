import { test, expect } from '@playwright/test';

test.describe('Layout regression', () => {
  test('login page heading is not clipped at top of viewport', async ({ page }) => {
    await page.goto('/login');

    const heading = page.getByRole('heading', { name: /sign in to safetyhub/i });
    await expect(heading).toBeVisible();

    const box = await heading.boundingBox();
    expect(box).not.toBeNull();

    // Guard against top clipping regressions.
    expect(box!.y).toBeGreaterThan(0);
  });

  test.skip('protected route clipping checks (requires authenticated Playwright fixture)', async () => {
    // TODO: add authenticated fixture and assert no overlap between fixed header and first content section.
  });
});
