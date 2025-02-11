import React, { useEffect, useState, useRef } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

const Graph: React.FC = () => {
    const [personsChartData, setPersonsChartData] = useState<{ name: string; data: { x: number; y: number }[] }[]>([
        { name: 'Persons Count', data: [] }
    ]);

    const [dwellTimeChartData, setDwellTimeChartData] = useState<{ name: string; data: { x: number; y: number }[] }[]>([
        { name: 'Total Dwell Time', data: [] }
    ]);

    const [maxFrame, setMaxFrame] = useState(500); // Extend dynamically

    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        connectWebSocket();
        return () => ws.current?.close();
    }, []);

    const connectWebSocket = () => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            ws.current = new WebSocket('ws://localhost:8000/ws/live-data/');

            ws.current.onmessage = (event) => {
                const parsedData = JSON.parse(event.data);
                const frameNumber = parseInt(parsedData.data.frame);
                const personsCount = parseInt(parsedData.data.person_count);
                const totalDwellTime = parseFloat(parsedData.data.Total_Dwell_Time);

                if (!isNaN(frameNumber) && !isNaN(personsCount) && !isNaN(totalDwellTime)) {
                    // Update Persons Count Chart
                    setPersonsChartData((prevData) => [
                        {
                            ...prevData[0],
                            data: [...prevData[0].data, { x: frameNumber, y: personsCount }]
                        }
                    ]);

                    // Update Total Dwell Time Chart
                    setDwellTimeChartData((prevData) => [
                        {
                            ...prevData[0],
                            data: [...prevData[0].data, { x: frameNumber, y: totalDwellTime }]
                        }
                    ]);

                    setMaxFrame((prevMax) => Math.max(prevMax, Math.ceil(frameNumber / 100) * 100));
                }
            };
        }
    };

    const areaChartOptionsPersons: ApexOptions = {
        chart: {
            id: 'persons-count-chart',
            type: 'area', // Correct Type
            zoom: { enabled: true, type: 'x', autoScaleYaxis: false },
            toolbar: { autoSelected: 'zoom', tools: { pan: true, reset: true } },
        },
        xaxis: {
            type: 'numeric',
            title: { text: 'Frame Number' },
            tickAmount: Math.floor(maxFrame / 100),
            min: 0,
            max: maxFrame,
            labels: {
                formatter: (value: string) => {
                    const numValue = Number(value);
                    return numValue % 100 === 0 ? numValue.toString() : '';
                }
            }
        },
        yaxis: { title: { text: 'Persons Count' } },
        stroke: { curve: 'smooth' },
        fill: { type: 'gradient', gradient: { shadeIntensity: 0.5, opacityFrom: 0.6, opacityTo: 0.1 } },
        markers: { size: 4 },
        colors: ['#ff7567'],
        tooltip: {
            enabled: true,
            shared: true,
            x: { formatter: (value: number) => `Frame: ${value}` },
        },
    };

    const areaChartOptionsDwellTime: ApexOptions = {
        chart: {
            id: 'total-dwell-time-chart',
            type: 'area', // Correct Type
            zoom: { enabled: true, type: 'x', autoScaleYaxis: false },
            toolbar: { autoSelected: 'zoom', tools: { pan: true, reset: true } },
        },
        xaxis: {
            type: 'numeric',
            title: { text: 'Frame Number' },
            tickAmount: Math.floor(maxFrame / 100),
            min: 0,
            max: maxFrame,
            labels: {
                formatter: (value: string) => {
                    const numValue = Number(value);
                    return numValue % 100 === 0 ? numValue.toString() : '';
                }
            },
        },
        yaxis: { title: { text: 'Total Dwell Time (s)' } },
        stroke: { curve: 'smooth' },
        fill: { type: 'gradient', gradient: { shadeIntensity: 0.5, opacityFrom: 0.6, opacityTo: 0.1 } },
        markers: { size: 4 },
        colors: ['#ff0000'],
        tooltip: {
            enabled: true,
            shared: true,
            x: { formatter: (value: number) => `Frame: ${value}` },
        },
    };

    return (
        <div className="p-4 w-full flex flex-col items-center justify-center min-h-screen">
            <h2 className="text-xl font-semibold mb-4 text-center">Live Data Monitoring</h2>

            <div className="w-[90%] flex flex-col justify-between items-center space-x-6">
                {/* Persons Count Chart */}
                <div className="w-1/2 flex flex-col items-center">
                    <h3 className="text-lg font-medium mb-2">Persons Count</h3>
                    <ReactApexChart options={areaChartOptionsPersons} series={personsChartData} type="area" height={400} width={500} />
                </div>

                {/* Total Dwell Time Chart */}
                <div className="w-1/2 flex flex-col items-center">
                    <h3 className="text-lg font-medium mb-2">Total Dwell Time</h3>
                    <ReactApexChart options={areaChartOptionsDwellTime} series={dwellTimeChartData} type="area" height={400} width={500} />
                </div>
            </div>
        </div>
    );
};

export default Graph;
