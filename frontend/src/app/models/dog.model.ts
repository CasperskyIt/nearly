export interface Dog {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  date_of_birth: string | null; // ISO date string from Supabase DATE column
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DogGuardian {
  id: string;
  dog_id: string;
  user_id: string;
  role: 'owner' | 'guardian';
  status: 'invited' | 'accepted';
  invite_token: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface CreateDogRequest {
  name: string;
  breed?: string;
  date_of_birth?: string; // ISO date string YYYY-MM-DD
}

export interface UpdateDogRequest {
  name?: string;
  breed?: string | null;
  date_of_birth?: string | null;
  avatar_url?: string | null;
}
