-- Sample data for Dogly (dog-friendly places)
INSERT INTO public.places (name, description, latitude, longitude, category, address, rating, review_count, is_verified, is_dog_friendly) VALUES
('Central Bark Cafe', 'Kawiarnia przyjazna psom z miskami', 52.2297, 21.0122, 'dog_cafe', 'ul. Poznańska 15, Warszawa', 4.8, 45, true, true),
('Paws Park', 'Duży park dla psów z wybiegiem', 52.2315, 21.0210, 'dog_parks', 'Park Poleczki, Warszawa', 4.6, 78, true, true),
('Barking Bistro', 'Restauracja z tarasem dla psów', 52.2280, 21.0150, 'dog_restaurant', 'ul. Mokotowska 22, Warszawa', 4.5, 32, true, true),
('Puppy Academy', 'Szkoła tresury psów', 52.2320, 21.0180, 'dog_school', 'ul. Wołoska 12, Warszawa', 4.9, 56, true, true),
('Vet Care Plus', 'Przychodnia weterynaryjna 24/7', 52.2300, 21.0100, 'vet', 'ul. Lindley''a 4, Warszawa', 4.7, 89, true, true),
('Happy Tails Run', 'Wybieg dla psów w centrum', 52.2340, 21.0250, 'dog_run', 'Park Służewiecki, Warszawa', 4.4, 41, true, true),
('Woof & Brew', 'Pub z piwem i przysmakami dla psów', 52.2270, 21.0080, 'dog_cafe', 'ul. Szkolna 8, Warszawa', 4.3, 27, true, true),
('Green Paws Park', 'Zielony park dla psów', 52.2350, 21.0300, 'dog_parks', 'Park Arkadia, Warszawa', 4.7, 63, true, true);
