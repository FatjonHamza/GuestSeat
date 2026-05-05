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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface RSVPScreenProps {
  token: string;
}

function useCountdown(targetDate: string | undefined) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
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
  const invitationData = invitation as (Invitation & EventDetails & { eventName?: string; eventDate?: string; eventTime?: string; brideName?: string; closingMessage?: string });
  const countdown = useCountdown(invitationData?.date || invitationData?.eventDate);

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
      alert('Dështoi dërgimi i përgjigjes. Ju lutem provoni përsëri.');
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
        <Button asChild>
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
              className="rounded-[2rem] shadow-2xl overflow-hidden relative flex flex-col items-center text-center"
              style={{ backgroundColor: currentTheme.bg, color: currentTheme.text }}
            >
              {/* Background Decoration */}
              <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[100px]" style={{ backgroundColor: currentTheme.primary }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[100px]" style={{ backgroundColor: currentTheme.primary }} />
              </div>

              {/* Vector Illustration */}
              <InvitationVector primary={currentTheme.primary} secondary={currentTheme.secondary} />

              <div className="relative z-10 w-full flex flex-col items-center divide-y" style={{ borderColor: currentTheme.accent }}>

                {/* Section 1 — description */}
                <motion.div className="w-full px-10 pt-10 pb-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
                  <p className="text-base leading-relaxed opacity-80 mx-auto" style={{ width: '60%' }}>
                    {invitation.invitationHeading || "Do të ishim të nderuar t'ju kishim me ne në këtë rast të veçantë."}
                  </p>
                </motion.div>

                {/* Section 2 — groom & bride */}
                <motion.div className="w-full px-10 py-12 flex flex-col items-center gap-2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
                  <h3 className="text-7xl tracking-normal leading-tight" style={{ color: currentTheme.primary, fontFamily: "'Monsieur La Doulaise', cursive" }}>
                    {invitationData.name || 'Dhëndri'}
                  </h3>
                  <span className="text-6xl opacity-60" style={{ fontFamily: "'Monsieur La Doulaise', cursive" }}>&</span>
                  <h3 className="text-7xl tracking-normal leading-tight" style={{ color: currentTheme.primary, fontFamily: "'Monsieur La Doulaise', cursive" }}>
                    {invitationData.brideName || 'Nusja'}
                  </h3>
                </motion.div>

                {/* Section 3 — second message block */}
                <motion.div className="w-full px-10 py-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
                  <p className="text-base leading-relaxed opacity-80 mx-auto" style={{ width: '60%' }}>
                    {invitation.message || "Do të ishim të nderuar t'ju kishim me ne në këtë rast të veçantë."}
                  </p>
                </motion.div>

                {/* Section 4 — date / time / location */}
                <motion.div className="w-full px-10 py-10 flex flex-col items-center gap-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }}>
                  {(() => {
                    const DAYS_SQ = ['E Diel', 'E Hënë', 'E Martë', 'E Mërkurë', 'E Enjte', 'E Premte', 'E Shtunë'];
                    const MONTHS_SQ = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
                    const d = new Date(invitationData.date || invitationData.eventDate || new Date().toISOString());
                    return (
                      <div className="flex items-baseline justify-center gap-3 flex-wrap">
                        <span className="text-sm opacity-60">{DAYS_SQ[d.getDay()]}</span>
                        <span className="text-5xl font-bold" style={{ color: currentTheme.primary }}>{d.getDate()}</span>
                        <span className="text-sm opacity-60">{MONTHS_SQ[d.getMonth()]}</span>
                      </div>
                    );
                  })()}

                  {(invitationData.time || invitationData.eventTime) && (
                    <p className="text-sm opacity-60 flex items-center gap-1">
                      <Clock size={13} />
                      {invitationData.time || invitationData.eventTime}
                    </p>
                  )}

                  <p className="font-semibold text-lg">{invitation.venueName}</p>

                  {invitation.venueAddress && (
                    invitation.venueMapUrl ? (
                      <a
                        href={invitation.venueMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity text-sm"
                      >
                        <MapPin size={13} style={{ color: currentTheme.primary }} />
                        <span className="hover:underline">{invitation.venueAddress}</span>
                      </a>
                    ) : (
                      <p className="text-sm opacity-60">{invitation.venueAddress}</p>
                    )
                  )}
                </motion.div>

                {/* Section 5 — countdown */}
                <motion.div className="w-full px-10 py-10 flex flex-col items-center gap-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }}>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] opacity-50">Numërim Mbrapsht</p>
                  <div className="flex items-start justify-center gap-4">
                    {[
                      { label: 'Ditë', value: countdown.days },
                      { label: 'Orë', value: countdown.hours },
                      { label: 'Min', value: countdown.minutes },
                      { label: 'Sek', value: countdown.seconds },
                    ].map(({ label, value }, i) => (
                      <React.Fragment key={label}>
                        {i > 0 && <span className="text-2xl font-bold opacity-30 mt-1">-</span>}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-3xl font-bold tabular-nums" style={{ color: currentTheme.primary }}>
                            {String(value).padStart(2, '0')}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest opacity-50">{label}</span>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </motion.div>

                {/* Section 6 — closing message + CTA */}
                <motion.div className="w-full px-10 py-10 flex flex-col items-center gap-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.1 }}>
                  <p className="text-base leading-relaxed opacity-80 mx-auto" style={{ width: '60%' }}>
                    {invitationData.closingMessage || invitation.message || "Do të ishim të nderuar t'ju kishim me ne në këtë rast të veçantë."}
                  </p>

                  <Button
                    onClick={() => setStep('form')}
                    size="lg"
                    className="w-full flex items-center justify-center gap-2"
                    style={{ backgroundColor: currentTheme.primary, color: currentTheme.bg }}
                  >
                    Përgjigju ftesës
                    <ArrowRight size={20} />
                  </Button>
                </motion.div>

              </div>
            </motion.div>
          )}

          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-xl"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Konfirmoni Pjesëmarrjen Tuaj</CardTitle>
                  <CardDescription>Zgjidhni nëse do të merrni pjesë dhe plotësoni detajet e nevojshme.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={() => setAttendance('Yes')}
                    variant="outline"
                    size="lg"
                    className={`h-auto flex flex-col items-center gap-2 ${
                      attendance === 'Yes' ? 'border-primary bg-primary/5 text-primary' : ''
                    }`}
                  >
                    <CheckCircle2 size={24} />
                    Po vij
                  </Button>
                  <Button
                    onClick={() => setAttendance('No')}
                    variant="outline"
                    size="lg"
                    className={`h-auto flex flex-col items-center gap-2 ${
                      attendance === 'No' ? 'border-red-500 bg-red-50 text-red-600' : ''
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
                    <p className="text-sm font-medium text-muted-foreground">Kush po vjen me ju?</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Mesazh për Pritësin (Opsionale)</p>
                  <Textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="min-h-24 resize-none" 
                    placeholder="Çdo kërkesë diete ose mesazh i veçantë..."
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => setStep('info')}
                    variant="outline"
                    className="flex-1"
                  >
                    Mbrapa
                  </Button>
                  <Button
                    disabled={!attendance}
                    onClick={handleSubmit}
                    className="flex-[2]"
                  >
                    Dërgo
                  </Button>
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
                Përgjigjja juaj u dërgua me sukses. Ne kemi njoftuar pritësin.
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
