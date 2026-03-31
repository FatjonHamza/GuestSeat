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
import { Screen, Invitation, GuestGroup, Table } from '../../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionCards } from '@/components/section-cards';
import {
  Table as DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

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
      type: 'Përgjigje',
      text: `${i.inviteeName} u përgjigj ftesës.`,
      time: new Date(i.respondedAt!).getTime(),
      timeLabel: new Date(i.respondedAt!).toLocaleString(),
      status: 'Përgjigje',
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

  type ActivityRow = (typeof activities)[number];

  const activityColumns: ColumnDef<ActivityRow>[] = [
    {
      accessorKey: 'text',
      header: 'Aktiviteti',
      cell: ({ row }) => {
        const activity = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-900">
              <activity.icon size={16} />
            </div>
            <span className="font-medium text-sm">{activity.text}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'timeLabel',
      header: 'Koha',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.timeLabel}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Statusi',
      cell: ({ row }) => (
        <Badge className={`${row.original.color} text-[10px] font-bold uppercase`}>
          {row.original.status}
        </Badge>
      ),
    },
  ];

  const activityTable = useReactTable({
    data: activities,
    columns: activityColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mirësevini përsëri, <span className="text-primary">Pritës</span></h1>
          <p className="text-slate-500 mt-1">Menaxhoni listën e të ftuarve dhe rregullimet e tavolinave të ngjarjes suaj.</p>
        </div>
        <Button 
          onClick={() => onNavigate('Invitations')}
          size="lg"
        >
          <Send size={18} />
          Dërgo Ftesë
        </Button>
      </div>

      <SectionCards
        invitationsSent={stats.invitationsSent}
        invitationsResponded={stats.rsvpReceived}
        totalGuests={stats.totalGuests}
        tablesCreated={stats.tablesCreated}
      />

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
              <Button
                key={i} 
                onClick={() => onNavigate(action.screen)}
                variant="outline"
                className="w-full justify-between group h-auto px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <action.icon size={20} />
                  </div>
                  <span className="font-semibold">{action.label}</span>
                </div>
                <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
              </Button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="min-h-[300px]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <History className="text-primary" size={20} />
                Aktiviteti i Fundit
              </CardTitle>
              <CardDescription>Ndryshimet më të fundit në ftesa, përgjigje dhe tavolina.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {activities.length > 0 ? (
                <>
                  <DataTable>
                    <TableHeader>
                      {activityTable.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} className="px-6">
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {activityTable.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="px-6">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </DataTable>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[240px] text-center p-10">
                  <History size={36} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">Nuk ka aktivitet të fundit për të treguar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
