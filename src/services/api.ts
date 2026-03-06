import { EventDetails, Invitation, GuestGroup, Table } from '../types';

const API_BASE = '/api';

export const api = {
  // Events
  createEvent: async (details: Partial<EventDetails>): Promise<EventDetails> => {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    return res.json();
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
    return res.json();
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
  getInvitationByToken: async (token: string): Promise<Invitation & EventDetails> => {
    const res = await fetch(`${API_BASE}/rsvp/${token}`);
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
  updateGuest: async (id: string, data: Partial<Pick<GuestGroup, 'attendees' | 'note' | 'tableId'>>): Promise<{ success: boolean }> => {
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
};
