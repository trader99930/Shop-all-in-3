import React, { useState, useEffect } from 'react';
import {
  Store,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  QrCode,
  Tag,
  Settings,
  Plus,
  Search,
  Upload,
  Download,
  Copy,
  Printer,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  X,
  Phone,
  Eye,
  RefreshCcw,
  Building2,
  MapPin,
  Percent,
} from 'lucide-react';
import { Shop, Product, ProductVariant, Order, Offer, Invoice } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { InvoiceModal } from '../components/InvoiceModal.tsx';
import { QRCodeModal } from '../components/QRCodeModal.tsx';

interface VendorDashboardProps {
  onViewPublicStore: (slug: string) => void;
  onOpenVendorOnboarding?: () => void;
  initialShopSlug?: string;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({
  onViewPublicStore,
  onOpenVendorOnboarding,
  initialShopSlug,
}) => {
  const { currentUser, getAuthHeaders, refreshSession, switchUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'stock' | 'customers' | 'offers' | 'settings'>('orders');
  const [shop, setShop] = useState<Shop | null>(currentUser?.shop || null);
  const [availableShops, setAvailableShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Filter & Search states
  const [orderFilter, setOrderFilter] = useState<string>('ALL');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');

  // Modals
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productSaveError, setProductSaveError] = useState<string>('');
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAddOfferModal, setShowAddOfferModal] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  // Product Form State
  const [pName, setPName] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [pCategory, setPCategory] = useState('Grocery');
  const [pSubcategory, setPSubcategory] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pDiscountPrice, setPDiscountPrice] = useState('');
  const [pUnit, setPUnit] = useState('Piece');
  const [pSku, setPSku] = useState('');
  const [pStock, setPStock] = useState('50');
  const [pBrand, setPBrand] = useState('');
  const [pTags, setPTags] = useState('');
  const [pImageUrl, setPImageUrl] = useState('');
  const [pVariants, setPVariants] = useState<{ name: string; price: string; stock: number }[]>([]);

  // Bulk Upload State
  const [csvContent, setCsvContent] = useState('');
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [bulkUploading, setBulkUploading] = useState(false);

  // Offer Form State
  const [offerCode, setOfferCode] = useState('');
  const [offerTitle, setOfferTitle] = useState('');
  const [offerType, setOfferType] = useState<'percentage' | 'fixed'>('percentage');
  const [offerValue, setOfferValue] = useState('10');
  const [offerMinOrder, setOfferMinOrder] = useState('300');

  // Shop Settings Form State
  const [settingName, setSettingName] = useState('');
  const [settingDesc, setSettingDesc] = useState('');
  const [settingPhone, setSettingPhone] = useState('');
  const [settingAddress, setSettingAddress] = useState('');
  const [settingCity, setSettingCity] = useState('');
  const [settingOpenTime, setSettingOpenTime] = useState('09:00');
  const [settingCloseTime, setSettingCloseTime] = useState('21:00');
  const [settingClosedDay, setSettingClosedDay] = useState('None');
  const [settingDeliveryFee, setSettingDeliveryFee] = useState('30');
  const [settingMinOrder, setSettingMinOrder] = useState('100');
  const [settingFreeThreshold, setSettingFreeThreshold] = useState('500');
  const [settingAnnouncement, setSettingAnnouncement] = useState('');
  const [settingTempClosed, setSettingTempClosed] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const unitsList = ['Piece', 'Kg', 'Gram', 'Litre', 'ml', 'Packet', 'Box', 'Dozen', 'Meter', 'Pair', 'Set'];

