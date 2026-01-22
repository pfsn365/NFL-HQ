'use client';

import { useState } from 'react';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';

export default function SuperBowlLXContent() {
  const [activeMatchup, setActiveMatchup] = useState<'seahawks-offense' | 'broncos-offense'>('seahawks-offense');

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
              src="https://staticd.profootballnetwork.com/skm/assets/nfl-mockup/team-logos/Broncos.png"
              alt="Denver Broncos"
              className="w-32 h-32 sm:w-44 sm:h-44 lg:w-56 lg:h-56 object-contain"
            />
            <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-700">
              vs.
            </span>
            <img
              src="https://staticd.profootballnetwork.com/skm/assets/nfl-mockup/team-logos/Seahawks.png"
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
                  <div className="flex-1 p-3 text-center text-gray-900 bg-white"></div>
                  <div className="flex-1 p-3 text-center font-semibold text-white bg-[#0050A0] max-w-[180px] lg:max-w-[250px] min-[1600px]:max-w-[300px]">2025 Record</div>
                  <div className="flex-1 p-3 text-center text-gray-900 bg-white"></div>
                </div>
                <div className="flex">
                  <div className="flex-1 p-3 text-center text-gray-900 bg-gray-100"></div>
                  <div className="flex-1 p-3 text-center font-semibold text-white bg-[#0050A0] max-w-[180px] lg:max-w-[250px] min-[1600px]:max-w-[300px]">PFSN Projected Win Rate</div>
                  <div className="flex-1 p-3 text-center text-gray-900 bg-gray-100"></div>
                </div>
                <div className="flex">
                  <div className="flex-1 p-3 text-center text-gray-900 bg-white"></div>
                  <div className="flex-1 p-3 text-center font-semibold text-white bg-[#0050A0] max-w-[180px] lg:max-w-[250px] min-[1600px]:max-w-[300px]">Power Ranking</div>
                  <div className="flex-1 p-3 text-center text-gray-900 bg-white"></div>
                </div>
                <div className="flex">
                  <div className="flex-1 p-3 text-center text-gray-900 bg-gray-100"></div>
                  <div className="flex-1 p-3 text-center font-semibold text-white bg-[#0050A0] max-w-[180px] lg:max-w-[250px] min-[1600px]:max-w-[300px]">Offense</div>
                  <div className="flex-1 p-3 text-center text-gray-900 bg-gray-100"></div>
                </div>
                <div className="flex">
                  <div className="flex-1 p-3 text-center text-gray-900 bg-white">Stidham (N/A)</div>
                  <div className="flex-1 p-3 text-center font-semibold text-white bg-[#0050A0] max-w-[180px] lg:max-w-[250px] min-[1600px]:max-w-[300px]">Quarterback</div>
                  <div className="flex-1 p-3 text-center text-gray-900 bg-white">Darnold 13th (78.7 C+)</div>
                </div>
                <div className="flex">
                  <div className="flex-1 p-3 text-center text-gray-900 bg-gray-100"></div>
                  <div className="flex-1 p-3 text-center font-semibold text-white bg-[#0050A0] max-w-[180px] lg:max-w-[250px] min-[1600px]:max-w-[300px]">Offensive Line</div>
                  <div className="flex-1 p-3 text-center text-gray-900 bg-gray-100"></div>
                </div>
                <div className="flex">
                  <div className="flex-1 p-3 text-center text-gray-900 bg-white"></div>
                  <div className="flex-1 p-3 text-center font-semibold text-white bg-[#0050A0] max-w-[180px] lg:max-w-[250px] min-[1600px]:max-w-[300px]">Defense</div>
                  <div className="flex-1 p-3 text-center text-gray-900 bg-white"></div>
                </div>
                <div className="flex">
                  <div className="flex-1 p-3 text-center text-gray-900 bg-gray-100"></div>
                  <div className="flex-1 p-3 text-center font-semibold text-white bg-[#0050A0] max-w-[180px] lg:max-w-[250px] min-[1600px]:max-w-[300px]">Special Teams</div>
                  <div className="flex-1 p-3 text-center text-gray-900 bg-gray-100"></div>
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
                  <span className="text-gray-600 ml-2">TBD</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Weather:</span>
                  <span className="text-gray-600 ml-2">TBD</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Spread:</span>
                  <span className="text-gray-600 ml-2">TBD</span>
                </div>
              </div>
            </div>
          </div>

          {/* NFL Field Diagram with Coach Boxes on sides (1400px+) */}
          <div className="mt-[50px] flex gap-4">
            {/* Broncos Coaches Box - Left side on 1400px+ */}
            <div className="hidden min-[1400px]:block w-[375px] flex-shrink-0">
              <div className="rounded-lg overflow-hidden border border-gray-200 sticky top-4">
                <div className="bg-[#0050A0] text-white px-4 py-3">
                  <h3 className="font-semibold text-center">Broncos Coaches</h3>
                </div>
                <div className="bg-white p-4 space-y-3">
                  <div>
                    <span className="font-semibold text-gray-700">Head Coach:</span>
                    <span className="text-gray-600 ml-2">Sean Payton</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Offensive Coordinator:</span>
                    <span className="text-gray-600 ml-2">Joe Lombardi</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Defensive Coordinator:</span>
                    <span className="text-gray-600 ml-2">Vance Joseph</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Spec. Teams Coordinator:</span>
                    <span className="text-gray-600 ml-2">Darren Rizzi</span>
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
                    Seahawks Offense vs. Broncos Defense
                  </button>
                  <button
                    onClick={() => setActiveMatchup('broncos-offense')}
                    className={`flex-1 py-3 px-4 font-semibold text-sm rounded-tr-lg transition-colors ${
                      activeMatchup === 'broncos-offense'
                        ? 'bg-[#0050A0] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Broncos Offense vs. Seahawks Defense
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
                      {activeMatchup === 'seahawks-offense' ? 'BRONCOS DEFENSE' : 'SEAHAWKS DEFENSE'}
                    </p>

                    {/* Safeties */}
                    <div className="flex justify-center gap-24 mb-4">
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">S</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">S</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                    </div>

                    {/* Cornerbacks and Linebackers on same level */}
                    <div className="flex justify-between px-8 mb-4">
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">CB</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">LB</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">LB</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">CB</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                    </div>

                    {/* Defensive Line */}
                    <div className="flex justify-center gap-4">
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">EDGE</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">DT</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">DT</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">EDGE</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                    </div>
                  </div>

                  {/* Offense Section */}
                  <div className="mt-20">
                    <p className="text-white text-center font-bold mb-4 text-lg">
                      {activeMatchup === 'seahawks-offense' ? 'SEAHAWKS OFFENSE' : 'BRONCOS OFFENSE'}
                    </p>

                    {/* Offensive Line with TE on right */}
                    <div className="flex justify-center gap-4 mb-4">
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">LT</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">LG</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">C</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">RG</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">RT</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                      <div className="text-center ml-2">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">TE</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                    </div>

                    {/* WRs and QB on same level */}
                    <div className="flex justify-between px-8 mb-4">
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">WR</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">QB</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">WR</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
                      </div>
                    </div>

                    {/* RB */}
                    <div className="flex justify-center">
                      <div className="text-center">
                        <span className="bg-white text-green-800 px-3 py-1 rounded font-bold text-sm block">RB</span>
                        <span className="text-white text-xs mt-1 block">Player</span>
                        <span className="text-white/80 text-xs block">XX.X XX</span>
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
                    <span className="text-gray-600 ml-2">Name</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Offensive Coordinator:</span>
                    <span className="text-gray-600 ml-2">Name</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Defensive Coordinator:</span>
                    <span className="text-gray-600 ml-2">Name</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Spec. Teams Coordinator:</span>
                    <span className="text-gray-600 ml-2">Name</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

              {/* Coach Boxes - Only visible below 1400px */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 min-[1400px]:hidden">
                {/* Broncos Coaches Box */}
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div className="bg-[#0050A0] text-white px-4 py-3">
                    <h3 className="font-semibold text-center">Broncos Coaches</h3>
                  </div>
                  <div className="bg-white p-4 space-y-3">
                    <div>
                      <span className="font-semibold text-gray-700">Head Coach:</span>
                      <span className="text-gray-600 ml-2">Sean Payton</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Offensive Coordinator:</span>
                      <span className="text-gray-600 ml-2">Joe Lombardi</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Defensive Coordinator:</span>
                      <span className="text-gray-600 ml-2">Vance Joseph</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Spec. Teams Coordinator:</span>
                      <span className="text-gray-600 ml-2">Darren Rizzi</span>
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
                      <span className="text-gray-600 ml-2">Name</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Offensive Coordinator:</span>
                      <span className="text-gray-600 ml-2">Name</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Defensive Coordinator:</span>
                      <span className="text-gray-600 ml-2">Name</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Spec. Teams Coordinator:</span>
                      <span className="text-gray-600 ml-2">Name</span>
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
                      <span className="text-gray-600 ml-2">TBD</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Weather:</span>
                      <span className="text-gray-600 ml-2">TBD</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Spread:</span>
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
