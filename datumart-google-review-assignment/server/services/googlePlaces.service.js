const axios = require('axios');

// Mock data for development / when API billing not enabled
const MOCK_REVIEWS = [
  {
    authorName: 'Priya Sharma',
    authorPhoto: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=random',
    rating: 5,
    text: 'Absolutely fantastic food! The biryani was perfectly spiced and the service was incredibly fast. Our table was ready within 5 minutes. Worth every rupee — definitely good value for the price. Will come back again!',
    time: Math.floor(Date.now() / 1000) - 86400,
    relativeTimeDescription: '1 day ago',
    language: 'en',
  },
  {
    authorName: 'Rahul Krishnamurthy',
    authorPhoto: 'https://ui-avatars.com/api/?name=Rahul+K&background=random',
    rating: 4,
    text: 'Great ambience and really good food quality. The staff were polite and attentive. Waited about 20 minutes for our main course though, which was a little long. Prices are reasonable for the quality you get.',
    time: Math.floor(Date.now() / 1000) - 172800,
    relativeTimeDescription: '2 days ago',
    language: 'en',
  },
  {
    authorName: 'Ananya Iyer',
    authorPhoto: 'https://ui-avatars.com/api/?name=Ananya+Iyer&background=random',
    rating: 2,
    text: 'Very disappointed. Long wait time of almost 45 minutes for a simple order. The food was okay but overpriced for the portions. Staff seemed overwhelmed and not very helpful. Will not return.',
    time: Math.floor(Date.now() / 1000) - 259200,
    relativeTimeDescription: '3 days ago',
    language: 'en',
  },
  {
    authorName: 'Vikram Patel',
    authorPhoto: 'https://ui-avatars.com/api/?name=Vikram+Patel&background=random',
    rating: 5,
    text: 'One of the best restaurants I have visited in Chennai! Quick service, amazing food quality, and the staff were super friendly. The ambience is cosy and clean. Prices are very affordable. Highly recommend!',
    time: Math.floor(Date.now() / 1000) - 345600,
    relativeTimeDescription: '4 days ago',
    language: 'en',
  },
  {
    authorName: 'Meera Nair',
    authorPhoto: 'https://ui-avatars.com/api/?name=Meera+Nair&background=random',
    rating: 3,
    text: 'Decent place, nothing extraordinary. Food was average. The slow table service was a bit annoying. The price was fair. Ambience is nice but could be cleaner.',
    time: Math.floor(Date.now() / 1000) - 432000,
    relativeTimeDescription: '5 days ago',
    language: 'en',
  },
  {
    authorName: 'Karthik Subramaniam',
    authorPhoto: 'https://ui-avatars.com/api/?name=Karthik+S&background=random',
    rating: 5,
    text: 'Superb experience! The delivery was quick and food arrived hot. Everything was fresh and tasty. Great value for money — I ordered the family meal and it was worth it. The staff on call were very professional.',
    time: Math.floor(Date.now() / 1000) - 518400,
    relativeTimeDescription: '6 days ago',
    language: 'en',
  },
  {
    authorName: 'Deepa Rajendran',
    authorPhoto: 'https://ui-avatars.com/api/?name=Deepa+R&background=random',
    rating: 4,
    text: 'Good food and nice atmosphere. The waiting time was acceptable — about 15 minutes. Staff were courteous. Slightly expensive but the quality justifies it. The ambience makes it perfect for a family dinner.',
    time: Math.floor(Date.now() / 1000) - 604800,
    relativeTimeDescription: '1 week ago',
    language: 'en',
  },
  {
    authorName: 'Suresh Babu',
    authorPhoto: 'https://ui-avatars.com/api/?name=Suresh+Babu&background=random',
    rating: 1,
    text: 'Terrible experience. Delayed order for over an hour. When it finally arrived, the food was cold and not fresh. The staff were rude when we complained. Extremely expensive for such poor quality. Never coming back.',
    time: Math.floor(Date.now() / 1000) - 691200,
    relativeTimeDescription: '1 week ago',
    language: 'en',
  },
  {
    authorName: 'Lavanya Chandrasekaran',
    authorPhoto: 'https://ui-avatars.com/api/?name=Lavanya+C&background=random',
    rating: 4,
    text: 'Really enjoyed the food here. The service was quick and efficient. Love the clean and fresh environment. Prices are very much worth it. The staff recommended some great dishes off the menu which was a nice touch.',
    time: Math.floor(Date.now() / 1000) - 777600,
    relativeTimeDescription: '1 week ago',
    language: 'en',
  },
  {
    authorName: 'Arun Selvam',
    authorPhoto: 'https://ui-avatars.com/api/?name=Arun+Selvam&background=random',
    rating: 3,
    text: 'Average experience overall. Food was decent but nothing special. Service was slow and we had to ask multiple times for our order. Price was okay. The ambience could use some improvement — it was quite noisy.',
    time: Math.floor(Date.now() / 1000) - 864000,
    relativeTimeDescription: '10 days ago',
    language: 'en',
  },
];

/**
 * Fetch reviews from Google Places API or fall back to mock data
 */
async function fetchGoogleReviews(placeId) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  // If no API key or explicitly using mock mode
  if (!apiKey || apiKey === 'YOUR_GOOGLE_PLACES_API_KEY' || process.env.USE_MOCK_DATA === 'true') {
    console.log('📦 Using mock review data (set GOOGLE_PLACES_API_KEY to use live data)');
    return {
      reviews: MOCK_REVIEWS,
      placeDetails: {
        name: 'Sample Restaurant Chennai',
        address: '123 Anna Salai, Chennai, Tamil Nadu 600002',
        rating: 3.8,
        totalRatings: 10,
        phone: '+91 44 1234 5678',
        website: 'https://samplerestaurant.in',
      },
      isMock: true,
    };
  }

  try {
    // Step 1: Get place details including reviews
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json`;
    const response = await axios.get(detailsUrl, {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,rating,user_ratings_total,formatted_phone_number,website,reviews,photos',
        key: apiKey,
        language: 'en',
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message || ''}`);
    }

    const result = response.data.result;
    const reviews = (result.reviews || []).slice(0, 10).map((r) => ({
      authorName: r.author_name,
      authorPhoto: r.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.author_name)}&background=random`,
      rating: r.rating,
      text: r.text,
      time: r.time,
      relativeTimeDescription: r.relative_time_description,
      language: r.language,
    }));

    return {
      reviews,
      placeDetails: {
        name: result.name,
        address: result.formatted_address,
        rating: result.rating,
        totalRatings: result.user_ratings_total,
        phone: result.formatted_phone_number || '',
        website: result.website || '',
        photoUrl: result.photos?.length
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${result.photos[0].photo_reference}&key=${apiKey}`
          : '',
      },
      isMock: false,
    };
  } catch (error) {
    console.error('Google Places API error, falling back to mock:', error.message);
    return {
      reviews: MOCK_REVIEWS,
      placeDetails: {
        name: 'Sample Restaurant (Mock Fallback)',
        address: '123 Sample Street, Chennai',
        rating: 3.8,
        totalRatings: 10,
        phone: '',
        website: '',
      },
      isMock: true,
    };
  }
}

module.exports = { fetchGoogleReviews };
