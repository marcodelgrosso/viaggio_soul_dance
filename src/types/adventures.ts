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

export interface AdventureCreator {
  id: string;
  adventure_id: string;
  user_id: string;
  created_at: string;
}

export interface AdventureWithPlaces extends Adventure {
  places: AdventurePlace[];
  creators: AdventureCreator[];
}

