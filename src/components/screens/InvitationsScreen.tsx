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
  Filter
} from 'lucide-react';
import { motion } from 'motion/react';
import { Invitation, Screen, RSVPStatus } from '../../types';

interface InvitationsScreenProps {
  invitations: Invitation[];
  onCreateInvitation: (invitation: Partial<Invitation>) => void;
  onNavigate: (screen: Screen) => void;
}

type ViewMode = 'grid' | 'list';
type FilterStatus = 'All' | RSVPStatus;

export const InvitationsScreen: React.FC<InvitationsScreenProps> = ({ invitations, onCreateInvitation, onNavigate }) => {
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
        <button 
          onClick={() => setShowCreate(true)}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg h-12 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          <Plus size={20} />
          <span>Krijo Ftesë</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-primary/10 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={18} className="text-slate-400 ml-2" />
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            {([['All', 'Të gjitha'], ['Draft', 'Draft'], ['Sent', 'Dërguar'], ['Responded', 'Përgjigjur']] as [FilterStatus, string][]).map(([status, label]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === status 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">Ftesë e Re</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                <ArrowLeft size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Emri i të Ftuarit</label>
                <input 
                  required
                  value={newInvite.inviteeName}
                  onChange={e => setNewInvite({...newInvite, inviteeName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/50 transition-all" 
                  placeholder="p.sh. Arben Krasniqi"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Email (Opsionale)</label>
                <input 
                  type="email"
                  value={newInvite.email}
                  onChange={e => setNewInvite({...newInvite, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/50 transition-all" 
                  placeholder="arben@email.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Të ftuar të lejuar</label>
                <input 
                  type="number"
                  min="1"
                  required
                  value={newInvite.allowedGuests}
                  onChange={e => setNewInvite({...newInvite, allowedGuests: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/50 transition-all" 
                />
              </div>
              <button type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                Gjenero Ftesën
              </button>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvitations.map((invite) => (
            <div key={invite.id} className="bg-white rounded-2xl border border-primary/10 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Mail size={24} />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    invite.status === 'Responded' ? 'bg-green-100 text-green-700' :
                    invite.status === 'Sent' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {invite.status === 'Responded' ? 'Përgjigjur' : invite.status === 'Sent' ? 'Dërguar' : 'Draft'}
                  </div>
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
                  <button className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all">
                    <Send size={16} />
                  </button>
                </div>
              </div>
              {invite.status === 'Responded' && (
                <div className="px-6 py-3 bg-green-50 border-t border-green-100 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-600" />
                  <span className="text-[10px] font-bold text-green-700 uppercase">U përgjigj më {new Date(invite.respondedAt!).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-primary/10 bg-primary/5">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">I ftuari</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Statusi</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Të ftuar</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Email</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Veprimet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {filteredInvitations.map((invite) => (
                <tr key={invite.id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900">{invite.inviteeName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      invite.status === 'Responded' ? 'bg-green-100 text-green-700' :
                      invite.status === 'Sent' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {invite.status === 'Responded' ? 'Përgjigjur' : invite.status === 'Sent' ? 'Dërguar' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {invite.allowedGuests}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {invite.email || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
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
                      <button className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all" title="Send">
                        <Send size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredInvitations.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
          <Mail size={48} className="mb-4 opacity-20" />
          <p className="font-medium">
            {statusFilter === 'All' ? 'Ende nuk është krijuar asnjë ftesë.' : `Nuk u gjet asnjë ftesë ${statusFilter === 'Responded' ? 'e përgjigjur' : statusFilter === 'Sent' ? 'e dërguar' : 'draft'}.`}
          </p>
          {statusFilter === 'All' && (
            <button onClick={() => setShowCreate(true)} className="mt-4 text-primary font-bold hover:underline">
              Krijoni ftesën tuaj të parë
            </button>
          )}
        </div>
      )}
    </div>
  );
};
