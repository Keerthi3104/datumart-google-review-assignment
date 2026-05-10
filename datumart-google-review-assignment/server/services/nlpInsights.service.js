const Sentiment = require('sentiment');
const natural = require('natural');

const sentimentAnalyzer = new Sentiment();
const tokenizer = new natural.WordTokenizer();

// ─── Keyword dictionaries ────────────────────────────────────────────────────

const WAIT_TIME_NEGATIVE = [
  'long wait', 'waited long', 'slow service', 'slow table service',
  'delayed order', 'too slow', 'took forever', 'waited ages',
  'waiting too long', 'very slow', 'extremely slow', 'hour wait',
  '45 minutes', 'slow kitchen', 'forever to arrive',
];
const WAIT_TIME_POSITIVE = [
  'quick service', 'fast service', 'no wait', 'served quickly',
  'prompt service', 'arrived quickly', 'fast delivery', 'no waiting',
  'very fast', 'super quick', 'speedy service', 'quick table',
];

const PRICE_AFFORDABLE = [
  'affordable', 'cheap', 'budget friendly', 'value for money',
  'worth it', 'good value', 'great value', 'reasonable price',
  'reasonably priced', 'pocket friendly', 'great deal', 'well priced',
];
const PRICE_EXPENSIVE = [
  'expensive', 'overpriced', 'too expensive', 'pricey', 'costly',
  'not worth the price', 'not worth the money', 'high price',
  'very expensive', 'too costly', 'rip off', 'not value for money',
];

const THEME_KEYWORDS = {
  foodQuality: ['food', 'dish', 'meal', 'taste', 'flavour', 'flavor', 'fresh', 'cooked', 'spicy', 'biryani', 'menu', 'cuisine', 'ingredient', 'delicious', 'tasty'],
  service: ['service', 'staff', 'waiter', 'server', 'served', 'attentive', 'helpful', 'courteous', 'efficient', 'professional'],
  ambience: ['ambience', 'atmosphere', 'decor', 'environment', 'vibe', 'cosy', 'cozy', 'comfortable', 'noisy', 'clean', 'dirty'],
  valueForMoney: ['value', 'worth', 'price', 'affordable', 'expensive', 'money', 'cost', 'cheap', 'overpriced', 'reasonable'],
  staffBehaviour: ['staff', 'rude', 'friendly', 'polite', 'helpful', 'courteous', 'professional', 'impolite', 'attentive', 'responsive'],
  deliveryPickup: ['delivery', 'pickup', 'take away', 'takeaway', 'order online', 'delivered', 'arrived'],
  waitingTime: ['wait', 'waiting', 'slow', 'quick', 'fast', 'delayed', 'prompt', 'speedy', 'minutes', 'hour'],
  cleanliness: ['clean', 'dirty', 'hygiene', 'hygienic', 'fresh', 'spotless', 'tidy', 'messy'],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function containsAny(text, phrases) {
  const lower = text.toLowerCase();
  return phrases.filter((p) => lower.includes(p.toLowerCase()));
}

function detectThemes(text) {
  const lower = text.toLowerCase();
  const themes = {};
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    themes[theme] = keywords.some((k) => lower.includes(k));
  }
  return themes;
}

function detectWaitingTime(text) {
  const negPhrases = containsAny(text, WAIT_TIME_NEGATIVE);
  const posPhrases = containsAny(text, WAIT_TIME_POSITIVE);

  if (negPhrases.length > 0) {
    return { detected: true, sentiment: 'negative', phrases: negPhrases, inferred: false };
  }
  if (posPhrases.length > 0) {
    return { detected: true, sentiment: 'positive', phrases: posPhrases, inferred: false };
  }

  // Infer from sentiment if service theme detected
  const lower = text.toLowerCase();
  if (lower.includes('service') || lower.includes('wait')) {
    return { detected: true, sentiment: 'neutral', phrases: [], inferred: true };
  }

  return { detected: false, sentiment: 'not_detected', phrases: [], inferred: false };
}

function detectPriceSignal(text) {
  const affPhrases = containsAny(text, PRICE_AFFORDABLE);
  const expPhrases = containsAny(text, PRICE_EXPENSIVE);

  if (expPhrases.length > 0) {
    return { detected: true, perception: 'expensive', phrases: expPhrases, inferred: false };
  }
  if (affPhrases.length >= 2) {
    return { detected: true, perception: 'value', phrases: affPhrases, inferred: false };
  }
  if (affPhrases.length === 1) {
    return { detected: true, perception: 'affordable', phrases: affPhrases, inferred: false };
  }

  // Infer from overall sentiment
  const lower = text.toLowerCase();
  if (lower.includes('price') || lower.includes('cost') || lower.includes('money')) {
    return { detected: true, perception: 'neutral', phrases: [], inferred: true };
  }

  return { detected: false, perception: 'not_detected', phrases: [], inferred: false };
}

