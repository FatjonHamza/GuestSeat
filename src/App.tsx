import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Table as TableIcon, 
  Mail, 
  Search, 
  Bell, 
  Settings, 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  UserPlus, 
  Grid, 
  History, 
  Bolt, 
  Send, 
  MoreVertical, 
  Star, 
  Inbox, 
  Wand2, 
  PlusCircle, 
  GripVertical,
  Calendar,
  MapPin,
  Building2,
  PartyPopper,
  X,
  ArrowLeft,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EventDetails, Invitation, GuestGroup, Table, Screen } from './types';
import { api } from './services/api';

// --- Screens ---
import { DashboardScreen } from './components/screens/DashboardScreen';
import { GuestListScreen } from './components/screens/GuestListScreen';
import { SeatingPlanScreen } from './components/screens/SeatingPlanScreen';
import { CreateEventScreen } from './components/screens/CreateEventScreen';
import { InvitationsScreen } from './components/screens/InvitationsScreen';
import { RSVPScreen } from './components/screens/RSVPScreen';
import { CheckInScreen } from './components/screens/CheckInScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { InvitationTemplateScreen } from './components/screens/InvitationTemplateScreen';

// --- Components ---

const Sidebar = ({ currentScreen, setScreen }: { currentScreen: Screen, setScreen: (s: Screen) => void }) => {
  const menuItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Paneli' },
    { id: 'GuestList', icon: Users, label: 'Lista e të Ftuarve' },
    { id: 'SeatingPlan', icon: TableIcon, label: 'Plani i Uljes' },
    { id: 'Invitations', icon: Mail, label: 'Ftesat' },
    { id: 'InvitationTemplate', icon: Wand2, label: 'Formati i Ftesës' },
    { id: 'CheckIn', icon: UserCheck, label: 'Check-In' },
  ];

  return (
    <aside className="w-64 flex flex-col gap-2 p-6 border-r border-primary/10 bg-white h-full">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setScreen(item.id as Screen)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            currentScreen === item.id 
              ? 'bg-primary text-white font-semibold shadow-lg shadow-primary/20' 
              : 'hover:bg-primary/10 text-slate-600 hover:text-primary'
          }`}
        >
          <item.icon size={20} />
          <span>{item.label}</span>
        </button>
      ))}
      <div className="mt-auto pt-10">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Plani i Pritësit</p>
          <p className="text-sm font-medium">Akses Premium në Ngjarje</p>
          <button className="mt-3 w-full py-2 text-xs font-bold bg-primary text-white rounded-lg uppercase hover:bg-primary/90 transition-colors">
            Përmirëso
          </button>
        </div>
      </div>
    </aside>
  );
};

const Header = ({ eventName, onLogout }: { eventName?: string, onLogout: () => void }) => (
  <header className="flex items-center justify-between border-b border-primary/10 bg-white px-6 py-4 lg:px-10 shrink-0">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
        <TableIcon size={24} />
      </div>
      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase leading-none">GuestSeat</h2>
        {eventName && <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">{eventName}</p>}
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="relative hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input 
          type="text" 
          placeholder="Kërko të ftuar..." 
          className="h-10 w-64 rounded-lg border-none bg-slate-100 pl-10 text-sm focus:ring-2 focus:ring-primary transition-all"
        />
      </div>
      <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
        <Bell size={20} />
      </button>
      <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
        <Settings size={20} />
      </button>
      <button 
        onClick={onLogout}
        className="flex items-center gap-2 h-10 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-bold uppercase tracking-wider"
      >
        Çkyçu
      </button>
      <div 
        className="h-10 w-10 rounded-full border-2 border-primary bg-cover bg-center"
        style={{ backgroundImage: "url('https://picsum.photos/seed/host/100/100')" }}
      />
    </div>
  </header>
);

// --- Main App ---

export default function App() {
  const [screen, setScreen] = useState<Screen>('Login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpToken, setRsvpToken] = useState<string | null>(null);

  useEffect(() => {
    // Basic routing for RSVP
    const path = window.location.pathname;
    if (path.startsWith('/rsvp/')) {
      const token = path.split('/rsvp/')[1];
      setRsvpToken(token);
      setScreen('RSVP');
      setLoading(false);
      return;
    }

    // Load initial event if exists
    const loadEvent = async () => {
      try {
        const events = await api.getEvents();
        if (events.length > 0) {
          const event = events[0];
          setEventDetails(event);
          await refreshData(event.id);
          if (isLoggedIn) {
            setScreen('Dashboard');
          }
        } else if (isLoggedIn) {
          setScreen('CreateEvent');
        }
      } catch (err) {
        console.error('Failed to load event:', err);
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [isLoggedIn]);

  const refreshData = async (eventId: string) => {
    const [g, t, i] = await Promise.all([
      api.getGuests(eventId),
      api.getTables(eventId),
      api.getInvitations(eventId)
    ]);
    setGroups(g);
    setTables(t);
    setInvitations(i);
  };

  const handleCreateEvent = async (details: Partial<EventDetails>) => {
    try {
      const newEvent = await api.createEvent(details);
      setEventDetails(newEvent);
      
      // Create initial tables
      for (let i = 1; i <= 10; i++) {
        await api.createTable({
          eventId: newEvent.id,
          name: `Tavolina ${i}`,
          capacity: 10
        });
      }
      
      await refreshData(newEvent.id);
      setScreen('Dashboard');
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  const handleCreateTable = async (name: string, capacity: number) => {
    if (!eventDetails) return;
    try {
      await api.createTable({
        eventId: eventDetails.id,
        name: name.trim() || `Tavolina ${tables.length + 1}`,
        capacity: Math.max(1, Math.floor(capacity)),
      });
      await refreshData(eventDetails.id);
    } catch (err) {
      console.error('Failed to create table:', err);
    }
  };

  const handleCreateInvitation = async (invitation: Partial<Invitation>) => {
    if (!eventDetails) return;
    try {
      await api.createInvitation({
        ...invitation,
        eventId: eventDetails.id
      });
      await refreshData(eventDetails.id);
    } catch (err) {
      console.error('Failed to create invitation:', err);
    }
  };

  const handleAssign = async (groupId: string, tableId: string | undefined) => {
    if (!eventDetails) return;
    try {
      await api.assignTable(groupId, tableId || null);
      await refreshData(eventDetails.id);
    } catch (err) {
      console.error('Failed to assign table:', err);
    }
  };

  const handleUpdateEvent = async (details: Partial<EventDetails>) => {
    if (!eventDetails) return;
    try {
      await api.updateEvent(eventDetails.id, details);
      const updated = await api.getEvent(eventDetails.id);
      setEventDetails(updated);
    } catch (err) {
      console.error('Failed to update event:', err);
    }
  };

  const handleCreateGuest = async (guest: Partial<GuestGroup>) => {
    if (!eventDetails) return;
    try {
      await api.createGuest({
        ...guest,
        eventId: eventDetails.id
      });
      await refreshData(eventDetails.id);
    } catch (err) {
      console.error('Failed to create guest:', err);
    }
  };

  const handleUpdateGuest = async (id: string, data: Partial<Pick<GuestGroup, 'attendees' | 'note' | 'tableId'>>) => {
    if (!eventDetails) return;
    try {
      await api.updateGuest(id, data);
      await refreshData(eventDetails.id);
    } catch (err) {
      console.error('Failed to update guest:', err);
    }
  };

  const handleDeleteGuest = async (id: string) => {
    if (!eventDetails) return;
    try {
      await api.deleteGuest(id);
    } catch (err) {
      console.error('Failed to delete guest:', err);
    } finally {
      await refreshData(eventDetails.id);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background-light">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  if (screen === 'RSVP' && rsvpToken) {
    return <RSVPScreen token={rsvpToken} />;
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  if (screen === 'CreateEvent' || (!eventDetails && screen !== 'Login')) {
    return <CreateEventScreen onComplete={handleCreateEvent} />;
  }

  const stats = {
    invitationsSent: invitations.length,
    rsvpReceived: invitations.filter(i => i.status === 'Responded').length,
    totalGuests: groups.reduce((acc, g) => acc + g.groupSize, 0),
    tablesCreated: tables.length
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setScreen('Login');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light">
      <Header eventName={eventDetails?.name} onLogout={handleLogout} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentScreen={screen} setScreen={setScreen} />
        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {screen === 'Dashboard' && (
                <DashboardScreen 
                  onNavigate={setScreen} 
                  stats={stats} 
                  invitations={invitations}
                  groups={groups}
                  tables={tables}
                />
              )}
              {screen === 'GuestList' && (
                <GuestListScreen 
                  groups={groups} 
                  tables={tables} 
                  invitations={invitations}
                  onCreateGuest={handleCreateGuest}
                  onUpdateGuest={handleUpdateGuest}
                  onDeleteGuest={handleDeleteGuest}
                />
              )}
              {screen === 'SeatingPlan' && (
                <SeatingPlanScreen 
                  groups={groups} 
                  tables={tables} 
                  onAssign={handleAssign}
                  onCreateTable={handleCreateTable}
                  onCreateGuest={handleCreateGuest}
                />
              )}
              {screen === 'Invitations' && (
                <InvitationsScreen 
                  invitations={invitations} 
                  onCreateInvitation={handleCreateInvitation}
                  onNavigate={setScreen}
                />
              )}
              {screen === 'CheckIn' && (
                <CheckInScreen groups={groups} tables={tables} />
              )}
              {screen === 'InvitationTemplate' && eventDetails && (
                <InvitationTemplateScreen 
                  eventDetails={eventDetails} 
                  onUpdate={handleUpdateEvent} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <footer className="border-t border-primary/10 py-4 px-10 text-center bg-white shrink-0">
        <p className="text-xs text-slate-400 font-medium">
          © 2024 GuestSeat Inc. Të gjitha të drejtat e rezervuara. {eventDetails && `| Planifikimi: ${eventDetails.name} në ${eventDetails.venueName}`}
        </p>
      </footer>
    </div>
  );
}
