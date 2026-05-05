export type RSVPStatus = 'Draft' | 'Sent' | 'Responded';

export interface EventDetails {
  id: string;
  name: string;
  brideName?: string;
  closingMessage?: string;
  date: string;
  time?: string;
  invitationHeading?: string;
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
  arrivedAt?: string;
  createdAt?: string;
}

export interface Table {
  id: string;
  eventId: string;
  name: string;
  capacity: number;
  createdAt?: string;
}

export interface ClientAccount {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  accessStart: string;
  accessEnd: string;
  isActive: boolean;
  createdAt?: string;
}

export interface ClientAnalytics {
  total: number;
  active: number;
  expired: number;
  upcoming: number;
  expiringSoon: number;
}

export type Screen = 'Login' | 'Dashboard' | 'GuestList' | 'SeatingPlan' | 'CreateEvent' | 'Invitations' | 'RSVP' | 'CheckIn' | 'InvitationTemplate';
