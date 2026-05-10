const mongoose = require('mongoose');

const reviewInsightSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  placeId: { type: String, required: true },
  rawReview: {
    authorName: String,
    authorPhoto: String,
    rating: Number,
    text: String,
    time: Number,
    relativeTimeDescription: String,
    language: String,
  },
  rating: { type: Number, required: true },
  sentiment: {
    score: Number,          // -1 to 1
    label: { type: String, enum: ['positive', 'neutral', 'negative'] },
    magnitude: Number,
    comparative: Number,
  },
  themes: {
    foodQuality: Boolean,
    service: Boolean,
    ambience: Boolean,
    valueForMoney: Boolean,
    staffBehaviour: Boolean,
    deliveryPickup: Boolean,
    waitingTime: Boolean,
    cleanliness: Boolean,
  },
  waitingTimeSignal: {
    detected: Boolean,
    sentiment: { type: String, enum: ['positive', 'negative', 'neutral', 'not_detected'] },
    phrases: [String],
    inferred: Boolean,
  },
  priceSignal: {
    detected: Boolean,
    perception: { type: String, enum: ['affordable', 'expensive', 'value', 'overpriced', 'neutral', 'not_detected'] },
    phrases: [String],
    inferred: Boolean,
  },
  keywords: [String],
  recommendations: [String],
  analysedAt: { type: Date, default: Date.now },
});

reviewInsightSchema.index({ restaurantId: 1, 'rawReview.time': -1 });
reviewInsightSchema.index({ placeId: 1 });

module.exports = mongoose.model('ReviewInsight', reviewInsightSchema);
