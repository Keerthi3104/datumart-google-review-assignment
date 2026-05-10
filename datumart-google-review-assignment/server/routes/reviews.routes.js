const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');

const { fetchGoogleReviews } = require('../services/googlePlaces.service');
const { analyseReview } = require('../services/nlpInsights.service');
const Restaurant = require('../models/Restaurant');
const ReviewInsight = require('../models/ReviewInsight');

// Cache for 10 minutes to avoid excess API calls
const reviewCache = new NodeCache({ stdTTL: 600 });

/**
 * GET /api/reviews/:placeId
 * Fetch latest 10 reviews, cache them, return raw + insight summary
 */
router.get('/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    const cacheKey = `reviews_${placeId}`;

    // Check in-memory cache first
    const cached = reviewCache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    // Fetch from Google / mock
    const { reviews, placeDetails, isMock } = await fetchGoogleReviews(placeId);

    // Upsert restaurant
    let restaurant = await Restaurant.findOneAndUpdate(
      { placeId },
      {
        placeId,
        name: placeDetails.name,
        address: placeDetails.address,
        overallRating: placeDetails.rating,
        totalReviewsCount: placeDetails.totalRatings,
        phone: placeDetails.phone,
        website: placeDetails.website,
        photoUrl: placeDetails.photoUrl || '',
        lastSyncedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    const response = {
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        placeId: restaurant.placeId,
        address: restaurant.address,
        overallRating: restaurant.overallRating,
        totalReviewsCount: restaurant.totalReviewsCount,
      },
      reviews: reviews.slice(0, 10),
      isMock,
      fetchedAt: new Date().toISOString(),
    };

    reviewCache.set(cacheKey, response);
    return res.json({ ...response, fromCache: false });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return res.status(500).json({ error: 'Failed to fetch reviews', details: err.message });
  }
});

/**
 * POST /api/reviews/analyse
 * Run NLP on reviews and persist insights
 * Body: { placeId }
 */
router.post('/analyse', async (req, res) => {
  try {
    const { placeId } = req.body;
    if (!placeId) return res.status(400).json({ error: 'placeId is required' });

    const restaurant = await Restaurant.findOne({ placeId });
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found. Fetch reviews first via GET /api/reviews/:placeId' });
    }

    const { reviews } = await fetchGoogleReviews(placeId);
    const insights = [];

    for (const review of reviews.slice(0, 10)) {
      const nlp = analyseReview(review);

      const insight = await ReviewInsight.findOneAndUpdate(
        { placeId, 'rawReview.time': review.time, 'rawReview.authorName': review.authorName },
        {
          restaurantId: restaurant._id,
          placeId,
          rawReview: review,
          rating: review.rating,
          ...nlp,
          analysedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      insights.push(insight);
    }

    return res.json({
      message: `Analysed ${insights.length} reviews successfully`,
      restaurantId: restaurant._id,
      insightsCount: insights.length,
    });
  } catch (err) {
    console.error('Error analysing reviews:', err);
    return res.status(500).json({ error: 'NLP analysis failed', details: err.message });
  }
});

module.exports = router;
