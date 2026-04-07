import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should show a Sign in link when currentUser signal is null', () => { pending(); });
  xit('should show an avatar circle when currentUser signal is present', () => { pending(); });
  xit('should open MatMenu on avatar click', () => { pending(); });
  xit('should open a sign-out confirmation dialog when Sign out menu item is clicked', () => { pending(); });
  xit('should navigate to /:app/login after confirmed sign-out', () => { pending(); });
});
