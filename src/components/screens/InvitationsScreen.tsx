import React, { useMemo, useState } from 'react';
import { 
  Plus, 
  Mail,
  Copy,
  CheckCircle2,
  ArrowUpDown,
  Trash2
} from 'lucide-react';
import { Invitation, Screen } from '../../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

interface InvitationsScreenProps {
  invitations: Invitation[];
  onCreateInvitation: (invitation: Partial<Invitation>) => void;
  onDeleteInvitation: (id: string) => Promise<void>;
  onNavigate: (screen: Screen) => void;
}

export const InvitationsScreen: React.FC<InvitationsScreenProps> = ({ invitations, onCreateInvitation, onDeleteInvitation }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [newInvite, setNewInvite] = useState({
    inviteeName: '',
    email: '',
    allowedGuests: 1
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateInvitation(newInvite);
    setShowCreate(false);
    setNewInvite({ inviteeName: '', email: '', allowedGuests: 1 });
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/rsvp/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 1800);
  };

  const columns = useMemo<ColumnDef<Invitation>[]>(
    () => [
      {
        accessorKey: 'inviteeName',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="h-8 px-2 lg:px-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            I ftuari
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span className="font-bold text-slate-900">{row.original.inviteeName}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Statusi',
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              className={`text-[10px] font-bold uppercase ${
                status === 'Responded'
                  ? 'bg-green-100 text-green-700'
                  : status === 'Sent'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {status === 'Responded' ? 'Përgjigjur' : status === 'Sent' ? 'Dërguar' : 'Draft'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'allowedGuests',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="h-8 px-2 lg:px-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Të ftuar
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span className="text-sm text-slate-600 font-medium">{row.original.allowedGuests}</span>,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => <span className="text-sm text-slate-500">{row.original.email?.trim() || '-'}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="h-8 px-2 lg:px-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Krijuar
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-slate-500">
            {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '-'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Veprimet</div>,
        cell: ({ row }) => {
          const invite = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                onClick={() => copyLink(invite.token)}
                variant="ghost"
                size="icon"
                className={`h-8 w-8 p-0 ${
                  copiedToken === invite.token
                    ? 'bg-emerald-100 text-emerald-700'
                    : ''
                }`}
                title={copiedToken === invite.token ? 'U kopjua!' : 'Kopjo linkun'}
              >
                {copiedToken === invite.token ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (window.confirm('Fshi këtë ftesë?')) {
                    void onDeleteInvitation(invite.id);
                  }
                }}
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                title="Fshi ftesën"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          );
        },
      },
    ],
    [copiedToken, onDeleteInvitation]
  );

  const table = useReactTable({
    data: invitations,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Ftesat</h1>
          <p className="text-sm text-muted-foreground">Krijoni linqe unike dhe dërgojini ato të ftuarve tuaj.</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          size="lg"
        >
          <Plus size={20} />
          <span>Krijo Ftesë</span>
        </Button>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-slate-100">
            <DialogTitle>Ftesë e Re</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Emri i të Ftuarit</label>
                <Input
                  required
                  value={newInvite.inviteeName}
                  onChange={e => setNewInvite({...newInvite, inviteeName: e.target.value})}
                  placeholder="p.sh. Arben Krasniqi"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Email (Opsionale)</label>
                <Input
                  type="email"
                  value={newInvite.email}
                  onChange={e => setNewInvite({...newInvite, email: e.target.value})}
                  placeholder="arben@email.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Të ftuar të lejuar</label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={newInvite.allowedGuests}
                  onChange={e => setNewInvite({...newInvite, allowedGuests: parseInt(e.target.value)})}
                />
              </div>
              <Button type="submit" className="w-full">
                Gjenero Ftesën
              </Button>
            </form>
        </DialogContent>
      </Dialog>

      <div>
        <div className="flex items-center py-4">
          <Input
            placeholder="Kërko sipas emrit..."
            value={(table.getColumn('inviteeName')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('inviteeName')?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Ende nuk është krijuar asnjë ftesë.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">{table.getFilteredRowModel().rows.length} rreshta.</div>
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

      {invitations.length === 0 && (
        <div className="flex justify-center">
          <Button onClick={() => setShowCreate(true)} variant="link">
            Krijoni ftesën tuaj të parë
          </Button>
        </div>
      )}
    </div>
  );
};
