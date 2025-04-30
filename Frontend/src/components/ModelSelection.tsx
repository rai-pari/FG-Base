import React, { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  useGetDetectionModelsQuery,
  useUpdateDetectionModelMutation,
} from "../store/api/detectionModels";
import { DetectionModel } from "../store/models/DetectionModel";
import Loader from "./common/Loader";

interface ModelSelectionProps {
  selectedIndustry: string;
}

const ModelSelection: React.FC<ModelSelectionProps> = ({ selectedIndustry }) => {
  const { data: modelRows = [], isLoading: modelLoading } = useGetDetectionModelsQuery(selectedIndustry);
  const [updateMutation, { isLoading: updateLoading }] = useUpdateDetectionModelMutation();

  const [models, setModels] = React.useState<DetectionModel[]>([]);

  useEffect(() => {
    // This will automatically refetch the models when selectedIndustry changes
  }, [selectedIndustry]);

  // Set models when data is available and models array is empty
  if (modelRows.length > 0 && models.length === 0) {
    setModels(modelRows);
  }

  const toggleModel = (id: string) => {
    setModels(
      models.map((model: DetectionModel) =>
        model.id === id ? { ...model, active: !model.active } : model
      )
    );
  };

  const handleSubmit = (newModels: DetectionModel[]) => {
    updateMutation(newModels).then((res) => {
      console.log(res);
      if (res.data) {
        console.log(res.data);
        alert("Models updated successfully!");
      } else if (res.error) {
        console.error(res.error);
        alert("Failed to update models.");
      }
    });
  };

  if (!selectedIndustry || selectedIndustry === "") {
    return (
      <div className="flex justify-center items-start  p-6">
        <div className="bg-white rounded-xl shadow-md px-6 py-4 mt-4">
          <p className="text-gray-700 ">
            Please select an industry first to access detection model.
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model: DetectionModel) => (
          <div
            key={model.id}
            onClick={() => toggleModel(model.id)}
            className={`cursor-pointer bg-white rounded-lg shadow-md p-6 ${model.active ? "ring-2 ring-blue-500" : ""
              }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{model.name}</h3>
                <p className="text-gray-600 mt-1">{model.model_info}</p>
              </div>
              {model.active && (
                <CheckCircle2 className="w-6 h-6 text-blue-500" />
              )}
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Accuracy:</span>
                <span className="text-sm font-semibold">
                  {model.accuracy + " accuracy"}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-600">Type:</span>
                <span className="text-sm font-semibold capitalize">
                  {model.type}
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
              onClick={() => handleSubmit(models)}
            >
              {updateLoading && <Loader />}
              <h2 className="text-lg font-semibold">Update Models</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSelection;