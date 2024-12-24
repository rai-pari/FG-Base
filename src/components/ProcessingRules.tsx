import React from 'react';
import { ProcessingRule } from '../types';
import { mockRules } from '../data/mockData';
import PageHeader from './common/PageHeader';

const ProcessingRules = () => {
  const [rules, setRules] = React.useState<ProcessingRule[]>(mockRules);

  const toggleRule = (id: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  return (
    <div className="p-6">
      <PageHeader title="Processing Rules" />
      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{rule.name}</h3>
                <p className="text-gray-600">Type: {rule.type}</p>
              </div>
              <button
                onClick={() => toggleRule(rule.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  rule.enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    rule.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="mt-4">
              <label className="text-sm text-gray-600">Threshold</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rule.threshold * 100}
                  className="w-full"
                  onChange={(e) => {
                    const newThreshold = parseInt(e.target.value) / 100;
                    setRules(rules.map(r =>
                      r.id === rule.id ? { ...r, threshold: newThreshold } : r
                    ));
                  }}
                />
                <span className="text-sm font-semibold w-16">
                  {(rule.threshold * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessingRules;