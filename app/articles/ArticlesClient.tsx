'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import Pagination from '@/components/Pagination';
import { getApiPath } from '@/utils/api';
import SkeletonLoader from '@/components/SkeletonLoader';

interface Article {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  featuredImage?: string;
  author?: string;
  category?: string;
  readTime?: string;
}

interface CategoryFeed {
  id: string;
  label: string;
  url: string;
}

const CATEGORY_FEEDS: CategoryFeed[] = [
  { id: 'all', label: 'All', url: '' },
  { id: 'insights', label: 'Insights', url: 'https://www.profootballnetwork.com/insights/feed/' },
  { id: 'trends', label: 'Trends', url: 'https://www.profootballnetwork.com/trends/feed/' },
  { id: 'draft', label: 'NFL Draft', url: 'https://www.profootballnetwork.com/nfl-draft/feed/' },
  { id: 'lifestyle', label: 'Lifestyle', url: 'https://www.profootballnetwork.com/lifestyle/feed/' },
  { id: 'vault', label: 'Vault', url: 'https://www.profootballnetwork.com/nfl-vault/feed/' },
];

export default function ArticlesClient() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Cache for fetched articles per category
  const articlesCacheRef = useRef<Record<string, Article[]>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load items per page from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('articles_items_per_page');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if ([12, 24, 48].includes(parsed)) {
        setItemsPerPage(parsed);
      }
    }
  }, []);

  // Fetch articles for a single feed
  const fetchFeed = useCallback(async (feedUrl: string, signal?: AbortSignal): Promise<Article[]> => {
    try {
      const response = await fetch(
        getApiPath(`api/proxy-rss?url=${encodeURIComponent(feedUrl)}`),
        { signal }
      );

      if (!response.ok) {
        console.warn(`Failed to fetch feed: ${feedUrl}`);
        return [];
      }

      const data = await response.json();
      return data.articles || [];
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw err;
      }
      console.error('Error fetching feed:', err);
      return [];
    }
  }, []);

  // Fetch articles based on selected category
  const fetchArticles = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Check cache first
    if (articlesCacheRef.current[selectedCategory]) {
      setArticles(articlesCacheRef.current[selectedCategory]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let fetchedArticles: Article[] = [];

      if (selectedCategory === 'all') {
        // Fetch all feeds in parallel
        const feeds = CATEGORY_FEEDS.filter(f => f.id !== 'all');
        const results = await Promise.all(
          feeds.map(feed => fetchFeed(feed.url, signal))
        );

        // Combine and sort by date
        fetchedArticles = results.flat().sort((a, b) => {
          return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
        });
      } else {
        // Fetch single category
        const feed = CATEGORY_FEEDS.find(f => f.id === selectedCategory);
        if (feed && feed.url) {
          fetchedArticles = await fetchFeed(feed.url, signal);
        }
      }

      // Cache the results
      articlesCacheRef.current[selectedCategory] = fetchedArticles;
      setArticles(fetchedArticles);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Error fetching articles:', err);
      setError('Failed to load articles. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, fetchFeed]);

  // Fetch articles when category changes
  useEffect(() => {
    fetchArticles();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchArticles]);

  // Reset to page 1 when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (count: number) => {
    localStorage.setItem('articles_items_per_page', count.toString());
    setItemsPerPage(count);
    setCurrentPage(1);
  };

  const handleImageError = (link: string) => {
    setImageErrors(prev => new Set(prev).add(link));
  };

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Paginate articles
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedArticles = articles.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(articles.length / itemsPerPage);

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

      {/* Main Content */}
      <main id="main-content" className="flex-1 lg:ml-64 min-w-0">
        {/* Header */}
        <header
          className="text-white shadow-lg pt-[57px] lg:pt-0"
          style={{
            background: 'linear-gradient(180deg, #0050A0 0%, #003A75 100%)',
            boxShadow: 'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
        >
          <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-5 sm:pb-6 md:pb-7 lg:pb-8">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">
              NFL Articles
            </h1>
            <p className="text-lg opacity-90 font-medium">
              Latest news and analysis from PFSN
            </p>
          </div>
        </header>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 h-[120px] flex items-center justify-center">
          <div className="raptive-pfn-header-90 w-full h-full"></div>
        </div>

        {/* Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Browse Articles</h2>

          {/* Category Tabs */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_FEEDS.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                    selectedCategory === category.id
                      ? 'bg-[#0050A0] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Articles Container */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Loading State */}
            {loading && (
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg overflow-hidden">
                      <SkeletonLoader className="w-full aspect-video" />
                      <div className="p-4">
                        <SkeletonLoader className="h-6 w-3/4 mb-2" />
                        <SkeletonLoader className="h-4 w-full mb-1" />
                        <SkeletonLoader className="h-4 w-5/6 mb-4" />
                        <div className="flex justify-between">
                          <SkeletonLoader className="h-3 w-20" />
                          <SkeletonLoader className="h-3 w-16" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="p-8 text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 inline-block">
                  <p className="text-red-700 mb-4">{error}</p>
                  <button
                    onClick={() => {
                      articlesCacheRef.current = {};
                      fetchArticles();
                    }}
                    className="px-4 py-2 bg-[#0050A0] text-white rounded-lg hover:bg-[#003A75] transition-colors cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Articles Grid */}
            {!loading && !error && (
              <>
                {articles.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No articles found for this category
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {paginatedArticles.map((article, index) => (
                        <a
                          key={`${article.link}-${index}`}
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-gray-100"
                        >
                          {/* Featured Image */}
                          {article.featuredImage && !imageErrors.has(article.link) ? (
                            <div className="w-full aspect-video overflow-hidden bg-gray-200">
                              <img
                                src={article.featuredImage}
                                alt={article.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={() => handleImageError(article.link)}
                              />
                            </div>
                          ) : (
                            <div className="w-full aspect-video bg-gradient-to-br from-[#0050A0] to-[#003A75] flex items-center justify-center">
                              <span className="text-white text-4xl font-bold opacity-30">PFN</span>
                            </div>
                          )}

                          {/* Article Content */}
                          <div className="p-4">
                            {/* Top row: Category + Date */}
                            <div className="flex items-center justify-between mb-2">
                              {article.category ? (
                                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                  {article.category}
                                </span>
                              ) : (
                                <span></span>
                              )}
                              <span className="text-xs text-gray-500">
                                {getRelativeTime(article.pubDate)}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold mb-2 line-clamp-2" style={{ color: '#0050A0' }}>
                              {article.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {article.description}
                            </p>
                            {/* Bottom row: Author + Read More */}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500 truncate max-w-[120px]">
                                {article.author && article.author !== 'PFSN' ? article.author : 'PFSN'}
                              </span>
                              <span className="font-medium flex-shrink-0" style={{ color: '#0050A0' }}>
                                Read More &rarr;
                              </span>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {articles.length > 0 && (
                  <div className="bg-gray-50 px-4 border-t border-gray-200">
                    <Pagination
                      totalItems={articles.length}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                      itemsPerPage={itemsPerPage}
                      onItemsPerPageChange={handleItemsPerPageChange}
                      storageKey="articles_items_per_page"
                      itemsPerPageOptions={[12, 24, 48]}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
