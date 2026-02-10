export interface TeamInfoData {
  founded: string;
  stadium: string;
  capacity: string;
  location: string;
  owner: string;
  conference: string;
  division: string;
  superbowlWins: number;
  superbowlAppearances: string[];
  conferenceChampionships: number;
  divisionTitles: number;
  playoffAppearances: number;
  retiredNumbers: Array<{
    number: string;
    name: string;
    position: string;
    years: string;
  }>;
  stadiumHistory: Array<{
    name: string;
    years: string;
    description?: string;
    isCurrent?: boolean;
  }>;
  achievements: Array<{
    title: string;
    description: string;
    count?: number;
  }>;
}

export const teamInfoData: Record<string, TeamInfoData> = {
  'arizona-cardinals': {
    founded: '1898',
    stadium: 'State Farm Stadium',
    capacity: '63,400',
    location: 'Glendale, AZ',
    owner: 'Michael Bidwill',
    conference: 'NFC',
    division: 'NFC West',
    superbowlWins: 0,
    superbowlAppearances: ['2008 (XLIII)'],
    conferenceChampionships: 1,
    divisionTitles: 2,
    playoffAppearances: 10,
    retiredNumbers: [
      { number: '8', name: 'Larry Wilson', position: 'Safety', years: '1960-1972' },
      { number: '40', name: 'Pat Tillman', position: 'Safety', years: '1998-2001' },
      { number: '77', name: 'Stan Mauldin', position: 'Offensive Line', years: '1946-1953' },
      { number: '88', name: 'J.V. Cain', position: 'Tight End', years: '1974-1979' },
      { number: '99', name: 'Marshall Goldberg', position: 'Halfback', years: '1939-1943, 1946-1948' }
    ],
    stadiumHistory: [
      { name: 'Normal Park', years: '1898–1921', description: 'Original home in Chicago' },
      { name: 'Comiskey Park & Wrigley Field', years: '1922–1959', description: 'Comiskey: 1922–1925, 1929–1930, 1939–1959; Wrigley: 1931–1938' },
      { name: 'Busch Stadiums Era', years: '1960–1987', description: 'Busch Stadium: 1960–1965; Busch Memorial Stadium: 1966–1987' },
      { name: 'Sun Devil Stadium', years: '1988–2005', description: '18 seasons in Tempe' },
      { name: 'State Farm Stadium', years: '2006–present', description: 'State-of-the-art facility in Glendale • Retractable roof • Hosted Super Bowl XLII & XLIX', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: '1 Super Bowl appearance (2008)', count: 0 },
      { title: 'NFC Championships', description: '2008 NFC Champions', count: 1 },
      { title: 'Division Titles', description: 'NFC West: 2008, 2009', count: 2 },
      { title: 'Playoff Appearances', description: 'Most recent: 2021', count: 10 }
    ]
  },

  'dallas-cowboys': {
    founded: '1960',
    stadium: 'AT&T Stadium',
    capacity: '80,000',
    location: 'Arlington, TX',
    owner: 'Jerry Jones',
    conference: 'NFC',
    division: 'NFC East',
    superbowlWins: 5,
    superbowlAppearances: ['1970 (V)', '1971 (VI)', '1975 (X)', '1977 (XII)', '1978 (XIII)', '1992 (XXVII)', '1993 (XXVIII)', '1995 (XXX)'],
    conferenceChampionships: 8,
    divisionTitles: 24,
    playoffAppearances: 35,
    retiredNumbers: [
      { number: '8', name: 'Troy Aikman', position: 'Quarterback', years: '1989-2000' },
      { number: '12', name: 'Roger Staubach', position: 'Quarterback', years: '1969-1979' },
      { number: '22', name: 'Emmitt Smith', position: 'Running Back', years: '1990-2002' },
      { number: '74', name: 'Bob Lilly', position: 'Defensive Tackle', years: '1961-1974' }
    ],
    stadiumHistory: [
      { name: 'Cotton Bowl', years: '1960–1971', description: 'Original home in Dallas' },
      { name: 'Texas Stadium', years: '1971–2008', description: 'Iconic venue in Irving with hole in the roof' },
      { name: 'AT&T Stadium', years: '2009–present', description: 'State-of-the-art facility in Arlington • Retractable roof • Largest HD video board', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'VI, XII, XXVII, XXVIII, XXX', count: 5 },
      { title: 'NFC Championships', description: '8 NFC Championship titles', count: 8 },
      { title: 'Division Titles', description: 'Most recent: 2023', count: 24 },
      { title: 'Playoff Appearances', description: 'Most recent: 2023', count: 35 }
    ]
  },

  'kansas-city-chiefs': {
    founded: '1960',
    stadium: 'Arrowhead Stadium',
    capacity: '76,416',
    location: 'Kansas City, MO',
    owner: 'Hunt Family',
    conference: 'AFC',
    division: 'AFC West',
    superbowlWins: 4,
    superbowlAppearances: ['1966 (I)', '1969 (IV)', '2019 (LIV)', '2022 (LVII)', '2023 (LVIII)'],
    conferenceChampionships: 6,
    divisionTitles: 16,
    playoffAppearances: 25,
    retiredNumbers: [
      { number: '3', name: 'Jan Stenerud', position: 'Kicker', years: '1967-1979' },
      { number: '16', name: 'Len Dawson', position: 'Quarterback', years: '1962-1975' },
      { number: '18', name: 'Emmitt Thomas', position: 'Cornerback', years: '1966-1978' },
      { number: '28', name: 'Abner Haynes', position: 'Running Back', years: '1960-1964' },
      { number: '33', name: 'Stone Johnson', position: 'Running Back', years: '1963' },
      { number: '36', name: 'Mack Lee Hill', position: 'Running Back', years: '1964-1965' },
      { number: '58', name: 'Derrick Thomas', position: 'Linebacker', years: '1989-1999' },
      { number: '63', name: 'Willie Lanier', position: 'Linebacker', years: '1967-1977' },
      { number: '78', name: 'Bobby Bell', position: 'Linebacker', years: '1963-1974' },
      { number: '86', name: 'Buck Buchanan', position: 'Defensive Tackle', years: '1963-1975' }
    ],
    stadiumHistory: [
      { name: 'Municipal Stadium', years: '1963–1971', description: 'Shared with Kansas City Athletics' },
      { name: 'Arrowhead Stadium', years: '1972–present', description: 'Home of the loudest crowd in the NFL • Part of the Truman Sports Complex', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'IV, LIV, LVII, LVIII', count: 4 },
      { title: 'AFC Championships', description: 'Most recent: 2023', count: 6 },
      { title: 'Division Titles', description: 'Most recent: 2023', count: 16 },
      { title: 'Playoff Appearances', description: 'Most recent: 2023', count: 25 }
    ]
  },

  'green-bay-packers': {
    founded: '1919',
    stadium: 'Lambeau Field',
    capacity: '81,441',
    location: 'Green Bay, WI',
    owner: 'Public Corporation',
    conference: 'NFC',
    division: 'NFC North',
    superbowlWins: 4,
    superbowlAppearances: ['1966 (I)', '1967 (II)', '1996 (XXXI)', '2010 (XLV)'],
    conferenceChampionships: 11,
    divisionTitles: 22,
    playoffAppearances: 37,
    retiredNumbers: [
      { number: '3', name: 'Tony Canadeo', position: 'Running Back', years: '1941-1944, 1946-1952' },
      { number: '4', name: 'Brett Favre', position: 'Quarterback', years: '1992-2007' },
      { number: '12', name: 'Aaron Rodgers', position: 'Quarterback', years: '2005-2022' },
      { number: '14', name: 'Don Hutson', position: 'End', years: '1935-1945' },
      { number: '15', name: 'Bart Starr', position: 'Quarterback', years: '1956-1971' },
      { number: '66', name: 'Ray Nitschke', position: 'Linebacker', years: '1958-1972' },
      { number: '92', name: 'Reggie White', position: 'Defensive End', years: '1993-1998' }
    ],
    stadiumHistory: [
      { name: 'Hagemeister Park', years: '1919–1922', description: 'Original home venue' },
      { name: 'Bellevue Park', years: '1923–1924', description: 'Early home in Green Bay' },
      { name: 'City Stadium', years: '1925–1956', description: 'First proper stadium' },
      { name: 'Lambeau Field', years: '1957–present', description: 'The Frozen Tundra • Historic venue named after founder Curly Lambeau', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'I, II, XXXI, XLV', count: 4 },
      { title: 'NFC Championships', description: 'Most recent: 2010', count: 5 },
      { title: 'Division Titles', description: 'Most recent: 2021', count: 22 },
      { title: 'Playoff Appearances', description: 'Most recent: 2025', count: 37 }
    ]
  },

  'new-england-patriots': {
    founded: '1960',
    stadium: 'Gillette Stadium',
    capacity: '65,878',
    location: 'Foxborough, MA',
    owner: 'Robert Kraft',
    conference: 'AFC',
    division: 'AFC East',
    superbowlWins: 6,
    superbowlAppearances: ['1985 (XX)', '1996 (XXXI)', '2001 (XXXVI)', '2003 (XXXVIII)', '2004 (XXXIX)', '2007 (XLII)', '2011 (XLVI)', '2014 (XLIX)', '2016 (LI)', '2017 (LII)', '2018 (LIII)', '2025 (LX)'],
    conferenceChampionships: 14,
    divisionTitles: 23,
    playoffAppearances: 32,
    retiredNumbers: [
      { number: '12', name: 'Tom Brady', position: 'Quarterback', years: '2000-2019' },
      { number: '20', name: 'Gino Cappelletti', position: 'Wide Receiver/Kicker', years: '1960-1970' },
      { number: '40', name: 'Mike Haynes', position: 'Cornerback', years: '1976-1982' },
      { number: '57', name: 'Steve Nelson', position: 'Linebacker', years: '1974-1987' },
      { number: '73', name: 'John Hannah', position: 'Guard', years: '1973-1985' },
      { number: '78', name: 'Bruce Armstrong', position: 'Tackle', years: '1987-2000' },
      { number: '79', name: 'Jim Lee Hunt', position: 'Defensive Tackle', years: '1960-1971' },
      { number: '89', name: 'Bob Dee', position: 'Defensive End', years: '1960-1967' }
    ],
    stadiumHistory: [
      { name: 'Boston University Field', years: '1960–1962', description: 'Original home as Boston Patriots' },
      { name: 'Fenway Park', years: '1963–1968', description: 'Shared with Boston Red Sox' },
      { name: 'Alumni Stadium', years: '1969', description: 'Boston College campus' },
      { name: 'Harvard Stadium', years: '1970', description: 'Harvard University venue' },
      { name: 'Schaefer Stadium/Foxboro Stadium', years: '1971–2001', description: 'First dedicated home in Foxborough' },
      { name: 'Gillette Stadium', years: '2002–present', description: 'State-of-the-art facility • Home of the Patriots dynasty', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'XXXVI, XXXVIII, XXXIX, XLIX, LI, LIII', count: 6 },
      { title: 'AFC Championships', description: 'Most recent: 2025', count: 14 },
      { title: 'Division Titles', description: 'Most recent: 2025', count: 23 },
      { title: 'Playoff Appearances', description: 'Most recent: 2025', count: 32 }
    ]
  },

  'atlanta-falcons': {
    founded: '1965',
    stadium: 'Mercedes-Benz Stadium',
    capacity: '71,000',
    location: 'Atlanta, GA',
    owner: 'Arthur M. Blank',
    conference: 'NFC',
    division: 'NFC South',
    superbowlWins: 0,
    superbowlAppearances: ['1998 (XXXIII)', '2016 (LI)'],
    conferenceChampionships: 2,
    divisionTitles: 6,
    playoffAppearances: 14,
    retiredNumbers: [
      { number: '10', name: 'Steve Bartkowski', position: 'Quarterback', years: '1975-1985' },
      { number: '31', name: 'William Andrews', position: 'Running Back', years: '1979-1983' },
      { number: '57', name: 'Jeff Van Note', position: 'Center', years: '1969-1986' },
      { number: '58', name: 'Jessie Tuggle', position: 'Linebacker', years: '1987-2000' },
      { number: '60', name: 'Tommy Nobis', position: 'Linebacker', years: '1966-1976' }
    ],
    stadiumHistory: [
      { name: 'Atlanta-Fulton County Stadium', years: '1966–1991', description: 'Original home, shared with Atlanta Braves' },
      { name: 'Georgia Dome', years: '1992–2016', description: '25 seasons in the iconic domed stadium' },
      { name: 'Mercedes-Benz Stadium', years: '2017–present', description: 'State-of-the-art retractable roof stadium • Hosted Super Bowl LIII', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'None (0-2 in Super Bowls)', count: 0 },
      { title: 'NFC Championships', description: 'Most recent: 2016', count: 2 },
      { title: 'Division Titles', description: 'Most recent: 2016', count: 6 },
      { title: 'Playoff Appearances', description: 'Most recent: 2017', count: 14 }
    ]
  },

  'baltimore-ravens': {
    founded: '1996',
    stadium: 'M&T Bank Stadium',
    capacity: '71,008',
    location: 'Baltimore, MD',
    owner: 'Steve Bisciotti',
    conference: 'AFC',
    division: 'AFC North',
    superbowlWins: 2,
    superbowlAppearances: ['2000 (XXXV)', '2012 (XLVII)'],
    conferenceChampionships: 2,
    divisionTitles: 6,
    playoffAppearances: 15,
    retiredNumbers: [
      { number: '19', name: 'Johnny Unitas', position: 'Quarterback', years: 'Honored Baltimore legend' },
      { number: '20', name: 'Ed Reed', position: 'Safety', years: '2002-2012' },
      { number: '52', name: 'Ray Lewis', position: 'Linebacker', years: '1996-2012' },
      { number: '75', name: 'Jonathan Ogden', position: 'Tackle', years: '1996-2007' }
    ],
    stadiumHistory: [
      { name: 'Memorial Stadium', years: '1996–1997', description: 'Temporary home while M&T Bank Stadium was built' },
      { name: 'M&T Bank Stadium', years: '1998–present', description: 'Ravens Stadium • Home of championship teams', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'XXXV (2000), XLVII (2012)', count: 2 },
      { title: 'AFC Championships', description: '2000, 2012', count: 2 },
      { title: 'Division Titles', description: 'Most recent: 2019', count: 6 },
      { title: 'Playoff Appearances', description: 'Most recent: 2023', count: 15 }
    ]
  },

  'buffalo-bills': {
    founded: '1960',
    stadium: 'Highmark Stadium',
    capacity: '71,608',
    location: 'Orchard Park, NY',
    owner: 'Terry and Kim Pegula',
    conference: 'AFC',
    division: 'AFC East',
    superbowlWins: 0,
    superbowlAppearances: ['1990 (XXV)', '1991 (XXVI)', '1992 (XXVII)', '1993 (XXVIII)'],
    conferenceChampionships: 4,
    divisionTitles: 12,
    playoffAppearances: 23,
    retiredNumbers: [
      { number: '12', name: 'Jim Kelly', position: 'Quarterback', years: '1986-1996' },
      { number: '34', name: 'Thurman Thomas', position: 'Running Back', years: '1988-1999' },
      { number: '78', name: 'Bruce Smith', position: 'Defensive End', years: '1985-1999' }
    ],
    stadiumHistory: [
      { name: 'War Memorial Stadium', years: '1960–1972', description: 'Original home in Buffalo' },
      { name: 'Rich Stadium', years: '1973–1998', description: 'Moved to Orchard Park suburb' },
      { name: 'Ralph Wilson Stadium', years: '1999–2015', description: 'Named after founder Ralph Wilson' },
      { name: 'New Era Field', years: '2016–2019', description: 'Naming rights partnership' },
      { name: 'Bills Stadium', years: '2020–2022', description: 'Temporary name during pandemic' },
      { name: 'Highmark Stadium', years: '2023–present', description: 'Current naming rights • New stadium planned for 2026', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'None (0-4 in Super Bowls)', count: 0 },
      { title: 'AFC Championships', description: 'Most recent: 1993', count: 4 },
      { title: 'Division Titles', description: 'Most recent: 2023', count: 12 },
      { title: 'Playoff Appearances', description: 'Most recent: 2025', count: 23 }
    ]
  },

  'carolina-panthers': {
    founded: '1995',
    stadium: 'Bank of America Stadium',
    capacity: '75,523',
    location: 'Charlotte, NC',
    owner: 'David Tepper',
    conference: 'NFC',
    division: 'NFC South',
    superbowlWins: 0,
    superbowlAppearances: ['2003 (XXXVIII)', '2015 (50)'],
    conferenceChampionships: 2,
    divisionTitles: 7,
    playoffAppearances: 9,
    retiredNumbers: [
      { number: '51', name: 'Sam Mills', position: 'Linebacker', years: '1995-1997' },
      { number: '89', name: 'Steve Smith Sr.', position: 'Wide Receiver', years: '2001-2013' }
    ],
    stadiumHistory: [
      { name: 'Memorial Stadium (Clemson)', years: '1995', description: 'Inaugural season while Charlotte stadium was completed' },
      { name: 'Bank of America Stadium', years: '1996–present', description: 'Panthers permanent home in uptown Charlotte', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'None (0-2 in Super Bowls)', count: 0 },
      { title: 'NFC Championships', description: 'Most recent: 2015', count: 2 },
      { title: 'Division Titles', description: 'Most recent: 2025', count: 7 },
      { title: 'Playoff Appearances', description: 'Most recent: 2025', count: 9 }
    ]
  },

  'chicago-bears': {
    founded: '1920',
    stadium: 'Soldier Field',
    capacity: '61,500',
    location: 'Chicago, IL',
    owner: 'McCaskey Family',
    conference: 'NFC',
    division: 'NFC North',
    superbowlWins: 1,
    superbowlAppearances: ['1985 (XX)', '2006 (XLI)'],
    conferenceChampionships: 4,
    divisionTitles: 20,
    playoffAppearances: 29,
    retiredNumbers: [
      { number: '3', name: 'Bronko Nagurski', position: 'Fullback', years: '1930-1937, 1943' },
      { number: '5', name: 'George McAfee', position: 'Halfback', years: '1940-1941, 1945-1950' },
      { number: '7', name: 'George Halas', position: 'Founder/Coach', years: '1920-1967' },
      { number: '28', name: 'Willie Galimore', position: 'Halfback', years: '1957-1963' },
      { number: '34', name: 'Walter Payton', position: 'Running Back', years: '1975-1987' },
      { number: '40', name: 'Gale Sayers', position: 'Running Back', years: '1965-1971' },
      { number: '41', name: 'Brian Piccolo', position: 'Running Back', years: '1966-1969' },
      { number: '42', name: 'Sid Luckman', position: 'Quarterback', years: '1939-1950' },
      { number: '51', name: 'Dick Butkus', position: 'Linebacker', years: '1965-1973' },
      { number: '56', name: 'Bill Hewitt', position: 'End', years: '1932-1936' },
      { number: '61', name: 'Bill George', position: 'Linebacker', years: '1952-1965' },
      { number: '66', name: 'Bulldog Turner', position: 'Center', years: '1940-1952' },
      { number: '77', name: 'Red Grange', position: 'Halfback', years: '1925, 1929-1934' },
      { number: '89', name: 'Mike Ditka', position: 'Tight End/Coach', years: '1961-1966, 1982-1992' }
    ],
    stadiumHistory: [
      { name: 'Staley Field', years: '1920', description: 'Original home in Decatur, Illinois' },
      { name: 'Cubs Park/Wrigley Field', years: '1921–1970', description: 'Primary home for 50 seasons' },
      { name: 'Soldier Field', years: '1971–present', description: 'Oldest NFL stadium • The oldest stadium in both the NFL and MLS', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'XX (1985)', count: 1 },
      { title: 'NFC Championships', description: 'Most recent: 2006', count: 4 },
      { title: 'Division Titles', description: 'Most recent: 2025', count: 20 },
      { title: 'Playoff Appearances', description: 'Most recent: 2025', count: 29 }
    ]
  },

  'cincinnati-bengals': {
    founded: '1968',
    stadium: 'Paycor Stadium',
    capacity: '65,535',
    location: 'Cincinnati, OH',
    owner: 'Mike Brown',
    conference: 'AFC',
    division: 'AFC North',
    superbowlWins: 0,
    superbowlAppearances: ['1981 (XVI)', '1988 (XXIII)', '2021 (LVI)'],
    conferenceChampionships: 3,
    divisionTitles: 10,
    playoffAppearances: 16,
    retiredNumbers: [
      { number: '54', name: 'Bob Johnson', position: 'Center', years: '1968-1979' }
    ],
    stadiumHistory: [
      { name: 'Nippert Stadium', years: '1968–1969', description: 'University of Cincinnati campus for first two seasons' },
      { name: 'Riverfront Stadium', years: '1970–1999', description: 'Shared with Cincinnati Reds baseball team' },
      { name: 'Paul Brown Stadium/Paycor Stadium', years: '2000–present', description: 'Named after founder Paul Brown', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'None (0-3 in Super Bowls)', count: 0 },
      { title: 'AFC Championships', description: 'Most recent: 2021', count: 3 },
      { title: 'Division Titles', description: 'Most recent: 2022', count: 10 },
      { title: 'Playoff Appearances', description: 'Most recent: 2022', count: 16 }
    ]
  },

  'cleveland-browns': {
    founded: '1946',
    stadium: 'Huntington Bank Field',
    capacity: '67,431',
    location: 'Cleveland, OH',
    owner: 'Jimmy Haslam',
    conference: 'AFC',
    division: 'AFC North',
    superbowlWins: 0,
    superbowlAppearances: [],
    conferenceChampionships: 4,
    divisionTitles: 12,
    playoffAppearances: 30,
    retiredNumbers: [
      { number: '14', name: 'Otto Graham', position: 'Quarterback', years: '1946-1955' },
      { number: '32', name: 'Jim Brown', position: 'Running Back', years: '1957-1965' },
      { number: '45', name: 'Ernie Davis', position: 'Running Back', years: 'Never played (deceased)' },
      { number: '46', name: 'Don Fleming', position: 'Defensive Back', years: '1960-1962' },
      { number: '76', name: 'Lou Groza', position: 'Tackle/Kicker', years: '1946-1959, 1961-1967' }
    ],
    stadiumHistory: [
      { name: 'Cleveland Municipal Stadium', years: '1946–1995', description: 'Original home for 50 seasons' },
      { name: 'Huntington Bank Field', years: '1999–present', description: 'Built after franchise returned from Baltimore', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'None', count: 0 },
      { title: 'AFC Championships', description: 'Never reached Super Bowl', count: 0 },
      { title: 'Division Titles', description: 'Most recent: 2020', count: 12 },
      { title: 'Playoff Appearances', description: 'Most recent: 2023', count: 30 }
    ]
  },

  'denver-broncos': {
    founded: '1960',
    stadium: 'Empower Field at Mile High',
    capacity: '76,125',
    location: 'Denver, CO',
    owner: 'Walton-Penner Group',
    conference: 'AFC',
    division: 'AFC West',
    superbowlWins: 3,
    superbowlAppearances: ['1977 (XII)', '1986 (XXI)', '1987 (XXII)', '1989 (XXIV)', '1997 (XXXII)', '1998 (XXXIII)', '2013 (XLVIII)', '2015 (50)'],
    conferenceChampionships: 8,
    divisionTitles: 16,
    playoffAppearances: 23,
    retiredNumbers: [
      { number: '7', name: 'John Elway', position: 'Quarterback', years: '1983-1998' },
      { number: '18', name: 'Peyton Manning', position: 'Quarterback', years: '2012-2015' },
      { number: '44', name: 'Floyd Little', position: 'Running Back', years: '1967-1975' }
    ],
    stadiumHistory: [
      { name: 'Bears Stadium/Mile High Stadium', years: '1960–2000', description: 'Original home with famous "Mile High Magic"' },
      { name: 'Empower Field at Mile High', years: '2001–present', description: 'Built adjacent to old Mile High Stadium', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'XXXII (1997), XXXIII (1998), 50 (2015)', count: 3 },
      { title: 'AFC Championships', description: 'Most recent: 2015', count: 8 },
      { title: 'Division Titles', description: 'Most recent: 2025', count: 16 },
      { title: 'Playoff Appearances', description: 'Most recent: 2025', count: 23 }
    ]
  },

  'detroit-lions': {
    founded: '1930',
    stadium: 'Ford Field',
    capacity: '65,000',
    location: 'Detroit, MI',
    owner: 'Sheila Ford Hamp',
    conference: 'NFC',
    division: 'NFC North',
    superbowlWins: 0,
    superbowlAppearances: [],
    conferenceChampionships: 4,
    divisionTitles: 4,
    playoffAppearances: 18,
    retiredNumbers: [
      { number: '7', name: 'Dutch Clark', position: 'Quarterback', years: '1934-1938' },
      { number: '20', name: 'Barry Sanders', position: 'Running Back', years: '1989-1998' },
      { number: '22', name: 'Bobby Layne', position: 'Quarterback', years: '1950-1958' },
      { number: '37', name: 'Doak Walker', position: 'Running Back', years: '1950-1955' },
      { number: '56', name: 'Joe Schmidt', position: 'Linebacker', years: '1953-1965' },
      { number: '85', name: 'Chuck Hughes', position: 'Wide Receiver', years: '1970-1971' }
    ],
    stadiumHistory: [
      { name: 'Universal Stadium (Portsmouth)', years: '1930–1933', description: 'Original home as Portsmouth Spartans' },
      { name: 'University of Detroit Stadium', years: '1934–1937', description: 'First Detroit venue' },
      { name: 'Briggs Stadium/Tiger Stadium', years: '1938–1974', description: 'Shared with Detroit Tigers baseball' },
      { name: 'Pontiac Silverdome', years: '1975–2001', description: '27 seasons in suburban Pontiac' },
      { name: 'Ford Field', years: '2002–present', description: 'Downtown Detroit domed stadium', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'None', count: 0 },
      { title: 'NFC Championships', description: 'None', count: 0 },
      { title: 'Division Titles', description: 'Most recent: 2023', count: 4 },
      { title: 'Playoff Appearances', description: 'Most recent: 2023', count: 18 }
    ]
  },

  'houston-texans': {
    founded: '2002',
    stadium: 'NRG Stadium',
    capacity: '71,054',
    location: 'Houston, TX',
    owner: 'Janice McNair',
    conference: 'AFC',
    division: 'AFC South',
    superbowlWins: 0,
    superbowlAppearances: [],
    conferenceChampionships: 0,
    divisionTitles: 8,
    playoffAppearances: 9,
    retiredNumbers: [],
    stadiumHistory: [
      { name: 'NRG Stadium', years: '2002–present', description: 'First NFL stadium with retractable roof', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'None', count: 0 },
      { title: 'AFC Championships', description: 'None', count: 0 },
      { title: 'Division Titles', description: 'Most recent: 2024', count: 8 },
      { title: 'Playoff Appearances', description: 'Most recent: 2025', count: 9 }
    ]
  },

  'indianapolis-colts': {
    founded: '1953',
    stadium: 'Lucas Oil Stadium',
    capacity: '67,000',
    location: 'Indianapolis, IN',
    owner: 'Jim Irsay',
    conference: 'AFC',
    division: 'AFC South',
    superbowlWins: 2,
    superbowlAppearances: ['1968 (III)', '1970 (V)', '2006 (XLI)', '2009 (XLIV)'],
    conferenceChampionships: 7,
    divisionTitles: 16,
    playoffAppearances: 27,
    retiredNumbers: [
      { number: '18', name: 'Peyton Manning', position: 'Quarterback', years: '1998-2011' },
      { number: '19', name: 'Johnny Unitas', position: 'Quarterback', years: '1956-1972' },
      { number: '22', name: 'Buddy Young', position: 'Running Back', years: '1953-1955' },
      { number: '24', name: 'Lenny Moore', position: 'Running Back', years: '1956-1967' },
      { number: '70', name: 'Art Donovan', position: 'Defensive Tackle', years: '1953-1961' },
      { number: '77', name: 'Jim Parker', position: 'Guard/Tackle', years: '1957-1967' },
      { number: '82', name: 'Raymond Berry', position: 'End', years: '1955-1967' },
      { number: '89', name: 'Gino Marchetti', position: 'Defensive End', years: '1953-1966' }
    ],
    stadiumHistory: [
      { name: 'Memorial Stadium (Baltimore)', years: '1953–1983', description: 'Baltimore Colts era' },
      { name: 'Hoosier Dome/RCA Dome', years: '1984–2007', description: 'First 24 seasons in Indianapolis' },
      { name: 'Lucas Oil Stadium', years: '2008–present', description: 'Retractable roof stadium • Hosted Super Bowl XLVI', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'V (1970), XLI (2006)', count: 2 },
      { title: 'AFC Championships', description: 'Most recent: 2009', count: 4 },
      { title: 'Division Titles', description: 'Most recent: 2014', count: 16 },
      { title: 'Playoff Appearances', description: 'Most recent: 2023', count: 27 }
    ]
  },

  'jacksonville-jaguars': {
    founded: '1995',
    stadium: 'EverBank Stadium',
    capacity: '67,814',
    location: 'Jacksonville, FL',
    owner: 'Shahid Khan',
    conference: 'AFC',
    division: 'AFC South',
    superbowlWins: 0,
    superbowlAppearances: [],
    conferenceChampionships: 0,
    divisionTitles: 3,
    playoffAppearances: 9,
    retiredNumbers: [],
    stadiumHistory: [
      { name: 'Jacksonville Municipal Stadium/EverBank Stadium', years: '1995–present', description: 'Home since inaugural season • Hosted Super Bowl XXXIX', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'None', count: 0 },
      { title: 'AFC Championships', description: 'Most recent: 2017', count: 3 },
      { title: 'Division Titles', description: 'Most recent: 2025', count: 3 },
      { title: 'Playoff Appearances', description: 'Most recent: 2025', count: 9 }
    ]
  },

  'las-vegas-raiders': {
    founded: '1960',
    stadium: 'Allegiant Stadium',
    capacity: '65,000',
    location: 'Las Vegas, NV',
    owner: 'Mark Davis',
    conference: 'AFC',
    division: 'AFC West',
    superbowlWins: 3,
    superbowlAppearances: ['1976 (XI)', '1980 (XV)', '1983 (XVIII)', '2002 (XXXVII)'],
    conferenceChampionships: 4,
    divisionTitles: 15,
    playoffAppearances: 23,
    retiredNumbers: [
      { number: '12', name: 'Ken Stabler', position: 'Quarterback', years: '1970-1979' },
      { number: '16', name: 'Jim Plunkett', position: 'Quarterback', years: '1978-1986' },
      { number: '24', name: 'Marcus Allen', position: 'Running Back', years: '1982-1992' },
      { number: '32', name: 'Tim Brown', position: 'Wide Receiver', years: '1988-2003' },
      { number: '42', name: 'Art Shell', position: 'Tackle', years: '1968-1982' },
      { number: '75', name: 'Howie Long', position: 'Defensive End', years: '1981-1993' }
    ],
    stadiumHistory: [
      { name: 'Candlestick Park', years: '1960', description: 'First season in San Francisco' },
      { name: 'Oakland-Alameda County Coliseum', years: '1966–1981, 1995–2019', description: 'Primary home for most of franchise history' },
      { name: 'Los Angeles Memorial Coliseum', years: '1982–1994', description: 'Los Angeles Raiders era' },
      { name: 'Allegiant Stadium', years: '2020–present', description: 'State-of-the-art domed stadium in Las Vegas', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'XI (1976), XV (1980), XVIII (1983)', count: 3 },
      { title: 'AFC Championships', description: 'Most recent: 2002', count: 4 },
      { title: 'Division Titles', description: 'Most recent: 2002', count: 15 },
      { title: 'Playoff Appearances', description: 'Most recent: 2021', count: 23 }
    ]
  },

  'los-angeles-chargers': {
    founded: '1960',
    stadium: 'SoFi Stadium',
    capacity: '70,240',
    location: 'Inglewood, CA',
    owner: 'Dean Spanos',
    conference: 'AFC',
    division: 'AFC West',
    superbowlWins: 0,
    superbowlAppearances: ['1994 (XXIX)'],
    conferenceChampionships: 1,
    divisionTitles: 15,
    playoffAppearances: 22,
    retiredNumbers: [
      { number: '14', name: 'Dan Fouts', position: 'Quarterback', years: '1973-1987' },
      { number: '19', name: 'Johnny Unitas', position: 'Quarterback', years: '1973' },
      { number: '21', name: 'LaDainian Tomlinson', position: 'Running Back', years: '2001-2009' },
      { number: '55', name: 'Junior Seau', position: 'Linebacker', years: '1990-2002' }
    ],
    stadiumHistory: [
      { name: 'Los Angeles Memorial Coliseum', years: '1960', description: 'Original home as Los Angeles Chargers' },
      { name: 'Balboa Stadium', years: '1961–1966', description: 'First San Diego venue' },
      { name: 'San Diego Stadium/Qualcomm Stadium', years: '1967–2016', description: '50 seasons in San Diego' },
      { name: 'StubHub Center', years: '2017–2019', description: 'Temporary home after return to LA' },
      { name: 'SoFi Stadium', years: '2020–present', description: 'Shared with Los Angeles Rams', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'None (0-1 in Super Bowls)', count: 0 },
      { title: 'AFC Championships', description: 'Most recent: 1994', count: 1 },
      { title: 'Division Titles', description: 'Most recent: 2009', count: 15 },
      { title: 'Playoff Appearances', description: 'Most recent: 2025', count: 22 }
    ]
  },

  'los-angeles-rams': {
    founded: '1936',
    stadium: 'SoFi Stadium',
    capacity: '70,240',
    location: 'Inglewood, CA',
    owner: 'Stan Kroenke',
    conference: 'NFC',
    division: 'NFC West',
    superbowlWins: 2,
    superbowlAppearances: ['1979 (XIV)', '1999 (XXXIV)', '2001 (XXXVI)', '2018 (LIII)', '2021 (LVI)'],
    conferenceChampionships: 5,
    divisionTitles: 19,
    playoffAppearances: 31,
    retiredNumbers: [
      { number: '7', name: 'Bob Waterfield', position: 'Quarterback', years: '1945-1952' },
      { number: '28', name: 'Marshall Faulk', position: 'Running Back', years: '1999-2005' },
      { number: '29', name: 'Eric Dickerson', position: 'Running Back', years: '1983-1987' },
      { number: '74', name: 'Merlin Olsen', position: 'Defensive Tackle', years: '1962-1976' },
      { number: '78', name: 'Jackie Slater', position: 'Tackle', years: '1976-1995' },
      { number: '85', name: 'Jack Youngblood', position: 'Defensive End', years: '1971-1984' }
    ],
    stadiumHistory: [
      { name: 'League Park/Cleveland Stadium', years: '1937–1945', description: 'Cleveland Rams era' },
      { name: 'Los Angeles Memorial Coliseum', years: '1946–1979', description: 'First Los Angeles era' },
      { name: 'Anaheim Stadium', years: '1980–1994', description: 'Moved to Orange County' },
      { name: 'Trans World Dome/Edward Jones Dome', years: '1995–2015', description: 'St. Louis Rams era' },
      { name: 'Los Angeles Memorial Coliseum', years: '2016–2019', description: 'Return to LA while SoFi was built' },
      { name: 'SoFi Stadium', years: '2020–present', description: 'State-of-the-art stadium • Hosted Super Bowl LVI', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'XXXIV (1999), LVI (2021)', count: 2 },
      { title: 'NFC Championships', description: 'Most recent: 2021', count: 5 },
      { title: 'Division Titles', description: 'Most recent: 2021', count: 19 },
      { title: 'Playoff Appearances', description: 'Most recent: 2025', count: 31 }
    ]
  },

  'miami-dolphins': {
    founded: '1966',
    stadium: 'Hard Rock Stadium',
    capacity: '64,767',
    location: 'Miami Gardens, FL',
    owner: 'Stephen M. Ross',
    conference: 'AFC',
    division: 'AFC East',
    superbowlWins: 2,
    superbowlAppearances: ['1971 (VI)', '1972 (VII)', '1973 (VIII)', '1982 (XVII)', '1984 (XIX)'],
    conferenceChampionships: 5,
    divisionTitles: 13,
    playoffAppearances: 23,
    retiredNumbers: [
      { number: '12', name: 'Bob Griese', position: 'Quarterback', years: '1967-1980' },
      { number: '13', name: 'Dan Marino', position: 'Quarterback', years: '1983-1999' },
      { number: '39', name: 'Larry Csonka', position: 'Fullback', years: '1968-1974, 1979' }
    ],
    stadiumHistory: [
      { name: 'Orange Bowl', years: '1966–1986', description: 'Original home in Miami' },
      { name: 'Joe Robbie Stadium/Hard Rock Stadium', years: '1987–present', description: 'Multiple naming rights changes over the years', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'VII (1972), VIII (1973)', count: 2 },
      { title: 'AFC Championships', description: 'Most recent: 1984', count: 5 },
      { title: 'Division Titles', description: 'Most recent: 2008', count: 13 },
      { title: 'Playoff Appearances', description: 'Most recent: 2023', count: 24 }
    ]
  },

  'minnesota-vikings': {
    founded: '1960',
    stadium: 'U.S. Bank Stadium',
    capacity: '66,860',
    location: 'Minneapolis, MN',
    owner: 'Zygi Wilf',
    conference: 'NFC',
    division: 'NFC North',
    superbowlWins: 0,
    superbowlAppearances: ['1969 (IV)', '1973 (VIII)', '1974 (IX)', '1976 (XI)'],
    conferenceChampionships: 4,
    divisionTitles: 20,
    playoffAppearances: 30,
    retiredNumbers: [
      { number: '10', name: 'Fran Tarkenton', position: 'Quarterback', years: '1961-1966, 1972-1978' },
      { number: '53', name: 'Mick Tingelhoff', position: 'Center', years: '1962-1978' },
      { number: '70', name: 'Jim Marshall', position: 'Defensive End', years: '1961-1979' },
      { number: '77', name: 'Korey Stringer', position: 'Tackle', years: '1995-2000' },
      { number: '80', name: 'Cris Carter', position: 'Wide Receiver', years: '1990-2001' },
      { number: '88', name: 'Alan Page', position: 'Defensive Tackle', years: '1967-1978' }
    ],
    stadiumHistory: [
      { name: 'Metropolitan Stadium', years: '1961–1981', description: 'Original home in Bloomington' },
      { name: 'Hubert H. Humphrey Metrodome', years: '1982–2013', description: '32 seasons in downtown Minneapolis dome' },
      { name: 'TCF Bank Stadium', years: '2014–2015', description: 'Temporary home during U.S. Bank Stadium construction' },
      { name: 'U.S. Bank Stadium', years: '2016–present', description: 'State-of-the-art facility • Features the Gjallarhorn', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'None (0-4 in Super Bowls)', count: 0 },
      { title: 'NFC Championships', description: 'Most recent: 1976', count: 4 },
      { title: 'Division Titles', description: 'Most recent: 2017', count: 20 },
      { title: 'Playoff Appearances', description: 'Most recent: 2024', count: 31 }
    ]
  },

  'new-orleans-saints': {
    founded: '1967',
    stadium: 'Caesars Superdome',
    capacity: '73,208',
    location: 'New Orleans, LA',
    owner: 'Gayle Benson',
    conference: 'NFC',
    division: 'NFC South',
    superbowlWins: 1,
    superbowlAppearances: ['2009 (XLIV)'],
    conferenceChampionships: 1,
    divisionTitles: 8,
    playoffAppearances: 13,
    retiredNumbers: [
      { number: '8', name: 'Archie Manning', position: 'Quarterback', years: '1971-1982' },
      { number: '9', name: 'Drew Brees', position: 'Quarterback', years: '2006-2020' }
    ],
    stadiumHistory: [
      { name: 'Tulane Stadium', years: '1967–1974', description: 'Original home for first 8 seasons' },
      { name: 'Louisiana Superdome/Caesars Superdome', years: '1975–present', description: 'The Superdome • Largest fixed domed structure in the world', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'XLIV (2009) - Drew Brees MVP', count: 1 },
      { title: 'NFC Championships', description: '2009', count: 1 },
      { title: 'Division Titles', description: 'Most recent: 2020', count: 8 },
      { title: 'Playoff Appearances', description: 'Most recent: 2020', count: 13 }
    ]
  },

  'new-york-giants': {
    founded: '1925',
    stadium: 'MetLife Stadium',
    capacity: '82,500',
    location: 'East Rutherford, NJ',
    owner: 'John Mara & Steve Tisch',
    conference: 'NFC',
    division: 'NFC East',
    superbowlWins: 4,
    superbowlAppearances: ['1986 (XXI)', '1990 (XXV)', '2000 (XXXV)', '2007 (XLII)', '2011 (XLVI)'],
    conferenceChampionships: 8,
    divisionTitles: 16,
    playoffAppearances: 32,
    retiredNumbers: [
      { number: '4', name: 'Tuffy Leemans', position: 'Running Back', years: '1936-1943' },
      { number: '7', name: 'Mel Hein', position: 'Center', years: '1931-1945' },
      { number: '10', name: 'Eli Manning', position: 'Quarterback', years: '2004-2019' },
      { number: '14', name: 'Y.A. Tittle & Ward Cuff', position: 'Quarterback & Running Back', years: '1961-1964 & 1937-1945' },
      { number: '16', name: 'Frank Gifford', position: 'Running Back', years: '1952-1960, 1962-1964' },
      { number: '32', name: 'Al Blozis', position: 'Tackle', years: '1942-1944' },
      { number: '40', name: 'Joe Morrison', position: 'Running Back', years: '1959-1972' },
      { number: '56', name: 'Lawrence Taylor', position: 'Linebacker', years: '1981-1993' }
    ],
    stadiumHistory: [
      { name: 'Polo Grounds', years: '1925–1955', description: 'Original home shared with baseball Giants' },
      { name: 'Yankee Stadium', years: '1956–1973', description: 'Shared with New York Yankees' },
      { name: 'Yale Bowl', years: '1973–1974', description: 'Temporary home during Giants Stadium construction' },
      { name: 'Shea Stadium', years: '1975', description: 'One season shared with Jets and Mets' },
      { name: 'Giants Stadium', years: '1976–2009', description: '34 seasons in original Meadowlands facility' },
      { name: 'MetLife Stadium', years: '2010–present', description: 'Largest NFL stadium • Shared with New York Jets', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'XXI (1986), XXV (1990), XLII (2007), XLVI (2011)', count: 4 },
      { title: 'NFC Championships', description: 'Most recent: 2011', count: 8 },
      { title: 'Division Titles', description: 'Most recent: 2011', count: 16 },
      { title: 'Playoff Appearances', description: 'Most recent: 2022', count: 33 }
    ]
  },

  'new-york-jets': {
    founded: '1960',
    stadium: 'MetLife Stadium',
    capacity: '82,500',
    location: 'East Rutherford, NJ',
    owner: 'Woody Johnson',
    conference: 'AFC',
    division: 'AFC East',
    superbowlWins: 1,
    superbowlAppearances: ['1968 (III)'],
    conferenceChampionships: 1,
    divisionTitles: 4,
    playoffAppearances: 14,
    retiredNumbers: [
      { number: '12', name: 'Joe Namath', position: 'Quarterback', years: '1965-1976' },
      { number: '13', name: 'Don Maynard', position: 'Wide Receiver', years: '1960-1972' },
      { number: '28', name: 'Curtis Martin', position: 'Running Back', years: '1998-2005' },
      { number: '73', name: 'Joe Klecko', position: 'Defensive Line', years: '1977-1987' },
      { number: '90', name: 'Dennis Byrd', position: 'Defensive End', years: '1989-1992' }
    ],
    stadiumHistory: [
      { name: 'Polo Grounds', years: '1960–1963', description: 'Original home as New York Titans' },
      { name: 'Shea Stadium', years: '1964–1983', description: 'First home as Jets, shared with Mets' },
      { name: 'Giants Stadium', years: '1984–2009', description: '26 seasons shared with Giants' },
      { name: 'MetLife Stadium', years: '2010–present', description: 'First jointly-built NFL stadium • Shared with Giants', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'III (1968)', count: 1 },
      { title: 'AFC Championships', description: 'Most recent: 2010', count: 3 },
      { title: 'Division Titles', description: 'Most recent: 2002', count: 4 },
      { title: 'Playoff Appearances', description: 'Most recent: 2023', count: 16 }
    ]
  },

  'philadelphia-eagles': {
    founded: '1933',
    stadium: 'Lincoln Financial Field',
    capacity: '67,594',
    location: 'Philadelphia, PA',
    owner: 'Jeffrey Lurie',
    conference: 'NFC',
    division: 'NFC East',
    superbowlWins: 2,
    superbowlAppearances: ['1980 (XV)', '2004 (XXXIX)', '2017 (LII)', '2022 (LVII)', '2024 (LIX)'],
    conferenceChampionships: 5,
    divisionTitles: 17,
    playoffAppearances: 32,
    retiredNumbers: [
      { number: '5', name: 'Donovan McNabb', position: 'Quarterback', years: '1999-2009' },
      { number: '15', name: 'Steve Van Buren', position: 'Running Back', years: '1944-1951' },
      { number: '20', name: 'Brian Dawkins', position: 'Safety', years: '1996-2008' },
      { number: '40', name: 'Tom Brookshier', position: 'Cornerback', years: '1953-1961' },
      { number: '60', name: 'Chuck Bednarik', position: 'Center/Linebacker', years: '1949-1962' },
      { number: '70', name: 'Al Wistert', position: 'Tackle', years: '1943-1951' },
      { number: '92', name: 'Reggie White', position: 'Defensive End', years: '1985-1992' },
      { number: '99', name: 'Jerome Brown', position: 'Defensive Tackle', years: '1987-1991' }
    ],
    stadiumHistory: [
      { name: 'Baker Bowl', years: '1933–1935', description: 'Original home shared with Phillies' },
      { name: 'Municipal Stadium', years: '1936–1939', description: 'Temporary home' },
      { name: 'Shibe Park/Connie Mack Stadium', years: '1940–1957', description: 'Shared with Athletics' },
      { name: 'Franklin Field', years: '1958–1970', description: 'University of Pennsylvania campus' },
      { name: 'Veterans Stadium', years: '1971–2002', description: '32 seasons in The Vet' },
      { name: 'Lincoln Financial Field', years: '2003–present', description: 'State-of-the-art facility in South Philadelphia', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'LII (2017), LIX (2024)', count: 2 },
      { title: 'NFC Championships', description: 'Most recent: 2024', count: 5 },
      { title: 'Division Titles', description: 'Most recent: 2025', count: 17 },
      { title: 'Playoff Appearances', description: 'Most recent: 2025', count: 32 }
    ]
  },

  'pittsburgh-steelers': {
    founded: '1933',
    stadium: 'Acrisure Stadium',
    capacity: '68,400',
    location: 'Pittsburgh, PA',
    owner: 'Art Rooney II',
    conference: 'AFC',
    division: 'AFC North',
    superbowlWins: 6,
    superbowlAppearances: ['1974 (IX)', '1975 (X)', '1978 (XIII)', '1979 (XIV)', '1995 (XXX)', '2005 (XL)', '2008 (XLIII)', '2010 (XLV)'],
    conferenceChampionships: 8,
    divisionTitles: 26,
    playoffAppearances: 34,
    retiredNumbers: [
      { number: '70', name: 'Ernie Stautner', position: 'Defensive Tackle', years: '1950-1963' }
    ],
    stadiumHistory: [
      { name: 'Forbes Field', years: '1933–1957', description: 'Original home shared with Pirates' },
      { name: 'Forbes Field & Pitt Stadium', years: '1958–1963', description: 'Split home games between venues' },
      { name: 'Pitt Stadium', years: '1964–1969', description: 'University of Pittsburgh campus' },
      { name: 'Three Rivers Stadium', years: '1970–2000', description: '31 seasons shared with Pirates' },
      { name: 'Heinz Field/Acrisure Stadium', years: '2001–present', description: 'North Shore stadium • Most Super Bowl wins since opening', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'IX, X, XIII, XIV, XL, XLIII (most in NFL)', count: 6 },
      { title: 'AFC Championships', description: 'Most recent: 2010', count: 8 },
      { title: 'Division Titles', description: 'Most recent: 2025', count: 26 },
      { title: 'Playoff Appearances', description: 'Most recent: 2025', count: 34 }
    ]
  },

  'san-francisco-49ers': {
    founded: '1946',
    stadium: 'Levi\'s Stadium',
    capacity: '68,500',
    location: 'Santa Clara, CA',
    owner: 'Denise DeBartolo York',
    conference: 'NFC',
    division: 'NFC West',
    superbowlWins: 5,
    superbowlAppearances: ['1981 (XVI)', '1984 (XIX)', '1988 (XXIII)', '1989 (XXIV)', '1994 (XXIX)', '2012 (XLVII)', '2019 (LIV)'],
    conferenceChampionships: 8,
    divisionTitles: 22,
    playoffAppearances: 31,
    retiredNumbers: [
      { number: '8', name: 'Steve Young', position: 'Quarterback', years: '1987-1999' },
      { number: '12', name: 'John Brodie', position: 'Quarterback', years: '1957-1973' },
      { number: '16', name: 'Joe Montana', position: 'Quarterback', years: '1979-1992' },
      { number: '34', name: 'Joe Perry', position: 'Running Back', years: '1948-1960, 1963' },
      { number: '37', name: 'Jimmy Johnson', position: 'Running Back', years: '1961-1976' },
      { number: '39', name: 'Hugh McElhenny', position: 'Running Back', years: '1952-1960' },
      { number: '42', name: 'Ronnie Lott', position: 'Safety', years: '1981-1990' },
      { number: '70', name: 'Charlie Krueger', position: 'Defensive Tackle', years: '1958-1973' },
      { number: '73', name: 'Leo Nomellini', position: 'Defensive Tackle', years: '1950-1963' },
      { number: '79', name: 'Bob St. Clair', position: 'Tackle', years: '1953-1963' },
      { number: '80', name: 'Jerry Rice', position: 'Wide Receiver', years: '1985-2000' },
      { number: '87', name: 'Dwight Clark', position: 'Wide Receiver', years: '1979-1987' }
    ],
    stadiumHistory: [
      { name: 'Kezar Stadium', years: '1946–1970', description: 'Original home in San Francisco' },
      { name: 'Candlestick Park', years: '1971–2013', description: '43 seasons by the Bay • Five Super Bowl championships' },
      { name: 'Levi\'s Stadium', years: '2014–present', description: 'State-of-the-art facility in Santa Clara • Hosted Super Bowl 50', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'XVI, XIX, XXIII, XXIV, XXIX (5 total)', count: 5 },
      { title: 'NFC Championships', description: 'Most recent: 2019', count: 8 },
      { title: 'Division Titles', description: 'Most recent: 2023', count: 22 },
      { title: 'Playoff Appearances', description: 'Most recent: 2025', count: 31 }
    ]
  },

  'seattle-seahawks': {
    founded: '1976',
    stadium: 'Lumen Field',
    capacity: '68,740',
    location: 'Seattle, WA',
    owner: 'Jody Allen',
    conference: 'NFC',
    division: 'NFC West',
    superbowlWins: 2,
    superbowlAppearances: ['2005 (XL)', '2013 (XLVIII)', '2014 (XLIX)', '2025 (LX)'],
    conferenceChampionships: 4,
    divisionTitles: 12,
    playoffAppearances: 21,
    retiredNumbers: [
      { number: '12', name: '12th Man', position: 'Fans', years: '1976-present' },
      { number: '45', name: 'Kenny Easley', position: 'Safety', years: '1981-1987' },
      { number: '71', name: 'Walter Jones', position: 'Tackle', years: '1997-2009' },
      { number: '80', name: 'Steve Largent', position: 'Wide Receiver', years: '1976-1989' },
      { number: '96', name: 'Cortez Kennedy', position: 'Defensive Tackle', years: '1990-2000' }
    ],
    stadiumHistory: [
      { name: 'Kingdome', years: '1976–1999', description: 'Original home for 24 seasons' },
      { name: 'Husky Stadium', years: '2000–2001', description: 'Temporary home during new stadium construction' },
      { name: 'Seahawks Stadium/Lumen Field', years: '2002–present', description: 'Home of the 12th Man • Loudest stadium in NFL', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'XLVIII (2013), LX (2025)', count: 2 },
      { title: 'NFC Championships', description: 'Most recent: 2025', count: 4 },
      { title: 'Division Titles', description: 'Most recent: 2025', count: 12 },
      { title: 'Playoff Appearances', description: 'Most recent: 2025', count: 21 }
    ]
  },

  'tampa-bay-buccaneers': {
    founded: '1976',
    stadium: 'Raymond James Stadium',
    capacity: '65,618',
    location: 'Tampa, FL',
    owner: 'Glazer Family',
    conference: 'NFC',
    division: 'NFC South',
    superbowlWins: 2,
    superbowlAppearances: ['2002 (XXXVII)', '2020 (LV)'],
    conferenceChampionships: 2,
    divisionTitles: 6,
    playoffAppearances: 14,
    retiredNumbers: [
      { number: '12', name: 'Tom Brady', position: 'Quarterback', years: '2020-2022' },
      { number: '40', name: 'Mike Alstott', position: 'Fullback', years: '1996-2006' },
      { number: '47', name: 'John Lynch', position: 'Safety', years: '1993-2003' },
      { number: '55', name: 'Derrick Brooks', position: 'Linebacker', years: '1995-2008' },
      { number: '63', name: 'Lee Roy Selmon', position: 'Defensive End', years: '1976-1984' },
      { number: '99', name: 'Warren Sapp', position: 'Defensive Tackle', years: '1995-2003' }
    ],
    stadiumHistory: [
      { name: 'Tampa Stadium', years: '1976–1997', description: 'Original home for 22 seasons' },
      { name: 'Raymond James Stadium', years: '1998–present', description: 'Pirate ship • Two Super Bowl championships', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'XXXVII (2002), LV (2020)', count: 2 },
      { title: 'NFC Championships', description: 'Most recent: 2020', count: 2 },
      { title: 'Division Titles', description: 'Most recent: 2021', count: 6 },
      { title: 'Playoff Appearances', description: 'Most recent: 2022', count: 14 }
    ]
  },

  'tennessee-titans': {
    founded: '1960',
    stadium: 'Nissan Stadium',
    capacity: '69,143',
    location: 'Nashville, TN',
    owner: 'Amy Adams Strunk',
    conference: 'AFC',
    division: 'AFC South',
    superbowlWins: 0,
    superbowlAppearances: ['1999 (XXXIV)'],
    conferenceChampionships: 1,
    divisionTitles: 8,
    playoffAppearances: 22,
    retiredNumbers: [
      { number: '1', name: 'Warren Moon', position: 'Quarterback', years: '1984-1993' },
      { number: '9', name: 'Steve McNair', position: 'Quarterback', years: '1995-2005' },
      { number: '27', name: 'Eddie George', position: 'Running Back', years: '1996-2003' },
      { number: '34', name: 'Earl Campbell', position: 'Running Back', years: '1978-1984' },
      { number: '43', name: 'Jim Norton', position: 'Safety', years: '1960-1972' },
      { number: '63', name: 'Mike Munchak', position: 'Guard', years: '1982-1993' },
      { number: '65', name: 'Elvin Bethea', position: 'Defensive End', years: '1968-1983' },
      { number: '74', name: 'Bruce Matthews', position: 'Guard/Center', years: '1983-2001' }
    ],
    stadiumHistory: [
      { name: 'Jeppesen Stadium', years: '1960–1964', description: 'Original home as Houston Oilers' },
      { name: 'Rice Stadium', years: '1965–1967', description: 'University of Houston campus' },
      { name: 'Astrodome', years: '1968–1996', description: 'The Eighth Wonder of the World' },
      { name: 'Liberty Bowl Memorial Stadium', years: '1997', description: 'One season in Memphis as Tennessee Oilers' },
      { name: 'Vanderbilt Stadium', years: '1998', description: 'Temporary Nashville home' },
      { name: 'Adelphia Coliseum/Nissan Stadium', years: '1999–present', description: 'Permanent Nashville home • Music City Miracle', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'None (0-1 in Super Bowls)', count: 0 },
      { title: 'AFC Championships', description: 'Most recent: 1999', count: 1 },
      { title: 'Division Titles', description: 'Most recent: 2021', count: 8 },
      { title: 'Playoff Appearances', description: 'Most recent: 2021', count: 22 }
    ]
  },

  'washington-commanders': {
    founded: '1932',
    stadium: 'Commanders Field',
    capacity: '62,000',
    location: 'Landover, MD',
    owner: 'Josh Harris',
    conference: 'NFC',
    division: 'NFC East',
    superbowlWins: 3,
    superbowlAppearances: ['1972 (VII)', '1982 (XVII)', '1983 (XVIII)', '1987 (XXII)', '1991 (XXVI)'],
    conferenceChampionships: 5,
    divisionTitles: 14,
    playoffAppearances: 25,
    retiredNumbers: [
      { number: '7', name: 'Joe Theismann', position: 'Quarterback', years: '1974-1985' },
      { number: '9', name: 'Sonny Jurgensen', position: 'Quarterback', years: '1964-1974' },
      { number: '21', name: 'Sean Taylor', position: 'Safety', years: '2004-2007' },
      { number: '28', name: 'Darrell Green', position: 'Cornerback', years: '1983-2002' },
      { number: '33', name: 'Sammy Baugh', position: 'Quarterback', years: '1937-1952' },
      { number: '44', name: 'John Riggins', position: 'Running Back', years: '1976-1979, 1981-1985' },
      { number: '70', name: 'Sam Huff', position: 'Linebacker', years: '1964-1967, 1969' }
    ],
    stadiumHistory: [
      { name: 'Fenway Park', years: '1932', description: 'Original home as Boston Braves' },
      { name: 'Braves Field', years: '1932', description: 'Brief stint in Boston' },
      { name: 'Polo Grounds', years: '1936', description: 'One season in New York' },
      { name: 'Griffith Stadium', years: '1937–1960', description: '24 seasons in Washington D.C.' },
      { name: 'D.C. Stadium/RFK Stadium', years: '1961–1996', description: '36 seasons • Three Super Bowl championships' },
      { name: 'FedExField/Commanders Field', years: '1997–present', description: 'Landover home • Recent ownership change', isCurrent: true }
    ],
    achievements: [
      { title: 'Super Bowl Championships', description: 'XVII (1982), XXII (1987), XXVI (1991)', count: 3 },
      { title: 'NFC Championships', description: 'Most recent: 1991', count: 5 },
      { title: 'Division Titles', description: 'Most recent: 2020', count: 14 },
      { title: 'Playoff Appearances', description: 'Most recent: 2024', count: 25 }
    ]
  }

  // Add more teams as needed...
};

// Fallback data for teams not yet defined
export const getTeamInfo = (teamId: string): TeamInfoData => {
  return teamInfoData[teamId] || {
    founded: '1960',
    stadium: 'Unknown Stadium',
    capacity: 'N/A',
    location: 'Unknown',
    owner: 'Unknown',
    conference: 'NFL',
    division: 'Unknown',
    superbowlWins: 0,
    superbowlAppearances: [],
    conferenceChampionships: 0,
    divisionTitles: 0,
    playoffAppearances: 0,
    retiredNumbers: [],
    stadiumHistory: [],
    achievements: []
  };
};