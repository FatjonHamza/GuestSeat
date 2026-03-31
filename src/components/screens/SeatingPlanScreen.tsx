import React, { useState } from 'react';
import {
  GripVertical,
  PlusCircle,
  Inbox,
  X,
  UserPlus,
  Users,
} from 'lucide-react';
import { GuestGroup, Table } from '../../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SeatingPlanScreenProps {
  groups: GuestGroup[];
  tables: Table[];
  onAssign: (gid: string, tid: string | undefined) => void;
  onCreateTable: (name: string, capacity: number) => Promise<void>;
  onCreateGuest: (guest: Partial<GuestGroup>) => Promise<void>;
}

export const SeatingPlanScreen: React.FC<SeatingPlanScreenProps> = ({ groups, tables, onAssign, onCreateTable, onCreateGuest }) => {
  const unassignedGroups = groups.filter(g => !g.tableId);
  const [isSidebarOver, setIsSidebarOver] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOverTableId, setDragOverTableId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, groupId: string) => {
    e.dataTransfer.setData('groupId', groupId);
  };

  const handleDrop = (e: React.DragEvent, tableId: string | undefined) => {
    e.preventDefault();
    const groupId = e.dataTransfer.getData('groupId');
    if (groupId) {
      onAssign(groupId, tableId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleAddTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateTable(newTableName.trim(), newTableCapacity);
      setIsAddTableOpen(false);
      setNewTableName('');
      setNewTableCapacity(10);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Plani i Uljes</h1>
          <p className="text-sm text-muted-foreground">Menaxhoni caktimet e tavolinave dhe kapacitetin e secilës tavolinë.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => onCreateGuest({ attendees: ['Mysafir i ri'] })}>
            <UserPlus size={16} />
            Shto mysafirin e ri
          </Button>
          <Button
            onClick={() => {
              setNewTableName(`Tavolina ${tables.length + 1}`);
              setNewTableCapacity(10);
              setIsAddTableOpen(true);
            }}
          >
            <PlusCircle size={16} />
            Shto Tavolinë
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        <Card
          onDragOver={(e) => { handleDragOver(e); setIsSidebarOver(true); }}
          onDragLeave={() => setIsSidebarOver(false)}
          onDrop={(e) => { handleDrop(e, undefined); setIsSidebarOver(false); }}
          className={isSidebarOver ? 'ring-2 ring-primary/30 border-primary/50' : ''}
        >
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Të paatribuar</CardTitle>
              <Badge variant="secondary">{unassignedGroups.length} grupe</Badge>
            </div>
            <CardDescription>Tërhiqni grupet në tavolina ose përdorni menynë e caktimit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto overflow-x-hidden px-4 py-1">
            {unassignedGroups.length > 0 ? (
              unassignedGroups.map((group) => (
                <Card
                  key={group.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, group.id)}
                  className="w-full max-w-full cursor-grab active:cursor-grabbing border border-border/80 ring-0 shadow-sm"
                  size="sm"
                >
                  <CardContent className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{group.attendees[0] || 'Grupi i të ftuarve'}</p>
                        <p className="text-xs text-muted-foreground">{group.groupSize} anëtarë</p>
                      </div>
                      <GripVertical size={16} className="text-muted-foreground" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.attendees.slice(0, 3).map((name, i) => (
                        <Badge key={i} variant="outline">{name}</Badge>
                      ))}
                      {group.attendees.length > 3 && (
                        <Badge variant="outline">+{group.attendees.length - 3}</Badge>
                      )}
                    </div>
                    <Select onValueChange={(value) => onAssign(group.id, value || undefined)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Atribuo në tavolinë..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                <Inbox size={28} className="mx-auto mb-2 opacity-60" />
                <p className="text-sm">Nuk ka grupe të paatribuar.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tables.map((table) => {
            const assignedGroups = groups.filter(g => g.tableId === table.id);
            const currentTotal = assignedGroups.reduce((acc, g) => acc + g.groupSize, 0);
            const isOverCapacity = currentTotal > table.capacity;
            const isFull = currentTotal === table.capacity;
            const isOver = dragOverTableId === table.id;

            return (
              <Card
                key={table.id}
                onDragOver={(e) => { handleDragOver(e); setDragOverTableId(table.id); }}
                onDragLeave={() => setDragOverTableId(null)}
                onDrop={(e) => { handleDrop(e, table.id); setDragOverTableId(null); }}
                className={isOver ? 'ring-2 ring-primary/30 border-primary/50' : ''}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">{table.name}</CardTitle>
                    <Badge variant={isOverCapacity ? 'destructive' : isFull ? 'secondary' : 'outline'}>
                      {currentTotal}/{table.capacity}
                    </Badge>
                  </div>
                  <CardDescription>
                    {isOverCapacity ? `Mbi kapacitet me ${currentTotal - table.capacity}` : isFull ? 'Tavolina është plot' : 'Ka vende të lira'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 min-h-[150px]">
                  {assignedGroups.length > 0 ? (
                    assignedGroups.map(group => (
                      <div
                        key={group.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, group.id)}
                        className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm cursor-grab active:cursor-grabbing"
                      >
                        <span className="truncate">{group.attendees[0]}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{group.groupSize}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onAssign(group.id, undefined)}
                            className="h-7 w-7"
                            title="Hiq nga tavolina"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full min-h-[100px] flex items-center justify-center text-muted-foreground text-sm">
                      Lëshoni grupet këtu
                    </div>
                  )}
                </CardContent>
                {isOverCapacity && (
                  <CardFooter>
                    <p className="text-xs text-destructive font-medium">
                      Veprimi i kërkuar: Zhvendosni {currentTotal - table.capacity} të ftuar.
                    </p>
                  </CardFooter>
                )}
              </Card>
            );
          })}

          <Card className="border-dashed">
            <CardContent className="min-h-[220px] flex flex-col items-center justify-center text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setNewTableName(`Tavolina ${tables.length + 1}`);
                  setNewTableCapacity(10);
                  setIsAddTableOpen(true);
                }}
              >
                <PlusCircle size={16} />
                Tavolinë e re
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isAddTableOpen} onOpenChange={setIsAddTableOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Shto Tavolinë</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTableSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tableName">Emri i tavolinës</Label>
              <Input
                id="tableName"
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="p.sh. Tavolina 1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tableCapacity">Numri i vendeve</Label>
              <Input
                id="tableCapacity"
                type="number"
                min={1}
                max={999}
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(Number(e.target.value) || 1)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddTableOpen(false)}>
                Anulo
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Duke shtuar...' : 'Shto Tavolinën'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
