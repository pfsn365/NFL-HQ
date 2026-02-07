import Link from 'next/link';


export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Basketball Icon/Animation */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-[#0050A0] flex items-center justify-center shadow-2xl animate-bounce">
              <svg
                className="w-20 h-20 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 w-32 h-32 rounded-full bg-[#0050A0] blur-xl opacity-50 animate-pulse"></div>
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-8xl md:text-9xl font-black text-white mb-4 tracking-tight">
          404
        </h1>

        {/* Error Message */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-200 mb-4">
          Page Not Found
        </h2>

        <p className="text-lg text-gray-300 mb-8 max-w-md mx-auto">
          Looks like this play didn&apos;t work out. The page you&apos;re looking for has been moved, deleted, or doesn&apos;t exist.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="px-8 py-3 min-h-[44px] bg-[#0050A0] hover:bg-[#003A75] active:scale-[0.98] text-white font-semibold rounded-lg transition-all cursor-pointer shadow-lg hover:shadow-xl"
          >
            Go to Homepage
          </Link>

          <Link
            href="/teams"
            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Browse All Teams
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <p className="text-sm text-gray-300 mb-4">Popular pages:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/standings" className="text-sm text-gray-300 hover:text-[#0050A0] transition-colors">
              Standings
            </Link>
            <span className="text-gray-500">•</span>
            <Link href="/power-rankings-builder" className="text-sm text-gray-300 hover:text-[#0050A0] transition-colors">
              Power Rankings
            </Link>
            <span className="text-gray-500">•</span>
            <Link href="/player-rankings-builder" className="text-sm text-gray-300 hover:text-[#0050A0] transition-colors">
              Player Rankings
            </Link>
            <span className="text-gray-500">•</span>
            <Link href="/draft-order" className="text-sm text-gray-300 hover:text-[#0050A0] transition-colors">
              Draft Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
