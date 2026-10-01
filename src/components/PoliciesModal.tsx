import React from 'react';
import { X, ShieldCheck, FileText, Truck, RefreshCcw, Handshake } from 'lucide-react';

interface PoliciesModalProps {
  policyType: string | null;
  onClose: () => void;
}

export const PoliciesModal: React.FC<PoliciesModalProps> = ({ policyType, onClose }) => {
  if (!policyType) return null;

  const getPolicyContent = () => {
    switch (policyType) {
      case 'terms':
        return {
          title: 'Terms & Conditions of Service',
          icon: <FileText className="w-6 h-6 text-emerald-600" />,
          subtitle: 'Operational Guidelines for Customers & Vendors on YUNAY',
          body: (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p>
                <strong>1. Acceptance of Terms:</strong> By accessing the YUNAY platform, browsing merchant storefronts, or creating a vendor account, you agree to comply with all applicable local commerce regulations and these terms.
              </p>
              <p>
                <strong>2. Multi-Vendor Platform Architecture:</strong> YUNAY provides digital storefront infrastructure, order transmission, billing systems, and inventory tracking tools. Each registered shop operates as an independent local merchant responsible for product quality, correct pricing, and regulatory compliance.
              </p>
              <p>
                <strong>3. Digital Invoices & Historical Record:</strong> Invoices generated automatically under the "Powered by YUNAY" platform banner represent legal purchase records. Historical order prices are permanently sealed and isolated from future merchant price updates.
              </p>
              <p>
                <strong>4. Prohibited Items & Catalogue Moderation:</strong> Products that violate local laws, expired goods, prescription-only medicines without valid licensing, or contraband are strictly forbidden. YUNAY Super Admin reserves the right to immediately prohibit or suspend non-compliant products and storefronts.
              </p>
            </div>
          ),
        };
      case 'privacy':
        return {
          title: 'Privacy & Data Protection Policy',
          icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
          subtitle: 'How YUNAY Safeguards Personal & Business Data',
          body: (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p>
                <strong>1. Information Collection:</strong> We collect customer names, verified contact numbers, and delivery addresses solely for fulfillment of neighborhood orders.
              </p>
              <p>
                <strong>2. Tenant Data Isolation:</strong> YUNAY enforces strict relational tenant isolation. No shopkeeper can access, browse, or export another shop's customer lists, sales figures, inventory metrics, or order histories.
              </p>
              <p>
                <strong>3. Location Privacy:</strong> Shopper coordinates and addresses are shared exclusively with the chosen local merchant and fulfillment personnel for delivery execution. Precise GPS locations are never broadcast publicly.
              </p>
              <p>
                <strong>4. No Storage of Payment Credentials:</strong> YUNAY never stores customer credit card numbers, CVVs, or bank credentials. Digital UPI confirmations are processed through bank-grade secure channels.
              </p>
            </div>
          ),
        };
      case 'delivery':
        return {
          title: 'Local Delivery & Pickup Policy',
          icon: <Truck className="w-6 h-6 text-emerald-600" />,
          subtitle: 'Store Dispatch Timelines, Radii & Thresholds',
          body: (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p>
                <strong>1. Hyperlocal Delivery Radius:</strong> Each merchant configures their operational delivery radius (typically 5 to 15 kilometers) to guarantee fresh handling and timely dispatch.
              </p>
              <p>
                <strong>2. Estimated Delivery Windows:</strong> Neighborhood deliveries are typically delivered within 30 to 60 minutes after the merchant marks the order as "PACKING".
              </p>
              <p>
                <strong>3. Free Delivery Thresholds:</strong> Delivery charges and free-delivery eligibility thresholds are transparently displayed in the storefront and cart before checkout.
              </p>
              <p>
                <strong>4. Store Pickup:</strong> Customers opting for "Store Pickup" receive notifications when items are "READY FOR PICKUP" with verified contact details of the shop counter.
              </p>
            </div>
          ),
        };
      case 'cancellation':
        return {
          title: 'Cancellation & Refund Policy',
          icon: <RefreshCcw className="w-6 h-6 text-emerald-600" />,
          subtitle: 'Fair Dispute Resolution and Returns',
          body: (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p>
                <strong>1. Order Cancellation Window:</strong> Shoppers may cancel orders instantly without charge prior to merchant acceptance. Once an order enters the "PACKING" or "OUT FOR DELIVERY" status, cancellations require direct merchant confirmation.
              </p>
              <p>
                <strong>2. Damaged or Missing Items:</strong> If any perishable produce, bakery delicacy, or sealed item is damaged or missing, shoppers can report the order issue within 2 hours of delivery through the customer order tracker.
              </p>
              <p>
                <strong>3. Refunds:</strong> Approved refunds for pre-paid orders are reversed to the original payment source within 24-48 banking hours.
              </p>
            </div>
          ),
        };
      case 'vendor':
      default:
        return {
          title: 'Merchant Partnership Agreement',
          icon: <Handshake className="w-6 h-6 text-emerald-600" />,
          subtitle: 'Rules of Engagement for Storefront Operators on YUNAY',
          body: (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p>
                <strong>1. Merchant Responsibility:</strong> The vendor guarantees that all product photos, descriptions, inventory quantities, and unit pricing entered into the YUNAY vendor portal are accurate and up to date.
              </p>
              <p>
                <strong>2. Mandatory YUNAY Branding:</strong> All public digital storefronts, QR codes, and generated bills must prominently maintain the "Powered by YUNAY" platform designation.
              </p>
              <p>
                <strong>3. Genuine Reviews & Anti-Tampering:</strong> Customer reviews on YUNAY are unedited and authentic. Merchants are strictly prohibited from manipulating review scores or coercing customers.
              </p>
              <p>
                <strong>4. Commission & Payouts:</strong> Transparent platform commissions (configured by the Super Admin) apply only upon successful delivery.
              </p>
            </div>
          ),
        };
    }
  };

  const content = getPolicyContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
            {content.icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{content.title}</h3>
            <p className="text-xs text-slate-500">{content.subtitle}</p>
          </div>
        </div>

        <div className="py-4 overflow-y-auto flex-1 pr-1">
          {content.body}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
            YUNAY Platform Standard
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
