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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface CheckInScreenProps {
  groups: GuestGroup[];
  tables: Table[];
  onMarkArrived: (groupId: string) => Promise<void>;
}

export const CheckInScreen: React.FC<CheckInScreenProps> = ({ groups, tables, onMarkArrived }) => {
  const [search, setSearch] = useState('');

  const filteredGroups = groups.filter(g => 
    g.attendees.some(a => a.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Kerko mysafirin</h1>
        <p className="text-sm text-muted-foreground">Gjeni shpejt vendin e të ftuarve gjatë mbërritjes.</p>
      </div>

      <Card>
        <CardContent className="p-4 md:p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-11 text-base pl-10"
                placeholder="Kërkoni me çdo emër të të ftuarit..."
              />
            </div>
            {search && (
              <Button variant="outline" onClick={() => setSearch('')}>
                Pastro
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {search ? `${filteredGroups.length} rezultate` : 'Shkruani një emër për të filluar kërkimin.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pt-2">
            {search.length > 0 ? (
              filteredGroups.map(group => {
                const table = tables.find(t => t.id === group.tableId);
                return (
                  <Card key={group.id} className="group">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle>{group.attendees[0]}</CardTitle>
                          <CardDescription>Grupi prej {group.groupSize}</CardDescription>
                        </div>
                        <Badge variant={table ? 'default' : 'outline'} className="inline-flex items-center gap-1.5">
                          <Grid size={14} />
                          {table ? table.name : 'Pa tavolinë'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Pjesëmarrësit</p>
                      <div className="flex flex-wrap gap-2">
                        {group.attendees.map((name, i) => (
                          <Badge key={i} variant="secondary" className="inline-flex items-center gap-1.5 py-1">
                            <UserCheck size={12} />
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="justify-between">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 size={16} />
                        <span className="text-sm font-medium">{group.arrivedAt ? 'Ka arritur' : 'Ftesa e konfirmuar'}</span>
                      </div>
                      <Button
                        size="sm"
                        variant={group.arrivedAt ? 'secondary' : 'default'}
                        disabled={Boolean(group.arrivedAt)}
                        onClick={() => {
                          void onMarkArrived(group.id);
                        }}
                      >
                        {group.arrivedAt ? 'Ka arritur' : 'Shëno si i mbërritur'}
                      </Button>
                    </CardFooter>
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
        </CardContent>
      </Card>
    </div>
  );
};
