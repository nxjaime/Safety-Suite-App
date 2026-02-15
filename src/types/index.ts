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
    type: 'General' | 'Coaching Check-in' | 'Coaching';
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
    date: string;
    type: string;
    points: number;
    notes?: string;
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

