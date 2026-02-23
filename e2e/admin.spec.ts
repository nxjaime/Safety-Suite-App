import { test, expect } from '@playwright/test';

test.describe('Admin console', () => {
  test.beforeEach(async ({ page }) => {
    // log any browser console messages or errors which might explain blank page
    page.on('console', (msg) => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

    // stub prompt before any page script runs
    await page.addInitScript(() => {
      // override built-in prompt so our form test can be automated
      // @ts-ignore
      window.prompt = () => 'foo';
    });
    await page.goto('/admin');
  });

  test('dashboard loads and basic form interaction works', async ({ page }) => {
    await expect(page).toHaveURL('/admin');
    // wait for the suspense fallback to disappear; the generic "Loading..." text is
    // used both by the loader and in the nav so we simply ensure it is gone from the
    // page before proceeding.
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 });

    // now our page content should be mounted, log body for debug
    const bodyText = await page.textContent('body');
    console.log('admin page body after load:', bodyText);

    // the heading introduced by the page itself should now be visible
    // ensure the page-level heading (h2) is present
    await expect(page.getByRole('heading', { name: /admin dashboard/i, level: 2 })).toBeVisible();

    // table selector should exist (options themselves are hidden until user clicks)
    await expect(page.getByLabel('Table')).toBeVisible({ timeout: 10000 });

    // add a field using the '+ add field' button, prompt returns 'foo'
    await page.click('text=+ add field');
    // new input with value 'foo' should appear
    await expect(page.locator('input[value="foo"]')).toBeVisible();
  });
});
