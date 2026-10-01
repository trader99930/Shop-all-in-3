import { db } from './index.ts';
import {
  users,
  shops,
  categories,
  products,
  productVariants,
  orders,
  orderItems,
  invoices,
  reviews,
  offers,
  platformSettings,
  notifications,
  adminLogs,
} from './schema.ts';
import { count } from 'drizzle-orm';

export async function seedDatabaseIfEmpty() {
  try {
    // Only seed demo data if explicitly opted-in via SEED_DEMO_DATA=true
    if (process.env.SEED_DEMO_DATA !== 'true') {
      console.log('Production mode: SEED_DEMO_DATA is not true. Skipping demo data seeding.');
      return;
    }

    const existingUsers = await db.select({ val: count() }).from(users);
    if (existingUsers[0]?.val > 0) {
      console.log('Database already contains records. Skipping demo seed.');
      return;
    }

    console.log('Seeding initial YUNAY platform data in development mode...');

    // 1. Platform Settings
    await db.insert(platformSettings).values([
      { key: 'platform_name', value: 'YUNAY', description: 'Multi-Tenant Local Commerce Platform' },
      { key: 'platform_tagline', value: 'Local Commerce, Scaled for Everyone', description: 'Tagline' },
      { key: 'support_email', value: 'support@yunay.in', description: 'Platform Support Email' },
      { key: 'support_phone', value: '+91 98765 43210', description: 'Platform Help Desk Number' },
      { key: 'commission_model', value: 'percentage', description: 'Platform fee model (percentage, subscription, flat)' },
      { key: 'commission_rate', value: '3.5', description: 'Platform commission percent per completed order' },
      { key: 'tax_rate', value: '5', description: 'Default GST / local sales tax rate (%)' },
      { key: 'terms_and_conditions', value: 'All local merchants and shoppers are protected under YUNAY fair trade terms. Digital bills generated on YUNAY carry legally compliant transaction IDs.', description: 'Terms of Service' },
      { key: 'privacy_policy', value: 'Customer privacy is safeguarded. Delivery coordinates and mobile numbers are shared strictly for order fulfillment.', description: 'Privacy Policy' },
      { key: 'cancellation_policy', value: 'Orders can be cancelled before store acceptance or during initial packaging. Once out for delivery, cancellations require merchant confirmation.', description: 'Cancellation Policy' },
      { key: 'delivery_policy', value: 'Local shop deliveries are dispatched within 30-60 minutes depending on shop proximity and order preparation time.', description: 'Delivery Policy' },
    ]);

    // 2. Global Categories
    const categoryList = [
      { name: 'Grocery', slug: 'grocery', icon: 'ShoppingBag', description: 'Daily staples, grains, oils & packaged goods', sortOrder: 1 },
      { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', icon: 'Apple', description: 'Farm-fresh local produce & organics', sortOrder: 2 },
      { name: 'Bakery', slug: 'bakery', icon: 'Cake', description: 'Cakes, artisan breads, biscuits & pastries', sortOrder: 3 },
      { name: 'Clothing', slug: 'clothing', icon: 'Shirt', description: 'Ethnic wear, casuals, men, women & kids fashion', sortOrder: 4 },
      { name: 'Footwear', slug: 'footwear', icon: 'Footprints', description: 'Shoes, sandals, sneakers & traditional juttis', sortOrder: 5 },
      { name: 'Electronics', slug: 'electronics', icon: 'Tv', description: 'Home appliances, smart gadgets & audio', sortOrder: 6 },
      { name: 'Mobile Accessories', slug: 'mobile-accessories', icon: 'Smartphone', description: 'Chargers, cases, cables & screen guards', sortOrder: 7 },
      { name: 'Hardware', slug: 'hardware', icon: 'Wrench', description: 'Tools, electricals, paints & plumbing essentials', sortOrder: 8 },
      { name: 'Stationery', slug: 'stationery', icon: 'BookOpen', description: 'Office supplies, books, pens & art materials', sortOrder: 9 },
      { name: 'Cosmetics', slug: 'cosmetics', icon: 'Sparkles', description: 'Skincare, makeup, perfumes & personal grooming', sortOrder: 10 },
      { name: 'Home & Kitchen', slug: 'home-kitchen', icon: 'Home', description: 'Cookware, dinnerware, organizers & decor', sortOrder: 11 },
      { name: 'Furniture', slug: 'furniture', icon: 'Armchair', description: 'Chairs, tables, storage & study furniture', sortOrder: 12 },
      { name: 'Pharmacy & Wellness', slug: 'pharmacy', icon: 'HeartPulse', description: 'Health supplements, OTC first-aid & wellness', sortOrder: 13 },
      { name: 'Restaurants & Food', slug: 'restaurants-food', icon: 'UtensilsCrossed', description: 'Local delicacies, snacks, sweets & ready meals', sortOrder: 14 },
      { name: 'Services', slug: 'services', icon: 'Briefcase', description: 'Tailoring, repair, dry cleaning & maintenance', sortOrder: 15 },
      { name: 'Other', slug: 'other', icon: 'Store', description: 'Specialty stores & artisan crafts', sortOrder: 16 },
    ];
    await db.insert(categories).values(categoryList);

    // 3. Seed Users
    // Super admin (Pre-provisioned Admin: ID "Yunu", Password "1122")
    const [adminUser] = await db.insert(users).values({
      uid: 'admin-yunu',
      email: 'admin@yunay.in',
      name: 'YUNAY Admin',
      phone: '0000000000',
      role: 'super_admin',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    }).returning();

    // Vendor 1: Ramesh Sharma (Sharma General Store)
    const [vendor1] = await db.insert(users).values({
      uid: 'vendor-sharma-1',
      email: 'ramesh.sharma@sharmastore.in',
      name: 'Ramesh Sharma',
      phone: '+91 98234 56781',
      role: 'shopkeeper',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    }).returning();

    // Vendor 2: Anita Desai (Green Harvest Fresh Mart)
    const [vendor2] = await db.insert(users).values({
      uid: 'vendor-harvest-2',
      email: 'anita.desai@greenharvest.in',
      name: 'Anita Desai',
      phone: '+91 98450 12345',
      role: 'shopkeeper',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    }).returning();

    // Vendor 3: Chef Kabir Mehra (Royal Treats Bakery)
    const [vendor3] = await db.insert(users).values({
      uid: 'vendor-bakery-3',
      email: 'kabir@royaltreats.in',
      name: 'Chef Kabir Mehra',
      phone: '+91 98190 98765',
      role: 'shopkeeper',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    }).returning();

    // Vendor 4: Vikram Rathore (CityStyle Apparels)
    const [vendor4] = await db.insert(users).values({
      uid: 'vendor-clothing-4',
      email: 'vikram@citystyle.in',
      name: 'Vikram Rathore',
      phone: '+91 99280 44556',
      role: 'shopkeeper',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    }).returning();

    // Vendor 5: Pradeep Gupta (NexTech Gadgets)
    const [vendor5] = await db.insert(users).values({
      uid: 'vendor-nextech-5',
      email: 'pradeep@nextechgadgets.in',
      name: 'Pradeep Gupta',
      phone: '+91 97000 66778',
      role: 'shopkeeper',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    }).returning();

    // Customer 1: Rahul Verma
    const [customer1] = await db.insert(users).values({
      uid: 'customer-rahul-1',
      email: 'rahul.verma@example.com',
      name: 'Rahul Verma',
      phone: '+91 98765 11223',
      role: 'customer',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    }).returning();

    // Customer 2: Priya Sundaram
    const [customer2] = await db.insert(users).values({
      uid: 'customer-priya-2',
      email: 'priya.s@example.com',
      name: 'Priya Sundaram',
      phone: '+91 98123 44556',
      role: 'customer',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    }).returning();

    // 4. Seed Shops
    const [shop1] = await db.insert(shops).values({
      ownerId: vendor1.id,
      name: 'Sharma General Store',
      slug: 'sharma-general-store',
      category: 'Grocery',
      description: 'Serving neighborhood households with premium grains, spices, oils, dairy, and trusted packaged groceries since 1998.',
      address: 'Shop 14, Main Market, Block C, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      businessPhone: '+91 11 2341 5566',
      logoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=300&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
      themeColor: '#059669', // Emerald
      status: 'active',
      isTemporarilyClosed: false,
      openingTime: '08:00',
      closingTime: '22:00',
      weeklyClosedDay: 'None',
      homeDeliveryEnabled: true,
      pickupEnabled: true,
      deliveryRadiusKm: '8',
      minOrderAmount: '150',
      deliveryFee: '25',
      freeDeliveryThreshold: '500',
      announcement: 'Special Festive Discount: Get 10% off on monthly ration kits above ₹1,500!',
    }).returning();

    const [shop2] = await db.insert(shops).values({
      ownerId: vendor2.id,
      name: 'Green Harvest Fresh Mart',
      slug: 'green-harvest-fresh-mart',
      category: 'Fruits & Vegetables',
      description: '100% farm-sourced fresh greens, seasonal vegetables, exotic fruits, and organic cold-pressed herbs harvested at sunrise.',
      address: 'Plot 42, 12th Main Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      businessPhone: '+91 80 4123 9988',
      logoUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
      themeColor: '#16a34a', // Green
      status: 'active',
      isTemporarilyClosed: false,
      openingTime: '07:00',
      closingTime: '21:00',
      weeklyClosedDay: 'None',
      homeDeliveryEnabled: true,
      pickupEnabled: true,
      deliveryRadiusKm: '10',
      minOrderAmount: '100',
      deliveryFee: '30',
      freeDeliveryThreshold: '400',
      announcement: 'Fresh batch of Alphonso mangoes and organic hydroponic greens arrived today morning!',
    }).returning();

    const [shop3] = await db.insert(shops).values({
      ownerId: vendor3.id,
      name: 'Royal Treats Artisan Bakery',
      slug: 'royal-treats-artisan-bakery',
      category: 'Bakery',
      description: 'Handcrafted sourdough breads, French viennoiserie, Belgian chocolate cakes, and customized party desserts baked with pure butter.',
      address: 'Shop 7, Pali Hill Arcade, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      businessPhone: '+91 22 2640 1122',
      logoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=1200&q=80',
      themeColor: '#d97706', // Amber
      status: 'active',
      isTemporarilyClosed: false,
      openingTime: '08:30',
      closingTime: '22:30',
      weeklyClosedDay: 'Monday',
      homeDeliveryEnabled: true,
      pickupEnabled: true,
      deliveryRadiusKm: '12',
      minOrderAmount: '200',
      deliveryFee: '40',
      freeDeliveryThreshold: '600',
      announcement: 'Freshly baked sourdough boules out of the oven every day at 9:00 AM & 4:30 PM.',
    }).returning();

    const [shop4] = await db.insert(shops).values({
      ownerId: vendor4.id,
      name: 'CityStyle Apparels',
      slug: 'citystyle-apparels',
      category: 'Clothing',
      description: 'Trendy cotton kurtas, contemporary shirts, denim, ethnic jackets, and comfortable everyday apparel for modern Indian lifestyles.',
      address: '24 Bapu Bazar, Near City Palace',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302003',
      businessPhone: '+91 141 231 8899',
      logoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1200&q=80',
      themeColor: '#8b5cf6', // Violet
      status: 'active',
      isTemporarilyClosed: false,
      openingTime: '10:30',
      closingTime: '21:00',
      weeklyClosedDay: 'Tuesday',
      homeDeliveryEnabled: true,
      pickupEnabled: true,
      deliveryRadiusKm: '15',
      minOrderAmount: '300',
      deliveryFee: '50',
      freeDeliveryThreshold: '999',
      announcement: 'Summer Linen Collection launched! Free delivery on orders over ₹999.',
    }).returning();

    const [shop5] = await db.insert(shops).values({
      ownerId: vendor5.id,
      name: 'NexTech Mobile & Gadgets',
      slug: 'nextech-mobile-gadgets',
      category: 'Mobile Accessories',
      description: 'Original high-speed chargers, braided nylon cables, MagSafe accessories, wireless earbuds, and tempered screen protectors.',
      address: 'G-12, Cyber Gate Complex, Madhapur',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500081',
      businessPhone: '+91 40 2311 7766',
      logoUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=300&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
      themeColor: '#0284c7', // Sky blue
      status: 'active',
      isTemporarilyClosed: false,
      openingTime: '10:00',
      closingTime: '21:30',
      weeklyClosedDay: 'None',
      homeDeliveryEnabled: true,
      pickupEnabled: true,
      deliveryRadiusKm: '12',
      minOrderAmount: '200',
      deliveryFee: '35',
      freeDeliveryThreshold: '750',
      announcement: 'Same-day 60-minute express delivery for urgent charging cables and screen protection.',
    }).returning();

    // 5. Seed Products for Sharma General Store
    const [p1] = await db.insert(products).values({
      shopId: shop1.id,
      name: 'Premium Sharbati Whole Wheat Atta',
      description: 'Chakki fresh 100% whole wheat flour, naturally rich in dietary fiber and nutrients for soft, fluffy rotis.',
      category: 'Grocery',
      subcategory: 'Flours & Grains',
      price: '240',
      discountPrice: '219',
      unit: 'Packet',
      sku: 'SGS-ATTA-005',
      stockQuantity: 45,
      minOrderQty: 1,
      maxOrderQty: 10,
      brand: 'NatureFresh',
      tags: 'atta, flour, wheat, roti, chakki',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
      images: JSON.stringify(['https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80']),
      isActive: true,
      isProhibited: false,
    }).returning();

    const [p2] = await db.insert(products).values({
      shopId: shop1.id,
      name: 'Daawat Rozana Super Basmati Rice',
      description: 'Aromatic aged long grain basmati rice, pristine pearly white texture ideal for daily pulao, biryani, and steam rice.',
      category: 'Grocery',
      subcategory: 'Rice',
      price: '160',
      discountPrice: '145',
      unit: 'Kg',
      sku: 'SGS-RICE-001',
      stockQuantity: 80,
      minOrderQty: 1,
      maxOrderQty: 25,
      brand: 'Daawat',
      tags: 'basmati, rice, grain, biryani',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
      images: JSON.stringify(['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80']),
      isActive: true,
      isProhibited: false,
    }).returning();

    // Add variants for Daawat Rice (1kg, 5kg, 10kg)
    await db.insert(productVariants).values([
      { productId: p2.id, name: '1kg Bag', price: '145', stock: 50, sku: 'SGS-RICE-1KG' },
      { productId: p2.id, name: '5kg Family Pack', price: '690', stock: 20, sku: 'SGS-RICE-5KG' },
      { productId: p2.id, name: '10kg Bulk Sack', price: '1320', stock: 10, sku: 'SGS-RICE-10KG' },
    ]);

    const [p3] = await db.insert(products).values({
      shopId: shop1.id,
      name: 'Pure Kachi Ghani Mustard Oil',
      description: 'Cold-pressed traditional mustard oil packed with natural pungent aroma and high antioxidant value.',
      category: 'Grocery',
      subcategory: 'Edible Oils',
      price: '185',
      discountPrice: '168',
      unit: 'Litre',
      sku: 'SGS-OIL-001',
      stockQuantity: 32,
      minOrderQty: 1,
      maxOrderQty: 10,
      brand: 'Fortune',
      tags: 'oil, mustard, kachi ghani, cooking',
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
      images: JSON.stringify(['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80']),
      isActive: true,
      isProhibited: false,
    }).returning();

    const [p4] = await db.insert(products).values({
      shopId: shop1.id,
      name: 'Tata Sampann Unpolished Toor Dal',
      description: 'Naturally nutritious toor dal cultivated without chemical water polishing to preserve wholesome protein.',
      category: 'Grocery',
      subcategory: 'Pulses & Dals',
      price: '190',
      discountPrice: '175',
      unit: 'Kg',
      sku: 'SGS-DAL-002',
      stockQuantity: 40,
      minOrderQty: 1,
      maxOrderQty: 10,
      brand: 'Tata Sampann',
      tags: 'dal, toor dal, pulses, protein, organic',
      imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80',
      images: JSON.stringify(['https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80']),
      isActive: true,
      isProhibited: false,
    }).returning();

    // 6. Products for Green Harvest Fresh Mart
    await db.insert(products).values([
      {
        shopId: shop2.id,
        name: 'Fresh Farm Spinach (Palak)',
        description: 'Crisp, washed organic palak leaves packed with iron and vitamins. Harvested this morning.',
        category: 'Fruits & Vegetables',
        subcategory: 'Leafy Greens',
        price: '35',
        discountPrice: '28',
        unit: 'Packet',
        sku: 'GH-PALAK-01',
        stockQuantity: 50,
        minOrderQty: 1,
        maxOrderQty: 10,
        brand: 'GreenHarvest',
        tags: 'spinach, palak, greens, fresh, organic',
        imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
        images: JSON.stringify(['https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80']),
        isActive: true,
        isProhibited: false,
      },
      {
        shopId: shop2.id,
        name: 'Ratnagiri Alphonso Mangoes (Grade A)',
        description: 'Naturally ripened, sweet GI-tagged Alphonso mangoes with rich golden pulp and enchanting fragrance.',
        category: 'Fruits & Vegetables',
        subcategory: 'Exotic Fruits',
        price: '850',
        discountPrice: '799',
        unit: 'Dozen',
        sku: 'GH-MANGO-01',
        stockQuantity: 18,
        minOrderQty: 1,
        maxOrderQty: 5,
        brand: 'Devgad Farms',
        tags: 'alphonso, mango, aam, summer, sweet',
        imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
        images: JSON.stringify(['https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80']),
        isActive: true,
        isProhibited: false,
      },
      {
        shopId: shop2.id,
        name: 'Organic Red Tomatoes (Tamatar)',
        description: 'Vine-ripened juicy hybrid tomatoes ideal for curries, salads, sauces, and fresh soups.',
        category: 'Fruits & Vegetables',
        subcategory: 'Daily Veggies',
        price: '40',
        discountPrice: '32',
        unit: 'Kg',
        sku: 'GH-TOMATO-01',
        stockQuantity: 65,
        minOrderQty: 1,
        maxOrderQty: 10,
        brand: 'GreenHarvest',
        tags: 'tomato, tamatar, salad, veggies',
        imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
        images: JSON.stringify(['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80']),
        isActive: true,
        isProhibited: false,
      },
    ]);

    // 7. Products for Royal Treats Bakery
    const [cakeProduct] = await db.insert(products).values({
      shopId: shop3.id,
      name: 'Belgian Dark Truffle Celebration Cake',
      description: 'Layers of moist dark chocolate sponge filled with rich 64% Belgian chocolate ganache.',
      category: 'Bakery',
      subcategory: 'Cakes',
      price: '650',
      discountPrice: '599',
      unit: 'Piece',
      sku: 'RT-CAKE-01',
      stockQuantity: 12,
      minOrderQty: 1,
      maxOrderQty: 4,
      brand: 'RoyalTreats',
      tags: 'cake, truffle, chocolate, birthday, bakery',
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
      images: JSON.stringify(['https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80']),
      isActive: true,
      isProhibited: false,
    }).returning();

    await db.insert(productVariants).values([
      { productId: cakeProduct.id, name: '500g (Eggless)', price: '599', stock: 8, sku: 'RT-CAKE-500G' },
      { productId: cakeProduct.id, name: '1kg (Eggless)', price: '1150', stock: 4, sku: 'RT-CAKE-1KG' },
    ]);

    await db.insert(products).values({
      shopId: shop3.id,
      name: 'Classic Parisian Butter Croissant (Pack of 2)',
      description: 'Laminated with French European butter, offering over 50 delicate flaky golden layers and a tender honeycomb crumb.',
      category: 'Bakery',
      subcategory: 'Viennoiserie',
      price: '180',
      discountPrice: '160',
      unit: 'Pair',
      sku: 'RT-CROISSANT-02',
      stockQuantity: 24,
      minOrderQty: 1,
      maxOrderQty: 8,
      brand: 'RoyalTreats',
      tags: 'croissant, breakfast, butter, bakery, flaky',
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
      images: JSON.stringify(['https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80']),
      isActive: true,
      isProhibited: false,
    });

    // 8. Products for NexTech Gadgets
    await db.insert(products).values({
      shopId: shop5.id,
      name: '65W GaN Fast Charger (Type-C + USB-A)',
      description: 'Ultra-compact Gallium Nitride power adapter capable of fast-charging laptops, MacBooks, iPads, and smartphones simultaneously.',
      category: 'Mobile Accessories',
      subcategory: 'Chargers',
      price: '1899',
      discountPrice: '1499',
      unit: 'Piece',
      sku: 'NT-GAN-65W',
      stockQuantity: 30,
      minOrderQty: 1,
      maxOrderQty: 3,
      brand: 'AnkerTech',
      tags: 'charger, gan, fast charging, type-c, power',
      imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
      images: JSON.stringify(['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80']),
      isActive: true,
      isProhibited: false,
    });

    // 9. Store Offers
    await db.insert(offers).values([
      {
        shopId: shop1.id,
        code: 'RATION10',
        title: '10% OFF on Pantry Orders',
        discountType: 'percentage',
        discountValue: '10',
        minOrderValue: '500',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        isActive: true,
      },
      {
        shopId: shop2.id,
        code: 'FRESH50',
        title: '₹50 Flat OFF on Greens',
        discountType: 'fixed',
        discountValue: '50',
        minOrderValue: '300',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        isActive: true,
      },
    ]);

    // 10. Sample Completed & Active Orders with Bills & Order Items
    const [order1] = await db.insert(orders).values({
      orderNumber: 'YUN-2026-1001',
      shopId: shop1.id,
      userId: customer1.id,
      customerName: 'Rahul Verma',
      customerPhone: '+91 98765 11223',
      orderType: 'delivery',
      deliveryAddress: 'Flat 402, Sunshine Apartments, Barakhamba Road',
      addressType: 'home',
      landmark: 'Opposite Metro Station Gate 2',
      deliveryInstructions: 'Ring doorbell twice. Contactless handover preferred.',
      status: 'DELIVERED',
      subtotal: '532',
      discountAmount: '53',
      deliveryFee: '0',
      taxAmount: '0',
      totalAmount: '479',
      paymentMethod: 'cash_on_delivery',
      paymentStatus: 'paid',
    }).returning();

    await db.insert(orderItems).values([
      {
        orderId: order1.id,
        productId: p1.id,
        productName: 'Premium Sharbati Whole Wheat Atta',
        unit: 'Packet',
        price: '219',
        discount: '0',
        quantity: 1,
        total: '219',
      },
      {
        orderId: order1.id,
        productId: p2.id,
        variantName: '1kg Bag',
        productName: 'Daawat Rozana Super Basmati Rice',
        unit: 'Kg',
        price: '145',
        discount: '0',
        quantity: 1,
        total: '145',
      },
      {
        orderId: order1.id,
        productId: p3.id,
        productName: 'Pure Kachi Ghani Mustard Oil',
        unit: 'Litre',
        price: '168',
        discount: '0',
        quantity: 1,
        total: '168',
      },
    ]);

    await db.insert(invoices).values({
      invoiceNumber: 'INV-YUNAY-1001',
      orderId: order1.id,
      shopId: shop1.id,
      customNotes: 'Thank you for supporting your neighborhood Sharma General Store via YUNAY!',
    });

    // Sample Order 2: Accepted / In Packing
    const [order2] = await db.insert(orders).values({
      orderNumber: 'YUN-2026-1002',
      shopId: shop1.id,
      userId: customer2.id,
      customerName: 'Priya Sundaram',
      customerPhone: '+91 98123 44556',
      orderType: 'delivery',
      deliveryAddress: 'House 88, Sector 15, Golf Links',
      addressType: 'home',
      landmark: 'Near Community Park',
      deliveryInstructions: 'Call upon arrival.',
      status: 'PACKING',
      subtotal: '364',
      discountAmount: '0',
      deliveryFee: '25',
      taxAmount: '0',
      totalAmount: '389',
      paymentMethod: 'cash_on_delivery',
      paymentStatus: 'pending',
    }).returning();

    await db.insert(orderItems).values([
      {
        orderId: order2.id,
        productId: p1.id,
        productName: 'Premium Sharbati Whole Wheat Atta',
        unit: 'Packet',
        price: '219',
        discount: '0',
        quantity: 1,
        total: '219',
      },
      {
        orderId: order2.id,
        productId: p2.id,
        variantName: '1kg Bag',
        productName: 'Daawat Rozana Super Basmati Rice',
        unit: 'Kg',
        price: '145',
        discount: '0',
        quantity: 1,
        total: '145',
      },
    ]);

    await db.insert(invoices).values({
      invoiceNumber: 'INV-YUNAY-1002',
      orderId: order2.id,
      shopId: shop1.id,
      customNotes: 'Freshly packed from shelf.',
    });

    // 11. Customer Reviews
    await db.insert(reviews).values([
      {
        shopId: shop1.id,
        userId: customer1.id,
        orderId: order1.id,
        rating: 5,
        comment: 'Ramesh ji packed everything perfectly. The Sharbati atta is super fresh and the delivery was right on time! Loving YUNAY.',
        isModerated: true,
      },
    ]);

    // 12. Notifications
    await db.insert(notifications).values([
      {
        userId: vendor1.id,
        shopId: shop1.id,
        title: 'New Order Received',
        message: 'Order #YUN-2026-1002 from Priya Sundaram for ₹389 is awaiting preparation.',
        type: 'order',
        isRead: false,
      },
      {
        userId: adminUser.id,
        shopId: shop1.id,
        title: 'Platform Milestone',
        message: 'YUNAY platform initialized successfully with active verified neighborhood merchants.',
        type: 'system',
        isRead: false,
      },
    ]);

    // 13. Audit Log
    await db.insert(adminLogs).values({
      adminId: adminUser.id,
      action: 'APPROVE_SHOP',
      targetType: 'shop',
      targetId: String(shop1.id),
      details: 'Initial verified merchant onboarded: Sharma General Store',
    });

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
