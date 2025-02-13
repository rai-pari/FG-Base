import { useEffect, useState } from "react";

const FrameViewer = () => {
  const [latestImage, setLatestImage] = useState<string | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/live-images/"); 

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.image_data) {
        setLatestImage(`data:image/jpeg;base64,${data.image_data}`);
      }
    };

    ws.onclose = () => console.log("WebSocket Disconnected");
    ws.onerror = (err) => console.error("WebSocket Error", err);

    return () => ws.close();
  }, []);

  return (
    <div>
      {latestImage ? (
        <img src={latestImage} alt="Latest Frame" style={{ width: "100%", height: "auto" }} />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default FrameViewer;
