import { TestBed } from '@angular/core/testing';
import { SupabaseService } from './supabase.service';

describe('SupabaseService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  xit('should expose a currentUser signal initialized to null', () => { pending(); });
  xit('should populate currentUser after initSession() resolves with a user', () => { pending(); });
  xit('should call signInWithOAuth with provider google and PKCE flow', () => { pending(); });
  xit('should call supabase.auth.signOut on signOut()', () => { pending(); });
  xit('should update currentUser signal on SIGNED_IN onAuthStateChange event', () => { pending(); });
  xit('should update currentUser signal to null on SIGNED_OUT onAuthStateChange event', () => { pending(); });
});
