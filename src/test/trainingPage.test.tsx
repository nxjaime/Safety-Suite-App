import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { trainingService } from '../services/trainingService';

// mocks
vi.mock('../services/driverService', () => ({
    driverService: {
        fetchDrivers: vi.fn().mockResolvedValue([{ id: 'd1', name: 'John' }]),
    }
}));
vi.mock('../services/trainingService', () => ({
    trainingService: {
        listAssignments: vi.fn().mockResolvedValue([]),
        insertAssignment: vi.fn().mockResolvedValue({ id: 'a1', module_name: 'Test', status: 'Active', progress: 0 }),
        insertTemplate: vi.fn().mockResolvedValue({ id: 'tnew', name: 'New', talking_points: '', driver_actions: '' }),
        updateTemplate: vi.fn().mockResolvedValue({ id: 't1', name: 'Updated' }),
        listTemplates: vi.fn().mockResolvedValue([]),
    }
}));

import Training from '../pages/Training';

describe('Training page', () => {
    it('renders and opens assign modal and template modal', async () => {
        render(<Training />);
        expect(screen.getByRole('heading', { name: /Training & Development/i })).toBeInTheDocument();

        // assign flow
        const assignBtn = screen.getByText(/Assign Training/i);
        expect(assignBtn).toBeInTheDocument();
        fireEvent.click(assignBtn);
        expect(screen.getByText(/Assign Training Module/i)).toBeInTheDocument();

        // template management link within modal
        const manageLink = screen.getByText(/Manage templates/i);
        expect(manageLink).toBeInTheDocument();
        fireEvent.click(manageLink);
        expect(screen.getByText(/Manage Training Templates/i)).toBeInTheDocument();
    });

    it('creates a new template via service', async () => {
        // render
        render(<Training />);
        // open assign modal then template modal
        fireEvent.click(screen.getByText(/Assign Training/i));
        fireEvent.click(screen.getByText(/Manage templates/i));
        // fill template form and submit
        const nameInput = screen.getByLabelText(/Template Name/i);
        const pointsInput = screen.getByLabelText(/Talking Points/i);
        fireEvent.change(nameInput, { target: { value: 'New Template' } });
        fireEvent.change(pointsInput, { target: { value: 'point' } });
        fireEvent.click(screen.getByText(/Save Template/i));
        await waitFor(() => {
            expect(trainingService.insertTemplate).toHaveBeenCalledWith({
                name: 'New Template',
                talking_points: 'point',
                driver_actions: '',
            });
        });
    });

    it('edits an existing template', async () => {
        // prepare mock before rendering
        const sample = { id: 't1', name: 'Old', talking_points: '', driver_actions: '' };
        (trainingService.listTemplates as unknown as vi.Mock).mockResolvedValue([sample]);
        render(<Training />);
        fireEvent.click(screen.getByText(/Assign Training/i));
        fireEvent.click(screen.getByText(/Manage templates/i));
        // wait for list to populate (span element specifically)
        await waitFor(() => {
            const candidates = screen.getAllByText(/Old/);
            expect(candidates.some(el => el.tagName === 'SPAN')).toBe(true);
        });
        // locate the correct list item and click its edit button
        const spanEl = screen.getAllByText(/Old/).find(el => el.tagName === 'SPAN');
        const listItem = spanEl?.closest('li');
        expect(listItem).toBeTruthy();
        fireEvent.click(within(listItem as HTMLElement).getByText(/Edit/i));
        const nameInput = screen.getByLabelText(/Template Name/i);
        fireEvent.change(nameInput, { target: { value: 'Updated' } });
        fireEvent.click(screen.getByText(/Update Template/i));
        await waitFor(() => {
            expect(trainingService.updateTemplate).toHaveBeenCalledWith('t1', {
                name: 'Updated',
                talking_points: '',
                driver_actions: '',
            });
        });
    });

    it('sends correct payload when assigning training', async () => {
        // ensure no existing assignments
        (trainingService.listAssignments as unknown as vi.Mock).mockResolvedValue([]);
        (trainingService.insertAssignment as unknown as vi.Mock).mockResolvedValue({
            id: 'a1',
            module_name: 'Ignored',
            assignee_id: 'd1',
            due_date: '2024-01-01',
            status: 'Active',
            progress: 0,
        });
        // supply a template so the dropdown has something and drives moduleName derivation
        (trainingService.listTemplates as unknown as vi.Mock).mockResolvedValue([
            { id: 't1', name: 'Templ', talking_points: '', driver_actions: '' },
        ]);

        render(<Training />);
        fireEvent.click(screen.getByText(/Assign Training/i));

        // wait for assign dialog to appear and for template/assignee options to load
        const modal = await screen.findByRole('dialog', { name: /Assign Training Module/i });
        // wait for our template to show up as an option
        await waitFor(() => {
            const tmplSelect = screen.getByLabelText(/Template/i) as HTMLSelectElement;
            expect(tmplSelect.querySelector('option[value="t1"]')).toBeInTheDocument();
        });
        // similarly wait for driver option
        await waitFor(() => {
            const assn = screen.getByLabelText(/Assignee/i) as HTMLSelectElement;
            expect(assn.querySelector('option[value="d1"]')).toBeInTheDocument();
        });

        // choose template and assignee and set due date
        fireEvent.change(screen.getByLabelText(/Template/i), { target: { value: 't1' } });
        fireEvent.change(screen.getByLabelText(/Assignee/i), { target: { value: 'd1' } });
        fireEvent.change(screen.getByLabelText(/Due Date/i), { target: { value: '2024-01-01' } });

        // click the submit button inside the modal (it will be the second matching button)
        const assignButtons = screen.getAllByRole('button', { name: /^Assign Training$/i });
        expect(assignButtons.length).toBeGreaterThan(1);
        fireEvent.click(assignButtons[1]);

        await waitFor(() => {
            expect(trainingService.insertAssignment).toHaveBeenCalledWith({
                template_id: 't1',
                module_name: 'Templ',
                assignee_id: 'd1',
                due_date: '2024-01-01',
                status: 'Active',
                progress: 0,
            });
        });
    });
});