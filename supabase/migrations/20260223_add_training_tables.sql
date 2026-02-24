-- add training assignments and templates

CREATE TABLE IF NOT EXISTS training_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    talking_points text,
    driver_actions text,
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid REFERENCES training_templates(id) ON DELETE SET NULL,
    module_name text NOT NULL,
    assignee_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
    due_date date,
    status text NOT NULL DEFAULT 'Active', -- Active, Completed, Overdue
    progress integer NOT NULL DEFAULT 0,
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- enable row level security
ALTER TABLE training_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assignments ENABLE ROW LEVEL SECURITY;

-- sample RLS policies
CREATE POLICY "org can read templates" ON training_templates
    FOR SELECT USING (organization_id = current_setting('app.org_id')::uuid);
CREATE POLICY "org can modify templates" ON training_templates
    FOR ALL USING (organization_id = current_setting('app.org_id')::uuid);

CREATE POLICY "org can read assignments" ON training_assignments
    FOR SELECT USING (organization_id = current_setting('app.org_id')::uuid);
CREATE POLICY "org can modify assignments" ON training_assignments
    FOR ALL USING (organization_id = current_setting('app.org_id')::uuid);
