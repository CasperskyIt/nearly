export type Language = 'pl' | 'en' | 'uk' | 'de';

export interface Translations {
  app: {
    name: string;
    welcomeTitle: string;
    welcomeSubtitle: string;
    welcomeButton: string;
  };
  filters: {
    title: string;
  };
  places: {
    title: string;
    count: string;
    loading: string;
    notFound: string;
    notFoundHint: string;
  };
  categories: Record<string, string>;
  nav: {
    myDogs: string;
    myAccount: string;
    signOut: string;
  };
  auth: {
    signingIn: string;
    accountComingSoon: string;
  };
  dogs: {
    title: string;
    addDog: string;
    noDogs: string;
    name: string;
    namePlaceholder: string;
    nameRequired: string;
    breed: string;
    breedPlaceholder: string;
    dateOfBirth: string;
    datePlaceholder: string;
    adding: string;
    cancel: string;
    edit: string;
    delete: string;
    added: string;
    tabProfile: string;
    tabCare: string;
    tabHealth: string;
    tabCoGuardians: string;
    noCareEntries: string;
    careHint: string;
    noHealthRecords: string;
    healthHint: string;
    noCoGuardians: string;
    coGuardiansHint: string;
    careAddType: string;
    careNewTypeTitle: string;
    careTypeNamePlaceholder: string;
    careTypeIcon: string;
    careDeleteType: string;
    careDeleteTypeHint: string;
    careLogTitle: string;
    careLogButton: string;
    careNotes: string;
    careNotesPlaceholder: string;
    careNever: string;
    careToday: string;
    careYesterday: string;
    careTabTypes: string;
    careTabCalendar: string;
    careSchedule: string;
    careSetSchedule: string;
    careRemoveSchedule: string;
    careEvery: string;
    careDays: string;
    careWeeks: string;
    careMonths: string;
    careOverdue: string;
    careDueToday: string;
    careUpcoming: string;
    careHistory: string;
    careNoSchedules: string;
    careNoHistory: string;
    careDaysLeft: string;
    careDaysOverdue: string;
    careToDo: string;
  };
  common: {
    search: string;
    settings: string;
    myLocation: string;
    darkMode: string;
    lightMode: string;
    menu: string;
    signIn: string;
    signInWithGoogle: string;
    welcome: string;
    signInToContinue: string;
  };
}

