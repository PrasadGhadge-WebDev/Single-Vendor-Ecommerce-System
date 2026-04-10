const RECENTLY_VIEWED_KEY = "recentlyViewedProducts";
const MAX_RECENTLY_VIEWED = 8;

const toId = (product) => String(product?._id || product?.id || "").trim();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getPrice = (product) => Number(product?.price || 0);

const getCompareAtPrice = (product) =>
  Number(
    product?.compareAtPrice ||
      product?.originalPrice ||
      product?.mrp ||
      product?.listPrice ||
      0
  );

const getDiscountPercent = (product) => {
  const salePrice = getPrice(product);
  const compareAtPrice = getCompareAtPrice(product);
  if (compareAtPrice > salePrice && salePrice > 0) {
    return Math.round(((compareAtPrice - salePrice) / compareAtPrice) * 100);
  }

  return Number(product?.discountPercentage || 0);
};

const getRating = (product) => Number(product?.averageRating || 0);

const getReviewCount = (product) => Number(product?.numReviews || 0);

const normalizeBrand = (product) =>
  normalizeText(product?.brand || product?.supplier?.name || product?.manufacturer);

const normalizeCategory = (product) => normalizeText(product?.category);

const normalizeSnapshot = (product) => ({
  _id: product?._id,
  name: product?.name || "Product",
  price: product?.price,
  compareAtPrice: product?.compareAtPrice,
  originalPrice: product?.originalPrice,
  mrp: product?.mrp,
  listPrice: product?.listPrice,
  image: product?.image,
  category: product?.category,
  brand: product?.brand,
  supplier: product?.supplier,
  manufacturer: product?.manufacturer,
  averageRating: product?.averageRating,
  numReviews: product?.numReviews,
  description: product?.description,
  stock: product?.stock,
  createdAt: product?.createdAt,
  viewedAt: new Date().toISOString(),
});

export const loadRecentlyViewedProducts = () => {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(RECENTLY_VIEWED_KEY);
  const parsed = safeJsonParse(raw, []);
  if (!Array.isArray(parsed)) return [];

  return parsed.filter((item) => item && toId(item)).slice(0, MAX_RECENTLY_VIEWED);
};

export const recordRecentlyViewedProduct = (product) => {
  if (typeof window === "undefined") return [];

  const snapshot = normalizeSnapshot(product);
  if (!snapshot._id) return loadRecentlyViewedProducts();

  const existing = loadRecentlyViewedProducts().filter((item) => toId(item) !== snapshot._id);
  const updated = [snapshot, ...existing].slice(0, MAX_RECENTLY_VIEWED);

  window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("recently-viewed-updated"));

  return updated;
};

const buildAutocompleteTerm = (value) => normalizeText(value).replace(/[^a-z0-9\s-]/g, "");

const pushSuggestion = (suggestions, seen, suggestion) => {
  const key = `${suggestion.type || "suggestion"}:${normalizeText(suggestion.label)}:${normalizeText(
    suggestion.query || ""
  )}`;

  if (seen.has(key)) return;

  seen.add(key);
  suggestions.push(suggestion);
};

export const buildSearchSuggestions = (products = [], query = "", limit = 6) => {
  const term = buildAutocompleteTerm(query);
  const suggestions = [];
  const seen = new Set();

  if (!term) {
    const fallback = [...products]
      .sort((a, b) => {
        const aScore = getRating(a) * 100 + getReviewCount(a);
        const bScore = getRating(b) * 100 + getReviewCount(b);
        return bScore - aScore;
      })
      .slice(0, limit);

    fallback.forEach((product) => {
      pushSuggestion(suggestions, seen, {
        type: "product",
        label: product.name || "Product",
        helper: product.category || "Popular product",
        query: product.name || "",
        productId: product._id,
      });
    });

    return suggestions;
  }

  const scoring = [...products]
    .map((product) => {
      const name = normalizeText(product?.name);
      const category = normalizeText(product?.category);
      const brand = normalizeText(product?.brand || product?.supplier?.name || product?.manufacturer);
      const description = normalizeText(product?.description);
      let score = 0;

      if (name.startsWith(term)) score += 80;
      if (name.includes(term)) score += 60;
      if (category.startsWith(term)) score += 40;
      if (category.includes(term)) score += 28;
      if (brand.startsWith(term)) score += 36;
      if (brand.includes(term)) score += 22;
      if (description.includes(term)) score += 10;
      score += getRating(product) * 3;
      score += getReviewCount(product) * 0.08;

      return { product, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  scoring.forEach(({ product }) => {
    pushSuggestion(suggestions, seen, {
      type: "product",
      label: product.name || "Product",
      helper: [product.category, product.brand || product.supplier?.name].filter(Boolean).join(" • "),
      query: product.name || "",
      productId: product._id,
    });
  });

  if (suggestions.length < limit) {
    const categoryMatches = [...new Set(products.map((product) => product?.category).filter(Boolean))]
      .filter((name) => normalizeText(name).includes(term))
      .slice(0, limit - suggestions.length);

    categoryMatches.forEach((category) => {
      pushSuggestion(suggestions, seen, {
        type: "category",
        label: category,
        helper: `Browse ${category}`,
        query: category,
      });
    });
  }

  return suggestions.slice(0, limit);
};

export const buildSmartRecommendations = (products = [], seedProduct = null, recentlyViewed = []) => {
  const source = Array.isArray(products) ? products : [];
  const seedId = toId(seedProduct);
  const seedCategory = normalizeCategory(seedProduct);
  const seedBrand = normalizeBrand(seedProduct);
  const seedPrice = getPrice(seedProduct);

  const recentCategories = new Map();
  const recentBrands = new Map();
  const recentIds = new Set();

  recentlyViewed.forEach((item, index) => {
    const id = toId(item);
    if (id) recentIds.add(id);

    const category = normalizeCategory(item);
    const brand = normalizeBrand(item);
    const ageScore = Math.max(1, 8 - index);

    if (category) recentCategories.set(category, (recentCategories.get(category) || 0) + ageScore);
    if (brand) recentBrands.set(brand, (recentBrands.get(brand) || 0) + ageScore);
  });

  return source
    .filter((product) => toId(product) && toId(product) !== seedId)
    .map((product) => {
      const category = normalizeCategory(product);
      const brand = normalizeBrand(product);
      const rating = getRating(product);
      const reviews = getReviewCount(product);
      const discount = getDiscountPercent(product);
      const price = getPrice(product);
      const priceGap = seedPrice > 0 ? Math.abs(price - seedPrice) / seedPrice : 0;
      let score = rating * 10 + reviews * 0.18 + discount * 0.3;

      if (seedCategory && category === seedCategory) score += 26;
      if (seedBrand && brand && brand === seedBrand) score += 16;
      if (recentCategories.has(category)) score += recentCategories.get(category) * 2.4;
      if (recentBrands.has(brand)) score += recentBrands.get(brand) * 1.8;
      if (recentIds.has(toId(product))) score += 6;
      if (seedPrice > 0) score += clamp((1 - priceGap) * 12, 0, 12);

      const createdAtScore = new Date(product?.createdAt || 0).getTime() || 0;
      if (createdAtScore) score += clamp(createdAtScore / 1_000_000_000_000, 0, 8);

      return { product, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product);
};

