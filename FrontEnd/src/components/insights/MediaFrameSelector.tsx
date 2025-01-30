import React, { useRef, useState, useEffect } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useCreateAreaCoordinatesMutation } from "../../store/api/areaCoordinates";

interface MediaFrameSelectorProps {
  fileURL: string | null;
  isVideo: boolean;
}

const MediaFrameSelector: React.FC<MediaFrameSelectorProps> = ({ fileURL, isVideo }) => {

  const [createCoordinatesMutation, { isLoading }] = useCreateAreaCoordinatesMutation();

  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ unit: "%" | "px"; x: number; y: number; width: number; height: number }>({
    unit: "%",
    x: 25,
    y: 25,
    width: 50,
    height: 50,
  });

  const imgRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cropCoordinates, setCropCoordinates] = useState<any>(null); 
  const [coordinatesSent, setCoordinatesSent] = useState(false); // Track if sent

  useEffect(() => {
    if (fileURL && !isVideo) {
      setCapturedFrame(fileURL); // If it's an image, set it directly
    }
  }, [fileURL, isVideo]);

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        // Ensure the correct video resolution is used
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
  
        // Capture the current video frame onto the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
        // Convert the canvas content to an image data URL
        const frameData = canvas.toDataURL("image/png");
  
        // Update state to display the captured frame
        setCapturedFrame(frameData);
      }
    }
  };
  

  const onCropComplete = (crop: any) => {
    if (crop && imgRef.current) {
      const { x, y, width, height } = crop;
      const topLeft = { x, y };
      const topRight = { x: x + width, y };
      const bottomLeft = { x, y: y + height };
      const bottomRight = { x: x + width, y: y + height };

      const coords = {
        p1: [topLeft.x, topLeft.y],
        p2: [topRight.x, topRight.y],
        p3: [bottomLeft.x, bottomLeft.y],
        p4: [bottomRight.x, bottomRight.y],
      };
      setCropCoordinates(coords); // Save coordinates but don't send yet
    }
  };

  const sendCoordinates = () => {
    if (isLoading || coordinatesSent) return;

    let finalCoordinates = cropCoordinates;

    // If no coordinates were modified, send the default ones
    if (!cropCoordinates) {
      finalCoordinates = {
        p1: [crop.x, crop.y],
        p2: [crop.x + crop.width, crop.y],
        p3: [crop.x, crop.y + crop.height],
        p4: [crop.x + crop.width, crop.y + crop.height],
      };
    }

    console.log("Sending coordinates:", finalCoordinates); // Log before sending
    createCoordinatesMutation(finalCoordinates);
    setCoordinatesSent(true); // Disable button after sending
  };

  return (
    <div className="p-4 flex flex-col items-center w-full">
      <div className="flex flex-col justify-center items-center gap-8 w-full max-w-6xl">
        {isVideo && fileURL && (
          <div className="flex flex-col justify-center items-center w-full max-w-2xl">
          <h2 className="text-xl font-semibold mb-2 self-start">Video Preview:</h2>
          <div className="relative w-full">
            <video
              ref={videoRef}
              src={fileURL}
              controls
              className="h-auto w-full object-contain border rounded-lg"
            />
          </div>
          <button
            onClick={captureFrame}
            className="mt-2 px-4 py-2 text-lg bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Capture Frame
          </button>
        </div>
        
        
        )}
        {capturedFrame && (
          <div className="flex flex-col justify-center items-center w-full">
            <h2 className="text-xl font-semibold mb-2 self-start">Captured Frame:</h2>
            <ReactCrop
              crop={crop}
              onChange={setCrop}
              onComplete={onCropComplete}
              disabled={coordinatesSent} // Disable ReactCrop when coordinates are sent
            >
              <img
                ref={imgRef}
                src={capturedFrame}
                alt="To crop"
                className="w-full h-auto object-contain border rounded-lg"
              />
            </ReactCrop>
            <button 
              onClick={sendCoordinates} 
              className={`mt-2 px-4 py-2 text-lg text-white rounded ${coordinatesSent ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"}`}
              disabled={coordinatesSent}
            >
              {coordinatesSent ? "Region Selected" : isLoading ? "Sending..." : "Confirm Region"}
            </button>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
  
};

export default MediaFrameSelector;
