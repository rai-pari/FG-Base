import React, { useEffect, useState, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { updateSessionData } from "../store/api/localData/sessionSlice";  
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { throttle } from "lodash"; // Add this import

// Memoized chart component for better performance
const LiveDataChart = React.memo(({ 
  title, 
  color, 
  data,
  chartType
}: { 
  title: string; 
  color: string; 
  data: { name: string; data: { x: number; y: number }[] }; 
  chartType: string;
}) => {
  const options = useMemo((): ApexOptions => ({
    chart: { 
      type: "area", 
      zoom: { enabled: false }, // Disable zoom for performance
      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: {
          speed: 300 // Faster animations
        }
      },
      redrawOnWindowResize: false
    },
    xaxis: { 
      type: "numeric", 
      title: { text: "Frame Number" },
      tickAmount: 5, // Fewer ticks
      labels: {
        formatter: (val) => Math.round(val).toString()
      }
    },
    yaxis: { title: { text: title } },
    stroke: { curve: "straight", width: 2 }, // Straight lines are faster to render
    colors: [color],
    tooltip: {
      enabled: true, // Keep tooltips for UX
      shared: true,
      intersect: false,
      x: {
        formatter: (val) => `Frame: ${Math.round(val)}`
      }
    },
    grid: {
      borderColor: '#f1f1f1',
      row: {
        colors: ['transparent', 'transparent'],
        opacity: 0.5
      }
    },
    markers: {
      size: 2, // Increase marker size
      strokeColors: "#ffffff",
      colors: ["#ff0000"], 
      strokeWidth: 2,
      hover: {
        size: 5 // Enlarge marker on hover
      }
    },
    dataLabels: {
      enabled: true, // Enable data labels
      style: {
        fontSize: "12px",
        colors: ["#ff0000"]
      },
      background: {
        enabled: true,
        borderRadius: 3,
        padding: 4,
        borderWidth: 1,
        borderColor: "#ccc"
      }
    }
  }), [title, color]);
  
  

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h3 className="text-md font-semibold text-red-700">{title}</h3>
      <ReactApexChart
        options={options}
        series={[data]}
        type="area"
        height={250}
        width="100%"
      />
    </div>
  );
});

