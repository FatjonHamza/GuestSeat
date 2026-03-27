import React, { useState } from 'react';
import { 
  Plus, 
  Mail, 
  Copy, 
  CheckCircle2, 
  Clock, 
  MoreVertical,
  Send,
  UserPlus,
  ArrowLeft,
  LayoutGrid,
  List,
  Filter,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Invitation, Screen, RSVPStatus } from '../../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InvitationsScreenProps {
  invitations: Invitation[];
  onCreateInvitation: (invitation: Partial<Invitation>) => void;
  onDeleteInvitation: (id: string) => Promise<void>;
  onNavigate: (screen: Screen) => void;
}

type ViewMode = 'grid' | 'list';
type FilterStatus = 'All' | RSVPStatus;

export const InvitationsScreen: React.FC<InvitationsScreenProps> = ({ invitations, onCreateInvitation, onDeleteInvitation, onNavigate }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');
  const [newInvite, setNewInvite] = useState({
    inviteeName: '',
    email: '',
    allowedGuests: 1
  });
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

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
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const filteredInvitations = invitations.filter(invite => 
    statusFilter === 'All' ? true : invite.status === statusFilter
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight">Ftesat</h1>
          <p className="text-slate-500 text-sm">Krijoni linqe unike dhe dërgojini ato të ftuarve tuaj.</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="h-12 px-6 text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          <Plus size={20} />
          <span>Krijo Ftesë</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-primary/10 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={18} className="text-slate-400 ml-2" />
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            {([['All', 'Të gjitha'], ['Draft', 'Draft'], ['Sent', 'Dërguar'], ['Responded', 'Përgjigjur']] as [FilterStatus, string][]).map(([status, label]) => (
              <Button
                key={status}
                onClick={() => setStatusFilter(status)}
                variant={statusFilter === status ? 'outline' : 'ghost'}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === status 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <Button
            onClick={() => setViewMode('grid')}
            variant={viewMode === 'grid' ? 'outline' : 'ghost'}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutGrid size={20} />
          </Button>
          <Button
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'outline' : 'ghost'}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <List size={20} />
          </Button>
        </div>
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
              <Button type="submit" className="w-full h-10 font-bold shadow-lg shadow-primary/20">
                Gjenero Ftesën
              </Button>
            </form>
        </DialogContent>
      </Dialog>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvitations.map((invite) => (
            <Card key={invite.id} className="rounded-2xl border-primary/10 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Mail size={24} />
                  </div>
                  <Badge className={`text-[10px] font-bold uppercase ${
                    invite.status === 'Responded' ? 'bg-green-100 text-green-700' :
                    invite.status === 'Sent' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {invite.status === 'Responded' ? 'Përgjigjur' : invite.status === 'Sent' ? 'Dërguar' : 'Draft'}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{invite.inviteeName}</h3>
                <p className="text-sm text-slate-500 mt-1">{invite.allowedGuests} të ftuar të lejuar</p>
                
                <div className="mt-6 flex items-center gap-2">
                  <motion.button
                    type="button"
                    onClick={() => copyLink(invite.token)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      copiedToken === invite.token
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                    whileTap={{ scale: 0.98 }}
                    animate={copiedToken === invite.token ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 0.25 }}
                  >
                    {copiedToken === invite.token ? (
                      <>
                        <CheckCircle2 size={14} />
                        U kopjua!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Kopjo Linkun
                      </>
                    )}
                  </motion.button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 bg-primary/10 text-primary hover:bg-primary/20" title="Dërgo">
                    <Send size={16} />
                  </Button>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (window.confirm('Fshi këtë ftesë?')) {
                        void onDeleteInvitation(invite.id);
                      }
                    }}
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
                    title="Fshi ftesën"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
              {invite.status === 'Responded' && (
                <div className="px-6 py-3 bg-green-50 border-t border-green-100 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-600" />
                  <span className="text-[10px] font-bold text-green-700 uppercase">U përgjigj më {new Date(invite.respondedAt!).toLocaleDateString()}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl border-primary/10 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">I ftuari</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Statusi</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Të ftuar</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Email</TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Veprimet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvitations.map((invite) => (
                <TableRow key={invite.id} className="hover:bg-primary/5 transition-colors">
                  <TableCell className="px-6 py-4">
                    <span className="font-bold text-slate-900">{invite.inviteeName}</span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge className={`text-[10px] font-bold uppercase ${
                      invite.status === 'Responded' ? 'bg-green-100 text-green-700' :
                      invite.status === 'Sent' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {invite.status === 'Responded' ? 'Përgjigjur' : invite.status === 'Sent' ? 'Dërguar' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {invite.allowedGuests}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-slate-500">
                    {invite.email || '-'}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <motion.button
                        type="button"
                        onClick={() => copyLink(invite.token)}
                        className={`p-2 rounded-lg transition-all ${
                          copiedToken === invite.token
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                        title={copiedToken === invite.token ? 'U kopjua!' : 'Copy Link'}
                        whileTap={{ scale: 0.9 }}
                        animate={copiedToken === invite.token ? { scale: [1, 1.15, 1] } : {}}
                        transition={{ duration: 0.2 }}
                      >
                        {copiedToken === invite.token ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                      </motion.button>
                      <Button variant="ghost" size="icon" className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all" title="Dërgo">
                        <Send size={16} />
                      </Button>
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (window.confirm('Fshi këtë ftesë?')) void onDeleteInvitation(invite.id);
                        }}
                        variant="ghost"
                        size="icon"
                        className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
                        title="Fshi ftesën"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {filteredInvitations.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
          <Mail size={48} className="mb-4 opacity-20" />
          <p className="font-medium">
            {statusFilter === 'All' ? 'Ende nuk është krijuar asnjë ftesë.' : `Nuk u gjet asnjë ftesë ${statusFilter === 'Responded' ? 'e përgjigjur' : statusFilter === 'Sent' ? 'e dërguar' : 'draft'}.`}
          </p>
          {statusFilter === 'All' && (
            <Button onClick={() => setShowCreate(true)} variant="link" className="mt-4 text-primary font-bold hover:underline">
              Krijoni ftesën tuaj të parë
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
