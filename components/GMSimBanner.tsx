'use client';

export default function GMSimBanner() {
  return (
    <div className="sticky top-[48px] lg:top-0 z-[9] lg:z-[39] w-full">
      <a
        href="https://www.profootballnetwork.com/cta-ultimate-gm-simulator-nfl/"
        target="_blank"
        rel="noopener noreferrer"
        className="group block w-full bg-[#FFD166] hover:brightness-[1.03] transition-all shadow-sm"
      >
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3">
          {/* Left badge */}
          <span className="shrink-0 hidden sm:flex items-center pr-2 sm:pr-3 border-r border-black/15">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-gray-900">
              Ultimate GM Simulator
            </span>
          </span>

          {/* Message */}
          <span className="flex-1 min-w-0 flex items-center sm:justify-center justify-start">
            <span className="text-sm sm:text-base font-medium text-gray-900 truncate">
              <span className="hidden sm:inline">Manage your favorite team's contracts, sign free agents, and run the draft for FREE</span>
              <span className="sm:hidden">Run Your Favorite Team's Offseason</span>
            </span>
          </span>

          {/* CTA */}
          <span className="shrink-0 flex items-center gap-1 text-[10px] sm:text-sm font-bold uppercase tracking-wide bg-[#0050A0] text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full whitespace-nowrap group-hover:bg-[#003a75] transition-colors">
            Be the GM
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">
              &rarr;
            </span>
          </span>
        </div>
      </a>
    </div>
  );
}
