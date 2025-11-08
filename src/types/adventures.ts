export interface Adventure {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  departure_date?: string | null;
  arrival_date?: string | null;
}

export interface AdventurePlace {
  id: string;
  adventure_id: string;
  name: string;
  description?: string;
  order_index: number;
  created_at: string;
}

export interface AdventureDestination {
  id: string;
  adventure_id: string;
  name: string;
  description?: string;
  image_url?: string;
  tags?: string[] | string; // Può essere array o JSON string
  order_index?: number;
  created_at: string;
  updated_at: string;
}

export interface AdventureDestinationPlace {
  id: string;
  destination_id: string;
  name: string;
  description?: string;
  order_index: number;
  created_at: string;
}

export interface AdventureDestinationVote {
  id: string;
  destination_id: string;
  user_id: string;
  vote_type: 'yes' | 'no' | 'proponi';
  comment?: string;
  created_at: string;
  updated_at: string;
  user_email?: string; // Aggiunto per visualizzazione
  display_name?: string; // Nome completo (Nome Cognome) o email come fallback
}

export interface AdventureCreator {
  id: string;
  adventure_id: string;
  user_id: string;
  created_at: string;
}

export interface AdventureParticipant {
  id: string;
  adventure_id: string;
  user_id: string;
  added_by: string;
  created_at: string;
  invitation_status?: 'pending' | 'accepted' | 'declined';
  role?: 'adventure_manager' | 'adventure_participant';
  user_email?: string; // Aggiunto per visualizzazione
  display_name?: string; // Nome completo (Nome Cognome) o email come fallback
  first_name?: string | null;
  last_name?: string | null;
  // Permessi per questo partecipante in questa avventura
  permissions?: {
    can_view_statistics: boolean;
    can_edit: boolean;
    can_view_only: boolean;
  };
}

export interface AdventureDestinationWithPlaces extends AdventureDestination {
  places: AdventureDestinationPlace[];
  votes?: AdventureDestinationVote[];
  vote_count_yes?: number;
  vote_count_no?: number;
  vote_count_proponi?: number;
  total_votes?: number;
  user_vote?: AdventureDestinationVote | null;
  total_cost?: number;
  transports?: any[];
}

export interface AdventureWithDestinations {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  departure_date?: string | null;
  arrival_date?: string | null;
  destinations: AdventureDestinationWithPlaces[];
  participants?: AdventureParticipant[];
  creators?: AdventureCreator[];
}

export interface DestinationTransport {
  id: string;
  destination_id: string;
  transport_type: 'flight' | 'train' | 'hotel' | 'bus' | 'car' | 'other';
  departure_date?: string | null;
  departure_time?: string | null;
  arrival_date?: string | null;
  arrival_time?: string | null;
  cost?: number | null;
  cost_type: 'fixed' | 'estimated' | 'variable';
  info_link?: string | null;
  notes?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
