import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { LoggerService } from './logger.service';
import { Dog, CreateDogRequest, UpdateDogRequest, DogGuardian, DogGuardianWithProfile } from '../models/dog.model';

@Injectable({ providedIn: 'root' })
export class DogService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);

  // State signals (per D-28)
  currentDog = signal<Dog | null>(null);
  dogs = signal<Dog[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  /**
   * Fetch all dogs accessible by the current user (owner + accepted co-guardian dogs)
   * RLS policy automatically filters to user's accessible dogs
   */
  async getDogs(): Promise<Dog[]> {
    try {
      this.loading.set(true);
      this.error.set(null);

      const { data, error } = await this.supabaseService.supabase
        .from('dogs')
        .select('*');

      if (error) throw error;

      const dogs = data || [];
      this.dogs.set(dogs);
      return dogs;
    } catch (err: any) {
      this.error.set(err.message);
      this.logger.error('DogService: Error fetching dogs', err);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Create a new dog for the current user (becomes owner)
   */
  async createDog(request: CreateDogRequest): Promise<Dog | null> {
    try {
      this.loading.set(true);
      this.error.set(null);

      // getSession() both retrieves the user ID and ensures the client
      // has an active JWT for the subsequent database INSERT.
      // getUser() alone doesn't guarantee the internal session is loaded.
      const { data: { session } } = await this.supabaseService.supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }
      const user = session.user;

      // Prepare insert payload (include only defined fields)
      const insertPayload: any = {
        owner_id: user.id,
        name: request.name,
      };
      if (request.breed !== undefined) {
        insertPayload.breed = request.breed;
      }
      if (request.date_of_birth !== undefined) {
        insertPayload.date_of_birth = request.date_of_birth;
      }

      const { data, error } = await this.supabaseService.supabase
        .from('dogs')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;

      const dog = data as Dog;
      // Add to dogs array
      this.dogs.set([...this.dogs(), dog]);
      // Set as current dog
      this.setCurrentDog(dog);
      return dog;
    } catch (err: any) {
      this.error.set(err.message);
      this.logger.error('DogService: Error creating dog', err);
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Update an existing dog
   */
  async updateDog(id: string, request: UpdateDogRequest): Promise<Dog | null> {
    try {
      this.loading.set(true);
      this.error.set(null);

      // Add updated_at timestamp
      const updatePayload = {
        ...request,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabaseService.supabase
        .from('dogs')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const dog = data as Dog;

      // Update dog in dogs array
      this.dogs.set(
        this.dogs().map(d => (d.id === id ? dog : d))
      );

      // Update currentDog if it was the updated dog
      if (this.currentDog()?.id === id) {
        this.setCurrentDog(dog);
      }

      return dog;
    } catch (err: any) {
      this.error.set(err.message);
      this.logger.error('DogService: Error updating dog', err);
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Delete a dog (CASCADE deletes dog_guardians, care_events, health_records, reminders)
   */
  async deleteDog(id: string): Promise<boolean> {
    try {
      this.loading.set(true);
      this.error.set(null);

      const { error } = await this.supabaseService.supabase
        .from('dogs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from dogs array
      this.dogs.set(this.dogs().filter(d => d.id !== id));

      // Clear currentDog if it was the deleted dog
      if (this.currentDog()?.id === id) {
        this.setCurrentDog(null);
      }

      return true;
    } catch (err: any) {
      this.error.set(err.message);
      this.logger.error('DogService: Error deleting dog', err);
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Upload avatar image to dog-avatars bucket and update dog's avatar_url
   * Returns public URL with cache-busting query param
   */
  async uploadAvatar(dogId: string, file: File): Promise<string | null> {
    try {
      this.loading.set(true);
      this.error.set(null);

      // Upload to dog-avatars bucket
      const { data, error: uploadError } = await this.supabaseService.supabase.storage
        .from('dog-avatars')
        .upload(dogId, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL with cache-busting query param
      const { data: publicUrlData } = this.supabaseService.supabase.storage
        .from('dog-avatars')
        .getPublicUrl(dogId);

      const publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

      // Update dog's avatar_url
      const result = await this.updateDog(dogId, { avatar_url: publicUrl });

      return result ? publicUrl : null;
    } catch (err: any) {
      this.error.set(err.message);
      this.logger.error('DogService: Error uploading avatar', err);
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Set the current dog and persist in sessionStorage
   */
  setCurrentDog(dog: Dog | null): void {
    this.currentDog.set(dog);
    if (dog) {
      sessionStorage.setItem('currentDogId', dog.id);
    } else {
      sessionStorage.removeItem('currentDogId');
    }
  }

  /**
   * Restore currentDog from sessionStorage
   * Fetches dogs list if empty, then finds and sets matching dog
   */
  async restoreCurrentDog(): Promise<void> {
    try {
      const currentDogId = sessionStorage.getItem('currentDogId');
      if (!currentDogId) {
        return;
      }

      let dogs = this.dogs();
      if (dogs.length === 0) {
        dogs = await this.getDogs();
      }

      const dog = dogs.find(d => d.id === currentDogId);
      if (dog) {
        this.setCurrentDog(dog);
      }
    } catch (err: any) {
      this.logger.error('DogService: Error restoring current dog', err);
    }
  }

  /**
   * Get all guardians for a dog (both accepted and invited), enriched with profile data.
   */
  async getGuardians(dogId: string): Promise<DogGuardianWithProfile[]> {
    try {
      const { data: guardians, error } = await this.supabaseService.supabase
        .from('dog_guardians')
        .select('*')
        .eq('dog_id', dogId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!guardians?.length) return [];

      const userIds = guardians.map(g => g.user_id);
      const { data: profiles } = await this.supabaseService.supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? []);

      return guardians.map(g => ({
        ...g,
        username: profileMap.get(g.user_id)?.username ?? null,
        profile_avatar_url: profileMap.get(g.user_id)?.avatar_url ?? null,
      }));
    } catch (err: any) {
      this.error.set(err.message);
      this.logger.error('DogService: Error fetching guardians', err);
      return [];
    }
  }

  /**
   * Invite a user by username to be a co-guardian.
   * Returns null if the username doesn't exist, throws on DB error.
   */
  async inviteGuardian(dogId: string, email: string): Promise<DogGuardianWithProfile | null> {
    const { data, error } = await this.supabaseService.supabase.functions.invoke('invite-guardian', {
      body: { dogId, email },
    });

    if (error) throw error;
    if (data?.error === 'duplicate') throw new Error('duplicate');

    const guardian = data?.guardian as DogGuardianWithProfile;
    // For existing users the edge fn may return invited_email; for new users user_id is null
    if (!guardian.username && data?.type === 'new_user') {
      guardian.username = email;
    }
    return guardian;
  }

  /**
   * Remove a guardian entry (cancels invite or removes accepted guardian).
   */
  async removeGuardian(guardianId: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseService.supabase
        .from('dog_guardians')
        .delete()
        .eq('id', guardianId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      this.logger.error('DogService: Error removing guardian', err);
      return false;
    }
  }
}
