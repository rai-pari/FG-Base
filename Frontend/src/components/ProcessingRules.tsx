import React, { useEffect } from "react";
import {
  useGetProcessingRulesQuery,
  useUpdateProcessingRuleMutation,
} from "../store/api/processingRules";
import { ProcessingRulesModel } from "../store/models/ProcessingRules";
import Loader from "./common/Loader";

const ProcessingRules = ({ selectedIndustry }) => {
  const { data: ruleRows = [], isLoading: rulesLoading } = useGetProcessingRulesQuery(selectedIndustry);
  const [updateMutation, { isLoading: updateLoading }] = useUpdateProcessingRuleMutation();

  const [rules, setRules] = React.useState<ProcessingRulesModel[]>([]);

  // Fetch rules whenever selectedIndustry changes
  useEffect(() => {
    // This will automatically refetch the rules when selectedIndustry changes
  }, [selectedIndustry]);

  // Set rules when data is available and rules array is empty
  if (ruleRows.length > 0 && rules.length === 0) {
    setRules(ruleRows);
  }

  const toggleRule = (id: string) => {
    setRules(
      rules.map((rule: ProcessingRulesModel) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const handleSubmit = (newRules: ProcessingRulesModel[]) => {
    updateMutation(newRules).then((res) => {
      console.log(res);
      if (res.data) {
        console.log(res.data);
        alert("Rules updated successfully!");
      } else if (res.error) {
        console.error(res.error);
        alert("Failed to update rules.");
      }
    });
  };

  if (!selectedIndustry || selectedIndustry === "") {
    return (
      <div className="flex justify-center items-start  p-6">
        <div className="bg-white rounded-xl shadow-md px-6 py-4 mt-4">
          <p className="text-gray-700 ">
            Please select an industry first to access processing rules.
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="p-6">
      <div className="space-y-4">
        {rules.map((rule: ProcessingRulesModel) => (
          <div key={rule.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{rule.rule}</h3>
                <p className="text-gray-600">Type: {rule.type}</p>
              </div>
              <button
                onClick={() => toggleRule(rule.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rule.enabled ? "bg-blue-600" : "bg-gray-200"
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rule.enabled ? "translate-x-6" : "translate-x-1"
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
                  value={rule.threshold}
                  className="w-full"
                  onChange={(e) => {
                    const newThreshold = parseInt(e.target.value);
                    setRules(
                      rules.map((r) =>
                        r.id === rule.id ? { ...r, threshold: newThreshold } : r
                      )
                    );
                  }}
                />
                <span className="text-sm font-semibold w-16">
                  {rule.threshold.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-transparent p-1 mt-2 lg:col-span-2">
        <div className="flex items-center justify-end">
          <div className="inline-block">
            <div
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2 cursor-pointer"
              onClick={() => handleSubmit(rules)}
            >
              {updateLoading && <Loader />}
              <h2 className="text-lg font-semibold">Update Rules</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingRules;