const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const ReviewInsight = require('../models/ReviewInsight');
const { generateDashboardMetrics } = require('../services/nlpInsights.service');

/**
 * GET /api/admin/restaurants
 * List all restaurants
 */
router.get('/restaurants', async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    return res.json({ restaurants });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/restaurants/:id/reviewdashboard
 * Full dashboard metrics for a restaurant
 */
router.get('/restaurants/:id/reviewdashboard', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const insights = await ReviewInsight.find({ restaurantId: restaurant._id })
      .sort({ 'rawReview.time': -1 })
      .limit(50);

    if (!insights.length) {
      return res.json({
        restaurant,
        metrics: null,
        latestReviews: [],
        message: 'No insights found. Run POST /api/reviews/analyse first.',
      });
    }

    const metrics = generateDashboardMetrics(insights);

    const latestReviews = insights.slice(0, 10).map((i) => ({
      id: i._id,
      authorName: i.rawReview.authorName,
      authorPhoto: i.rawReview.authorPhoto,
      rating: i.rating,
      text: i.rawReview.text,
      relativeTime: i.rawReview.relativeTimeDescription,
      time: i.rawReview.time,
      sentiment: i.sentiment,
      themes: Object.keys(i.themes || {}).filter((k) => i.themes[k]),
      waitingTimeSignal: i.waitingTimeSignal,
      priceSignal: i.priceSignal,
      keywords: i.keywords,
      recommendations: i.recommendations,
    }));

    return res.json({ restaurant, metrics, latestReviews });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/restaurants/:id/insights
 * Raw insights for a restaurant
 */
router.get('/restaurants/:id/insights', async (req, res) => {
  try {
    const insights = await ReviewInsight.find({ restaurantId: req.params.id })
      .sort({ 'rawReview.time': -1 })
      .limit(20);
    return res.json({ insights });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
