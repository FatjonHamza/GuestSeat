import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Table as TableIcon, 
  Mail, 
  Wand2, 
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EventDetails, Invitation, GuestGroup, Table, Screen, ClientAccount, ClientAnalytics } from './types';
import { api } from './services/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  SidebarProvider,
  Sidebar as AppSidebarContainer,
  SidebarContent,
  SidebarGroup,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

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
import { SuperAdminScreen } from './components/screens/SuperAdminScreen';
import { AdminLoginScreen } from './components/screens/AdminLoginScreen';
import { AppErrorBoundary } from './components/AppErrorBoundary';

const AUTH_STORAGE_KEY = 'guestseat:isLoggedIn';
const ACCOUNT_NAME_STORAGE_KEY = 'guestseat:accountName';
const ADMIN_AUTH_STORAGE_KEY = 'guestseat:admin:isLoggedIn';
const DEFAULT_ACCOUNT_NAME = 'Admin GuestSeat';

// --- Components ---

const AppSidebar = ({ currentScreen, setScreen }: { currentScreen: Screen, setScreen: (s: Screen) => void }) => {
  const menuItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Paneli' },
    { id: 'GuestList', icon: Users, label: 'Lista e të Ftuarve' },
    { id: 'SeatingPlan', icon: TableIcon, label: 'Plani i Uljes' },
    { id: 'Invitations', icon: Mail, label: 'Ftesat' },
    { id: 'InvitationTemplate', icon: Wand2, label: 'Formati i Ftesës' },
    { id: 'CheckIn', icon: UserCheck, label: 'Check-In' },
  ];

  return (
    <AppSidebarContainer collapsible="none" className="border-r border-primary/10 bg-white text-left">
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={currentScreen === item.id}
                  onClick={() => setScreen(item.id as Screen)}
                  className={`h-11 rounded-xl px-4 ${currentScreen === item.id ? 'bg-primary text-white hover:bg-primary/90 hover:text-white' : 'text-slate-600 hover:bg-primary/10 hover:text-primary'}`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </AppSidebarContainer>
  );
};

const getAccountInitials = (accountName?: string) => {
  const trimmed = accountName?.trim();
  if (!trimmed) return 'GS';

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return parts[0].slice(0, 2).toUpperCase();
};

const Header = ({ eventName, accountName, onLogout }: { eventName?: string, accountName?: string, onLogout: () => void }) => (
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
      <Button 
        onClick={onLogout}
        variant="destructive"
      >
        Çkyçu
      </Button>
      <Avatar className="h-10 w-10">
        <AvatarFallback>{getAccountInitials(accountName)}</AvatarFallback>
      </Avatar>
    </div>
  </header>
);

// --- Main App ---

