export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'text';

export interface TableSchema {
    [field: string]: FieldType;
}

export const adminSchemas: Record<string, TableSchema> = {
    drivers: {
        id: 'number',
        name: 'string',
        email: 'string',
        phone: 'string',
        organization_id: 'string'
    },
    tasks: {
        id: 'number',
        title: 'string',
        description: 'text',
        due_date: 'date',
        organization_id: 'string'
    },
    pm_templates: {
        id: 'number',
        name: 'string',
        interval_days: 'number',
        interval_miles: 'number',
        interval_hours: 'number',
        organization_id: 'string'
    },
    work_orders: {
        id: 'number',
        title: 'string',
        status: 'string',
        assignedTo: 'string',
        dueDate: 'date',
        organization_id: 'string'
    }
    // add more schemas as needed
};
