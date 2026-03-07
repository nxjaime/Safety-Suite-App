import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveDemoSeedConfig } from '../src/server/demoSeedConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

type Row = Record<string, any>;

const {
  orgId: configuredOrgId,
  supabaseKey,
  supabaseUrl
} = resolveDemoSeedConfig({
  env: process.env,
  argv: process.argv
});

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const toISODate = (daysFromNow = 0) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

const toISODateTime = (daysFromNow = 0) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  return d.toISOString();
};

async function resolveOrganizationId(): Promise<string> {
  if (configuredOrgId) return configuredOrgId;

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('organization_id')
    .not('organization_id', 'is', null)
    .limit(1);
  if (!profilesError && profiles?.[0]?.organization_id) return profiles[0].organization_id;

  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .limit(1);
  if (!orgError && orgs?.[0]?.id) return orgs[0].id;

  const { data: created, error: createError } = await supabase
    .from('organizations')
    .insert([{ name: 'Safety Suite Demo Organization' }])
    .select('id')
    .single();
  if (createError || !created?.id) {
    throw createError || new Error('Failed to create fallback organization');
  }
  return created.id;
}

async function upsertByQuery(
  table: string,
  match: Record<string, any>,
  payload: Record<string, any>
): Promise<Row> {
  let query = supabase.from(table).select('*').limit(1);
  for (const [key, value] of Object.entries(match)) {
    query = query.eq(key, value);
  }

  const { data: existing, error: selectError } = await query;
  if (selectError) throw selectError;

  if (existing && existing.length > 0) {
    const existingRow = existing[0];
    const { data: updated, error: updateError } = await supabase
      .from(table)
      .update(payload)
      .eq('id', existingRow.id)
      .select('*')
      .single();
    if (updateError) throw updateError;
    return updated;
  }

  const { data: inserted, error: insertError } = await supabase
    .from(table)
    .insert([payload])
    .select('*')
    .single();
  if (insertError) throw insertError;
  return inserted;
}

async function ensureSystemOptions() {
  const options = [
    { category: 'vehicle_type', label: 'Truck', value: 'Truck' },
    { category: 'vehicle_type', label: 'Trailer', value: 'Trailer' },
    { category: 'vehicle_type', label: 'Forklift', value: 'Forklift' },
    { category: 'vehicle_type', label: 'Pallet Jack', value: 'Pallet Jack' },
    { category: 'vehicle_type', label: 'Sales Vehicle', value: 'Sales Vehicle' },
    { category: 'risk_type', label: 'Speeding', value: 'Speeding' },
    { category: 'risk_type', label: 'Hard Braking', value: 'Hard Braking' },
    { category: 'risk_type', label: 'HOS Violation', value: 'HOS Violation' },
    { category: 'risk_type', label: 'Accident', value: 'Accident' },
    { category: 'risk_type', label: 'Citation', value: 'Citation' }
  ];

  for (const opt of options) {
    await upsertByQuery('system_options', { category: opt.category, value: opt.value }, opt);
  }
}

