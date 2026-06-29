import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ListWorkflowControls from '../components/list/ListWorkflowControls';
import { listWorkflowService } from '../services/listWorkflowService';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../services/listWorkflowService', () => ({
  listWorkflowService: {
    listSavedViews: vi.fn(),
    saveView: vi.fn(),
    deleteView: vi.fn(),
    exportCsv: vi.fn().mockResolvedValue('Task,Status\\nOne,Open'),
  },
}));

const mockListSavedViews = listWorkflowService.listSavedViews as ReturnType<typeof vi.fn>;

describe('ListWorkflowControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListSavedViews.mockResolvedValue([
      {
        id: 'view-1',
        organizationId: 'org-1',
        userId: 'user-1',
        target: 'tasks',
        name: 'Overdue Tasks',
        filters: { status: 'overdue' },
        createdAt: '2026-06-28T00:00:00.000Z',
      },
    ]);
  });

  it('gives saved-view delete controls an accessible name', async () => {
    render(
      <ListWorkflowControls
        target="tasks"
        filters={{}}
        headers={['Task', 'Status']}
        rows={[['One', 'Open']]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Views' }));

    expect(await screen.findByRole('button', { name: 'Overdue Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete saved view Overdue Tasks' })).toBeInTheDocument();

    await waitFor(() => expect(mockListSavedViews).toHaveBeenCalledWith('tasks'));
  });
});
