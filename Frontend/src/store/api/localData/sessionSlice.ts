import { createSlice, PayloadAction } from "@reduxjs/toolkit";
 
interface LiveDataPoint {
  x: number | string;
  y: number;
}
 
interface LiveDataSeries {
  name: string;
  data: LiveDataPoint[];
}
 
interface SessionData {
  videoPath: string | null;
  industry: string;
  ruleId: string;
  ruleName: string;
  results: any[];
  liveData: LiveDataSeries[];
  frames: { frame: string }[];
  completedProcessing: boolean;
}
 
interface SessionState {
  sessionIds: string[];
  sessionData: { [key: string]: SessionData };
}
 
const MAX_SESSION_COUNT = 4;
 
const RULE_NAMES: { [key: string]: { [key: string]: string } } = {
  "industry1": { "1": "Person Count", "2": "Dwell Time" },
  "industry2": { "1": "Crate Count", "2": "Milk Spillage", "3": "Milk Wastage", "4": "Conveyor Belt Crate Count" },
  "industry3": {
    "1": "Speed",
    "2": "Helmet",
    "3": "PPE",
    "4": "Intrusion",
    "5": "Crowd",
    "6": "Camera Tampering"
  }
};
 
const initialState: SessionState = {
  sessionIds: [],
  sessionData: {},
};
 
const getInitialSeriesForRule = (industry: string, ruleId: string): LiveDataSeries[] => {
  console.log(`getInitialSeriesForRule called - Industry: ${industry}, RuleId: ${ruleId}`);
  if (industry === "industry1") {
    switch (ruleId) {
      case "1": return [{ name: "Persons Count", data: [] }];
      case "2": return [{ name: "Total Dwell Time", data: [] }];
      default: return [{ name: "Data", data: [] }];
    }
  } else if (industry === "industry2") {
    switch (ruleId) {
      case "1": return [{ name: "Crates", data: [] }, { name: "Crates Count", data: [] }];
      case "2": return [{ name: "Approx. Wastage Percentage", data: [] }, { name: "Alert Status", data: [] }];
      case "3": return [{ name: "Approx. Wastage Percentage", data: [] }, { name: "Alert Status", data: [] }];
      case "4": return [{ name: "Total Crate Count", data: [] }];
      default: return [{ name: "Data", data: [] }];
    }
  } else if (industry === "industry3") {
    switch (ruleId) {
      case "1":
        return [
          { name: "Normal Speed", data: [] },
          { name: "Medium Speed", data: [] },
          { name: "Over Speed", data: [] }
        ];
      case "2":
        console.log("Initializing series for Helmet rule - Alert Status only");
        return [{ name: "Alert Status", data: [] }];
      case "3":
        console.log("Initializing series for PPE rule - Alert Status only");
        return [{ name: "Alert Status", data: [] }];
      case "4":
        console.log("Initializing series for ROI Person Detection rule - Persons in ROI and Alert Status");
        return [
          { name: "Persons in ROI", data: [] },
          { name: "Alert Status", data: [] }
        ];
      case "5":
        console.log("Initializing series for Percentage in ROI rule - Percentage in ROI and Alert Status");
        return [
          { name: "Percentage in ROI", data: [] },
          { name: "Alert Status", data: [] }
        ];
      case "6":
        console.log("Initializing series for Alert Status rule - Alert Status only");
        return [{ name: "Alert Status", data: [] }];
      default: return [{ name: "Data", data: [] }];
    }
  }
  return [{ name: "Data", data: [] }];
};
 
