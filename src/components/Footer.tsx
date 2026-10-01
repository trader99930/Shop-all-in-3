import React from 'react';
import { Store, ShieldCheck, HeartHandshake, Phone, Mail, Award, ExternalLink } from 'lucide-react';

interface FooterProps {
  onOpenPolicies: (type: string) => void;
  onOpenVendorOnboarding: () => void;
  setCurrentTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPolicies,
  onOpenVendorOnboarding,
  setCurrentTab,
}) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      {/* Platform Highlight Banner */}
      <div className="bg-gradient-to-r from-emerald-900/60 via-slate-900 to-teal-950/60 border-b border-slate-800 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Empowering Local Merchants with Digital Commerce
              </h3>
              <p className="text-sm text-slate-400 max-w-xl">
                YUNAY equips independent neighborhood grocers, bakeries, fashion boutiques, and specialty shops with online storefronts, inventory tracking, and automatic billing.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenVendorOnboarding}
            className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 transition cursor-pointer"
          >
            Create Your Digital Store
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
                Y
              </div>
              <span className="text-2xl font-black tracking-tight text-white">YUNAY</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India's scalable multi-vendor local commerce ecosystem. Connecting neighborhood shops directly with their local customers.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-emerald-400 font-semibold">
              <Award className="w-4 h-4" />
              <span>Powered by YUNAY</span>
            </div>
          </div>

          {/* Shoppers Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              For Shoppers
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <button
                  onClick={() => setCurrentTab('discovery')}
                  className="hover:text-emerald-400 transition"
                >
                  Browse Neighborhood Shops
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('customer_orders')}
                  className="hover:text-emerald-400 transition"
                >
                  Track Recent Orders
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicies('delivery')}
                  className="hover:text-emerald-400 transition"
                >
                  Local Express Delivery
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicies('cancellation')}
                  className="hover:text-emerald-400 transition"
                >
                  Cancellation & Refund Terms
                </button>
              </li>
            </ul>
          </div>

          {/* Merchants Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              For Merchants
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <button
                  onClick={onOpenVendorOnboarding}
                  className="hover:text-emerald-400 transition"
                >
                  Vendor Onboarding & Registration
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('vendor')}
                  className="hover:text-emerald-400 transition"
                >
                  Merchant Order & Stock Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicies('vendor')}
                  className="hover:text-emerald-400 transition"
                >
                  Merchant Partnership Agreement
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicies('terms')}
                  className="hover:text-emerald-400 transition"
                >
                  Platform Fair Commission Rules
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Legal & Support
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <button
                  onClick={() => onOpenPolicies('terms')}
                  className="hover:text-emerald-400 transition flex items-center gap-1"
                >
                  <span>Terms & Conditions</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicies('privacy')}
                  className="hover:text-emerald-400 transition flex items-center gap-1"
                >
                  <span>Privacy Policy</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </button>
              </li>
              <li className="pt-2 text-slate-400 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>+91 98765 43210</span>
              </li>
              <li className="text-slate-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>support@yunay.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} YUNAY Platform Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium">Every Storefront is</span>
            <span className="font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800/60">
              Powered by YUNAY
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
