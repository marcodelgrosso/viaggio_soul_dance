export interface Adventure {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
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
  tags?: string[];
  order_index: number;
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
  user_email?: string; // Aggiunto per visualizzazione
}

export interface AdventureDestinationWithPlaces extends AdventureDestination {
  places: AdventureDestinationPlace[];
  votes?: AdventureDestinationVote[];
  vote_count_yes?: number;
  vote_count_no?: number;
  vote_count_proponi?: number;
  user_vote?: AdventureDestinationVote | null;
}

export interface AdventureWithDestinations extends Adventure {
  destinations: AdventureDestinationWithPlaces[];
  creators: AdventureCreator[];
  participants: AdventureParticipant[];
  // Manteniamo places per retrocompatibilità durante la migrazione
  places?: AdventurePlace[];
}

