import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Users, 
  Calendar, 
  MapPin, 
  Send,
  PartyPopper,
  ArrowRight,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { Invitation, EventDetails } from '../../types';
import { THEMES, InvitationVector } from '../../constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface RSVPScreenProps {
  token: string;
}

export const RSVPScreen: React.FC<RSVPScreenProps> = ({ token }) => {
  const [invitation, setInvitation] = useState<(Invitation & EventDetails) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'info' | 'form' | 'success'>('info');
  const [attendance, setAttendance] = useState<'Yes' | 'No' | null>(null);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getInvitationByToken(token);
        setInvitation(data);
        setAttendees([data.inviteeName]);
      } catch (err) {
        setError('Linku i ftesës është i pavlefshëm ose ka skaduar.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token]);

  const currentTheme = invitation ? (THEMES.find(t => t.id === invitation.theme) || THEMES[0]) : THEMES[0];

  const handleSubmit = async () => {
    if (!attendance) return;
    try {
      await api.submitRSVP({
        token,
        attendance,
        attendees: attendance === 'Yes' ? attendees : [],
        note
      });
      setStep('success');
    } catch (err) {
      alert('Dështoi dërgimi i RSVP. Ju lutem provoni përsëri.');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  if (error || !invitation) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center">
        <XCircle size={64} className="mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Oops!</h1>
        <p className="text-slate-500 mb-6">{error || 'Ftesa nuk u gjet.'}</p>
        <Button asChild className="px-6 py-3 font-bold shadow-lg shadow-primary/20">
          <a href="/">Shko në Faqen Kryesore</a>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500" style={{ backgroundColor: currentTheme.bg }}>
      <div className="max-w-xl w-full">
        <AnimatePresence mode="wait">
          {step === 'info' && (
            <motion.div 
              key="info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-[2rem] shadow-2xl overflow-hidden relative min-h-[700px] flex flex-col items-center justify-center text-center p-12 md:p-16"
              style={{ backgroundColor: currentTheme.bg, color: currentTheme.text }}
            >
              {/* Background Decoration */}
              <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[100px]" style={{ backgroundColor: currentTheme.primary }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[100px]" style={{ backgroundColor: currentTheme.primary }} />
              </div>

              {/* Vector Illustration */}
              <InvitationVector primary={currentTheme.primary} secondary={currentTheme.secondary} />

              <div className="relative z-10 space-y-8 w-full">
                <div className="space-y-4">
                  <p className="font-bold uppercase tracking-[0.3em] text-sm" style={{ color: currentTheme.primary }}>Jeni të ftuar në</p>
                  <h3 className="text-6xl font-handwritten tracking-normal leading-tight">{invitation.name}</h3>
                </div>

                <div className="h-px w-20 mx-auto" style={{ backgroundColor: currentTheme.accent }} />

                <p className="text-lg font-medium leading-relaxed italic opacity-80">
                  Përshëndetje <span className="font-bold" style={{ color: currentTheme.primary }}>{invitation.inviteeName}</span>, 
                  {invitation.message ? ` "${invitation.message}"` : " do të ishim të nderuar t'ju kishim me ne në këtë rast të veçantë."}
                </p>
                
                <div className="grid grid-cols-1 gap-6 py-8 border-y" style={{ borderColor: currentTheme.accent }}>
                  <div className="flex flex-col items-center gap-2">
                    <Calendar size={24} style={{ color: currentTheme.primary }} />
                    <p className="font-bold text-xl">{new Date(invitation.date).toLocaleDateString('sq-AL', { dateStyle: 'full' })}</p>
                    {invitation.time && <p className="opacity-60 flex items-center gap-1 text-sm"><Clock size={14} /> {invitation.time}</p>}
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <MapPin size={24} style={{ color: currentTheme.primary }} />
                    <p className="font-bold text-xl">{invitation.venueName}</p>
                    {invitation.venueAddress && (
                      invitation.venueMapUrl ? (
                        <a 
                          href={invitation.venueMapUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity group"
                          title="Hape në Harta"
                        >
                          <p className="text-sm group-hover:underline">{invitation.venueAddress}</p>
                          <MapPin size={14} style={{ color: currentTheme.primary }} />
                        </a>
                      ) : (
                        <p className="opacity-60 text-sm">{invitation.venueAddress}</p>
                      )
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => setStep('form')}
                  className="w-full py-4 font-black rounded-xl shadow-xl uppercase tracking-widest transition-all hover:scale-105 flex items-center justify-center gap-2"
                  style={{ backgroundColor: currentTheme.primary, color: currentTheme.bg, boxShadow: `0 10px 30px ${currentTheme.accent}` }}
                >
                  RSVP Tani
                  <ArrowRight size={20} />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-3xl shadow-2xl"
            >
              <Card className="border-slate-100">
                <CardContent className="p-8 md:p-12">
              <h2 className="text-2xl font-bold text-center mb-8 text-slate-900">Konfirmoni Pjesëmarrjen Tuaj</h2>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <Button
                    onClick={() => setAttendance('Yes')}
                    variant="outline"
                    className={`flex-1 py-4 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-2 ${
                      attendance === 'Yes' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-400 hover:border-primary/30'
                    }`}
                  >
                    <CheckCircle2 size={24} />
                    Po vij
                  </Button>
                  <Button
                    onClick={() => setAttendance('No')}
                    variant="outline"
                    className={`flex-1 py-4 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-2 ${
                      attendance === 'No' ? 'border-red-500 bg-red-50 text-red-500' : 'border-slate-100 text-slate-400 hover:border-red-300'
                    }`}
                  >
                    <XCircle size={24} />
                    Nuk mundem
                  </Button>
                </div>

                {attendance === 'Yes' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Kush po vjen me ju?</label>
                    {Array.from({ length: invitation.allowedGuests }).map((_, i) => (
                      <div key={i} className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                          value={attendees[i] || ''}
                          onChange={e => {
                            const newAttendees = [...attendees];
                            newAttendees[i] = e.target.value;
                            setAttendees(newAttendees);
                          }}
                          className="h-11 pl-12 pr-4" 
                          placeholder={`Emri i të Ftuarit ${i + 1}`}
                        />
                      </div>
                    ))}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Mesazh për Pritësin (Opsionale)</label>
                  <Textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="h-24 p-4 resize-none" 
                    placeholder="Çdo kërkesë diete ose mesazh i veçantë..."
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => setStep('info')}
                    variant="ghost"
                    className="flex-1 py-4 text-slate-500 font-bold hover:underline"
                  >
                    Mbrapa
                  </Button>
                  <Button
                    disabled={!attendance}
                    onClick={handleSubmit}
                    className="flex-[2] py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Dërgo RSVP
                  </Button>
                </div>
              </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-2xl p-12 text-center border border-slate-100"
            >
              <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Faleminderit!</h2>
              <p className="text-slate-500 mb-8 text-lg">
                RSVP juaj u dërgua me sukses. Ne kemi njoftuar pritësin për përgjigjen tuaj.
              </p>
              <div className="p-6 bg-slate-50 rounded-2xl text-left mb-8">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Përgjigjja Juaj</p>
                <p className="font-bold text-slate-800">{attendance === 'Yes' ? 'Po marr pjesë' : 'Nuk po marr pjesë'}</p>
                {attendance === 'Yes' && (
                  <p className="text-sm text-slate-600 mt-1">{attendees.filter(a => a).length} të ftuar të konfirmuar</p>
                )}
              </div>
              <p className="text-sm text-slate-400 italic">Mund ta mbyllni këtë dritare tani.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
