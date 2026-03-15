import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { I18nService } from './app/config/i18n.service';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

const i18n = new I18nService();
i18n.init();
