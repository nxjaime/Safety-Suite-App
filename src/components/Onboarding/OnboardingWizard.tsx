import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Users, Truck, BellRing, Settings2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { onboardingService, type OnboardingStepId } from '../../services/onboardingService';
import { orgManagementService } from '../../services/orgManagementService';
import { driverService } from '../../services/driverService';
import { equipmentService } from '../../services/equipmentService';
import { notificationRulesService } from '../../services/notificationRulesService';
import type { NotificationRuleType } from '../../services/notificationRulesService';

const STEPS: Array<{ id: OnboardingStepId; title: string; description: string; icon: React.ComponentType<any> }> = [
  { id: 'org_config', title: 'Configure org settings', description: 'Set timezone, retention, and contact details.', icon: Settings2 },
  { id: 'invite_users', title: 'Invite users', description: 'Capture the first admin and manager invite list.', icon: Users },
  { id: 'add_asset', title: 'Add first asset', description: 'Import the first vehicle or equipment record.', icon: Truck },
  { id: 'add_driver', title: 'Add first driver', description: 'Import the first driver roster row.', icon: ShieldCheck },
  { id: 'configure_notifications', title: 'Configure notifications', description: 'Create a safety or compliance alert rule.', icon: BellRing },
];

const parseCsv = (text: string) => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [] as string[][];
  return lines.map((line) => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')));
};

const OnboardingWizard: React.FC = () => {
  const { role } = useAuth();
  const [visible, setVisible] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<OnboardingStepId[]>([]);
  const [orgName, setOrgName] = useState('');
  const [inviteEmails, setInviteEmails] = useState('');
  const [assetCsv, setAssetCsv] = useState('asset_tag,type,status\nTRK-100,truck,active');
  const [driverCsv, setDriverCsv] = useState('name,email,status\nAvery Jones,avery@example.com,Active');
  const [ruleName, setRuleName] = useState('High risk score');

  const completion = useMemo(() => ({ total: STEPS.length, complete: completedSteps.length }), [completedSteps]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const snapshot = await onboardingService.getCompletionSnapshot();
      if (!cancelled) {
        setCompletedSteps(snapshot.progress.completedSteps);
        setVisible(snapshot.completedCount < snapshot.totalSteps && role !== 'platform_admin');
      }
    })();
    return () => { cancelled = true; };
  }, [role]);

  if (!visible) return null;

  const completeStep = async (step: OnboardingStepId) => {
    const progress = await onboardingService.completeStep(step);
    setCompletedSteps(progress.completedSteps);
    toast.success('Onboarding step saved');
    if (progress.completedSteps.length >= STEPS.length) setVisible(false);
  };

  const importAssets = async () => {
    const rows = parseCsv(assetCsv);
    const [, ...dataRows] = rows;
    for (const row of dataRows) {
      const [assetTag, type, status] = row;
      if (assetTag && type) await equipmentService.createEquipment({ assetTag, type, status: (status || 'active') as any });
    }
    await completeStep('add_asset');
  };

  const importDrivers = async () => {
    const rows = parseCsv(driverCsv);
    const [, ...dataRows] = rows;
    const drivers = dataRows.filter((row) => row[0]).map((row) => ({ name: row[0], email: row[1] || '', status: row[2] || 'Active' }));
    if (drivers.length) await driverService.createDriversBulk(drivers as any);
    await completeStep('add_driver');
  };

  const saveOrg = async () => {
    await orgManagementService.saveOrgConfig('full', { companyName: orgName || 'New Org' });
    await completeStep('org_config');
  };

  const saveNotifications = async () => {
    await notificationRulesService.createRule('full', { type: 'risk_score' as NotificationRuleType, threshold: 75, active: true });
    await completeStep('configure_notifications');
  };

  return (
    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm" data-testid="onboarding-wizard">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Customer onboarding wizard</h3>
          <p className="text-sm text-slate-600">{completion.complete}/{completion.total} steps complete. Finish setup to unlock the org.</p>
        </div>
        <button className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-700" onClick={() => setVisible(false)}>Dismiss</button>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const done = completedSteps.includes(step.id);
          return (
            <div key={step.id} className={`rounded-xl border p-4 ${done ? 'border-emerald-300 bg-white' : 'border-slate-200 bg-white/80'}`}>
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-slate-900">{step.title}</h4>
                    {done && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                  </div>
                  <p className="text-sm text-slate-600">{step.description}</p>
                </div>
              </div>
              {step.id === 'org_config' && <div className="mt-3 flex gap-2"><input className="w-full rounded-lg border px-3 py-2 text-sm" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Organization name" /><button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white" onClick={saveOrg}>Save</button></div>}
              {step.id === 'invite_users' && <div className="mt-3 space-y-2"><textarea className="h-20 w-full rounded-lg border px-3 py-2 text-sm" value={inviteEmails} onChange={(e) => setInviteEmails(e.target.value)} placeholder="one email per line" /><button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white" onClick={() => completeStep('invite_users')}>Mark invited</button></div>}
              {step.id === 'add_asset' && <div className="mt-3 space-y-2"><textarea className="h-20 w-full rounded-lg border px-3 py-2 text-sm" value={assetCsv} onChange={(e) => setAssetCsv(e.target.value)} /><button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white" onClick={importAssets}>Import assets</button></div>}
              {step.id === 'add_driver' && <div className="mt-3 space-y-2"><textarea className="h-20 w-full rounded-lg border px-3 py-2 text-sm" value={driverCsv} onChange={(e) => setDriverCsv(e.target.value)} /><button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white" onClick={importDrivers}>Import drivers</button></div>}
              {step.id === 'configure_notifications' && <div className="mt-3 flex gap-2"><input className="w-full rounded-lg border px-3 py-2 text-sm" value={ruleName} onChange={(e) => setRuleName(e.target.value)} /><button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white" onClick={saveNotifications}>Create rule</button></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingWizard;
