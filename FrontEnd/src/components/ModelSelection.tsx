import React from "react";
// import { DetectionModel } from '../types';
// import { mockModels } from "../data/mockData";
import { CheckCircle2 } from "lucide-react";
import {
  useGetDetectionModelsQuery,
  useUpdateDetectionModelMutation,
} from "../store/api/detectionModels";
import { DetectionModel } from "../store/models/DetectionModel";
import Loader from "./common/Loader";
// import PageHeader from './common/PageHeader';

const ModelSelection = () => {
  const { data: modelRows = [], isLoading: modelLoading } =
    useGetDetectionModelsQuery();

  const [updateMutation, { isLoading: updateLoading }] =
    useUpdateDetectionModelMutation();

  console.log(modelLoading);

  const [models, setModels] = React.useState<DetectionModel[]>([]);

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

  return (
    <div className="p-6">
      {/* <PageHeader title="Detection Models" /> */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model: DetectionModel) => (
          <div
            key={model.id}
            onClick={() => toggleModel(model.id)}
            className={`cursor-pointer bg-white rounded-lg shadow-md p-6 ${
              model.active ? "ring-2 ring-blue-500" : ""
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
              {/* <CircleFadingPlus className="w-5 h-5 text-white" /> */}
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
