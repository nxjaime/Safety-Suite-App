// React import no longer needed because JSX runtime handles it automatically
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// mock services before importing component
vi.mock('../services/adminService', () => {
    return {
        adminService: {
            listRows: vi.fn().mockResolvedValue([]),
            insertRow: vi.fn().mockResolvedValue({}),
            deleteRow: vi.fn().mockResolvedValue(undefined),
        },
        adminTables: [
            { name: 'drivers', label: 'Drivers', requiresOrg: true },
        ],
    };
});

vi.mock('../services/dataQualityService', () => {
    return {
        dataQualityService: {
            getSummary: vi.fn().mockResolvedValue({}),
        },
    };
});

import AdminDashboard from '../pages/AdminDashboard';


describe('AdminDashboard', () => {
    // previous resetAllMocks was clearing the mockResolvedValue implementation and
    // causing listRows to return undefined, which crashed the component. we don't
    // need to reset here since the top-level vi.mock already provides stable
    // implementations for our tiny test suite.

    it('renders and allows adding a field in form', async () => {
        render(<AdminDashboard />);

        // table selector is present
        expect(screen.getByLabelText(/Table/i)).toBeInTheDocument();

        // the table label can appear in multiple places (select option, heading)
        // so use findAllByText and just ensure at least one match is present
        const matches = await screen.findAllByText(/Drivers/i);
        expect(matches.length).toBeGreaterThan(0);

        // form label exists
        expect(screen.getByText(/Insert Record/i)).toBeInTheDocument();

        // initially form has no fields (empty state)
        expect(screen.queryByPlaceholderText(/field/i)).not.toBeInTheDocument();

        // stub prompt to supply field name
        const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('foo');
        // add a field via button
        fireEvent.click(screen.getByText('+ add field'));
        expect(promptSpy).toHaveBeenCalled();
        // after adding, an input with value foo should appear
        expect(screen.getByDisplayValue('foo')).toBeInTheDocument();
        promptSpy.mockRestore();
    });
});