async function seedDrivers(orgId: string) {
  const drivers = [
    {
      name: 'Sarah Jenkins',
      status: 'Active',
      terminal: 'West Coast',
      risk_score: 34,
      years_of_service: 5,
      employee_id: 'DEMO-DRV-001',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      phone: '555-0101',
      email: 'sarah.jenkins@example.com',
      driver_manager: 'Maya Chen',
      license_number: 'CA-DL-192883',
      license_state: 'CA',
      license_endorsements: 'N, T',
      license_expiration_date: toISODate(95),
      medical_card_issue_date: toISODate(-260),
      medical_card_expiration_date: toISODate(45),
      hire_date: toISODate(-1400),
      organization_id: orgId
    },
    {
      name: 'Mike Ross',
      status: 'Active',
      terminal: 'North East',
      risk_score: 78,
      years_of_service: 2,
      employee_id: 'DEMO-DRV-002',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
      phone: '555-0102',
      email: 'mike.ross@example.com',
      driver_manager: 'Maya Chen',
      license_number: 'PA-DL-733102',
      license_state: 'PA',
      license_endorsements: 'H, N',
      license_expiration_date: toISODate(14),
      medical_card_issue_date: toISODate(-330),
      medical_card_expiration_date: toISODate(-3),
      hire_date: toISODate(-620),
      organization_id: orgId
    },
    {
      name: 'David Kim',
      status: 'Active',
      terminal: 'Central',
      risk_score: 52,
      years_of_service: 8,
      employee_id: 'DEMO-DRV-003',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d',
      phone: '555-0103',
      email: 'david.kim@example.com',
      driver_manager: 'Jordan Lee',
      license_number: 'IL-DL-991420',
      license_state: 'IL',
      license_endorsements: 'X',
      license_expiration_date: toISODate(180),
      medical_card_issue_date: toISODate(-140),
      medical_card_expiration_date: toISODate(220),
      hire_date: toISODate(-2800),
      organization_id: orgId
    },
    {
      name: 'Elena Rodriguez',
      status: 'On Leave',
      terminal: 'South West',
      risk_score: 66,
      years_of_service: 3,
      employee_id: 'DEMO-DRV-004',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
      phone: '555-0104',
      email: 'elena.rodriguez@example.com',
      driver_manager: 'Jordan Lee',
      license_number: 'TX-DL-440812',
      license_state: 'TX',
      license_endorsements: 'T',
      license_expiration_date: toISODate(35),
      medical_card_issue_date: toISODate(-380),
      medical_card_expiration_date: toISODate(10),
      hire_date: toISODate(-980),
      organization_id: orgId
    }
  ];

  const created: Record<string, Row> = {};
  for (const driver of drivers) {
    const row = await upsertByQuery(
      'drivers',
      { organization_id: orgId, employee_id: driver.employee_id },
      driver
    );
    created[driver.employee_id] = row;
  }

  return created;
}

async function seedSafety(orgId: string, driversByEmployeeId: Record<string, Row>) {
  const riskEvents = [
    {
      orgEmployeeId: 'DEMO-DRV-002',
      event_type: 'Speeding',
      type: 'Speeding',
      source: 'manual',
      severity: 4,
      score_delta: 16,
      points: 16,
      occurred_at: toISODateTime(-12),
      date: toISODate(-12),
      notes: '72 mph in 55 zone',
      metadata: { road: 'I-80', weather: 'Clear' }
    },
    {
      orgEmployeeId: 'DEMO-DRV-002',
      event_type: 'HOS Violation',
      type: 'HOS Violation',
      source: 'manual',
      severity: 3,
      score_delta: 14,
      points: 14,
      occurred_at: toISODateTime(-6),
      date: toISODate(-6),
      notes: 'Exceeded 11-hour driving limit',
      metadata: { durationMinutes: 37 }
    },
    {
      orgEmployeeId: 'DEMO-DRV-003',
      event_type: 'Hard Braking',
      type: 'Hard Braking',
      source: 'manual',
      severity: 2,
      score_delta: 8,
      points: 8,
      occurred_at: toISODateTime(-18),
      date: toISODate(-18),
      notes: 'Late stop on urban route',
      metadata: { speedMph: 41 }
    },
    {
      orgEmployeeId: 'DEMO-DRV-004',
      event_type: 'Citation',
      type: 'Citation',
      source: 'manual',
      severity: 3,
      score_delta: 10,
      points: 10,
      occurred_at: toISODateTime(-25),
      date: toISODate(-25),
      notes: 'Lane discipline citation',
      metadata: { jurisdiction: 'AZ' }
    }
  ];

  for (const event of riskEvents) {
    const driver = driversByEmployeeId[event.orgEmployeeId];
    if (!driver) continue;
    await upsertByQuery(
      'risk_events',
      {
        organization_id: orgId,
        driver_id: driver.id,
        event_type: event.event_type,
        occurred_at: event.occurred_at
      },
      {
        ...event,
        driver_id: driver.id,
        organization_id: orgId
      }
    );
  }

  const today = new Date();
  for (const driver of Object.values(driversByEmployeeId)) {
    for (let i = 0; i < 6; i += 1) {
      const asOf = new Date(today);
      asOf.setUTCDate(asOf.getUTCDate() - (i * 14));
      const entryScore = Math.max(0, Math.min(100, (driver.risk_score || 50) + (i % 2 === 0 ? -3 : 2)));
      await upsertByQuery(
        'driver_risk_scores',
        { organization_id: orgId, driver_id: driver.id, as_of: asOf.toISOString() },
        {
          organization_id: orgId,
          driver_id: driver.id,
          score: entryScore,
          source_window: '90d',
          as_of: asOf.toISOString(),
          composite_parts: {
            motive: Math.max(0, entryScore - 8),
            local: Math.min(100, entryScore + 5),
            band: entryScore >= 80 ? 'red' : entryScore >= 50 ? 'yellow' : 'green'
          }
        }
      );
    }
  }
}

