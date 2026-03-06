import React, { useState } from 'react';
import { 
  Table as TableIcon, 
  PartyPopper, 
  Calendar, 
  MapPin, 
  Building2, 
  Clock, 
  MessageSquare 
} from 'lucide-react';
import { motion } from 'motion/react';
import { EventDetails } from '../../types';

interface CreateEventScreenProps {
  onComplete: (d: Partial<EventDetails>) => void;
}

export const CreateEventScreen: React.FC<CreateEventScreenProps> = ({ onComplete }) => {
  const [details, setDetails] = useState<Partial<EventDetails>>({
    name: '',
    date: '',
    time: '',
    venueName: '',
    venueAddress: '',
    message: ''
  });

  return (
    <div className="min-h-screen bg-background-light flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-primary/10 bg-white">
        <div className="flex items-center gap-2">
          <div className="text-primary">
            <TableIcon size={32} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">GuestSeat</h2>
        </div>
        <button className="text-sm font-medium hover:text-primary transition-colors">Hyni</button>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[600px] bg-white rounded-3xl shadow-xl shadow-primary/5 border border-primary/10 overflow-hidden"
        >
          <div className="p-8 md:p-12 text-center">
            <h1 className="text-3xl font-serif font-bold mb-2">Planifikoni Ditën Tuaj të Veçantë</h1>
            <p className="text-slate-500 mb-10">Vendosni detajet më poshtë për të filluar organizimin e planit të uljes dhe listës së të ftuarve.</p>
            <form className="space-y-6 text-left" onSubmit={(e) => { e.preventDefault(); onComplete(details); }}>
              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-slate-600">Emri i Ngjarjes</label>
                <div className="relative">
                  <PartyPopper className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60" size={20} />
                  <input 
                    required
                    value={details.name}
                    onChange={e => setDetails({...details, name: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-background-light focus:ring-primary focus:border-primary transition-all" 
                    placeholder="p.sh. Dasma e Sarës dhe Michael" 
                    type="text"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-wider text-slate-600">Data e Ngjarjes</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60" size={20} />
                    <input 
                      required
                      value={details.date}
                      onChange={e => setDetails({...details, date: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-background-light focus:ring-primary focus:border-primary transition-all" 
                      type="date"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-wider text-slate-600">Ora e Ngjarjes</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60" size={20} />
                    <input 
                      required
                      value={details.time}
                      onChange={e => setDetails({...details, time: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-background-light focus:ring-primary focus:border-primary transition-all" 
                      type="time"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-slate-600">Emri i Vendit</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60" size={20} />
                  <input 
                    required
                    value={details.venueName}
                    onChange={e => setDetails({...details, venueName: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-background-light focus:ring-primary focus:border-primary transition-all" 
                    placeholder="p.sh. Salloni i Madh" 
                    type="text"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-slate-600">Adresa e Vendit</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60" size={20} />
                  <input 
                    required
                    value={details.venueAddress}
                    onChange={e => setDetails({...details, venueAddress: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-background-light focus:ring-primary focus:border-primary transition-all" 
                    placeholder="p.sh. Rruga 123, Prishtinë" 
                    type="text"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-slate-600">Mesazh për të Ftuarit (Opsionale)</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 text-primary/60" size={20} />
                  <textarea 
                    value={details.message}
                    onChange={e => setDetails({...details, message: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-background-light focus:ring-primary focus:border-primary transition-all h-24 resize-none" 
                    placeholder="p.sh. Mezi presim të festojmë me ju!" 
                  />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
                  Krijo Ngjarjen
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </main>
      <footer className="py-8 text-center text-slate-400 text-sm">
        <p>© 2024 GuestSeat. Të gjitha të drejtat e rezervuara.</p>
      </footer>
    </div>
  );
};
