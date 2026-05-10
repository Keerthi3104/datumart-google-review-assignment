const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  placeId: { type: String, required: true, unique: true },
  address: { type: String, default: '' },
  websiteSlug: { type: String, default: '' },
  businessType: { type: String, default: 'restaurant' },
  phone: { type: String, default: '' },
  website: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  overallRating: { type: Number, default: 0 },
  totalReviewsCount: { type: Number, default: 0 },
  lastSyncedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
