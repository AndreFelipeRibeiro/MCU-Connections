// MCU titles data — public factual info; posters are abstract original art
// Phase 1-5, films + Disney+ series through early 2025
// chronOrder is approximate in-universe chronological order

const TITLES = [
  // Phase 1
  { id: 'iron-man', title: 'Iron Man', year: 2008, phase: 1, type: 'film', release: '2008-05-02', chronOrder: 11, accent: '#d4a05a', cast: ['tony', 'rhodey', 'pepper', 'fury', 'happy'] },
  { id: 'incredible-hulk', title: 'The Incredible Hulk', year: 2008, phase: 1, type: 'film', release: '2008-06-13', chronOrder: 12, accent: '#5fa856', cast: ['ross', 'bruce', 'tony'] },
  { id: 'iron-man-2', title: 'Iron Man 2', year: 2010, phase: 1, type: 'film', release: '2010-05-07', chronOrder: 13, accent: '#c25a3a', cast: ['tony', 'rhodey', 'pepper', 'natasha', 'fury', 'happy'] },
  { id: 'thor', title: 'Thor', year: 2011, phase: 1, type: 'film', release: '2011-05-06', chronOrder: 14, accent: '#7e9bd6', cast: ['jane', 'sif', 'odin', 'heimdall', 'thor', 'loki', 'clint', 'fury'] },
  { id: 'cap-first-avenger', title: 'Captain America: The First Avenger', year: 2011, phase: 1, type: 'film', release: '2011-07-22', chronOrder: 1, accent: '#4a6da3', cast: ['peggy', 'steve', 'bucky', 'fury'] },
  { id: 'avengers', title: 'The Avengers', year: 2012, phase: 1, type: 'film', release: '2012-05-04', chronOrder: 15, accent: '#a23a3a', cast: ['tony', 'steve', 'thor', 'bruce', 'natasha', 'clint', 'loki', 'fury', 'pepper'] },

  // Phase 2
  { id: 'iron-man-3', title: 'Iron Man 3', year: 2013, phase: 2, type: 'film', release: '2013-05-03', chronOrder: 16, accent: '#c25a3a', cast: ['trevor', 'tony', 'rhodey', 'pepper', 'bruce', 'happy'] },
  { id: 'thor-dark-world', title: 'Thor: The Dark World', year: 2013, phase: 2, type: 'film', release: '2013-11-08', chronOrder: 17, accent: '#5a4a8a', cast: ['jane', 'sif', 'odin', 'heimdall', 'thor', 'loki'] },
  { id: 'cap-winter-soldier', title: 'Captain America: The Winter Soldier', year: 2014, phase: 2, type: 'film', release: '2014-04-04', chronOrder: 18, accent: '#3a5a7a', cast: ['peggy', 'steve', 'bucky', 'natasha', 'fury', 'sam', 'wanda'] },
  { id: 'gotg', title: 'Guardians of the Galaxy', year: 2014, phase: 2, type: 'film', release: '2014-08-01', chronOrder: 19, accent: '#7a4ea0', cast: ['quill', 'gamora', 'rocket', 'groot', 'drax', 'nebula', 'yondu'] },
  { id: 'aou', title: 'Avengers: Age of Ultron', year: 2015, phase: 2, type: 'film', release: '2015-05-01', chronOrder: 20, accent: '#a04040', cast: ['ultron', 'peggy', 'tony', 'steve', 'thor', 'bruce', 'natasha', 'clint', 'wanda', 'vision', 'rhodey', 'sam', 'fury'] },
  { id: 'ant-man', title: 'Ant-Man', year: 2015, phase: 2, type: 'film', release: '2015-07-17', chronOrder: 21, accent: '#c25a3a', cast: ['hope', 'hank', 'peggy', 'scott', 'sam', 'steve', 'bucky'] },

  // Phase 3
  { id: 'civil-war', title: 'Captain America: Civil War', year: 2016, phase: 3, type: 'film', release: '2016-05-06', chronOrder: 22, accent: '#3a5a7a', cast: ['tchalla', 'steve', 'tony', 'bucky', 'natasha', 'sam', 'rhodey', 'wanda', 'vision', 'scott', 'peter', 'clint', 'ross'] },
  { id: 'doctor-strange', title: 'Doctor Strange', year: 2016, phase: 3, type: 'film', release: '2016-11-04', chronOrder: 23, accent: '#a04040', cast: ['wong', 'strange', 'thor'] },
  { id: 'gotg-2', title: 'Guardians of the Galaxy Vol. 2', year: 2017, phase: 3, type: 'film', release: '2017-05-05', chronOrder: 24, accent: '#c060a0', cast: ['quill', 'gamora', 'rocket', 'groot', 'drax', 'nebula', 'mantis', 'yondu'] },
  { id: 'homecoming', title: 'Spider-Man: Homecoming', year: 2017, phase: 3, type: 'film', release: '2017-07-07', chronOrder: 25, accent: '#a23a3a', cast: ['peter', 'tony', 'happy', 'steve', 'pepper'] },
  { id: 'thor-ragnarok', title: 'Thor: Ragnarok', year: 2017, phase: 3, type: 'film', release: '2017-11-03', chronOrder: 26, accent: '#a05ca0', cast: ['valkyrie', 'heimdall', 'thor', 'loki', 'bruce', 'strange', 'odin'] },
  { id: 'black-panther', title: 'Black Panther', year: 2018, phase: 3, type: 'film', release: '2018-02-16', chronOrder: 27, accent: '#3a3a5a', cast: ['tchalla', 'shuri', 'okoye', 'mbaku', 'ramonda', 'bucky'] },
  { id: 'infinity-war', title: 'Avengers: Infinity War', year: 2018, phase: 3, type: 'film', release: '2018-04-27', chronOrder: 28, accent: '#7a4060', cast: ['wong', 'tchalla', 'shuri', 'okoye', 'quill', 'gamora', 'rocket', 'groot', 'drax', 'nebula', 'mantis', 'tony', 'steve', 'thor', 'bruce', 'natasha', 'wanda', 'vision', 'sam', 'rhodey', 'strange', 'peter', 'bucky', 'loki', 'fury', 'pepper', 'carol', 'mbaku', 'ross', 'heimdall'] },
  { id: 'ant-man-wasp', title: 'Ant-Man and the Wasp', year: 2018, phase: 3, type: 'film', release: '2018-07-06', chronOrder: 22.5, accent: '#c25a3a', cast: ['hope', 'hank', 'scott'] },
  { id: 'captain-marvel', title: 'Captain Marvel', year: 2019, phase: 3, type: 'film', release: '2019-03-08', chronOrder: 2, accent: '#a06030', cast: ['carol', 'fury', 'steve', 'natasha', 'bruce', 'rhodey'] },
  { id: 'endgame', title: 'Avengers: Endgame', year: 2019, phase: 3, type: 'film', release: '2019-04-26', chronOrder: 29, accent: '#704040', cast: ['hope', 'tchalla', 'shuri', 'okoye', 'quill', 'gamora', 'rocket', 'groot', 'drax', 'nebula', 'mantis', 'valkyrie', 'peggy', 'tony', 'steve', 'thor', 'bruce', 'natasha', 'clint', 'rhodey', 'sam', 'wanda', 'scott', 'strange', 'peter', 'bucky', 'carol', 'pepper', 'loki', 'fury', 'happy', 'mbaku', 'wong', 'ross', 'hank', 'jane'] },
  { id: 'far-from-home', title: 'Spider-Man: Far From Home', year: 2019, phase: 3, type: 'film', release: '2019-07-02', chronOrder: 30, accent: '#3a6090', cast: ['peter', 'happy', 'fury'] },

  // Phase 4
  { id: 'wandavision', title: 'WandaVision', year: 2021, phase: 4, type: 'series', release: '2021-01-15', chronOrder: 31, accent: '#a02020', cast: ['white-vision', 'agatha', 'billy', 'wanda', 'vision'] },
  { id: 'falcon-winter', title: 'The Falcon and the Winter Soldier', year: 2021, phase: 4, type: 'series', release: '2021-03-19', chronOrder: 32, accent: '#a04040', cast: ['sam', 'bucky', 'rhodey'] },
  { id: 'loki-s1', title: 'Loki', year: 2021, phase: 4, type: 'series', release: '2021-06-09', chronOrder: 33, accent: '#3a7050', cast: ['he-who-remains', 'loki'] },
  { id: 'black-widow', title: 'Black Widow', year: 2021, phase: 4, type: 'film', release: '2021-07-09', chronOrder: 22.7, accent: '#404050', cast: ['yelena', 'alexei', 'natasha', 'ross'] },
  { id: 'what-if', title: 'What If…?', year: 2021, phase: 4, type: 'series', release: '2021-08-11', chronOrder: 34, accent: '#a06030', cast: ['captain-carter', 'yondu', 'tony', 'steve', 'thor', 'natasha', 'bruce', 'clint', 'loki', 'fury', 'rhodey', 'happy', 'bucky', 'wanda', 'vision', 'peter', 'strange', 'scott', 'carol', 'quill', 'gamora', 'groot', 'drax', 'nebula', 'tchalla', 'shuri', 'wong', 'ross', 'hope', 'jane', 'ultron'] },
  { id: 'shang-chi', title: 'Shang-Chi and the Legend of the Ten Rings', year: 2021, phase: 4, type: 'film', release: '2021-09-03', chronOrder: 35, accent: '#a04030', cast: ['shangchi', 'wong', 'trevor', 'bruce', 'carol'] },
  { id: 'eternals', title: 'Eternals', year: 2021, phase: 4, type: 'film', release: '2021-11-05', chronOrder: 36, accent: '#a08030', cast: ['sersi', 'ikaris', 'thena', 'kingo', 'ajak', 'druig', 'makkari'] },
  { id: 'hawkeye', title: 'Hawkeye', year: 2021, phase: 4, type: 'series', release: '2021-11-24', chronOrder: 37, accent: '#a04030', cast: ['yelena', 'fisk', 'maya', 'clint'] },
  { id: 'no-way-home', title: 'Spider-Man: No Way Home', year: 2021, phase: 4, type: 'film', release: '2021-12-17', chronOrder: 38, accent: '#a02020', cast: ['peter-raimi', 'peter-webb', 'wong', 'peter', 'strange', 'happy', 'matt'] },
  { id: 'ms-marvel', title: 'Ms. Marvel', year: 2022, phase: 4, type: 'series', release: '2022-06-08', chronOrder: 39, accent: '#a04060', cast: ['kamala', 'carol'] },
  { id: 'multiverse-madness', title: 'Doctor Strange in the Multiverse of Madness', year: 2022, phase: 4, type: 'film', release: '2022-05-06', chronOrder: 40, accent: '#603a80', cast: ['wong', 'captain-carter', 'strange', 'wanda'] },
  { id: 'thor-love', title: 'Thor: Love and Thunder', year: 2022, phase: 4, type: 'film', release: '2022-07-08', chronOrder: 41, accent: '#a04080', cast: ['jane', 'valkyrie', 'quill', 'thor', 'rocket', 'groot', 'drax', 'nebula', 'mantis'] },
  { id: 'moon-knight', title: 'Moon Knight', year: 2022, phase: 4, type: 'series', release: '2022-03-30', chronOrder: 42, accent: '#605030', cast: ['marc', 'layla', 'khonshu'] },
  { id: 'she-hulk', title: 'She-Hulk: Attorney at Law', year: 2022, phase: 4, type: 'series', release: '2022-08-18', chronOrder: 43, accent: '#5fa856', cast: ['wong', 'bruce', 'matt'] },
  { id: 'wakanda-forever', title: 'Black Panther: Wakanda Forever', year: 2022, phase: 4, type: 'film', release: '2022-11-11', chronOrder: 44, accent: '#3a3a6a', cast: ['shuri', 'okoye', 'mbaku', 'ramonda', 'riri'] },

  // Phase 5
  { id: 'quantumania', title: 'Ant-Man and the Wasp: Quantumania', year: 2023, phase: 5, type: 'film', release: '2023-02-17', chronOrder: 45, accent: '#5fa080', cast: ['hope', 'hank', 'kang', 'scott'] },
  { id: 'gotg-3', title: 'Guardians of the Galaxy Vol. 3', year: 2023, phase: 5, type: 'film', release: '2023-05-05', chronOrder: 46, accent: '#a06030', cast: ['quill', 'rocket', 'groot', 'drax', 'nebula', 'mantis', 'gamora'] },
  { id: 'secret-invasion', title: 'Secret Invasion', year: 2023, phase: 5, type: 'series', release: '2023-06-21', chronOrder: 47, accent: '#3a6050', cast: ['fury', 'rhodey'] },
  { id: 'loki-s2', title: 'Loki: Season 2', year: 2023, phase: 5, type: 'series', release: '2023-10-05', chronOrder: 48, accent: '#3a7050', cast: ['victor-timely', 'loki'] },
  { id: 'marvels', title: 'The Marvels', year: 2023, phase: 5, type: 'film', release: '2023-11-10', chronOrder: 49, accent: '#a08030', cast: ['kamala', 'carol', 'fury'] },
  { id: 'what-if-s2', title: 'What If…? Season 2', year: 2023, phase: 5, type: 'series', release: '2023-12-22', chronOrder: 48.2, accent: '#a06030', cast: ['captain-carter', 'yondu', 'happy', 'strange', 'scott', 'nebula', 'hope'] },
  { id: 'echo', title: 'Echo', year: 2024, phase: 5, type: 'series', release: '2024-01-09', chronOrder: 50, accent: '#a04040', cast: ['maya', 'fisk', 'matt'] },
  { id: 'deadpool-3', title: 'Deadpool & Wolverine', year: 2024, phase: 5, type: 'film', release: '2024-07-26', chronOrder: 51, accent: '#a02030', cast: ['deadpool', 'wolverine', 'happy', 'scott'] },
  { id: 'agatha', title: 'Agatha All Along', year: 2024, phase: 5, type: 'series', release: '2024-09-18', chronOrder: 52, accent: '#603a80', cast: ['agatha', 'billy'] },
  { id: 'what-if-s3', title: 'What If…? Season 3', year: 2024, phase: 5, type: 'series', release: '2024-12-22', chronOrder: 50.2, accent: '#a06030', cast: ['captain-carter', 'wong', 'alexei', 'shangchi', 'agatha'] },
  { id: 'friendly-spidey', title: 'Your Friendly Neighborhood Spider-Man', year: 2025, phase: 5, type: 'series', release: '2025-01-29', chronOrder: 24.5, accent: '#a02020', cast: ['peter', 'tony', 'strange', 'ross', 'matt'] },
  { id: 'cap-brave', title: 'Captain America: Brave New World', year: 2025, phase: 5, type: 'film', release: '2025-02-14', chronOrder: 53, accent: '#a04040', cast: ['ross', 'sam', 'bucky'] },
  { id: 'daredevil-born-again', title: 'Daredevil: Born Again', year: 2025, phase: 5, type: 'series', release: '2025-03-04', chronOrder: 53.5, accent: '#a02020', cast: ['matt', 'fisk'] },
  { id: 'thunderbolts', title: 'Thunderbolts*', year: 2025, phase: 5, type: 'film', release: '2025-05-02', chronOrder: 54, accent: '#5a5a5a', cast: ['yelena', 'alexei', 'bucky'] },
  { id: 'ironheart', title: 'Ironheart', year: 2025, phase: 5, type: 'series', release: '2025-06-24', chronOrder: 56, accent: '#c25a3a', cast: ['riri'] },

  // Phase 6
  { id: 'fantastic-four', title: 'The Fantastic Four: First Steps', year: 2025, phase: 6, type: 'film', release: '2025-07-25', chronOrder: 55, accent: '#3a6ab0', cast: ['reed', 'sue', 'johnny', 'ben', 'galactus'] },
  { id: 'eyes-of-wakanda', title: 'Eyes of Wakanda', year: 2025, phase: 6, type: 'series', release: '2025-08-01', chronOrder: 0.5, accent: '#3a3a5a', cast: [] },
  { id: 'marvel-zombies', title: 'Marvel Zombies', year: 2025, phase: 6, type: 'series', release: '2025-09-24', chronOrder: 56.5, accent: '#5a7a3a', cast: ['kamala', 'shangchi', 'alexei', 'wanda', 'thor', 'peter', 'scott', 'groot', 'hope', 'yelena'] },
  { id: 'wonder-man', title: 'Wonder Man', year: 2026, phase: 6, type: 'series', release: '2026-01-27', chronOrder: 56.8, accent: '#c02a4a', cast: ['simon', 'trevor'] },
  { id: 'daredevil-born-again-s2', title: 'Daredevil: Born Again Season 2', year: 2026, phase: 6, type: 'series', release: '2026-03-24', chronOrder: 57.2, accent: '#a02020', cast: ['matt', 'fisk'] },
  { id: 'brand-new-day', title: 'Spider-Man: Brand New Day', year: 2026, phase: 6, type: 'film', release: '2026-07-31', chronOrder: 57, accent: '#a02020', cast: ['peter', 'bruce', 'yelena'] },
  { id: 'visionquest', title: 'VisionQuest', year: 2026, phase: 6, type: 'series', release: '2026-10-14', chronOrder: 57.5, accent: '#9b3030', cast: ['ultron', 'white-vision'] },
  { id: 'friendly-spidey-s2', title: 'Your Friendly Neighborhood Spider-Man Season 2', year: 2026, phase: 6, type: 'series', release: '2026-12-01', chronOrder: 24.7, accent: '#a02020', cast: ['peter'] },
  { id: 'doomsday', title: 'Avengers: Doomsday', year: 2026, phase: 6, type: 'film', release: '2026-12-18', chronOrder: 58, accent: '#704040', cast: ['shangchi', 'mbaku', 'reed', 'sue', 'johnny', 'ben', 'doom', 'peggy', 'thor', 'loki', 'sam', 'scott', 'bucky', 'steve', 'peter', 'yelena', 'alexei', 'shuri'] },
  { id: 'daredevil-born-again-s3', title: 'Daredevil: Born Again Season 3', year: 2027, phase: 6, type: 'series', release: '2027-03-01', chronOrder: 59, accent: '#a02020', cast: ['matt', 'fisk'] },
  { id: 'secret-wars', title: 'Avengers: Secret Wars', year: 2027, phase: 6, type: 'film', release: '2027-12-17', chronOrder: 60, accent: '#6a3a5a', cast: ['alexei', 'sam', 'vision', 'peter', 'shangchi'] },
];