async function seedCoachingAndTasks(orgId: string, driversByEmployeeId: Record<string, Row>) {
  const targetDriver = driversByEmployeeId['DEMO-DRV-002'];
  const supportDriver = driversByEmployeeId['DEMO-DRV-003'];
  if (!targetDriver || !supportDriver) return;

  const weeklyCheckIns = [
    { week: 1, assignedTo: 'Safety Manager', status: 'Complete', notes: 'Reviewed ELD exceptions.', completedDate: toISODate(-18), date: toISODate(-18) },
    { week: 2, assignedTo: 'Safety Manager', status: 'Complete', notes: 'Defensive spacing coaching.', completedDate: toISODate(-11), date: toISODate(-11) },
    { week: 3, assignedTo: 'Safety Manager', status: 'In Progress', notes: 'In-cab distraction audit.', date: toISODate(-4) },
    { week: 4, assignedTo: 'Safety Manager', status: 'Pending', notes: '', date: toISODate(3) }
  ];

  const coachingPlan = await upsertByQuery(
    'coaching_plans',
    {
      organization_id: orgId,
      driver_id: targetDriver.id,
      type: 'Speed & HOS Remediation',
      start_date: toISODate(-21)
    },
    {
      organization_id: orgId,
      driver_id: targetDriver.id,
      type: 'Speed & HOS Remediation',
      start_date: toISODate(-21),
      duration_weeks: 4,
      status: 'Active',
      weekly_check_ins: weeklyCheckIns,
      target_score: 55,
      due_date: toISODate(7),
      outcome: null
    }
  );

  const tasks = [
    {
      title: `Coaching Check-in: ${targetDriver.name} (Week 4)`,
      description: 'Review trend from recent speeding and HOS events.',
      due_date: toISODate(3),
      priority: 'High',
      status: 'Pending',
      assignee: 'Safety Manager',
      type: 'Coaching',
      related_id: coachingPlan.id,
      organization_id: orgId,
      driver_id: targetDriver.id,
      driver_name: targetDriver.name
    },
    {
      title: 'Upload updated insurance certificate',
      description: 'Current insurance record expires this month.',
      due_date: toISODate(10),
      priority: 'High',
      status: 'Pending',
      assignee: 'Compliance Manager',
      type: 'Compliance',
      related_id: null,
      organization_id: orgId,
      driver_id: null,
      driver_name: null
    },
    {
      title: `Ride-along follow-up: ${supportDriver.name}`,
      description: 'Document behavior observations and coaching actions.',
      due_date: toISODate(6),
      priority: 'Medium',
      status: 'In Progress',
      assignee: 'Safety Manager',
      type: 'General',
      related_id: supportDriver.id,
      organization_id: orgId,
      driver_id: supportDriver.id,
      driver_name: supportDriver.name
    }
  ];

  for (const task of tasks) {
    await upsertByQuery(
      'tasks',
      { organization_id: orgId, title: task.title, due_date: task.due_date },
      task
    );
  }
}