export default function App() {
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  const [screen, setScreen] = useState<Screen>('Login');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpToken, setRsvpToken] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [clientAnalytics, setClientAnalytics] = useState<ClientAnalytics>({
    total: 0,
    active: 0,
    expired: 0,
    upcoming: 0,
    expiringSoon: 0,
  });
  const [accountName, setAccountName] = useState<string>(() => {
    try {
      return localStorage.getItem(ACCOUNT_NAME_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Backfill account name for sessions created before initials support.
    if (!isLoggedIn || accountName) return;
    try {
      localStorage.setItem(ACCOUNT_NAME_STORAGE_KEY, DEFAULT_ACCOUNT_NAME);
    } catch {
      // Ignore storage errors and still update local state.
    }
    setAccountName(DEFAULT_ACCOUNT_NAME);
  }, [isLoggedIn, accountName]);

  useEffect(() => {
    if (isAdminRoute) {
      setLoading(false);
      return;
    }

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
  }, [isLoggedIn, isAdminRoute]);

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

  const refreshClients = async () => {
    const [list, analytics] = await Promise.all([api.getClients(), api.getClientAnalytics()]);
    setClients(list);
    setClientAnalytics(analytics);
  };

  useEffect(() => {
    if (!isAdminRoute || !isAdminLoggedIn) return;
    void refreshClients();
  }, [isAdminRoute, isAdminLoggedIn]);

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

  const handleDeleteInvitation = async (id: string) => {
    if (!eventDetails) return;
    try {
      await api.deleteInvitation(id);
    } catch (err) {
      console.error('Failed to delete invitation:', err);
    } finally {
      await refreshData(eventDetails.id);
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
      throw (err instanceof Error ? err : new Error('Failed to update event'));
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

  const handleUpdateGuest = async (id: string, data: Partial<Pick<GuestGroup, 'attendees' | 'note' | 'tableId' | 'arrivedAt'>>) => {
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

  const handleCreateClient = async (payload: Omit<ClientAccount, 'id' | 'createdAt'>) => {
    const result = await api.createClient(payload);
    await refreshClients();
    return result;
  };

  const handleUpdateClient = async (id: string, payload: Partial<Omit<ClientAccount, 'id' | 'createdAt'>>) => {
    await api.updateClient(id, payload);
    await refreshClients();
  };

  const handleDeleteClient = async (id: string) => {
    await api.deleteClient(id);
    await refreshClients();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background-light">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
    </div>
  );

  if (screen === 'RSVP' && rsvpToken) {
    return <RSVPScreen token={rsvpToken} />;
  }

  if (isAdminRoute) {
    if (!isAdminLoggedIn) {
      return (
        <AdminLoginScreen
          onLogin={() => {
            localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, 'true');
            setIsAdminLoggedIn(true);
          }}
        />
      );
    }

    return (
      <div className="min-h-screen bg-background-light">
        <header className="flex items-center justify-between border-b border-primary/10 bg-white px-6 py-4 lg:px-10">
          <div>
            <h1 className="text-xl font-bold tracking-tight">GuestSeat SuperAdmin</h1>
            <p className="text-sm text-muted-foreground">Menaxhimi i klientëve dhe aksesit</p>
          </div>
          <Button
            variant="destructive"
            onClick={() => {
              localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
              setIsAdminLoggedIn(false);
            }}
          >
            Çkyçu
          </Button>
        </header>
        <main className="p-10">
          <SuperAdminScreen
            clients={clients}
            analytics={clientAnalytics}
            onCreateClient={handleCreateClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
          />
        </main>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLogin={async ({ email, password, accountName: fallbackAccountName }) => {
          const client = await api.loginClient({ email, password });
          const nextAccountName =
            `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() || fallbackAccountName;
          localStorage.setItem(ACCOUNT_NAME_STORAGE_KEY, nextAccountName);
          localStorage.setItem(AUTH_STORAGE_KEY, 'true');
          setAccountName(nextAccountName);
          setIsLoggedIn(true);
        }}
      />
    );
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
    localStorage.removeItem(ACCOUNT_NAME_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAccountName('');
    setIsLoggedIn(false);
    setScreen('Login');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light">
      <Header eventName={eventDetails?.name} accountName={accountName} onLogout={handleLogout} />
      <SidebarProvider className="flex flex-1 overflow-hidden min-h-0">
        <AppSidebar currentScreen={screen} setScreen={setScreen} />
        <SidebarInset className="overflow-y-auto p-10 custom-scrollbar">
          <AppErrorBoundary key={screen}>
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
                    onDeleteInvitation={handleDeleteInvitation}
                    onNavigate={setScreen}
                  />
                )}
                {screen === 'CheckIn' && (
                  <CheckInScreen
                    groups={groups}
                    tables={tables}
                    onMarkArrived={async (groupId) => {
                      await handleUpdateGuest(groupId, { arrivedAt: new Date().toISOString() });
                    }}
                  />
                )}
                {screen === 'InvitationTemplate' && eventDetails && (
                  <InvitationTemplateScreen 
                    eventDetails={eventDetails} 
                    onUpdate={handleUpdateEvent} 
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </AppErrorBoundary>
        </SidebarInset>
      </SidebarProvider>
      <footer className="border-t border-primary/10 py-4 px-10 text-center bg-white shrink-0">
        <p className="text-xs text-slate-400 font-medium">
          © 2024 GuestSeat Inc. Të gjitha të drejtat e rezervuara. {eventDetails && `| Planifikimi: ${eventDetails.name} në ${eventDetails.venueName}`}
        </p>
      </footer>
    </div>
  );
}
