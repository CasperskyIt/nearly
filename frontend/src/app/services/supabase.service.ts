import { Injectable, inject, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { LoggerService } from './logger.service';

export interface Place {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  address: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_dog_friendly: boolean;
  distance_km?: number;
}

export interface Review {
  id: string;
  place_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  supabase: SupabaseClient;
  private logger = inject(LoggerService);

  places = signal<Place[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
  }

  async getPlacesNearby(lat: number, lng: number, radiusKm: number = 10): Promise<Place[]> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabase
        .rpc('get_places_nearby', {
          lat,
          lng,
          radius_km: radiusKm
        });

      if (error) throw error;
      
      this.places.set(data || []);
      return data || [];
    } catch (err: any) {
      this.error.set(err.message);
      this.logger.error('Error fetching places:', err);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async getPlacesByCategory(category: string): Promise<Place[]> {
    this.loading.set(true);
    
    try {
      const { data, error } = await this.supabase
        .from('places')
        .select('*')
        .eq('category', category);

      if (error) throw error;
      
      return data || [];
    } catch (err: any) {
      this.error.set(err.message);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async addPlace(place: Omit<Place, 'id' | 'rating' | 'review_count' | 'created_at' | 'updated_at'>): Promise<Place | null> {
    try {
      const { data, error } = await this.supabase
        .from('places')
        .insert(place)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      this.error.set(err.message);
      return null;
    }
  }

  async addReview(placeId: string, rating: number, comment: string): Promise<Review | null> {
    try {
      const { data, error } = await this.supabase
        .from('reviews')
        .insert({
          place_id: placeId,
          rating,
          comment
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      this.error.set(err.message);
      return null;
    }
  }

  async toggleFavorite(placeId: string): Promise<boolean> {
    try {
      const { data: existing } = await this.supabase
        .from('favorites')
        .select('*')
        .eq('place_id', placeId)
        .single();

      if (existing) {
        await this.supabase
          .from('favorites')
          .delete()
          .eq('place_id', placeId);
        return false;
      } else {
        await this.supabase
          .from('favorites')
          .insert({ place_id: placeId });
        return true;
      }
    } catch (err: any) {
      this.error.set(err.message);
      return false;
    }
  }

  async getFavorites(): Promise<Place[]> {
    try {
      const { data, error } = await this.supabase
        .from('favorites')
        .select('places(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as any)?.map((f: any) => f.places) || [];
    } catch (err: any) {
      this.error.set(err.message);
      return [];
    }
  }

  async signUp(email: string, password: string) {
    return await this.supabase.auth.signUp({ email, password });
  }

  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }

  async getUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async updateProfile(username: string, avatarUrl?: string) {
    const user = await this.getUser();
    if (!user) return null;

    return await this.supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username,
        avatar_url: avatarUrl
      });
  }
}
