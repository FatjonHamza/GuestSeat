import React, { useState } from 'react';
import { EventDetails } from '../../types';
import { motion } from 'motion/react';
import { Save, Eye, FileText, MapPin, Calendar, Clock, Palette } from 'lucide-react';
import { THEMES, InvitationVector } from '../../constants';

interface InvitationTemplateScreenProps {
  eventDetails: EventDetails;
  onUpdate: (details: Partial<EventDetails>) => Promise<void>;
}

export const InvitationTemplateScreen: React.FC<InvitationTemplateScreenProps> = ({ eventDetails, onUpdate }) => {
  const [formData, setFormData] = useState<Partial<EventDetails>>({
    name: eventDetails.name,
    date: eventDetails.date,
    time: eventDetails.time || '',
    venueName: eventDetails.venueName,
    venueAddress: eventDetails.venueAddress || '',
    venueMapUrl: eventDetails.venueMapUrl || '',
    message: eventDetails.message || '',
    rsvpDeadline: eventDetails.rsvpDeadline || '',
    theme: eventDetails.theme || 'default',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const currentTheme = THEMES.find(t => t.id === formData.theme) || THEMES[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThemeSelect = (themeId: string) => {
    setFormData(prev => ({ ...prev, theme: themeId }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(formData);
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
          <button 
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
              previewMode ? 'bg-slate-100 text-slate-600' : 'bg-primary/10 text-primary'
            }`}
          >
            {previewMode ? <FileText size={18} /> : <Eye size={18} />}
            {previewMode ? 'Mënyra e Redaktimit' : 'Parashikimi Live'}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
          >
            <Save size={18} />
            {isSaving ? 'Duke u ruajtur...' : 'Ruaj Ndryshimet'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Side */}
        <div className={`space-y-6 ${previewMode ? 'hidden lg:block opacity-50 pointer-events-none' : ''}`}>
          {/* Theme Selector */}
          <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-slate-100 pb-4">
              <Palette className="text-primary" size={20} />
              Tema e Ngjyrave
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`p-3 rounded-xl border-2 transition-all text-left space-y-2 ${
                    formData.theme === theme.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-primary/30'
                  }`}
                >
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primary }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.bg }} />
                  </div>
                  <p className="text-xs font-bold truncate">{theme.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-slate-100 pb-4">
              <FileText className="text-primary" size={20} />
              Detajet e Ngjarjes
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Emri i Ngjarjes</label>
                <input 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Emri i Vendit</label>
                <input 
                  name="venueName"
                  value={formData.venueName}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Data</label>
                <input 
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Ora</label>
                <input 
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Adresa e Vendit</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="venueAddress"
                    value={formData.venueAddress}
                    onChange={handleChange}
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                    placeholder="Rruga, Qyteti, Shteti"
                  />
                </div>
                <div className="relative w-1/3">
                  <Palette className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="venueMapUrl"
                    value={formData.venueMapUrl}
                    onChange={handleChange}
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                    placeholder="Linku i Hartës (URL)"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Mesazhi i Ftesës</label>
              <textarea 
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/50 transition-all font-medium resize-none"
                placeholder="Shkruani një mesazh mirëseardhjeje të ngrohtë për të ftuarit tuaj..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Afati i RSVP</label>
              <input 
                type="date"
                name="rsvpDeadline"
                value={formData.rsvpDeadline}
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
              />
            </div>
          </div>
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
                <p className="font-bold uppercase tracking-[0.3em] text-sm" style={{ color: currentTheme.primary }}>Jeni të ftuar ne dasmen</p>
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
                <button 
                  className="w-full py-4 font-black rounded-xl shadow-xl uppercase tracking-widest transition-all hover:scale-105"
                  style={{ backgroundColor: currentTheme.primary, color: currentTheme.bg, boxShadow: `0 10px 30px ${currentTheme.accent}` }}
                >
                  RSVP Tani
                </button>
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
