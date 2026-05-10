'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Restaurant { _id: string; name: string; placeId: string; address: string; overallRating: number; }
interface SentimentSplit { positive: number; neutral: number; negative: number; }
interface Metrics {
  averageRating: number; totalReviews: number; sentimentSplit: SentimentSplit;
  feedbackScore: number; topKeywords: { word: string; count: number }[];
  themeBreakdown: Record<string, number>; waitingTimeRisk: boolean;
  ratingTrend: { date: string; rating: number }[];
  sentimentTrend: { date: string; score: number }[];
  advocacyHighlights: { authorName: string; rating: number; text: string; themes: string[] }[];
  riskAlerts: { type: string; severity: string; message: string }[];
  ownerActions: string[];
  pricePerceptionSummary: Record<string, number>;
}
interface ReviewRow {
  id: string; authorName: string; authorPhoto: string; rating: number;
  text: string; relativeTime: string; sentiment: { label: string; score: number };
  themes: string[]; waitingTimeSignal: { sentiment: string; detected: boolean };
  priceSignal: { perception: string; detected: boolean };
}

// ── Helper components ─────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'blue' }: { label: string; value: string | number; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    blue: 'border-blue-500 bg-blue-50', green: 'border-green-500 bg-green-50',
    red: 'border-red-500 bg-red-50', yellow: 'border-yellow-500 bg-yellow-50',
    purple: 'border-purple-500 bg-purple-50',
  };
  return (
    <div className={`rounded-xl border-l-4 p-4 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-sm">
      {[1,2,3,4,5].map((s) => (
        <span key={s} className={s <= rating ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
    </span>
  );
}

function SentimentBadge({ label }: { label: string }) {
  const cls: Record<string, string> = {
    positive: 'bg-green-100 text-green-700', negative: 'bg-red-100 text-red-700', neutral: 'bg-gray-100 text-gray-600',
  };
  const icon: Record<string, string> = { positive: '😊', negative: '😞', neutral: '😐' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls[label] || cls.neutral}`}>{icon[label]} {label}</span>;
}

