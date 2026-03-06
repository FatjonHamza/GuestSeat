export type RSVPStatus = 'Draft' | 'Sent' | 'Responded';

export interface EventDetails {
  id: string;
  name: string;
  date: string;
  time?: string;
  venueName: string;
  venueAddress?: string;
  venueMapUrl?: string;
  message?: string;
  rsvpDeadline?: string;
  theme?: string; // JSON string or theme ID
}

export interface Invitation {
  id: string;
  eventId: string;
  inviteeName: string;
  email?: string;
  allowedGuests: number;
  token: string;
  status: RSVPStatus;
  sentAt?: string;
  respondedAt?: string;
  createdAt?: string;
}

export interface GuestGroup {
  id: string;
  eventId: string;
  invitationId?: string;
  attendees: string[];
  groupSize: number;
  note?: string;
  tableId?: string;
  createdAt?: string;
}

export interface Table {
  id: string;
  eventId: string;
  name: string;
  capacity: number;
  createdAt?: string;
}

export type Screen = 'Login' | 'Dashboard' | 'GuestList' | 'SeatingPlan' | 'CreateEvent' | 'Invitations' | 'RSVP' | 'CheckIn' | 'InvitationTemplate';
