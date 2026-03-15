-- Sample data for Nearly (non-dog-friendly places)
INSERT INTO public.places (name, description, latitude, longitude, category, address, rating, review_count, is_verified, is_dog_friendly) VALUES
('Restauracja U Wesołego Romana', 'Tradycyjna polska kuchnia', 52.2297, 21.0122, 'restaurants', 'ul. Wiejska 1, Warszawa', 4.5, 23, true, false),
('Pub Na Rogu', 'Przytulny pub z piwem rzemieślniczym', 52.2315, 21.0210, 'pubs', 'ul. Nowa 10, Warszawa', 4.3, 15, true, false),
('Kawiarnia Kropka', 'Kawiarnia specialty z ciastami', 52.2280, 21.0150, 'cafes', 'ul. Marszałkowska 5, Warszawa', 4.7, 42, true, false),
('Muzeum Powstania Warszawskiego', 'Muzeum poświęcone powstaniu warszawskiemu', 52.2320, 21.0180, 'museums', 'ul. Grzybowska 79, Warszawa', 4.8, 156, true, false),
('Galeria Sztuki Współczesnej', 'Galeria sztuki współczesnej', 52.2300, 21.0100, 'art_galleries', 'ul. Krakowskie Przedmieście 21, Warszawa', 4.4, 34, true, false),
('Park Skaryszewski', 'Park z fontanną i altanami', 52.2340, 21.0250, 'parks', 'Park Skaryszewski, Warszawa', 4.6, 89, true, false),
('Food Truck Rally', 'Miejsce spotkań food trucków', 52.2270, 21.0080, 'street_food', 'Plac Zbawiciela, Warszawa', 4.2, 67, true, false),
('McDonald''s Central', 'Fast food', 52.2350, 21.0300, 'fast_food', 'ul. Centrum 1, Warszawa', 3.9, 234, true, false);

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