const PIE_COLORS = ['#22c55e', '#94a3b8', '#ef4444'];
const THEME_LABELS: Record<string, string> = {
  foodQuality: 'Food Quality', service: 'Service', ambience: 'Ambience',
  valueForMoney: 'Value', staffBehaviour: 'Staff', deliveryPickup: 'Delivery',
  waitingTime: 'Wait Time', cleanliness: 'Cleanliness',
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDash, setLoadingDash] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState<'overview' | 'reviews' | 'advocacy' | 'risks'>('overview');
  const [placeIdInput, setPlaceIdInput] = useState('');
  const [addingNew, setAddingNew] = useState(false);

  // Load restaurant list
  useEffect(() => {
    axios.get(`${API_URL}/api/admin/restaurants`)
      .then(({ data }) => {
        setRestaurants(data.restaurants || []);
        if (data.restaurants?.length) setSelected(data.restaurants[0]);
      })
      .finally(() => setLoadingList(false));
  }, []);

  // Load dashboard when restaurant selected
  const loadDashboard = useCallback(async (r: Restaurant) => {
    setLoadingDash(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/restaurants/${r._id}/reviewdashboard`);
      setMetrics(data.metrics);
      setReviews(data.latestReviews || []);
    } catch { /* empty */ }
    finally { setLoadingDash(false); }
  }, []);

  useEffect(() => { if (selected) loadDashboard(selected); }, [selected, loadDashboard]);

  // Sync + analyse new restaurant from Place ID
  const handleSync = async () => {
    if (!placeIdInput.trim()) return;
    setSyncing(true);
    try {
      await axios.get(`${API_URL}/api/reviews/${placeIdInput.trim()}`);
      await axios.post(`${API_URL}/api/reviews/analyse`, { placeId: placeIdInput.trim() });
      const { data } = await axios.get(`${API_URL}/api/admin/restaurants`);
      setRestaurants(data.restaurants || []);
      const found = data.restaurants?.find((r: Restaurant) => r.placeId === placeIdInput.trim());
      if (found) setSelected(found);
      setAddingNew(false);
      setPlaceIdInput('');
    } catch { /* TODO: show error toast */ }
    finally { setSyncing(false); }
  };

  const sentimentPieData = metrics
    ? [
        { name: 'Positive', value: metrics.sentimentSplit.positive },
        { name: 'Neutral', value: metrics.sentimentSplit.neutral },
        { name: 'Negative', value: metrics.sentimentSplit.negative },
      ]
    : [];

  const themeChartData = metrics
    ? Object.entries(metrics.themeBreakdown)
        .map(([k, v]) => ({ theme: THEME_LABELS[k] || k, count: v }))
        .sort((a, b) => b.count - a.count)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <nav className="bg-blue-800 text-white px-6 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-blue-200 text-sm hover:text-white">← Website</Link>
          <span className="text-blue-400">|</span>
          <span className="font-bold">Datumart Admin</span>
          <span className="bg-blue-600 text-xs px-2 py-0.5 rounded-full ml-1">Review Intelligence</span>
        </div>
        <button
          onClick={() => setAddingNew(true)}
          className="bg-white text-blue-800 text-sm px-4 py-1.5 rounded-full font-semibold hover:bg-blue-50 transition"
        >
          + Add Restaurant
        </button>
      </nav>

      {/* Add restaurant modal */}
      {addingNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add Restaurant via Google Place ID</h3>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. ChIJ0X31pIK3woAR5KwBnToO6S0"
              value={placeIdInput}
              onChange={(e) => setPlaceIdInput(e.target.value)}
            />
            <p className="text-xs text-gray-500 mb-4">
              Find your Place ID at{' '}
              <a href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                Google Place ID Finder →
              </a>
            </p>
            <div className="flex gap-3">
              <button onClick={handleSync} disabled={syncing || !placeIdInput} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition">
                {syncing ? 'Syncing…' : 'Fetch & Analyse'}
              </button>
              <button onClick={() => setAddingNew(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 p-4 hidden md:flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Restaurants</p>
          {loadingList ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : restaurants.length === 0 ? (
            <p className="text-sm text-gray-400">No restaurants yet.<br/>Click "+ Add Restaurant".</p>
          ) : (
            restaurants.map((r) => (
              <button
                key={r._id}
                onClick={() => setSelected(r)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition ${selected?._id === r._id ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <p className="font-medium truncate">{r.name}</p>
                <p className="text-xs text-gray-400 truncate">{r.address?.slice(0, 40)}</p>
              </button>
            ))
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          {!selected ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🍽</p>
              <p className="text-lg font-semibold">Select or add a restaurant to view its dashboard</p>
            </div>
          ) : (
            <>
              {/* Restaurant header */}
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{selected.name}</h1>
                  <p className="text-sm text-gray-500">{selected.address}</p>
                  <p className="text-xs text-gray-400 mt-1">Place ID: {selected.placeId}</p>
                </div>
                <button
                  onClick={() => loadDashboard(selected)}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  🔄 Refresh Dashboard
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-6 border-b border-gray-200">
                {(['overview', 'reviews', 'advocacy', 'risks'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-2 text-sm font-medium capitalize transition border-b-2 -mb-px ${tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    {t === 'overview' ? '📊 Overview' : t === 'reviews' ? '📝 Reviews' : t === 'advocacy' ? '🌟 Advocacy' : '⚠️ Risks'}
                  </button>
                ))}
              </div>

              {loadingDash ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="animate-spin text-4xl inline-block">⭐</div>
                  <p className="mt-3">Loading analytics…</p>
                </div>
              ) : !metrics ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center text-yellow-700">
                  <p className="font-semibold mb-2">No insights yet</p>
                  <p className="text-sm mb-4">Click the button below to fetch and analyse reviews for this restaurant.</p>
                  <button onClick={handleSync} disabled={syncing} className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg text-sm font-medium">
                    {syncing ? 'Analysing…' : '✨ Fetch & Analyse Reviews'}
                  </button>
                </div>
              ) : (
                <>
                  {/* ── OVERVIEW TAB ── */}
                  {tab === 'overview' && (
                    <div className="space-y-6">
                      {/* Summary cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Average Rating" value={`${metrics.averageRating} ⭐`} sub={`${metrics.totalReviews} reviews`} color="yellow" />
                        <StatCard label="Feedback Score" value={`${metrics.feedbackScore}%`} sub="Positive sentiment rate" color="green" />
                        <StatCard label="Positive Reviews" value={metrics.sentimentSplit.positive} sub={`${metrics.totalReviews - metrics.sentimentSplit.positive} not positive`} color="blue" />
                        <StatCard label="Negative Reviews" value={metrics.sentimentSplit.negative} sub="Needs attention" color="red" />
                      </div>

                      {/* Charts row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Rating trend */}
                        <div className="bg-white rounded-xl shadow-sm border p-4">
                          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Rating Trend</h3>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={metrics.ratingTrend}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Line type="monotone" dataKey="rating" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Sentiment pie */}
                        <div className="bg-white rounded-xl shadow-sm border p-4">
                          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Sentiment Distribution</h3>
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie data={sentimentPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                {sentimentPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Theme breakdown */}
                        <div className="bg-white rounded-xl shadow-sm border p-4">
                          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Review Themes</h3>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={themeChartData} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis type="number" tick={{ fontSize: 11 }} />
                              <YAxis dataKey="theme" type="category" width={90} tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Top keywords */}
                        <div className="bg-white rounded-xl shadow-sm border p-4">
                          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Top Keywords</h3>
                          <div className="flex flex-wrap gap-2">
                            {metrics.topKeywords.map(({ word, count }) => (
                              <span
                                key={word}
                                className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full font-medium"
                                style={{ fontSize: `${Math.min(14, 10 + count * 0.8)}px` }}
                              >
                                {word} ({count})
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── REVIEWS TAB ── */}
                  {tab === 'reviews' && (
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                            <tr>
                              <th className="px-4 py-3 text-left">Reviewer</th>
                              <th className="px-4 py-3 text-left">Rating</th>
                              <th className="px-4 py-3 text-left">Date</th>
                              <th className="px-4 py-3 text-left">Comment</th>
                              <th className="px-4 py-3 text-left">Sentiment</th>
                              <th className="px-4 py-3 text-left">Themes</th>
                              <th className="px-4 py-3 text-left">Wait</th>
                              <th className="px-4 py-3 text-left">Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {reviews.map((r) => (
                              <tr key={r.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <img src={r.authorPhoto} alt="" className="w-7 h-7 rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(r.authorName)}&background=random`; }} />
                                    <span className="font-medium text-gray-700 whitespace-nowrap">{r.authorName}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap"><StarRating rating={r.rating} /></td>
                                <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{r.relativeTime}</td>
                                <td className="px-4 py-3 text-gray-600 max-w-xs">
                                  <p className="line-clamp-2">{r.text}</p>
                                </td>
                                <td className="px-4 py-3"><SentimentBadge label={r.sentiment.label} /></td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1">
                                    {r.themes.slice(0, 2).map((t) => (
                                      <span key={t} className="bg-blue-50 text-blue-600 text-xs px-1.5 py-0.5 rounded capitalize">{THEME_LABELS[t] || t}</span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {r.waitingTimeSignal.detected ? (
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${r.waitingTimeSignal.sentiment === 'negative' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                      {r.waitingTimeSignal.sentiment}
                                    </span>
                                  ) : <span className="text-gray-300 text-xs">—</span>}
                                </td>
                                <td className="px-4 py-3">
                                  {r.priceSignal.detected ? (
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${r.priceSignal.perception === 'expensive' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                      {r.priceSignal.perception}
                                    </span>
                                  ) : <span className="text-gray-300 text-xs">—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── ADVOCACY TAB ── */}
                  {tab === 'advocacy' && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-1">Brand Advocacy Panel</h2>
                        <p className="text-blue-100 text-sm">Use these star reviews in banners, social posts, and marketing campaigns.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {metrics.advocacyHighlights.map((h, i) => (
                          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="text-3xl mb-3">"</div>
                            <p className="text-gray-600 text-sm italic leading-relaxed mb-4">{h.text.slice(0, 160)}…</p>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                                {h.authorName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-700">{h.authorName}</p>
                                <div className="flex">{[1,2,3,4,5].map((s) => <span key={s} className={s <= h.rating ? 'text-amber-400 text-xs' : 'text-gray-200 text-xs'}>★</span>)}</div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-3">
                              {h.themes.map((t) => <span key={t} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{THEME_LABELS[t] || t}</span>)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Owner actions */}
                      <div className="bg-white rounded-xl border shadow-sm p-5">
                        <h3 className="font-bold text-gray-800 mb-4">📋 Recommended Owner Actions</h3>
                        <ul className="space-y-3">
                          {metrics.ownerActions.map((action, i) => (
                            <li key={i} className="flex gap-3 items-start">
                              <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                              <p className="text-sm text-gray-700">{action}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* ── RISKS TAB ── */}
                  {tab === 'risks' && (
                    <div className="space-y-5">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                        <h2 className="font-bold text-red-800 mb-1">⚠️ Risk & Issue Panel</h2>
                        <p className="text-red-600 text-sm">Issues detected from customer review patterns that require attention.</p>
                      </div>

                      {metrics.riskAlerts.length === 0 ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center text-green-700">
                          <p className="text-2xl mb-2">✅</p>
                          <p className="font-semibold">No major risks detected. Your restaurant is performing well!</p>
                        </div>
                      ) : (
                        metrics.riskAlerts.map((alert, i) => (
                          <div key={i} className={`rounded-xl border p-4 ${alert.severity === 'high' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                            <div className="flex items-start gap-3">
                              <span className="text-xl">{alert.severity === 'high' ? '🔴' : '🟡'}</span>
                              <div>
                                <p className={`font-semibold text-sm ${alert.severity === 'high' ? 'text-red-800' : 'text-yellow-800'}`}>
                                  {alert.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} — {alert.severity.toUpperCase()} Priority
                                </p>
                                <p className={`text-sm mt-1 ${alert.severity === 'high' ? 'text-red-700' : 'text-yellow-700'}`}>{alert.message}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}

                      {/* Wait time detail */}
                      <div className="bg-white rounded-xl border shadow-sm p-5">
                        <h3 className="font-bold text-gray-700 mb-3 text-sm">⏱ Waiting Time Sentiment</h3>
                        <div className="flex gap-4 flex-wrap">
                          {['positive', 'negative', 'neutral', 'not_detected'].map((s) => {
                            const cnt = reviews.filter((r) => r.waitingTimeSignal.sentiment === s).length;
                            return (
                              <div key={s} className="text-center">
                                <p className="text-2xl font-bold text-gray-800">{cnt}</p>
                                <p className="text-xs text-gray-500 capitalize">{s.replace('_', ' ')}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Price perception detail */}
                      <div className="bg-white rounded-xl border shadow-sm p-5">
                        <h3 className="font-bold text-gray-700 mb-3 text-sm">💰 Price Perception Breakdown</h3>
                        <div className="flex gap-4 flex-wrap">
                          {Object.entries(metrics.pricePerceptionSummary).map(([label, count]) => (
                            <div key={label} className="text-center">
                              <p className="text-2xl font-bold text-gray-800">{count}</p>
                              <p className="text-xs text-gray-500 capitalize">{label.replace('_', ' ')}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
