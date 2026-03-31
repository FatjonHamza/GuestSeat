import React, { useMemo, useState } from 'react';
import { ClientAccount, ClientAnalytics } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserPlus, Trash2, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SuperAdminScreenProps {
  clients: ClientAccount[];
  analytics: ClientAnalytics;
  onCreateClient: (payload: Omit<ClientAccount, 'id' | 'createdAt'>) => Promise<{ id: string; success: boolean; emailSent: boolean; message: string }>;
  onUpdateClient: (id: string, payload: Partial<Omit<ClientAccount, 'id' | 'createdAt'>>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
}

const emptyForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  accessStart: '',
  accessEnd: '',
  isActive: true,
};

type ClientForm = typeof emptyForm;

export const SuperAdminScreen: React.FC<SuperAdminScreenProps> = ({
  clients,
  analytics,
  onCreateClient,
  onUpdateClient,
  onDeleteClient,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientAccount | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [query, setQuery] = useState('');
  const [createFeedback, setCreateFeedback] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) =>
      `${client.firstName} ${client.lastName} ${client.email} ${client.phone}`.toLowerCase().includes(q),
    );
  }, [clients, query]);

  const resetForm = () => setForm(emptyForm);

  const openEdit = (client: ClientAccount) => {
    setEditingClient(client);
    setForm({
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      email: client.email,
      accessStart: client.accessStart,
      accessEnd: client.accessEnd,
      isActive: client.isActive,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateFeedback(null);
    try {
      const result = await onCreateClient(form);
      setCreateFeedback({
        type: result.emailSent ? 'success' : 'warning',
        message: result.message,
      });
      setIsCreateOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setIsSubmitting(true);
    try {
      await onUpdateClient(editingClient.id, form);
      setEditingClient(null);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = (onSubmit: (e: React.FormEvent) => Promise<void>, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Emri</Label>
          <Input
            id="firstName"
            value={form.firstName}
            onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Mbiemri</Label>
          <Input
            id="lastName"
            value={form.lastName}
            onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Numri i telefonit</Label>
        <Input
          id="phone"
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="accessStart">Fillimi i aksesit</Label>
          <Input
            id="accessStart"
            type="date"
            value={form.accessStart}
            onChange={(e) => setForm((prev) => ({ ...prev, accessStart: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accessEnd">Mbarimi i aksesit</Label>
          <Input
            id="accessEnd"
            type="date"
            value={form.accessEnd}
            onChange={(e) => setForm((prev) => ({ ...prev, accessEnd: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={form.isActive ? 'default' : 'outline'}
          onClick={() => setForm((prev) => ({ ...prev, isActive: true }))}
        >
          Aktiv
        </Button>
        <Button
          type="button"
          variant={!form.isActive ? 'default' : 'outline'}
          onClick={() => setForm((prev) => ({ ...prev, isActive: false }))}
        >
          Jo aktiv
        </Button>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Duke ruajtur...' : submitLabel}
      </Button>
    </form>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paneli SuperAdmin</h1>
          <p className="text-muted-foreground mt-1">Menaxhoni klientët dhe afatet e aksesit të platformës.</p>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus size={16} />
              Shto klient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Krijo klient të ri</DialogTitle>
            </DialogHeader>
            {renderForm(handleCreate, 'Krijo klientin')}
          </DialogContent>
        </Dialog>
      </div>
      {createFeedback && (
        <Alert variant={createFeedback.type === 'warning' ? 'destructive' : 'default'}>
          <AlertDescription>{createFeedback.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totali i klientëve</CardDescription>
            <CardTitle className="text-3xl">{analytics.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Klientë aktivë</CardDescription>
            <CardTitle className="text-3xl">{analytics.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Akses i skaduar</CardDescription>
            <CardTitle className="text-3xl">{analytics.expired}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Skadojnë së shpejti (30 ditë)</CardDescription>
            <CardTitle className="text-3xl">{analytics.expiringSoon}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users size={18} />
            Menaxhimi i klientëve
          </CardTitle>
          <CardDescription>Shikoni, ndryshoni ose fshini aksesin e klientëve.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kërko sipas emrit, emailit ose telefonit..."
          />
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klienti</TableHead>
                  <TableHead>Kontakti</TableHead>
                  <TableHead>Aksesi</TableHead>
                  <TableHead>Statusi</TableHead>
                  <TableHead className="text-right">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length ? (
                  filtered.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.firstName} {client.lastName}</TableCell>
                      <TableCell>
                        <div className="text-sm">{client.email}</div>
                        <div className="text-xs text-muted-foreground">{client.phone}</div>
                      </TableCell>
                      <TableCell>{client.accessStart} - {client.accessEnd}</TableCell>
                      <TableCell>
                        <Badge variant={client.isActive ? 'default' : 'secondary'} className="gap-1">
                          <ShieldCheck size={12} />
                          {client.isActive ? 'Aktiv' : 'Jo aktiv'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Dialog
                          open={editingClient?.id === client.id}
                          onOpenChange={(open) => {
                            if (!open) {
                              setEditingClient(null);
                              resetForm();
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => openEdit(client)}>
                              Ndrysho
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Ndrysho klientin</DialogTitle>
                            </DialogHeader>
                            {renderForm(handleUpdate, 'Ruaj ndryshimet')}
                          </DialogContent>
                        </Dialog>
                        <Button variant="destructive" size="sm" onClick={() => void onDeleteClient(client.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                      Nuk u gjet asnjë klient.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
