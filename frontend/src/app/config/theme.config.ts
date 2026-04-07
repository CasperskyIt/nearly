export interface AppTheme {
  name: string;
  logo?: string;
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    accent: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  icons: {
    logo: string;
    marker: string;
    categories: Record<string, string>;
  };
  strings: {
    appName: string;
    welcomeTitle: string;
    welcomeSubtitle: string;
    welcomeButton: string;
    filtersTitle: string;
    placesTitle: string;
    categories: Record<string, string>;
  };
}

export const themes: Record<string, AppTheme> = {
  dogly: {
    name: 'Dogly',
    logo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <ellipse cx="50" cy="65" rx="18" ry="15" fill="#1a1a1a"/>
      <circle cx="30" cy="40" r="10" fill="#1a1a1a"/>
      <circle cx="50" cy="30" r="10" fill="#1a1a1a"/>
      <circle cx="70" cy="40" r="10" fill="#1a1a1a"/>
    </svg>`,
    colors: {
      primary: '#795548',
      primaryDark: '#5D4037',
      primaryLight: '#A1887F',
      accent: '#FF8A65',
      background: '#FAF8F5',
      surface: '#FFFFFF',
      surfaceVariant: '#F5F0EB',
      text: '#3E2723',
      textSecondary: '#6D4C41',
      border: '#D7CCC8',
      success: '#66BB6A',
      warning: '#FFA726',
      error: '#EF5350',
    },
    icons: {
      logo: 'pets',
      marker: 'pets',
      categories: {
        dog_parks: 'park',
        dog_run: 'grass',
        dog_cafe: 'local_cafe',
        dog_restaurant: 'restaurant',
        dog_school: 'school',
        dog_shop: 'pets',
        vet: 'local_hospital',
      },
    },
    strings: {
      appName: 'Dogly',
      welcomeTitle: 'Find Dog-Friendly Places',
      welcomeSubtitle: 'Discover the best spots for you and your furry friend',
      welcomeButton: 'Find places near me',
      filtersTitle: 'Categories',
      placesTitle: 'Nearby Spots',
      categories: {
        dog_parks: 'Parks',
        dog_run: 'Dog Runs',
        dog_cafe: 'Dog Cafes',
        dog_restaurant: 'Restaurants',
        dog_school: 'Dog Schools',
        dog_shop: 'Pet Shops',
        vet: 'Vets',
      },
    },
  },
};