function extractKeywords(text) {
  const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'is', 'was', 'are', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'it', 'its', 'this', 'that', 'these', 'those',
    'i', 'we', 'you', 'he', 'she', 'they', 'my', 'our', 'your', 'their',
    'very', 'really', 'quite', 'just', 'so', 'too', 'also', 'even',
    'not', 'no', 'never', 'always', 'when', 'where', 'which', 'who',
  ]);

  return [...new Set(tokens.filter((t) => t.length > 3 && !stopWords.has(t)))].slice(0, 15);
}

function generateRecommendations(sentimentLabel, themes, waitSignal, priceSignal, rating) {
  const recs = [];

  // Rating-based
  if (rating >= 4) {
    recs.push('Leverage this positive review in social media marketing and website testimonials.');
  }
  if (rating <= 2) {
    recs.push('Address negative feedback promptly with a personalised owner response to recover reputation.');
  }

  // Theme-based
  if (themes.foodQuality && sentimentLabel === 'positive') {
    recs.push('Highlight signature dishes mentioned in positive reviews in promotional banners and menus.');
  }
  if (themes.foodQuality && sentimentLabel === 'negative') {
    recs.push('Review food preparation standards and conduct a quality audit with kitchen team.');
  }
  if (themes.service && sentimentLabel === 'negative') {
    recs.push('Schedule customer service training for front-of-house staff to improve guest experience.');
  }
  if (themes.ambience && sentimentLabel === 'positive') {
    recs.push('Use ambience-related compliments in Instagram posts and Google Business photos.');
  }
  if (themes.waitingTime && waitSignal.sentiment === 'negative') {
    recs.push('Review kitchen workflow and staffing levels during peak hours to reduce waiting time.');
  }
  if (waitSignal.sentiment === 'positive') {
    recs.push('Promote quick service as a key differentiator in marketing materials.');
  }
  if (priceSignal.perception === 'expensive' || priceSignal.perception === 'overpriced') {
    recs.push('Introduce value meals or combo deals to address price perception among budget-conscious diners.');
  }
  if (priceSignal.perception === 'value' || priceSignal.perception === 'affordable') {
    recs.push('Emphasise value-for-money messaging in ads targeting price-sensitive customer segments.');
  }
  if (themes.staffBehaviour && sentimentLabel === 'positive') {
    recs.push('Recognise and reward staff members mentioned positively to reinforce great service culture.');
  }
  if (themes.deliveryPickup && sentimentLabel === 'positive') {
    recs.push('Promote fast delivery as a key USP on Swiggy, Zomato, and the restaurant website.');
  }

  // Ensure at least 3 recommendations
  const fallbacks = [
    'Respond to this review publicly to demonstrate active community engagement.',
    'Use review data to plan monthly specials that address customer preferences.',
    'Set up a review monitoring alert to catch and respond to new reviews within 24 hours.',
    'Create a customer loyalty programme to convert one-time visitors into regulars.',
    'Add more photos to Google Business Profile based on items frequently mentioned in reviews.',
  ];

  let i = 0;
  while (recs.length < 3 && i < fallbacks.length) {
    if (!recs.includes(fallbacks[i])) recs.push(fallbacks[i]);
    i++;
  }

  return recs.slice(0, 4);
}

// ─── Main analyser ────────────────────────────────────────────────────────────

/**
 * Analyse a single review and return structured NLP insights
 */
function analyseReview(review) {
  const text = review.text || '';

  // Sentiment analysis using 'sentiment' package
  const sentResult = sentimentAnalyzer.analyze(text);
  const score = sentResult.comparative; // normalised -5 to +5 approx

  let label;
  if (score >= 0.5) label = 'positive';
  else if (score <= -0.5) label = 'negative';
  else label = 'neutral';

  // Override label with rating as a strong signal
  if (review.rating >= 4 && label === 'negative') label = 'neutral';
  if (review.rating <= 2 && label === 'positive') label = 'neutral';
  if (review.rating === 5) label = 'positive';
  if (review.rating === 1) label = 'negative';

  const sentiment = {
    score: parseFloat(score.toFixed(3)),
    label,
    magnitude: Math.abs(sentResult.score),
    comparative: sentResult.comparative,
  };

  const themes = detectThemes(text);
  const waitingTimeSignal = detectWaitingTime(text);
  const priceSignal = detectPriceSignal(text);
  const keywords = extractKeywords(text);
  const recommendations = generateRecommendations(label, themes, waitingTimeSignal, priceSignal, review.rating);

  return {
    sentiment,
    themes,
    waitingTimeSignal,
    priceSignal,
    keywords,
    recommendations,
  };
}

