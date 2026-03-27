import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, trend, subtext }) => (
  <Card className="hover:shadow-md transition-all">
    <CardContent className="p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="bg-primary/10 p-2 rounded-lg text-primary">
        <Icon size={20} />
      </div>
      {trend && <Badge variant="secondary" className="text-xs uppercase">{trend}</Badge>}
      {subtext && <Badge variant="outline" className="text-xs uppercase">{subtext}</Badge>}
    </div>
    <p className="text-slate-500 text-sm font-medium">{label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
    </CardContent>
  </Card>
);