async function seedFleetOperations(orgId: string) {
  const equipmentRows = [
    {
      organization_id: orgId,
      asset_tag: 'TRK-101',
      type: 'truck',
      ownership_type: 'owned',
      status: 'active',
      make: 'Freightliner',
      model: 'Cascadia',
      year: 2022,
      usage_miles: 182340,
      usage_hours: 3200,
      attachments: ['Camera', 'Tablet'],
      forklift_attachments: []
    },
    {
      organization_id: orgId,
      asset_tag: 'TRK-102',
      type: 'truck',
      ownership_type: 'leased',
      status: 'out_of_service',
      make: 'Volvo',
      model: 'VNL 860',
      year: 2021,
      usage_miles: 140010,
      usage_hours: 2600,
      attachments: ['Camera'],
      forklift_attachments: []
    },
    {
      organization_id: orgId,
      asset_tag: 'TRL-501',
      type: 'trailer',
      ownership_type: 'owned',
      status: 'active',
      make: 'Wabash',
      model: 'Duraplate',
      year: 2020,
      usage_miles: 84500,
      usage_hours: 0,
      attachments: [],
      forklift_attachments: []
    },
    {
      organization_id: orgId,
      asset_tag: 'FRK-201',
      type: 'forklift',
      ownership_type: 'leased',
      status: 'active',
      make: 'Toyota',
      model: '8FGCU25',
      year: 2022,
      usage_miles: 0,
      usage_hours: 1120,
      attachments: [],
      forklift_attachments: ['Forks', 'Box Clamp']
    }
  ];

  const equipmentByTag: Record<string, Row> = {};
  for (const equipment of equipmentRows) {
    const row = await upsertByQuery(
      'equipment',
      { organization_id: orgId, asset_tag: equipment.asset_tag },
      equipment
    );
    equipmentByTag[equipment.asset_tag] = row;
  }

  const templates = [
    {
      organization_id: orgId,
      name: 'Class 8 PM - Every 45 Days',
      applies_to_type: 'truck',
      interval_days: 45,
      interval_miles: 15000,
      interval_hours: null
    },
    {
      organization_id: orgId,
      name: 'Trailer Brake and Tire Check',
      applies_to_type: 'trailer',
      interval_days: 60,
      interval_miles: 12000,
      interval_hours: null
    },
    {
      organization_id: orgId,
      name: 'Forklift Safety and Fluids',
      applies_to_type: 'forklift',
      interval_days: 30,
      interval_miles: null,
      interval_hours: 250
    }
  ];

  for (const template of templates) {
    await upsertByQuery(
      'pm_templates',
      { organization_id: orgId, name: template.name },
      template
    );
  }

  const workOrders = [
    {
      organization_id: orgId,
      equipment_id: equipmentByTag['TRK-101']?.id || null,
      title: 'TRK-101 PM service and filter replacement',
      description: 'Scheduled PM with oil/filter replacement and brake check.',
      status: 'In Progress',
      priority: 'Medium',
      approved_by: 'Fleet Manager',
      approved_at: toISODateTime(-2),
      assigned_to: 'Bay 2 Technician',
      due_date: toISODate(2),
      total_parts_cost: 420,
      total_labor_cost: 310,
      total_cost: 730
    },
    {
      organization_id: orgId,
      equipment_id: equipmentByTag['TRK-102']?.id || null,
      title: 'TRK-102 out-of-service brake remediation',
      description: 'Correct OOS brake defect identified in roadside inspection.',
      status: 'Approved',
      priority: 'High',
      approved_by: 'Fleet Manager',
      approved_at: toISODateTime(-1),
      assigned_to: 'Lead Technician',
      due_date: toISODate(1),
      total_parts_cost: 980,
      total_labor_cost: 640,
      total_cost: 1620
    },
    {
      organization_id: orgId,
      equipment_id: equipmentByTag['TRL-501']?.id || null,
      title: 'TRL-501 annual lighting inspection',
      description: 'Completed inspection and marker lamp replacement.',
      status: 'Completed',
      priority: 'Low',
      approved_by: 'Fleet Manager',
      approved_at: toISODateTime(-20),
      assigned_to: 'Bay 1 Technician',
      due_date: toISODate(-17),
      completed_at: toISODateTime(-16),
      total_parts_cost: 140,
      total_labor_cost: 120,
      total_cost: 260
    }
  ];

  for (const wo of workOrders) {
    const row = await upsertByQuery(
      'work_orders',
      { organization_id: orgId, title: wo.title },
      wo
    );

    const { data: existingLineItems, error: lineSelectError } = await supabase
      .from('work_order_line_items')
      .select('id')
      .eq('work_order_id', row.id)
      .limit(1);
    if (lineSelectError) throw lineSelectError;

    if (!existingLineItems || existingLineItems.length === 0) {
      const lineItems = wo.title.includes('brake')
        ? [
            { work_order_id: row.id, type: 'part', description: 'Brake chamber', quantity: 2, unit_cost: 240, total_cost: 480 },
            { work_order_id: row.id, type: 'labor', description: 'Brake system repair labor', quantity: 6, unit_cost: 95, total_cost: 570 }
          ]
        : [
            { work_order_id: row.id, type: 'part', description: 'Oil and filter kit', quantity: 1, unit_cost: 180, total_cost: 180 },
            { work_order_id: row.id, type: 'labor', description: 'PM inspection labor', quantity: 3, unit_cost: 85, total_cost: 255 }
          ];

      const { error: insertLineError } = await supabase
        .from('work_order_line_items')
        .insert(lineItems);
      if (insertLineError) throw insertLineError;
    }
  }
}

