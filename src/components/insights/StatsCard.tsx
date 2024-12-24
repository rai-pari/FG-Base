import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, icon: Icon }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="w-8 h-8 text-blue-500" />
      </div>
      <p className={`text-sm mt-2 ${
        change.startsWith('+') ? 'text-green-600' : 'text-red-600'
      }`}>
        {change} from last week
      </p>
    </div>
  );
};

export default StatsCard;