import React, { useEffect, useRef } from "react";
import {
  Camera,
  Brain,
  Cog,
  Database as DatabaseIcon,
  CircleFadingPlus,
} from "lucide-react";
import { useCreateMediaProcessingMutation } from "../store/api/mediaProcessing";
import { useGetDetectionModelsQuery } from "../store/api/detectionModels";
import {
  useGetOutputConfigurationsQuery,
  useUpdateOutputConfigurationsMutation,
} from "../store/api/outputConfigurations";
import Loader from "./common/Loader";
import { DetectionModel } from "../store/models/DetectionModel";
import { useGetProcessingRulesByModelQuery } from "../store/api/processingRules";
import { ProcessingRulesModel } from "../store/models/ProcessingRules";
import MediaFrameSelector from "./insights/MediaFrameSelector";
import { setPreivewUrl as setVideoPreviewUrl } from "../store/api/localData/previewUrl";
import { setDetectionModel } from "../store/api/localData/detectionModel";
import { setIsToggled, setStorageLocation, setOutputFormat, setSaveDetectionImages } from "../store/api/localData/outputConfiguration";
import { addSessionId } from "../store/api/localData/sessionSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/middleware";
import { toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ConfigurationProps {
  selectedIndustry: string;
}

const Configuration: React.FC<ConfigurationProps> = ({ selectedIndustry }) => {
  const [createMutation, { isLoading: createLoading }] = useCreateMediaProcessingMutation();
  const [updateMutation, { isLoading: updateLoading }] = useUpdateOutputConfigurationsMutation();

  const { data: modelRows = [], isLoading: modelLoading } = useGetDetectionModelsQuery(selectedIndustry);

  const {
    data: outputObject = {
      storage: [""],
      format: [""],
      current_output_configurations: ["", ""],
    },
    isLoading: outputLoading,
  } = useGetOutputConfigurationsQuery();

  const dispatch = useDispatch<AppDispatch>();
  const savedPreivewUrl = useSelector((state: RootState) => state.previewUrl.previewUrl);
  const savedDetectionModel = useSelector((state: RootState) => state.detectionModel.selectedModel);
  const savedOutputConfiguration = useSelector((state: RootState) => state.outputConfiguration);

  const [selectedModel, setSelectedModel] = React.useState<string | null>(savedDetectionModel || modelRows[0]?.id);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(savedPreivewUrl || null);
  const [rules, setRules] = React.useState<ProcessingRulesModel[]>([]);
  const [params, setParams] = React.useState<Record<string, boolean>>({});
  const [saveOutput, setSaveOutput] = React.useState<boolean>(savedOutputConfiguration.isToggled || false);
  const [output, setOutput] = React.useState<string[]>(outputObject.current_output_configurations);
  const [isChecked, setIsChecked] = React.useState<boolean>(savedOutputConfiguration.saveDetectionImages || false);
  const [fileInputKey, setFileInputKey] = React.useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null); // Ref to control the file input

  useEffect(() => {
    if (modelRows.length > 0) {
      const firstModelId = modelRows[0].id;
      setSelectedModel(firstModelId);
      dispatch(setDetectionModel(firstModelId));
    }
  }, [modelRows, dispatch]);

  // Reset file input when selectedIndustry becomes empty
  useEffect(() => {
    if (!selectedIndustry || selectedIndustry === "") {
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileInputKey(prev => prev + 1);
      dispatch(setVideoPreviewUrl(null));
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear the input value
      }
    }
  }, [selectedIndustry, dispatch]);

  const { data: rulesByModel, isLoading: rulesByModelLoading } =
    useGetProcessingRulesByModelQuery(
      { industry: selectedIndustry, modelId: selectedModel },
      {
        skip: !selectedIndustry || !selectedModel,
      }
    );

  useEffect(() => {
    if (rulesByModel && rulesByModel.length > 0) {
      setRules(rulesByModel);
      const newParams = rulesByModel.reduce<Record<string, boolean>>((acc, ruleObj) => {
        acc[ruleObj.rule] = false;
        return acc;
      }, {});

      const firstEnabledRule = rulesByModel.find(rule => rule.enabled);
      if (firstEnabledRule) {
        newParams[firstEnabledRule.rule] = true;
      }

      setParams(newParams);
    } else {
      setRules([]);
      setParams({});
    }
  }, [selectedModel, rulesByModel]);

  useEffect(() => {
    return () => {
      dispatch(setVideoPreviewUrl(null));
    };
  }, [dispatch]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedIndustry || selectedIndustry === "") {
      toast.error("Please select an industry first", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileInputKey(prev => prev + 1); // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear the input value
      }
      return;
    }

    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      dispatch(setVideoPreviewUrl(url));
      setPreviewUrl(url);
    }
  };

  const [isUploading, setIsUploading] = React.useState(false);

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedModel(modelRows[0]?.id || "");
    setParams({});
    setOutput(outputObject.current_output_configurations);
    setSaveOutput(false);
    setIsChecked(false);
    setFileInputKey(prev => prev + 1);

    dispatch(setVideoPreviewUrl(null));
    dispatch(setDetectionModel(modelRows[0]?.id || ""));
    dispatch(setIsToggled(false));
    dispatch(setStorageLocation(outputObject.storage[0] || ""));
    dispatch(setOutputFormat(outputObject.format[0] || ""));
    dispatch(setSaveDetectionImages(false));
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the input value
    }
  };

  const toggleRule = (rule: string) => {
    setParams((prevParams) => {
      const newParams = Object.keys(prevParams).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {} as Record<string, boolean>);

      newParams[rule] = true;
      return newParams;
    });
  };

  const handleSubmit = async () => {
    if (isUploading || !selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    const enabledRuleIds = rules
      .filter(rule => params[rule.rule] && rule.enabled)
      .map(rule => rule.id);

    const payload = {
      payload: formData,
      save_output: saveOutput,
      enabled_rule_ids: enabledRuleIds
    };

    try {
      const res = await createMutation(payload);

      if (res.data) {
        const session_id = res.data.session_id;
        const rule_id = res.data.rule_id;
        const current_industry = res.data.industry;

        dispatch(addSessionId({
          sessionId: session_id,
          industry: current_industry,
          ruleId: rule_id,
          videoPath: selectedFile.name
        }));

        toast.success(`Video processing started for session - ${session_id}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        });
        resetForm();
      } else if (res.error && res.error.data && res.error.data.detail) {
        toast.error(res.error.data.detail, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        });
      } else {
        toast.error("Failed to upload video.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        });
      }
    } catch (error) {
      toast.error("Something went wrong while uploading the video.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitOutputConfigurations = (newOutputConfigurations: string[]) => {
    updateMutation(newOutputConfigurations).then((res) => {
      if (res.data) {
        toast.success("Output Configurations updated successfully!", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        });
      } else if (res.error) {
        toast.error("Failed to update Output Configurations.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        });
      }
    });
  };

  React.useEffect(() => {
    if (outputObject?.current_output_configurations) {
      setOutput(outputObject.current_output_configurations);
    }
  }, [outputObject]);

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Media Source Section */}
        <div className="bg-white rounded-lg lg:col-span-2 shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Media Source</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image/Video
              </label>
              <input
                ref={fileInputRef} // Attach ref to the input
                key={fileInputKey}
                type="file"
                accept="image/*,video/*"
                className="w-full border border-gray-300 rounded-lg p-2 cursor-pointer"
                onChange={handleFileChange}
              />
            </div>
            <div className="aspect-[16/9] bg-gray-100 rounded-lg flex items-center justify-center overflow">
              {previewUrl ? (
                selectedFile?.type.startsWith("image") ? (
                  <MediaFrameSelector fileURL={previewUrl} isVideo={false} />
                ) : (
                  <MediaFrameSelector fileURL={previewUrl} isVideo={true} />
                )
              ) : (
                <p className="text-gray-500">Preview</p>
              )}
            </div>
          </div>
        </div>

        {/* Detection Model Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Detection Model</h2>
          </div>
          {!selectedIndustry || selectedIndustry === "" ? (
            <p className="text-gray-500">Please select an industry first</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Model
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={selectedModel || ""}
                  onChange={(e) => {
                    const modelId = e.target.value;
                    setSelectedModel(modelId);
                    dispatch(setDetectionModel(modelId));
                  }}
                >
                  {modelRows
                    .filter((model: DetectionModel) => model.active)
                    .map((model: DetectionModel) => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.accuracy + " accuracy"})
                      </option>
                    ))}
                </select>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Model Information</h3>
                <p className="text-sm text-gray-600">
                  {modelRows.find((m: DetectionModel) => m.id === selectedModel)?.model_info || modelRows[0]?.model_info}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Processing Logic Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cog className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Processing Logic</h2>
          </div>
          {!selectedIndustry || selectedIndustry === "" ? (
            <p className="text-gray-500 h-40">Please select an industry first</p>
          ) : (
            <div className="space-y-4">
              {rulesByModelLoading ? (
                <p>Loading rules...</p>
              ) : (
                rules.map((rule: ProcessingRulesModel) => (
                  <div
                    key={rule.id}
                    className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${!rule.enabled ? "hidden" : ""}`}
                  >
                    <div>
                      <p className="font-medium">{rule.rule}</p>
                      <p className="text-sm text-gray-600">
                        Threshold: {rule.threshold.toFixed(0)}%
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={params[rule.rule]}
                        onClick={() => toggleRule(rule.rule)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Output Configuration Section */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <DatabaseIcon className="w-5 h-5 text-blue-500" />
            <div className="flex justify-between w-[100%]">
              <h2 className="text-lg font-semibold">Output Configuration</h2>
              <div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={saveOutput}
                    onChange={() => {
                      setSaveOutput((prev) => {
                        const newValue = !prev;
                        dispatch(setIsToggled(newValue));
                        return newValue;
                      });
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Location
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={output[0]}
                onChange={(e) => {
                  setOutput((prev) => [e.target.value, prev[1]]);
                  dispatch(setStorageLocation(e.target.value));
                }}
              >
                {outputObject.storage.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output Format
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={output[1]}
                onChange={(e) => {
                  setOutput((prev) => [prev[0], e.target.value]);
                  dispatch(setOutputFormat(e.target.value));
                }}
              >
                {outputObject.format.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="save-images"
                className="rounded"
                checked={isChecked}
                onChange={(e) => {
                  setIsChecked(prev => !prev);
                  dispatch(setSaveDetectionImages(e.target.checked));
                }}
              />
              <label htmlFor="save-images" className="text-sm text-gray-700">
                Save detection images
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="inline-block">
              <div
                className={`flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2 cursor-pointer ${updateLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={!updateLoading ? () => handleSubmitOutputConfigurations(output) : (e) => e.preventDefault()}
              >
                {updateLoading ? (
                  <Loader />
                ) : (
                  <CircleFadingPlus className="w-5 h-5 text-white" />
                )}
                <h2 className="text-lg font-semibold">Set Output Configuration</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Process Video Button */}
        <div className="bg-transparent p-1 lg:col-span-2">
          <div className="flex items-center justify-end">
            <div className="inline-block">
              <div
                className={`flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2 cursor-pointer ${createLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={!createLoading ? handleSubmit : (e) => e.preventDefault()}
              >
                {createLoading ? (
                  <Loader />
                ) : (
                  <CircleFadingPlus className="w-5 h-5 text-white" />
                )}
                <h2 className="text-lg font-semibold">Process Video</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuration;