import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  action?: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
  };
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, action }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <action.icon className="w-4 h-4" />
          {action.label}
        </button>
      )}
    </div>
  );
};

export default PageHeader;