export const translations: Record<Language, Translations> = {
  pl: {
    app: {
      name: 'Dogly',
      welcomeTitle: 'Odkryj okolicę',
      welcomeSubtitle: 'Znajdź ukryte perełki, kawiarnie, parki i nie tylko wokół Ciebie',
      welcomeButton: 'Znajdź przygody',
    },
    filters: {
      title: 'Kategorie',
    },
    places: {
      title: 'Miejsca w pobliżu',
      count: 'miejsc',
      loading: 'Ładowanie miejsc...',
      notFound: 'Brak miejsc w pobliżu',
      notFoundHint: 'Spróbuj innej kategorii lub przesuń mapę.',
    },
    categories: {
      restaurants: 'Restauracje',
      pubs: 'Puby',
      cafes: 'Kawiarnie',
      museums: 'Muzea',
      art_galleries: 'Galerie sztuki',
      parks: 'Parki',
      street_food: 'Street Food',
      fast_food: 'Fast Food',
      dog_parks: 'Parki dla psów',
      dog_run: 'Wybiegi',
      dog_cafe: 'Kawiarnie przyjazne psom',
      dog_restaurant: 'Restauracje przyjazne psom',
      dog_school: 'Szkoła dla psów',
      dog_shop: 'Sklepy zoologiczne',
      vet: 'Weterynarze',
    },
    nav: {
      myDogs: 'Moje psy',
      myAccount: 'Moje konto',
      signOut: 'Wyloguj się',
    },
    auth: {
      signingIn: 'Logowanie...',
      accountComingSoon: 'Zarządzanie kontem już wkrótce.',
    },
    dogs: {
      title: 'Moje psy',
      addDog: 'Dodaj psa',
      noDogs: 'Brak psów. Dodaj swojego pierwszego psa!',
      name: 'Imię',
      namePlaceholder: 'Imię psa',
      nameRequired: 'Imię jest wymagane',
      breed: 'Rasa',
      breedPlaceholder: 'np. Golden Retriever',
      dateOfBirth: 'Data urodzenia',
      datePlaceholder: 'Wybierz datę',
      adding: 'Dodawanie...',
      cancel: 'Anuluj',
      edit: 'Edytuj',
      delete: 'Usuń',
      added: 'Dodano',
      tabProfile: 'Profil',
      tabCare: 'Opieka',
      tabHealth: 'Zdrowie',
      tabCoGuardians: 'Opiekunowie',
      noCareEntries: 'Brak wpisów opieki.',
      careHint: 'Rejestrowanie opieki pojawi się w Fazie 5.',
      noHealthRecords: 'Brak rekordów zdrowia.',
      healthHint: 'Rekordy zdrowia pojawią się w Fazie 6.',
      noCoGuardians: 'Brak współopiekunów.',
      coGuardiansHint: 'Zaproś współopiekunów w Fazie 4.',
      careAddType: 'Dodaj typ',
      careNewTypeTitle: 'Nowy typ pielęgnacji',
      careTypeNamePlaceholder: 'np. Masaż',
      careTypeIcon: 'Ikona',
      careDeleteType: 'Usuń typ',
      careDeleteTypeHint: 'Wcześniejsze wpisy pielęgnacyjne pozostaną zapisane.',
      careLogTitle: 'Zaloguj pielęgnację',
      careLogButton: 'Zaloguj',
      careNotes: 'Notatki',
      careNotesPlaceholder: 'Opcjonalne notatki...',
      careNever: 'Nigdy',
      careToday: 'Dziś',
      careYesterday: 'Wczoraj',
      careTabTypes: 'Typy',
      careTabCalendar: 'Kalendarz',
      careSchedule: 'Harmonogram',
      careSetSchedule: 'Ustaw harmonogram',
      careRemoveSchedule: 'Usuń harmonogram',
      careEvery: 'Co',
      careDays: 'dni',
      careWeeks: 'tygodnie',
      careMonths: 'miesiące',
      careOverdue: 'Przeterminowane',
      careDueToday: 'Na dziś',
      careUpcoming: 'Nadchodzące',
      careHistory: 'Historia',
      careNoSchedules: 'Brak aktywnych harmonogramów. Ustaw harmonogram przy dowolnym typie pielęgnacji.',
      careNoHistory: 'Brak historii pielęgnacji.',
      careDaysLeft: 'za',
      careDaysOverdue: 'dni po terminie',
      careToDo: 'Do zrobienia',
    },
    common: {
      search: 'Szukaj',
      settings: 'Ustawienia',
      myLocation: 'Moja lokalizacja',
      darkMode: 'Tryb ciemny',
      lightMode: 'Tryb jasny',
      menu: 'Menu',
      signIn: 'Zaloguj się',
      signInWithGoogle: 'Zaloguj się przez Google',
      welcome: 'Witaj',
      signInToContinue: 'Zaloguj się, aby kontynuować',
    },
  },
  en: {
    app: {
      name: 'Dogly',
      welcomeTitle: 'Discover Nearby Adventures',
      welcomeSubtitle: 'Find hidden gems, coffee spots, parks and more around you',
      welcomeButton: 'Find adventures near me',
    },
    filters: {
      title: 'Categories',
    },
    places: {
      title: 'Nearby Places',
      count: 'places',
      loading: 'Loading places...',
      notFound: 'No places found nearby',
      notFoundHint: 'Try a different category or move the map to a new area.',
    },
    categories: {
      restaurants: 'Restaurants',
      pubs: 'Pubs',
      cafes: 'Cafés',
      museums: 'Museums',
      art_galleries: 'Art Galleries',
      parks: 'Parks',
      street_food: 'Street Food',
      fast_food: 'Fast Food',
      dog_parks: 'Dog Parks',
      dog_run: 'Dog Runs',
      dog_cafe: 'Dog-Friendly Cafes',
      dog_restaurant: 'Dog-Friendly Restaurants',
      dog_school: 'Dog Schools',
      dog_shop: 'Pet Shops',
      vet: 'Vets',
    },
    nav: {
      myDogs: 'My Dogs',
      myAccount: 'My Account',
      signOut: 'Sign out',
    },
    auth: {
      signingIn: 'Signing you in...',
      accountComingSoon: 'Account management coming soon.',
    },
    dogs: {
      title: 'My Dogs',
      addDog: 'Add Dog',
      noDogs: 'No dogs yet. Add your first dog!',
      name: 'Name',
      namePlaceholder: 'Your dog\'s name',
      nameRequired: 'Name is required',
      breed: 'Breed',
      breedPlaceholder: 'e.g. Golden Retriever',
      dateOfBirth: 'Date of Birth',
      datePlaceholder: 'Pick a date',
      adding: 'Adding...',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      added: 'Added',
      tabProfile: 'Profile',
      tabCare: 'Care',
      tabHealth: 'Health',
      tabCoGuardians: 'Co-Guardians',
      noCareEntries: 'No care entries yet.',
      careHint: 'Care logging ships in Phase 5.',
      noHealthRecords: 'No health records yet.',
      healthHint: 'Health records ship in Phase 6.',
      noCoGuardians: 'No co-guardians yet.',
      coGuardiansHint: 'Invite co-guardians in Phase 4.',
      careAddType: 'Add type',
      careNewTypeTitle: 'New care type',
      careTypeNamePlaceholder: 'e.g. Massage',
      careTypeIcon: 'Icon',
      careDeleteType: 'Remove type',
      careDeleteTypeHint: 'Previous care entries will be kept.',
      careLogTitle: 'Log care',
      careLogButton: 'Log',
      careNotes: 'Notes',
      careNotesPlaceholder: 'Optional notes...',
      careNever: 'Never',
      careToday: 'Today',
      careYesterday: 'Yesterday',
      careTabTypes: 'Types',
      careTabCalendar: 'Calendar',
      careSchedule: 'Schedule',
      careSetSchedule: 'Set schedule',
      careRemoveSchedule: 'Remove schedule',
      careEvery: 'Every',
      careDays: 'days',
      careWeeks: 'weeks',
      careMonths: 'months',
      careOverdue: 'Overdue',
      careDueToday: 'Due today',
      careUpcoming: 'Upcoming',
      careHistory: 'History',
      careNoSchedules: 'No active schedules. Set a schedule on any care type.',
      careNoHistory: 'No care history yet.',
      careDaysLeft: 'in',
      careDaysOverdue: 'days overdue',
      careToDo: 'To do',
    },
    common: {
      search: 'Search',
      settings: 'Settings',
      myLocation: 'My location',
      darkMode: 'Dark mode',
      lightMode: 'Light mode',
      menu: 'Menu',
      signIn: 'Sign in',
      signInWithGoogle: 'Sign in with Google',
      welcome: 'Welcome',
      signInToContinue: 'Sign in to continue',
    },
  },
  uk: {
    app: {
      name: 'Dogly',
      welcomeTitle: 'Відкрийте околиці',
      welcomeSubtitle: 'Знайдіть приховані перлини, кафе, парки та інше навколо вас',
      welcomeButton: 'Знайти пригоди',
    },
    filters: {
      title: 'Категорії',
    },
    places: {
      title: 'Місця поблизу',
      count: 'місць',
      loading: 'Завантаження місць...',
      notFound: 'Місць поблизу не знайдено',
      notFoundHint: 'Спробуйте іншу категорію або перемістіть карту.',
    },
    categories: {
      restaurants: 'Ресторани',
      pubs: 'Паби',
      cafes: 'Кафе',
      museums: 'Музеї',
      art_galleries: 'Художні галереї',
      parks: 'Парки',
      street_food: 'Вуличная їжа',
      fast_food: 'Фастфуд',
      dog_parks: 'Парки для собак',
      dog_run: 'Майданчики',
      dog_cafe: 'Кафе придатні для собак',
      dog_restaurant: 'Ресторани придатні для собак',
      dog_school: 'Школи для собак',
      dog_shop: 'Зоомагазини',
      vet: 'Ветеринари',
    },
    nav: {
      myDogs: 'Мої собаки',
      myAccount: 'Мій акаунт',
      signOut: 'Вийти',
    },
    auth: {
      signingIn: 'Входимо...',
      accountComingSoon: 'Керування акаунтом незабаром.',
    },
    dogs: {
      title: 'Мої собаки',
      addDog: 'Додати собаку',
      noDogs: 'Собак ще немає. Додайте свого першого!',
      name: 'Ім\'я',
      namePlaceholder: 'Ім\'я собаки',
      nameRequired: 'Ім\'я є обов\'язковим',
      breed: 'Порода',
      breedPlaceholder: 'напр. Золотистий ретривер',
      dateOfBirth: 'Дата народження',
      datePlaceholder: 'Оберіть дату',
      adding: 'Додавання...',
      cancel: 'Скасувати',
      edit: 'Редагувати',
      delete: 'Видалити',
      added: 'Додано',
      tabProfile: 'Профіль',
      tabCare: 'Догляд',
      tabHealth: 'Здоров\'я',
      tabCoGuardians: 'Співопікуни',
      noCareEntries: 'Записів догляду ще немає.',
      careHint: 'Реєстрація догляду з\'явиться у Фазі 5.',
      noHealthRecords: 'Записів здоров\'я ще немає.',
      healthHint: 'Записи здоров\'я з\'являться у Фазі 6.',
      noCoGuardians: 'Співопікунів ще немає.',
      coGuardiansHint: 'Запросіть співопікунів у Фазі 4.',
      careAddType: 'Додати тип',
      careNewTypeTitle: 'Новий тип догляду',
      careTypeNamePlaceholder: 'напр. Масаж',
      careTypeIcon: 'Іконка',
      careDeleteType: 'Видалити тип',
      careDeleteTypeHint: 'Попередні записи догляду залишаться.',
      careLogTitle: 'Записати догляд',
      careLogButton: 'Записати',
      careNotes: 'Нотатки',
      careNotesPlaceholder: 'Додаткові нотатки...',
      careNever: 'Ніколи',
      careToday: 'Сьогодні',
      careYesterday: 'Вчора',
      careTabTypes: 'Типи',
      careTabCalendar: 'Календар',
      careSchedule: 'Розклад',
      careSetSchedule: 'Налаштувати розклад',
      careRemoveSchedule: 'Видалити розклад',
      careEvery: 'Кожні',
      careDays: 'днів',
      careWeeks: 'тижнів',
      careMonths: 'місяців',
      careOverdue: 'Прострочено',
      careDueToday: 'На сьогодні',
      careUpcoming: 'Заплановано',
      careHistory: 'Історія',
      careNoSchedules: 'Немає активних розкладів. Налаштуйте розклад для будь-якого типу догляду.',
      careNoHistory: 'Немає історії догляду.',
      careDaysLeft: 'за',
      careDaysOverdue: 'днів прострочено',
      careToDo: 'Потрібно зробити',
    },
    common: {
      search: 'Пошук',
      settings: 'Налаштування',
      myLocation: 'Моє місцезнаходження',
      darkMode: 'Темний режим',
      lightMode: 'Світлий режим',
      menu: 'Меню',
      signIn: 'Увійти',
      signInWithGoogle: 'Увійти через Google',
      welcome: 'Ласкаво просимо',
      signInToContinue: 'Увійдіть, щоб продовжити',
    },
  },
  de: {
    app: {
      name: 'Dogly',
      welcomeTitle: 'Entdecke die Umgebung',
      welcomeSubtitle: 'Finde versteckte Perlen, Cafés, Parks und mehr in deiner Nähe',
      welcomeButton: 'Abenteuer finden',
    },
    filters: {
      title: 'Kategorien',
    },
    places: {
      title: 'Orte in der Nähe',
      count: 'Orte',
      loading: 'Orte werden geladen...',
      notFound: 'Keine Orte in der Nähe gefunden',
      notFoundHint: 'Versuche eine andere Kategorie oder verschiebe die Karte.',
    },
    categories: {
      restaurants: 'Restaurants',
      pubs: 'Bars',
      cafes: 'Cafés',
      museums: 'Museen',
      art_galleries: 'Kunstgalerien',
      parks: 'Parks',
      street_food: 'Street Food',
      fast_food: 'Fast Food',
      dog_parks: 'Hundeparks',
      dog_run: 'Hundeausläufe',
      dog_cafe: 'Hundefreundliche Cafés',
      dog_restaurant: 'Hundefreundliche Restaurants',
      dog_school: 'Hundeschulen',
      dog_shop: 'Tierhandlungen',
      vet: 'Tierärzte',
    },
    nav: {
      myDogs: 'Meine Hunde',
      myAccount: 'Mein Konto',
      signOut: 'Abmelden',
    },
    auth: {
      signingIn: 'Anmeldung läuft...',
      accountComingSoon: 'Kontoverwaltung demnächst verfügbar.',
    },
    dogs: {
      title: 'Meine Hunde',
      addDog: 'Hund hinzufügen',
      noDogs: 'Noch keine Hunde. Füge deinen ersten hinzu!',
      name: 'Name',
      namePlaceholder: 'Name deines Hundes',
      nameRequired: 'Name ist erforderlich',
      breed: 'Rasse',
      breedPlaceholder: 'z.B. Golden Retriever',
      dateOfBirth: 'Geburtsdatum',
      datePlaceholder: 'Datum wählen',
      adding: 'Wird hinzugefügt...',
      cancel: 'Abbrechen',
      edit: 'Bearbeiten',
      delete: 'Löschen',
      added: 'Hinzugefügt',
      tabProfile: 'Profil',
      tabCare: 'Pflege',
      tabHealth: 'Gesundheit',
      tabCoGuardians: 'Mitbetreuer',
      noCareEntries: 'Noch keine Pflegeeinträge.',
      careHint: 'Pflegeprotokoll kommt in Phase 5.',
      noHealthRecords: 'Noch keine Gesundheitseinträge.',
      healthHint: 'Gesundheitseinträge kommen in Phase 6.',
      noCoGuardians: 'Noch keine Mitbetreuer.',
      coGuardiansHint: 'Mitbetreuer in Phase 4 einladen.',
      careAddType: 'Typ hinzufügen',
      careNewTypeTitle: 'Neuer Pflegetyp',
      careTypeNamePlaceholder: 'z.B. Massage',
      careTypeIcon: 'Symbol',
      careDeleteType: 'Typ entfernen',
      careDeleteTypeHint: 'Frühere Pflegeeinträge bleiben erhalten.',
      careLogTitle: 'Pflege protokollieren',
      careLogButton: 'Protokollieren',
      careNotes: 'Notizen',
      careNotesPlaceholder: 'Optionale Notizen...',
      careNever: 'Nie',
      careToday: 'Heute',
      careYesterday: 'Gestern',
      careTabTypes: 'Typen',
      careTabCalendar: 'Kalender',
      careSchedule: 'Zeitplan',
      careSetSchedule: 'Zeitplan setzen',
      careRemoveSchedule: 'Zeitplan entfernen',
      careEvery: 'Alle',
      careDays: 'Tage',
      careWeeks: 'Wochen',
      careMonths: 'Monate',
      careOverdue: 'Überfällig',
      careDueToday: 'Heute fällig',
      careUpcoming: 'Bevorstehend',
      careHistory: 'Verlauf',
      careNoSchedules: 'Keine aktiven Zeitpläne. Lege einen Zeitplan für einen Pflegetyp fest.',
      careNoHistory: 'Noch kein Pflegeverlauf.',
      careDaysLeft: 'in',
      careDaysOverdue: 'Tage überfällig',
      careToDo: 'Zu erledigen',
    },
    common: {
      search: 'Suchen',
      settings: 'Einstellungen',
      myLocation: 'Mein Standort',
      darkMode: 'Dunkelmodus',
      lightMode: 'Hellmodus',
      menu: 'Menü',
      signIn: 'Anmelden',
      signInWithGoogle: 'Mit Google anmelden',
      welcome: 'Willkommen',
      signInToContinue: 'Melde dich an, um fortzufahren',
    },
  },
};

export const languageNames: Record<Language, string> = {
  pl: 'Polski',
  en: 'English',
  uk: 'Українська',
  de: 'Deutsch',
};