  // Load shop data
  const loadShopData = async (targetSlug?: string) => {
    setLoading(true);
    try {
      const activeSlugToPick = targetSlug || initialShopSlug || shop?.slug;

      // 1. Fetch current session & user's shops
      const meRes = await fetch('/api/auth/me', { headers: getAuthHeaders() });
      const meData = await meRes.json();

      // 2. Fetch all shops to enable full platform control and accurate multi-store access
      const allRes = await fetch('/api/shops');
      let allShops: Shop[] = [];
      if (allRes.ok) {
        allShops = await allRes.json();
      }

      const effectiveUser = meData.user || currentUser;
      const myId = effectiveUser?.id;
      const isSuperAdmin = effectiveUser?.role === 'super_admin';

      let shopList: Shop[] = [];
      if (isSuperAdmin) {
        // Super admin can manage ALL stores on the platform
        shopList = allShops;
      } else if (myId) {
        // Shopkeeper gets all shops owned by them
        shopList = allShops.filter((s) => Number(s.ownerId) === Number(myId));
      }

      // Fallback to meData shops if available
      if (shopList.length === 0 && meData.user?.shops?.length > 0) {
        shopList = meData.user.shops;
      }
      if (shopList.length === 0 && meData.user?.shop) {
        shopList = [meData.user.shop];
      }

      setAvailableShops(shopList);

      let candidateShop: Shop | null = null;
      if (activeSlugToPick) {
        candidateShop =
          shopList.find((s) => s.slug === activeSlugToPick) ||
          allShops.find((s) => s.slug === activeSlugToPick) ||
          null;
      }

      if (!candidateShop && shopList.length > 0) {
        candidateShop = shopList[0];
      }
      if (!candidateShop && allShops.length > 0 && isSuperAdmin) {
        candidateShop = allShops[0];
      }

      if (candidateShop) {
        const sh = candidateShop;
        setShop(sh);
        setSettingName(sh.name);
        setSettingDesc(sh.description || '');
        setSettingPhone(sh.businessPhone);
        setSettingAddress(sh.address);
        setSettingCity(sh.city);
        setSettingOpenTime(sh.openingTime);
        setSettingCloseTime(sh.closingTime);
        setSettingClosedDay(sh.weeklyClosedDay);
        setSettingDeliveryFee(sh.deliveryFee);
        setSettingMinOrder(sh.minOrderAmount);
        setSettingFreeThreshold(sh.freeDeliveryThreshold);
        setSettingAnnouncement(sh.announcement || '');
        setSettingTempClosed(sh.isTemporarilyClosed);

        // Fetch Orders
        const ordRes = await fetch(`/api/shops/${sh.id}/orders`, { headers: getAuthHeaders() });
        if (ordRes.ok) setOrders(await ordRes.json());

        // Fetch Products
        const prodRes = await fetch(`/api/shops/${sh.slug}`);
        if (prodRes.ok) {
          const pData = await prodRes.json();
          setProducts(pData.products || []);
          setOffers(pData.offers || []);
        }

        // Fetch Analytics
        const anRes = await fetch(`/api/shops/${sh.id}/analytics`, { headers: getAuthHeaders() });
        if (anRes.ok) setAnalytics(await anRes.json());

        // Fetch Customers
        const custRes = await fetch(`/api/shops/${sh.id}/customers`, { headers: getAuthHeaders() });
        if (custRes.ok) setCustomers(await custRes.json());
      } else {
        setShop(null);
      }
    } catch (err) {
      console.error('Failed to load vendor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShopData(initialShopSlug);
  }, [currentUser?.id, initialShopSlug]);

  // Order status transition
  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await loadShopData(shop?.slug);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Inline Stock Quantity update
  const handleQuickStockUpdate = async (productId: number, newStock: number) => {
    try {
      const prod = products.find((p) => p.id === productId);
      if (!prod || !shop) return;
      await fetch(`/api/shops/${shop.id}/products/${productId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...prod,
          stockQuantity: newStock,
        }),
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newStock } : p))
      );
    } catch (err) {
      console.error('Stock update failed:', err);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId: number) => {
    if (!shop || !confirm('Are you sure you want to remove this product?')) return;
    try {
      await fetch(`/api/shops/${shop.id}/products/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Duplicate product
  const handleDuplicateProduct = async (productId: number) => {
    if (!shop) return;
    try {
      const res = await fetch(`/api/shops/${shop.id}/products/${productId}/duplicate`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const copy = await res.json();
        setProducts((prev) => [copy, ...prev]);
      }
    } catch (err) {
      console.error('Duplicate failed:', err);
    }
  };

  // Save product modal form
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    const payload = {
      name: pName,
      description: pDescription,
      category: pCategory,
      subcategory: pSubcategory,
      price: pPrice,
      discountPrice: pDiscountPrice || '0',
      unit: pUnit,
      sku: pSku,
      stockQuantity: parseInt(pStock, 10) || 0,
      brand: pBrand,
      tags: pTags,
      imageUrl: pImageUrl,
      variants: pVariants,
    };

    try {
      let res;
      if (editingProduct) {
        res = await fetch(`/api/shops/${shop.id}/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/shops/${shop.id}/products`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setShowAddProductModal(false);
        setEditingProduct(null);
        resetProductForm();
        setProductSaveError('');
        await loadShopData(shop.slug);
      } else {
        const errData = await res.json().catch(() => ({}));
        setProductSaveError(errData.error || 'Failed to save product. Please check required fields.');
      }
    } catch (err: any) {
      console.error('Save product error:', err);
      setProductSaveError(err.message || 'Network error occurred while saving product.');
    }
  };

  const resetProductForm = () => {
    setPName('');
    setPDescription('');
    setPCategory('Grocery');
    setPSubcategory('');
    setPPrice('');
    setPDiscountPrice('');
    setPUnit('Piece');
    setPSku('');
    setPStock('50');
    setPBrand('');
    setPTags('');
    setPImageUrl('');
    setPVariants([]);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setPName(p.name);
    setPDescription(p.description || '');
    setPCategory(p.category);
    setPSubcategory(p.subcategory || '');
    setPPrice(p.price);
    setPDiscountPrice(p.discountPrice || '');
    setPUnit(p.unit);
    setPSku(p.sku || '');
    setPStock(String(p.stockQuantity));
    setPBrand(p.brand || '');
    setPTags(p.tags || '');
    setPImageUrl(p.imageUrl || '');
    setPVariants(p.variants || []);
    setShowAddProductModal(true);
  };

  // Bulk CSV Upload Execution
  const handleProcessBulkUpload = async () => {
    if (!shop || !csvContent.trim()) return;
    setBulkUploading(true);
    setBulkResult(null);

    try {
      // Parse CSV rows
      const lines = csvContent.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        alert('CSV must contain a header row and at least one item');
        setBulkUploading(false);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const nameIdx = headers.findIndex((h) => h.includes('name'));
      const catIdx = headers.findIndex((h) => h.includes('category'));
      const priceIdx = headers.findIndex((h) => h.includes('price'));
      const discIdx = headers.findIndex((h) => h.includes('discount'));
      const unitIdx = headers.findIndex((h) => h.includes('unit'));
      const skuIdx = headers.findIndex((h) => h.includes('sku'));
      const stockIdx = headers.findIndex((h) => h.includes('stock'));
      const brandIdx = headers.findIndex((h) => h.includes('brand'));
      const descIdx = headers.findIndex((h) => h.includes('desc'));

      const parsedItems = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length > 0 && cols[nameIdx]) {
          parsedItems.push({
            name: cols[nameIdx],
            category: catIdx !== -1 ? cols[catIdx] : shop.category,
            price: priceIdx !== -1 ? cols[priceIdx] : '0',
            discountPrice: discIdx !== -1 ? cols[discIdx] : '0',
            unit: unitIdx !== -1 && cols[unitIdx] ? cols[unitIdx] : 'Piece',
            sku: skuIdx !== -1 ? cols[skuIdx] : '',
            stockQuantity: stockIdx !== -1 ? parseInt(cols[stockIdx], 10) || 10 : 10,
            brand: brandIdx !== -1 ? cols[brandIdx] : '',
            description: descIdx !== -1 ? cols[descIdx] : '',
          });
        }
      }

      const res = await fetch(`/api/shops/${shop.id}/products/bulk-upload`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ items: parsedItems }),
      });

      const data = await res.json();
      setBulkResult(data);
      await loadShopData(shop?.slug);
    } catch (err: any) {
      alert(err.message || 'Error processing bulk upload');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleDownloadSampleCSV = () => {
    const sample = `Product Name,Category,Price,Discount Price,Unit,SKU,Stock,Brand,Description\nPremium Basmati Rice,Grocery,160,145,Kg,SGS-RICE-01,50,Daawat,Aromatic long grain\nOrganic Tomato,Fruits & Vegetables,40,35,Kg,GH-TOMATO-01,80,FarmFresh,Juicy red tomatoes\nDark Truffle Cake,Bakery,600,550,Piece,RT-CAKE-01,15,RoyalTreats,Belgian chocolate`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'yunay-bulk-products-template.csv';
    link.click();
  };

  // Add Promo Offer
  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    try {
      const res = await fetch(`/api/shops/${shop.id}/offers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          code: offerCode,
          title: offerTitle,
          discountType: offerType,
          discountValue: offerValue,
          minOrderValue: offerMinOrder,
        }),
      });
      if (res.ok) {
        setShowAddOfferModal(false);
        setOfferCode('');
        setOfferTitle('');
        await loadShopData(shop.slug);
      }
    } catch (err) {
      console.error('Error adding offer:', err);
    }
  };

  // Delete Offer
  const handleDeleteOffer = async (offerId: number) => {
    if (!shop) return;
    try {
      await fetch(`/api/shops/${shop.id}/offers/${offerId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      setOffers((prev) => prev.filter((o) => o.id !== offerId));
    } catch (err) {
      console.error('Delete offer failed:', err);
    }
  };

  // Save Shop Settings & Customization
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    try {
      const res = await fetch(`/api/shops/${shop.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: settingName,
          description: settingDesc,
          businessPhone: settingPhone,
          address: settingAddress,
          city: settingCity,
          openingTime: settingOpenTime,
          closingTime: settingCloseTime,
          weeklyClosedDay: settingClosedDay,
          deliveryFee: settingDeliveryFee,
          minOrderAmount: settingMinOrder,
          freeDeliveryThreshold: settingFreeThreshold,
          announcement: settingAnnouncement,
          isTemporarilyClosed: settingTempClosed,
        }),
      });
      if (res.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2500);
        await refreshSession();
        await loadShopData(shop.slug);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Loading merchant operations...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 max-w-lg mx-auto shadow-sm my-8">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-900">No Storefront Active</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          You are currently signed in as a Customer or do not have a shop assigned to this session. Register your shop now or switch to a demo store to start managing products and orders.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onOpenVendorOnboarding && (
            <button
              onClick={onOpenVendorOnboarding}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your Digital Storefront</span>
            </button>
          )}

          <button
            onClick={() => switchUser('ramesh.sharma@sharmastore.in')}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Demo: Sharma Store</span>
          </button>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'ALL') return true;
    return o.status === orderFilter;
  });

  const categoriesSet = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProductList = products.filter((p) => {
    const matchCat = productCategoryFilter === 'ALL' || p.category === productCategoryFilter;
    const matchSearch =
      !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Merchant Top Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={shop.logoUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=150&q=80'}
            alt={shop.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {shop.name}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  shop.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {shop.status}
              </span>

              {availableShops.length > 1 && (
                <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-500 text-[11px]">Store:</span>
                  <select
                    value={shop.slug}
                    onChange={(e) => {
                      const found = availableShops.find((s) => s.slug === e.target.value);
                      if (found) loadShopData(found.slug);
                    }}
                    className="bg-transparent border-none outline-none font-bold text-emerald-800 text-xs cursor-pointer max-w-[180px] truncate"
                  >
                    {availableShops.map((s) => (
                      <option key={s.id} value={s.slug}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {onOpenVendorOnboarding && (
                <button
                  type="button"
                  onClick={onOpenVendorOnboarding}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition cursor-pointer"
                  title="Register a new digital storefront"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Shop</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {shop.category} Merchant • {shop.city}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 text-emerald-400 text-[11px] font-bold">
                <span>Powered by YUNAY</span>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  shop.isTemporarilyClosed
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {shop.isTemporarilyClosed ? 'Closed for Orders' : 'Accepting Orders'}
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onViewPublicStore(shop.slug)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Live Store</span>
          </button>

          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
            <span>Counter Standee / QR</span>
          </button>
        </div>
      </div>

      {/* KPI Sales Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Revenue</p>
          <p className="text-lg font-black text-slate-900 font-mono mt-1">
            ₹{analytics?.todaySales || 0}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold">{analytics?.todayOrdersCount || 0} orders today</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Sales</p>
          <p className="text-lg font-black text-slate-900 font-mono mt-1">
            ₹{analytics?.totalSales || 0}
          </p>
          <span className="text-[10px] text-slate-500 font-bold">{analytics?.completedOrdersCount || 0} completed</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">All Orders</p>
          <p className="text-lg font-black text-slate-900 font-mono mt-1">
            {analytics?.totalOrders || orders.length}
          </p>
          <span className="text-[10px] text-slate-400 font-bold">Lifecycle total</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg. Order Value</p>
          <p className="text-lg font-black text-slate-900 font-mono mt-1">
            ₹{analytics?.averageOrderValue || 0}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold">Per customer bill</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Patrons</p>
          <p className="text-lg font-black text-slate-900 font-mono mt-1">
            {analytics?.uniqueCustomers || customers.length}
          </p>
          <span className="text-[10px] text-slate-500 font-bold">Local customer base</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Low Stock Alerts</p>
          <p className="text-lg font-black text-amber-600 font-mono mt-1">
            {analytics?.lowStockProducts?.length || 0}
          </p>
          <span className="text-[10px] text-amber-600 font-bold">Items under 10 units</span>
        </div>
      </div>

      {/* Commission & Settlement Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">YUNAY 1% Platform Commission & Payout Policy</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                1% Commission Rate
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Platform fee is only 1% per delivered order. 99% net proceeds belong to you (the shop owner) and are settled directly to your shop bank account.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-2 rounded-xl text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">1% Platform Fee</span>
            <span className="text-sm font-black font-mono text-amber-300">
              ₹{(Number(analytics?.totalSales || 0) * 0.01).toFixed(2)}
            </span>
          </div>

          <div className="bg-emerald-950/80 border border-emerald-500/40 px-3.5 py-2 rounded-xl text-right">
            <span className="text-[10px] text-emerald-400 block font-semibold uppercase">99% Net Store Payout</span>
            <span className="text-sm font-black font-mono text-emerald-300">
              ₹{(Number(analytics?.totalSales || 0) * 0.99).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition shrink-0 ${
            activeTab === 'orders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4 text-emerald-600" />
          <span>Orders & Invoicing</span>
          {orders.filter((o) => o.status === 'NEW').length > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-black">
              {orders.filter((o) => o.status === 'NEW').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition shrink-0 ${
            activeTab === 'products' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4 text-emerald-600" />
          <span>Products & Variants ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition shrink-0 ${
            activeTab === 'stock' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Inventory & Low Stock</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition shrink-0 ${
            activeTab === 'customers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          <span>Customer Directory ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition shrink-0 ${
            activeTab === 'offers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tag className="w-4 h-4 text-purple-600" />
          <span>Store Offers & Coupons ({offers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition shrink-0 ${
            activeTab === 'settings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>🏢 Company Profile & Details</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. ORDERS TAB */}
      {/* ======================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Order Status Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {['ALL', 'NEW', 'ACCEPTED', 'PACKING', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setOrderFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                  orderFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
              <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No orders found in this status</p>
              <p className="text-xs text-slate-400 mt-1">
                New incoming customer orders will pop up here with instant status actions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          Order #{ord.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            ord.status === 'NEW'
                              ? 'bg-rose-100 text-rose-800 animate-pulse'
                              : ord.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {ord.orderType === 'pickup' ? 'Store Pickup' : 'Home Delivery'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-slate-900 font-mono">
                        ₹{ord.totalAmount}
                      </span>
                      <button
                        onClick={() => setSelectedOrderForInvoice(ord)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Print Bill</span>
                      </button>
                    </div>
                  </div>

                  {/* Customer Contact & Address info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Customer Details</p>
                      <p className="font-bold text-slate-800 mt-0.5">{ord.customerName}</p>
                      <p className="text-slate-600 font-medium flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{ord.customerPhone}</span>
                      </p>
                    </div>
                    {ord.orderType === 'delivery' && (
                      <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase">Delivery Address</p>
                        <p className="text-slate-700 mt-0.5">{ord.deliveryAddress}</p>
                        {ord.deliveryInstructions && (
                          <p className="text-slate-500 italic mt-0.5">"{ord.deliveryInstructions}"</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Order items list */}
                  <div className="text-xs space-y-1">
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Items Ordered</p>
                    <div className="divide-y divide-slate-100">
                      {ord.items?.map((item) => (
                        <div key={item.id} className="py-1 flex items-center justify-between">
                          <span className="font-medium text-slate-800">
                            {item.quantity}x {item.productName}{' '}
                            {item.variantName && (
                              <span className="text-emerald-700">({item.variantName})</span>
                            )}
                          </span>
                          <span className="font-mono text-slate-700">₹{item.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Merchant Status Transition Actions */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">
                      Payment: <strong>{ord.paymentMethod.replace(/_/g, ' ')}</strong> ({ord.paymentStatus})
                    </span>

                    <div className="flex flex-wrap gap-1.5">
                      {ord.status === 'NEW' && (
                        <>
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'ACCEPTED')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                          >
                            Accept Order
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'REJECTED')}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {ord.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'PACKING')}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition"
                        >
                          Mark as Packing
                        </button>
                      )}

                      {ord.status === 'PACKING' && (
                        <button
                          onClick={() =>
                            handleUpdateOrderStatus(
                              ord.id,
                              ord.orderType === 'pickup' ? 'READY_FOR_PICKUP' : 'OUT_FOR_DELIVERY'
                            )
                          }
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
                        >
                          {ord.orderType === 'pickup' ? 'Mark Ready for Pickup' : 'Dispatch for Delivery'}
                        </button>
                      )}

                      {(ord.status === 'OUT_FOR_DELIVERY' || ord.status === 'READY_FOR_PICKUP') && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'DELIVERED')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Delivered & Complete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. PRODUCTS & VARIANTS TAB */}
      {/* ======================================================== */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <div className="relative w-56 sm:w-72">
                <input
                  type="text"
                  placeholder="Search products or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-100 rounded-xl text-xs border border-slate-200 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
              </div>

              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="bg-slate-100 border border-slate-200 text-xs font-semibold rounded-xl px-2.5 py-1.5"
              >
                {categoriesSet.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkUploadModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bulk CSV Upload</span>
              </button>

              <button
                onClick={() => {
                  resetProductForm();
                  setEditingProduct(null);
                  setShowAddProductModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {filteredProductList.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No products match your search</p>
              <button
                onClick={() => {
                  resetProductForm();
                  setShowAddProductModal(true);
                }}
                className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Add Your First Product
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Variants</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProductList.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'}
                            alt={prod.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{prod.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              SKU: {prod.sku || 'N/A'} • {prod.unit}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                          {prod.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        ₹{prod.discountPrice && Number(prod.discountPrice) > 0 ? prod.discountPrice : prod.price}
                        {prod.discountPrice && Number(prod.discountPrice) > 0 && (
                          <span className="line-through text-slate-400 ml-1 font-normal">₹{prod.price}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={prod.stockQuantity}
                            onChange={(e) => handleQuickStockUpdate(prod.id, parseInt(e.target.value, 10) || 0)}
                            className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-center focus:bg-white"
                          />
                          <span
                            className={`w-2 h-2 rounded-full ${
                              prod.stockQuantity <= 0
                                ? 'bg-rose-500'
                                : prod.stockQuantity <= 10
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {prod.variants && prod.variants.length > 0 ? (
                          <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            {prod.variants.length} Variants
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Standard</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDuplicateProduct(prod.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. INVENTORY & LOW STOCK TAB */}
      {/* ======================================================== */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-amber-900">Inventory Threshold Monitor</h3>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Items below 10 units are highlighted here. Update quantities directly to prevent customer order disruptions.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products
              .filter((p) => p.stockQuantity <= 10)
              .map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={prod.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'}
                      alt={prod.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{prod.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku} • ₹{prod.price}</p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block ${
                          prod.stockQuantity <= 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {prod.stockQuantity <= 0 ? 'Out of Stock' : `Low: ${prod.stockQuantity} remaining`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={prod.stockQuantity}
                      onChange={(e) => handleQuickStockUpdate(prod.id, parseInt(e.target.value, 10) || 0)}
                      className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center font-mono"
                    />
                    <button
                      onClick={() => handleQuickStockUpdate(prod.id, prod.stockQuantity + 20)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition"
                    >
                      +20
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. CUSTOMER DIRECTORY TAB */}
      {/* ======================================================== */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Neighborhood Patrons</h3>
                <p className="text-xs text-slate-500">Shoppers who placed orders with {shop.name}</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">{customers.length} total customers</span>
            </div>

            {customers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">No customer orders recorded yet.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4 text-center">Total Orders</th>
                    <th className="py-3 px-4 text-right">Lifetime Spend</th>
                    <th className="py-3 px-4 text-right">Last Ordered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-800">{c.customerName}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{c.customerPhone}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-700">{c.totalOrders}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{Number(c.totalSpend).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        {new Date(c.lastOrderDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. OFFERS & COUPONS TAB */}
      {/* ======================================================== */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Store Promotional Coupons</h3>
              <p className="text-xs text-slate-500">Provide promo codes for neighborhood shoppers to use at checkout.</p>
            </div>
            <button
              onClick={() => setShowAddOfferModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((off) => (
              <div
                key={off.id}
                className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-mono font-bold text-xs border border-emerald-200">
                    {off.code}
                  </span>
                  <button
                    onClick={() => handleDeleteOffer(off.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{off.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {off.discountType === 'percentage' ? `${off.discountValue}% OFF` : `₹${off.discountValue} Flat OFF`} on orders above ₹{off.minOrderValue}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. COMPANY PROFILE & STOREFRONT SETTINGS TAB */}
      {/* ======================================================== */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Company Profile Header Showcase */}
          <div className="bg-gradient-to-r from-emerald-900 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={shop.logoUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=150&q=80'}
                  alt={shop.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/80 bg-white shadow-md shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                      Company Profile
                    </span>
                    <span className="text-[10px] font-semibold text-slate-300">
                      ID: #{shop.id}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">{shop.name}</h2>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{shop.address}, {shop.city} - {shop.pincode}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewPublicStore(shop.slug)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  title="View how clients see your store with pictures"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Public Storefront (Pic Wala Show)</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Company Profile & Operational Details</h3>
              <p className="text-xs text-slate-500">Configure business hours, operational radius, phone, and announcement.</p>
            </div>
            {settingsSaved && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                Profile Updated Successfully!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Store Name</label>
              <input
                type="text"
                required
                value={settingName}
                onChange={(e) => setSettingName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Business Contact Phone</label>
              <input
                type="text"
                required
                value={settingPhone}
                onChange={(e) => setSettingPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Store Announcement</label>
              <input
                type="text"
                value={settingAnnouncement}
                onChange={(e) => setSettingAnnouncement(e.target.value)}
                placeholder="e.g. Free delivery on festival orders above ₹500!"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Store Description</label>
              <textarea
                rows={2}
                value={settingDesc}
                onChange={(e) => setSettingDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Store Address</label>
              <input
                type="text"
                value={settingAddress}
                onChange={(e) => setSettingAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">City</label>
              <input
                type="text"
                value={settingCity}
                onChange={(e) => setSettingCity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Opening Time</label>
              <input
                type="time"
                value={settingOpenTime}
                onChange={(e) => setSettingOpenTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Closing Time</label>
              <input
                type="time"
                value={settingCloseTime}
                onChange={(e) => setSettingCloseTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Minimum Order Amount (₹)</label>
              <input
                type="number"
                value={settingMinOrder}
                onChange={(e) => setSettingMinOrder(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Standard Delivery Fee (₹)</label>
              <input
                type="number"
                value={settingDeliveryFee}
                onChange={(e) => setSettingDeliveryFee(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Free Delivery Threshold (₹)</label>
              <input
                type="number"
                value={settingFreeThreshold}
                onChange={(e) => setSettingFreeThreshold(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Temporary Shop Closure</label>
              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingTempClosed}
                  onChange={(e) => setSettingTempClosed(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="font-semibold text-slate-800">Mark Store Temporarily Closed</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Save Storefront Configuration
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT PRODUCT */}
      {/* ======================================================== */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
            <button
              onClick={() => setShowAddProductModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Add details, prices, inventory units, and variants.
            </p>

            <form onSubmit={handleSaveProduct} className="space-y-4 mt-5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="e.g. Pure Desi Ghee / Cotton Kurta / 65W GaN Charger"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit *</label>
                  <select
                    value={pUnit}
                    onChange={(e) => setPUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  >
                    {unitsList.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={pPrice}
                    onChange={(e) => setPPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Price (₹)</label>
                  <input
                    type="number"
                    value={pDiscountPrice}
                    onChange={(e) => setPDiscountPrice(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={pStock}
                    onChange={(e) => setPStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={pSku}
                    onChange={(e) => setPSku(e.target.value)}
                    placeholder="Auto-generated if empty"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={pBrand}
                    onChange={(e) => setPBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="url"
                  value={pImageUrl}
                  onChange={(e) => setPImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={pDescription}
                  onChange={(e) => setPDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              {/* Variants Section */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Variants (Optional)</label>
                  <button
                    type="button"
                    onClick={() =>
                      setPVariants((prev) => [
                        ...prev,
                        { name: 'New Variant', price: pPrice || '100', stock: 10 },
                      ])
                    }
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    + Add Variant
                  </button>
                </div>

                {pVariants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 1kg / Size M"
                      value={v.name}
                      onChange={(e) => {
                        const copy = [...pVariants];
                        copy[i].name = e.target.value;
                        setPVariants(copy);
                      }}
                      className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={v.price}
                      onChange={(e) => {
                        const copy = [...pVariants];
                        copy[i].price = e.target.value;
                        setPVariants(copy);
                      }}
                      className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={v.stock}
                      onChange={(e) => {
                        const copy = [...pVariants];
                        copy[i].stock = parseInt(e.target.value, 10) || 0;
                        setPVariants(copy);
                      }}
                      className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setPVariants((prev) => prev.filter((_, idx) => idx !== i))}
                      className="p-1 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  {editingProduct ? 'Update Product' : 'Add to Catalogue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: BULK CSV UPLOAD */}
      {/* ======================================================== */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowBulkUploadModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Bulk Product Upload</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload multiple products quickly using CSV data.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-800">Need a format guide?</p>
                <p className="text-slate-500 text-[11px]">Download our sample template with standard columns.</p>
              </div>
              <button
                onClick={handleDownloadSampleCSV}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Sample CSV</span>
              </button>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">
                Paste CSV Rows or Drag File Content Below:
              </label>
              <textarea
                rows={6}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder={`Product Name,Category,Price,Discount Price,Unit,SKU,Stock,Brand,Description\nPremium Atta,Grocery,240,219,Packet,SGS-01,50,NatureFresh,100% whole wheat`}
                className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            {bulkResult && (
              <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-900">Bulk Import Results:</p>
                <p className="text-emerald-700 font-semibold">
                  ✓ Successfully imported: {bulkResult.successCount} products
                </p>
                {bulkResult.failureCount > 0 && (
                  <p className="text-rose-600 font-semibold">
                    ✗ Failed rows: {bulkResult.failureCount}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => setShowBulkUploadModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
              <button
                disabled={bulkUploading || !csvContent.trim()}
                onClick={handleProcessBulkUpload}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                {bulkUploading ? 'Importing...' : 'Validate & Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD OFFER */}
      {/* ======================================================== */}
      {showAddOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative text-xs">
            <button
              onClick={() => setShowAddOfferModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900">Create Promo Offer</h3>
            <p className="text-slate-500 mt-0.5">Discounts encourage bigger cart values.</p>

            <form onSubmit={handleSaveOffer} className="space-y-3 mt-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={offerCode}
                  onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVE15"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Offer Title</label>
                <input
                  type="text"
                  required
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  placeholder="e.g. 15% OFF on Weekend Orders"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Type</label>
                  <select
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={offerValue}
                    onChange={(e) => setOfferValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Min Order Amount (₹)</label>
                <input
                  type="number"
                  value={offerMinOrder}
                  onChange={(e) => setOfferMinOrder(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddOfferModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  Activate Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Standee Modal */}
      {showQRModal && <QRCodeModal shop={shop} onClose={() => setShowQRModal(false)} />}

      {/* Tax Invoice Modal for Merchant */}
      {selectedOrderForInvoice && (
        <InvoiceModal
          order={selectedOrderForInvoice}
          shop={shop}
          invoice={null}
          items={selectedOrderForInvoice.items || []}
          onClose={() => setSelectedOrderForInvoice(null)}
        />
      )}
    </div>
  );
};