// Memoized session card component
const SessionCard = React.memo(({ 
  sessionId, 
  isOpen, 
  onToggle, 
  sessionData 
}: { 
  sessionId: string; 
  isOpen: boolean; 
  onToggle: () => void; 
  sessionData: any;
}) => {
  const results = sessionData.results?.[0] || {};
  const frames = sessionData.frames || [];
  const liveData = sessionData.liveData || [
    { name: "Persons Count", data: [] }, 
    { name: "Total Dwell Time", data: [] }
  ];
  
  // Sort the data points by x value (frame number) to ensure proper display
  const sortedLiveData = useMemo(() => liveData.map(series => ({
    ...series,
    data: [...series.data].sort((a, b) => a.x - b.x)
  })), [liveData]);

  return (
    <div className="bg-white rounded-lg shadow-md mb-4">
      <div
        className="flex justify-between items-center bg-red-500 text-white p-4 cursor-pointer w-full"
        onClick={onToggle}
      >
        <h2 className="text-lg font-semibold">Session ID: {sessionId}</h2>
        <span className="text-xl">{isOpen ? "▲" : "▼"}</span>
      </div>

      {isOpen && (
        <div className="p-4 flex flex-col gap-4">
          {Object.keys(results).length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-md shadow flex flex-col items-center justify-center border border-red-500">
                <h3 className="text-md font-semibold text-red-600">Total People Count</h3>
                <p className="text-xl font-bold text-red-700">
                  {results.person_count || 0}
                </p>
              </div>

              <div className="p-4 bg-white rounded-md shadow flex flex-col items-center justify-center border border-red-500">
                <h3 className="text-md font-semibold text-red-600">Total Dwell Time</h3>
                <p className="text-xl font-bold text-red-700">
                  {results.total_dwell_time?.toFixed(2) || "0.00"} sec
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {frames.length > 0 && (
              <div className="p-4 bg-white shadow-md rounded-lg flex items-center justify-center">
                <img
                  src={frames[frames.length - 1]?.frame} // Show latest frame
                  alt="Current Frame"
                  className="w-full rounded-lg shadow-md"
                />
              </div>
            )}

            <div className="flex flex-col gap-4">
              {sortedLiveData[0]?.data.length > 0 && (
                <LiveDataChart 
                  title="Person Count Over Time" 
                  color="#ff7567" 
                  data={sortedLiveData[0]}
                  chartType="area"
                />
              )}

              {sortedLiveData[1]?.data.length > 0 && (
                <LiveDataChart 
                  title="Total Dwell Time Over Time" 
                  color="#ff0000" 
                  data={sortedLiveData[1]}
                  chartType="area"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});


const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const sessionIds = useSelector((state: RootState) => state.session.sessionIds);
  const sessionData = useSelector((state: RootState) => state.session.sessionData);
  const [openSessions, setOpenSessions] = useState<{ [key: string]: boolean }>({});
  
  const loadedSessions = useRef<Set<string>>(new Set());
  const completedSessions = useRef<Set<string>>(new Set()); // Tracks completed sessions
  const frameTrackers = useRef<{ [key: string]: number }>({});
  const wsRefs = useRef<{ [key: string]: WebSocket }>({});
  const sseRefs = useRef<{ [key: string]: EventSource }>({});
  
  const dataBuffer = useRef<{ 
    [sessionId: string]: { 
      liveData: { [seriesName: string]: { x: number; y: number }[] }
    } 
  }>({});

  const throttledDispatch = useRef(
    throttle((sessionId: string) => {
      const buffer = dataBuffer.current[sessionId];
      if (!buffer) return;
      
      const liveDataUpdate = Object.keys(buffer.liveData).map(name => ({
        name,
        data: buffer.liveData[name]
      }));
      
      dispatch(updateSessionData({
        sessionId,
        data: { liveData: liveDataUpdate }
      }));
      
      dataBuffer.current[sessionId] = { liveData: {} };
    }, 500)
  ).current;

  const bufferLiveData = (sessionId: string, seriesName: string, point: { x: number; y: number }) => {
    if (!dataBuffer.current[sessionId]) {
      dataBuffer.current[sessionId] = { liveData: {} };
    }
    if (!dataBuffer.current[sessionId].liveData[seriesName]) {
      dataBuffer.current[sessionId].liveData[seriesName] = [];
    }
    
    dataBuffer.current[sessionId].liveData[seriesName].push(point);
    throttledDispatch(sessionId);
  };

  const toggleSession = (sessionId: string) => {
    setOpenSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  const connectToFrameWebSocket = (sessionId: string) => {
    if (completedSessions.current.has(sessionId)) return; // Skip if session is complete

    if (wsRefs.current[sessionId]) {
      try { wsRefs.current[sessionId].close(); } catch (e) { console.log("Error closing WebSocket:", e); }
    }

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/stream-frames/${sessionId}`);
    wsRefs.current[sessionId] = ws;

    ws.onopen = () => {
      console.log(`WebSocket connected for session: ${sessionId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.frame) {
          dispatch(updateSessionData({
            sessionId,
            data: { frames: [{ frame: `data:image/jpeg;base64,${data.frame}` }] },
          }));
        } 
        
        if (data.message === "live frames completed") {
          console.log(`Closing frame WebSocket for ${sessionId} as processing is completed.`);
          completedSessions.current.add(sessionId);
          ws.close();
        }
      } catch (error) {
        console.error("Error parsing frame data:", error);
      }
    };

    ws.onclose = (event) => {
      console.log(`WebSocket closed for session ${sessionId}, code: ${event.code}`);
      if (!event.wasClean && !completedSessions.current.has(sessionId)) {
        console.log(`Reconnecting WebSocket for ${sessionId}...`);
        setTimeout(() => connectToFrameWebSocket(sessionId), 2000);
      }
    };

    ws.onerror = () => ws.close();
  };

  useEffect(() => {
    sessionIds.forEach(sessionId => {
      if (!loadedSessions.current.has(sessionId)) {
        listenForResults(sessionId);
        listenForLiveData(sessionId);
        connectToFrameWebSocket(sessionId);

        frameTrackers.current[sessionId] = -1;
        dataBuffer.current[sessionId] = { liveData: {} };
        loadedSessions.current.add(sessionId);
      }
    });

    return () => {
      throttledDispatch.cancel();
      Object.values(wsRefs.current).forEach(ws => ws?.close());
      Object.values(sseRefs.current).forEach(sse => sse?.close());
    };
  }, [sessionIds, dispatch]);

  const listenForResults = (sessionId: string) => {
    if (completedSessions.current.has(sessionId)) return; // Skip if session is complete

    const eventSource = new EventSource(`http://127.0.0.1:8000/stream-results/${sessionId}`);
    sseRefs.current[sessionId] = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        dispatch(updateSessionData({ sessionId, data: { results: [parsedData] } }));

        if (parsedData.message === "processing completed") {
          console.log(`Closing results stream for ${sessionId} as processing is completed.`);
          completedSessions.current.add(sessionId);
          eventSource.close();
        }
      } catch (error) {
        console.error("Error parsing results:", error);
      }
    };

    eventSource.onerror = () => eventSource.close();
  };

  const listenForLiveData = (sessionId: string) => {
    if (completedSessions.current.has(sessionId)) return; // Skip if session is complete

    const liveEventSource = new EventSource(`http://127.0.0.1:8000/stream-live-data/${sessionId}`);
    sseRefs.current[sessionId] = liveEventSource;

    liveEventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        const liveData = parsedData.data;
        const frameNumber = Math.round(liveData.Frame);
        const personCount = liveData["Number of Persons"] ?? 0;
        const totalDwellTime = liveData["Total Dwell Time"] ?? 0;

        if (!isNaN(frameNumber) && frameNumber > (frameTrackers.current[sessionId] || -1)) {
          frameTrackers.current[sessionId] = frameNumber;
          bufferLiveData(sessionId, "Persons Count", { x: frameNumber, y: personCount });
          bufferLiveData(sessionId, "Total Dwell Time", { x: frameNumber, y: totalDwellTime });
        }

        if (parsedData.message === "live data completed") {
          console.log(`Closing live data stream for ${sessionId} as processing is completed.`);
          completedSessions.current.add(sessionId);
          liveEventSource.close();
        }
      } catch (error) {
        console.error("Error parsing live data:", error);
      }
    };

    liveEventSource.onerror = () => liveEventSource.close();
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-6">
      <div className="w-full max-w-5xl">
        {sessionIds.map(sessionId => (
          <SessionCard key={sessionId} sessionId={sessionId} isOpen={!!openSessions[sessionId]} onToggle={() => toggleSession(sessionId)} sessionData={sessionData[sessionId] || {}} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;