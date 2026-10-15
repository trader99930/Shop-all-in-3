import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppLanguage = 'hi' | 'en';

export interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  isHindi: boolean;
  t: (key: string, fallback?: string) => string;
  pick: (hiText: string, enText: string) => string;
}

const translations: Record<AppLanguage, Record<string, string>> = {
  hi: {
    // Brand & Header
    'brand.tagline': 'स्थानीय डिजिटल स्टोरफ्रंट्स',
    'nav.all_shops': 'सभी दुकानें',
    'nav.marketplace': 'मार्केटप्लेस',
    'nav.my_company_profile': '🏢 मेरी कंपनी प्रोफाइल',
    'nav.my_dashboard': '📦 ऑर्डर और उत्पाद',
    'nav.my_orders': 'मेरे ऑर्डर',
    'nav.admin_hub': 'एडमिन हब',
    'nav.signin': 'लॉग इन',
    'nav.signup': 'साइन अप',
    'nav.signout': 'लॉग आउट',
    'nav.cart': 'कार्ट',
    'nav.notifications': 'सूचनाएं',
    'nav.search_placeholder': 'दुकानें, किराना, बेकरी, कपड़े आदि खोजें...',
    'nav.all_cities': 'सभी शहर',
    'nav.theme': 'थीम रंग',
    'nav.language': 'भाषा',
    'nav.select_language': 'भाषा चुनें',
    'nav.choose_theme': 'थीम रंग चुनें',
    'nav.theme_help': 'पसंद का रंग चुनें, पूरी ऐप तुरंत बदल जाएगी',
    'nav.hindi_desc': 'पूरी ऐप केवल हिन्दी में दिखेगी',
    'nav.english_desc': 'पूरी ऐप केवल English में दिखेगी',

    // Merchant Banner
    'merchant.portal_badge': 'दुकानदार पोर्टल',
    'merchant.welcome': 'नमस्ते',
    'merchant.welcome_title': 'आपकी अपनी डिजिटल दुकान',
    'merchant.welcome_desc': 'मार्केटप्लेस में केवल आपकी अपनी जोड़ी गई दुकान और उत्पाद प्रदर्शित हैं। यहाँ से आप अपनी दुकान की लाइव स्थिति देख सकते हैं और कंपनी प्रोफाइल मैनेज कर सकते हैं।',
    'merchant.btn_company_profile': '🏢 मेरी कंपनी प्रोफाइल',
    'merchant.btn_view_live': '🏪 लाइव स्टोर देखें',

    // Customer Discovery Banner
    'hero.badge': 'स्थानीय हाइपरलोकल कॉमर्स',
    'hero.title': 'स्थानीय दुकानों का साथ दें। सीधे ऑनलाइन ऑर्डर करें।',
    'hero.subtitle': 'ताज़ा किराना, बेकरी, फैशन, स्टेशनरी और रोज़मर्रा का सामान अपने आस-पास के भरोसेमंद दुकानदारों से मंगवाएं। एक्सप्रेस होम डिलीवरी या काउंटर पिकअप।',
    'hero.feature_delivery': '30-60 मिनट एक्सप्रेस डिलीवरी',
    'hero.feature_pricing': 'दुकान की उचित दरें और ताजगी',
    'hero.feature_billing': 'स्वचालित पक्का बिल व इनवॉइस',

    // Categories
    'cat.browse': 'श्रेणी अनुसार खोजें',
    'cat.all': 'सभी श्रेणियां',
    'cat.count_suffix': 'श्रेणियां उपलब्ध',

    // Shops Listing
    'shops.heading_merchant': 'मार्केटप्लेस - केवल आपकी जोड़ी गई दुकान',
    'shops.heading_customer': 'सभी स्थानीय दुकानें और डिजिटल स्टोर',
    'shops.subheading_merchant': 'मार्केटप्लेस में केवल आपकी अपनी जोड़ी गई दुकान प्रदर्शित है, किसी अन्य विक्रेता की नहीं।',
    'shops.subheading_customer': 'सत्यापित स्थानीय व्यापार',
    'shops.your_store': '👑 आपकी दुकान',
    'shops.open': 'खुला है',
    'shops.closed': 'अभी बंद है',
    'shops.delivery': 'डिलीवरी',
    'shops.delivery_free': 'मुफ़्त',
    'shops.btn_manage': '🏢 कंपनी प्रोफाइल मैनेज करें',
    'shops.btn_enter': 'स्टोर खोलें',
    'shops.empty_merchant_title': 'आपकी कोई दुकान अभी तक नहीं जुड़ी है',
    'shops.empty_merchant_desc': 'मार्केटप्लेस में लाइव आने के लिए नीचे दिए गए बटन से अपनी दुकान जोड़ें।',
    'shops.empty_customer_title': 'कोई दुकान नहीं मिली',
    'shops.empty_customer_desc': 'किसी अन्य शहर या श्रेणी का चयन करें, या अपने इलाके की पहली दुकान खोलें!',
    'shops.btn_add_store': '➕ अपनी डिजिटल दुकान बनाएं',
    'shops.powered_by': 'पावर्ड बाय',

    // Products Section
    'prod.heading_merchant': 'आपकी दुकान के उत्पाद',
    'prod.heading_customer': 'लोकप्रिय स्थानीय उत्पाद',
    'prod.subheading_merchant': 'केवल आपकी अपनी दुकान में जोड़े गए उत्पाद',
    'prod.subheading_customer': 'सक्रिय दुकानों के ताज़ा और सबसे ज्यादा बिकने वाले सामान',
    'prod.btn_add_cart': 'जोड़ें +',
    'prod.btn_view': 'देखें',
    'prod.save': 'बचत',
    'prod.from': 'दुकान',

    // Vendor Dashboard Tabs
    'vendor.tab_orders': 'ऑर्डर और बिलिंग',
    'vendor.tab_products': 'उत्पाद और प्रकार',
    'vendor.tab_inventory': 'इन्वेंट्री और स्टॉक',
    'vendor.tab_customers': 'ग्राहक सूची',
    'vendor.tab_offers': 'दुकान के ऑफर',
    'vendor.tab_company_profile': '🏢 कंपनी प्रोफाइल और विवरण',

    // Vendor Dashboard Stats & Alerts
    'vendor.stat_today_sales': 'आज की बिक्री',
    'vendor.stat_total_orders': 'कुल ऑर्डर',
    'vendor.stat_pending_orders': 'नए / पेंडिंग ऑर्डर',
    'vendor.stat_total_customers': 'सक्रिय ग्राहक',
    'vendor.stat_low_stock': 'कम स्टॉक अलर्ट',
    'vendor.upi_banner_title': 'सीधा दुकानदार के खाते में UPI भुगतान',
    'vendor.upi_active': 'सक्रिय',
    'vendor.upi_inactive': 'UPI आईडी सेट नहीं है',
    'vendor.btn_upi_preview': 'UPI QR कोड देखें',
    'vendor.btn_upi_setup': 'अभी UPI ID सेट करें',
    'vendor.btn_store_qr': 'दुकान का स्टैंडी QR कोड',
    'vendor.btn_view_storefront': 'पब्लिक स्टोर देखें',
    'vendor.no_shop_title': 'आपकी कोई दुकान नहीं मिली',
    'vendor.no_shop_desc': 'आपकी आईडी से अभी तक कोई दुकान नहीं जुड़ी है। अपने बिज़नेस का डिजिटल स्टोरफ्रंट शुरू करने के लिए नीचे दिए गए बटन पर क्लिक करें।',

    // Company Profile Form
    'profile.owner_card_title': 'दुकानदार खाता प्रोफाइल',
    'profile.owner_card_subtitle': 'केवल आपका अपना प्रोफाइल और आपकी पंजीकृत कंपनी का विवरण',
    'profile.verified_badge': '✓ सत्यापित दुकानदार',
    'profile.owner_name': 'दुकानदार का नाम',
    'profile.owner_phone': 'पंजीकृत मोबाइल नंबर',
    'profile.owner_email': 'ईमेल व आईडी',
    'profile.owner_shops_count': 'कुल पंजीकृत दुकानें',
    'profile.form_title': 'कंपनी प्रोफाइल और परिचालन विवरण संपादित करें',
    'profile.form_subtitle': 'दुकान का नाम, समय, पता, डिलीवरी शुल्क और घोषणाएं बदलें।',
    'profile.store_name': 'दुकान का नाम',
    'profile.store_category': 'व्यापार श्रेणी',
    'profile.contact_phone': 'संपर्क फ़ोन नंबर',
    'profile.upi_label': 'दुकानदार की UPI आईडी दर्ज करें',
    'profile.btn_save_upi': 'UPI ID सहेजें',
    'profile.announcement': 'दुकान की विशेष घोषणा',
    'profile.description': 'दुकान का विवरण',
    'profile.photos_title': 'दुकान की फोटो और लोगो',
    'profile.photos_subtitle': 'कैमरा से सीधी फोटो लें या गैलरी से अपनी दुकान का लोगो और मुख्य बैनर लगाएं',
    'profile.logo_label': 'दुकान का लोगो',
    'profile.banner_label': 'दुकान का मुख्य बैनर',
    'profile.address': 'दुकान का पता',
    'profile.city': 'शहर',
    'profile.opening_time': 'खुलने का समय',
    'profile.closing_time': 'बंद होने का समय',
    'profile.min_order': 'न्यूनतम ऑर्डर राशि (₹)',
    'profile.delivery_fee': 'सामान्य डिलीवरी शुल्क (₹)',
    'profile.free_threshold': 'मुफ़्त डिलीवरी सीमा (₹)',
    'profile.temp_closed': 'दुकान को अस्थायी रूप से बंद करें',
    'profile.btn_save_settings': 'सभी कंपनी प्रोफाइल बदलाव सहेजें',

    // Auth Modal
    'auth.signin_tab': 'लॉग इन',
    'auth.signup_tab': 'साइन अप',
    'auth.signin_title': 'YUNAY में लॉग इन करें',
    'auth.signup_title': 'YUNAY में खाता बनाएं',
    'auth.choose_role_signin': 'लॉग इन करने के लिए अपना खाता प्रकार चुनें',
    'auth.choose_role_signup': 'साइन अप करने के लिए अपना खाता प्रकार चुनें',
    'auth.shopkeeper_title': 'दुकानदार',
    'auth.shopkeeper_badge': 'दुकानदार',
    'auth.shopkeeper_signin_desc': 'अपनी दुकान प्रबंधित करने, ग्राहक ऑर्डर देखने और बिक्री ट्रैक करने के लिए लॉग इन करें।',
    'auth.shopkeeper_signin_btn': 'दुकानदार के रूप में लॉग इन करें',
    'auth.customer_title': 'ग्राहक',
    'auth.customer_badge': 'ग्राहक',
    'auth.customer_signin_desc': 'स्थानीय दुकानों से खरीदारी करने और ऑर्डर ट्रैक करने के लिए लॉग इन करें।',
    'auth.customer_signin_btn': 'ग्राहक के रूप में लॉग इन करें',
    'auth.admin_title': 'प्लेटफ़ॉर्म एडमिन',
    'auth.admin_desc': 'प्रशासनिक कंसोल',
    'auth.email_label': 'ईमेल आईडी / फ़ोन नंबर',
    'auth.password_label': 'पासवर्ड',
    'auth.name_label': 'पूरा नाम',
    'auth.phone_label': 'मोबाइल नंबर',
    'auth.submit_signin': 'लॉग इन करें',
    'auth.submit_signup': 'खाता बनाएं',
    'auth.switch_to_customer': '👉 ग्राहक लॉगिन पर जाएं',
    'auth.switch_to_shopkeeper': '👉 दुकानदार लॉगिन पर जाएं',
    'auth.back_to_role': 'खाता प्रकार बदलें',
    'auth.forgot_password': 'पासवर्ड भूल गए?',

    // QR Payment Modal
    'qr.payment_badge': 'सीधा दुकानदार को UPI भुगतान',
    'qr.total_pay': 'कुल देय राशि',
    'qr.payee_upi': 'दुकानदार की UPI आईडी',
    'qr.scan_any_app': 'किसी भी UPI ऐप से स्कैन करें',
    'qr.copied': 'कॉपी हो गया',
    'qr.copy': 'कॉपी करें',
    'qr.utr_label': 'UPI संदर्भ / UTR नंबर (12 अंक - ऐच्छिक)',
    'qr.confirm_btn': 'भुगतान की पुष्टि करें',
    'qr.generating': 'UPI QR कोड तैयार हो रहा है...',
    'qr.standee_title': 'दुकान का काउंटर QR स्टैंडी',

    // Image Upload
    'upload.camera_btn': 'कैमरा से फोटो खींचें',
    'upload.gallery_btn': 'गैलरी से फोटो चुनें',
    'upload.change_btn': 'फोटो बदलें',
    'upload.remove_btn': 'फोटो हटाएं',
    'upload.ready_badge': 'फोटो तैयार है',
    'upload.processing': 'फोटो कंप्रेस व प्रोसेस हो रही है...',
    'upload.placeholder': 'कैमरा या गैलरी से फोटो लगाएं',
    'upload.retake': 'दोबारा फोटो लें',
    'upload.hint': 'कैमरा से सीधी फोटो लें या गैलरी से चुनें',

    // Storefront View
    'storefront.back': 'मार्केटप्लेस पर वापस जाएं',
    'storefront.search_store': 'इस दुकान में सामान खोजें...',
    'storefront.all_items': 'सभी सामान',
    'storefront.closed_badge': 'दुकान अभी बंद है',
    'storefront.open_badge': 'ऑर्डर स्वीकार कर रहे हैं',
    'storefront.not_found_title': 'स्टोरफ्रंट नहीं मिला',
    'storefront.not_found_desc': 'यह दुकान उपलब्ध नहीं है या बंद कर दी गई है।',

    // Cart & Checkout
    'cart.title': 'आपकी शॉपिंग कार्ट',
    'cart.empty_title': 'आपकी कार्ट खाली है',
    'cart.empty_desc': 'स्थानीय दुकानों से ताज़ा सामान अपनी कार्ट में जोड़ें।',
    'cart.checkout_btn': 'ऑर्डर करें',
    'cart.total': 'कुल राशि',
    'cart.delivery_fee': 'डिलीवरी शुल्क',
    'cart.subtotal': 'सामान का मूल्य',

    // Common
    'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें',
    'common.edit': 'संपादित करें',
    'common.delete': 'हटाएं',
    'common.loading': 'लोड हो रहा है...',
    'common.success': 'सफलतापूर्वक सहेजा गया!',
    'common.active': 'सक्रिय',
    'common.close': 'बंद करें',
  },
  en: {
    // Brand & Header
    'brand.tagline': 'Local Digital Storefronts',
    'nav.all_shops': 'All Shop Stores',
    'nav.marketplace': 'Marketplace',
    'nav.my_company_profile': '🏢 My Company Profile',
    'nav.my_dashboard': '📦 Orders & Products',
    'nav.my_orders': 'My Orders',
    'nav.admin_hub': 'Admin Hub',
    'nav.signin': 'Sign In',
    'nav.signup': 'Sign Up',
    'nav.signout': 'Sign Out',
    'nav.cart': 'Cart',
    'nav.notifications': 'Notifications',
    'nav.search_placeholder': 'Search local stores, groceries, bakery, apparel...',
    'nav.all_cities': 'All Cities',
    'nav.theme': 'Theme Color',
    'nav.language': 'Language',
    'nav.select_language': 'Select Language',
    'nav.choose_theme': 'Choose Theme Color',
    'nav.theme_help': 'Select a theme color to customize the entire application',
    'nav.hindi_desc': 'Entire app displays purely in Hindi',
    'nav.english_desc': 'Entire app displays purely in English',

    // Merchant Banner
    'merchant.portal_badge': 'Merchant Storefront Portal',
    'merchant.welcome': 'Welcome',
    'merchant.welcome_title': 'Your Digital Storefront',
    'merchant.welcome_desc': 'Only your registered store and products are displayed in your merchant portal. View your live storefront and manage company details from here.',
    'merchant.btn_company_profile': '🏢 My Company Profile',
    'merchant.btn_view_live': '🏪 View Live Store',

    // Customer Discovery Banner
    'hero.badge': 'Hyperlocal Neighborhood Commerce',
    'hero.title': 'Support Local Shops. Order Directly Online.',
    'hero.subtitle': 'Order fresh groceries, bakery goods, fashion, stationery, and daily essentials from your trusted local shopkeepers. Express delivery or counter pickup.',
    'hero.feature_delivery': '30-60 Min Express Delivery',
    'hero.feature_pricing': 'Direct Store Pricing & Freshness',
    'hero.feature_billing': 'Automated Legal Invoicing',

    // Categories
    'cat.browse': 'Browse by Category',
    'cat.all': 'All Categories',
    'cat.count_suffix': 'categories available',

    // Shops Listing
    'shops.heading_merchant': 'Marketplace - Your Registered Storefront Only',
    'shops.heading_customer': 'All Shop Stores & Digital Storefronts',
    'shops.subheading_merchant': 'Marketplace displays only your own registered store. Other merchants are isolated.',
    'shops.subheading_customer': 'Showing verified local businesses',
    'shops.your_store': '👑 Your Store',
    'shops.open': 'Open Now',
    'shops.closed': 'Closed Now',
    'shops.delivery': 'Delivery',
    'shops.delivery_free': 'Free',
    'shops.btn_manage': '🏢 Manage Company Profile',
    'shops.btn_enter': 'Enter Store',
    'shops.empty_merchant_title': 'No store registered yet',
    'shops.empty_merchant_desc': 'Click below to register your store and get live on the marketplace.',
    'shops.empty_customer_title': 'No shops found',
    'shops.empty_customer_desc': 'Try selecting a different city or category, or open the first store here!',
    'shops.btn_add_store': '➕ Create Your Digital Storefront',
    'shops.powered_by': 'Powered by',

    // Products Section
    'prod.heading_merchant': 'Your Store Products',
    'prod.heading_customer': 'Popular Neighborhood Products',
    'prod.subheading_merchant': 'Products added exclusively to your storefront',
    'prod.subheading_customer': 'Fresh items and bestsellers from active neighborhood shops',
    'prod.btn_add_cart': 'Add +',
    'prod.btn_view': 'View',
    'prod.save': 'SAVE',
    'prod.from': 'From',

    // Vendor Dashboard Tabs
    'vendor.tab_orders': 'Orders & Invoicing',
    'vendor.tab_products': 'Products & Variants',
    'vendor.tab_inventory': 'Inventory & Low Stock',
    'vendor.tab_customers': 'Customer Directory',
    'vendor.tab_offers': 'Store Offers & Coupons',
    'vendor.tab_company_profile': '🏢 Company Profile & Details',

    // Vendor Dashboard Stats & Alerts
    'vendor.stat_today_sales': "Today's Revenue",
    'vendor.stat_total_orders': 'Total Orders',
    'vendor.stat_pending_orders': 'Pending Orders',
    'vendor.stat_total_customers': 'Active Patrons',
    'vendor.stat_low_stock': 'Low Stock Alerts',
    'vendor.upi_banner_title': 'Direct Merchant UPI Payment',
    'vendor.upi_active': 'Active & Ready',
    'vendor.upi_inactive': 'UPI ID Not Configured',
    'vendor.btn_upi_preview': 'Preview UPI QR',
    'vendor.btn_upi_setup': 'Set Up UPI ID Now',
    'vendor.btn_store_qr': 'Standee / Store QR',
    'vendor.btn_view_storefront': 'View Public Storefront',
    'vendor.no_shop_title': 'No Storefront Found',
    'vendor.no_shop_desc': 'You do not have a shop registered to this account yet. Click below to launch your digital storefront.',

    // Company Profile Form
    'profile.owner_card_title': 'Shop Owner Account Info',
    'profile.owner_card_subtitle': 'Only your personal profile and registered company details',
    'profile.verified_badge': '✓ Verified Shop Owner',
    'profile.owner_name': 'Owner Name',
    'profile.owner_phone': 'Registered Phone',
    'profile.owner_email': 'Owner Email / ID',
    'profile.owner_shops_count': 'Your Registered Shops',
    'profile.form_title': 'Edit Company Profile & Operational Details',
    'profile.form_subtitle': 'Configure store hours, operational address, phone, and announcements.',
    'profile.store_name': 'Store Name',
    'profile.store_category': 'Store Category',
    'profile.contact_phone': 'Business Contact Phone',
    'profile.upi_label': 'Vendor UPI ID / VPA',
    'profile.btn_save_upi': 'Save UPI ID',
    'profile.announcement': 'Store Announcement',
    'profile.description': 'Store Description',
    'profile.photos_title': 'Store Logo & Banner Photos',
    'profile.photos_subtitle': 'Take live camera photos or choose from gallery for your store logo and storefront banner',
    'profile.logo_label': 'Shop Logo Photo',
    'profile.banner_label': 'Storefront Banner Photo',
    'profile.address': 'Store Address',
    'profile.city': 'City',
    'profile.opening_time': 'Opening Time',
    'profile.closing_time': 'Closing Time',
    'profile.min_order': 'Minimum Order Amount (₹)',
    'profile.delivery_fee': 'Standard Delivery Fee (₹)',
    'profile.free_threshold': 'Free Delivery Threshold (₹)',
    'profile.temp_closed': 'Mark Store Temporarily Closed',
    'profile.btn_save_settings': 'Save All Company Profile Changes',

    // Auth Modal
    'auth.signin_tab': 'Sign In',
    'auth.signup_tab': 'Sign Up',
    'auth.signin_title': 'Sign In to YUNAY',
    'auth.signup_title': 'Create a YUNAY Account',
    'auth.choose_role_signin': 'Choose your account type to sign in',
    'auth.choose_role_signup': 'Select your account type to register',
    'auth.shopkeeper_title': 'Shop Owner',
    'auth.shopkeeper_badge': 'Shop Owner',
    'auth.shopkeeper_signin_desc': 'Sign in to manage your shop, view customer orders, update catalog, and track sales.',
    'auth.shopkeeper_signin_btn': 'Sign In as Shop Owner',
    'auth.customer_title': 'Customer',
    'auth.customer_badge': 'Customer',
    'auth.customer_signin_desc': 'Sign in to browse local stores, track pending deliveries, and manage your cart.',
    'auth.customer_signin_btn': 'Sign In as Customer',
    'auth.admin_title': 'Platform Administrator',
    'auth.admin_desc': 'Master console for authorized administrators',
    'auth.email_label': 'Email Address / Mobile Number',
    'auth.password_label': 'Password',
    'auth.name_label': 'Full Name',
    'auth.phone_label': 'Mobile Number',
    'auth.submit_signin': 'Sign In',
    'auth.submit_signup': 'Create Account',
    'auth.switch_to_customer': '👉 Switch to Customer Sign In',
    'auth.switch_to_shopkeeper': '👉 Switch to Shop Owner Sign In',
    'auth.back_to_role': 'Change Account Type',
    'auth.forgot_password': 'Forgot Password?',

    // QR Payment Modal
    'qr.payment_badge': 'Direct Vendor UPI Payment',
    'qr.total_pay': 'Total Amount to Pay',
    'qr.payee_upi': 'Payee UPI ID',
    'qr.scan_any_app': 'Scan with Any UPI App',
    'qr.copied': 'Copied',
    'qr.copy': 'Copy',
    'qr.utr_label': 'UPI Reference / UTR Number (Optional 12-digit)',
    'qr.confirm_btn': 'Confirm Payment',
    'qr.generating': 'Generating UPI QR code...',
    'qr.standee_title': 'Store Counter QR Standee',

    // Image Upload
    'upload.camera_btn': 'Take Photo with Camera',
    'upload.gallery_btn': 'Choose from Gallery',
    'upload.change_btn': 'Change Photo',
    'upload.remove_btn': 'Remove Photo',
    'upload.ready_badge': 'Photo Ready',
    'upload.processing': 'Processing & compressing photo...',
    'upload.placeholder': 'Upload photo using camera or gallery',
    'upload.retake': 'Retake Photo',
    'upload.hint': 'Take a direct camera photo or pick from gallery',

    // Storefront View
    'storefront.back': 'Back to Marketplace',
    'storefront.search_store': 'Search products in this store...',
    'storefront.all_items': 'All Products',
    'storefront.closed_badge': 'Store is Closed',
    'storefront.open_badge': 'Accepting Orders',
    'storefront.not_found_title': 'Storefront Not Found',
    'storefront.not_found_desc': 'The requested store does not exist or has been paused.',

    // Cart & Checkout
    'cart.title': 'Your Shopping Cart',
    'cart.empty_title': 'Your cart is empty',
    'cart.empty_desc': 'Add fresh items from local stores to your cart.',
    'cart.checkout_btn': 'Place Order',
    'cart.total': 'Total Amount',
    'cart.delivery_fee': 'Delivery Fee',
    'cart.subtotal': 'Item Subtotal',

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.loading': 'Loading...',
    'common.success': 'Saved successfully!',
    'common.active': 'Active',
    'common.close': 'Close',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('yunay_language_choice') as AppLanguage;
    if (saved === 'en' || saved === 'hi') {
      return saved;
    }
    return 'hi'; // Default to Hindi as preferred by user
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('yunay_language_choice', lang);
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language] || translations.hi;
    if (langDict[key]) {
      return langDict[key];
    }
    const enDict = translations.en;
    if (enDict[key]) {
      return enDict[key];
    }
    return fallback || key;
  };

  const pick = (hiText: string, enText: string): string => {
    return language === 'hi' ? hiText : enText;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isHindi: language === 'hi',
        t,
        pick,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
