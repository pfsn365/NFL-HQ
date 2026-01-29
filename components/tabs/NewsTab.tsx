'use client';

import { useState, useEffect } from 'react';
import { TeamData } from '@/data/teams';
import { getApiPath } from '@/utils/api';
import LayoutStabilizer from '@/components/LayoutStabilizer';

interface NewsArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  author?: string;
  category?: string;
}

interface NewsTabProps {
  team: TeamData;
}

export default function NewsTab({ team }: NewsTabProps) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTeamFocused, setIsTeamFocused] = useState(true);

  useEffect(() => {
    fetchTeamNews();
  }, [team.id]);

  const fetchTeamNews = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use our dynamic Next.js API route to avoid CORS issues
      const response = await fetch(getApiPath(`nfl/teams/api/news/${team.id}`), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch news');
      }
      
      setNews(data.articles || []);
      setIsTeamFocused(data.isCardinalsFocused ?? true);
    } catch (err) {
      setError(`Failed to load ${team.name} news. Please try again later.`);
      console.error('Error fetching news:', err);
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
      minute: '2-digit'
    });
  };

  const truncateDescription = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={600}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {isTeamFocused ? `${team.fullName} News` : 'Latest NFL News'}
          </h1>
          <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '250px' }}></div>
          {!isTeamFocused && (
            <p className="text-sm text-gray-600 mt-2">
              No {team.name}-specific news available right now. Showing latest NFL news instead.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTeamNews}
            className="px-4 py-2 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
            style={{ backgroundColor: team.primaryColor }}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh News'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-6">
          {[...Array(5)].map((_, index) => (
            <article key={index} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex flex-col space-y-3">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading News</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && news.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4" style={{ color: team.primaryColor }}>🏈</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No NFL News Available</h3>
          <p className="text-gray-600 mb-4">
            We couldn&apos;t find any NFL news articles at the moment.
          </p>
          <p className="text-sm text-gray-600">
            Check back later or click &ldquo;Refresh News&rdquo; to try again.
          </p>
        </div>
      )}

      {!loading && !error && news.length > 0 && (
        <div className="space-y-6">
          
          {news.map((article, index) => (
            <article key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                    <a 
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline cursor-pointer"
                      style={{ color: team.primaryColor }}
                    >
                      {article.title}
                    </a>
                  </h3>
                </div>
                
                {article.description && (
                  <p className="text-gray-700 leading-relaxed">
                    {truncateDescription(article.description)}
                  </p>
                )}
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {article.author && (
                      <span>By {article.author}</span>
                    )}
                    {article.category && article.category.toLowerCase() !== 'nfl' && (
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                        {article.category}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(article.pubDate)}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

    </LayoutStabilizer>
  );
}