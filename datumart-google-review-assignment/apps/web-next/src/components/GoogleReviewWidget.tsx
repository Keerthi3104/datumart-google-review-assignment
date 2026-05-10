'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Review {
  authorName: string;
  authorPhoto: string;
  rating: number;
  text: string;
  relativeTimeDescription: string;
  time: number;
}

interface RestaurantInfo {
  name: string;
  placeId: string;
  address: string;
  overallRating: number;
  totalReviewsCount: number;
}

interface Props {
  placeId: string;
  restaurantName?: string;
  maxVisible?: number;
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm';
  return (
    <span className={`inline-flex gap-0.5 ${sz}`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? 'star-filled' : 'star-empty'}>★</span>
      ))}
    </span>
  );
}

function SentimentBadge({ label }: { label: string }) {
  const colors: Record<string, string> = {
    positive: 'bg-green-100 text-green-700',
    negative: 'bg-red-100 text-red-700',
    neutral: 'bg-gray-100 text-gray-600',
  };
  const icons: Record<string, string> = { positive: '😊', negative: '😞', neutral: '😐' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[label] || colors.neutral}`}>
      {icons[label]} {label}
    </span>
  );
}

export default function GoogleReviewWidget({ placeId, restaurantName, maxVisible = 6 }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [insights, setInsights] = useState<Record<string, { sentiment: { label: string }; themes: string[] }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysing, setAnalysing] = useState(false);
  const [analysed, setAnalysed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [isMock, setIsMock] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!placeId) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${API_URL}/api/reviews/${placeId}`);
      setReviews(data.reviews || []);
      setRestaurant(data.restaurant || null);
      setIsMock(data.isMock);
    } catch {
      setError('Could not load reviews. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  const analyseReviews = async () => {
    setAnalysing(true);
    try {
      await axios.post(`${API_URL}/api/reviews/analyse`, { placeId });
      // Fetch the resulting insights
      if (restaurant?.id) {
        const { data } = await axios.get(`${API_URL}/api/admin/restaurants/${restaurant.id}/reviewdashboard`);
        const map: Record<string, { sentiment: { label: string }; themes: string[] }> = {};
        (data.latestReviews || []).forEach((r: { authorName: string; sentiment: { label: string }; themes: string[] }) => {
          map[r.authorName] = { sentiment: r.sentiment, themes: r.themes };
        });
        setInsights(map);
        setAnalysed(true);
      }
    } catch {
      // Silently fail — insights are optional in widget mode
    } finally {
      setAnalysing(false);
    }
  };

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const visible = showAll ? reviews : reviews.slice(0, maxVisible);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center text-gray-500">
        <div className="inline-block animate-spin text-4xl">⭐</div>
        <p className="mt-3">Loading reviews…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <p className="font-semibold mb-2">⚠️ {error}</p>
          <button onClick={fetchReviews} className="text-sm underline">Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          What Our Customers Say
        </h2>
        {restaurant && (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <StarRating rating={Math.round(restaurant.overallRating)} size="md" />
            <span className="text-lg font-bold text-gray-700">{restaurant.overallRating}</span>
            <span className="text-gray-500 text-sm">({restaurant.totalReviewsCount} reviews)</span>
            {isMock && (
              <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
                Demo Data
              </span>
            )}
          </div>
        )}
        {!analysed && (
          <button
            onClick={analyseReviews}
            disabled={analysing}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-full font-medium transition disabled:opacity-60"
          >
            {analysing ? '🔍 Analysing…' : '✨ Run NLP Analysis'}
          </button>
        )}
        {analysed && (
          <p className="mt-3 text-green-600 text-sm font-medium">✅ NLP insights loaded — see sentiment badges below</p>
        )}
      </div>

      {/* Review Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((review, idx) => {
          const insight = insights[review.authorName];
          return (
            <div
              key={`${review.authorName}-${review.time}`}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 animate-fadeInUp hover:shadow-md transition"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={review.authorPhoto}
                  alt={review.authorName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.authorName)}&background=random`;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{review.authorName}</p>
                  <p className="text-gray-400 text-xs">{review.relativeTimeDescription}</p>
                </div>
              </div>

              {/* Stars + sentiment */}
              <div className="flex items-center justify-between">
                <StarRating rating={review.rating} />
                {insight && <SentimentBadge label={insight.sentiment.label} />}
              </div>

              {/* Review text */}
              <p className="text-gray-600 text-sm leading-relaxed flex-1 line-clamp-4">
                {review.text || <em className="text-gray-400">No comment provided.</em>}
              </p>

              {/* Themes */}
              {insight?.themes?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {insight.themes.slice(0, 3).map((t) => (
                    <span key={t} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full capitalize">
                      {t.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Google G badge */}
              <div className="flex items-center gap-1 pt-1 border-t border-gray-50">
                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-xs text-gray-400">Google Review</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more */}
      {reviews.length > maxVisible && (
        <div className="text-center mt-8">
          <button
            onClick={() => setShowAll(!showAll)}
            className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-full font-medium text-sm transition"
          >
            {showAll ? '← Show Less' : `View All ${reviews.length} Reviews →`}
          </button>
        </div>
      )}

      {/* Powered by */}
      <p className="text-center text-xs text-gray-400 mt-8">
        Review insights powered by <span className="font-semibold text-gray-500">Datumart NLP Engine</span>
      </p>
    </div>
  );
}
