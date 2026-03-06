import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, trend, subtext }) => (
  <div className="bg-white p-6 rounded-xl border border-primary/10 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="bg-primary/10 p-2 rounded-lg text-primary">
        <Icon size={20} />
      </div>
      {trend && <span className="text-xs font-bold text-green-500 uppercase">{trend}</span>}
      {subtext && <span className="text-xs font-bold text-slate-400 uppercase">{subtext}</span>}
    </div>
    <p className="text-slate-500 text-sm font-medium">{label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);
