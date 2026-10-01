import React, { useState, useEffect } from 'react';
import {
  Store,
  MapPin,
  Clock,
  Star,
  Search,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Award,
  Truck,
  CheckCircle2,
  Phone,
  Flame,
} from 'lucide-react';
import { Shop, Product, Category } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';

interface CustomerHomeProps {
  onSelectShop: (shopSlug: string) => void;
  selectedCity: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenVendorOnboarding: () => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  onSelectShop,
  selectedCity,
  searchQuery,
  setSearchQuery,
  onOpenVendorOnboarding,
}) => {
  const { addToCart } = useCart();
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [popularProducts, setPopularProducts] = useState<{ product: Product; shop: Shop }[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch shops & categories
  useEffect(() => {
    let isMounted = true;
    let retryTimer: any = null;

    const fetchData = async (retryCount = 0) => {
      setLoading(true);
      try {
        const cityParam = selectedCity && selectedCity !== 'All Cities' ? `&city=${encodeURIComponent(selectedCity)}` : '';
        const catParam = selectedCategory && selectedCategory !== 'All' ? `&category=${encodeURIComponent(selectedCategory)}` : '';
        const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';

        const [catRes, shopsRes, prodRes] = await Promise.all([
          fetch('/api/categories').catch(() => null),
          fetch(`/api/shops?status=active${cityParam}${catParam}${searchParam}`).catch(() => null),
          fetch('/api/products/search?q=').catch(() => null),
        ]);

        let loadedSomething = false;

        if (catRes && catRes.ok) {
          const cats = await catRes.json().catch(() => []);
          if (isMounted) setCategories(cats);
          loadedSomething = true;
        }

        if (shopsRes && shopsRes.ok) {
          const data = await shopsRes.json().catch(() => []);
          if (isMounted) setShops(data);
          loadedSomething = true;
        }

        if (prodRes && prodRes.ok) {
          const prods = await prodRes.json().catch(() => []);
          if (isMounted) setPopularProducts(prods.slice(0, 8));
          loadedSomething = true;
        }

        // If network was temporarily down during dev server restart, retry once after 800ms
        if (!loadedSomething && retryCount < 2 && isMounted) {
          retryTimer = setTimeout(() => fetchData(retryCount + 1), 800);
          return;
        }
      } catch {
        // Fallback for transient network reconnects
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [selectedCity, selectedCategory, searchQuery]);

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Showcase Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white p-6 sm:p-12 shadow-2xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hyperlocal Neighborhood Commerce</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Support Local Shops. <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Order Directly Online.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Order fresh groceries, bakery goods, fashion, stationery, and daily essentials from your trusted local shopkeepers. Delivered to your doorstep or ready for express counter pickup.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 text-xs">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>30-60 Min Express Delivery</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 text-xs">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Direct Store Pricing & Freshness</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Automated Legal Invoicing</span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Category Pills Slider */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <span>Browse by Category</span>
          </h2>
          <span className="text-xs text-slate-500">{categories.length} categories available</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                selectedCategory === cat.name
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Shops Grid */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-600" />
              <span>All Shop Stores & Digital Storefronts</span>
            </h2>
            <p className="text-xs text-slate-500">
              Showing verified local businesses in {selectedCity || 'All Cities'}
            </p>
          </div>

          {selectedCategory !== 'All' && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md self-start sm:self-auto border border-emerald-200">
              Filter: {selectedCategory}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No shops found matching your criteria</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try selecting a different city or category, or be the first merchant to open a store here!
            </p>
            <button
              onClick={onOpenVendorOnboarding}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
            >
              Register Your Shop on YUNAY
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <div
                key={shop.id}
                onClick={() => onSelectShop(shop.slug)}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-xl transition duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Shop Cover Banner */}
                  <div className="relative h-40 overflow-hidden bg-slate-100">
                    <img
                      src={
                        shop.bannerUrl ||
                        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={shop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                    {/* Category pill */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/95 text-slate-800 backdrop-blur-xs shadow-xs">
                      {shop.category}
                    </span>

                    {/* Open / Closed Status Indicator */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold backdrop-blur-md shadow-xs bg-slate-900/90 text-white">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          shop.isTemporarilyClosed ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
                        }`}
                      />
                      <span>{shop.isTemporarilyClosed ? 'Closed Now' : 'Open'}</span>
                    </div>

                    {/* Logo & City Title in Cover */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2.5 text-white">
                      <img
                        src={
                          shop.logoUrl ||
                          'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=100&q=80'
                        }
                        alt={shop.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-white bg-white shadow-md shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-base truncate group-hover:text-emerald-300 transition">
                          {shop.name}
                        </h3>
                        <p className="text-[11px] text-slate-200 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>
                            {shop.city}, {shop.pincode}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Body description & terms */}
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {shop.description || 'Welcome to our digital storefront on YUNAY.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>
                          {shop.openingTime} - {shop.closingTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600">
                        <Truck className="w-3 h-3 text-emerald-600" />
                        <span>
                          Delivery: {Number(shop.deliveryFee) === 0 ? 'Free' : `₹${shop.deliveryFee}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer with YUNAY Badge */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                    <span>Powered by</span>
                    <span className="text-emerald-700 font-extrabold">YUNAY</span>
                  </div>

                  <span className="text-xs font-bold text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1">
                    <span>Enter Store</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trending Products Showcase */}
      {popularProducts.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <span>Popular Neighborhood Products</span>
              </h2>
              <p className="text-xs text-slate-500">
                Fresh items and bestsellers from active neighborhood shops
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularProducts.map(({ product, shop }) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col justify-between hover:shadow-md transition group"
              >
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                    <img
                      src={
                        product.imageUrl ||
                        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80'
                      }
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    {Number(product.discountPrice) > 0 && (
                      <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                        SAVE ₹{Math.round(Number(product.price) - Number(product.discountPrice))}
                      </span>
                    )}
                  </div>

                  <p
                    onClick={() => onSelectShop(shop.slug)}
                    className="text-[10px] text-slate-500 hover:text-emerald-700 font-semibold truncate cursor-pointer"
                  >
                    From {shop.name}
                  </p>

                  <h3 className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5">
                    {product.name}
                  </h3>

                  <p className="text-[11px] text-slate-400 mt-0.5">{product.unit}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 font-mono">
                      ₹{Number(product.discountPrice) > 0 ? product.discountPrice : product.price}
                    </span>
                    {Number(product.discountPrice) > 0 && (
                      <span className="text-[10px] text-slate-400 line-through ml-1.5 font-mono">
                        ₹{product.price}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(product, shop)}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg text-xs font-bold transition border border-emerald-200"
                  >
                    Add +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
