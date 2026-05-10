'use client';
import { useState } from 'react';
import GoogleReviewWidget from '@/components/GoogleReviewWidget';
import Link from 'next/link';

const DEFAULT_PLACE_ID = process.env.NEXT_PUBLIC_DEFAULT_PLACE_ID || 'DEMO_PLACE_ID';

export default function HomePage() {
  const [placeId, setPlaceId] = useState(DEFAULT_PLACE_ID);
  const [inputId, setInputId] = useState(DEFAULT_PLACE_ID);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero / Nav */}
      <nav className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tracking-tight">🍽 TastyBites</span>
          <span className="text-blue-200 text-sm hidden md:block">Powered by Datumart</span>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/admin/reviews" className="bg-white text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-blue-50 transition">
            Admin Dashboard →
          </Link>
        </div>
      </nav>

      {/* Restaurant Hero */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white py-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Authentic South Indian Cuisine</h1>
        <p className="text-blue-100 text-lg max-w-xl mx-auto mb-6">
          Award-winning flavours crafted with heritage recipes. Trusted by thousands of happy diners in Chennai.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <span className="bg-white/10 border border-white/20 px-4 py-2 rounded-full text-sm">📍 Anna Salai, Chennai</span>
          <span className="bg-white/10 border border-white/20 px-4 py-2 rounded-full text-sm">⏰ Open 11am – 11pm</span>
          <span className="bg-white/10 border border-white/20 px-4 py-2 rounded-full text-sm">📞 +91 44 1234 5678</span>
        </div>
      </section>

      {/* Place ID switcher for demo */}
      <section className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-yellow-800 uppercase tracking-wide">Demo Mode – Place ID:</span>
          <input
            className="border border-yellow-300 rounded px-3 py-1 text-sm flex-1 max-w-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            placeholder="Enter Google Place ID"
          />
          <button
            onClick={() => setPlaceId(inputId)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1 rounded text-sm font-medium transition"
          >
            Load Reviews
          </button>
          <a
            href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-700 text-xs underline"
          >
            Find Place ID →
          </a>
        </div>
      </section>

      {/* Menu highlights */}
      <section className="py-12 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">Our Specialities</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { emoji: '🍛', name: 'Chettinad Biryani', price: '₹320' },
            { emoji: '🥘', name: 'Prawn Masala', price: '₹480' },
            { emoji: '🫓', name: 'Ghee Pongal', price: '₹120' },
            { emoji: '🍮', name: 'Filter Coffee', price: '₹50' },
          ].map((item) => (
            <div key={item.name} className="bg-white rounded-xl shadow p-4 text-center border border-gray-100 hover:shadow-md transition">
              <div className="text-4xl mb-2">{item.emoji}</div>
              <div className="font-semibold text-sm text-gray-800">{item.name}</div>
              <div className="text-blue-600 font-bold mt-1">{item.price}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Google Review Widget ── */}
      <section className="py-8 px-4 bg-gray-50">
        <GoogleReviewWidget placeId={placeId} restaurantName="TastyBites" />
      </section>

      <footer className="bg-gray-800 text-gray-400 text-center py-6 text-sm">
        © 2025 TastyBites · Review intelligence powered by{' '}
        <span className="text-white font-semibold">Datumart</span>
      </footer>
    </main>
  );
}
