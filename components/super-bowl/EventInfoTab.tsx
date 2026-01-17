'use client';

import { superBowlLX } from '@/data/superBowlHistory';

export default function EventInfoTab() {
  return (
    <div className="space-y-8">
      {/* Game Day Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Game Day Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 mx-auto mb-2 bg-[#013369] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Date</h3>
            <p className="text-lg">{superBowlLX.date}</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 mx-auto mb-2 bg-[#013369] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Kickoff Time</h3>
            <p className="text-lg">{superBowlLX.kickoff}</p>
            <p className="text-sm text-gray-500">3:30 PM PT / 4:30 PM MT / 5:30 PM CT</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 mx-auto mb-2 bg-[#013369] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Venue</h3>
            <p className="text-lg">{superBowlLX.venue}</p>
            <p className="text-sm text-gray-500">{superBowlLX.city}</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 mx-auto mb-2 bg-[#013369] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Capacity</h3>
            <p className="text-lg">{superBowlLX.capacity.toLocaleString()}</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 mx-auto mb-2 bg-[#013369] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Weather</h3>
            <p className="text-lg">Open-Air Stadium</p>
            <p className="text-sm text-gray-500">Check local forecast closer to game day</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 mx-auto mb-2 bg-[#013369] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Super Bowl Number</h3>
            <p className="text-lg">{superBowlLX.number} (60th)</p>
          </div>
        </div>
      </div>

      {/* Broadcast Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Broadcast Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-[#013369]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              TV Networks
            </h3>
            <div className="space-y-2">
              {superBowlLX.broadcast.tv.map((network) => (
                <div key={network} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{network}</p>
                  <p className="text-sm text-gray-500">
                    {network === 'NBC' && 'English broadcast'}
                    {network === 'Telemundo' && 'Spanish broadcast'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-[#013369]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Streaming
            </h3>
            <div className="space-y-2">
              {superBowlLX.broadcast.streaming.map((service) => (
                <div key={service} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{service}</p>
                  <p className="text-sm text-gray-500">Stream live online</p>
                </div>
              ))}
              <div className="text-sm text-gray-600 mt-2">
                <p>Additional streaming options may be available through:</p>
                <ul className="list-disc ml-5 mt-1">
                  <li>NFL+ Premium</li>
                  <li>YouTube TV</li>
                  <li>Hulu + Live TV</li>
                  <li>FuboTV</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Broadcast Team (TBD)</h4>
          <p className="text-blue-800 text-sm">
            The NBC broadcast team will be announced closer to the game. Previous Super Bowls on NBC have featured
            Mike Tirico on play-by-play with Cris Collinsworth providing color commentary.
          </p>
        </div>
      </div>

      {/* Halftime Show */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md p-6 text-white">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-sm uppercase tracking-wider opacity-75 mb-1">Apple Music Super Bowl LX Halftime Show</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{superBowlLX.halftimeShow.performer}</h2>
            <p className="text-lg opacity-90">{superBowlLX.halftimeShow.description}</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/20">
          <h3 className="font-semibold mb-3">About the Performer</h3>
          <p className="text-white/90 text-sm leading-relaxed">
            Bad Bunny, born Benito Antonio Martinez Ocasio, is a Puerto Rican rapper and singer known for his Latin trap
            and reggaeton music. With multiple Grammy and Latin Grammy Awards, he has become one of the most streamed
            artists in the world. His energetic performances and genre-blending style make him the perfect choice for
            the Super Bowl halftime stage.
          </p>
        </div>
      </div>

      {/* Venue Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">About Levi&apos;s Stadium</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-700 mb-4">
              Levi&apos;s Stadium, home of the San Francisco 49ers, is located in Santa Clara, California.
              The stadium opened in 2014 and has hosted numerous major events including Super Bowl 50 in 2016.
            </p>

            <h3 className="font-semibold text-gray-900 mb-3">Stadium Features</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>State-of-the-art open-air design with natural grass playing surface</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>One of the most technologically advanced stadiums in sports</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>LEED Gold certified for environmental design</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Located in the heart of Silicon Valley</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
            <address className="text-gray-700 not-italic mb-4">
              4900 Marie P. DeBartolo Way<br />
              Santa Clara, CA 95054
            </address>

            <h3 className="font-semibold text-gray-900 mb-3">Nearby Airports</h3>
            <ul className="text-gray-700 space-y-1">
              <li>• San Jose International (SJC) - 5 miles</li>
              <li>• San Francisco International (SFO) - 35 miles</li>
              <li>• Oakland International (OAK) - 40 miles</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mt-4 mb-3">Previous Super Bowls</h3>
            <p className="text-gray-700">
              Super Bowl 50 (February 7, 2016): Denver 24, Carolina 10
            </p>
          </div>
        </div>
      </div>

      {/* National Anthem (Placeholder) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">National Anthem</h2>
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg mb-2">Performer to be announced</p>
          <p className="text-sm">Check back closer to the game for National Anthem performer details.</p>
        </div>
      </div>

      {/* Super Bowl Week Events */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Super Bowl Week Events</h2>

        <div className="space-y-4">
          <div className="border-l-4 border-[#013369] pl-4">
            <h3 className="font-semibold text-gray-900">Opening Night</h3>
            <p className="text-gray-600 text-sm">Monday, February 2, 2026 (TBD)</p>
            <p className="text-gray-700 mt-1">Players and coaches meet with the media in a fan-accessible event.</p>
          </div>

          <div className="border-l-4 border-[#D50A0A] pl-4">
            <h3 className="font-semibold text-gray-900">NFL Experience</h3>
            <p className="text-gray-600 text-sm">February 1-8, 2026 (Location TBD)</p>
            <p className="text-gray-700 mt-1">Interactive fan festival featuring games, exhibits, and NFL memorabilia.</p>
          </div>

          <div className="border-l-4 border-[#013369] pl-4">
            <h3 className="font-semibold text-gray-900">Media Day</h3>
            <p className="text-gray-600 text-sm">Tuesday-Wednesday (TBD)</p>
            <p className="text-gray-700 mt-1">Team press conferences and player availability sessions.</p>
          </div>

          <div className="border-l-4 border-[#D50A0A] pl-4">
            <h3 className="font-semibold text-gray-900">NFL Honors</h3>
            <p className="text-gray-600 text-sm">Saturday, February 7, 2026 (TBD)</p>
            <p className="text-gray-700 mt-1">Annual awards ceremony honoring the league&apos;s best players and coaches.</p>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          * Event dates and times are subject to change.
        </p>
      </div>
    </div>
  );
}
