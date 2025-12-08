export interface TrainingRecord {
    id: string;
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
    title: string;
    description?: string;
    dueDate: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Pending' | 'In Progress' | 'Completed';
    assignee: string;
    type: 'General' | 'Coaching Check-in';
    relatedId?: string; // driver ID or plan ID
    driverName?: string;
}

export interface CoachingPlan {
    id: string;
    driverId: string;
    type: string;
    startDate: string;
    durationWeeks: number;
    status: 'Active' | 'Completed' | 'Terminated';
    weeklyCheckIns: WeeklyCheckIn[];
}

export interface DriverDocument {
    id: string;
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
    date: string;
    type: string;
    points: number;
    notes?: string;
}

export interface Accident {
    id: string;
    date: string;
    type: string;
    preventable: boolean;
    severity: 'Minor' | 'Moderate' | 'Major';
}

export interface Citation {
    id: string;
    date: string;
    details: string;
}

export interface Driver {
    id: string;
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
    email?: string;
    hireDate?: string;
    riskEvents?: RiskEvent[];
}
