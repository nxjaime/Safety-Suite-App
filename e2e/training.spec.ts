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
      } else if (req.method() === 'PATCH') {
        const body = req.postDataJSON();
        const url = new URL(req.url());
        const idParam = url.searchParams.get('id') || '';
        const id = idParam.startsWith('eq.') ? idParam.slice(3) : idParam;
        const idx = id ? assignments.findIndex((a: any) => a.id === id) : -1;
        if (idx >= 0) {
          assignments[idx] = { ...assignments[idx], ...body };
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(assignments[idx])
          });
        } else {
          await route.fulfill({ status: 404, body: 'Not found' });
        }
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

  test('opens assignment detail and marks complete with notes', async ({ page }) => {
    // Pre-seed one template and one assignment via network
    await page.route('**/rest/v1/training_templates*', async route => {
      const req = route.request();
      if (req.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ id: 'tmpl-1', name: 'Safety Basics', talking_points: 'Wear helmet', driver_actions: 'Inspect gear' }]),
          headers: { 'content-range': '0-0/1' }
        });
      } else {
        await route.continue();
      }
    });
    await page.route('**/rest/v1/training_assignments*', async route => {
      const req = route.request();
      let assignments: any[] = [{ id: 'assign-1', template_id: 'tmpl-1', module_name: 'Safety Basics', assignee_id: 'd1', due_date: '2024-12-31', status: 'Active', progress: 0 }];
      if (req.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(assignments),
          headers: { 'content-range': '0-0/1' }
        });
      } else if (req.method() === 'PATCH') {
        const body = req.postDataJSON();
        assignments[0] = { ...assignments[0], ...body };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(assignments[0])
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/training');
    await expect(page.getByRole('heading', { name: /Training & Development/i })).toBeVisible();

    // Open detail via View button on first row
    await page.getByRole('button', { name: /View assignment details/i }).first().click();
    const detailModal = page.locator('role=dialog[name="Assignment Details"]');
    await expect(detailModal).toBeVisible();
    await expect(detailModal.getByText(/Coach talking points/i)).toBeVisible();
    await expect(detailModal.getByText(/Wear helmet/i)).toBeVisible();
    await expect(detailModal.getByText(/Driver required actions/i)).toBeVisible();
    await expect(detailModal.getByText(/Inspect gear/i)).toBeVisible();

    await detailModal.getByRole('button', { name: /Mark complete/i }).click();
    await expect(detailModal.getByLabel(/Completion notes/i)).toBeVisible();
    await detailModal.getByLabel(/Completion notes/i).fill('Completed with coach.');
    await detailModal.getByRole('button', { name: /Submit completion/i }).click();

    await expect(detailModal.getByText(/Completed:/)).toBeVisible();
  });
});
