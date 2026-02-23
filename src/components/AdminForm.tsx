import React from 'react';
import { adminSchemas } from '../services/adminSchemas';
import type { FieldType } from '../services/adminSchemas';

interface AdminFormProps {
  data: Record<string, any>;
  onChange: (newData: Record<string, any>) => void;
  table?: string;
}

export const AdminForm: React.FC<AdminFormProps> = ({ data, onChange, table }) => {
  const handleFieldChange = (key: string, value: any) => {
    onChange({ ...data, [key]: value });
  };

  const renderInput = (key: string, value: any) => {
    const schema = table ? adminSchemas[table] : undefined;
    const type: FieldType = schema?.[key] || 'string';

    switch (type) {
      case 'number':
        return (
          <input
            type="number"
            value={value as number || ''}
            onChange={(e) => handleFieldChange(key, e.target.valueAsNumber)}
            className="flex-grow border border-slate-300 rounded px-2 py-1 text-xs"
          />
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => handleFieldChange(key, e.target.checked)}
            className="h-4 w-4"
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value as string || ''}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            className="flex-grow border border-slate-300 rounded px-2 py-1 text-xs"
          />
        );
      case 'text':
        return (
          <textarea
            value={value as string || ''}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            className="flex-grow border border-slate-300 rounded px-2 py-1 text-xs"
          />
        );
      default:
        return (
          <input
            type="text"
            value={value as string || ''}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            className="flex-grow border border-slate-300 rounded px-2 py-1 text-xs"
          />
        );
    }
  };

  const addField = () => {
    const key = prompt('Enter field name');
    if (key && !(key in data)) {
      onChange({ ...data, [key]: '' });
    }
  };

  const removeField = (key: string) => {
    const { [key]: _, ...rest } = data;
    onChange(rest);
  };

  return (
    <div className="space-y-2">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <input
            type="text"
            value={key}
            readOnly
            className="flex-shrink-0 w-24 border border-slate-300 rounded px-2 py-1 text-xs bg-slate-100"
          />
          {renderInput(key, value)}
          <button
            onClick={() => removeField(key)}
            className="text-rose-600 hover:text-rose-700"
            type="button"
          >
            ×
          </button>
        </div>
      ))}
      <button onClick={addField} type="button" className="text-slate-600 underline text-xs">
        + add field
      </button>
    </div>
  );
};

export default AdminForm;
