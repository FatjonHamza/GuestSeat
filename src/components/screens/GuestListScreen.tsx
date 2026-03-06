import React, { useState, useMemo } from 'react';
import { 
  Search, 
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

type DisplayItem = {
  id: string;
  type: 'group' | 'invitation';
  name: string;
  attendees: string[];
  size: number;
  tableId: string | null;
  status: RSVPStatus;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState<string | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');
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

  const filteredList = useMemo(() => {
    return displayList.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.attendees.some((a: string) => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.tableId && getTableName(item.tableId).toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTable = tableFilter === 'all' || item.tableId === tableFilter;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      
      return matchesSearch && matchesTable && matchesStatus;
    });
  }, [displayList, searchQuery, tableFilter, statusFilter, tables]);

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight">Menaxhimi i të Ftuarve</h1>
          <p className="text-slate-500 text-sm">Menaxhoni RSVP-të, caktimet e ulëseve dhe grupet e të ftuarve.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg h-12 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          <UserPlus size={20} />
          <span>Shto të Ftuar</span>
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative flex items-center w-full">
              <Search className="absolute left-4 text-slate-400" size={20} />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl border-none bg-primary/5 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 transition-all" 
                placeholder="Kërko të ftuar, grupe ose tavolina..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Table Filter */}
            <div className="relative">
              <select 
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                className="appearance-none h-12 pl-4 pr-10 rounded-xl bg-white border border-primary/20 text-sm font-medium focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
              >
                <option value="all">Të gjitha Tavolinat</option>
                <option value="">Të paatribuar</option>
                {tables.map(table => (
                  <option key={table.id} value={table.id}>{table.name}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                className="appearance-none h-12 pl-4 pr-10 rounded-xl bg-white border border-primary/20 text-sm font-medium focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
              >
                <option value="All">Të gjitha Statuseve</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Dërguar</option>
                <option value="Responded">Përgjigjur</option>
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-primary/10 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-primary/10 bg-primary/5">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Emri i Grupit</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Pjesëmarrësit</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Madhësia</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Tavolina e Atribuar</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Statusi i RSVP</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {filteredList.length > 0 ? (
                filteredList.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => openGuestDetail(item)}
                    className="group hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {item.name[0] || 'G'}
                        </div>
                        <span className="font-semibold">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600">
                      {item.attendees.join(', ')}
                    </td>
                    <td className="px-6 py-5 text-sm text-center font-medium">{item.size}</td>
                    <td className="px-6 py-5">
                      {item.tableId ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                          {getTableName(item.tableId)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 italic">
                          Të paatribuar
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`flex items-center gap-1.5 text-sm font-medium ${getStatusColor(item.status).split(' ')[0]}`}>
                        <span className={`size-2 rounded-full ${getStatusColor(item.status).split(' ')[1]}`}></span>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(item.status)}
                          {item.status === 'Responded' ? 'Përgjigjur' : item.status === 'Sent' ? 'Dërguar' : 'Draft'}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors" size={20} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    Nuk u gjet asnjë i ftuar që përputhet me kriteret tuaja.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pjesëmarrësit</label>
                  <div className="space-y-3">
                    {newGuestAttendees.map((attendee, index) => (
                      <div key={index} className="flex gap-2">
                        <input 
                          required
                          value={attendee}
                          onChange={(e) => handleAttendeeChange(index, e.target.value)}
                          className="flex-1 h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                          placeholder={`Emri i të Ftuarit ${index + 1}`}
                        />
                        {newGuestAttendees.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => handleRemoveAttendee(index)}
                            className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={handleAddAttendee}
                      className="flex items-center gap-2 text-primary font-bold text-sm hover:underline py-2"
                    >
                      <Plus size={16} />
                      Shto një pjesëmarrës tjetër
                    </button>
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
                  <textarea 
                    value={newGuestNote}
                    onChange={(e) => setNewGuestNote(e.target.value)}
                    rows={3}
                    className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/50 transition-all font-medium resize-none"
                    placeholder="Kërkesat dietike, kërkesa të veçanta..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Anulo
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? 'Duke shtuar...' : 'Shto Grupin e të Ftuarve'}
                  </button>
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
                <button type="button" onClick={() => setSelectedGuest(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              {selectedGuest.type === 'invitation' ? (
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Statusi i RSVP</p>
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
                    <button type="button" onClick={() => setSelectedGuest(null)} className="w-full h-12 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">
                      Mbyll
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleDetailSave} className="p-6 space-y-5">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Statusi i RSVP</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                      <CheckCircle2 size={16} />
                      Përgjigjur
                    </span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pjesëmarrësit</label>
                    <div className="space-y-2">
                      {detailEditAttendees.map((name, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            value={name}
                            onChange={(e) => handleDetailAttendeeChange(index, e.target.value)}
                            className="flex-1 h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary/50 font-medium text-sm"
                            placeholder={`Emri ${index + 1}`}
                          />
                          {detailEditAttendees.length > 1 && (
                            <button type="button" onClick={() => handleDetailRemoveAttendee(index)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={handleDetailAddAttendee} className="flex items-center gap-2 text-primary font-bold text-sm hover:underline py-1">
                        <Plus size={16} />
                        Shto pjesëmarrës
                      </button>
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
                    <textarea
                      value={detailEditNote}
                      onChange={(e) => setDetailEditNote(e.target.value)}
                      rows={3}
                      className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary/50 font-medium text-sm resize-none"
                      placeholder="Kërkesa dietike, shënime..."
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleDetailDelete}
                      disabled={isDetailDeleting}
                      className="flex-1 h-12 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} />
                      {isDetailDeleting ? 'Duke fshirë...' : 'Fshi'}
                    </button>
                    <button
                      type="submit"
                      disabled={isDetailSaving}
                      className="flex-[2] h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      {isDetailSaving ? 'Duke ruajtur...' : 'Ruaj ndryshimet'}
                    </button>
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
