import React, { useRef, useState, useEffect } from "react";
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useCreateAreaCoordinatesMutation } from "../../store/api/areaCoordinates";
 
interface MediaFrameSelectorProps {
  fileURL: string | null;
  isVideo: boolean;
}
 
const MediaFrameSelector: React.FC<MediaFrameSelectorProps> = ({ fileURL, isVideo }) => {
  const [createCoordinatesMutation, { isLoading }] = useCreateAreaCoordinatesMutation();
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    x: 30,
    y: 30,
    width: 25,
    height: 25,
  });
  const [cropCoordinates, setCropCoordinates] = useState<any>(null);
  const [coordinatesSent, setCoordinatesSent] = useState(false);
  const [isRegionConfirmed, setIsRegionConfirmed] = useState(false);
 
  const imgRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confirmedImgRef = useRef<HTMLImageElement | null>(null);
  const cropContainerRef = useRef<HTMLDivElement | null>(null);
  const confirmedContainerRef = useRef<HTMLDivElement | null>(null);
 
  // Store image dimensions to ensure consistent scaling
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
 
  useEffect(() => {
    if (fileURL && !isVideo) {
      setCapturedFrame(fileURL);
    }
  }, [fileURL, isVideo]);
 
  // Ensure all containers have consistent dimensions
  useEffect(() => {
    if (capturedFrame) {
      // Load the image to get its natural dimensions
      const img = new Image();
      img.onload = () => {
        // Calculate dimensions while maintaining aspect ratio
        // Setting a fixed height of 500px (matching container height)
        const containerHeight = 500;
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const calculatedWidth = containerHeight * aspectRatio;
        
        setImageDimensions({
          width: calculatedWidth,
          height: containerHeight
        });
      };
      img.src = capturedFrame;
    }
  }, [capturedFrame]);
 
  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameData = canvas.toDataURL("image/png");
        setCapturedFrame(frameData);
        setIsModalOpen(true);
      }
    }
  };
 
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // We're now using the pre-calculated dimensions from the useEffect
    // so we don't need to get dimensions from the loaded image directly
  };
 
  const onCropComplete = (crop: Crop) => {
    if (crop.width && crop.height && imgRef.current) {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
 
      // Ensure crop stays within bounds
      const x = Math.max(0, crop.x * scaleX);
      const y = Math.max(0, crop.y * scaleY);
      const width = Math.min(image.naturalWidth - x, crop.width * scaleX);
      const height = Math.min(image.naturalHeight - y, crop.height * scaleY);
 
      setCropCoordinates({
        p1: [x, y],
        p2: [x + width, y],
        p3: [x, y + height],
        p4: [x + width, y + height],
      });
    }
  };
 
  const sendCoordinates = () => {
    if (isLoading || coordinatesSent) return;
 
    createCoordinatesMutation(cropCoordinates);
    setCoordinatesSent(true);
    setIsRegionConfirmed(true);
    setIsModalOpen(false);
  };
 
  return (
    <div className="p-4 flex flex-col items-center w-full">
      <div className="flex justify-center items-center gap-8 w-full max-w-6xl">
        {isVideo && fileURL && (
          <div className="flex flex-col justify-center items-center w-full max-w-md">
            <h2 className="text-xl font-semibold mb-2 self-start">Video Preview:</h2>
            <div className="w-full bg-gray-100 border rounded-lg overflow-hidden h-[500px] flex items-center justify-center">
              <video ref={videoRef} src={fileURL} controls className="w-full h-full object-cover" />
            </div>
            {!isRegionConfirmed && (
              <button
                onClick={captureFrame}
                className="mt-2 px-4 py-2 text-lg bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Capture Frame
              </button>
            )}
          </div>
        )}
 
        {capturedFrame && !isRegionConfirmed && (
          <div className="flex flex-col justify-center items-center w-full max-w-md">
            <h2 className="text-xl font-semibold mb-2 self-start">Captured Frame:</h2>
            <div className="w-full bg-gray-100 border rounded-lg overflow-hidden h-[500px] flex items-center justify-center">
              <div 
                style={{
                  width: imageDimensions.width,
                  height: imageDimensions.height,
                  position: "relative"
                }}
              >
                <img 
                  src={capturedFrame} 
                  alt="Captured" 
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain"
                  }}
                />
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 px-4 py-2 text-lg bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Select Region
            </button>
          </div>
        )}
 
        {isRegionConfirmed && capturedFrame && (
          <div className="flex flex-col justify-center items-center w-full max-w-md">
            <h2 className="text-xl font-semibold mb-2 self-start">Region Confirmed:</h2>
            <div className="w-full bg-gray-100 border rounded-lg overflow-hidden h-[500px] flex items-center justify-center">
              <div 
                ref={confirmedContainerRef} 
                className="relative"
                style={{
                  width: imageDimensions.width,
                  height: imageDimensions.height,
                  overflow: "hidden"
                }}
              >
                <ReactCrop 
                  crop={crop} 
                  onChange={() => {}} 
                  disabled={true}
                >
                  <img 
                    ref={confirmedImgRef} 
                    src={capturedFrame} 
                    alt="Confirmed region" 
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain"
                    }}
                  />
                </ReactCrop>
              </div>
            </div>
          </div>
        )}
      </div>
 
      <canvas ref={canvasRef} style={{ display: "none" }} />
 
      {isModalOpen && !isRegionConfirmed && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full overflow-auto">
            <h2 className="text-xl font-semibold mb-4">Select Region</h2>
            <div 
              ref={cropContainerRef} 
              className="flex justify-center items-center"
            >
              <div
                style={{
                  width: imageDimensions.width,
                  height: imageDimensions.height,
                  position: "relative"
                }}
              >
                <ReactCrop 
                  crop={crop} 
                  onChange={setCrop} 
                  onComplete={onCropComplete} 
                  disabled={coordinatesSent}
                >
                  <img 
                    ref={imgRef} 
                    src={capturedFrame!} 
                    alt="To crop" 
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain"
                    }}
                    onLoad={handleImageLoad}
                  />
                </ReactCrop>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Cancel
              </button>
              <button
                onClick={sendCoordinates}
                className={`px-4 py-2 text-white rounded ${coordinatesSent ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"}`}
                disabled={coordinatesSent}
              >
                {coordinatesSent ? "Region Selected" : isLoading ? "Sending..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default MediaFrameSelector;