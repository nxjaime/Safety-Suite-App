import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 1200 } });

test.describe('Training page', () => {
  const mockDriver = {
    id: 'd1',
    name: 'Jane Doe',
  };

  test.beforeEach(async ({ page }) => {
    // in-memory store for templates/assignments so we can mutate during test
    const templates: any[] = [];
    const assignments: any[] = [];

    await page.route('**/rest/v1/drivers*', async route => {
      const request = route.request();
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockDriver]),
          headers: { 'content-range': '0-0/1' }
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/rest/v1/training_templates*', async route => {
      const req = route.request();
      if (req.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(templates),
          headers: { 'content-range': `${templates.length - 1}-${templates.length - 1}/${templates.length}` }
        });
      } else if (req.method() === 'POST') {
        const body = req.postDataJSON();
        console.log('template POST body', body);
        const newT = { id: `tmpl-${templates.length + 1}`, ...body };
        templates.push(newT);
        // Supabase .single() expects the response to be the object itself, not an array
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newT)
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/rest/v1/training_assignments*', async route => {
      const req = route.request();
      if (req.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(assignments),
          headers: { 'content-range': `${assignments.length - 1}-${assignments.length - 1}/${assignments.length}` }
        });
      } else if (req.method() === 'POST') {
        const body = req.postDataJSON();
        console.log('assignment POST body', body);
        const newA: any = { id: `assign-${assignments.length + 1}`, ...body };
        console.log('newA constructed', newA);
        assignments.push(newA);
        // mimic supabase response: array of rows
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([newA])
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/training');
  });

  test('can manage templates and create an assignment', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Training & Development/i })).toBeVisible();

    // open assign modal
    await page.getByRole('button', { name: 'Assign Training' }).click();
    const assignModal = page.locator('role=dialog[name="Assign Training Module"]');
    await expect(assignModal).toBeVisible();

    // go to template management
    await assignModal.getByText(/Manage templates/).click();
    // wait for template form fields to appear
    await expect(page.getByLabel('Template Name')).toBeVisible();

    // add a template
    await page.getByLabel('Template Name').fill('Safety Basics');
    await page.getByLabel('Talking Points').fill('Always wear helmet');
    await page.getByLabel('Driver Actions').fill('Inspect equipment');
    await page.getByRole('button', { name: /Save Template/i }).click();
    // wait for the network request to complete before checking state
    await page.waitForResponse(r => r.url().includes('/rest/v1/training_templates') && r.request().method() === 'POST');
    // modal should close when template saved (form fields disappear)
    await expect(page.getByLabel('Template Name')).toBeHidden();

    // debug inspect created object stored on window by page
    const createdObj = await page.evaluate(() => (window as any).__lastCreatedTemplate);
    console.log('createdObj from window:', createdObj);
    const templatesState = await page.evaluate(() => (window as any).__templates);
    console.log('templates state from window:', templatesState);

    // back to assign modal (it should still be visible)
    await expect(assignModal).toBeVisible();

    // the new template should now be available for selection - wait for option to render
    const templateSelect = assignModal.getByRole('combobox', { name: /Template/i });
    // debug: log innerHTML of select so we can inspect options if test fails
    const html = await templateSelect.evaluate(el => el.innerHTML);
    console.log('template select innerHTML:', html);
    // option may be hidden until select is opened; just ensure it exists
    await expect(templateSelect.locator('option', { hasText: 'Safety Basics' })).toHaveCount(1);
    await templateSelect.selectOption({ label: 'Safety Basics' });
    await assignModal.getByRole('combobox', { name: /Assignee/i }).selectOption({ label: 'Jane Doe' });
    // set due date
    await assignModal.locator('input[type=date]').fill('2024-12-31');
    await assignModal.getByRole('button', { name: 'Assign Training' }).click();
    // wait for modal to close
    await expect(assignModal).toBeHidden();

    // assignment row should appear in table (scope to first row to avoid matching option element)
    const assignmentRow = page.locator('table tbody tr').first();
    await expect(assignmentRow.getByText('Safety Basics')).toBeVisible();
    await expect(assignmentRow.getByText('Jane Doe')).toBeVisible();
  });
});
