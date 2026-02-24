import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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
    }
}));

import Training from '../pages/Training';

describe('Training page', () => {
    it('renders and opens assign modal', async () => {
        render(<Training />);
        expect(screen.getByRole('heading', { name: /Training & Development/i })).toBeInTheDocument();
        // after initial load, button should be present
        expect(screen.getByText(/Assign Training/i)).toBeInTheDocument();
        fireEvent.click(screen.getByText(/Assign Training/i));
        expect(screen.getByText(/Assign Training Module/i)).toBeInTheDocument();
    });
});