async function seedInspectionsAndCompliance(orgId: string, driversByEmployeeId: Record<string, Row>) {
  const mike = driversByEmployeeId['DEMO-DRV-002'];
  const sarah = driversByEmployeeId['DEMO-DRV-001'];
  if (!mike || !sarah) return;

  const inspections = [
    {
      organization_id: orgId,
      date: toISODate(-7),
      report_number: 'DEMO-INSP-1001',
      driver_id: mike.id,
      driver_name: mike.name,
      vehicle_name: 'TRK-102',
      location: 'Reno, NV',
      inspection_level: 'Level I',
      officer_name: 'Officer Keane',
      usdot_number: '3844435',
      violations_data: [
        { code: '393.45', description: 'Brake system defect', type: 'Vehicle', oos: true },
        { code: '395.3', description: 'Hours of service violation', type: 'Driver', oos: false }
      ],
      out_of_service: true,
      defect_count: 2,
      remediation_status: 'Open',
      remediation_due_date: toISODate(-1),
      remediation_notes: 'Awaiting brake parts and second inspection.',
      description: 'Driver: Mike Ross, Vehicle: TRK-102'
    },
    {
      organization_id: orgId,
      date: toISODate(-3),
      report_number: 'DEMO-INSP-1002',
      driver_id: sarah.id,
      driver_name: sarah.name,
      vehicle_name: 'TRK-101',
      location: 'Bakersfield, CA',
      inspection_level: 'Level II',
      officer_name: 'Officer Ramirez',
      usdot_number: '3844435',
      violations_data: [
        { code: '392.2', description: 'Minor documentation issue', type: 'Driver', oos: false }
      ],
      out_of_service: false,
      defect_count: 1,
      remediation_status: 'In Progress',
      remediation_due_date: toISODate(4),
      remediation_notes: 'Driver coaching scheduled.',
      description: 'Driver: Sarah Jenkins, Vehicle: TRK-101'
    }
  ];

  for (const inspection of inspections) {
    await upsertByQuery(
      'inspections',
      { organization_id: orgId, report_number: inspection.report_number },
      inspection
    );
  }
}

async function seedDocuments(orgId: string, driversByEmployeeId: Record<string, Row>) {
  const mike = driversByEmployeeId['DEMO-DRV-002'];
  const docs = [
    {
      organization_id: orgId,
      name: 'Insurance Certificate 2026',
      category: 'Insurance',
      doc_type: 'Certificate',
      file_size: 128044,
      mime_type: 'application/pdf',
      storage_bucket: 'compliance-documents',
      storage_path: `${orgId}/seed/insurance-certificate-2026.pdf`,
      status: 'active',
      metadata: { required: true, expirationDate: toISODate(20), seeded: true }
    },
    {
      organization_id: orgId,
      name: 'Vehicle Registration - Fleet',
      category: 'Registration',
      doc_type: 'Registration',
      file_size: 92011,
      mime_type: 'application/pdf',
      storage_bucket: 'compliance-documents',
      storage_path: `${orgId}/seed/fleet-registration-2026.pdf`,
      status: 'active',
      metadata: { required: true, expirationDate: toISODate(140), seeded: true }
    },
    {
      organization_id: orgId,
      name: 'DOT Audit Binder Cover Sheet',
      category: 'Audit',
      doc_type: 'Reference',
      file_size: 44011,
      mime_type: 'application/pdf',
      storage_bucket: 'compliance-documents',
      storage_path: `${orgId}/seed/dot-audit-binder-cover-sheet.pdf`,
      status: 'active',
      metadata: { seeded: true }
    }
  ];

  for (const doc of docs) {
    await upsertByQuery(
      'documents',
      { organization_id: orgId, storage_path: doc.storage_path },
      doc
    );
  }

  if (mike) {
    const driverDocs = [
      {
        organization_id: orgId,
        driver_id: mike.id,
        name: 'Mike Ross CDL',
        type: 'CDL',
        expiry_date: toISODate(14),
        url: `${orgId}/seed/driver-docs/mike-ross-cdl.pdf`,
        storage_bucket: 'driver-documents',
        storage_path: `${orgId}/seed/driver-docs/mike-ross-cdl.pdf`,
        file_size: 80211,
        mime_type: 'application/pdf'
      },
      {
        organization_id: orgId,
        driver_id: mike.id,
        name: 'Mike Ross Medical Card',
        type: 'Medical Card',
        expiry_date: toISODate(-3),
        url: `${orgId}/seed/driver-docs/mike-ross-medical-card.pdf`,
        storage_bucket: 'driver-documents',
        storage_path: `${orgId}/seed/driver-docs/mike-ross-medical-card.pdf`,
        file_size: 60114,
        mime_type: 'application/pdf'
      }
    ];

    for (const doc of driverDocs) {
      await upsertByQuery(
        'driver_documents',
        { organization_id: orgId, driver_id: doc.driver_id, name: doc.name },
        doc
      );
    }
  }
}

