import React, { useState, useEffect } from 'react';
import {
  Store,
  MapPin,
  Clock,
  Phone,
  Truck,
  ShoppingBag,
  Star,
  QrCode,
  Share2,
  Check,
  Search,
  Award,
  AlertCircle,
  Tag,
  ArrowLeft,
} from 'lucide-react';
import { Shop, Product, ProductVariant, Offer, Review } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { QRCodeModal } from '../components/QRCodeModal.tsx';

interface ShopStorefrontProps {
  shopSlug: string;
  onBack: () => void;
}

export const ShopStorefront: React.FC<ShopStorefrontProps> = ({ shopSlug, onBack }) => {
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const isShopOwner = currentUser?.role === 'shopkeeper';

  // If a shopkeeper is viewing storefront, ensure they can ONLY ever load their own shop
  const myShops = currentUser?.shops || (currentUser?.shop ? [currentUser.shop] : []);
  const myShopSlugs = myShops.map((s) => s.slug);
  const effectiveSlug =
    isShopOwner
      ? myShopSlugs.includes(shopSlug)
        ? shopSlug
        : currentUser?.shop?.slug || myShopSlugs[0] || shopSlug
      : shopSlug;

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{ avgRating: number; totalReviews: number }>({
    avgRating: 5.0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchInStore, setSearchInStore] = useState<string>('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<number, ProductVariant>>({});

  useEffect(() => {
    const fetchShop = async () => {
      setLoading(true);
      try {
        if (!effectiveSlug) {
          setShop(null);
          return;
        }

        const res = await fetch(`/api/shops/${effectiveSlug}`);
        if (res.ok) {
          const data = await res.json();
          // STRICT MULTI-TENANT ISOLATION: A shopkeeper must NEVER see another merchant's storefront
          if (isShopOwner && currentUser?.id && data.shop) {
            const myId = Number(currentUser.id);
            if (Number(data.shop.ownerId) !== myId) {
              setShop(null);
              return;
            }
          }

          setShop(data.shop);
          setProducts(data.products || []);
          setOffers(data.offers || []);
          setReviews(data.reviews || []);
          setStats(data.stats || { avgRating: 5.0, totalReviews: 0 });

          // Initialize default variants
          const initialVariants: Record<number, ProductVariant> = {};
          data.products.forEach((p: Product) => {
            if (p.variants && p.variants.length > 0) {
              initialVariants[p.id] = p.variants[0];
            }
          });
          setSelectedVariants(initialVariants);
        }
      } catch (err) {
        console.error('Error fetching storefront:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [effectiveSlug]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Loading digital storefront...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto my-12">
        <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Storefront Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          The requested store slug does not exist or has been paused.
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  // Calculate distinct subcategories in this store
  const storeCategories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch =
      !searchInStore ||
      p.name.toLowerCase().includes(searchInStore.toLowerCase()) ||
      (p.tags && p.tags.toLowerCase().includes(searchInStore.toLowerCase())) ||
      (p.brand && p.brand.toLowerCase().includes(searchInStore.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: shop.name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top back navigation button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs hover:shadow transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {currentUser?.role === 'shopkeeper'
              ? '← मार्केटप्लेस पर जाएं (Marketplace)'
              : '← All Neighborhood Stores'}
          </span>
        </button>

        {currentUser?.role === 'shopkeeper' && (
          <span className="text-xs font-black text-emerald-800 bg-emerald-100/90 px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs flex items-center gap-1.5">
            <span>👑 आपकी अपनी दुकान का लाइव प्रिव्यू (Live Preview)</span>
          </span>
        )}
      </div>

      {/* Store Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-56 sm:h-72 w-full bg-slate-900">
          <img
            src={
              shop.bannerUrl ||
              'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80'
            }
            alt={shop.name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

          {/* Top badges & actions */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-md text-xs font-bold bg-white/95 text-slate-900 backdrop-blur-md shadow-xs">
                {shop.category}
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-slate-900/90 text-white backdrop-blur-md">
                <span
                  className={`w-2 h-2 rounded-full ${
                    shop.isTemporarilyClosed ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
                  }`}
                />
                <span>{shop.isTemporarilyClosed ? 'Temporarily Closed' : 'Store Open Now'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQRModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-900 text-xs font-bold shadow-md transition"
                title="View Store QR Code"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Store QR Code</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-900 text-xs font-bold shadow-md transition"
                title="Share Store Link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-700" />}
                <span className="hidden sm:inline">{copiedLink ? 'Copied Link' : 'Share Store'}</span>
              </button>
            </div>
          </div>

          {/* Bottom Banner Content */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
            <div className="flex items-center gap-4">
              <img
                src={
                  shop.logoUrl ||
                  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=150&q=80'
                }
                alt={shop.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white bg-white shadow-xl shrink-0"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{shop.name}</h1>
                <p className="text-xs text-slate-200 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    {shop.address}, {shop.city} - {shop.pincode}
                  </span>
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>{shop.businessPhone}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    <span>
                      {shop.openingTime} - {shop.closingTime} (Off: {shop.weeklyClosedDay})
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Official Platform Badge */}
            <div className="self-start sm:self-auto bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 rounded-xl text-right backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold justify-end">
                <Award className="w-4 h-4" />
                <span>Powered by YUNAY</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Verified Independent Merchant</p>
            </div>
          </div>
        </div>

        {/* Store Announcement & Operational Terms */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            {shop.announcement && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-100/80 text-emerald-900 text-xs font-semibold">
                <Tag className="w-3.5 h-3.5 text-emerald-700" />
                <span>{shop.announcement}</span>
              </div>
            )}
            <p className="text-xs text-slate-600 max-w-2xl">{shop.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-700">
              Min Order: <strong className="text-slate-900">₹{shop.minOrderAmount}</strong>
            </span>
            <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-700">
              Delivery Fee:{' '}
              <strong className="text-slate-900">
                {Number(shop.deliveryFee) === 0 ? 'FREE' : `₹${shop.deliveryFee}`}
              </strong>
            </span>
            <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-700">
              Free Delivery above: <strong className="text-emerald-700">₹{shop.freeDeliveryThreshold}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* In-store Search & Subcategories Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {storeCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Store search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder={`Search in ${shop.name}...`}
            value={searchInStore}
            onChange={(e) => setSearchInStore(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-xl text-xs border border-slate-200 focus:bg-white focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Products Catalogue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <span>Store Products & Catalogue</span>
          </h2>
          <span className="text-xs text-slate-500">
            {filteredProducts.length} items available
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No products found in this section</p>
            <p className="text-xs text-slate-400 mt-1">
              Try clearing your search term or select another category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => {
              const activeVariant = selectedVariants[product.id] || product.variants?.[0];
              const effectivePrice = activeVariant
                ? Number(activeVariant.price)
                : Number(product.discountPrice && Number(product.discountPrice) > 0 ? product.discountPrice : product.price);
              const isOutOfStock =
                activeVariant ? activeVariant.stock <= 0 : product.stockQuantity <= 0;
              const isLowStock =
                (activeVariant ? activeVariant.stock : product.stockQuantity) <= 5 && !isOutOfStock;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 p-4 flex flex-col justify-between shadow-xs hover:shadow-lg transition duration-200 group"
                >
                  <div>
                    {/* Product Image */}
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-3">
                      <img
                        src={
                          activeVariant?.imageUrl ||
                          product.imageUrl ||
                          'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'
                        }
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />

                      {/* Stock Badge */}
                      {isOutOfStock ? (
                        <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                          OUT OF STOCK
                        </span>
                      ) : isLowStock ? (
                        <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                          ONLY {activeVariant ? activeVariant.stock : product.stockQuantity} LEFT
                        </span>
                      ) : null}

                      {/* Discount badge */}
                      {Number(product.discountPrice) > 0 && !activeVariant && (
                        <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                          {Math.round(
                            ((Number(product.price) - Number(product.discountPrice)) /
                              Number(product.price)) *
                              100
                          )}
                          % OFF
                        </span>
                      )}
                    </div>

                    {/* Brand & Subcategory */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
                      <span>{product.brand || product.category}</span>
                      <span>{product.unit}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition">
                      {product.name}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Variants selector if available */}
                    {product.variants && product.variants.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Select Variant
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {product.variants.map((v) => (
                            <button
                              key={v.id}
                              onClick={() =>
                                setSelectedVariants((prev) => ({ ...prev, [product.id]: v }))
                              }
                              className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition ${
                                activeVariant?.id === v.id
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span>{v.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price & Add to cart button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-extrabold text-slate-900 font-mono">
                          ₹{effectivePrice.toFixed(0)}
                        </span>
                        {Number(product.discountPrice) > 0 && !activeVariant && (
                          <span className="text-xs text-slate-400 line-through font-mono">
                            ₹{product.price}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        SKU: {activeVariant?.sku || product.sku}
                      </span>
                    </div>

                    <button
                      disabled={isOutOfStock}
                      onClick={() => addToCart(product, shop, activeVariant)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                        isOutOfStock
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      }`}
                    >
                      {isOutOfStock ? 'Sold Out' : 'Add to Cart +'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Reviews Section */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Customer Reviews & Store Ratings</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified feedback from local patrons who completed orders at {shop.name}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200">
            <span className="text-2xl font-black text-amber-700">{stats.avgRating}</span>
            <div className="text-left text-xs">
              <div className="flex text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3 h-3 fill-amber-500" />
                ))}
              </div>
              <span className="text-slate-500 font-semibold">{stats.totalReviews} verified ratings</span>
            </div>
          </div>
        </div>

        {reviews.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">
            No customer reviews yet. Be the first to order and review this shop!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{rev.userName || 'Verified Buyer'}</span>
                  <div className="flex text-amber-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-500" />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed italic">"{rev.comment}"</p>
                <span className="text-[10px] text-slate-400 block">
                  {new Date(rev.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Prominent Powered by YUNAY Footer Badge */}
      <div className="text-center py-6 border-t border-slate-200">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white shadow-lg text-xs font-bold">
          <Award className="w-4 h-4 text-emerald-400" />
          <span>This Digital Storefront is Powered by YUNAY</span>
        </div>
      </div>

      {/* Store QR Modal */}
      {showQRModal && <QRCodeModal shop={shop} onClose={() => setShowQRModal(false)} />}
    </div>
  );
};