/**
 * Generate aggregate dashboard metrics from an array of insights
 */
function generateDashboardMetrics(insights) {
  if (!insights.length) {
    return {
      averageRating: 0,
      totalReviews: 0,
      sentimentSplit: { positive: 0, neutral: 0, negative: 0 },
      feedbackScore: 0,
      topKeywords: [],
      themeBreakdown: {},
      waitingTimeRisk: false,
      pricePerceptionSummary: {},
      ratingTrend: [],
      sentimentTrend: [],
      advocacyHighlights: [],
      riskAlerts: [],
      ownerActions: [],
    };
  }

  const total = insights.length;

  // Sentiment split
  const sentimentSplit = insights.reduce(
    (acc, i) => {
      acc[i.sentiment.label]++;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );

  // Average rating
  const averageRating = parseFloat(
    (insights.reduce((s, i) => s + i.rating, 0) / total).toFixed(1)
  );

  // Feedback score (0-100)
  const feedbackScore = Math.round(
    ((sentimentSplit.positive * 1 + sentimentSplit.neutral * 0.5) / total) * 100
  );

  // Top keywords
  const keywordFreq = {};
  insights.forEach((i) => {
    (i.keywords || []).forEach((k) => {
      keywordFreq[k] = (keywordFreq[k] || 0) + 1;
    });
  });
  const topKeywords = Object.entries(keywordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word, count]) => ({ word, count }));

  // Theme breakdown
  const themeBreakdown = {};
  const themeNames = Object.keys(THEME_KEYWORDS);
  themeNames.forEach((theme) => {
    themeBreakdown[theme] = insights.filter((i) => i.themes?.[theme]).length;
  });

  // Rating trend (last 10)
  const ratingTrend = insights
    .slice(0, 10)
    .reverse()
    .map((i) => ({
      date: new Date(i.analysedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      rating: i.rating,
      sentiment: i.sentiment.label,
    }));

  // Sentiment trend
  const sentimentTrend = insights
    .slice(0, 10)
    .reverse()
    .map((i) => ({
      date: new Date(i.analysedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      score: parseFloat((i.sentiment.score * 100).toFixed(1)),
    }));

  // Waiting time risk
  const waitingNegCount = insights.filter(
    (i) => i.waitingTimeSignal?.sentiment === 'negative'
  ).length;
  const waitingTimeRisk = waitingNegCount / total >= 0.3;

  // Price perception summary
  const pricePerceptionSummary = insights.reduce((acc, i) => {
    const p = i.priceSignal?.perception || 'not_detected';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  // Advocacy highlights (5-star positive reviews)
  const advocacyHighlights = insights
    .filter((i) => i.rating >= 4 && i.sentiment.label === 'positive')
    .slice(0, 3)
    .map((i) => ({
      authorName: i.rawReview.authorName,
      rating: i.rating,
      text: i.rawReview.text?.slice(0, 180) || '',
      themes: Object.keys(i.themes || {}).filter((k) => i.themes[k]),
    }));

  // Risk alerts
  const riskAlerts = [];
  if (waitingTimeRisk) {
    riskAlerts.push({
      type: 'waiting_time',
      severity: 'high',
      message: `${waitingNegCount} out of ${total} reviews mention poor waiting time. Review kitchen operations.`,
    });
  }
  const overpriced = (pricePerceptionSummary['expensive'] || 0) + (pricePerceptionSummary['overpriced'] || 0);
  if (overpriced / total >= 0.25) {
    riskAlerts.push({
      type: 'price_perception',
      severity: 'medium',
      message: `${overpriced} reviews cite expensive pricing. Consider value meal options.`,
    });
  }
  if (sentimentSplit.negative / total >= 0.3) {
    riskAlerts.push({
      type: 'negative_sentiment',
      severity: 'high',
      message: `${sentimentSplit.negative} negative reviews detected. Immediate owner response required.`,
    });
  }

  // Owner actions (aggregated recommendations)
  const allRecs = insights.flatMap((i) => i.recommendations || []);
  const recFreq = {};
  allRecs.forEach((r) => { recFreq[r] = (recFreq[r] || 0) + 1; });
  const ownerActions = Object.entries(recFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([action]) => action);

  return {
    averageRating,
    totalReviews: total,
    sentimentSplit,
    feedbackScore,
    topKeywords,
    themeBreakdown,
    waitingTimeRisk,
    pricePerceptionSummary,
    ratingTrend,
    sentimentTrend,
    advocacyHighlights,
    riskAlerts,
    ownerActions,
  };
}

module.exports = { analyseReview, generateDashboardMetrics };