async function seedTraining(orgId: string, driversByEmployeeId: Record<string, Row>) {
  const mike = driversByEmployeeId['DEMO-DRV-002'];
  const david = driversByEmployeeId['DEMO-DRV-003'];
  if (!mike || !david) return;

  const templates = [
    {
      organization_id: orgId,
      name: 'Speed and Space Management',
      talking_points: 'Review following distance discipline, speed adaptation by weather, and high-risk corridor planning.',
      driver_actions: 'Use 6-second following distance, call out hazard zones pre-trip, and avoid aggressive lane changes.'
    },
    {
      organization_id: orgId,
      name: 'HOS Log Accuracy and Planning',
      talking_points: 'Focus on split-sleeper usage, pre-plan rest windows, and prevent end-of-shift violations.',
      driver_actions: 'Plan parking at least 90 minutes before limit, review ELD alerts every stop, and confirm recap hours daily.'
    }
  ];

  const templateRows: Record<string, Row> = {};
  for (const template of templates) {
    const row = await upsertByQuery(
      'training_templates',
      { organization_id: orgId, name: template.name },
      template
    );
    templateRows[template.name] = row;
  }

  const assignments = [
    {
      organization_id: orgId,
      template_id: templateRows['Speed and Space Management']?.id || null,
      module_name: 'Speed and Space Management',
      assignee_id: mike.id,
      due_date: toISODate(5),
      status: 'Active',
      progress: 65,
      completion_notes: null,
      completed_at: null
    },
    {
      organization_id: orgId,
      template_id: templateRows['HOS Log Accuracy and Planning']?.id || null,
      module_name: 'HOS Log Accuracy and Planning',
      assignee_id: mike.id,
      due_date: toISODate(-2),
      status: 'Overdue',
      progress: 40,
      completion_notes: null,
      completed_at: null
    },
    {
      organization_id: orgId,
      template_id: templateRows['Speed and Space Management']?.id || null,
      module_name: 'Speed and Space Management',
      assignee_id: david.id,
      due_date: toISODate(-12),
      status: 'Completed',
      progress: 100,
      completion_notes: 'Completed ride-along assessment with coach.',
      completed_at: toISODateTime(-10),
      completed_by: 'Safety Manager',
      reviewed_at: toISODateTime(-8),
      reviewed_by: 'Fleet Director'
    }
  ];

  for (const assignment of assignments) {
    await upsertByQuery(
      'training_assignments',
      {
        organization_id: orgId,
        assignee_id: assignment.assignee_id,
        module_name: assignment.module_name,
        due_date: assignment.due_date
      },
      assignment
    );
  }
}

async function main() {
  console.log('Seeding demo data...');
  const orgId = await resolveOrganizationId();
  console.log(`Using organization: ${orgId}`);
  console.log('Tip: pass --org-id <uuid> or set DEMO_ORG_ID to target a specific tenant.');

  await ensureSystemOptions();
  const driversByEmployeeId = await seedDrivers(orgId);
  await seedSafety(orgId, driversByEmployeeId);
  await seedCoachingAndTasks(orgId, driversByEmployeeId);
  await seedFleetOperations(orgId);
  await seedInspectionsAndCompliance(orgId, driversByEmployeeId);
  await seedDocuments(orgId, driversByEmployeeId);
  await seedTraining(orgId, driversByEmployeeId);

  console.log('Demo seed complete.');
  console.log('Recommended: refresh pages Drivers, Safety, Tasks, Compliance, Training, Reporting.');
}

main().catch((error) => {
  console.error('Demo seed failed:', error);
  process.exit(1);
});
