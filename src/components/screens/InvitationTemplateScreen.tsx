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
    date: eventDetails.date,
    time: eventDetails.time || '',
    invitationHeading: eventDetails.invitationHeading || 'Jeni të ftuar ne dasmen',
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
      date: eventDetails.date,
      time: eventDetails.time || '',
      invitationHeading: eventDetails.invitationHeading || 'Jeni të ftuar ne dasmen',
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="invitationHeading">Titulli i sipërm i ftesës</Label>
                <Input
                  id="invitationHeading"
                  name="invitationHeading"
                  value={formData.invitationHeading || ''}
                  onChange={handleChange}
                  placeholder="p.sh. Jeni të ftuar ne dasmen"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Emri i Ngjarjes</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venueName">Emri i Vendit</Label>
                <Input
                  id="venueName"
                  name="venueName"
                  value={formData.venueName}
                  onChange={handleChange}
                />
              </div>
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
              <Label htmlFor="message">Mesazhi i Ftesës</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="resize-none"
                placeholder="Shkruani një mesazh mirëseardhjeje të ngrohtë për të ftuarit tuaj..."
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
          <div 
            className="rounded-[2rem] p-12 md:p-16 shadow-2xl relative overflow-hidden min-h-[700px] flex flex-col items-center justify-center text-center transition-colors duration-500"
            style={{ backgroundColor: currentTheme.bg, color: currentTheme.text }}
          >
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[100px]" style={{ backgroundColor: currentTheme.primary }} />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[100px]" style={{ backgroundColor: currentTheme.primary }} />
            </div>

            {/* Vector Illustration */}
            <InvitationVector primary={currentTheme.primary} secondary={currentTheme.secondary} />

            <motion.div 
              key={formData.theme}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 max-w-md w-full space-y-8"
            >
              <div className="space-y-4">
                <p className="font-bold uppercase tracking-[0.3em] text-sm" style={{ color: currentTheme.primary }}>
                  {formData.invitationHeading || 'Jeni të ftuar ne dasmen'}
                </p>
                <h3 className="text-6xl font-handwritten tracking-normal leading-tight">{formData.name || 'Ngjarja Juaj'}</h3>
              </div>

              <div className="h-px w-20 mx-auto" style={{ backgroundColor: currentTheme.accent }} />

              <p className="font-medium leading-relaxed italic opacity-80">
                "{formData.message || 'Do të ishim të nderuar t\'ju kishim me ne në këtë rast të veçantë.'}"
              </p>

              <div className="grid grid-cols-1 gap-6 py-8 border-y" style={{ borderColor: currentTheme.accent }}>
                <div className="flex flex-col items-center gap-2">
                  <Calendar size={24} style={{ color: currentTheme.primary }} />
                  <p className="font-bold text-xl">{formData.date ? new Date(formData.date).toLocaleDateString('sq-AL', { dateStyle: 'full' }) : 'Data do të caktohet'}</p>
                  {formData.time && <p className="opacity-60 flex items-center gap-1"><Clock size={14} /> {formData.time}</p>}
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <MapPin size={24} style={{ color: currentTheme.primary }} />
                  <p className="font-bold text-xl">{formData.venueName || 'Vendi do të caktohet'}</p>
                  {formData.venueAddress && (
                    formData.venueMapUrl ? (
                      <a 
                        href={formData.venueMapUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity group"
                      >
                        <p className="text-sm group-hover:underline">{formData.venueAddress}</p>
                        <MapPin size={14} style={{ color: currentTheme.primary }} />
                      </a>
                    ) : (
                      <p className="opacity-60 text-sm">{formData.venueAddress}</p>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full"
                  style={{ backgroundColor: currentTheme.primary, color: currentTheme.bg, boxShadow: `0 10px 30px ${currentTheme.accent}` }}
                >
                  Përgjigju ftesës
                </Button>
                {formData.rsvpDeadline && (
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                    Ju lutem përgjigjuni deri më {new Date(formData.rsvpDeadline).toLocaleDateString('sq-AL')}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            Ky është një parashikim i faqes së ftesës për të ftuarit
          </p>
        </div>
      </div>
    </div>
  );
};