// Characters with unique connection-line colors
const CHARACTERS = {
  tony:      { name: 'Tony Stark',       actor: 'R. Downey Jr.',  color: '#e84a3a', initials: 'TS' },
  steve:     { name: 'Steve Rogers',     actor: 'C. Evans',        color: '#4a8de8', initials: 'SR' },
  thor:      { name: 'Thor',             actor: 'C. Hemsworth',    color: '#e8c14a', initials: 'TH' },
  bruce:     { name: 'Bruce Banner',     actor: 'M. Ruffalo',      color: '#5fa856', initials: 'BB' },
  natasha:   { name: 'Natasha Romanoff', actor: 'S. Johansson',    color: '#a04040', initials: 'NR' },
  clint:     { name: 'Clint Barton',     actor: 'J. Renner',       color: '#9b6a3a', initials: 'CB' },
  loki:      { name: 'Loki',             actor: 'T. Hiddleston',   color: '#3aa07a', initials: 'LK' },
  fury:      { name: 'Nick Fury',        actor: 'S. L. Jackson',   color: '#888894', initials: 'NF' },
  rhodey:    { name: 'James Rhodes',     actor: 'D. Cheadle',      color: '#6a7ab0', initials: 'JR' },
  pepper:    { name: 'Pepper Potts',     actor: 'G. Paltrow',      color: '#e89a4a', initials: 'PP' },
  bucky:     { name: 'Bucky Barnes',     actor: 'S. Stan',         color: '#5070a8', initials: 'BB' },
  peggy:     { name: 'Peggy Carter',     actor: 'H. Atwell',       color: '#c84a6a', initials: 'PC' },
  sam:       { name: 'Sam Wilson',       actor: 'A. Mackie',       color: '#d04040', initials: 'SW' },
  wanda:     { name: 'Wanda Maximoff',   actor: 'E. Olsen',        color: '#c8304a', initials: 'WM' },
  vision:    { name: 'Vision',           actor: 'P. Bettany',      color: '#9b3030', initials: 'VS' },
  scott:     { name: 'Scott Lang',       actor: 'P. Rudd',         color: '#c8704a', initials: 'SL' },
  hope:      { name: 'Hope Van Dyne',    actor: 'E. Lilly',        color: '#a05f3a', initials: 'HV' },
  hank:      { name: 'Hank Pym',         actor: 'M. Douglas',      color: '#7a6a5a', initials: 'HP' },
  peter:     { name: 'Peter Parker',     actor: 'T. Holland',      color: '#e8344a', initials: 'PP' },
  tchalla:   { name: "T'Challa",         actor: 'C. Boseman',      color: '#3a3aa0', initials: 'TC' },
  shuri:     { name: 'Shuri',            actor: 'L. Wright',       color: '#5a5ab0', initials: 'SH' },
  okoye:     { name: 'Okoye',            actor: 'D. Gurira',       color: '#a07050', initials: 'OK' },
  mbaku:     { name: "M'Baku",           actor: 'W. Duke',          color: '#7a5030', initials: 'MB' },
  ramonda:   { name: 'Ramonda',          actor: 'A. Bassett',      color: '#9a6080', initials: 'RM' },
  strange:   { name: 'Stephen Strange',  actor: 'B. Cumberbatch',  color: '#c83a8a', initials: 'DS' },
  wong:      { name: 'Wong',             actor: 'B. Wong',         color: '#a05030', initials: 'WG' },
  quill:     { name: 'Peter Quill',      actor: 'C. Pratt',        color: '#a060d0', initials: 'PQ' },
  gamora:    { name: 'Gamora',           actor: 'Z. Saldana',      color: '#8ec96a', initials: 'GM' },
  rocket:    { name: 'Rocket',           actor: 'B. Cooper',       color: '#b5854a', initials: 'RK' },
  groot:     { name: 'Groot',            actor: 'V. Diesel',       color: '#7a8a40', initials: 'GR' },
  drax:      { name: 'Drax',             actor: 'D. Bautista',     color: '#7a9aa0', initials: 'DX' },
  nebula:    { name: 'Nebula',           actor: 'K. Gillan',       color: '#5050a0', initials: 'NB' },
  mantis:    { name: 'Mantis',           actor: 'P. Klementieff',  color: '#5fa080', initials: 'MT' },
  yondu:     { name: 'Yondu',            actor: 'M. Rooker',       color: '#3a90a0', initials: 'YD' },
  carol:     { name: 'Carol Danvers',    actor: 'B. Larson',       color: '#e88a4a', initials: 'CD' },
  jane:      { name: 'Jane Foster',      actor: 'N. Portman',      color: '#c890d0', initials: 'JF' },
  sif:       { name: 'Sif',              actor: 'J. Alexander',    color: '#7a90b0', initials: 'SF' },
  odin:      { name: 'Odin',             actor: 'A. Hopkins',      color: '#a09060', initials: 'OD' },
  heimdall:  { name: 'Heimdall',         actor: 'I. Elba',         color: '#a07a3a', initials: 'HD' },
  valkyrie:  { name: 'Valkyrie',         actor: 'T. Thompson',     color: '#5070b0', initials: 'VK' },
  ross:      { name: 'Thaddeus Ross',    actor: 'H. Ford',         color: '#807060', initials: 'TR' },
  happy:     { name: 'Happy Hogan',      actor: 'J. Favreau',      color: '#a06a4a', initials: 'HH' },
  matt:      { name: 'Matt Murdock',     actor: 'C. Cox',          color: '#b02a2a', initials: 'MM' },
  fisk:      { name: 'Wilson Fisk',      actor: "V. D'Onofrio",    color: '#c8c8d4', initials: 'WF' },
  riri:      { name: 'Riri Williams',    actor: 'D. Thorne',       color: '#d0603a', initials: 'RW' },
  simon:     { name: 'Simon Williams',   actor: 'Y. Abdul-Mateen', color: '#c02a4a', initials: 'SW' },
  trevor:    { name: 'Trevor Slattery',  actor: 'B. Kingsley',     color: '#c8a040', initials: 'TS' },
  shangchi:  { name: 'Shang-Chi',        actor: 'S. Liu',          color: '#c85a30', initials: 'SC' },
  kamala:    { name: 'Kamala Khan',      actor: 'I. Vellani',      color: '#4aa0c8', initials: 'KK' },
  yelena:    { name: 'Yelena Belova',    actor: 'F. Pugh',         color: '#7ab0d0', initials: 'YB' },
  alexei:    { name: 'Alexei Shostakov', actor: 'D. Harbour',      color: '#8a3a5a', initials: 'AS' },
  ultron:    { name: 'Ultron',           actor: 'J. Spader',       color: '#7a6ab0', initials: 'UL' },

  // — Variant identities —
  // `prime` points at the through-line identity. Variants keep their own name and
  // colour, but connection threading chains on the prime so the arc stays continuous.
  kang:            { name: 'Kang the Conqueror', actor: 'J. Majors',  color: '#3f9fa8', initials: 'KC' },
  'he-who-remains':{ name: 'He Who Remains',     actor: 'J. Majors',  color: '#6fd0c0', initials: 'HW', prime: 'kang' },
  'victor-timely': { name: 'Victor Timely',      actor: 'J. Majors',  color: '#2f7f8f', initials: 'VT', prime: 'kang' },
  'captain-carter':{ name: 'Captain Carter',     actor: 'H. Atwell',  color: '#e0607f', initials: 'CC', prime: 'peggy' },
  'white-vision':  { name: 'White Vision',       actor: 'P. Bettany', color: '#d8dce8', initials: 'WV', prime: 'vision' },
  'peter-raimi':   { name: 'Peter Parker (Raimi)', actor: 'T. Maguire',  color: '#c04a6a', initials: 'P2', prime: 'peter' },
  'peter-webb':    { name: 'Peter Parker (Webb)',  actor: 'A. Garfield', color: '#d06a8a', initials: 'P3', prime: 'peter' },

  // — Backfill for previously castless titles —
  maya:      { name: 'Maya Lopez',       actor: 'A. Cox',          color: '#a85a70', initials: 'ML' },
  agatha:    { name: 'Agatha Harkness',  actor: 'K. Hahn',         color: '#7a3f9f', initials: 'AH' },
  billy:     { name: 'Billy Maximoff',   actor: 'J. Locke',        color: '#5a6fd0', initials: 'BM' },
  deadpool:  { name: 'Wade Wilson',      actor: 'R. Reynolds',     color: '#d02a2a', initials: 'DP' },
  wolverine: { name: 'Logan',            actor: 'H. Jackman',      color: '#c8b028', initials: 'WL' },
  reed:      { name: 'Reed Richards',    actor: 'P. Pascal',       color: '#4a7fd0', initials: 'RR' },
  sue:       { name: 'Sue Storm',        actor: 'V. Kirby',        color: '#6f9fe0', initials: 'SS' },
  johnny:    { name: 'Johnny Storm',     actor: 'J. Quinn',        color: '#e08a3a', initials: 'JS' },
  ben:       { name: 'Ben Grimm',        actor: 'E. Moss-Bachrach',color: '#b07a4a', initials: 'BG' },
  galactus:  { name: 'Galactus',         actor: 'R. Ineson',       color: '#8a5fd0', initials: 'GL' },
  doom:      { name: 'Victor von Doom',  actor: 'R. Downey Jr.',   color: '#4f8f5f', initials: 'VD' },
  marc:      { name: 'Marc Spector',     actor: 'O. Isaac',        color: '#9fa8c8', initials: 'MS' },
  layla:     { name: 'Layla El-Faouly',  actor: 'M. Calamawy',     color: '#c89a5f', initials: 'LF' },
  khonshu:   { name: 'Khonshu',          actor: 'F. M. Abraham',   color: '#8fa8b8', initials: 'KH' },
  sersi:     { name: 'Sersi',            actor: 'G. Chan',         color: '#c8a8d8', initials: 'SR' },
  ikaris:    { name: 'Ikaris',           actor: 'R. Madden',       color: '#d0c060', initials: 'IK' },
  thena:     { name: 'Thena',            actor: 'A. Jolie',        color: '#c0d0a0', initials: 'TN' },
  kingo:     { name: 'Kingo',            actor: 'K. Nanjiani',     color: '#d07a5a', initials: 'KG' },
  ajak:      { name: 'Ajak',             actor: 'S. Hayek',        color: '#a89060', initials: 'AJ' },
  druig:     { name: 'Druig',            actor: 'B. Keoghan',      color: '#7a9a7a', initials: 'DR' },
  makkari:   { name: 'Makkari',          actor: 'L. Ridloff',      color: '#a0c0c8', initials: 'MK' },
};

