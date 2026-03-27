import React, { useState } from 'react';
import { 
  Search, 
  CheckCircle2, 
  Grid, 
  UserCheck,
  XCircle
} from 'lucide-react';
import { GuestGroup, Table } from '../../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface CheckInScreenProps {
  groups: GuestGroup[];
  tables: Table[];
}

export const CheckInScreen: React.FC<CheckInScreenProps> = ({ groups, tables }) => {
  const [search, setSearch] = useState('');

  const filteredGroups = groups.filter(g => 
    g.attendees.some(a => a.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight">Kerko mysafirin</h1>
        <p className="text-slate-500 text-sm">Gjeni shpejt vendin e të ftuarve gjatë mbërritjes.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
        <Input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-20 pl-16 pr-6 rounded-3xl bg-white shadow-xl text-xl placeholder:text-slate-300" 
          placeholder="Kërkoni me çdo emër të të ftuarit..." 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {search.length > 0 ? (
          filteredGroups.map(group => {
            const table = tables.find(t => t.id === group.tableId);
            return (
              <Card key={group.id} className="rounded-3xl border-primary/5 hover:border-primary/20 transition-all group">
                <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{group.attendees[0]}</h3>
                    <p className="text-slate-500 font-medium">Grupi prej {group.groupSize}</p>
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex flex-col items-center justify-center text-primary">
                    <Grid size={24} />
                    <span className="text-[10px] font-bold uppercase mt-1">Tavolina</span>
                    <span className="text-lg font-black leading-none">{table ? table.name.replace('Table ', '').replace('Tavolina ', '') : '?'}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pjesëmarrësit</p>
                  <div className="flex flex-wrap gap-2">
                    {group.attendees.map((name, i) => (
                      <div key={i} className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <UserCheck size={14} className="text-primary" />
                        <span className="text-sm font-semibold text-slate-700">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 size={20} />
                    <span className="font-bold text-sm">RSVP e Konfirmuar</span>
                  </div>
                  <Button className="h-8 px-4 text-xs font-bold opacity-0 group-hover:opacity-100 transition-all">
                    Shëno si i Mbërritur
                  </Button>
                </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300">
            <Search size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Filloni të shkruani për të gjetur një të ftuar...</p>
          </div>
        )}
        {search.length > 0 && filteredGroups.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300">
            <XCircle size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Nuk u gjet asnjë i ftuar që përputhet me "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
};
