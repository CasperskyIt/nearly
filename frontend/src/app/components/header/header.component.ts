import { Component, inject, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SupabaseService } from '../../services/supabase.service';
import { ThemeService } from '../../config/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule, MatDialogModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  menuClick = output<void>();

  protected supabase = inject(SupabaseService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  protected themeService = inject(ThemeService);

  protected getInitials(): string {
    const user = this.supabase.currentUser();
    if (!user) return '';
    const name = user.user_metadata?.['full_name'] as string | undefined;
    if (name) return name.charAt(0).toUpperCase();
    return (user.email ?? '').charAt(0).toUpperCase();
  }

  private getAppPrefix(): string {
    return this.themeService.theme?.name?.toLowerCase() ?? 'dogly';
  }

  protected onSignIn(): void {
    this.router.navigate([`/${this.getAppPrefix()}/login`]);
  }

  protected onSignOut(): void {
    const appName = this.themeService.theme?.strings?.appName ?? 'Dogly';
    const dialogRef = this.dialog.open(SignOutConfirmDialog, {
      data: { appName },
      width: '340px',
    });
    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        await this.supabase.signOut();
        this.router.navigate([`/${this.getAppPrefix()}/login`]);
      }
    });
  }

  protected onMyAccount(): void {
    this.router.navigate([`/${this.getAppPrefix()}/account`]);
  }
}

@Component({
  selector: 'app-sign-out-confirm',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Sign out of {{ data.appName }}?</h2>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="true">Sign out</button>
    </mat-dialog-actions>
  `,
})
export class SignOutConfirmDialog {
  data = inject<{ appName: string }>(MAT_DIALOG_DATA);
}