window.TITLES = TITLES;
window.CHARACTERS = CHARACTERS;

// Approximate production budgets in millions USD (publicly reported figures)
const BUDGETS = {
  'iron-man': 140, 'incredible-hulk': 150, 'iron-man-2': 200, 'thor': 150,
  'cap-first-avenger': 140, 'avengers': 220,
  'iron-man-3': 200, 'thor-dark-world': 170, 'cap-winter-soldier': 170,
  'gotg': 195.9, 'aou': 365, 'ant-man': 130,
  'civil-war': 250, 'doctor-strange': 165, 'gotg-2': 200, 'homecoming': 175,
  'thor-ragnarok': 180, 'black-panther': 200, 'infinity-war': 316,
  'ant-man-wasp': 162, 'captain-marvel': 175, 'endgame': 356, 'far-from-home': 160,
  'wandavision': 25, 'falcon-winter': 25, 'loki-s1': 20, 'black-widow': 200,
  'what-if': 25, 'shang-chi': 200, 'eternals': 200, 'hawkeye': 25,
  'no-way-home': 200, 'ms-marvel': 25, 'multiverse-madness': 200, 'thor-love': 250,
  'moon-knight': 25, 'she-hulk': 25, 'wakanda-forever': 250,
  'quantumania': 200, 'gotg-3': 250, 'secret-invasion': 25, 'loki-s2': 25,
  'marvels': 274.8, 'echo': 40, 'deadpool-3': 200, 'agatha': 40, 'cap-brave': 180,
};
TITLES.forEach(t => { t.budget = BUDGETS[t.id] || null; });
window.BUDGETS = BUDGETS;

