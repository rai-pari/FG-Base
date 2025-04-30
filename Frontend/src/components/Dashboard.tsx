import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useDispatch, useSelector } from "react-redux";
import { addSessionId, updateSessionData, removeSessionData } from "../store/api/localData/sessionSlice";
import { RootState } from "../store/middleware";
 
const eventSources: { [key: string]: { results?: EventSource; liveData?: EventSource } } = {};
 
const resultBoxConfigs: { [key: string]: { [key: string]: { title: string, key: string, format?: (val: any) => string }[] } } = {
  "industry1": {
    "1": [{ title: "Total People Count", key: "person_count", format: (val) => val || 0 }],
    "2": [{ title: "Total Dwell Time", key: "total_dwell_time", format: (val) => (val?.toFixed(2) || "0.00") + " sec" }]
  },
  "industry2": {
    "1": [
      { title: "ROI Box Count", key: "roi_box_count", format: (val) => val || 0 },
      { title: "Total Crates", key: "total_crates", format: (val) => val || 0 }
    ],
    "2": [
      { title: "White Percentage", key: "white_percentage", format: (val) => (val?.toFixed(2) || "0.00") + "%" },
      { title: "Detection Start Time", key: "detection_start_time", format: (val) => val || "N/A" },
      { title: "Total Detection Time", key: "total_detection_time", format: (val) => (val?.toFixed(2) || "0.00") + " sec" }
    ],
    "3": [
      { title: "White Percentage", key: "white_percentage", format: (val) => (val?.toFixed(2) || "0.00") + "%" },
      { title: "Detection Start Time", key: "detection_start_time", format: (val) => val || "N/A" }
    ],
    "4": [{ title: "Box Count", key: "box_count", format: (val) => val || 0 }]
  },
  "industry3": {
    "1": [
      { title: "Normal Speed Count", key: "normal_count", format: (val) => val || 0 },
      { title: "Medium Speed Count", key: "medium_count", format: (val) => val || 0 },
      { title: "Over Speed Count", key: "overspeed_count", format: (val) => val || 0 }
    ],
    "2": [
      { title: "Safe", key: "safe_count", format: (val) => val || "0" },
      { title: "Unsafe", key: "unsafe_count", format: (val) => val || "0" },
    ],
    "3": [
      { title: "Safe", key: "safe_count", format: (val) => val || "0" },
      { title: "Unsafe", key: "unsafe_count", format: (val) => val || "0" },
    ],
    "4": [
      { title: "Intrusion Time", key: "intrusion_time_sec",  format: (val) => (val?.toFixed(2) || "0.00") + " sec" },
      { title: "Total Persons Detected", key: "max_persons_in_roi", format: (val) => val || 0 }
    ],
    "5": [
      { title: "Detection Start Time", key: "detection_start_time", format: (val) => val || "N/A" },
      { title: "Total Detection Time", key: "detection_duration",  format: (val) => (val?.toFixed(2) || "0.00") + " sec" },
    ],
    "6": [
      { title: "Detection Type", key: "detection_type", format: (val) => val || "N/A" },
      { title: "Detection Start Time", key: "detection_start_time", format: (val) => val || "N/A" },
      { title: "Total Detection Time", key: "total_detection_time",  format: (val) => (val?.toFixed(2) || "0.00") + " sec" },
     ]
  }
};
 
const chartColors: { [key: string]: string } = {
  "Persons Count": "#ff7567",
  "Total Dwell Time": "#ff0000",
  "Crates": "#ff7567",
  "Crates Count": "#ff0000",
  "Approx. Wastage Percentage": "#ff7567",
  "Alert Status": "#ff0000",
  "Total Crate Count": "#ff0000",
  "Normal Speed": "#ff0000",
  "Medium Speed": "#ff0000",
  "Over Speed": "#ff0000",
  "PPE Violations": "#ff0000",
  "Persons in ROI": "#ff0000",
  "Percentage in ROI": "#ff0000"
};
 
