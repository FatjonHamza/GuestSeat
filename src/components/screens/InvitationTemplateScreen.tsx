import React, { useState, useEffect } from 'react';
import { EventDetails } from '../../types';
import { motion } from 'motion/react';
import { Save, Eye, FileText, MapPin, Calendar, Clock, Palette } from 'lucide-react';
import { THEMES, InvitationVector } from '../../constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

interface InvitationTemplateScreenProps {
  eventDetails: EventDetails;
  onUpdate: (details: Partial<EventDetails>) => Promise<void>;
}

export const InvitationTemplateScreen: React.FC<InvitationTemplateScreenProps> = ({ eventDetails, onUpdate }) => {
  const [formData, setFormData] = useState<Partial<EventDetails>>({
    name: eventDetails.name,
    brideName: eventDetails.brideName || '',
    closingMessage: eventDetails.closingMessage || '',
    date: eventDetails.date,
    time: eventDetails.time || '',
    invitationHeading: eventDetails.invitationHeading || '',
    venueName: eventDetails.venueName,
    venueAddress: eventDetails.venueAddress || '',
    venueMapUrl: eventDetails.venueMapUrl || '',
    message: eventDetails.message || '',
    rsvpDeadline: eventDetails.rsvpDeadline || '',
    theme: eventDetails.theme || 'default',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // Keep form in sync with saved event (e.g. after save or when event is updated)
  useEffect(() => {
    setFormData({
      name: eventDetails.name,
      brideName: eventDetails.brideName || '',
      closingMessage: eventDetails.closingMessage || '',
      date: eventDetails.date,
      time: eventDetails.time || '',
      invitationHeading: eventDetails.invitationHeading || '',
      venueName: eventDetails.venueName,
      venueAddress: eventDetails.venueAddress || '',
      venueMapUrl: eventDetails.venueMapUrl || '',
      message: eventDetails.message || '',
      rsvpDeadline: eventDetails.rsvpDeadline || '',
      theme: eventDetails.theme || 'default',
    });
  }, [eventDetails]);

  const currentTheme = THEMES.find(t => t.id === formData.theme) || THEMES[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSaveStatus('idle');
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThemeSelect = (themeId: string) => {
    setSaveStatus('idle');
    setFormData(prev => ({ ...prev, theme: themeId }));
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveStatus('idle');
    setIsSaving(true);
    try {
      await onUpdate(formData);
      setSaveStatus('saved');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Ruajtja dështoi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Formati i Ftesës</h1>
          <p className="text-slate-500 mt-1">Personalizoni tekstin, ngjyrat dhe detajet që do të shohin të ftuarit tuaj.</p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === 'saved' && !saveError && !isSaving && (
            <span className="text-sm font-medium text-emerald-600">Ndryshimet u ruajtën.</span>
          )}
          <Button
            onClick={() => setPreviewMode(!previewMode)}
            variant={previewMode ? 'secondary' : 'outline'}
            className="gap-2"
          >
            {previewMode ? <FileText size={18} /> : <Eye size={18} />}
            {previewMode ? 'Mënyra e Redaktimit' : 'Parashikimi i drejtpërdrejtë'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            <Save size={18} />
            {isSaving ? 'Duke u ruajtur...' : 'Ruaj Ndryshimet'}
          </Button>
        </div>
      </div>
      {saveError && (
        <p className="text-sm text-destructive">{saveError}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Side */}
        <div className={`space-y-6 ${previewMode ? 'hidden lg:block opacity-50 pointer-events-none' : ''}`}>
          {/* Theme Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette size={18} />
                Tema e Ngjyrave
              </CardTitle>
              <CardDescription>Zgjidhni pamjen e ftesës suaj.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Tema</Label>
                <Select value={formData.theme} onValueChange={handleThemeSelect}>
                  <SelectTrigger id="theme" className="w-full">
                    <SelectValue placeholder="Zgjidhni një temë" />
                  </SelectTrigger>
                  <SelectContent>
                    {THEMES.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id}>
                        {theme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{currentTheme.name}</Badge>
                <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: currentTheme.primary }} />
                <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: currentTheme.bg }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={18} />
                Detajet e Ngjarjes
              </CardTitle>
              <CardDescription>Informacioni që shfaqet te ftesa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
            
            <div className="space-y-2">
              <Label htmlFor="invitationHeading">Përshkrimi i ftesës</Label>
              <Textarea
                id="invitationHeading"
                name="invitationHeading"
                value={formData.invitationHeading || ''}
                onChange={handleChange}
                rows={3}
                className="resize-none"
                placeholder="p.sh. Jeni të ftuar në dasmën tonë të veçantë..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Dhëndri (Groom)</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  placeholder="Emri i dhëndrit"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brideName">Nusja (Bride)</Label>
                <Input
                  id="brideName"
                  name="brideName"
                  value={formData.brideName || ''}
                  onChange={handleChange}
                  placeholder="Emri i nuses"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venueName">Emri i Vendit</Label>
              <Input
                id="venueName"
                name="venueName"
                value={formData.venueName || ''}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Ora</Label>
                <Input
                  id="time"
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="venueAddress">Adresa e Vendit</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    id="venueAddress"
                    name="venueAddress"
                    value={formData.venueAddress}
                    onChange={handleChange}
                    className="pl-12 pr-4"
                    placeholder="Rruga, Qyteti, Shteti"
                  />
                </div>
                <div className="relative w-1/3">
                  <Palette className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    id="venueMapUrl"
                    name="venueMapUrl"
                    value={formData.venueMapUrl}
                    onChange={handleChange}
                    className="pl-12 pr-4"
                    placeholder="Linku i Hartës (URL)"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Përshkrimi i mesit (seksioni 3)</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message || ''}
                onChange={handleChange}
                rows={3}
                className="resize-none"
                placeholder="Teksti që shfaqet pas emrave të çiftit..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closingMessage">Përshkrimi i fundit (seksioni 6)</Label>
              <Textarea
                id="closingMessage"
                name="closingMessage"
                value={formData.closingMessage || ''}
                onChange={handleChange}
                rows={3}
                className="resize-none"
                placeholder="Teksti që shfaqet para butonit të përgjigjes..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rsvpDeadline">Afati i përgjigjes</Label>
              <Input
                id="rsvpDeadline"
                type="date"
                name="rsvpDeadline"
                value={formData.rsvpDeadline}
                onChange={handleChange}
              />
            </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Side */}
        <div className={`space-y-6 ${!previewMode ? 'hidden lg:block' : ''}`}>
          <motion.div
            key={formData.theme}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] shadow-2xl overflow-hidden relative flex flex-col items-center text-center transition-colors duration-500"
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
              <div className="w-full px-10 pt-10 pb-6">
                <p className="text-base leading-relaxed opacity-80 mx-auto" style={{ width: '60%' }}>
                  {formData.invitationHeading || "Do të ishim të nderuar t'ju kishim me ne në këtë rast të veçantë."}
                </p>
              </div>

              {/* Section 2 — groom & bride */}
              <div className="w-full px-10 py-12 flex flex-col items-center gap-2">
                <h3 className="text-7xl tracking-normal leading-tight" style={{ color: currentTheme.primary, fontFamily: "'Monsieur La Doulaise', cursive" }}>
                  {formData.name || 'Dhëndri'}
                </h3>
                <span className="text-6xl opacity-60" style={{ fontFamily: "'Monsieur La Doulaise', cursive" }}>&</span>
                <h3 className="text-7xl tracking-normal leading-tight" style={{ color: currentTheme.primary, fontFamily: "'Monsieur La Doulaise', cursive" }}>
                  {formData.brideName || 'Nusja'}
                </h3>
              </div>

              {/* Section 3 — second message */}
              <div className="w-full px-10 py-10">
                <p className="text-base leading-relaxed opacity-80 mx-auto" style={{ width: '60%' }}>
                  {formData.message || "Do të ishim të nderuar t'ju kishim me ne në këtë rast të veçantë."}
                </p>
              </div>

              {/* Section 4 — date / time / location */}
              <div className="w-full px-10 py-10 flex flex-col items-center gap-3">
                {formData.date ? (() => {
                  const DAYS_SQ = ['E Diel', 'E Hënë', 'E Martë', 'E Mërkurë', 'E Enjte', 'E Premte', 'E Shtunë'];
                  const MONTHS_SQ = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
                  const d = new Date(formData.date);
                  return (
                    <div className="flex items-baseline justify-center gap-3 flex-wrap">
                      <span className="text-sm opacity-60">{DAYS_SQ[d.getDay()]}</span>
                      <span className="text-5xl font-bold" style={{ color: currentTheme.primary }}>{d.getDate()}</span>
                      <span className="text-sm opacity-60">{MONTHS_SQ[d.getMonth()]}</span>
                    </div>
                  );
                })() : (
                  <p className="text-sm opacity-40">Data do të caktohet</p>
                )}

                {formData.time && (
                  <p className="text-sm opacity-60 flex items-center gap-1">
                    <Clock size={13} /> {formData.time}
                  </p>
                )}

                <p className="font-semibold text-lg">{formData.venueName || 'Vendi do të caktohet'}</p>

                {formData.venueAddress && (
                  formData.venueMapUrl ? (
                    <a
                      href={formData.venueMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity text-sm"
                    >
                      <MapPin size={13} style={{ color: currentTheme.primary }} />
                      <span className="hover:underline">{formData.venueAddress}</span>
                    </a>
                  ) : (
                    <p className="text-sm opacity-60">{formData.venueAddress}</p>
                  )
                )}
              </div>

              {/* Section 5 — countdown */}
              <div className="w-full px-10 py-10 flex flex-col items-center gap-4">
                <p className="text-xs font-bold uppercase tracking-[0.25em] opacity-50">Numërim Mbrapsht</p>
                <div className="flex items-start justify-center gap-4">
                  {[
                    { label: 'Ditë', value: '--' },
                    { label: 'Orë', value: '--' },
                    { label: 'Min', value: '--' },
                    { label: 'Sek', value: '--' },
                  ].map(({ label, value }, i) => (
                    <React.Fragment key={label}>
                      {i > 0 && <span className="text-2xl font-bold opacity-30 mt-1">-</span>}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-3xl font-bold tabular-nums" style={{ color: currentTheme.primary }}>{value}</span>
                        <span className="text-[10px] uppercase tracking-widest opacity-50">{label}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Section 6 — closing message + CTA */}
              <div className="w-full px-10 py-10 flex flex-col items-center gap-8">
                <p className="text-base leading-relaxed opacity-80 mx-auto" style={{ width: '60%' }}>
                  {formData.closingMessage || formData.message || "Do të ishim të nderuar t'ju kishim me ne në këtë rast të veçantë."}
                </p>

                <Button
                  size="lg"
                  className="w-full"
                  style={{ backgroundColor: currentTheme.primary, color: currentTheme.bg }}
                >
                  Përgjigju ftesës
                </Button>

                {formData.rsvpDeadline && (
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                    Ju lutem përgjigjuni deri më {new Date(formData.rsvpDeadline).toLocaleDateString('sq-AL')}
                  </p>
                )}
              </div>

            </div>
          </motion.div>
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            Ky është një parashikim i faqes së ftesës për të ftuarit
          </p>
        </div>
      </div>
    </div>
  );
};
