import {Category,Product,BillingEntity,Retailer,RetailerStatus,KYCApplication,MOQRule,MOQRuleConfig,
  MOQEvaluation,
  CartItem,
  OrderEnquiry,
  SellerContactRequest,
  EstimateDocument,
  OrderStatus
} from '@/lib/types';
import {
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_BILLING_ENTITIES,
  MOCK_RETAILERS,
  MOCK_KYC_APPLICATIONS,
  MOCK_MOQ_RULES,
  MOCK_ORDERS,
  MOCK_SELLER_REQUESTS
} from '@/lib/data/mockData';

// Storage keys for in-memory / local state simulation
const STORAGE_KEYS = {
  PRODUCTS: 'iccha_products_v1',
  RETAILERS: 'iccha_retailers_v1',
  KYC_APPS: 'iccha_kyc_apps_v1',
  ORDERS: 'iccha_orders_v1',
  SELLER_REQS: 'iccha_seller_reqs_v1',
  MOQ_RULES: 'iccha_moq_rules_v1',
  BILLING_ENTITIES: 'iccha_billing_v1'
};

// Helper for client-side storage recovery
function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// -------------------------------------------------------------
// 1. PRODUCT SERVICE
// -------------------------------------------------------------
export const ProductService = {
  async getProducts(params?: {
    categoryId?: string;
    clothingType?: string;
    billingEntityId?: string;
    fabric?: string;
    search?: string;
    status?: string;
    isNewArrival?: boolean;
    isFeatured?: boolean;
    sort?: 'featured' | 'price_low' | 'price_high' | 'newest';
  }): Promise<Product[]> {
    const all = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    let filtered = [...all];

    if (params?.categoryId && params.categoryId !== 'all') {
      filtered = filtered.filter(p => p.categoryId === params.categoryId);
    }
    if (params?.clothingType && params.clothingType !== 'all') {
      filtered = filtered.filter(p => p.clothingType === params.clothingType);
    }
    if (params?.billingEntityId && params.billingEntityId !== 'all') {
      filtered = filtered.filter(p => p.billingEntityId === params.billingEntityId);
    }
    if (params?.fabric && params.fabric !== 'all') {
      filtered = filtered.filter(p => p.fabric.toLowerCase().includes(params.fabric!.toLowerCase()));
    }
    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.designNumber.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          p.collectionName.toLowerCase().includes(q)
      );
    }
    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter(p => p.status === params.status);
    }
    if (params?.isNewArrival) {
      filtered = filtered.filter(p => p.isNewArrival);
    }
    if (params?.isFeatured) {
      filtered = filtered.filter(p => p.isFeatured);
    }

    if (params?.sort === 'price_low') {
      filtered.sort((a, b) => a.wholesalePricePerPiece - b.wholesalePricePerPiece);
    } else if (params?.sort === 'price_high') {
      filtered.sort((a, b) => b.wholesalePricePerPiece - a.wholesalePricePerPiece);
    } else if (params?.sort === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    const all = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    return all.find(p => p.slug === slug) || null;
  },

  async getProductById(id: string): Promise<Product | null> {
    const all = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    return all.find(p => p.id === id) || null;
  },

  async getPublicRepresentativeProducts(limit = 8): Promise<Product[]> {
    const all = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    return all.filter(p => p.status !== 'archived').slice(0, limit);
  },

  async saveProduct(product: Partial<Product>): Promise<Product> {
    const all = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    if (product.id) {
      const idx = all.findIndex(p => p.id === product.id);
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...product } as Product;
        setStored(STORAGE_KEYS.PRODUCTS, all);
        return all[idx];
      }
    }
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: product.name || 'New Wholesale Kurti Set',
      slug: (product.name || 'kurti-set').toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${Date.now().toString().slice(-4)}`,
      sku: product.sku || `IC-NEW-${Math.floor(1000 + Math.random() * 9000)}`,
      designNumber: product.designNumber || `D-${Math.floor(1000 + Math.random() * 9000)}`,
      categoryId: product.categoryId || 'cat-1',
      categoryName: product.categoryName || 'Straight Kurti with Pant (2-Pc)',
      subcategory: product.subcategory || 'Cotton Prints',
      description: product.description || 'Premium wholesale apparel set.',
      fabric: product.fabric || '100% Pure Cotton',
      minOrderSets: product.minOrderSets ?? 1,
      workType: product.workType || 'Solid Tailored',
      style: product.style || 'Straight Kurti with Pant',
      clothingType: product.clothingType || '2_piece',
      piecesPerSet: product.piecesPerSet || 4,
      wholesalePricePerPiece: product.wholesalePricePerPiece || 450,
      wholesalePricePerSet: (product.wholesalePricePerPiece || 450) * (product.piecesPerSet || 4),
      availableSets: product.availableSets || 20,
      totalAvailablePieces: (product.availableSets || 20) * (product.piecesPerSet || 4),
      sizeCombination: product.sizeCombination || 'M, L, XL, XXL',
      sizes: product.sizes || ['M', 'L', 'XL', 'XXL'],
      colors: product.colors || ['Multi'],
      collectionName: product.collectionName || 'General Wholesale 2026',
      billingEntityId: product.billingEntityId || 'entity_b',
      hsn: product.hsn || '621142',
      gstRate: product.gstRate || 5,
      status: product.status || 'available',
      isNewArrival: product.isNewArrival ?? true,
      isFeatured: product.isFeatured ?? false,
      media: product.media || [
        {
          id: `m-${Date.now()}`,
          type: 'image',
          url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80',
          alt: product.name || 'Kurti set',
          isPrimary: true
        }
      ],
      createdAt: new Date().toISOString()
    };
    all.unshift(newProduct);
    setStored(STORAGE_KEYS.PRODUCTS, all);
    return newProduct;
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    return this.saveProduct(product);
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return this.saveProduct({ ...updates, id });
  },

  async deleteProduct(id: string): Promise<boolean> {
    const all = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    const filtered = all.filter(p => p.id !== id);
    setStored(STORAGE_KEYS.PRODUCTS, filtered);
    return true;
  },

  async adjustStock(productId: string, deltaSets: number, reason?: string): Promise<Product | null> {
    const all = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    const item = all.find(p => p.id === productId);
    if (!item) return null;
    item.availableSets = Math.max(0, item.availableSets + deltaSets);
    item.totalAvailablePieces = item.availableSets * item.piecesPerSet;
    if (item.availableSets === 0) item.status = 'out_of_stock';
    else if (item.availableSets <= 5) item.status = 'low_stock';
    else item.status = 'available';

    setStored(STORAGE_KEYS.PRODUCTS, all);
    return item;
  }
};

// -------------------------------------------------------------
// 2. CATEGORY SERVICE
// -------------------------------------------------------------
const CATEGORIES_STORAGE_KEY = 'iccha_categories_v1';

export const CategoryService = {
  async getCategories(): Promise<Category[]> {
    return getStored<Category[]>(CATEGORIES_STORAGE_KEY, MOCK_CATEGORIES);
  },
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const list = await this.getCategories();
    return list.find(c => c.slug === slug) || null;
  },
  async getCategoryById(id: string): Promise<Category | null> {
    const list = await this.getCategories();
    return list.find(c => c.id === id) || null;
  },
  async createCategory(cat: Partial<Category> & { name: string; slug: string }): Promise<Category> {
    const list = await this.getCategories();
    const newCat: Category = {
      id: `cat-${Date.now().toString().slice(-4)}`,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || 'Premium wholesale kurti category.',
      image: cat.image || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800',
      billingEntityId: cat.billingEntityId || 'entity_b',
      subcategories: cat.subcategories || ['Cotton Prints', 'Anarkali Sets'],
      itemCount: cat.itemCount || 10,
      representativeTagline: cat.representativeTagline || 'Authentic Jaipur Craftsmanship',
      featured: cat.featured ?? false,
      type: cat.type || '3_piece',
      popularFabrics: cat.popularFabrics || ['Pure Cotton 60x60', 'Mulmul Cotton']
    };
    list.unshift(newCat);
    setStored(CATEGORIES_STORAGE_KEY, list);
    return newCat;
  },
  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const list = await this.getCategories();
    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      setStored(CATEGORIES_STORAGE_KEY, list);
      return list[idx];
    }
    throw new Error('Category not found');
  },
  async deleteCategory(id: string): Promise<boolean> {
    const list = await this.getCategories();
    const filtered = list.filter(c => c.id !== id);
    setStored(CATEGORIES_STORAGE_KEY, filtered);
    return true;
  }
};

// -------------------------------------------------------------
// 3. BILLING SERVICE & ENTITY SERVICE
// -------------------------------------------------------------
export const BillingService = {
  async getBillingEntities(): Promise<BillingEntity[]> {
    return getStored<BillingEntity[]>(STORAGE_KEYS.BILLING_ENTITIES, MOCK_BILLING_ENTITIES);
  },
  async getEntities(): Promise<BillingEntity[]> {
    return this.getBillingEntities();
  },
  async getBillingEntityById(id: string): Promise<BillingEntity | null> {
    const list = await this.getBillingEntities();
    return list.find(b => b.id === id) || null;
  },
  async updateBillingEntity(id: string, updates: Partial<BillingEntity>): Promise<BillingEntity> {
    const list = await this.getBillingEntities();
    const idx = list.findIndex(b => b.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      setStored(STORAGE_KEYS.BILLING_ENTITIES, list);
      return list[idx];
    }
    throw new Error('Billing Entity not found');
  },
  async updateEntity(id: string, updates: Partial<BillingEntity>): Promise<BillingEntity> {
    return this.updateBillingEntity(id, updates);
  }
};

export const EntityService = BillingService;

// -------------------------------------------------------------
// 4. KYC SERVICE
// -------------------------------------------------------------
export const KycService = {
  async getApplications(): Promise<KYCApplication[]> {
    return getStored<KYCApplication[]>(STORAGE_KEYS.KYC_APPS, MOCK_KYC_APPLICATIONS);
  },
  async getApplicationById(id: string): Promise<KYCApplication | null> {
    const apps = await this.getApplications();
    return apps.find(a => a.id === id) || null;
  },
  async getApplicationByRetailerId(retailerId: string): Promise<KYCApplication | null> {
    const apps = await this.getApplications();
    return apps.find(a => a.retailerId === retailerId) || null;
  },
  async submitApplication(data: Omit<KYCApplication, 'id' | 'status' | 'submittedAt'>): Promise<KYCApplication> {
    const apps = await this.getApplications();
    const newApp: KYCApplication = {
      ...data,
      id: `kyc-app-${Date.now().toString().slice(-4)}`,
      status: 'under_review',
      submittedAt: new Date().toISOString()
    };
    apps.unshift(newApp);
    setStored(STORAGE_KEYS.KYC_APPS, apps);

    // Also update or register corresponding retailer record
    const retailers = getStored<Retailer[]>(STORAGE_KEYS.RETAILERS, MOCK_RETAILERS);
    const existingIdx = retailers.findIndex(r => r.id === data.retailerId || r.email === data.email);
    if (existingIdx >= 0) {
      retailers[existingIdx].status = 'under_review';
      retailers[existingIdx].kycApplicationId = newApp.id;
      retailers[existingIdx].gstin = data.gstin;
      retailers[existingIdx].pan = data.pan;
    } else {
      const newRetailer: Retailer = {
        id: data.retailerId || `ret-${Date.now().toString().slice(-4)}`,
        email: data.email,
        businessName: data.businessName,
        applicantName: data.applicantName,
        mobile: data.mobile,
        whatsapp: data.whatsapp,
        gstin: data.gstin,
        pan: data.pan,
        businessType: data.businessType,
        address: data.address,
        status: 'under_review',
        classification: 'New Partner',
        kycApplicationId: newApp.id,
        moqOverride: false,
        createdAt: new Date().toISOString(),
        totalOrdersCount: 0,
        totalOrderValue: 0
      };
      retailers.unshift(newRetailer);
    }
    setStored(STORAGE_KEYS.RETAILERS, retailers);

    return newApp;
  },
  async reviewApplication(
    id: string,
    action: 'approve' | 'reject' | 'request_info',
    notes?: string
  ): Promise<KYCApplication> {
    const apps = await this.getApplications();
    const app = apps.find(a => a.id === id);
    if (!app) throw new Error('Application not found');

    const retailers = getStored<Retailer[]>(STORAGE_KEYS.RETAILERS, MOCK_RETAILERS);
    const retailer = retailers.find(r => r.id === app.retailerId || r.email === app.email);

    if (action === 'approve') {
      app.status = 'approved';
      app.reviewedAt = new Date().toISOString();
      app.reviewedBy = 'Iccha Admin Operations';
      app.remarks = notes || 'KYC documentation and GSTIN verified.';
      if (retailer) {
        retailer.status = 'approved';
      }
    } else if (action === 'reject') {
      app.status = 'rejected';
      app.reviewedAt = new Date().toISOString();
      app.reviewedBy = 'Iccha Admin Operations';
      app.remarks = notes || 'Rejected due to invalid or unverified business documentation.';
      if (retailer) {
        retailer.status = 'rejected';
      }
    } else if (action === 'request_info') {
      app.status = 'info_required';
      app.reviewedAt = new Date().toISOString();
      app.reviewedBy = 'Iccha Admin Operations';
      app.infoRequestNotes = notes || 'Additional trade proof or corrected GSTIN certificate needed.';
      if (retailer) {
        retailer.status = 'info_required';
      }
    }

    setStored(STORAGE_KEYS.KYC_APPS, apps);
    setStored(STORAGE_KEYS.RETAILERS, retailers);
    return app;
  },
  async updateStatus(
    id: string,
    status: RetailerStatus | 'pending',
    remarks?: string
  ): Promise<KYCApplication> {
    const action = status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : status === 'info_required' ? 'request_info' : 'request_info';
    return this.reviewApplication(id, action, remarks);
  }
};

export const KYCService = KycService;

// -------------------------------------------------------------
// 5. RETAILER SERVICE
// -------------------------------------------------------------
export const RetailerService = {
  async getRetailers(filter?: { status?: string; search?: string }): Promise<Retailer[]> {
    const all = getStored<Retailer[]>(STORAGE_KEYS.RETAILERS, MOCK_RETAILERS);
    let list = [...all];
    if (filter?.status && filter.status !== 'all') {
      list = list.filter(r => r.status === filter.status);
    }
    if (filter?.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        r =>
          r.businessName.toLowerCase().includes(q) ||
          r.applicantName.toLowerCase().includes(q) ||
          r.gstin.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.mobile.includes(q)
      );
    }
    return list;
  },

  async getRetailerById(id: string): Promise<Retailer | null> {
    const list = await this.getRetailers();
    return list.find(r => r.id === id) || null;
  },

  async updateRetailerStatus(id: string, status: Retailer['status']): Promise<Retailer> {
    const list = getStored<Retailer[]>(STORAGE_KEYS.RETAILERS, MOCK_RETAILERS);
    const item = list.find(r => r.id === id);
    if (!item) throw new Error('Retailer not found');
    item.status = status;
    setStored(STORAGE_KEYS.RETAILERS, list);
    return item;
  },

  async setMoqOverride(id: string, override: boolean, customSets?: number): Promise<Retailer> {
    const list = getStored<Retailer[]>(STORAGE_KEYS.RETAILERS, MOCK_RETAILERS);
    const item = list.find(r => r.id === id);
    if (!item) throw new Error('Retailer not found');
    item.moqOverride = override;
    if (customSets !== undefined) item.customMoqSets = customSets;
    setStored(STORAGE_KEYS.RETAILERS, list);
    return item;
  },

  async setMOQOverride(id: string, override: boolean, customSets?: number): Promise<Retailer> {
    return this.setMoqOverride(id, override, customSets);
  },

  async updateClassification(id: string, classification: Retailer['classification']): Promise<Retailer> {
    const list = getStored<Retailer[]>(STORAGE_KEYS.RETAILERS, MOCK_RETAILERS);
    const item = list.find(r => r.id === id);
    if (!item) throw new Error('Retailer not found');
    item.classification = classification;
    setStored(STORAGE_KEYS.RETAILERS, list);
    return item;
  }
};

// -------------------------------------------------------------
// 6. MOQ SERVICE
// -------------------------------------------------------------
export const MOQService = {
  async getRules(): Promise<MOQRule[]> {
    return getStored<MOQRule[]>(STORAGE_KEYS.MOQ_RULES, MOCK_MOQ_RULES);
  },

  async evaluateCart(items: CartItem[], retailer?: Retailer | null): Promise<MOQEvaluation> {
    const totalSets = items.reduce((acc, item) => acc + item.selectedSets, 0);
    const totalPieces = items.reduce((acc, item) => acc + item.totalPieces, 0);
    const totalDesigns = items.length;
    const currentOrderValue = items.reduce((acc, item) => acc + item.lineSubtotal, 0);

    // Check if retailer has an active MOQ override approved by Admin
    if (retailer?.moqOverride) {
      return {
        isMet: true,
        currentSets: totalSets,
        requiredSets: retailer.customMoqSets || 1,
        currentPieces: totalPieces,
        requiredPieces: 1,
        currentDesigns: totalDesigns,
        requiredDesigns: 1,
        currentOrderValue,
        requiredOrderValue: 0,
        deficitSets: 0,
        deficitPieces: 0,
        message: 'Admin MOQ Exception Active: You can place this trial order.',
        overrideApplied: true
      };
    }

    const rules = await this.getRules();
    const globalRule = rules.find(r => r.scope === 'global' && r.isActive) || MOCK_MOQ_RULES[0];

    const requiredSets = globalRule.minSets;
    const requiredPieces = globalRule.minPieces;
    const requiredDesigns = globalRule.minDesigns;
    const requiredOrderValue = globalRule.minOrderValue;

    const setsDeficit = Math.max(0, requiredSets - totalSets);
    const piecesDeficit = Math.max(0, requiredPieces - totalPieces);
    const valueDeficit = Math.max(0, requiredOrderValue - currentOrderValue);

    const isMet = totalSets >= requiredSets || currentOrderValue >= requiredOrderValue;

    let message = '';
    if (totalSets === 0) {
      message = `Minimum Wholesale Order: ${requiredSets} Sets (Approx ₹${requiredOrderValue.toLocaleString('en-IN')}).`;
    } else if (isMet) {
      message = `MOQ Requirement Met! (${totalSets} Sets selected). You can proceed to submit order enquiry.`;
    } else {
      message = `Add ${setsDeficit} more set${setsDeficit > 1 ? 's' : ''} to reach Minimum Order Quantity (${requiredSets} sets required).`;
    }

    return {
      isMet,
      currentSets: totalSets,
      requiredSets,
      currentPieces: totalPieces,
      requiredPieces,
      currentDesigns: totalDesigns,
      requiredDesigns,
      currentOrderValue,
      requiredOrderValue,
      deficitSets: setsDeficit,
      deficitPieces: piecesDeficit,
      message,
      overrideApplied: false
    };
  },

  async updateRule(id: string, updates: Partial<MOQRule>): Promise<MOQRule> {
    const list = await this.getRules();
    const idx = list.findIndex(r => r.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      setStored(STORAGE_KEYS.MOQ_RULES, list);
      return list[idx];
    }
    throw new Error('MOQ Rule not found');
  },

  async getConfig(): Promise<MOQRuleConfig> {
    const defaultCfg: MOQRuleConfig = {
      minimumSetsPerOrder: 4,
      allowSampleOrders: true,
      sampleOrderMaxSets: 2,
      entitySpecificMOQ: false,
      entityRules: {
        entity_a: { entityId: 'entity_a', minimumSets: 2 },
        entity_b: { entityId: 'entity_b', minimumSets: 2 }
      }
    };
    return getStored<MOQRuleConfig>('iccha_moq_config', defaultCfg);
  },

  async updateConfig(cfg: Partial<MOQRuleConfig>): Promise<MOQRuleConfig> {
    const current = await this.getConfig();
    const updated = { ...current, ...cfg };
    setStored('iccha_moq_config', updated);
    return updated;
  }
};

// -------------------------------------------------------------
// 7. SELLER CONTACT / VIDEO CALL REQUEST SERVICE
// -------------------------------------------------------------
export const SellerRequestService = {
  async getRequests(): Promise<SellerContactRequest[]> {
    return getStored<SellerContactRequest[]>(STORAGE_KEYS.SELLER_REQS, MOCK_SELLER_REQUESTS);
  },

  async submitRequest(data: Omit<SellerContactRequest, 'id' | 'status' | 'createdAt'>): Promise<SellerContactRequest> {
    const list = await this.getRequests();
    const newReq: SellerContactRequest = {
      ...data,
      id: `req-call-${Date.now().toString().slice(-4)}`,
      status: 'contact_pending',
      createdAt: new Date().toISOString()
    };
    list.unshift(newReq);
    setStored(STORAGE_KEYS.SELLER_REQS, list);
    return newReq;
  },

  async updateStatus(
    id: string,
    status: SellerContactRequest['status'],
    adminNotes?: string,
    scheduledAt?: string
  ): Promise<SellerContactRequest> {
    const list = await this.getRequests();
    const item = list.find(r => r.id === id);
    if (!item) throw new Error('Request not found');
    item.status = status;
    if (adminNotes) item.adminNotes = adminNotes;
    if (scheduledAt) item.scheduledAt = scheduledAt;

    // If Admin approved MOQ exception from this request, grant the retailer an override!
    if (status === 'moq_exception_approved') {
      await RetailerService.setMoqOverride(item.retailerId, true, item.cartSummary.totalSets || 1);
    }

    setStored(STORAGE_KEYS.SELLER_REQS, list);
    return item;
  }
};

// -------------------------------------------------------------
// 8. ORDER & ESTIMATE SERVICE
// -------------------------------------------------------------
export const OrderService = {
  async getOrders(filter?: { retailerId?: string; status?: string }): Promise<OrderEnquiry[]> {
    const all = getStored<OrderEnquiry[]>(STORAGE_KEYS.ORDERS, MOCK_ORDERS);
    let list = [...all];
    if (filter?.retailerId) {
      list = list.filter(o => o.retailerId === filter.retailerId);
    }
    if (filter?.status && filter.status !== 'all') {
      list = list.filter(o => o.status === filter.status);
    }
    return list;
  },

  async getOrderById(id: string): Promise<OrderEnquiry | null> {
    const list = await this.getOrders();
    return list.find(o => o.id === id || o.orderNumber === id) || null;
  },

  async createOrderEnquiry(params: {
    retailer: Retailer;
    cartItems: CartItem[];
    shippingAddress: Retailer['address'];
    customerRemarks?: string;
  }): Promise<OrderEnquiry> {
    const { retailer, cartItems, shippingAddress, customerRemarks } = params;
    const entities = await BillingService.getBillingEntities();

    const orderNumber = `IC-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = `ord-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];

    // Identify which entities are involved in this cart
    const entityIds = Array.from(new Set(cartItems.map(i => i.billingEntityId ?? 'entity_b'))) as ('entity_a' | 'entity_b')[];

    // Convert cart items to order items
    const orderItems = cartItems.map(item => {
      const gstAmount = Math.round((item.lineSubtotal * item.product.gstRate) / 100);
      return {
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        designNumber: item.product.designNumber,
        categoryName: item.product.categoryName,
        billingEntityId: item.billingEntityId ?? 'entity_b',
        sets: item.selectedSets,
        piecesPerSet: item.piecesPerSet,
        totalPieces: item.totalPieces,
        pieceRate: item.unitPrice,
        setRate: item.setPrice,
        lineSubtotal: item.lineSubtotal,
        hsn: item.product.hsn,
        gstRate: item.product.gstRate,
        gstAmount,
        totalWithGst: item.lineSubtotal + gstAmount,
        imageUrl: item.product.media[0]?.url || '',
        sizeCombination: item.product.sizeCombination,
        color: item.product.colors[0] || 'Assorted'
      };
    });

    const subtotal = orderItems.reduce((acc, i) => acc + i.lineSubtotal, 0);
    const totalGst = orderItems.reduce((acc, i) => acc + i.gstAmount, 0);
    const shipping = cartItems.length > 0 ? (subtotal > 20000 ? 0 : 350 * entityIds.length) : 0;
    const masterTotal = subtotal + totalGst;
    const estimates: EstimateDocument[] = entityIds.map(entityId => {
      const entity = entities.find(e => e.id === entityId) || entities[0];
      const entityItems = orderItems.filter(i => i.billingEntityId === entityId);
      const entityTaxable = entityItems.reduce((acc, i) => acc + i.lineSubtotal, 0);
      const entityGst = entityItems.reduce((acc, i) => acc + i.gstAmount, 0);
      const entityShipping = subtotal > 20000 ? 0 : 350;
      const entityGrandTotal = entityTaxable + entityGst;

      const isInterState = entity.stateCode !== retailer.address.stateCode;
      const cgstAmount = isInterState ? 0 : Math.round(entityGst / 2);
      const sgstAmount = isInterState ? 0 : Math.round(entityGst / 2);
      const igstAmount = isInterState ? entityGst : 0;

      const estNum = `${entity.estimatePrefix}-${orderNumber.replace('IC-ORD-', '')}${entityId === 'entity_a' ? 'A' : 'B'}`;

      return {
        id: `est-${Date.now()}-${entityId}`,
        estimateNumber: estNum,
        orderId,
        orderNumber,
        date: todayStr,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        billingEntity: entity,
        retailer: {
          id: retailer.id,
          businessName: retailer.businessName,
          applicantName: retailer.applicantName,
          gstin: retailer.gstin,
          pan: retailer.pan,
          mobile: retailer.mobile,
          email: retailer.email,
          billingAddress: retailer.address,
          shippingAddress: shippingAddress || retailer.address
        },
        items: entityItems,
        totalSets: entityItems.reduce((acc, i) => acc + i.sets, 0),
        totalPieces: entityItems.reduce((acc, i) => acc + i.totalPieces, 0),
        taxableSubtotal: entityTaxable,
        isInterState,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalGst: entityGst,
        shippingCharge: entityShipping,
        grandTotal: entityGrandTotal,
        paymentTerms: [
          `Commercial Proforma Estimate issued by ${entity.legalName}.`,
          'This document constitutes a wholesale order request, not a tax invoice.',
          'Stock allocation valid for 5 days. Bank transfer required before dispatch.',
          `Direct RTGS/NEFT to ${entity.bankDetails.bankName} (${entity.bankDetails.ifsc}).`
        ]
      };
    });

    const newOrder: OrderEnquiry = {
      id: orderId,
      orderNumber,
      retailerId: retailer.id,
      retailerBusinessName: retailer.businessName,
      retailerApplicantName: retailer.applicantName,
      retailerGstin: retailer.gstin,
      retailerContact: retailer.mobile,
      retailerEmail: retailer.email,
      billingAddress: retailer.address,
      shippingAddress: shippingAddress || retailer.address,
      items: orderItems,
      totalDesigns: orderItems.length,
      totalSets: orderItems.reduce((acc, i) => acc + i.sets, 0),
      totalPieces: orderItems.reduce((acc, i) => acc + i.totalPieces, 0),
      subtotal,
      totalGst,
      shipping,
      masterTotal,
      status: 'enquiry_received',
      timeline: [
        {
          status: 'enquiry_received',
          timestamp: new Date().toISOString(),
          note: 'Wholesale Order Enquiry placed successfully.',
          actor: retailer.applicantName
        }
      ],
      entityIds,
      estimates,
      customerRemarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const orders = getStored<OrderEnquiry[]>(STORAGE_KEYS.ORDERS, MOCK_ORDERS);
    orders.unshift(newOrder);
    setStored(STORAGE_KEYS.ORDERS, orders);

    return newOrder;
  },

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    note?: string,
    actor = 'Iccha Operations'
  ): Promise<OrderEnquiry> {
    const orders = getStored<OrderEnquiry[]>(STORAGE_KEYS.ORDERS, MOCK_ORDERS);
    const order = orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!order) throw new Error('Order not found');

    order.status = status;
    order.updatedAt = new Date().toISOString();
    order.timeline.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Order status updated to ${status.replace('_', ' ').toUpperCase()}`,
      actor
    });

    setStored(STORAGE_KEYS.ORDERS, orders);
    return order;
  }
};

export * from './heroService';