// Public IMDb user ratings (distinct from TMDB community score already in media.json)
const IMDB_RATINGS = {
  'iron-man': 7.9, 'incredible-hulk': 6.6, 'iron-man-2': 6.9, 'thor': 7.0,
  'cap-first-avenger': 6.9, 'avengers': 8.0,
  'iron-man-3': 7.1, 'thor-dark-world': 6.8, 'cap-winter-soldier': 7.7,
  'gotg': 8.0, 'aou': 7.3, 'ant-man': 7.3,
  'civil-war': 7.8, 'doctor-strange': 7.5, 'gotg-2': 7.6, 'homecoming': 7.4,
  'thor-ragnarok': 7.9, 'black-panther': 7.3, 'infinity-war': 8.4,
  'ant-man-wasp': 7.0, 'captain-marvel': 6.8, 'endgame': 8.4, 'far-from-home': 7.3,
  'wandavision': 7.9, 'falcon-winter': 7.2, 'loki-s1': 8.2, 'black-widow': 6.7,
  'what-if': 7.4, 'shang-chi': 7.4, 'eternals': 6.3, 'hawkeye': 7.6,
  'no-way-home': 8.2, 'ms-marvel': 6.5, 'multiverse-madness': 6.9, 'thor-love': 6.2,
  'moon-knight': 7.4, 'she-hulk': 5.6, 'wakanda-forever': 6.7,
  'quantumania': 6.1, 'gotg-3': 7.9, 'secret-invasion': 5.7, 'loki-s2': 8.5,
  'marvels': 5.6, 'echo': 6.5, 'deadpool-3': 7.6, 'agatha': 7.0, 'cap-brave': 5.6,
  'ironheart': 4.5, 'thunderbolts': 7.1, 'fantastic-four': 6.8,
  'daredevil-born-again': 8.0,
};

