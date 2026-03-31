import React, { useState, useMemo } from 'react';
import { 
  ArrowUpDown,
  ChevronDown,
  UserPlus, 
  ChevronRight, 
  X,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  Mail,
  User,
  MapPin
} from 'lucide-react';
import { GuestGroup, Table, Invitation, RSVPStatus } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table as DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  ColumnFiltersState,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

type DisplayItem = {
  id: string;
  type: 'group' | 'invitation';
  name: string;
  attendees: string[];
  size: number;
  tableId: string | null;
  status: RSVPStatus;
  arrivedAt?: string;
  note?: string;
};

interface GuestListScreenProps {
  groups: GuestGroup[];
  tables: Table[];
  invitations: Invitation[];
  onCreateGuest: (guest: Partial<GuestGroup>) => Promise<void>;
  onUpdateGuest: (id: string, data: Partial<Pick<GuestGroup, 'attendees' | 'note' | 'tableId'>>) => Promise<void>;
  onDeleteGuest: (id: string) => Promise<void>;
}

type FilterStatus = RSVPStatus | 'All';

export const GuestListScreen: React.FC<GuestListScreenProps> = ({ groups, tables, invitations, onCreateGuest, onUpdateGuest, onDeleteGuest }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<DisplayItem | null>(null);
  const [detailEditAttendees, setDetailEditAttendees] = useState<string[]>([]);
  const [detailEditNote, setDetailEditNote] = useState('');
  const [detailEditTableId, setDetailEditTableId] = useState<string>('');
  const [isDetailSaving, setIsDetailSaving] = useState(false);
  const [isDetailDeleting, setIsDetailDeleting] = useState(false);
  
  // Modal state
  const [newGuestAttendees, setNewGuestAttendees] = useState<string[]>(['']);
  const [newGuestNote, setNewGuestNote] = useState('');
  const [newGuestTableId, setNewGuestTableId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTableName = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    return table ? table.name : tableId;
  };

  // Merge invitations and groups for a comprehensive list
  const displayList = useMemo((): DisplayItem[] => {
    const list: DisplayItem[] = [];

    groups.forEach(group => {
      list.push({
        id: group.id,
        type: 'group',
        name: group.attendees[0] || 'Guest Group',
        attendees: group.attendees,
        size: group.groupSize,
        tableId: group.tableId ?? null,
        status: 'Responded' as RSVPStatus,
        arrivedAt: group.arrivedAt,
        note: group.note
      });
    });

    invitations.forEach(invitation => {
      const hasGroup = groups.some(g => g.invitationId === invitation.id);
      if (!hasGroup && invitation.status !== 'Responded') {
        list.push({
          id: invitation.id,
          type: 'invitation',
          name: invitation.inviteeName,
          attendees: [invitation.inviteeName],
          size: invitation.allowedGuests,
          tableId: null,
          status: invitation.status,
          arrivedAt: undefined,
          note: ''
        });
      }
    });

    return list;
  }, [groups, invitations]);

  const openGuestDetail = (item: DisplayItem) => {
    setSelectedGuest(item);
    setDetailEditAttendees([...item.attendees]);
    setDetailEditNote(item.note ?? '');
    setDetailEditTableId(item.tableId ?? '');
  };

  const handleDetailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest || selectedGuest.type !== 'group') return;
    const validAttendees = detailEditAttendees.filter(a => a.trim() !== '');
    if (validAttendees.length === 0) return;
    setIsDetailSaving(true);
    try {
      await onUpdateGuest(selectedGuest.id, {
        attendees: validAttendees,
        note: detailEditNote.trim() || undefined,
        tableId: detailEditTableId || undefined
      });
      setSelectedGuest(null);
    } finally {
      setIsDetailSaving(false);
    }
  };

  const handleDetailDelete = async () => {
    if (!selectedGuest || selectedGuest.type !== 'group') return;
    if (!window.confirm('A jeni të sigurt që dëshironi të fshini këtë grupe të ftuarish?')) return;
    setIsDetailDeleting(true);
    try {
      await onDeleteGuest(selectedGuest.id);
      setSelectedGuest(null);
    } finally {
      setIsDetailDeleting(false);
    }
  };

  const handleDetailAddAttendee = () => setDetailEditAttendees([...detailEditAttendees, '']);
  const handleDetailRemoveAttendee = (index: number) => {
    if (detailEditAttendees.length > 1) {
      setDetailEditAttendees(detailEditAttendees.filter((_, i) => i !== index));
    }
  };
  const handleDetailAttendeeChange = (index: number, value: string) => {
    const next = [...detailEditAttendees];
    next[index] = value;
    setDetailEditAttendees(next);
  };

  const filteredList = displayList;

  const handleAddAttendee = () => {
    setNewGuestAttendees([...newGuestAttendees, '']);
  };

  const handleRemoveAttendee = (index: number) => {
    if (newGuestAttendees.length > 1) {
      const updated = [...newGuestAttendees];
      updated.splice(index, 1);
      setNewGuestAttendees(updated);
    }
  };

  const handleAttendeeChange = (index: number, value: string) => {
    const updated = [...newGuestAttendees];
    updated[index] = value;
    setNewGuestAttendees(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validAttendees = newGuestAttendees.filter(a => a.trim() !== '');
    if (validAttendees.length === 0) return;

    setIsSubmitting(true);
    try {
      await onCreateGuest({
        attendees: validAttendees,
        note: newGuestNote,
        tableId: newGuestTableId || undefined
      });
      setIsModalOpen(false);
      setNewGuestAttendees(['']);
      setNewGuestNote('');
      setNewGuestTableId('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: RSVPStatus) => {
    switch (status) {
      case 'Responded': return 'text-emerald-600 bg-emerald-500';
      case 'Sent': return 'text-blue-600 bg-blue-500';
      case 'Draft': return 'text-slate-400 bg-slate-400';
      default: return 'text-slate-400 bg-slate-400';
    }
  };

  const getStatusIcon = (status: RSVPStatus) => {
    switch (status) {
      case 'Responded': return <CheckCircle2 size={14} />;
      case 'Sent': return <Mail size={14} />;
      case 'Draft': return <Clock size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const columns = useMemo<ColumnDef<DisplayItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Emri i Grupit
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="size-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold">
                {item.name[0] || 'G'}
              </div>
              <span className="font-semibold">{item.name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'attendees',
        header: 'Pjesëmarrësit',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.attendees.join(', ')}
          </span>
        ),
      },
      {
        accessorKey: 'size',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Madhësia
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.size}</span>
        ),
      },
      {
        accessorKey: 'tableId',
        header: 'Tavolina e Atribuar',
        cell: ({ row }) => {
          const item = row.original;
          return item.tableId ? (
            <Badge className="bg-primary/10 text-primary border border-primary/20">
              {getTableName(item.tableId)}
            </Badge>
          ) : (
            <Badge variant="secondary" className="italic">
              Të paatribuar
            </Badge>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Statusi',
        cell: ({ row }) => {
          const item = row.original;
          if (item.arrivedAt) {
            return (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <span className="size-2 rounded-full bg-emerald-600"></span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  Ka arritur
                </span>
              </span>
            );
          }
          return (
            <span className={`flex items-center gap-1.5 text-sm font-medium ${getStatusColor(item.status).split(' ')[0]}`}>
              <span className={`size-2 rounded-full ${getStatusColor(item.status).split(' ')[1]}`}></span>
              <span className="flex items-center gap-1">
                {getStatusIcon(item.status)}
                {item.status === 'Responded' ? 'Përgjigjur' : item.status === 'Sent' ? 'Dërguar' : 'Draft'}
              </span>
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: () => (
          <div className="flex justify-end">
            <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors" size={20} />
          </div>
        ),
      },
    ],
    [tables]
  );

  const table = useReactTable<DisplayItem>({
    data: filteredList,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Menaxhimi i të Ftuarve</h1>
          <p className="text-sm text-muted-foreground">Menaxhoni përgjigjet, caktimet e ulëseve dhe grupet e të ftuarve.</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="outline"
          size="lg"
        >
          <UserPlus size={20} />
          <span>Shto të Ftuar</span>
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filtro të ftuarit..."
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('name')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>

        <div className="overflow-x-auto rounded-md border bg-card">
          <DataTable>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
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
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => openGuestDetail(row.original)}
                    className="cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Nuk ka rezultate.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </DataTable>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} rreshta.
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Add Guest Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-primary/5">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <UserPlus className="text-primary" size={24} />
                  Shto Grupin e Ri të të Ftuarve
                </h3>
                <Button
                  onClick={() => setIsModalOpen(false)}
                  variant="ghost"
                  size="icon"
                >
                  <X size={20} />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pjesëmarrësit</label>
                  <div className="space-y-3">
                    {newGuestAttendees.map((attendee, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          required
                          value={attendee}
                          onChange={(e) => handleAttendeeChange(index, e.target.value)}
                          className="h-12 bg-slate-50 font-medium"
                          placeholder={`Emri i të Ftuarit ${index + 1}`}
                        />
                        {newGuestAttendees.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => handleRemoveAttendee(index)}
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={20} />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      onClick={handleAddAttendee}
                      variant="link"
                    >
                      <Plus size={16} />
                      Shto një pjesëmarrës tjetër
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Atribuo në Tavolinë (Opsionale)</label>
                  <select 
                    value={newGuestTableId}
                    onChange={(e) => setNewGuestTableId(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                  >
                    <option value="">Të paatribuar</option>
                    {tables.map(table => (
                      <option key={table.id} value={table.id}>{table.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shënime</label>
                  <Textarea
                    value={newGuestNote}
                    onChange={(e) => setNewGuestNote(e.target.value)}
                    rows={3}
                    className="p-4 bg-slate-50 font-medium resize-none"
                    placeholder="Kërkesat dietike, kërkesa të veçanta..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    variant="ghost"
                    size="lg"
                    className="flex-1"
                  >
                    Anulo
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="flex-[2]"
                  >
                    {isSubmitting ? 'Duke shtuar...' : 'Shto Grupin e të Ftuarve'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guest detail / manage modal */}
      <AnimatePresence>
        {selectedGuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedGuest(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-primary/5">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <User className="text-primary" size={22} />
                  {selectedGuest.type === 'group' ? 'Detajet e të ftuarit' : 'Ftesa'}
                </h3>
                <Button type="button" onClick={() => setSelectedGuest(null)} variant="ghost" size="icon">
                  <X size={20} />
                </Button>
              </div>

              {selectedGuest.type === 'invitation' ? (
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Statusi i ftesës</p>
                    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${getStatusColor(selectedGuest.status).split(' ')[0]}`}>
                      <span className={`size-2 rounded-full ${getStatusColor(selectedGuest.status).split(' ')[1]}`} />
                      {selectedGuest.status === 'Responded' ? 'Përgjigjur' : selectedGuest.status === 'Sent' ? 'Dërguar' : 'Draft'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">I ftuari</p>
                    <p className="font-semibold text-slate-800">{selectedGuest.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Vende të lejuara</p>
                    <p className="font-medium text-slate-700">{selectedGuest.size}</p>
                  </div>
                  <p className="text-sm text-slate-500 italic">Kjo ftesë nuk ka përgjigjur ende. Nuk mund të redaktoni grupin këtu.</p>
                  <div className="pt-4">
                    <Button type="button" onClick={() => setSelectedGuest(null)} variant="secondary" className="w-full">
                      Mbyll
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleDetailSave} className="p-6 space-y-5">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Statusi i ftesës</p>
                    {selectedGuest.arrivedAt ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                        <CheckCircle2 size={16} />
                        Ka arritur
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                        <CheckCircle2 size={16} />
                        Përgjigjur
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pjesëmarrësit</label>
                    <div className="space-y-2">
                      {detailEditAttendees.map((name, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={name}
                            onChange={(e) => handleDetailAttendeeChange(index, e.target.value)}
                            className="h-11 bg-slate-50 border-slate-200 font-medium text-sm"
                            placeholder={`Emri ${index + 1}`}
                          />
                          {detailEditAttendees.length > 1 && (
                            <Button type="button" onClick={() => handleDetailRemoveAttendee(index)} variant="ghost" size="icon" className="text-red-400 hover:bg-red-50">
                              <Trash2 size={18} />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" onClick={handleDetailAddAttendee} variant="link">
                        <Plus size={16} />
                        Shto pjesëmarrës
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <MapPin size={14} /> Tavolina
                    </label>
                    <select
                      value={detailEditTableId}
                      onChange={(e) => setDetailEditTableId(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary/50 font-medium text-sm"
                    >
                      <option value="">Të paatribuar</option>
                      {tables.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Shënime</label>
                    <Textarea
                      value={detailEditNote}
                      onChange={(e) => setDetailEditNote(e.target.value)}
                      rows={3}
                      className="p-4 bg-slate-50 border-slate-200 font-medium text-sm resize-none"
                      placeholder="Kërkesa dietike, shënime..."
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      onClick={handleDetailDelete}
                      disabled={isDetailDeleting}
                      variant="destructive"
                      size="lg"
                      className="flex-1"
                    >
                      <Trash2 size={18} />
                      {isDetailDeleting ? 'Duke fshirë...' : 'Fshi'}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isDetailSaving}
                      size="lg"
                      className="flex-[2]"
                    >
                      {isDetailSaving ? 'Duke ruajtur...' : 'Ruaj ndryshimet'}
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
