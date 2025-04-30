import React, { useMemo, useState } from "react";
 
const DetectionsTable = ({ detections }) => {
  const [expandedRows, setExpandedRows] = useState({});
 
 
  const hasSpeedData = useMemo(() => {
    return detections.some(
      (d) => Array.isArray(d.Speed_Data) && d.Speed_Data.length > 0
    );
  }, [detections]);
 
 
  const columns = useMemo(() => {
    if (!detections || detections.length === 0) return [];
 
    const allKeys = detections.reduce((keys, detection) => {
      Object.keys(detection).forEach((key) => {
        if (
          !keys.includes(key) &&
          !key.toLowerCase().includes("id") &&
          key !== "Speed_Data"
        ) {
          keys.push(key);
        }
      });
      return keys;
    }, []);
 
    return allKeys.map((key) => ({
      Header:
        key === "current_date" || key === "Current_date"
          ? "DATE"
          : key === "current_time"|| key === "Current_time" || key === "current_Time"
            ? "TIME"
            : key.replace(/_/g, " ").toUpperCase(),
      accessor: key,
    }));
  }, [detections]);
 
  const toggleRow = (index) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };
 
  const renderCell = (value, key) => {
    if (value === null || value === undefined) return "-";
 
    const keysToFormat = [
      "Total_Dwell_Time",
      "Total_Active_Time",
      "detection_start_time",
      "detection_duration",
    ];
 
    if (keysToFormat.includes(key)) {
      const num = parseFloat(value);
      return isNaN(num) ? "-" : num.toFixed(2);
    }
 
    if (Array.isArray(value)) return value.length === 0 ? "No Data" : `${value.length} items`;
    if (typeof value === "object") return JSON.stringify(value);
    return value.toString();
  };
 
  return (
    <div className="overflow-auto max-h-[80vh] border border-gray-300 rounded-md">
      <table className="min-w-full bg-white border-collapse">
        <thead>
          <tr className="bg-gray-100 sticky top-0 z-10">
            {columns.map((column) => (
              <th
                key={column.accessor}
                className="px-4 py-2 text-sm font-semibold text-gray-700 border-b text-center"
              >
                {column.Header}
              </th>
            ))}
            {hasSpeedData && (
              <th className="px-4 py-2 text-sm font-semibold text-gray-700 border-b text-center">
                Speed Data
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {detections.map((detection, index) => (
            <React.Fragment key={index}>
              <tr className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column.accessor}
                    className="px-4 py-2 text-sm text-gray-600 border-b text-center"
                  >
                    {renderCell(detection[column.accessor], column.accessor)}
                  </td>
                ))}
 
                {hasSpeedData && (
                  <td className="px-4 py-2 text-sm text-blue-600 border-b text-center">
                    {Array.isArray(detection.Speed_Data) &&
                      detection.Speed_Data.length > 0 ? (
                      <button
                        onClick={() => toggleRow(index)}
                        className="text-blue-600 underline"
                      >
                        {expandedRows[index] ? "Hide" : "Show"} (
                        {detection.Speed_Data.length})
                      </button>
                    ) : (
                      "No Data"
                    )}
                  </td>
                )}
              </tr>
 
              {expandedRows[index] &&
                Array.isArray(detection.Speed_Data) &&
                detection.Speed_Data.length > 0 && (
                  <tr className="bg-gray-50">
                    <td colSpan={columns.length + (hasSpeedData ? 1 : 0)}>
                      <div className="p-2 overflow-x-auto">
                        <table className="min-w-full text-sm border border-gray-300">
                          <thead className="bg-gray-200">
                            <tr>
                              {Object.keys(detection.Speed_Data[0])
                                .filter((key) => key !== "Total_Active_Time")
                                .map((key) => (
                                  <th key={key} className="px-2 py-1 border text-center">
                                    {key === "CURRENT_DATE"
                                      ? "DATE"
                                      : key === "CURRENT_TIME"
                                        ? "TIME"
                                        : key}
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody>
                            {detection.Speed_Data.map((item, i) => (
                              <tr key={i} className="bg-white">
                                {Object.entries(item)
                                  .filter(([key]) => key !== "Total_Active_Time")
                                  .map(([key, val], j) => (
                                    <td key={j} className="px-2 py-1 border text-center">
                                      {["Total_Dwell_Time", "detection_start_time", "detection_duration"].includes(key)
                                        ? (isNaN(parseFloat(val)) ? "-" : parseFloat(val).toFixed(2))
                                        : val?.toString()}
                                    </td>
                                  ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
 
export default DetectionsTable;