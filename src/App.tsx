import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { PoliciesModal } from './components/PoliciesModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { CustomerHome } from './views/CustomerHome.tsx';
import { ShopStorefront } from './views/ShopStorefront.tsx';
import { CustomerOrders } from './views/CustomerOrders.tsx';
import { VendorDashboard } from './views/VendorDashboard.tsx';
import { SuperAdminDashboard } from './views/SuperAdminDashboard.tsx';
import { VendorOnboardingModal } from './views/VendorOnboardingModal.tsx';
import { Order } from './types/index.ts';
import { Store } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('discovery');
  const [activeShopSlug, setActiveShopSlug] = useState<string>('sharma-general-store');
  const [selectedCity, setSelectedCity] = useState<string>('All Cities');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [policyType, setPolicyType] = useState<string | null>(null);
  const [showVendorOnboarding, setShowVendorOnboarding] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [authModalRole, setAuthModalRole] = useState<'customer' | 'shopkeeper' | 'admin' | undefined>(undefined);

  // Sync active shop slug with current user's shop if available
  useEffect(() => {
    if (currentUser?.shop?.slug) {
      setActiveShopSlug(currentUser.shop.slug);
    }
  }, [currentUser?.shop?.slug]);

  // Strict multi-tenant tab protection & role enforcement
  useEffect(() => {
    if (!currentUser) {
      // Unauthenticated visitor can only access discovery or storefront
      if (currentTab === 'vendor' || currentTab === 'admin' || currentTab === 'customer_orders') {
        setCurrentTab('discovery');
      }
    } else if (currentUser.role === 'customer') {
      // Customer cannot access vendor or admin tabs
      if (currentTab === 'vendor' || currentTab === 'admin') {
        setCurrentTab('discovery');
      }
    } else if (currentUser.role === 'shopkeeper') {
      // Shopkeeper cannot access admin tab
      if (currentTab === 'admin') {
        setCurrentTab('vendor');
      }
    }
  }, [currentUser, currentTab]);

  const handleOpenLogin = (
    mode: 'signin' | 'signup' = 'signin',
    role?: 'customer' | 'shopkeeper' | 'admin'
  ) => {
    setAuthModalMode(mode);
    setAuthModalRole(role);
    setShowAuthModal(true);
  };

  const handleLoginSuccess = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r === 'shopkeeper' || r.includes('vendor') || r.includes('shop')) {
      setCurrentTab('vendor');
    } else if (r === 'super_admin' || r.includes('admin')) {
      setCurrentTab('admin');
    } else {
      setCurrentTab('discovery');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectShop = (slug: string) => {
    setActiveShopSlug(slug);
    setCurrentTab('storefront');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleManageShop = (slug: string) => {
    setActiveShopSlug(slug);
    setCurrentTab('vendor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderPlaced = (_newOrder: Order) => {
    setCurrentTab('customer_orders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVendorOnboardSuccess = (slug: string) => {
    setActiveShopSlug(slug);
    setCurrentTab('vendor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Full-page branded loading screen during initial session verification
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 animate-pulse">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">YUNAY</h1>
            <p className="text-xs text-emerald-400 font-medium tracking-wider uppercase mt-1">
              Local Digital Storefronts
            </p>
          </div>
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mt-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Top Platform Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenVendorOnboarding={() => setShowVendorOnboarding(true)}
        onOpenPolicies={(type) => setPolicyType(type)}
        onOpenLogin={handleOpenLogin}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentTab === 'discovery' && (
          <CustomerHome
            onSelectShop={handleSelectShop}
            selectedCity={selectedCity}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenVendorOnboarding={() => setShowVendorOnboarding(true)}
          />
        )}

        {currentTab === 'storefront' && (
          <ShopStorefront
            shopSlug={activeShopSlug}
            onBack={() => setCurrentTab('discovery')}
          />
        )}

        {currentTab === 'customer_orders' && (
          <CustomerOrders
            onExploreShops={() => setCurrentTab('discovery')}
          />
        )}

        {currentTab === 'vendor' && (currentUser?.role === 'shopkeeper' || currentUser?.role === 'super_admin') && (
          <VendorDashboard
            onViewPublicStore={handleSelectShop}
            onOpenVendorOnboarding={() => setShowVendorOnboarding(true)}
            initialShopSlug={activeShopSlug}
          />
        )}

        {currentTab === 'admin' && currentUser?.role === 'super_admin' && (
          <SuperAdminDashboard
            onInspectShop={handleSelectShop}
            onManageShop={handleManageShop}
          />
        )}
      </main>

      {/* Unified Platform Footer */}
      <Footer
        onOpenPolicies={(type) => setPolicyType(type)}
        onOpenVendorOnboarding={() => setShowVendorOnboarding(true)}
        setCurrentTab={setCurrentTab}
      />

      {/* Single-Shop Cart & Checkout Drawer (Only accessible to Customers/Visitors) */}
      <CartDrawer onOrderPlaced={handleOrderPlaced} />

      {/* Configurable Policies Modal */}
      <PoliciesModal
        policyType={policyType}
        onClose={() => setPolicyType(null)}
      />

      {/* Vendor Onboarding Modal */}
      <VendorOnboardingModal
        isOpen={showVendorOnboarding}
        onClose={() => setShowVendorOnboarding(false)}
        onSuccess={handleVendorOnboardSuccess}
      />

      {/* Dedicated Sign In / Sign Up Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
        initialRole={authModalRole}
        onOpenVendorOnboarding={() => {
          setShowAuthModal(false);
          setShowVendorOnboarding(true);
        }}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
