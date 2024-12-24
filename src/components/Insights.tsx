import React from 'react';
import { mockDetections } from '../data/mockData';
import { Camera, Users, AlertTriangle } from 'lucide-react';
import PageHeader from './common/PageHeader';
import StatsCard from './insights/StatsCard';
import DetectionsTable from './insights/DetectionsTable';

const Insights = () => {
  const stats = [
    {
      title: 'Active Cameras',
      value: '4',
      change: '+2',
      icon: Camera,
    },
    {
      title: 'People Detected',
      value: '127',
      change: '+12%',
      icon: Users,
    },
    {
      title: 'Alerts Today',
      value: '23',
      change: '-5%',
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="p-6">
      <PageHeader title="Insights" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <DetectionsTable detections={mockDetections} />
    </div>
  );
};

export default Insights;