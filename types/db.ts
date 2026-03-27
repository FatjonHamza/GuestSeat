export interface EventRow {
  id: string;
  name: string;
  date: string;
  time: string | null;
  venue_name: string;
  venue_address: string | null;
  venue_map_url: string | null;
  message: string | null;
  rsvp_deadline: string | null;
  theme: string | null;
}

export interface InvitationRow {
  id: string;
  event_id: string;
  invitee_name: string;
  email: string | null;
  allowed_guests: number;
  token: string;
  status: string | null;
  sent_at: string | null;
  responded_at: string | null;
  created_at: string | null;
}

export interface GuestGroupRow {
  id: string;
  event_id: string;
  invitation_id: string | null;
  attendees: string;
  group_size: number;
  note: string | null;
  table_id: string | null;
  created_at: string | null;
}

export interface TableRow {
  id: string;
  event_id: string;
  name: string;
  capacity: number;
  created_at: string | null;
}