const getChartOptions = (title: string, color: string, ruleId?: string): ApexOptions => {
  console.log(`getChartOptions - Title: ${title}, Color: ${color}, RuleId: ${ruleId}`);
  const baseOptions: ApexOptions = {
    chart: {
      id: `chart-${title}`,
      type: "area",
      zoom: { enabled: true, type: "x" },
      animations: { enabled: true, speed: 800, dynamicAnimation: { enabled: true, speed: 350 } },
      toolbar: { show: true, tools: { download: true, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true } }
    },
    xaxis: {
      type: "category",
      title: { text: "Time" },
      labels: {
        rotate: -45,
        rotateAlways: true,
        hideOverlappingLabels: true,
        showDuplicates: false,
        trim: true,
        maxHeight: 120,
        style: { fontSize: "12px" },
        formatter: (value) => value ? (typeof value === 'number' ? `Frame ${value}` : value.toString()) : ''
      },
      tickAmount: 5,
    },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3, stops: [0, 90, 100] } },
    colors: [color],
    dataLabels: { enabled: false },
    grid: { borderColor: '#f1f1f1', row: { colors: ['transparent', 'transparent'], opacity: 0.5 } },
    markers: { size: 0 },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => title === "Alert Status" ? (val > 0 ? "ON" : "OFF") : val.toString()
      }
    }
  };
 
  const yaxis = title === "Alert Status" ? {
    title: { text: ruleId === "3" ? "PPE Alert Status" : ruleId === "2" ? "Helmet Alert Status" : "Alert Status" },
    min: 0,
    max: 1,
    tickAmount: 1,
    labels: {
      formatter: (val: number) => val > 0 ? "ON" : "OFF"
    }
  } : {
    title: { text: title },
    min: 0
  };
 
  return { ...baseOptions, yaxis };
};
 
interface AccumulatedData {
  [sessionId: string]: {
    [seriesName: string]: { x: string | number; y: number }[];
  };
}
 
interface DashboardProps {
  selectedIndustry: string;
}
 
