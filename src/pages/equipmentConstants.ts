export const equipmentProfileTabs = ['Overview', 'Inspections', 'Maintenance', 'Work Orders', 'Documents', 'Service History'] as const;
export type EquipmentProfileTab = (typeof equipmentProfileTabs)[number];
