import React, { useState } from 'react';
import { 
  GripVertical, 
  PlusCircle, 
  MoreVertical, 
  Inbox, 
  X, 
  UserPlus 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GuestGroup, Table } from '../../types';

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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden -m-10">
      <aside 
        className={`w-80 flex flex-col border-r bg-white shrink-0 transition-all ${
          isSidebarOver ? 'border-primary bg-primary/5 ring-2 ring-inset ring-primary/20' : 'border-primary/10'
        }`}
        onDragOver={(e) => { handleDragOver(e); setIsSidebarOver(true); }}
        onDragLeave={() => setIsSidebarOver(false)}
        onDrop={(e) => { handleDrop(e, undefined); setIsSidebarOver(false); }}
      >
        <div className="p-4 border-b border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Të paatribuar</h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary tracking-tighter">
              {unassignedGroups.length} Grupe
            </span>
          </div>
          <p className="text-xs text-slate-400">Tërhiqni grupet në tavolina për të caktuar uljen</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {unassignedGroups.map((group) => (
            <motion.div 
              layoutId={group.id}
              key={group.id}
              draggable
              onDragStart={(e) => handleDragStart(e, group.id)}
              className="group cursor-grab active:cursor-grabbing rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:border-primary/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-slate-800">{group.attendees[0] || 'Grupi i të Ftuarve'}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{group.groupSize} anëtarë</p>
                </div>
                <GripVertical className="text-slate-300 group-hover:text-primary" size={18} />
              </div>
              <div className="mt-2 flex -space-x-2">
                {group.attendees.slice(0, 3).map((m, i) => (
                  <div 
                    key={i}
                    className="h-6 w-6 rounded-full border-2 border-white bg-slate-200 bg-cover flex items-center justify-center text-[8px] font-bold"
                  >
                    {m[0]}
                  </div>
                ))}
                {group.attendees.length > 3 && (
                  <div className="h-6 w-6 flex items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[8px] font-bold">
                    +{group.attendees.length - 3}
                  </div>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <select 
                  className="text-[10px] p-1 border rounded bg-slate-50 w-full"
                  onChange={(e) => onAssign(group.id, e.target.value || undefined)}
                  value=""
                >
                  <option value="" disabled>Atribuo në...</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="p-4 border-t border-primary/10">
          <button
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-all"
            onClick={() => onCreateGuest({ attendees: ['Mysafir i ri'] })}
          >
            <UserPlus size={18} />
            Shto mysafirin e ri
          </button>
        </div>
      </aside>

      <section className="flex-1 overflow-y-auto bg-background-light p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Plani i Uljes</h1>
              <p className="text-slate-500 mt-1">Menaxhoni caktimet e tavolinave dhe kapacitetin</p>
            </div>
            <div className="flex gap-3">
              <button
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-all"
                onClick={() => {
                  setNewTableName(`Tavolina ${tables.length + 1}`);
                  setNewTableCapacity(10);
                  setIsAddTableOpen(true);
                }}
              >
                <PlusCircle size={18} />
                Shto Tavolinë
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => {
              const assignedGroups = groups.filter(g => g.tableId === table.id);
              const currentTotal = assignedGroups.reduce((acc, g) => acc + g.groupSize, 0);
              const isOverCapacity = currentTotal > table.capacity;
              const isFull = currentTotal === table.capacity;
              const isOver = dragOverTableId === table.id;

              return (
                <div 
                  key={table.id}
                  onDragOver={(e) => { handleDragOver(e); setDragOverTableId(table.id); }}
                  onDragLeave={() => setDragOverTableId(null)}
                  onDrop={(e) => { handleDrop(e, table.id); setDragOverTableId(null); }}
                  className={`rounded-xl bg-white border shadow-sm overflow-hidden hover:shadow-md transition-all ${
                    isOver ? 'border-primary ring-2 ring-primary/20 scale-[1.02]' :
                    isOverCapacity ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200'
                  }`}
                >
                  <div className={`p-4 border-b flex items-center justify-between ${
                    isOverCapacity ? 'bg-red-50/30 border-red-50' : 'border-slate-100'
                  }`}>
                    <div>
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        {table.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`h-2 w-2 rounded-full ${
                          isOverCapacity ? 'bg-red-500 animate-pulse' : 
                          isFull ? 'bg-slate-400' : 'bg-green-500'
                        }`}></span>
                        <p className={`text-xs font-medium ${isOverCapacity ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                          {isOverCapacity ? 'MBI KAPACITET: ' : isFull ? 'PLOT: ' : 'Kapaciteti: '}
                          <span className={isOverCapacity ? 'underline' : 'text-slate-700'}>
                            {currentTotal} / {table.capacity}
                          </span>
                        </p>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={18} /></button>
                  </div>
                  
                  <div className="p-4 space-y-2 min-h-[140px] bg-slate-50/50">
                    {assignedGroups.length > 0 ? (
                      assignedGroups.map(group => (
                        <div 
                          key={group.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, group.id)}
                          className="flex items-center justify-between rounded-lg bg-white border border-slate-100 px-3 py-2 text-sm shadow-sm group cursor-grab active:cursor-grabbing"
                        >
                          <span className={`font-medium truncate text-slate-700`}>
                            {group.attendees[0]}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold text-slate-400`}>
                              {group.groupSize}p
                            </span>
                            <button 
                              onClick={() => onAssign(group.id, undefined)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-300 py-8">
                        <Inbox size={32} className="mb-2" />
                        <p className="text-xs font-medium text-slate-400">Lëshoni grupet këtu</p>
                      </div>
                    )}
                  </div>
                  {isOverCapacity && (
                    <div className="px-4 py-2 bg-red-50 text-[10px] font-medium text-red-600 text-center uppercase tracking-widest">
                      Veprimi i kërkuar: Zhvendosni {currentTotal - table.capacity} të ftuar
                    </div>
                  )}
                </div>
              );
            })}
            <button className="rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all flex flex-col items-center justify-center min-h-[250px] group">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
                <PlusCircle size={24} />
              </div>
              <p className="text-sm font-bold text-primary uppercase tracking-widest">Tavolinë e Re</p>
            </button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isAddTableOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-primary/5">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <PlusCircle className="text-primary" size={22} />
                  Shto Tavolinë
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddTableOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddTableSubmit} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emri i tavolinës</label>
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium"
                    placeholder="e.g. Tavolina 1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Numri i vendeve</label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(Number(e.target.value) || 1)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddTableOpen(false)}
                    className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Anulo
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? 'Duke shtuar...' : 'Shto Tavolinën'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