// Rotten Tomatoes Tomatometer (critics) scores, %
const RT_SCORES = {
  'iron-man': 94, 'incredible-hulk': 67, 'iron-man-2': 71, 'thor': 77,
  'cap-first-avenger': 80, 'avengers': 91,
  'iron-man-3': 79, 'thor-dark-world': 66, 'cap-winter-soldier': 90,
  'gotg': 92, 'aou': 76, 'ant-man': 83,
  'civil-war': 90, 'doctor-strange': 89, 'gotg-2': 85, 'homecoming': 92,
  'thor-ragnarok': 93, 'black-panther': 96, 'infinity-war': 85,
  'ant-man-wasp': 87, 'captain-marvel': 79, 'endgame': 94, 'far-from-home': 90,
  'wandavision': 91, 'falcon-winter': 84, 'loki-s1': 92, 'black-widow': 79,
  'what-if': 91, 'shang-chi': 91, 'eternals': 47, 'hawkeye': 92,
  'no-way-home': 93, 'ms-marvel': 82, 'multiverse-madness': 74, 'thor-love': 63,
  'moon-knight': 86, 'she-hulk': 78, 'wakanda-forever': 84,
  'quantumania': 46, 'gotg-3': 82, 'secret-invasion': 53, 'loki-s2': 82,
  'marvels': 62, 'echo': 72, 'deadpool-3': 78, 'agatha': 84, 'cap-brave': 46,
  'thunderbolts': 88, 'fantastic-four': 86, 'ironheart': 71,
  'what-if-s2': 88, 'what-if-s3': 80, 'friendly-spidey': 97,
  'daredevil-born-again': 87, 'eyes-of-wakanda': 92, 'marvel-zombies': 62,
  'wonder-man': 91, 'daredevil-born-again-s2': 95,
};
TITLES.forEach(t => { t.rt = RT_SCORES[t.id] != null ? RT_SCORES[t.id] : null; });
window.RT_SCORES = RT_SCORES;
TITLES.forEach(t => { t.imdb = IMDB_RATINGS[t.id] || null; });
window.IMDB_RATINGS = IMDB_RATINGS;
