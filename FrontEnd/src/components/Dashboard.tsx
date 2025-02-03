import React from "react";
import {
  Camera,
  Brain,
  Cog,
  Database as DatabaseIcon,
  BarChart,
  CircleFadingPlus,
} from "lucide-react";
// import {
//   mockCameras,
//   mockModels,
//   mockRules,
// } from "../data/mockData";
import { useCreateMediaProcessingMutation } from "../store/api/mediaProcessing";
import { useGetDetectionModelsQuery } from "../store/api/detectionModels";
import {
  useGetOutputConfigurationsQuery,
  useUpdateOutputConfigurationsMutation,
} from "../store/api/outputConfigurations";
import Loader from "./common/Loader";
import { DetectionModel } from "../store/models/DetectionModel";
import { useGetProcessingRulesQuery } from "../store/api/processingRules";
import { ProcessingRulesModel } from "../store/models/ProcessingRules";
// import Backdrop from "./common/Backdrop";
// import PageHeader from "./common/PageHeader";
import MediaFrameSelector from "./insights/MediaFrameSelector";

const Dashboard = () => {
  // const [selectedCamera, setSelectedCamera] = React.useState(
  //   mockCameras[0]?.id
  // );

  // const { data: rows = [], isLoading } = useGetMediaProcessingQuery();
  const [createMutation, { isLoading: createLoading }] =
    useCreateMediaProcessingMutation();
  
  const [updateMutation, { isLoading: updateLoading }] =
    useUpdateOutputConfigurationsMutation();
  const { data: modelRows = [], isLoading: modelLoading } =
    useGetDetectionModelsQuery();
  const {
    data: outputObject = {
      storage: [""],
      format: [""],
      current_output_configurations: ["", ""],
    },
    isLoading: outputLoading,
  } = useGetOutputConfigurationsQuery();
  const { data: ruleRows = [], isLoading: rulesLoading } =
    useGetProcessingRulesQuery();

  const [selectedModel, setSelectedModel] = React.useState(modelRows[0]?.name);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [peopleCount, setPeopleCount] = React.useState<number | null>(null);
  const [durationRate, setDurationRate] = React.useState<number | null>(null);
  const [rules, setRules] = React.useState<ProcessingRulesModel[]>([]);
  const [params, setParams] = React.useState<Record<string, boolean>>({});
  const [saveOutput, setSaveOutput] = React.useState<boolean>(false);
  const [output, setOutput] = React.useState<string[]>(
    outputObject.current_output_configurations
  );

  if (ruleRows.length > 0 && rules.length === 0) {
    const newParams = ruleRows.reduce<Record<string, boolean>>(
      (acc, ruleObj) => {
        if (ruleObj.enabled) {
          acc[ruleObj.rule] = true;
        }
        return acc;
      },
      {}
    );

    setParams(newParams);
    setRules(ruleRows);
  };

  React.useEffect(() => {
    const savedFile = localStorage.getItem('selectedFile');
    const savedPreviewUrl = localStorage.getItem('previewUrl');
  
    if (savedFile && savedPreviewUrl) {
      // Creating a File from Blob with necessary attributes
      setSelectedFile(new File([savedFile], 'filename.mp4', { type: 'video/mp4' }));
      setPreviewUrl(savedPreviewUrl);
    }
  }, []);
  

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Save to localStorage
      localStorage.setItem('selectedFile', file.name); // or you could use `file` data depending on the need
      localStorage.setItem('previewUrl', url);
    }
  };

  const handleSubmit = () => {
    // if (!selectedFile) {
    //   console.error("No file selected");
    //   return;
    // }

    const formData = new FormData();
    selectedFile && formData.append("file", selectedFile);
    // formData.append("model_id", selectedModel);

    createMutation({ payload: formData, save_output: saveOutput }).then(
      (res) => {
        console.log(res);

        if (res.data) {
          console.log(res.data);
          const { output_video_path, people_count, duration_rate } = res.data;
          console.log(output_video_path);
          setPeopleCount(people_count);
          setDurationRate(duration_rate);
          alert("Video processed successfully!");
        } else if (res.error) {
          console.error(res.error);
          alert("Failed to upload video.");
        }
      }
    );
  };

  const handleSubmitOutputConfigurations = (
    newOutputConfigurations: string[]
  ) => {
    updateMutation(newOutputConfigurations).then((res) => {
      console.log(res);

      if (res.data) {
        console.log(res.data);
        alert("Output Configurations updated successfully!");
      } else if (res.error) {
        console.error(res.error);
        alert("Failed to update Output Configurations.");
      }
    });
  };

  const toggleRule = (rule: string) => {
    setParams((params) => ({ ...params, [rule]: !params[rule] }));
  };

  React.useEffect(() => {
    if (outputObject?.current_output_configurations) {
      setOutput(outputObject.current_output_configurations);
    }
  }, []);

  return (
    <div className="p-6">
      {/* <PageHeader title="Dashboard" /> */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Analytics Preview */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BarChart className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Analytics Preview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Person Count</h3>
              <p className="text-2xl font-bold text-red-600">
                {peopleCount || "N/A"}
              </p>
            </div>
            {/* <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Detection Rate</h3>
              <p className="text-2xl font-bold text-blue-600">24.5/min</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Average Confidence</h3>
              <p className="text-2xl font-bold text-green-600">92.3%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Processing Time</h3>
              <p className="text-2xl font-bold text-purple-600">45ms</p>
            </div> */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Duration Rate</h3>
              <p className="text-2xl font-bold text-green-600">
                {durationRate || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Video Source Configuration */}
        <div className="bg-white rounded-lg lg:col-span-2 shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Media Source </h2>
          </div>

          <div className="space-y-4">
            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image/Video{" "}
                {createLoading && (
                  <span className="text-red-500">(Processing...)</span>
                )}
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                className="w-full border border-gray-300 rounded-lg p-2"
                onChange={handleFileChange}
              />
            </div>

            {/* Preview Area */}
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

        {/* special backdrop for only detection model as their is API implemented here */}

        {/* Detection Model Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Detection Model</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Model
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
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
                {modelRows.find((m: DetectionModel) => m.id === selectedModel)
                  ?.model_info || modelRows[0]?.model_info}
              </p>
            </div>
          </div>
        </div>

        {/* Processing Logic Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cog className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Processing Logic</h2>
          </div>
          <div className="space-y-4">
            {rules.map((rule: ProcessingRulesModel) => (
              <div
                key={rule.id}
                className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${
                  !rule.enabled ? "hidden" : ""
                }`}
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
                    // readOnly
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Output Configuration */}
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
                    onClick={() => setSaveOutput((prev) => !prev)}
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
                onChange={(e) => setOutput((prev) => [e.target.value, prev[1]])}
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
                onChange={(e) => setOutput((prev) => [prev[0], e.target.value])}
              >
                {outputObject.format.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="save-images" className="rounded" />
              <label htmlFor="save-images" className="text-sm text-gray-700">
                Save detection images
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="inline-block">
              <div
                className={`flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2 cursor-pointer ${
                  updateLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={
                  !updateLoading
                    ? () => handleSubmitOutputConfigurations(output)
                    : (e) => e.preventDefault()
                }
              >
                {updateLoading ? (
                  <Loader />
                ) : (
                  <CircleFadingPlus className="w-5 h-5 text-white" />
                )}
                <h2 className="text-lg font-semibold">
                  Set Output Configuration
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Process Button */}
        <div className="bg-transparent p-1 lg:col-span-2">
          <div className="flex items-center justify-end">
            <div className="inline-block">
              <div
                className={`flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2 cursor-pointer ${
                  createLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={
                  !createLoading ? handleSubmit : (e) => e.preventDefault()
                }
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

      {/* <Backdrop open={createLoading} /> */}
    </div>
  );
};

export default Dashboard;
