export interface TeamData {
  id: string;
  name: string;
  city: string;
  fullName: string;
  abbreviation: string;
  espnAbbr: string; // ESPN API abbreviation
  conference: string;
  division: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  record: string;
  divisionRank: string;
  generalManager: string;
  headCoach: string;
  homeVenue: string;
  location: string;
  stats: {
    prPlus: { value: number; rank: number };
    offPlus: { value: number; rank: number };
    defPlus: { value: number; rank: number };
    stPlus: { value: number; rank: number };
  };
  searchTerms: string[]; // For news filtering
}

export const teams: Record<string, TeamData> = {
  'arizona-cardinals': {
    id: 'arizona-cardinals',
    name: 'Cardinals',
    city: 'Arizona',
    fullName: 'Arizona Cardinals',
    abbreviation: 'ARI',
    espnAbbr: 'ari',
    conference: 'NFC',
    division: 'NFC West',
    primaryColor: '#97233F',
    secondaryColor: '#000000',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/arizona-cardinals.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Monti Ossenfort',
    headCoach: 'Vacant',
    homeVenue: 'State Farm Stadium',
    location: 'Glendale, AZ',
    stats: {
      prPlus: { value: 102, rank: 1 },
      offPlus: { value: 98, rank: 13 },
      defPlus: { value: 95, rank: 18 },
      stPlus: { value: 108, rank: 5 }
    },
    searchTerms: [
      'cardinals', 'arizona cardinals', 'kyler murray', 'budda baker',
      'marvin harrison jr', 'james conner', 'trey mcbride', 'paris johnson',
      'darius robinson', 'zaven collins', 'jalen thompson', 'michael wilson',
      'greg dortch', 'calais campbell', 'jonathan gannon', 'monti ossenfort',
      'state farm stadium', 'glendale', 'red birds', 'red sea rising'
    ]
  },
  'atlanta-falcons': {
    id: 'atlanta-falcons',
    name: 'Falcons',
    city: 'Atlanta',
    fullName: 'Atlanta Falcons',
    abbreviation: 'ATL',
    espnAbbr: 'atl',
    conference: 'NFC',
    division: 'NFC South',
    primaryColor: '#A71930',
    secondaryColor: '#000000',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/atlanta-falcons.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Terry Fontenot',
    headCoach: 'Vacant',
    homeVenue: 'Mercedes-Benz Stadium',
    location: 'Atlanta, GA',
    stats: {
      prPlus: { value: 100, rank: 16 },
      offPlus: { value: 105, rank: 8 },
      defPlus: { value: 92, rank: 22 },
      stPlus: { value: 103, rank: 12 }
    },
    searchTerms: [
      'falcons', 'atlanta falcons', 'kirk cousins', 'bijan robinson',
      'kyle pitts', 'drake london', 'grady jarrett', 'jessie bates',
      'raheem morris', 'terry fontenot', 'mercedes-benz stadium',
      'atlanta', 'dirty birds', 'rise up'
    ]
  },
  'baltimore-ravens': {
    id: 'baltimore-ravens',
    name: 'Ravens',
    city: 'Baltimore',
    fullName: 'Baltimore Ravens',
    abbreviation: 'BAL',
    espnAbbr: 'bal',
    conference: 'AFC',
    division: 'AFC North',
    primaryColor: '#241773',
    secondaryColor: '#000000',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/baltimore-ravens.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Eric DeCosta',
    headCoach: 'Vacant',
    homeVenue: 'M&T Bank Stadium',
    location: 'Baltimore, MD',
    stats: {
      prPlus: { value: 115, rank: 3 },
      offPlus: { value: 118, rank: 1 },
      defPlus: { value: 108, rank: 6 },
      stPlus: { value: 102, rank: 14 }
    },
    searchTerms: [
      'ravens', 'baltimore ravens', 'lamar jackson', 'derrick henry',
      'mark andrews', 'roquan smith', 'kyle hamilton', 'odell beckham',
      'john harbaugh', 'eric decosta', 'm&t bank stadium',
      'baltimore', 'ravens flock', 'purple reign'
    ]
  },
  'buffalo-bills': {
    id: 'buffalo-bills',
    name: 'Bills',
    city: 'Buffalo',
    fullName: 'Buffalo Bills',
    abbreviation: 'BUF',
    espnAbbr: 'buf',
    conference: 'AFC',
    division: 'AFC East',
    primaryColor: '#00338D',
    secondaryColor: '#C60C30',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/buffalo-bills.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Brandon Beane',
    headCoach: 'Sean McDermott',
    homeVenue: 'Highmark Stadium',
    location: 'Orchard Park, NY',
    stats: {
      prPlus: { value: 112, rank: 4 },
      offPlus: { value: 110, rank: 4 },
      defPlus: { value: 105, rank: 8 },
      stPlus: { value: 101, rank: 16 }
    },
    searchTerms: [
      'bills', 'buffalo bills', 'josh allen', 'stefon diggs',
      'von miller', 'khalil shakir', 'dawson knox', 'matt milano',
      'sean mcdermott', 'brandon beane', 'highmark stadium',
      'buffalo', 'bills mafia', 'table smashing'
    ]
  },
  'carolina-panthers': {
    id: 'carolina-panthers',
    name: 'Panthers',
    city: 'Carolina',
    fullName: 'Carolina Panthers',
    abbreviation: 'CAR',
    espnAbbr: 'car',
    conference: 'NFC',
    division: 'NFC South',
    primaryColor: '#0085CA',
    secondaryColor: '#000000',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/carolina-panthers.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Dan Morgan',
    headCoach: 'Dave Canales',
    homeVenue: 'Bank of America Stadium',
    location: 'Charlotte, NC',
    stats: {
      prPlus: { value: 88, rank: 28 },
      offPlus: { value: 85, rank: 30 },
      defPlus: { value: 90, rank: 25 },
      stPlus: { value: 95, rank: 24 }
    },
    searchTerms: [
      'panthers', 'carolina panthers', 'bryce young', 'christian mccaffrey',
      'dj moore', 'brian burns', 'derrick brown', 'shaq thompson',
      'dave canales', 'dan morgan', 'bank of america stadium',
      'charlotte', 'keep pounding', 'black and blue'
    ]
  },
  'chicago-bears': {
    id: 'chicago-bears',
    name: 'Bears',
    city: 'Chicago',
    fullName: 'Chicago Bears',
    abbreviation: 'CHI',
    espnAbbr: 'chi',
    conference: 'NFC',
    division: 'NFC North',
    primaryColor: '#0B162A',
    secondaryColor: '#C83803',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/chicago-bears.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Ryan Poles',
    headCoach: 'Ben Johnson',
    homeVenue: 'Soldier Field',
    location: 'Chicago, IL',
    stats: {
      prPlus: { value: 95, rank: 22 },
      offPlus: { value: 92, rank: 24 },
      defPlus: { value: 98, rank: 15 },
      stPlus: { value: 99, rank: 19 }
    },
    searchTerms: [
      'bears', 'chicago bears', 'caleb williams', 'dj moore',
      'keenan allen', 'montez sweat', 'roquan smith', 'jaylon johnson',
      'ben johnson', 'ryan poles', 'soldier field',
      'chicago', 'da bears', 'monsters of the midway'
    ]
  },
  'cincinnati-bengals': {
    id: 'cincinnati-bengals',
    name: 'Bengals',
    city: 'Cincinnati',
    fullName: 'Cincinnati Bengals',
    abbreviation: 'CIN',
    espnAbbr: 'cin',
    conference: 'AFC',
    division: 'AFC North',
    primaryColor: '#FB4F14',
    secondaryColor: '#000000',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/cincinnati-bengals.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Duke Tobin',
    headCoach: 'Zac Taylor',
    homeVenue: 'Paycor Stadium',
    location: 'Cincinnati, OH',
    stats: {
      prPlus: { value: 108, rank: 7 },
      offPlus: { value: 112, rank: 3 },
      defPlus: { value: 102, rank: 12 },
      stPlus: { value: 97, rank: 22 }
    },
    searchTerms: [
      'bengals', 'cincinnati bengals', 'joe burrow', 'ja\'marr chase',
      'tee higgins', 'joe mixon', 'trey hendrickson', 'logan wilson',
      'zac taylor', 'duke tobin', 'paycor stadium',
      'cincinnati', 'who dey', 'king of the jungle'
    ]
  },
  'cleveland-browns': {
    id: 'cleveland-browns',
    name: 'Browns',
    city: 'Cleveland',
    fullName: 'Cleveland Browns',
    abbreviation: 'CLE',
    espnAbbr: 'cle',
    conference: 'AFC',
    division: 'AFC North',
    primaryColor: '#311D00',
    secondaryColor: '#FF3C00',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/cleveland-browns.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Andrew Berry',
    headCoach: 'Vacant',
    homeVenue: 'FirstEnergy Stadium',
    location: 'Cleveland, OH',
    stats: {
      prPlus: { value: 92, rank: 25 },
      offPlus: { value: 88, rank: 27 },
      defPlus: { value: 96, rank: 17 },
      stPlus: { value: 104, rank: 10 }
    },
    searchTerms: [
      'browns', 'cleveland browns', 'deshaun watson', 'nick chubb',
      'amari cooper', 'myles garrett', 'denzel ward', 'joel bitonio',
      'kevin stefanski', 'andrew berry', 'firstenergy stadium',
      'cleveland', 'dawg pound', 'here we go brownies'
    ]
  },
  'dallas-cowboys': {
    id: 'dallas-cowboys',
    name: 'Cowboys',
    city: 'Dallas',
    fullName: 'Dallas Cowboys',
    abbreviation: 'DAL',
    espnAbbr: 'dal',
    conference: 'NFC',
    division: 'NFC East',
    primaryColor: '#003594',
    secondaryColor: '#869397',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/dallas-cowboys.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Jerry Jones',
    headCoach: 'Brian Schottenheimer',
    homeVenue: 'AT&T Stadium',
    location: 'Arlington, TX',
    stats: {
      prPlus: { value: 105, rank: 10 },
      offPlus: { value: 108, rank: 5 },
      defPlus: { value: 100, rank: 14 },
      stPlus: { value: 98, rank: 20 }
    },
    searchTerms: [
      'cowboys', 'dallas cowboys', 'dak prescott', 'ceedee lamb',
      'ezekiel elliott', 'micah parsons', 'trevon diggs', 'daron bland',
      'brian schottenheimer', 'jerry jones', 'at&t stadium',
      'dallas', 'americas team', 'how bout them cowboys'
    ]
  },
  'denver-broncos': {
    id: 'denver-broncos',
    name: 'Broncos',
    city: 'Denver',
    fullName: 'Denver Broncos',
    abbreviation: 'DEN',
    espnAbbr: 'den',
    conference: 'AFC',
    division: 'AFC West',
    primaryColor: '#FB4F14',
    secondaryColor: '#002244',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/denver-broncos.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'George Paton',
    headCoach: 'Sean Payton',
    homeVenue: 'Empower Field at Mile High',
    location: 'Denver, CO',
    stats: {
      prPlus: { value: 98, rank: 18 },
      offPlus: { value: 95, rank: 20 },
      defPlus: { value: 103, rank: 11 },
      stPlus: { value: 106, rank: 8 }
    },
    searchTerms: [
      'broncos', 'denver broncos', 'russell wilson', 'courtland sutton',
      'jerry jeudy', 'patrick surtain', 'bradley chubb', 'justin simmons',
      'sean payton', 'george paton', 'empower field at mile high',
      'denver', 'broncos country', 'orange crush'
    ]
  },
  'detroit-lions': {
    id: 'detroit-lions',
    name: 'Lions',
    city: 'Detroit',
    fullName: 'Detroit Lions',
    abbreviation: 'DET',
    espnAbbr: 'det',
    conference: 'NFC',
    division: 'NFC North',
    primaryColor: '#0076B6',
    secondaryColor: '#B0B7BC',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/detroit-lions.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Brad Holmes',
    headCoach: 'Dan Campbell',
    homeVenue: 'Ford Field',
    location: 'Detroit, MI',
    stats: {
      prPlus: { value: 118, rank: 2 },
      offPlus: { value: 115, rank: 2 },
      defPlus: { value: 112, rank: 3 },
      stPlus: { value: 105, rank: 9 }
    },
    searchTerms: [
      'lions', 'detroit lions', 'jared goff', 'amon-ra st brown',
      'jahmyr gibbs', 'aidan hutchinson', 'alex anzalone', 'penei sewell',
      'dan campbell', 'brad holmes', 'ford field',
      'detroit', 'one pride', 'bite kneecaps'
    ]
  },
  'green-bay-packers': {
    id: 'green-bay-packers',
    name: 'Packers',
    city: 'Green Bay',
    fullName: 'Green Bay Packers',
    abbreviation: 'GB',
    espnAbbr: 'gb',
    conference: 'NFC',
    division: 'NFC North',
    primaryColor: '#203731',
    secondaryColor: '#FFB612',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/green-bay-packers.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Brian Gutekunst',
    headCoach: 'Matt LaFleur',
    homeVenue: 'Lambeau Field',
    location: 'Green Bay, WI',
    stats: {
      prPlus: { value: 110, rank: 5 },
      offPlus: { value: 107, rank: 6 },
      defPlus: { value: 109, rank: 5 },
      stPlus: { value: 102, rank: 13 }
    },
    searchTerms: [
      'packers', 'green bay packers', 'jordan love', 'aaron jones',
      'davante adams', 'jaire alexander', 'kenny clark', 'david bakhtiari',
      'matt lafleur', 'brian gutekunst', 'lambeau field',
      'green bay', 'titletown', 'go pack go'
    ]
  },
  'houston-texans': {
    id: 'houston-texans',
    name: 'Texans',
    city: 'Houston',
    fullName: 'Houston Texans',
    abbreviation: 'HOU',
    espnAbbr: 'hou',
    conference: 'AFC',
    division: 'AFC South',
    primaryColor: '#03202F',
    secondaryColor: '#A71930',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/houston-texans.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Nick Caserio',
    headCoach: 'DeMeco Ryans',
    homeVenue: 'NRG Stadium',
    location: 'Houston, TX',
    stats: {
      prPlus: { value: 107, rank: 8 },
      offPlus: { value: 103, rank: 11 },
      defPlus: { value: 106, rank: 7 },
      stPlus: { value: 100, rank: 17 }
    },
    searchTerms: [
      'texans', 'houston texans', 'cj stroud', 'nico collins',
      'tank dell', 'will anderson', 'derek stingley', 'laremy tunsil',
      'demeco ryans', 'nick caserio', 'nrg stadium',
      'houston', 'bull on parade', 'we are texans'
    ]
  },
  'indianapolis-colts': {
    id: 'indianapolis-colts',
    name: 'Colts',
    city: 'Indianapolis',
    fullName: 'Indianapolis Colts',
    abbreviation: 'IND',
    espnAbbr: 'ind',
    conference: 'AFC',
    division: 'AFC South',
    primaryColor: '#002C5F',
    secondaryColor: '#A2AAAD',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/indianapolis-colts.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Chris Ballard',
    headCoach: 'Shane Steichen',
    homeVenue: 'Lucas Oil Stadium',
    location: 'Indianapolis, IN',
    stats: {
      prPlus: { value: 96, rank: 21 },
      offPlus: { value: 94, rank: 22 },
      defPlus: { value: 97, rank: 16 },
      stPlus: { value: 98, rank: 21 }
    },
    searchTerms: [
      'colts', 'indianapolis colts', 'anthony richardson', 'jonathan taylor',
      'michael pittman', 'quenton nelson', 'darius leonard', 'kenny moore',
      'shane steichen', 'chris ballard', 'lucas oil stadium',
      'indianapolis', 'colts nation', 'horseshoe'
    ]
  },
  'jacksonville-jaguars': {
    id: 'jacksonville-jaguars',
    name: 'Jaguars',
    city: 'Jacksonville',
    fullName: 'Jacksonville Jaguars',
    abbreviation: 'JAX',
    espnAbbr: 'jax',
    conference: 'AFC',
    division: 'AFC South',
    primaryColor: '#006778',
    secondaryColor: '#D7A22A',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/jacksonville-jaguars.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'James Gladstone',
    headCoach: 'Liam Coen',
    homeVenue: 'TIAA Bank Field',
    location: 'Jacksonville, FL',
    stats: {
      prPlus: { value: 90, rank: 27 },
      offPlus: { value: 89, rank: 26 },
      defPlus: { value: 91, rank: 24 },
      stPlus: { value: 96, rank: 23 }
    },
    searchTerms: [
      'jaguars', 'jacksonville jaguars', 'trevor lawrence', 'calvin ridley',
      'christian kirk', 'josh allen', 'myles jack', 'cam robinson',
      'liam coen', 'james gladstone', 'tiaa bank field',
      'jacksonville', 'duval', 'jags'
    ]
  },
  'kansas-city-chiefs': {
    id: 'kansas-city-chiefs',
    name: 'Chiefs',
    city: 'Kansas City',
    fullName: 'Kansas City Chiefs',
    abbreviation: 'KC',
    espnAbbr: 'kc',
    conference: 'AFC',
    division: 'AFC West',
    primaryColor: '#E31837',
    secondaryColor: '#FFB81C',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/kansas-city-chiefs.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Brett Veach',
    headCoach: 'Andy Reid',
    homeVenue: 'Arrowhead Stadium',
    location: 'Kansas City, MO',
    stats: {
      prPlus: { value: 125, rank: 1 },
      offPlus: { value: 109, rank: 7 },
      defPlus: { value: 118, rank: 1 },
      stPlus: { value: 112, rank: 2 }
    },
    searchTerms: [
      'chiefs', 'kansas city chiefs', 'patrick mahomes', 'travis kelce',
      'tyreek hill', 'chris jones', 'tyrann mathieu', 'orlando brown',
      'andy reid', 'brett veach', 'arrowhead stadium',
      'kansas city', 'chiefs kingdom', 'red friday'
    ]
  },
  'las-vegas-raiders': {
    id: 'las-vegas-raiders',
    name: 'Raiders',
    city: 'Las Vegas',
    fullName: 'Las Vegas Raiders',
    abbreviation: 'LV',
    espnAbbr: 'lv',
    conference: 'AFC',
    division: 'AFC West',
    primaryColor: '#000000',
    secondaryColor: '#A5ACAF',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/las-vegas-raiders.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'John Spytek',
    headCoach: 'Vacant',
    homeVenue: 'Allegiant Stadium',
    location: 'Las Vegas, NV',
    stats: {
      prPlus: { value: 91, rank: 26 },
      offPlus: { value: 90, rank: 25 },
      defPlus: { value: 89, rank: 26 },
      stPlus: { value: 94, rank: 26 }
    },
    searchTerms: [
      'raiders', 'las vegas raiders', 'derek carr', 'davante adams',
      'josh jacobs', 'maxx crosby', 'chandler jones', 'darren waller',
      'pete carroll', 'john spytek', 'allegiant stadium',
      'las vegas', 'raider nation', 'just win baby'
    ]
  },
  'los-angeles-chargers': {
    id: 'los-angeles-chargers',
    name: 'Chargers',
    city: 'Los Angeles',
    fullName: 'Los Angeles Chargers',
    abbreviation: 'LAC',
    espnAbbr: 'lac',
    conference: 'AFC',
    division: 'AFC West',
    primaryColor: '#0080C6',
    secondaryColor: '#FFC20E',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/los-angeles-chargers.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Tom Telesco',
    headCoach: 'Jim Harbaugh',
    homeVenue: 'SoFi Stadium',
    location: 'Los Angeles, CA',
    stats: {
      prPlus: { value: 104, rank: 11 },
      offPlus: { value: 101, rank: 14 },
      defPlus: { value: 104, rank: 9 },
      stPlus: { value: 103, rank: 11 }
    },
    searchTerms: [
      'chargers', 'los angeles chargers', 'justin herbert', 'keenan allen',
      'mike williams', 'khalil mack', 'derwin james', 'joey bosa',
      'jim harbaugh', 'tom telesco', 'sofi stadium',
      'los angeles', 'bolt up', 'powder blue'
    ]
  },
  'los-angeles-rams': {
    id: 'los-angeles-rams',
    name: 'Rams',
    city: 'Los Angeles',
    fullName: 'Los Angeles Rams',
    abbreviation: 'LAR',
    espnAbbr: 'lar',
    conference: 'NFC',
    division: 'NFC West',
    primaryColor: '#003594',
    secondaryColor: '#FFA300',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/los-angeles-rams.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Les Snead',
    headCoach: 'Sean McVay',
    homeVenue: 'SoFi Stadium',
    location: 'Los Angeles, CA',
    stats: {
      prPlus: { value: 103, rank: 13 },
      offPlus: { value: 104, rank: 10 },
      defPlus: { value: 101, rank: 13 },
      stPlus: { value: 101, rank: 15 }
    },
    searchTerms: [
      'rams', 'los angeles rams', 'matthew stafford', 'cooper kupp',
      'aaron donald', 'van jefferson', 'cam akers', 'jalen ramsey',
      'sean mcvay', 'les snead', 'sofi stadium',
      'los angeles', 'ramily', 'whose house rams house'
    ]
  },
  'miami-dolphins': {
    id: 'miami-dolphins',
    name: 'Dolphins',
    city: 'Miami',
    fullName: 'Miami Dolphins',
    abbreviation: 'MIA',
    espnAbbr: 'mia',
    conference: 'AFC',
    division: 'AFC East',
    primaryColor: '#008E97',
    secondaryColor: '#FC4C02',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/miami-dolphins.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Chris Grier',
    headCoach: 'Vacant',
    homeVenue: 'Hard Rock Stadium',
    location: 'Miami Gardens, FL',
    stats: {
      prPlus: { value: 99, rank: 17 },
      offPlus: { value: 102, rank: 12 },
      defPlus: { value: 94, rank: 20 },
      stPlus: { value: 100, rank: 18 }
    },
    searchTerms: [
      'dolphins', 'miami dolphins', 'tua tagovailoa', 'tyreek hill',
      'jaylen waddle', 'bradley chubb', 'xavien howard', 'terron armstead',
      'mike mcdaniel', 'chris grier', 'hard rock stadium',
      'miami', 'fins up', 'perfect season'
    ]
  },
  'minnesota-vikings': {
    id: 'minnesota-vikings',
    name: 'Vikings',
    city: 'Minnesota',
    fullName: 'Minnesota Vikings',
    abbreviation: 'MIN',
    espnAbbr: 'min',
    conference: 'NFC',
    division: 'NFC North',
    primaryColor: '#4F2683',
    secondaryColor: '#FFC62F',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/minnesota-vikings.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Kwesi Adofo-Mensah',
    headCoach: 'Kevin O\'Connell',
    homeVenue: 'U.S. Bank Stadium',
    location: 'Minneapolis, MN',
    stats: {
      prPlus: { value: 109, rank: 6 },
      offPlus: { value: 106, rank: 9 },
      defPlus: { value: 110, rank: 4 },
      stPlus: { value: 104, rank: 7 }
    },
    searchTerms: [
      'vikings', 'minnesota vikings', 'kirk cousins', 'justin jefferson',
      'dalvin cook', 'harrison smith', 'danielle hunter', 'adam thielen',
      'kevin oconnell', 'kwesi adofo-mensah', 'us bank stadium',
      'minneapolis', 'skol vikings', 'purple people eaters'
    ]
  },
  'new-england-patriots': {
    id: 'new-england-patriots',
    name: 'Patriots',
    city: 'New England',
    fullName: 'New England Patriots',
    abbreviation: 'NE',
    espnAbbr: 'ne',
    conference: 'AFC',
    division: 'AFC East',
    primaryColor: '#002244',
    secondaryColor: '#C60C30',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/new-england-patriots.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Eliot Wolf',
    headCoach: 'Mike Vrabel',
    homeVenue: 'Gillette Stadium',
    location: 'Foxborough, MA',
    stats: {
      prPlus: { value: 86, rank: 30 },
      offPlus: { value: 83, rank: 32 },
      defPlus: { value: 88, rank: 27 },
      stPlus: { value: 92, rank: 28 }
    },
    searchTerms: [
      'patriots', 'new england patriots', 'mac jones', 'jakobi meyers',
      'damien harris', 'matthew judon', 'devin mccourty', 'kyle dugger',
      'mike vrabel', 'eliot wolf', 'gillette stadium',
      'foxborough', 'patriots nation', 'do your job'
    ]
  },
  'new-orleans-saints': {
    id: 'new-orleans-saints',
    name: 'Saints',
    city: 'New Orleans',
    fullName: 'New Orleans Saints',
    abbreviation: 'NO',
    espnAbbr: 'no',
    conference: 'NFC',
    division: 'NFC South',
    primaryColor: '#D3BC8D',
    secondaryColor: '#101820',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/new-orleans-saints.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Mickey Loomis',
    headCoach: 'Kellen Moore',
    homeVenue: 'Caesars Superdome',
    location: 'New Orleans, LA',
    stats: {
      prPlus: { value: 97, rank: 19 },
      offPlus: { value: 96, rank: 18 },
      defPlus: { value: 93, rank: 21 },
      stPlus: { value: 107, rank: 6 }
    },
    searchTerms: [
      'saints', 'new orleans saints', 'derek carr', 'alvin kamara',
      'michael thomas', 'cam jordan', 'demario davis', 'marshon lattimore',
      'kellen moore', 'mickey loomis', 'caesars superdome',
      'new orleans', 'who dat', 'fleur de lis'
    ]
  },
  'new-york-giants': {
    id: 'new-york-giants',
    name: 'Giants',
    city: 'New York',
    fullName: 'New York Giants',
    abbreviation: 'NYG',
    espnAbbr: 'nyg',
    conference: 'NFC',
    division: 'NFC East',
    primaryColor: '#0B2265',
    secondaryColor: '#A71930',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/new-york-giants.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Joe Schoen',
    headCoach: 'Mike Kafka (Interim)',
    homeVenue: 'MetLife Stadium',
    location: 'East Rutherford, NJ',
    stats: {
      prPlus: { value: 87, rank: 29 },
      offPlus: { value: 85, rank: 31 },
      defPlus: { value: 87, rank: 28 },
      stPlus: { value: 91, rank: 29 }
    },
    searchTerms: [
      'giants', 'new york giants', 'daniel jones', 'saquon barkley',
      'kenny golladay', 'leonard williams', 'blake martinez', 'adoree jackson',
      'mike kafka', 'joe schoen', 'metlife stadium',
      'new york', 'big blue', 'eli manning'
    ]
  },
  'new-york-jets': {
    id: 'new-york-jets',
    name: 'Jets',
    city: 'New York',
    fullName: 'New York Jets',
    abbreviation: 'NYJ',
    espnAbbr: 'nyj',
    conference: 'AFC',
    division: 'AFC East',
    primaryColor: '#125740',
    secondaryColor: '#000000',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/new-york-jets.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Darren Mougey',
    headCoach: 'Aaron Glenn',
    homeVenue: 'MetLife Stadium',
    location: 'East Rutherford, NJ',
    stats: {
      prPlus: { value: 101, rank: 15 },
      offPlus: { value: 97, rank: 17 },
      defPlus: { value: 103, rank: 10 },
      stPlus: { value: 99, rank: 20 }
    },
    searchTerms: [
      'jets', 'new york jets', 'aaron rodgers', 'garrett wilson',
      'breece hall', 'quinnen williams', 'sauce gardner', 'cj mosley',
      'aaron glenn', 'darren mougey', 'metlife stadium',
      'new york', 'jet up', 'green and white'
    ]
  },
  'philadelphia-eagles': {
    id: 'philadelphia-eagles',
    name: 'Eagles',
    city: 'Philadelphia',
    fullName: 'Philadelphia Eagles',
    abbreviation: 'PHI',
    espnAbbr: 'phi',
    conference: 'NFC',
    division: 'NFC East',
    primaryColor: '#004C54',
    secondaryColor: '#A5ACAF',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/philadelphia-eagles.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Howie Roseman',
    headCoach: 'Nick Sirianni',
    homeVenue: 'Lincoln Financial Field',
    location: 'Philadelphia, PA',
    stats: {
      prPlus: { value: 106, rank: 9 },
      offPlus: { value: 105, rank: 8 },
      defPlus: { value: 105, rank: 8 },
      stPlus: { value: 108, rank: 4 }
    },
    searchTerms: [
      'eagles', 'philadelphia eagles', 'jalen hurts', 'aj brown',
      'devonta smith', 'darius slay', 'haason reddick', 'dallas goedert',
      'nick sirianni', 'howie roseman', 'lincoln financial field',
      'philadelphia', 'fly eagles fly', 'bird gang'
    ]
  },
  'pittsburgh-steelers': {
    id: 'pittsburgh-steelers',
    name: 'Steelers',
    city: 'Pittsburgh',
    fullName: 'Pittsburgh Steelers',
    abbreviation: 'PIT',
    espnAbbr: 'pit',
    conference: 'AFC',
    division: 'AFC North',
    primaryColor: '#FFB612',
    secondaryColor: '#101820',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/pittsburgh-steelers.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Omar Khan',
    headCoach: 'Mike Tomlin',
    homeVenue: 'Heinz Field',
    location: 'Pittsburgh, PA',
    stats: {
      prPlus: { value: 102, rank: 14 },
      offPlus: { value: 99, rank: 16 },
      defPlus: { value: 102, rank: 12 },
      stPlus: { value: 105, rank: 9 }
    },
    searchTerms: [
      'steelers', 'pittsburgh steelers', 'kenny pickett', 'najee harris',
      'diontae johnson', 'tj watt', 'minkah fitzpatrick', 'cameron heyward',
      'mike tomlin', 'omar khan', 'heinz field',
      'pittsburgh', 'terrible towel', 'steel curtain'
    ]
  },
  'san-francisco-49ers': {
    id: 'san-francisco-49ers',
    name: '49ers',
    city: 'San Francisco',
    fullName: 'San Francisco 49ers',
    abbreviation: 'SF',
    espnAbbr: 'sf',
    conference: 'NFC',
    division: 'NFC West',
    primaryColor: '#AA0000',
    secondaryColor: '#B3995D',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/san-francisco-49ers.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'John Lynch',
    headCoach: 'Kyle Shanahan',
    homeVenue: 'Levi\'s Stadium',
    location: 'Santa Clara, CA',
    stats: {
      prPlus: { value: 114, rank: 4 },
      offPlus: { value: 111, rank: 4 },
      defPlus: { value: 114, rank: 2 },
      stPlus: { value: 107, rank: 5 }
    },
    searchTerms: [
      '49ers', 'san francisco 49ers', 'brock purdy', 'christian mccaffrey',
      'deebo samuel', 'nick bosa', 'fred warner', 'trent williams',
      'kyle shanahan', 'john lynch', 'levis stadium',
      'san francisco', 'faithful', 'quest for six'
    ]
  },
  'seattle-seahawks': {
    id: 'seattle-seahawks',
    name: 'Seahawks',
    city: 'Seattle',
    fullName: 'Seattle Seahawks',
    abbreviation: 'SEA',
    espnAbbr: 'sea',
    conference: 'NFC',
    division: 'NFC West',
    primaryColor: '#002244',
    secondaryColor: '#69BE28',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/seattle-seahawks.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'John Schneider',
    headCoach: 'Mike Macdonald',
    homeVenue: 'Lumen Field',
    location: 'Seattle, WA',
    stats: {
      prPlus: { value: 103, rank: 12 },
      offPlus: { value: 100, rank: 15 },
      defPlus: { value: 104, rank: 9 },
      stPlus: { value: 102, rank: 14 }
    },
    searchTerms: [
      'seahawks', 'seattle seahawks', 'geno smith', 'dk metcalf',
      'tyler lockett', 'bobby wagner', 'jamal adams', 'quandre diggs',
      'mike macdonald', 'john schneider', 'lumen field',
      'seattle', '12th man', 'sea hawks'
    ]
  },
  'tampa-bay-buccaneers': {
    id: 'tampa-bay-buccaneers',
    name: 'Buccaneers',
    city: 'Tampa Bay',
    fullName: 'Tampa Bay Buccaneers',
    abbreviation: 'TB',
    espnAbbr: 'tb',
    conference: 'NFC',
    division: 'NFC South',
    primaryColor: '#D50A0A',
    secondaryColor: '#FF7900',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/tampa-bay-buccaneers.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Jason Licht',
    headCoach: 'Todd Bowles',
    homeVenue: 'Raymond James Stadium',
    location: 'Tampa, FL',
    stats: {
      prPlus: { value: 97, rank: 20 },
      offPlus: { value: 98, rank: 19 },
      defPlus: { value: 95, rank: 19 },
      stPlus: { value: 95, rank: 25 }
    },
    searchTerms: [
      'buccaneers', 'tampa bay buccaneers', 'baker mayfield', 'mike evans',
      'chris godwin', 'vita vea', 'lavonte david', 'tristan wirfs',
      'todd bowles', 'jason licht', 'raymond james stadium',
      'tampa bay', 'bucs', 'fire the cannons'
    ]
  },
  'tennessee-titans': {
    id: 'tennessee-titans',
    name: 'Titans',
    city: 'Tennessee',
    fullName: 'Tennessee Titans',
    abbreviation: 'TEN',
    espnAbbr: 'ten',
    conference: 'AFC',
    division: 'AFC South',
    primaryColor: '#0C2340',
    secondaryColor: '#4B92DB',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/tennessee-titans.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Mike Borgonzi',
    headCoach: 'Mike McCoy (Interim)',
    homeVenue: 'Nissan Stadium',
    location: 'Nashville, TN',
    stats: {
      prPlus: { value: 85, rank: 31 },
      offPlus: { value: 87, rank: 28 },
      defPlus: { value: 86, rank: 29 },
      stPlus: { value: 90, rank: 30 }
    },
    searchTerms: [
      'titans', 'tennessee titans', 'will levis', 'derrick henry',
      'calvin ridley', 'jeffery simmons', 'kevin byard', 'taylor lewan',
      'mike mccoy', 'mike borgonzi', 'nissan stadium',
      'nashville', 'titan up', 'two tone blue'
    ]
  },
  'washington-commanders': {
    id: 'washington-commanders',
    name: 'Commanders',
    city: 'Washington',
    fullName: 'Washington Commanders',
    abbreviation: 'WSH',
    espnAbbr: 'wsh',
    conference: 'NFC',
    division: 'NFC East',
    primaryColor: '#5A1414',
    secondaryColor: '#FFB612',
    logoUrl: 'https://www.profootballnetwork.com/apps/nfl-logos/washington-commanders.png',
    record: '0-0-0',
    divisionRank: '0th',
    generalManager: 'Adam Peters',
    headCoach: 'Dan Quinn',
    homeVenue: 'FedExField',
    location: 'Landover, MD',
    stats: {
      prPlus: { value: 94, rank: 23 },
      offPlus: { value: 93, rank: 23 },
      defPlus: { value: 92, rank: 23 },
      stPlus: { value: 97, rank: 22 }
    },
    searchTerms: [
      'commanders', 'washington commanders', 'jayden daniels', 'terry mclaurin',
      'brian robinson', 'jonathan allen', 'kendall fuller', 'daron payne',
      'dan quinn', 'adam peters', 'fedexfield',
      'washington', 'httr', 'burgundy and gold'
    ]
  }
};

export function getTeam(teamId: string): TeamData | undefined {
  return teams[teamId];
}

export function getAllTeamIds(): string[] {
  return Object.keys(teams);
}

export function getAllTeams(): TeamData[] {
  return Object.values(teams);
}
