'use client';

import { useState } from 'react';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';

export default function SuperBowlLXContent() {
  const [activeMatchup, setActiveMatchup] = useState<'seahawks-offense' | 'patriots-offense'>('seahawks-offense');

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="fixed top-0 left-0 w-64 h-screen z-10">
          <NFLTeamsSidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20">
        <NFLTeamsSidebar isMobile={true} />
      </div>

      {/* Main content */}
      <main id="main-content" className="flex-1 lg:ml-64 min-w-0">
        {/* Header */}
        <div className="bg-[#0050A0] text-white pt-[57px] lg:pt-0 pb-4 lg:pb-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3">
                  Super Bowl LX
                </h1>
                <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90">
                  Super Bowl LX coverage and information
                </p>
              </div>
              <img
                src="https://staticd.profootballnetwork.com/skm/assets/pfn/sblx-logo.png"
                alt="Super Bowl LX Logo"
                className="h-16 sm:h-20 lg:h-24 xl:h-28 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 xl:px-8 py-8">
          {/* Header Ad */}
          <div className="flex justify-center mb-6">
            <div className="raptive-pfn-header-90"></div>
          </div>

          {/* Team Logos */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 lg:gap-16 mb-6">
            <img
              src="/nfl-hq/new-england-patriots.png"
              alt="New England Patriots"
              className="w-32 h-32 sm:w-44 sm:h-44 lg:w-56 lg:h-56 object-contain"
            />
            <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-700">
              vs.
            </span>
            <img
              src="/nfl-hq/seattle-seahawks-sb.png"
              alt="Seattle Seahawks"
              className="w-32 h-32 sm:w-44 sm:h-44 lg:w-56 lg:h-56 object-contain"
            />
          </div>

          {/* Three Column Layout: Broadcast Info | Stats | Game Info */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start">
            {/* Broadcast Information Box - Left (hidden below 1400px) */}
            <div className="hidden min-[1400px]:block w-full lg:w-[300px] lg:flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
              <div className="bg-[#0050A0] text-white px-4 py-3">
                <h3 className="font-semibold text-center">Broadcast Information</h3>
              </div>
              <div className="bg-white p-4 space-y-3">
                <div>
                  <span className="font-semibold text-gray-700">Television:</span>
                  <span className="text-gray-600 ml-2">NBC</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Streaming:</span>
                  <span className="text-gray-600 ml-2">Peacock & NFL+</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Spanish:</span>
                  <span className="text-gray-600 ml-2">Telemundo</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Radio:</span>
                  <span className="text-gray-600 ml-2">Westwood One & Entravision</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Halftime Show:</span>
                  <span className="text-gray-600 ml-2">Bad Bunny</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Opening Ceremony:</span>
                  <span className="text-gray-600 ml-2">Green Day</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">National Anthem:</span>
                  <span className="text-gray-600 ml-2">Charlie Puth (ASL: Fred Beam)</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">America the Beautiful:</span>
                  <span className="text-gray-600 ml-2">Brandi Carlile (ASL: Julian Ortiz)</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Lift Every Voice & Sing:</span>
                  <span className="text-gray-600 ml-2">Coco Jones (ASL: Fred Beam)</span>
                </div>
              </div>
            </div>

            {/* Stats Table - Center */}
            <div className="flex-1 w-full rounded-lg overflow-hidden">
                <div className="flex">
                  <div className="flex-1 p-3 text-center text-gray-900 bg-white">14-3</div>
                  <div className="flex-1 p-3 text-center font-semibold text-white bg-[#0050A0] max-w-[180px] lg:max-w-[250px] min-[1600px]:max-w-[300px]">2025 Record</div>
                  <div className="flex-1 p-3 text-center text-gray-900 bg-white">14-3</div>
                </div>
                <div className="flex">
                  <div className="flex-1 p-3 text-center text-gray-900 bg-gray-100">44.2%</div>
                  <div className="flex-1 p-3 text-center font-semibold text-white bg-[#0050A0] max-w-[180px] lg:max-w-[250px] min-[1600px]:max-w-[300px]">PFSN Projected Win Rate</div>
                  <div className="flex-1 p-3 text-center text-gray-900 bg-gray-100">55.8%</div>
                </div>
                <div className="flex">
                  <div className="flex-1 p-3 text-center text-gray-900 bg-white">7th</div>
                  <div className="flex-1 p-3 text-center font-semibold text-white bg-[#0050A0] max-w-[180px] lg:max-w-[250px] min-[1600px]:max-w-[300px]">Power Ranking</div>
                  <div className="flex-1 p-3 text-center text-gray-900 bg-white">1st</div>
                </div>
                <div className="flex">
                  <div className="flex-1 p-3 text-center text-gray-900 bg-gray-100">2nd (86.6 B)</div>
                  <div className="flex-1 p-3 text-center font-semibold text-white bg-[#0050A0] max-w-[180px] lg:max-w-[250px] min-[1600px]:max-w-[300px]">Offense</div>
                  <div className="flex-1 p-3 text-center text-gray-900 bg-gray-100">9th (79.8 C+)</div>
                </div>
                <div className="flex">
                  <div className="flex-1 p-3 text-center text-gray-900 bg-white">Maye 2nd (91.1 A-)</div>
                  <div className="flex-1 p-3 text-center font-semibold text-white bg-[#0050A0] max-w-[180px] lg:max-w-[250px] min-[1600px]:max-w-[300px]">Quarterback</div>
                  <div className="flex-1 p-3 text-center text-gray-900 bg-white">Darnold 13th (78.7 C+)</div>
                </div>
                <div className="flex">
                  <div className="flex-1 p-3 text-center text-gray-900 bg-gray-100">12th (74.5 C)</div>
                  <div className="flex-1 p-3 text-center font-semibold text-white bg-[#0050A0] max-w-[180px] lg:max-w-[250px] min-[1600px]:max-w-[300px]">Offensive Line</div>
                  <div className="flex-1 p-3 text-center text-gray-900 bg-gray-100">17th (72.0 C)</div>
                </div>
                <div className="flex">
                  <div className="flex-1 p-3 text-center text-gray-900 bg-white">12th (78.2 C+)</div>
                  <div className="flex-1 p-3 text-center font-semibold text-white bg-[#0050A0] max-w-[180px] lg:max-w-[250px] min-[1600px]:max-w-[300px]">Defense</div>
                  <div className="flex-1 p-3 text-center text-gray-900 bg-white">3rd (88.4 B+)</div>
                </div>
                <div className="flex">
                  <div className="flex-1 p-3 text-center text-gray-900 bg-gray-100">20th (73.9 C-)</div>
                  <div className="flex-1 p-3 text-center font-semibold text-white bg-[#0050A0] max-w-[180px] lg:max-w-[250px] min-[1600px]:max-w-[300px]">Special Teams</div>
                  <div className="flex-1 p-3 text-center text-gray-900 bg-gray-100">2nd (90.9 A-)</div>
                </div>
            </div>

            {/* Game Information Box - Right (hidden below 1400px) */}
            <div className="hidden min-[1400px]:block w-full lg:w-[300px] lg:flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
              <div className="bg-[#0050A0] text-white px-4 py-3">
                <h3 className="font-semibold text-center">Game Information</h3>
              </div>
              <div className="bg-white p-4 space-y-3">
                <div>
                  <span className="font-semibold text-gray-700">Date:</span>
                  <span className="text-gray-600 ml-2">February 8, 2026</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Kickoff:</span>
                  <span className="text-gray-600 ml-2">6:30 PM ET</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Stadium:</span>
                  <span className="text-gray-600 ml-2">Levi's Stadium</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Location:</span>
                  <span className="text-gray-600 ml-2">Santa Clara, CA</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Capacity:</span>
                  <span className="text-gray-600 ml-2">68,500</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Surface:</span>
                  <span className="text-gray-600 ml-2">Grass</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Referee:</span>
                  <span className="text-gray-600 ml-2">Shawn Smith</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Weather:</span>
                  <span className="text-gray-600 ml-2">TBD</span>
                </div>
              </div>
            </div>
          </div>

          {/* NFL Field Diagram with Coach Boxes on sides (1400px+) */}
          <div className="mt-[50px] flex gap-4">
            {/* Patriots Coaches Box - Left side on 1400px+ */}
            <div className="hidden min-[1400px]:block w-[375px] flex-shrink-0">
              <div className="rounded-lg overflow-hidden border border-gray-200 sticky top-4">
                <div className="bg-[#0050A0] text-white px-4 py-3">
                  <h3 className="font-semibold text-center">Patriots Coaches</h3>
                </div>
                <div className="bg-white p-4 space-y-3">
                  <div>
                    <span className="font-semibold text-gray-700">Head Coach:</span>
                    <span className="text-gray-600 ml-2">Mike Vrabel</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Offensive Coordinator:</span>
                    <span className="text-gray-600 ml-2">Josh McDaniels</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Defensive Coordinator:</span>
                    <span className="text-gray-600 ml-2">Terrell Williams</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Spec. Teams Coordinator:</span>
                    <span className="text-gray-600 ml-2">Jeremy Springer</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Field Diagram - Center (75% of original size) */}
            <div className="flex-1 w-full min-[1400px]:max-w-[75%] mx-auto">
                  {/* Matchup Tabs */}
                  <div className="flex">
                  <button
                    onClick={() => setActiveMatchup('seahawks-offense')}
                    className={`flex-1 py-3 px-4 font-semibold text-sm rounded-tl-lg transition-colors ${
                      activeMatchup === 'seahawks-offense'
                        ? 'bg-[#0050A0] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Seahawks Offense vs. Patriots Defense
                  </button>
                  <button
                    onClick={() => setActiveMatchup('patriots-offense')}
                    className={`flex-1 py-3 px-4 font-semibold text-sm rounded-tr-lg transition-colors ${
                      activeMatchup === 'patriots-offense'
                        ? 'bg-[#0050A0] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Patriots Offense vs. Seahawks Defense
                  </button>
                </div>

                <div className="bg-green-800 rounded-b-lg p-6 relative" style={{ minHeight: '500px' }}>
                  {/* Super Bowl Logo - Center */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                    <img
                      src="https://staticd.profootballnetwork.com/skm/assets/pfn/sblx-logo.png"
                      alt="Super Bowl LX"
                      className="w-24 h-24 object-contain"
                    />
                  </div>

                  {/* Field lines - center line */}
                  <div className="absolute inset-x-0 top-1/2 h-[2px] bg-white/50"></div>

                  {/* Hash marks - left side */}
                  <div className="absolute left-0 top-[10%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute left-0 top-[20%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute left-0 top-[30%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute left-0 top-[40%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute left-0 top-[50%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute left-0 top-[60%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute left-0 top-[70%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute left-0 top-[80%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute left-0 top-[90%] w-4 border-t-2 border-white/50"></div>

                  {/* Hash marks - right side */}
                  <div className="absolute right-0 top-[10%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute right-0 top-[20%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute right-0 top-[30%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute right-0 top-[40%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute right-0 top-[50%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute right-0 top-[60%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute right-0 top-[70%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute right-0 top-[80%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute right-0 top-[90%] w-4 border-t-2 border-white/50"></div>

                  {/* Defense Section */}
                  <div className="mb-20">
                    <p className="text-white text-center font-bold mb-4 text-lg">
                      {activeMatchup === 'seahawks-offense' ? 'PATRIOTS DEFENSE' : 'SEAHAWKS DEFENSE'}
                    </p>

                    {/* Safeties */}
                    <div className="flex justify-center gap-24 mb-4">
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">S</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Hawkins' : 'Bryant'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'seahawks-offense' ? '76.4 C' : '84.0 B'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">S</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Woodson' : 'Love'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'seahawks-offense' ? '69.7 D+' : '90.7 A-'}</span>
                      </div>
                    </div>

                    {/* Cornerbacks and Linebackers on same level */}
                    <div className="flex justify-between px-8 mb-4">
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">CB</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Gonzalez' : 'Woolen'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'seahawks-offense' ? '85.7 B' : '81.7 B-'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">LB</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Spillane' : 'Jones'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'seahawks-offense' ? '85.3 B' : '89.9 B+'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">LB</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Gibbens' : 'Thomas'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'seahawks-offense' ? '70.4 C-' : '77.9 C+'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">{activeMatchup === 'seahawks-offense' ? 'LB' : 'S'}</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Elliss' : 'Emmanwori'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'seahawks-offense' ? '62.7 D-' : '80.2 B-'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">CB</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Davis III' : 'Witherspoon'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'seahawks-offense' ? '78.8 C+' : '76.2 C'}</span>
                      </div>
                    </div>

                    {/* Defensive Line */}
                    <div className="flex justify-center gap-4">
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">EDGE</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Landry III' : 'Nwosu'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'seahawks-offense' ? '76.3 C' : '74.0 C'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">DT</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Williams' : 'Williams'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'seahawks-offense' ? '87.9 B+' : '84.2 B'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">DT</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Barmore' : 'Murphy II'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'seahawks-offense' ? '78.6 C+' : '81.2 B-'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">EDGE</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Chaisson' : 'Lawrence'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'seahawks-offense' ? '76.2 C' : '81.5 B-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Offense Section */}
                  <div className="mt-20">
                    <p className="text-white text-center font-bold mb-4 text-lg">
                      {activeMatchup === 'seahawks-offense' ? 'SEAHAWKS OFFENSE' : 'PATRIOTS OFFENSE'}
                    </p>

                    {/* Offensive Line with TE on right */}
                    <div className="flex justify-center gap-4 mb-4">
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">LT</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Campbell' : 'Cross'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'patriots-offense' ? '75.1 C' : '79.1 C+'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">LG</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Wilson' : 'Zabel'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'patriots-offense' ? '69.5 D+' : '77.1 C+'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">C</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Bradbury' : 'Sundell'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'patriots-offense' ? '80.4 B-' : '78.6 C+'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">RG</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Onwenu' : 'Bradford'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'patriots-offense' ? '87.0 B+' : '74.7 C'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">RT</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Moses' : 'Lucas'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'patriots-offense' ? '85.2 B' : '82.5 B-'}</span>
                      </div>
                    </div>

                    {/* WRs and QB on same level */}
                    <div className="flex justify-between px-8 mb-4">
                      <div className="text-center w-20">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">WR</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Diggs' : 'Smith-Njigba'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'patriots-offense' ? '87.0 B+' : '94.4 A'}</span>
                      </div>
                      <div className="text-center w-20">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">TE</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Henry' : 'Barner'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'patriots-offense' ? '82.0 B-' : '77.4 C+'}</span>
                      </div>
                      <div className="text-center w-20">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">QB</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Maye' : 'Darnold'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'patriots-offense' ? '91.1 A-' : '78.7 C+'}</span>
                      </div>
                      <div className="text-center w-20">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">WR</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Douglas' : 'Shaheed'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'patriots-offense' ? '79.3 C+' : '71.9 C-'}</span>
                      </div>
                      <div className="text-center w-20">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">WR</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Boutte' : 'Kupp'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'patriots-offense' ? '81.5 B-' : '73.2 C'}</span>
                      </div>
                    </div>

                    {/* RB */}
                    <div className="flex justify-center">
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">RB</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Stevenson' : 'Walker III'}</span>
                        <span className="text-white/80 text-xs block">{activeMatchup === 'patriots-offense' ? '54.4 F' : '65.8 D'}</span>
                      </div>
                    </div>
                  </div>
                </div>
            </div>

            {/* Seahawks Coaches Box - Right side on 1400px+ */}
            <div className="hidden min-[1400px]:block w-[375px] flex-shrink-0">
              <div className="rounded-lg overflow-hidden border border-gray-200 sticky top-4">
                <div className="bg-[#0050A0] text-white px-4 py-3">
                  <h3 className="font-semibold text-center">Seahawks Coaches</h3>
                </div>
                <div className="bg-white p-4 space-y-3">
                  <div>
                    <span className="font-semibold text-gray-700">Head Coach:</span>
                    <span className="text-gray-600 ml-2">Mike Macdonald</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Offensive Coordinator:</span>
                    <span className="text-gray-600 ml-2">Klint Kubiak</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Defensive Coordinator:</span>
                    <span className="text-gray-600 ml-2">Aden Durde</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Spec. Teams Coordinator:</span>
                    <span className="text-gray-600 ml-2">Jay Harbaugh</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

              {/* Coach Boxes - Only visible below 1400px */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 min-[1400px]:hidden">
                {/* Patriots Coaches Box */}
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div className="bg-[#0050A0] text-white px-4 py-3">
                    <h3 className="font-semibold text-center">Patriots Coaches</h3>
                  </div>
                  <div className="bg-white p-4 space-y-3">
                    <div>
                      <span className="font-semibold text-gray-700">Head Coach:</span>
                      <span className="text-gray-600 ml-2">Mike Vrabel</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Offensive Coordinator:</span>
                      <span className="text-gray-600 ml-2">Josh McDaniels</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Defensive Coordinator:</span>
                      <span className="text-gray-600 ml-2">Terrell Williams</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Spec. Teams Coordinator:</span>
                      <span className="text-gray-600 ml-2">Jeremy Springer</span>
                    </div>
                  </div>
                </div>
                {/* Seahawks Coaches Box */}
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div className="bg-[#0050A0] text-white px-4 py-3">
                    <h3 className="font-semibold text-center">Seahawks Coaches</h3>
                  </div>
                  <div className="bg-white p-4 space-y-3">
                    <div>
                      <span className="font-semibold text-gray-700">Head Coach:</span>
                      <span className="text-gray-600 ml-2">Mike Macdonald</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Offensive Coordinator:</span>
                      <span className="text-gray-600 ml-2">Klint Kubiak</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Defensive Coordinator:</span>
                      <span className="text-gray-600 ml-2">Aden Durde</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Spec. Teams Coordinator:</span>
                      <span className="text-gray-600 ml-2">Jay Harbaugh</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Broadcast and Game Info - Only visible below 1400px */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 min-[1400px]:hidden">
                {/* Broadcast Information Box */}
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div className="bg-[#0050A0] text-white px-4 py-3">
                    <h3 className="font-semibold text-center">Broadcast Information</h3>
                  </div>
                  <div className="bg-white p-4 space-y-3">
                    <div>
                      <span className="font-semibold text-gray-700">Television:</span>
                      <span className="text-gray-600 ml-2">NBC</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Streaming:</span>
                      <span className="text-gray-600 ml-2">Peacock & NFL+</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Spanish:</span>
                      <span className="text-gray-600 ml-2">Telemundo</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Radio:</span>
                      <span className="text-gray-600 ml-2">Westwood One & Entravision</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Halftime Show:</span>
                      <span className="text-gray-600 ml-2">Bad Bunny</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Opening Ceremony:</span>
                      <span className="text-gray-600 ml-2">Green Day</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">National Anthem:</span>
                      <span className="text-gray-600 ml-2">Charlie Puth (ASL: Fred Beam)</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">America the Beautiful:</span>
                      <span className="text-gray-600 ml-2">Brandi Carlile (ASL: Julian Ortiz)</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Lift Every Voice & Sing:</span>
                      <span className="text-gray-600 ml-2">Coco Jones (ASL: Fred Beam)</span>
                    </div>
                  </div>
                </div>
                {/* Game Information Box */}
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div className="bg-[#0050A0] text-white px-4 py-3">
                    <h3 className="font-semibold text-center">Game Information</h3>
                  </div>
                  <div className="bg-white p-4 space-y-3">
                    <div>
                      <span className="font-semibold text-gray-700">Date:</span>
                      <span className="text-gray-600 ml-2">February 8, 2026</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Kickoff:</span>
                      <span className="text-gray-600 ml-2">6:30 PM ET</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Stadium:</span>
                      <span className="text-gray-600 ml-2">Levi's Stadium</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Location:</span>
                      <span className="text-gray-600 ml-2">Santa Clara, CA</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Capacity:</span>
                      <span className="text-gray-600 ml-2">68,500</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Surface:</span>
                      <span className="text-gray-600 ml-2">Grass</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Referee:</span>
                      <span className="text-gray-600 ml-2">Shawn Smith</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Weather:</span>
                      <span className="text-gray-600 ml-2">TBD</span>
                    </div>
                  </div>
                </div>
              </div>
        </div>
      </main>
    </div>
  );
}
