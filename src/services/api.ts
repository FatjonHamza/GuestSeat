import { EventDetails, Invitation, GuestGroup, Table, ClientAccount, ClientAnalytics } from '../types';

const API_BASE = typeof import.meta.env.VITE_API_BASE === 'string' && import.meta.env.VITE_API_BASE
  ? import.meta.env.VITE_API_BASE.replace(/\/$/, '')
  : '/api';
const REQUEST_TIMEOUT_MS = 10000;

function createTimeoutSignal(timeoutMs = REQUEST_TIMEOUT_MS): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

async function parseJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(res.ok ? 'Invalid JSON response' : text || `Request failed (${res.status})`);
  }
}

export const api = {
  // Events
  createEvent: async (details: Partial<EventDetails>): Promise<EventDetails> => {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error((data as { error?: string }).error || `Failed (${res.status})`);
    return data as EventDetails;
  },
  getEvents: async (): Promise<EventDetails[]> => {
    const res = await fetch(`${API_BASE}/events`);
    return res.json();
  },
  getEvent: async (id: string): Promise<EventDetails> => {
    const res = await fetch(`${API_BASE}/events/${id}`);
    return res.json();
  },
  updateEvent: async (id: string, details: Partial<EventDetails>): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error((data as { error?: string }).error || `Failed (${res.status})`);
    return data as { success: boolean };
  },

  // Invitations
  createInvitation: async (invitation: Partial<Invitation>): Promise<Invitation> => {
    const res = await fetch(`${API_BASE}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invitation),
    });
    return res.json();
  },
  getInvitations: async (eventId: string): Promise<Invitation[]> => {
    const res = await fetch(`${API_BASE}/events/${eventId}/invitations`);
    return res.json();
  },
  deleteInvitation: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE}/invitations/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error || `Delete failed (${res.status})`);
    return data as { success: boolean };
  },
  getInvitationByToken: async (token: string): Promise<Invitation & EventDetails> => {
    const res = await fetch(`${API_BASE}/rsvp/${token}`, { cache: 'no-store' });
    return res.json();
  },

  // RSVP
  submitRSVP: async (data: { token: string; attendees: string[]; note?: string; attendance: 'Yes' | 'No' }): Promise<{ success: boolean; guestGroupId?: string }> => {
    const res = await fetch(`${API_BASE}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Guests
  createGuest: async (guest: Partial<GuestGroup>): Promise<{ id: string; success: boolean }> => {
    const res = await fetch(`${API_BASE}/guests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guest),
    });
    return res.json();
  },
  getGuests: async (eventId: string): Promise<GuestGroup[]> => {
    const res = await fetch(`${API_BASE}/events/${eventId}/guests`, { cache: 'no-store' });
    return res.json();
  },
  updateGuest: async (id: string, data: Partial<Pick<GuestGroup, 'attendees' | 'note' | 'tableId' | 'arrivedAt'>>): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE}/guests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteGuest: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE}/guests/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error || `Delete failed (${res.status})`);
    return data as { success: boolean };
  },

  // Tables
  createTable: async (table: Partial<Table>): Promise<Table> => {
    const res = await fetch(`${API_BASE}/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(table),
    });
    return res.json();
  },
  getTables: async (eventId: string): Promise<Table[]> => {
    const res = await fetch(`${API_BASE}/events/${eventId}/tables`);
    return res.json();
  },
  assignTable: async (guestGroupId: string, tableId: string | null): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE}/tables/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestGroupId, tableId }),
    });
    return res.json();
  },

  // SuperAdmin Clients
  getClients: async (): Promise<ClientAccount[]> => {
    const res = await fetch(`${API_BASE}/clients`);
    return res.json();
  },
  getClientAnalytics: async (): Promise<ClientAnalytics> => {
    const res = await fetch(`${API_BASE}/clients/analytics`);
    return res.json();
  },
  createClient: async (payload: Omit<ClientAccount, 'id' | 'createdAt'>): Promise<{ id: string; success: boolean; emailSent: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error((data as { error?: string }).error || `Failed (${res.status})`);
    return data as { id: string; success: boolean; emailSent: boolean; message: string };
  },
  updateClient: async (id: string, payload: Partial<Omit<ClientAccount, 'id' | 'createdAt'>>): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE}/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error((data as { error?: string }).error || `Failed (${res.status})`);
    return data as { success: boolean };
  },
  deleteClient: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE}/clients/${id}`, { method: 'DELETE' });
    const data = await parseJson(res);
    if (!res.ok) throw new Error((data as { error?: string }).error || `Failed (${res.status})`);
    return data as { success: boolean };
  },
  loginClient: async (payload: { email: string; password: string }): Promise<ClientAccount> => {
    const query = new URLSearchParams({
      email: payload.email,
      password: payload.password,
    });
    const res = await fetch(`${API_BASE}/clients/login?${query.toString()}`, {
      method: 'GET',
      signal: createTimeoutSignal(),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error((data as { error?: string }).error || `Failed (${res.status})`);
    return data as ClientAccount;
  },
};
