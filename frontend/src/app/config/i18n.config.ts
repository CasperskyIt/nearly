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
  };
  categories: Record<string, string>;
  common: {
    search: string;
    settings: string;
    myLocation: string;
    darkMode: string;
    lightMode: string;
    menu: string;
  };
}

export const translations: Record<Language, Translations> = {
  pl: {
    app: {
      name: 'Nearly',
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
      dog_shop: 'Sklepy zoologiczny',
      vet: 'Weterynarze',
    },
    common: {
      search: 'Szukaj',
      settings: 'Ustawienia',
      myLocation: 'Moja lokalizacja',
      darkMode: 'Tryb ciemny',
      lightMode: 'Tryb jasny',
      menu: 'Menu',
    },
  },
  en: {
    app: {
      name: 'Nearly',
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
    common: {
      search: 'Search',
      settings: 'Settings',
      myLocation: 'My location',
      darkMode: 'Dark mode',
      lightMode: 'Light mode',
      menu: 'Menu',
    },
  },
  uk: {
    app: {
      name: 'Nearly',
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
    common: {
      search: 'Пошук',
      settings: 'Налаштування',
      myLocation: 'Моє місцезнаходження',
      darkMode: 'Темний режим',
      lightMode: 'Світлий режим',
      menu: 'Меню',
    },
  },
  de: {
    app: {
      name: 'Nearly',
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
    common: {
      search: 'Suchen',
      settings: 'Einstellungen',
      myLocation: 'Mein Standort',
      darkMode: 'Dunkelmodus',
      lightMode: 'Hellmodus',
      menu: 'Menü',
    },
  },
};

export const languageNames: Record<Language, string> = {
  pl: 'Polski',
  en: 'English',
  uk: 'Українська',
  de: 'Deutsch',
};