const Dashboard: React.FC<DashboardProps> = ({ selectedIndustry }) => {
  const dispatch = useDispatch();
  const { sessionIds, sessionData } = useSelector((state: RootState) => state.session);
  const [expandedSessions, setExpandedSessions] = useState<{ [key: string]: boolean }>({});
  const [maxFrame, setMaxFrame] = useState(500);
  const [latestFrames, setLatestFrames] = useState<{ [key: string]: string }>({});
  const [accumulatedData, setAccumulatedData] = useState<AccumulatedData>({});
 
  console.log("Dashboard Render - sessionIds:", sessionIds, "sessionData:", sessionData, "accumulatedData:", accumulatedData);
 
  const toggleSession = (sessionId: string) => {
    console.log(`toggleSession - SessionId: ${sessionId}, Current State: ${expandedSessions[sessionId] ? 'open' : 'closed'}`);
    setExpandedSessions(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
  };
 
  const accumulateDataPoints = (
    sessionId: string,
    seriesName: string,
    newPoint: { x: string | number; y: number }
  ) => {
    console.log(`accumulateDataPoints - SessionId: ${sessionId}, Series: ${seriesName}, NewPoint:`, newPoint);
    setAccumulatedData(prev => {
      const sessionPoints = prev[sessionId]  || {};
      const seriesPoints = [...(sessionPoints[seriesName] || [])];
      const pointExists = seriesPoints.some(p => p.x === newPoint.x ||
        (typeof p.x === 'string' && typeof newPoint.x === 'string' && p.x === newPoint.x));
      if (!pointExists) {
        seriesPoints.push(newPoint);
        seriesPoints.sort((a, b) =>
          typeof a.x === 'number' && typeof b.x === 'number' ? a.x - b.x : a.x.toString().localeCompare(b.x.toString())
        );
        sessionPoints[seriesName] = seriesPoints;
        console.log(`Accumulated data for ${sessionId} - ${seriesName}:`, seriesPoints);
        return { ...prev, [sessionId]: sessionPoints };
      }
      console.log(`Point already exists for ${sessionId} - ${seriesName}, skipping`);
      return prev;
    });
  };
 
  useEffect(() => {
    console.log("useEffect triggered - sessionIds:", sessionIds);
    sessionIds.forEach(sessionId => {
      const session = sessionData[sessionId];
      if (!session || (selectedIndustry && session.industry !== selectedIndustry)) {
        console.log(`Skipping session ${sessionId} - No data or industry mismatch`);
        return;
      }
 
      if (!eventSources[sessionId]) {
        console.log(`Setting up EventSource for session: ${sessionId}`);
        const resultsEventSource = new EventSource(`http://127.0.0.1:8000/stream-results/${sessionId}`);
        resultsEventSource.onmessage = (event) => {
          console.log(`Results data received for ${sessionId}:`, event.data);
          try {
            const parsedData = JSON.parse(event.data);
            if (parsedData.status === "completed" || parsedData.status === "error") {
              resultsEventSource.close();
              delete eventSources[sessionId]?.results;
              console.log(`Closed results EventSource for ${sessionId} due to ${parsedData.status}`);
            }
            dispatch(updateSessionData({ sessionId, data: { results: [parsedData] } }));
          } catch (error) {
            console.error("Error parsing results JSON:", error);
          }
        };
 
        const liveDataEventSource = new EventSource(`http://127.0.0.1:8000/stream-live-data/${sessionId}`);
        liveDataEventSource.onmessage = (event) => {
          console.log(`Live data received for ${sessionId}:`, event.data);
          try {
            const parsedData = JSON.parse(event.data);
            if (parsedData.is_final || parsedData.status === "completed" || parsedData.status === "error") {
              if (parsedData.all_data) processCompleteDataset(sessionId, parsedData.all_data);
              liveDataEventSource.close();
              delete eventSources[sessionId]?.liveData;
              console.log(`Closed liveData EventSource for ${sessionId}`);
              return;
            }
            const liveData = parsedData.latest_data || parsedData;
            if (!liveData || !session) return;
            processIncrementalUpdate(sessionId, session.industry, session.ruleId, liveData);
          } catch (error) {
            console.error("Error parsing live data JSON:", error);
          }
        };
 
        eventSources[sessionId] = { results: resultsEventSource, liveData: liveDataEventSource };
      }
    });
  }, [sessionIds, sessionData, dispatch, selectedIndustry]);
 
  const processCompleteDataset = (sessionId: string, allData: any[]) => {
    console.log(`processCompleteDataset - SessionId: ${sessionId}, AllData:`, allData);
    if (!allData || allData.length === 0) return;
    const session = sessionData[sessionId];
    if (!session || (selectedIndustry && session.industry !== selectedIndustry)) return;
 
    console.log(`Processing complete dataset for ${sessionId}`);
    setAccumulatedData(prev => ({ ...prev, [sessionId]: {} }));
    allData.forEach(dataPoint => processIncrementalUpdate(sessionId, session.industry, session.ruleId, dataPoint, false));
 
    setTimeout(() => {
      const sessionAccumulatedData = accumulatedData[sessionId] || {};
      const fullDataSeries = Object.keys(sessionAccumulatedData).map(seriesName => ({
        name: seriesName,
        data: sessionAccumulatedData[seriesName] || []
      }));
      console.log(`Dispatching full data series for ${sessionId}:`, fullDataSeries);
      dispatch(updateSessionData({ sessionId, data: { liveData: fullDataSeries } }));
    }, 100);
  };
 
  const processIncrementalUpdate = (
    sessionId: string,
    industry: string,
    ruleId: string,
    liveData: any,
    updateRedux: boolean = true
  ) => {
    const timestamp = liveData["Timestamp"] || liveData["Frame_no"] || Math.round(liveData["Frame"]) || new Date().toLocaleTimeString();
    const frameBase64 = liveData["Frame"] ?? "";
 
    console.log(`processIncrementalUpdate - SessionId: ${sessionId}, Industry: ${industry}, RuleId: ${ruleId}, LiveData:`, liveData);
 
    if (industry === "industry1") {
      switch (ruleId) {
        case "1": {
          const frameNumber = liveData["Frame_no"] ?? Math.round(liveData["Frame"]) ?? 0;
          const personCount = liveData["Number of Persons"] ?? 0;
          if (!isNaN(frameNumber)) {
            accumulateDataPoints(sessionId, "Persons Count", { x: timestamp, y: personCount });
            if (updateRedux) {
              dispatch(updateSessionData({
                sessionId,
                data: { liveData: [{ name: "Persons Count", data: [{ x: timestamp, y: personCount }] }] }
              }));
            }
            setMaxFrame(prevMax => Math.max(prevMax, Math.ceil(frameNumber / 100) * 100));
          }
          break;
        }
        case "2": {
          const frameNumber = liveData["Frame_no"] ?? Math.round(liveData["Frame"]) ?? 0;
          const totalDwellTime = liveData["Total Dwell Time"] ?? 0;
          if (!isNaN(frameNumber)) {
            accumulateDataPoints(sessionId, "Total Dwell Time", { x: timestamp, y: totalDwellTime });
            if (updateRedux) {
              dispatch(updateSessionData({
                sessionId,
                data: { liveData: [{ name: "Total Dwell Time", data: [{ x: timestamp, y: totalDwellTime }] }] }
              }));
            }
            setMaxFrame(prevMax => Math.max(prevMax, Math.ceil(frameNumber / 100) * 100));
          }
          break;
        }
      }
    } else if (industry === "industry2") {
      switch (ruleId) {
        case "1": {
          const crates = liveData["Crates"] ?? 0;
          const cratesCount = liveData["Crates_count"] ?? 0;
          accumulateDataPoints(sessionId, "Crates", { x: timestamp, y: crates });
          accumulateDataPoints(sessionId, "Crates Count", { x: timestamp, y: cratesCount });
          if (updateRedux) {
            dispatch(updateSessionData({
              sessionId,
              data: {
                liveData: [
                  { name: "Crates", data: [{ x: timestamp, y: crates }] },
                  { name: "Crates Count", data: [{ x: timestamp, y: cratesCount }] }
                ]
              }
            }));
          }
          break;
        }
        case "2": {
          const wastagePercentage = liveData["Approx. Wastage Percentage"] ?? 0;
          const alertStatus = liveData["Alert Status"] ?? false;
          const alertValue = alertStatus === true || alertStatus === "True" || alertStatus === 1 ? 1 : 0;
          accumulateDataPoints(sessionId, "Approx. Wastage Percentage", { x: timestamp, y: wastagePercentage });
          accumulateDataPoints(sessionId, "Alert Status", { x: timestamp, y: alertValue });
          if (updateRedux) {
            dispatch(updateSessionData({
              sessionId,
              data: {
                liveData: [
                  { name: "Approx. Wastage Percentage", data: [{ x: timestamp, y: wastagePercentage }] },
                  { name: "Alert Status", data: [{ x: timestamp, y: alertValue }] }
                ]
              }
            }));
          }
          break;
        }
        case "3": {
          const wastagePercentage = liveData["Approx. Wastage Percentage"] ?? 0;
          const alertStatus = liveData["Alert Status"] ?? false;
          const alertValue = alertStatus === true || alertStatus === "True" || alertStatus === 1 ? 1 : 0;
          accumulateDataPoints(sessionId, "Approx. Wastage Percentage", { x: timestamp, y: wastagePercentage });
          accumulateDataPoints(sessionId, "Alert Status", { x: timestamp, y: alertValue });
          if (updateRedux) {
            dispatch(updateSessionData({
              sessionId,
              data: {
                liveData: [
                  { name: "Approx. Wastage Percentage", data: [{ x: timestamp, y: wastagePercentage }] },
                  { name: "Alert Status", data: [{ x: timestamp, y: alertValue }] }
                ]
              }
            }));
          }
          break;
        }
        case "4": {
          const totalCrateCount = liveData["Total Crate Count"] ?? 0;
          accumulateDataPoints(sessionId, "Total Crate Count", { x: timestamp, y: totalCrateCount });
          if (updateRedux) {
            dispatch(updateSessionData({
              sessionId,
              data: { liveData: [{ name: "Total Crate Count", data: [{ x: timestamp, y: totalCrateCount }] }] }
            }));
          }
          break;
        }
      }
    } else if (industry === "industry3") {
      switch (ruleId) {
        case "1": {
          const normal = liveData["Normal"] ?? 0;
          const medium = liveData["Medium"] ?? 0;
          const overspeed = liveData["Overspeed"] ?? 0;
          console.log(`Industry3 Rule1 - Normal: ${normal}, Medium: ${medium}, Overspeed: ${overspeed}, Timestamp: ${timestamp}`);
          accumulateDataPoints(sessionId, "Normal Speed", { x: timestamp, y: normal });
          accumulateDataPoints(sessionId, "Medium Speed", { x: timestamp, y: medium });
          accumulateDataPoints(sessionId, "Over Speed", { x: timestamp, y: overspeed });
          if (updateRedux) {
            console.log(`Dispatching live data update for ${sessionId} - Rule 1`);
            dispatch(updateSessionData({
              sessionId,
              data: {
                liveData: [
                  { name: "Normal Speed", data: [{ x: timestamp, y: normal }] },
                  { name: "Medium Speed", data: [{ x: timestamp, y: medium }] },
                  { name: "Over Speed", data: [{ x: timestamp, y: overspeed }] }
                ]
              }
            }));
          }
          break;
        }
        case "2": {
          const alertStatus = liveData["Alert Status"] ?? "False";
          const alertValue = alertStatus === "True" || alertStatus === true ? 1 : 0;
          console.log(`Industry3 Rule2 - Alert Status: ${alertStatus}, AlertValue: ${alertValue} (ON/OFF: ${alertValue > 0 ? 'ON' : 'OFF'}), Timestamp: ${timestamp}`);
          accumulateDataPoints(sessionId, "Alert Status", { x: timestamp, y: alertValue });
          if (updateRedux) {
            console.log(`Dispatching live data update for ${sessionId} - Rule 2 (Helmet)`);
            dispatch(updateSessionData({
              sessionId,
              data: {
                liveData: [{
                  name: "Alert Status",
                  data: [{ x: timestamp, y: alertValue }]
                }]
              }
            }));
          }
          break;
        }
        case "3": {
          const alertStatus = liveData["Alert Status"] ?? "False";
          const alertValue = alertStatus === "True" || alertStatus === true ? 1 : 0;
          console.log(`Industry3 Rule3 - Alert Status: ${alertStatus}, AlertValue: ${alertValue} (ON/OFF: ${alertValue > 0 ? 'ON' : 'OFF'}), Timestamp: ${timestamp}`);
          accumulateDataPoints(sessionId, "Alert Status", { x: timestamp, y: alertValue });
          if (updateRedux) {
            console.log(`Dispatching live data update for ${sessionId} - Rule 3 (PPE)`);
            dispatch(updateSessionData({
              sessionId,
              data: {
                liveData: [{
                  name: "Alert Status",
                  data: [{ x: timestamp, y: alertValue }]
                }]
              }
            }));
          }
          break;
        }
        case "4": {
          const personsInRoi = liveData["No_of_persons_in_ROI"] ?? 0;
          const alertStatus = liveData["Alert_status"] ?? "False";
          const alertValue = alertStatus === "True" || alertStatus === true ? 1 : 0;
          console.log(`Industry3 Rule4 - Persons in ROI: ${personsInRoi}, Alert Status: ${alertStatus}, AlertValue: ${alertValue}, Timestamp: ${timestamp}`);
          accumulateDataPoints(sessionId, "Persons in ROI", { x: timestamp, y: personsInRoi });
          accumulateDataPoints(sessionId, "Alert Status", { x: timestamp, y: alertValue });
          if (updateRedux) {
            console.log(`Dispatching live data update for ${sessionId} - Rule 4`);
            dispatch(updateSessionData({
              sessionId,
              data: {
                liveData: [
                  { name: "Persons in ROI", data: [{ x: timestamp, y: personsInRoi }] },
                  { name: "Alert Status", data: [{ x: timestamp, y: alertValue }] }
                ]
              }
            }));
          }
          break;
        }
        case "5": {
          const percentageInRoi = parseFloat(liveData["Percentage_in_roi"]) || 0;
          const alertStatus = liveData["Alert_status"] ?? "False";
          const alertValue = alertStatus === "True" || alertStatus === true ? 1 : 0;
          console.log(`Industry3 Rule5 - Percentage in ROI: ${percentageInRoi}, Alert Status: ${alertStatus}, AlertValue: ${alertValue}, Timestamp: ${timestamp}`);
          accumulateDataPoints(sessionId, "Percentage in ROI", { x: timestamp, y: percentageInRoi });
          accumulateDataPoints(sessionId, "Alert Status", { x: timestamp, y: alertValue });
          if (updateRedux) {
            console.log(`Dispatching live data update for ${sessionId} - Rule 5`);
            dispatch(updateSessionData({
              sessionId,
              data: {
                liveData: [
                  { name: "Percentage in ROI", data: [{ x: timestamp, y: percentageInRoi }] },
                  { name: "Alert Status", data: [{ x: timestamp, y: alertValue }] }
                ]
              }
            }));
          }
          break;
        }
        case "6": {
          const alertStatus = liveData["Alert_Status"] ?? "False";
          const alertValue = alertStatus === "True" || alertStatus === true ? 1 : 0;
          console.log(`Industry3 Rule6 - Alert Status: ${alertStatus}, AlertValue: ${alertValue} (ON/OFF: ${alertValue > 0 ? 'ON' : 'OFF'}), Timestamp: ${timestamp}`);
          accumulateDataPoints(sessionId, "Alert Status", { x: timestamp, y: alertValue });
          if (updateRedux) {
            console.log(`Dispatching live data update for ${sessionId} - Rule 6 (Alert Status)`);
            dispatch(updateSessionData({
              sessionId,
              data: {
                liveData: [{
                  name: "Alert Status",
                  data: [{ x: timestamp, y: alertValue }]
                }]
              }
            }));
          }
          break;
        }
      }
    }
 
    if (frameBase64 && frameBase64 !== "None") {
      console.log(`Updating frame for ${sessionId}`);
      setLatestFrames(prev => ({ ...prev, [sessionId]: `data:image/jpeg;base64,${frameBase64}` }));
      if (updateRedux) {
        dispatch(updateSessionData({ sessionId, data: { frames: [{ frame: `data:image/jpeg;base64,${frameBase64}` }] } }));
      }
    }
  };
 
  const renderCharts = (sessionId: string) => {
    const session = sessionData[sessionId];
    if (!session || (selectedIndustry && session.industry !== selectedIndustry)) {
      console.log(`renderCharts - Skipping ${sessionId} due to no data or industry mismatch`);
      return null;
    }
 
    const sessionAccumulatedData = accumulatedData[sessionId] || {};
    console.log(`renderCharts - SessionId: ${sessionId}, Accumulated Data:`, sessionAccumulatedData);
    if (Object.keys(sessionAccumulatedData).length === 0) return null;
 
    const seriesData = Object.keys(sessionAccumulatedData).map(seriesName => ({
      name: seriesName,
      data: sessionAccumulatedData[seriesName] || []
    }));
 
    return seriesData.map((series, index) => (
      series.data.length > 0 ? (
        <div key={index} className="p-4 bg-white shadow-md rounded-lg">
          <h3 className="text-md font-semibold text-red-700">{series.name} Over Time</h3>
          <ReactApexChart
            options={getChartOptions(series.name, chartColors[series.name] || "#ff7567", session.ruleId)}
            series={[{ name: series.name, data: series.data }]}
            type="area"
            height={Object.keys(sessionAccumulatedData).length > 1 ? 222 : 530}
            width="100%"
          />
        </div>
      ) : null
    ));
  };
 
  const filteredSessionIds = selectedIndustry
    ? sessionIds.filter(sessionId => sessionData[sessionId]?.industry === selectedIndustry)
    : sessionIds;
 
  console.log("Filtered session IDs:", filteredSessionIds);
 
  return (
    <div className="w-full max-w-5xl mx-auto pt-4">
      {filteredSessionIds.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600">
            No active sessions. Sessions will appear here when video processing starts.
          </p>
        </div>
      ) : (
        filteredSessionIds.map((sessionId) => {
          const data = sessionData[sessionId];
          const isOpen = !!expandedSessions[sessionId];
          if (!data) {
            console.log(`Skipping render for ${sessionId} - No data`);
            return null;
          }
 
          const sessionAccumulatedData = accumulatedData[sessionId] || {};
          const hasAccumulatedData = Object.keys(sessionAccumulatedData).length > 0;
          const hasLiveData = data.liveData && data.liveData.length > 0 && data.liveData[0].data && data.liveData[0].data.length > 0;
 
          console.log(`Rendering session ${sessionId} - isOpen: ${isOpen}, hasAccumulatedData: ${hasAccumulatedData}, hasLiveData: ${hasLiveData}`);
 
          return (
            <div key={sessionId} className="bg-white rounded-lg shadow-md mb-4">
              <div
                className="flex justify-between items-center bg-red-500 text-white p-4 cursor-pointer w-full"
                onClick={() => toggleSession(sessionId)}
              >
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold">Video Path: {data.videoPath || sessionId}</h2>
                  <p className="text-sm">Industry: {data.industry} | Rule: {data.ruleName || `Rule ${data.ruleId}`}</p>
                </div>
                <span className="text-xl">{isOpen ? "▲" : "▼"}</span>
              </div>
 
              {isOpen && (
                <div className="p-4 flex flex-col gap-4">
                  {data.results && data.results.length > 0 && (
                    console.log('Results data for display:', data.results[0]),
                    <div className={`grid ${resultBoxConfigs[data.industry]?.[data.ruleId]?.length > 2 ? 'grid-cols-3' : resultBoxConfigs[data.industry]?.[data.ruleId]?.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                      {resultBoxConfigs[data.industry]?.[data.ruleId]?.map((config, index) => (
                        <div key={index} className="p-4 bg-white rounded-md shadow flex flex-col items-center justify-center border border-red-500 w-full max-w-xs mx-auto">
                          <h3 className="text-md font-semibold text-red-600">{config.title}</h3>
                          <p className="text-xl font-bold text-red-700">
                            {config.format ? config.format(data.results[0][config.key]) : (data.results[0][config.key] || "N/A")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
 
                  <div className="grid grid-cols-2 gap-4">
                    {(data.frames && data.frames.length > 0) || latestFrames[sessionId] ? (
                      <div className="p-4 bg-white shadow-md rounded-lg flex items-center justify-center h-[603px]">
                        <img
                          src={data.frames && data.frames.length > 0 ? data.frames[0].frame : latestFrames[sessionId]}
                          alt="Current Frame"
                          className="w-full h-full object-contain rounded-lg shadow-md"
                        />
                      </div>
                    ) : (
                      <div className="p-4 bg-white shadow-md rounded-lg flex items-center justify-center h-96">
                        <p className="text-gray-600">Waiting for frames...</p>
                      </div>
                    )}
 
                    <div className="flex flex-col gap-4">
                      {hasAccumulatedData ? (
                        renderCharts(sessionId)
                      ) : (
                        hasLiveData && data.liveData.map((series, index) => (
                          series.data.length > 0 ? (
                            <div key={index} className="p-4 bg-white shadow-md rounded-lg">
                              <h3 className="text-md font-semibold text-red-700">{series.name} Over Time</h3>
                              <ReactApexChart
                                options={getChartOptions(series.name, chartColors[series.name] || "#ff7567", data.ruleId)}
                                series={[{ name: series.name, data: series.data }]}
                                type="area"
                                height={data.liveData.length > 1 ? 222 : 530}
                                width="100%"
                              />
                            </div>
                          ) : null
                        ))
                      )}
                      {!hasAccumulatedData && !hasLiveData && (
                        <div className="p-4 bg-white shadow-md rounded-lg text-center h-96 flex justify-center items-center">
                          <p className="text-gray-600">Waiting for data to be processed...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
 
export default Dashboard;