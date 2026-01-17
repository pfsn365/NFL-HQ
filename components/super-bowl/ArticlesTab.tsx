'use client';

import { useState, useEffect } from 'react';
import { getApiPath } from '@/utils/api';
import SkeletonLoader from '@/components/SkeletonLoader';

interface Article {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  author?: string;
  category?: string;
  featuredImage?: string;
}

export default function ArticlesTab() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleArticles, setVisibleArticles] = useState(10);

  useEffect(() => {
    fetchSuperBowlArticles();
  }, []);

  const fetchSuperBowlArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch NFL news from PFN RSS feed via proxy
      const rssUrl = encodeURIComponent('https://www.profootballnetwork.com/nfl-news/feed/');
      const response = await fetch(getApiPath(`api/proxy-rss?url=${rssUrl}`));

      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();

      if (data.articles && data.articles.length > 0) {
        // Filter articles that mention Super Bowl, playoffs, or championship
        const superBowlKeywords = [
          'super bowl',
          'superbowl',
          'championship',
          'playoff',
          'postseason',
          'nfc champion',
          'afc champion',
          'conference championship',
        ];

        const filteredArticles = data.articles.filter((article: Article) => {
          const titleLower = article.title.toLowerCase();
          const descLower = (article.description || '').toLowerCase();
          return superBowlKeywords.some(keyword =>
            titleLower.includes(keyword) || descLower.includes(keyword)
          );
        });

        // If no Super Bowl specific articles, show recent NFL articles
        setArticles(filteredArticles.length > 0 ? filteredArticles : data.articles.slice(0, 20));
      } else {
        throw new Error('No articles found');
      }
    } catch (err) {
      console.error('Error fetching Super Bowl articles:', err);
      setError('Failed to load articles. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateDescription = (text: string, maxLength: number = 200) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const loadMore = () => {
    setVisibleArticles(prev => prev + 10);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse" />
        <div className="space-y-6">
          {[...Array(5)].map((_, idx) => (
            <div key={idx} className="border-b border-gray-100 pb-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-3 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={fetchSuperBowlArticles}
            className="px-4 py-2 bg-[#013369] text-white rounded-lg hover:bg-[#013369]/90 transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Super Bowl Coverage</h2>
            <p className="text-gray-600">Latest news and analysis from Pro Football Network</p>
          </div>
          <button
            onClick={fetchSuperBowlArticles}
            className="px-4 py-2 text-[#013369] border border-[#013369] rounded-lg hover:bg-[#013369] hover:text-white transition-colors cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">No articles found</p>
            <p className="text-sm">Check back later for Super Bowl coverage.</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {articles.slice(0, visibleArticles).map((article, idx) => (
                <article key={idx} className="border-b border-gray-100 pb-6 last:border-0">
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group cursor-pointer"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#013369] transition-colors mb-2">
                      {article.title}
                    </h3>
                    {article.description && (
                      <p className="text-gray-600 mb-3">
                        {truncateDescription(article.description)}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {article.author && (
                        <span>By {article.author}</span>
                      )}
                      <span>{formatDate(article.pubDate)}</span>
                      {article.category && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                          {article.category}
                        </span>
                      )}
                    </div>
                  </a>
                </article>
              ))}
            </div>

            {visibleArticles < articles.length && (
              <div className="text-center mt-6">
                <button
                  onClick={loadMore}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Load More Articles ({articles.length - visibleArticles} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* External Resources */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">More Super Bowl Coverage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://www.profootballnetwork.com/nfl-news/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-[#013369] hover:shadow-md transition-all cursor-pointer"
          >
            <div className="w-10 h-10 bg-[#013369] rounded-full flex items-center justify-center text-white">
              <span className="text-lg">📰</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">PFN NFL News</p>
              <p className="text-sm text-gray-500">Latest NFL headlines</p>
            </div>
          </a>

          <a
            href="https://www.profootballnetwork.com/nfl-playoff-predictor/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-[#013369] hover:shadow-md transition-all cursor-pointer"
          >
            <div className="w-10 h-10 bg-[#D50A0A] rounded-full flex items-center justify-center text-white">
              <span className="text-lg">🏆</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Playoff Predictor</p>
              <p className="text-sm text-gray-500">Simulate playoff scenarios</p>
            </div>
          </a>

          <a
            href="https://www.nfl.com/super-bowl/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-[#013369] hover:shadow-md transition-all cursor-pointer"
          >
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white">
              <span className="text-lg">🏈</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Official NFL</p>
              <p className="text-sm text-gray-500">NFL.com Super Bowl page</p>
            </div>
          </a>

          <a
            href="https://www.espn.com/nfl/super-bowl"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-[#013369] hover:shadow-md transition-all cursor-pointer"
          >
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white">
              <span className="text-lg font-bold text-xs">ESPN</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">ESPN Coverage</p>
              <p className="text-sm text-gray-500">Super Bowl analysis</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
