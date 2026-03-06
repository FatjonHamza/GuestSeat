import React from 'react';
import { 
  Mail, 
  CheckCircle2, 
  UserPlus, 
  Grid, 
  Bolt, 
  Send, 
  ChevronRight, 
  History, 
  Table as TableIcon,
  X
} from 'lucide-react';
import { StatCard } from '../StatCard';
import { Screen, Invitation, GuestGroup, Table } from '../../types';

interface DashboardScreenProps {
  onNavigate: (screen: Screen) => void;
  stats: {
    invitationsSent: number;
    rsvpReceived: number;
    totalGuests: number;
    tablesCreated: number;
  };
  invitations: Invitation[];
  groups: GuestGroup[];
  tables: Table[];
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate, stats, invitations, groups, tables }) => {
  // Derive activities
  const activities = [
    ...invitations.map(i => ({
      id: `inv-${i.id}`,
      type: 'Invitation',
      text: `Ftesa u krijua për ${i.inviteeName}.`,
      time: i.createdAt ? new Date(i.createdAt).getTime() : 0,
      timeLabel: i.createdAt ? new Date(i.createdAt).toLocaleString() : 'Kohët e fundit',
      status: 'Sistemi',
      color: 'bg-blue-100 text-blue-700',
      icon: UserPlus
    })),
    ...invitations.filter(i => i.status === 'Responded' && i.respondedAt).map(i => ({
      id: `rsvp-${i.id}`,
      type: 'RSVP',
      text: `${i.inviteeName} u përgjigj ftesës.`,
      time: new Date(i.respondedAt!).getTime(),
      timeLabel: new Date(i.respondedAt!).toLocaleString(),
      status: 'RSVP',
      color: 'bg-green-100 text-green-700',
      icon: CheckCircle2
    })),
    ...tables.map(t => ({
      id: `table-${t.id}`,
      type: 'Layout',
      text: `Tavolinë e re "${t.name}" u krijua.`,
      time: t.createdAt ? new Date(t.createdAt).getTime() : 0,
      timeLabel: t.createdAt ? new Date(t.createdAt).toLocaleString() : 'Kohët e fundit',
      status: 'Pamja',
      color: 'bg-primary/20 text-primary',
      icon: TableIcon
    }))
  ].sort((a, b) => b.time - a.time).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mirësevini përsëri, <span className="text-primary">Pritës</span></h1>
          <p className="text-slate-500 mt-1">Menaxhoni listën e të ftuarve dhe rregullimet e tavolinave të ngjarjes suaj.</p>
        </div>
        <button 
          onClick={() => onNavigate('Invitations')}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          <Send size={18} />
          Dërgo Ftesë
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Ftesat e Dërguara" value={stats.invitationsSent.toString()} icon={Mail} />
        <StatCard label="RSVP të Marra" value={stats.rsvpReceived.toString()} icon={CheckCircle2} trend={`${stats.invitationsSent > 0 ? Math.round((stats.rsvpReceived / stats.invitationsSent) * 100) : 0}% Shkalla`} />
        <StatCard label="Gjithsej të Ftuar" value={stats.totalGuests.toString()} icon={UserPlus} />
        <StatCard label="Tavolina të Krijuara" value={stats.tablesCreated.toString()} icon={Grid} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bolt className="text-primary" size={20} />
            Veprime të Shpejta
          </h2>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Shto të Ftuar të Ri', icon: UserPlus, screen: 'GuestList' as Screen },
              { label: 'Krijo Tavolinë', icon: TableIcon, screen: 'SeatingPlan' as Screen },
              { label: 'Regjistro të Ftuarit', icon: CheckCircle2, screen: 'CheckIn' as Screen }
            ].map((action, i) => (
              <button 
                key={i} 
                onClick={() => onNavigate(action.screen)}
                className="w-full flex items-center justify-between p-4 bg-white border border-primary/10 rounded-xl hover:border-primary group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <action.icon size={20} />
                  </div>
                  <span className="font-semibold">{action.label}</span>
                </div>
                <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="text-primary" size={20} />
              Aktiviteti i Fundit
            </h2>
          </div>
          <div className="bg-white border border-primary/10 rounded-xl overflow-hidden min-h-[300px]">
            {activities.length > 0 ? (
              <div className="divide-y divide-primary/10 w-full">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <activity.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.text}</p>
                      <p className="text-xs text-slate-500">{activity.timeLabel}</p>
                    </div>
                    <div className={`px-3 py-1 ${activity.color} text-[10px] font-bold uppercase rounded-full`}>
                      {activity.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-10">
                <History size={40} className="mx-auto text-slate-200 mb-3" />
                <p className="text-slate-400 font-medium">Nuk ka aktivitet të fundit për të treguar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
