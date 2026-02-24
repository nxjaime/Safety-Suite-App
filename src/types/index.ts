export interface Organization {
    id: string;
    name: string;
}

export interface UserProfile {
    id: string; // matches auth.users.id
    organizationId: string;
    role: 'admin' | 'manager' | 'viewer';
    fullName: string;
}

export interface TrainingRecord {
    id: string;
    organizationId?: string;
    moduleName: string;
    date: string; // Assignment date
    dueDate: string;
    status: 'Assigned' | 'In Progress' | 'Completed' | 'Overdue';
    completedDate?: string;
    notes?: string;
}

// new sprint‑13 types
export interface TrainingTemplate {
    id: string;
    name: string;
    talking_points?: string;
    driver_actions?: string;
    organizationId?: string;
    created_at?: string;
    updated_at?: string;
}

export type TrainingStatus = 'Active' | 'Completed' | 'Overdue';

export interface TrainingAssignment {
    id: string;
    template_id?: string | null;
    module_name: string;
    assignee_id?: string | null;
    due_date?: string;
    status: TrainingStatus;
    progress: number;
    organizationId?: string;
    created_at?: string;
    updated_at?: string;
}

export interface NoteEntry {
    id: string;
    text: string;
    date: string;
    author: string;
}

export interface WeeklyCheckIn {
    week: number;
    assignedTo: string;
    status: 'Pending' | 'Complete';
    notes: string;
    completedDate?: string;
    date: string; // Scheduled date
}

export interface TaskItem {
    id: string;
    organizationId?: string;
    title: string;
    description?: string;
    dueDate: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Pending' | 'In Progress' | 'Completed';
    assignee: string;
    type: 'General' | 'Coaching Check-in' | 'Coaching' | 'Compliance';
    relatedId?: string; // driver ID or plan ID
    driverName?: string;
    driverId?: string;
    closedNotes?: string;
    closedAt?: string;
}

export interface CoachingPlan {
    id: string;
    organizationId?: string;
    driverId: string;
    type: string;
    startDate: string;
    durationWeeks: number;
    status: 'Active' | 'Completed' | 'Terminated';
    weeklyCheckIns: WeeklyCheckIn[];
    targetScore?: number;
    dueDate?: string;
    outcome?: string;
}

export interface DriverDocument {
    id: string;
    organizationId?: string;
    driverId: string;
    name: string;
    type: string;
    url?: string;
    notes?: string;
    expiryDate?: string;
    date: string; // created_at
}

export interface RiskEvent {
    id: string;
    organizationId?: string;
    date?: string;
    type: string;
    eventType?: string;
    source?: string;
    severity?: number;
    scoreDelta?: number;
    points: number;
    occurredAt?: string;
    metadata?: Record<string, unknown>;
    notes?: string;
}

export interface DriverRiskScore {
    id: string;
    organizationId?: string;
    driverId: string;
    score: number;
    sourceWindow?: string;
    asOf: string;
    compositeParts?: {
        motive: number;
        local: number;
        band: 'green' | 'yellow' | 'red';
    };
}

export interface Accident {
    id: string;
    organizationId?: string;
    date: string;
    type: string;
    preventable: boolean;
    severity: 'Minor' | 'Moderate' | 'Major';
}

export interface Citation {
    id: string;
    organizationId?: string;
    date: string;
    details: string;
}

export interface Driver {
    id: string;
    organizationId?: string;
    motiveId?: string;
    name: string;
    driverManager?: string;
    status: 'Active' | 'Inactive' | 'On Leave';
    terminal: string;
    riskScore: number;
    yearsOfService: number;
    employeeId: string;
    image: string;
    accidents: Accident[];
    citations: Citation[];
    address?: string;
    ssn?: string;
    phone?: string;
    notes?: NoteEntry[];
    trainingHistory?: TrainingRecord[];
    coachingPlans?: CoachingPlan[];
    licenseNumber?: string;
    licenseState?: string;
    licenseRestrictions?: string;
    licenseEndorsements?: string;
    licenseExpirationDate?: string;
    medicalCardIssueDate?: string;
    medicalCardExpirationDate?: string;
    cpapRequired?: boolean;
    email?: string;
    hireDate?: string;
    riskEvents?: RiskEvent[];
}

export type EquipmentType = 'truck' | 'trailer' | 'forklift' | 'pallet_jack' | 'sales_vehicle';
export type OwnershipType = 'owned' | 'leased' | 'rented';
export type EquipmentStatus = 'active' | 'inactive' | 'out_of_service';

export interface Equipment {
    id: string;
    organizationId?: string;
    assetTag: string;
    type: EquipmentType;
    ownershipType: OwnershipType;
    status: EquipmentStatus;
    make?: string;
    model?: string;
    year?: number;
    usageMiles?: number;
    usageHours?: number;
    attachments?: string[];
    forkliftAttachments?: string[];
}

export interface MaintenanceTemplate {
    id: string;
    organizationId?: string;
    name: string;
    appliesToType?: EquipmentType;
    intervalDays?: number;
    intervalMiles?: number;
    intervalHours?: number;
}

export type WorkOrderStatus = 'Draft' | 'Approved' | 'In Progress' | 'Completed' | 'Closed';
export type WorkOrderPriority = 'Low' | 'Medium' | 'High';

export interface WorkOrderLineItem {
    id: string;
    workOrderId: string;
    type: 'part' | 'labor';
    description: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
}

export interface WorkOrder {
    id: string;
    organizationId?: string;
    equipmentId?: string;
    title: string;
    description?: string;
    status: WorkOrderStatus;
    priority: WorkOrderPriority;
    approvedBy?: string;
    approvedAt?: string;
    assignedTo?: string;
    dueDate?: string;
    totalPartsCost?: number;
    totalLaborCost?: number;
    totalCost?: number;
    lineItems?: WorkOrderLineItem[];
}