const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    addSessionId: (state, action: PayloadAction<{ sessionId: string; industry: string; ruleId: string; videoPath: string }>) => {
      const { sessionId, industry, ruleId, videoPath } = action.payload;
      console.log(`addSessionId - SessionId: ${sessionId}, Industry: ${industry}, RuleId: ${ruleId}, VideoPath: ${videoPath}`);
      if (!state.sessionIds.includes(sessionId)) {
        state.sessionIds.push(sessionId);
        const ruleName = RULE_NAMES[industry]?.[ruleId] || `Rule ${ruleId}`;
        state.sessionData[sessionId] = {
          videoPath,
          industry,
          ruleId,
          ruleName,
          results: [],
          liveData: getInitialSeriesForRule(industry, ruleId),
          frames: [],
          completedProcessing: false
        };
        console.log(`Session added - Initial sessionData[${sessionId}]:`, state.sessionData[sessionId]);
      }
      while (state.sessionIds.length > MAX_SESSION_COUNT) {
        const removedSessionId = state.sessionIds.shift();
        if (removedSessionId) delete state.sessionData[removedSessionId];
        console.log(`Removed session ${removedSessionId} due to max count exceeded`);
      }
    },
    updateSessionData: (state, action: PayloadAction<{ sessionId: string; data: Partial<SessionData> }>) => {
      const { sessionId, data } = action.payload;
      console.log(`updateSessionData - SessionId: ${sessionId}, Data:`, data);
      if (!state.sessionData[sessionId]) {
        console.log(`Session ${sessionId} not found in state`);
        return;
      }
 
      if (data.results && data.results.length > 0) {
        const latestResult = data.results[data.results.length - 1];
        if (latestResult.status === "completed" || latestResult.status === "error") {
          state.sessionData[sessionId].completedProcessing = true;
          console.log(`Session ${sessionId} marked as completed or errored`);
        }
        state.sessionData[sessionId].results = [latestResult];
      }
 
      if (data.liveData) {
        if (data.liveData.some(series => series.data.length > 1)) {
          state.sessionData[sessionId].liveData = data.liveData;
          console.log(`Updated liveData for ${sessionId} with full series:`, data.liveData);
        } else {
          data.liveData.forEach(newSeries => {
            const existingSeriesIndex = state.sessionData[sessionId].liveData
              .findIndex(series => series.name === newSeries.name);
            if (existingSeriesIndex !== -1 && newSeries.data.length > 0) {
              const newPoints = [...newSeries.data];
              const existingSeries = state.sessionData[sessionId].liveData[existingSeriesIndex];
              for (const newPoint of newPoints) {
                const isDuplicate = existingSeries.data.some(
                  point => point.x === newPoint.x ||
                    (typeof point.x === 'string' && typeof newPoint.x === 'string' && point.x === newPoint.x)
                );
                if (!isDuplicate) existingSeries.data.push(newPoint);
              }
              existingSeries.data.sort((a, b) => {
                if (typeof a.x === 'number' && typeof b.x === 'number') return a.x - b.x;
                return a.x.toString().localeCompare(b.x.toString());
              });
              console.log(`Updated series ${newSeries.name} for ${sessionId}:`, existingSeries.data);
            } else if (newSeries.data.length > 0) {
              state.sessionData[sessionId].liveData.push(newSeries);
              console.log(`Added new series ${newSeries.name} for ${sessionId}:`, newSeries);
            }
          });
        }
      }
 
      if (data.frames && data.frames.length > 0) {
        state.sessionData[sessionId].frames = [data.frames[data.frames.length - 1]];
        console.log(`Updated frames for ${sessionId}:`, state.sessionData[sessionId].frames);
      }
 
      if (data.completedProcessing !== undefined) {
        state.sessionData[sessionId].completedProcessing = data.completedProcessing;
        console.log(`Set completedProcessing for ${sessionId} to ${data.completedProcessing}`);
      }
    },
    removeSessionData: (state, action: PayloadAction<string>) => {
      const sessionId = action.payload;
      console.log(`removeSessionData - SessionId: ${sessionId}`);
      state.sessionIds = state.sessionIds.filter(id => id !== sessionId);
      delete state.sessionData[sessionId];
    },
    resetSessions: (state) => {
      console.log("resetSessions - Clearing all sessions");
      state.sessionIds = [];
      state.sessionData = {};
    },
  },
});
 
export const { addSessionId, updateSessionData, removeSessionData, resetSessions } = sessionSlice.actions;
export default sessionSlice.reducer;