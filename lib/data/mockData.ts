import {
  BillingEntity,
  Category,
  Product,
  Retailer,
  KYCApplication,
  MOQRule,
  OrderEnquiry,
  SellerContactRequest,
  EstimateDocument
} from '@/lib/types';

export const MOCK_BILLING_ENTITIES: BillingEntity[] = [
  {
    id: 'entity_a',
    code: 'ICCHA-SURAT',
    legalName: 'Iccha Fashions Private Limited',
    tradeName: 'Iccha Fashions (Surat Division)',
    gstin: '24AAACI5542G1ZP',
    pan: 'AAACI5542G',
    registeredAddress: 'Plot No. 412-415, Millennium Textile Market-2, Ring Road, Surat, Gujarat - 395002',
    state: 'Gujarat',
    stateCode: '24',
    contactEmail: 'billing.surat@icchastore.com',
    contactPhone: '+91 98251 44550',
    bankDetails: {
      bankName: 'HDFC Bank Ltd',
      accountHolder: 'Iccha Fashions Pvt Ltd',
      accountNumber: '50200067891234',
      ifsc: 'HDFC0001024',
      branch: 'Ring Road Textile Branch, Surat',
      upiId: 'icchafashions@hdfcbank'
    },
    estimatePrefix: 'EST-SUR',
    invoicePrefix: 'INV-SUR',
    assignedCategoryIds: [
      'cat-2', 'cat-4', 'cat-5', 'cat-7', 'cat-9', 'cat-10', 'cat-11', 'cat-13', 'cat-14', 'cat-19'
    ],
    taxConfig: {
      cgstRate: 2.5,
      sgstRate: 2.5,
      igstRate: 5.0,
      defaultGstRate: 5.0
    }
  },
  {
    id: 'entity_b',
    code: 'ICCHA-JAIPUR',
    legalName: 'Iccha Apparels & Textiles LLP',
    tradeName: 'Iccha Apparels (Jaipur Division)',
    gstin: '08AABFI9912K1ZQ',
    pan: 'AABFI9912K',
    registeredAddress: 'E-78, RIICO Industrial Apparel Park, Sanganer, Jaipur, Rajasthan - 302029',
    state: 'Rajasthan',
    stateCode: '08',
    contactEmail: 'billing.jaipur@icchastore.com',
    contactPhone: '+91 94140 88220',
    bankDetails: {
      bankName: 'ICICI Bank Ltd',
      accountHolder: 'Iccha Apparels & Textiles LLP',
      accountNumber: '001205018890',
      ifsc: 'ICIC0000012',
      branch: 'Tonk Road Industrial Branch, Jaipur',
      upiId: 'icchaapparels@icici'
    },
    estimatePrefix: 'EST-JPR',
    invoicePrefix: 'INV-JPR',
    assignedCategoryIds: [
      'cat-1', 'cat-3', 'cat-6', 'cat-8', 'cat-12', 'cat-15', 'cat-16', 'cat-17', 'cat-18', 'cat-20'
    ],
    taxConfig: {
      cgstRate: 2.5,
      sgstRate: 2.5,
      igstRate: 5.0,
      defaultGstRate: 5.0
    }
  }
];

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Straight Kurti with Pant (2-Pc)',
    slug: 'straight-kurti-with-pant-2-pc',
    description: 'Classic straight-fit kurtas paired with tailored cigarette & straight pants. Daily & semi-formal wholesale lots.',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_b',
    subcategories: ['Cotton Prints', 'Rayon Slub', 'Loom Khadi', 'Office Solids'],
    itemCount: 48,
    representativeTagline: 'Comfortable everyday fits in breathable organic cotton & modal',
    featured: true,
    type: '2_piece',
    popularFabrics: ['100% Pure Cotton', 'Heavy Rayon 14kg', 'Slub Cotton']
  },
  {
    id: 'cat-2',
    name: 'Anarkali with Pant & Dupatta (3-Pc)',
    slug: 'anarkali-kurti-pant-dupatta-3-pc',
    description: 'Floor & calf length flared Anarkali silhouettes with coordinated bottom wear and ornate matching dupattas.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_a',
    subcategories: ['Gotta Patti Work', 'Thread Floral Work', 'Festive Zari Border', 'Angrakha Cut'],
    itemCount: 64,
    representativeTagline: 'Royal flair for festive seasons, weddings & boutique showcases',
    featured: true,
    type: '3_piece',
    popularFabrics: ['Chanderi Silk', 'Georgette', 'Muslin Cotton']
  },
  {
    id: 'cat-3',
    name: 'Nayra Cut Kurti Pant Set (2-Pc)',
    slug: 'nayra-cut-kurti-pant-set-2-pc',
    description: 'Trending high-slit Nayra cut kurtas with intricate waist yoke embroidery paired with matching comfortable pants.',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_b',
    subcategories: ['Embroidered Neckline', 'Foil Print Flare', 'Pastel Hues', 'Floral Digital'],
    itemCount: 36,
    representativeTagline: 'High demand contemporary silhouette among young retail shoppers',
    featured: true,
    type: '2_piece',
    popularFabrics: ['Roman Silk', 'Heavy Viscose Rayon', 'Soft Chanderi']
  },
  {
    id: 'cat-4',
    name: 'Alia Cut Flared Suit Set (3-Pc)',
    slug: 'alia-cut-flared-suit-set-3-pc',
    description: 'Distinctive V-neck gathered Alia cut ethnic suits with dyed pants and printed chiffon/organza dupattas.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_a',
    subcategories: ['Neck Lace Details', 'Mirror Highlights', 'Festive Brights', 'Summer Pastels'],
    itemCount: 42,
    representativeTagline: 'Top trending design in boutique wholesale across North & South India',
    featured: true,
    type: '3_piece',
    popularFabrics: ['Pure Muslin', 'Mulmul Cotton', 'Crepe Silk']
  },
  {
    id: 'cat-5',
    name: 'Pure Chanderi Silk 3-Pc Festive Suits',
    slug: 'pure-chanderi-silk-3-pc-festive-suits',
    description: 'Authentic Chanderi fabric with woven zari borders, inner cotton lining, and heavy embroidered organza dupattas.',
    image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_a',
    subcategories: ['Zari Woven', 'Sequins Work', 'Cutwork Dupatta', 'Heritage Motifs'],
    itemCount: 52,
    representativeTagline: 'Premium boutique luxury segment with high wholesale margins',
    featured: true,
    type: '3_piece',
    popularFabrics: ['Chanderi Silk', 'Tissue Chanderi', 'Cotton Silk']
  },
  {
    id: 'cat-6',
    name: 'Daily Wear Pure Cotton 2-Pc Sets',
    slug: 'daily-wear-pure-cotton-2-pc-sets',
    description: '60x60 Cambric and Jaipur pure cotton stitched kurtas with pants. Color-fast, sweat-absorbent, ultra-breathable.',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_b',
    subcategories: ['Bagru Prints', 'Sanganeri Florals', 'Geometric Solids', 'Pocket Pants'],
    itemCount: 88,
    representativeTagline: 'High velocity wholesale staple with 100% repeat retail customer rate',
    featured: true,
    type: '2_piece',
    popularFabrics: ['Jaipuri 60x60 Cotton', 'Organic Khadi Cotton', 'Cambric']
  },
  {
    id: 'cat-7',
    name: 'Muslin Silk Digital Print 3-Pc Sets',
    slug: 'muslin-silk-digital-print-3-pc-sets',
    description: 'Featherlight muslin silk featuring exclusive designer digital artwork, pearl beadwork, and matched muslin dupattas.',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_a',
    subcategories: ['Abstract Digital', 'Botanical Prints', 'Pearl Embellished', 'Pastel Ombre'],
    itemCount: 39,
    representativeTagline: 'Ultra-soft handfeel and opulent digital design clarity',
    featured: false,
    type: '3_piece',
    popularFabrics: ['Pure Muslin', 'Silk Muslin']
  },
  {
    id: 'cat-8',
    name: 'Rayon Foil Print Kurti Pant Set (2-Pc)',
    slug: 'rayon-foil-print-kurti-pant-set-2-pc',
    description: 'Heavy 14kg Liva certified rayon featuring gold and silver foil accents with reinforced interlocking.',
    image: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_b',
    subcategories: ['Gold Foil Motifs', 'Chevron Bottoms', 'Mandarin Neck', 'Button Front'],
    itemCount: 45,
    representativeTagline: 'Economical festive collection delivering rich visual sheen',
    featured: false,
    type: '2_piece',
    popularFabrics: ['Heavy 14kg Rayon', 'Slub Rayon']
  },
  {
    id: 'cat-9',
    name: 'Hand Embroidered Lucknowi Chikankari',
    slug: 'hand-embroidered-lucknowi-chikankari',
    description: 'Intricate Bakhiya and Phanda stitches on georgette and mulmul, paired with matching chikankari stretch pants.',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_a',
    subcategories: ['Mukaish Work', 'Shadow Work', 'Cotton Mulmul', 'Georgette Sets'],
    itemCount: 30,
    representativeTagline: 'Timeless artisanal heritage embroidery sourced directly from master karigars',
    featured: true,
    type: 'mixed',
    popularFabrics: ['Pure Georgette', 'Mulmul Cotton', 'Viscose']
  },
  {
    id: 'cat-10',
    name: 'Organza Dupatta Partywear 3-Pc Suit',
    slug: 'organza-dupatta-partywear-3-pc-suit',
    description: 'Straight and flared partywear suits matched with heavy scalloped embroidered organza dupattas.',
    image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_a',
    subcategories: ['Scallop Border', 'Cutdana Work', 'Organza Digital', 'Monochrome Sets'],
    itemCount: 34,
    representativeTagline: 'Boutique partywear collection with statement sheer dupattas',
    featured: false,
    type: '3_piece',
    popularFabrics: ['Silk Crepe', 'Organza Silk', 'Roman Chanderi']
  },
  {
    id: 'cat-11',
    name: 'Heavy Georgette Sharara Set (3-Pc)',
    slug: 'heavy-georgette-sharara-set-3-pc',
    description: 'Three tier flared sharara pants with short peplum/straight kurtis and flowy dupatta with mirror work borders.',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_a',
    subcategories: ['Tiered Sharara', 'Peplum Cut', 'Mirror Work', 'Zari Embroidered'],
    itemCount: 28,
    representativeTagline: 'Festive & wedding guest collection for high retail price-points',
    featured: false,
    type: '3_piece',
    popularFabrics: ['Fox Georgette with Lining', 'Micro Crepe']
  },
  {
    id: 'cat-12',
    name: 'Formal Office Wear Cord Sets (2-Pc)',
    slug: 'formal-office-wear-cord-sets-2-pc',
    description: 'Modern coordinated tunic tops with straight cigarette pants, pockets, and clean minimal tailored silhouettes.',
    image: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_b',
    subcategories: ['Solid Cord', 'Linen Blends', 'Collared Yokes', 'Formal Stripe'],
    itemCount: 40,
    representativeTagline: 'Modern fusion workwear sets for corporate and urban boutiques',
    featured: false,
    type: '2_piece',
    popularFabrics: ['Linen Cotton', 'Heavy Cotton Twill', 'Rayon Twill']
  },
  {
    id: 'cat-13',
    name: 'Velvet Winter Special 3-Pc Sets',
    slug: 'velvet-winter-special-3-pc-sets',
    description: 'Heavy 9000 micro velvet kurtas with Kashmiri tilla embroidery, velvet pants, and woven pashmina/organza dupattas.',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_a',
    subcategories: ['Tilla Zari Work', 'Embroidery Neckline', 'Deep Jewel Tones', 'Silk Stoles'],
    itemCount: 22,
    representativeTagline: 'Seasonal winter luxury collection in emerald, maroon, and sapphire',
    featured: false,
    type: '3_piece',
    popularFabrics: ['Micro Velvet 9000', 'Velvet Silk']
  },
  {
    id: 'cat-14',
    name: 'Bandhani & Leheriya Festive Kurti Sets',
    slug: 'bandhani-leheriya-festive-kurti-sets',
    description: 'Traditional Rajasthani & Gujarati tie-dye patterns in silk and georgette with gota work embellishments.',
    image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_a',
    subcategories: ['Mothda Print', 'Gota Lace', 'Crushed Dupatta', 'Dual Tone Leheriya'],
    itemCount: 37,
    representativeTagline: 'Essential festive ethnic stock for Navratri, Karwa Chauth & Diwali',
    featured: false,
    type: '3_piece',
    popularFabrics: ['Art Silk', 'Georgette Bandhej', 'Cotton Bandhani']
  },
  {
    id: 'cat-15',
    name: 'Plus Size (3XL to 7XL) Kurti Pant Sets',
    slug: 'plus-size-3xl-to-7xl-kurti-pant-sets',
    description: 'Specially engineered comfort-fit patterns for plus sizes with deep armholes, elasticated backs, and relaxed fits.',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_b',
    subcategories: ['3XL-4XL Lots', '5XL-7XL Lots', 'Floral Tunics', 'Straight Cotton'],
    itemCount: 26,
    representativeTagline: 'High margin specialty plus-size segment with low return rates',
    featured: false,
    type: '2_piece',
    popularFabrics: ['Cotton 60x60', 'Viscose Rayon 16kg', 'Khadi']
  },
  {
    id: 'cat-16',
    name: 'Kaftan Style Kurti with Pants (2-Pc)',
    slug: 'kaftan-style-kurti-with-pants-2-pc',
    description: 'Flowy drawstring kaftan tops with matching slim pants, tassel cords, and bohemian botanical prints.',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_b',
    subcategories: ['Drawstring Waist', 'Mirror Lace', 'Resort Wear Prints', 'Silk Kaftan'],
    itemCount: 31,
    representativeTagline: 'Relaxed resort & leisure wear collection with high young retail appeal',
    featured: false,
    type: '2_piece',
    popularFabrics: ['Heavy Rayon', 'Modal Silk', 'Cotton Mulmul']
  },
  {
    id: 'cat-17',
    name: 'A-Line Kurti with Cigar Pant (2-Pc)',
    slug: 'a-line-kurti-with-cigar-pant-2-pc',
    description: 'Subtly flared A-line cuts paired with ankle-length cigar pants and functional side pockets.',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_b',
    subcategories: ['Ikat Woven', 'Dobby Cotton', 'Button Yoke', 'Contrast Piping'],
    itemCount: 44,
    representativeTagline: 'Flattering universal silhouette with quick shelf turnaround',
    featured: false,
    type: '2_piece',
    popularFabrics: ['South Dobby Cotton', 'Handloom Slub', 'Rayon']
  },
  {
    id: 'cat-18',
    name: 'Short Kurti / Tunic Wholesale Lots',
    slug: 'short-kurti-tunic-wholesale-lots',
    description: 'Waist & hip length ethnic tunics designed for pairing with jeans, jeggings, or culottes.',
    image: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_b',
    subcategories: ['College Wear', 'Floral Prints', 'Angrakha Short', 'Embroidered Yoke'],
    itemCount: 50,
    representativeTagline: 'High volume, fast moving entry-level wholesale catalog',
    featured: false,
    type: 'kurti_only',
    popularFabrics: ['Cotton Flex', 'Pure Cambric Cotton', 'Rayon']
  },
  {
    id: 'cat-19',
    name: 'Jacquard Brocade Festive Suits (3-Pc)',
    slug: 'jacquard-brocade-festive-suits-3-pc',
    description: 'Woven metallic jacquard motifs on rich silk base, matched with brocade dupattas and tailored silk trousers.',
    image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_a',
    subcategories: ['Banarasi Jacquard', 'Zari Butti', 'Heavy Border', 'Festive Crimson & Mustard'],
    itemCount: 24,
    representativeTagline: 'Grand festive luxury suitable for bridal trousseau and festival retail',
    featured: false,
    type: '3_piece',
    popularFabrics: ['Banarasi Silk Jacquard', 'Raw Silk Blend', 'Organza']
  },
  {
    id: 'cat-20',
    name: 'Kalamkari & Indigo Handblock 2-Pc Sets',
    slug: 'kalamkari-indigo-handblock-2-pc-sets',
    description: 'Natural vegetable dyed hand-block printed kurtis with coordinated dabu indigo pants and wooden buttons.',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
    billingEntityId: 'entity_b',
    subcategories: ['Dabu Indigo', 'Kalamkari Peacock', 'Ajrakh Yoke', 'Mud Resist Blocks'],
    itemCount: 38,
    representativeTagline: 'Eco-conscious authentic artisan handblock collection',
    featured: true,
    type: '2_piece',
    popularFabrics: ['100% Handloom Cotton', 'Vegetable Dyed Cambric']
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-101',
    name: 'Kashvi Chanderi Silk Zari 3-Pc Suit Set',
    slug: 'kashvi-chanderi-silk-zari-3-pc-suit-set',
    sku: 'IC-CH-4091',
    minOrderSets: 1,
    designNumber: 'D-8012',
    categoryId: 'cat-5',
    categoryName: 'Pure Chanderi Silk 3-Pc Festive Suits',
    subcategory: 'Zari Woven',
    description: 'Handcrafted pure Chanderi silk kurti featuring authentic woven zari motifs on yoke, matched with solid Chanderi trousers with interlock lining and a scalloped embroidered organza dupatta.',
    fabric: 'Pure Chanderi Silk (Top), Chanderi Silk (Bottom), Organza (Dupatta)',
    workType: 'Zari Weaving & Hand Katha Highlights',
    style: 'Straight Cut Kurti with Cigarette Pant & Cutwork Dupatta',
    clothingType: '3_piece',
    piecesPerSet: 4, // M(38), L(40), XL(42), XXL(44)
    wholesalePricePerPiece: 840,
    wholesalePricePerSet: 3360, // 840 * 4
    availableSets: 18,
    totalAvailablePieces: 72,
    sizeCombination: 'M(38), L(40), XL(42), XXL(44)',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Wine Red', 'Teal Green', 'Royal Navy'],
    collectionName: 'Virasat Festive 2026',
    billingEntityId: 'entity_a',
    hsn: '621142',
    gstRate: 5,
    status: 'available',
    isNewArrival: true,
    isFeatured: true,
    media: [
      {
        id: 'm-101-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80',
        alt: 'Kashvi Chanderi Silk 3-Pc Suit front view',
        isPrimary: true
      },
      {
        id: 'm-101-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=900&auto=format&fit=crop&q=80',
        alt: 'Embroidered neckline close-up detail'
      },
      {
        id: 'm-101-3',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80',
        alt: 'Organza dupatta and pant set layout'
      }
    ],
    representativeDetails: {
      kurtiLength: '45 inches',
      bottomLength: '38 inches',
      dupattaLength: '2.25 meters',
      dupattaFabric: 'Scalloped Embroidered Organza',
      liningIncluded: true,
      pocketIncluded: true,
      neckPattern: 'Round Neck with Keyhole & Zari Placket',
      sleeveLength: 'Three-Quarter (17 inches)',
      careInstruction: 'Dry Clean Recommended for longevity'
    },
    createdAt: '2026-08-10T10:00:00Z'
  },
  {
    id: 'prod-102',
    name: 'Jaipuri Bagru Handblock Pure Cotton 2-Pc Set',
    slug: 'jaipuri-bagru-handblock-pure-cotton-2-pc-set',
    sku: 'IC-CT-2084',
    minOrderSets: 1,
    designNumber: 'D-3140',
    categoryId: 'cat-6',
    categoryName: 'Daily Wear Pure Cotton 2-Pc Sets',
    subcategory: 'Bagru Prints',
    description: 'Authentic 60x60 Jaipuri cambric cotton straight kurti with wooden button detailing and coordinated chevron print cotton pant featuring a dual side pocket and elasticated waistband.',
    fabric: '100% 60x60 Cambric Pure Cotton',
    workType: 'Traditional Hand Wooden Block Print',
    style: 'Straight Kurti with Ankle Length Pant',
    clothingType: '2_piece',
    piecesPerSet: 5, // S(36), M(38), L(40), XL(42), XXL(44)
    wholesalePricePerPiece: 420,
    wholesalePricePerSet: 2100, // 420 * 5
    availableSets: 35,
    totalAvailablePieces: 175,
    sizeCombination: 'S(36), M(38), L(40), XL(42), XXL(44)',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Indigo Blue', 'Rust Maroon', 'Earthy Mustard'],
    collectionName: 'Dabu Sanganer Daily 2026',
    billingEntityId: 'entity_b',
    hsn: '621142',
    gstRate: 5,
    status: 'available',
    isNewArrival: false,
    isFeatured: true,
    media: [
      {
        id: 'm-102-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=900&auto=format&fit=crop&q=80',
        alt: 'Jaipuri Cotton Kurti Pant Set',
        isPrimary: true
      },
      {
        id: 'm-102-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80',
        alt: 'Fabric texture and pocket view'
      }
    ],
    representativeDetails: {
      kurtiLength: '44 inches',
      bottomLength: '37.5 inches',
      liningIncluded: false,
      pocketIncluded: true,
      neckPattern: 'Mandarin Collar with Functional Buttons',
      sleeveLength: 'Three-Quarter (16.5 inches)',
      careInstruction: 'Hand Wash Cold / Machine Wash'
    },
    createdAt: '2026-08-12T14:30:00Z'
  },
  {
    id: 'prod-103',
    name: 'Riwaaz Alia Cut Muslin Flared 3-Pc Suit',
    slug: 'riwaaz-alia-cut-muslin-flared-3-pc-suit',
    sku: 'IC-AL-5502',
    minOrderSets: 1,
    designNumber: 'D-9210',
    categoryId: 'cat-4',
    categoryName: 'Alia Cut Flared Suit Set (3-Pc)',
    subcategory: 'Neck Lace Details',
    description: 'High-trending V-neck gathered Alia cut silhouette in pure muslin fabric with pearl handwork, cotton lining, matched trousers, and a digital floral printed chiffon dupatta with tassel edges.',
    fabric: 'Pure Silk Muslin (Kurta), Muslin Slub (Pant), Chiffon (Dupatta)',
    workType: 'Pearl Embroidery with Gota Border Lace',
    style: 'Gathered Flared Alia Cut with Pant & Chiffon Dupatta',
    clothingType: '3_piece',
    piecesPerSet: 4,
    wholesalePricePerPiece: 790,
    wholesalePricePerSet: 3160,
    availableSets: 12,
    totalAvailablePieces: 48,
    sizeCombination: 'M(38), L(40), XL(42), XXL(44)',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Dusty Rose', 'Mint Sage', 'Lavender Mist'],
    collectionName: 'Riwaaz Festive Edit',
    billingEntityId: 'entity_a',
    hsn: '621142',
    gstRate: 5,
    status: 'available',
    isNewArrival: true,
    isFeatured: true,
    media: [
      {
        id: 'm-103-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80',
        alt: 'Alia cut flared suit set showcase',
        isPrimary: true
      },
      {
        id: 'm-103-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=900&auto=format&fit=crop&q=80',
        alt: 'V-neckline lace and gathers detail'
      }
    ],
    representativeDetails: {
      kurtiLength: '46 inches',
      bottomLength: '38 inches',
      dupattaLength: '2.2 meters',
      dupattaFabric: 'Pure Chiffon Digital Print with Tassels',
      liningIncluded: true,
      pocketIncluded: true,
      neckPattern: 'Deep V-Neck with Fine Thread Lace',
      sleeveLength: 'Three-Quarter',
      careInstruction: 'Gentle Hand Wash or Dry Clean'
    },
    createdAt: '2026-08-15T09:15:00Z'
  },
  {
    id: 'prod-104',
    name: 'Tarang Nayra Cut Heavy Rayon Kurti Pant Set',
    slug: 'tarang-nayra-cut-heavy-rayon-kurti-pant-set',
    sku: 'IC-NY-3108',
    designNumber: 'D-5524',
    categoryId: 'cat-3',
    categoryName: 'Nayra Cut Kurti Pant Set (2-Pc)',
    subcategory: 'Embroidered Neckline',
    description: 'Heavy 14kg Liva rayon Nayra cut kurta featuring heavy mirror embroidery around the high waist slits and neck, with matching solid straight pants.',
    fabric: 'Heavy 14kg Liva Rayon',
    workType: 'Foil Mirror Embroidery with Dori Tassels',
    style: 'High Slit Nayra Cut with Straight Trouser',
    clothingType: '2_piece',
    piecesPerSet: 4,
    wholesalePricePerPiece: 540,
    wholesalePricePerSet: 2160,
    minOrderSets: 1,
    availableSets: 24,
    totalAvailablePieces: 96,
    sizeCombination: 'M(38), L(40), XL(42), XXL(44)',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Bottle Green', 'Rani Pink', 'Maroon'],
    collectionName: 'Tarang Wholesale Vol. 4',
    billingEntityId: 'entity_b',
    hsn: '621142',
    gstRate: 5,
    status: 'available',
    isNewArrival: false,
    isFeatured: true,
    media: [
      {
        id: 'm-104-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&auto=format&fit=crop&q=80',
        alt: 'Nayra cut kurti set front angle',
        isPrimary: true
      },
      {
        id: 'm-104-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=900&auto=format&fit=crop&q=80',
        alt: 'Waist slit embroidery close-up'
      }
    ],
    representativeDetails: {
      kurtiLength: '45 inches',
      bottomLength: '38 inches',
      liningIncluded: false,
      pocketIncluded: true,
      neckPattern: 'Round Neck with Embroidered Yoke Placket',
      sleeveLength: 'Three-Quarter',
      careInstruction: 'Hand Wash Separately'
    },
    createdAt: '2026-08-16T11:00:00Z'
  },
  {
    id: 'prod-105',
    name: 'Noor Lucknowi Georgette Chikankari 3-Pc Suit',
    slug: 'noor-lucknowi-georgette-chikankari-3-pc-suit',
    sku: 'IC-LK-6019',
    designNumber: 'D-9905',
    categoryId: 'cat-9',
    categoryName: 'Hand Embroidered Lucknowi Chikankari',
    subcategory: 'Mukaish Work',
    description: 'Exquisite all-over hand Chikankari embroidery on pure Viscose Georgette with inner cotton lining, matching embroidered stretchable bottom, and a georgette mukaish dupatta.',
    fabric: 'Viscose Fox Georgette with Pure Cotton Lining',
    workType: 'Authentic Hand Chikankari (Bakhiya, Phanda & Mukaish)',
    style: 'A-Line Long Kurti with Lucknowi Pant & Dupatta',
    clothingType: '3_piece',
    piecesPerSet: 4,
    wholesalePricePerPiece: 1150,
    wholesalePricePerSet: 4600,
    availableSets: 8,
    totalAvailablePieces: 32,
    minOrderSets: 1,
    sizeCombination: 'M(38), L(40), XL(42), XXL(44)',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Powder Blue', 'Peach Pink', 'Off White', 'Pista Green'],
    collectionName: 'Noor Heritage Karigari',
    billingEntityId: 'entity_a',
    hsn: '621142',
    gstRate: 5,
    status: 'low_stock',
    isNewArrival: true,
    isFeatured: true,
    media: [
      {
        id: 'm-105-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80',
        alt: 'Lucknowi Chikankari Georgette Suit',
        isPrimary: true
      },
      {
        id: 'm-105-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80',
        alt: 'Hand Chikankari stitch texture detail'
      }
    ],
    representativeDetails: {
      kurtiLength: '46 inches',
      bottomLength: '38 inches',
      dupattaLength: '2.3 meters',
      dupattaFabric: 'Fox Georgette with Mukaish Highlights',
      liningIncluded: true,
      pocketIncluded: false,
      neckPattern: 'Round Neck Hand Embroidered',
      sleeveLength: 'Full Sleeve (20 inches)',
      careInstruction: 'Strictly Dry Clean'
    },
    createdAt: '2026-08-18T16:00:00Z'
  },
  {
    id: 'prod-106',
    name: 'Executive Tailored Linen-Cotton Cord Set (2-Pc)',
    slug: 'executive-tailored-linen-cotton-cord-set-2-pc',
    sku: 'IC-CR-1190',
    designNumber: 'D-1890',
    categoryId: 'cat-12',
    categoryName: 'Formal Office Wear Cord Sets (2-Pc)',
    subcategory: 'Linen Blends',
    description: 'Tailored mandarin-collar tunic top with concealed buttons paired with high-waisted cigarette trousers with deep side pockets. Premium breathable linen cotton blend.',
    fabric: 'Premium 70% Cotton 30% Linen Blend',
    minOrderSets: 1,
    workType: 'Minimal Tailored Solid with Contrast Stitching',
    style: 'Modern Cord Set (Shirt Style Top with Trousers)',
    clothingType: '2_piece',
    piecesPerSet: 4,
    wholesalePricePerPiece: 490,
    wholesalePricePerSet: 1960,
    availableSets: 28,
    totalAvailablePieces: 112,
    sizeCombination: 'M(38), L(40), XL(42), XXL(44)',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Beige Khaki', 'Slate Grey', 'Olive Green', 'Classic Black'],
    collectionName: 'Metropolis Corporate Fusion 2026',
    billingEntityId: 'entity_b',
    hsn: '621142',
    gstRate: 5,
    status: 'available',
    isNewArrival: false,
    isFeatured: false,
    media: [
      {
        id: 'm-106-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=900&auto=format&fit=crop&q=80',
        alt: 'Formal cord set modern look',
        isPrimary: true
      },
      {
        id: 'm-106-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=900&auto=format&fit=crop&q=80',
        alt: 'Fabric detail and pocket structure'
      }
    ],
    representativeDetails: {
      kurtiLength: '36 inches (Tunic length)',
      bottomLength: '38 inches',
      liningIncluded: false,
      pocketIncluded: true,
      neckPattern: 'Shirt Collar with Concealed Placket',
      sleeveLength: 'Full Sleeves with Cuffs',
      careInstruction: 'Machine Wash Gentle'
    },
    createdAt: '2026-08-19T08:00:00Z'
  },
  {
    id: 'prod-107',
    name: 'Nazneen Heavy Flared Anarkali 3-Pc Suit',
    slug: 'nazneen-heavy-flared-anarkali-3-pc-suit',
    sku: 'IC-AN-7820',
    designNumber: 'D-9450',
    categoryId: 'cat-2',
    categoryName: 'Anarkali with Pant & Dupatta (3-Pc)',
    subcategory: 'Gotta Patti Work',
    description: '3.5 meter wide flare Anarkali in soft Roman silk with original Rajasthani gotta patti work on kalis and hemline, matched with pants and a heavy gota bordered net dupatta.',
    fabric: 'Roman Silk with Heavy Micro Lining',
    workType: 'Traditional Gota Patti & Zari Lace Kali Work',
    style: 'Floor Length Full Flared Anarkali Suit',
    clothingType: '3_piece',
    piecesPerSet: 4,
    wholesalePricePerPiece: 990,
    wholesalePricePerSet: 3960,
    availableSets: 15,
    totalAvailablePieces: 60,
    sizeCombination: 'M(38), L(40), XL(42), XXL(44)',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Maroon Gold', 'Royal Blue', 'Emerald Green'],
    collectionName: 'Nazneen Bridal Guest 2026',
    billingEntityId: 'entity_a',
    minOrderSets: 1,
    hsn: '621142',
    gstRate: 5,
    status: 'available',
    isNewArrival: true,
    isFeatured: true,
    media: [
      {
        id: 'm-107-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80',
        alt: 'Nazneen Flared Anarkali 3-Pc set',
        isPrimary: true
      },
      {
        id: 'm-107-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=900&auto=format&fit=crop&q=80',
        alt: 'Gota patti border detail'
      }
    ],
    representativeDetails: {
      kurtiLength: '48 inches',
      bottomLength: '38.5 inches',
      dupattaLength: '2.4 meters',
      dupattaFabric: 'Soft Net with Heavy Gota Border',
      liningIncluded: true,
      pocketIncluded: false,
      neckPattern: 'Sweetheart Neck with Gota Placket',
      sleeveLength: 'Three-Quarter',
      careInstruction: 'Dry Clean Only'
    },
    createdAt: '2026-08-20T12:00:00Z'
  },
  {
    id: 'prod-108',
    name: 'Anubhuti Plus Size (3XL-6XL) Cotton Kurti Pant Set',
    slug: 'anubhuti-plus-size-3xl-6xl-cotton-kurti-pant-set',
    sku: 'IC-PS-8840',
    designNumber: 'D-4200',
    categoryId: 'cat-15',
    categoryName: 'Plus Size (3XL to 7XL) Kurti Pant Sets',
    subcategory: '3XL-4XL Lots',
    description: 'Expertly patterned plus-size set with comfortable broad shoulder cuts, deep armhole allowance, elastic back pant with drawstring, and slimming vertical ethnic print.',
    fabric: '100% 60x60 Jaipuri Cambric Cotton',
    workType: 'Rotary Screen Discharge Print with Wooden Buttons',
    style: 'Relaxed A-Line Plus Kurti with Comfort Pant',
    clothingType: '2_piece',
    piecesPerSet: 4, // 3XL(46), 4XL(48), 5XL(50), 6XL(52)
    wholesalePricePerPiece: 510,
    wholesalePricePerSet: 2040,
    minOrderSets: 1,
    availableSets: 19,
    totalAvailablePieces: 76,
    sizeCombination: '3XL(46), 4XL(48), 5XL(50), 6XL(52)',
    sizes: ['3XL', '4XL', '5XL', '6XL'],
    colors: ['Navy Blue Floral', 'Teal Green Motif', 'Maroon Paisley'],
    collectionName: 'Anubhuti Curvaceous 2026',
    billingEntityId: 'entity_b',
    hsn: '621142',
    gstRate: 5,
    status: 'available',
    isNewArrival: false,
    isFeatured: false,
    media: [
      {
        id: 'm-108-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80',
        alt: 'Plus size cotton kurti pant set',
        isPrimary: true
      },
      {
        id: 'm-108-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=900&auto=format&fit=crop&q=80',
        alt: 'Comfort waist and pocket finish'
      }
    ],
    representativeDetails: {
      kurtiLength: '45 inches',
      bottomLength: '39 inches',
      liningIncluded: false,
      pocketIncluded: true,
      neckPattern: 'V-Neck with Button Accent',
      sleeveLength: 'Three-Quarter (17 inches)',
      careInstruction: 'Machine Wash Normal'
    },
    createdAt: '2026-08-21T10:00:00Z'
  },
  {
    id: 'prod-109',
    name: 'Sultana Pure Velvet Kashmiri Tilla 3-Pc Suit',
    slug: 'sultana-pure-velvet-kashmiri-tilla-3-pc-suit',
    sku: 'IC-VL-9920',
    designNumber: 'D-9988',
    categoryId: 'cat-13',
    categoryName: 'Velvet Winter Special 3-Pc Sets',
    subcategory: 'Tilla Zari Work',
    description: 'Heavy 9000 micro velvet straight kurti with metallic antique Kashmiri tilla work on neckline and sleeves, paired with velvet trousers and a rich woven jacquard pashmina stole.',
    fabric: 'Micro Velvet 9000 (Kurti & Pant), Pashmina Jacquard (Stole)',
    workType: 'Fine Kashmiri Tilla Gold Thread Work',
    style: 'Straight Velvet Suit with Tilla Embroidered Stole',
    clothingType: '3_piece',
    piecesPerSet: 4,
    minOrderSets: 1,
    wholesalePricePerPiece: 1450,
    wholesalePricePerSet: 5800,
    availableSets: 6,
    totalAvailablePieces: 24,
    sizeCombination: 'M(38), L(40), XL(42), XXL(44)',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Imperial Maroon', 'Midnight Blue', 'Emerald Bottle Green'],
    collectionName: 'Sultana Velvet Winter Couture',
    billingEntityId: 'entity_a',
    hsn: '621142',
    gstRate: 5,
    status: 'low_stock',
    isNewArrival: true,
    isFeatured: true,
    media: [
      {
        id: 'm-109-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&auto=format&fit=crop&q=80',
        alt: 'Velvet Kashmiri suit collection',
        isPrimary: true
      },
      {
        id: 'm-109-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=900&auto=format&fit=crop&q=80',
        alt: 'Kashmiri tilla embroidery macro detail'
      }
    ],
    representativeDetails: {
      kurtiLength: '45 inches',
      bottomLength: '38.5 inches',
      dupattaLength: '2.25 meters',
      dupattaFabric: 'Woven Pashmina Jacquard Stole',
      liningIncluded: true,
      pocketIncluded: true,
      neckPattern: 'Round Neck Tilla Yoke',
      sleeveLength: 'Full Sleeve (20 inches)',
      careInstruction: 'Professional Dry Clean'
    },
    createdAt: '2026-08-22T15:00:00Z'
  },
  {
    id: 'prod-110',
    name: 'Zeenat Organza Embroidered 3-Pc Partywear Suit',
    slug: 'zeenat-organza-embroidered-3-pc-partywear-suit',
    sku: 'IC-OG-7710',
    designNumber: 'D-6810',
    categoryId: 'cat-10',
    categoryName: 'Organza Dupatta Partywear 3-Pc Suit',
    minOrderSets: 1,
    subcategory: 'Scallop Border',
    description: 'Roman silk straight kurti featuring sequin floral handwork, cotton lining, comfortable straight pants, and a signature heavy embroidered organza dupatta with scalloped borders.',
    fabric: 'Roman Silk Top, Heavy Silk Pant, Organza Dupatta',
    workType: 'Sequin, Cutdana and Thread Embroidery',
    style: 'Straight Kurti Pant with Statement Organza Dupatta',
    clothingType: '3_piece',
    piecesPerSet: 4,
    wholesalePricePerPiece: 880,
    wholesalePricePerSet: 3520,
    availableSets: 0,
    totalAvailablePieces: 0,
    sizeCombination: 'M(38), L(40), XL(42), XXL(44)',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Dusty Peach', 'Sky Azure', 'Lilac Lavender'],
    collectionName: 'Zeenat Partywear 2026',
    billingEntityId: 'entity_a',
    hsn: '621142',
    gstRate: 5,
    status: 'out_of_stock',
    isNewArrival: false,
    isFeatured: false,
    media: [
      {
        id: 'm-110-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=900&auto=format&fit=crop&q=80',
        alt: 'Zeenat Organza Partywear Suit',
        isPrimary: true
      }
    ],
    representativeDetails: {
      kurtiLength: '45 inches',
      bottomLength: '38 inches',
      dupattaLength: '2.3 meters',
      dupattaFabric: 'Scalloped Organza with Floral Spray',
      liningIncluded: true,
      pocketIncluded: true,
      neckPattern: 'Keyhole Neck with Sequin Yoke',
      sleeveLength: 'Three-Quarter',
      careInstruction: 'Dry Clean Recommended'
    },
    createdAt: '2026-08-23T11:30:00Z'
  },
  {
    id: 'prod-111',
    name: 'Kalamkari Handblock Natural Dye 2-Pc Kurti Set',
    slug: 'kalamkari-handblock-natural-dye-2-pc-kurti-set',
    sku: 'IC-KL-4402',
    designNumber: 'D-3380',
    categoryId: 'cat-20',
    categoryName: 'Kalamkari & Indigo Handblock 2-Pc Sets',
    subcategory: 'Kalamkari Peacock',
    description: 'Eco-friendly handblock printed Kalamkari kurti on South Indian handloom cotton with wooden coconut buttons and solid indigo dabu pants with deep pockets.',
    fabric: '100% Handloom Cotton (Natural Vegetable Dyes)',
    workType: 'Hand Block Print with Vegetable Dyes',
    style: 'Straight Kurti with Indigo Ankle Pant',
    minOrderSets: 1,

    clothingType: '2_piece',
    piecesPerSet: 5,
    wholesalePricePerPiece: 460,
    wholesalePricePerSet: 2300,
    availableSets: 22,
    totalAvailablePieces: 110,
    sizeCombination: 'S(36), M(38), L(40), XL(42), XXL(44)',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Kalamkari Ochre & Black', 'Indigo Dabu Blue', 'Brick Madder Red'],
    collectionName: 'Prakriti Artisan Blocks',
    billingEntityId: 'entity_b',
    hsn: '621142',
    gstRate: 5,
    status: 'available',
    isNewArrival: false,
    isFeatured: true,
    media: [
      {
        id: 'm-111-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80',
        alt: 'Kalamkari Natural Handblock Set',
        isPrimary: true
      },
      {
        id: 'm-111-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=900&auto=format&fit=crop&q=80',
        alt: 'Handblock detail and pocket'
      }
    ],
    representativeDetails: {
      kurtiLength: '44 inches',
      bottomLength: '37.5 inches',
      liningIncluded: false,
      pocketIncluded: true,
      neckPattern: 'Boat Neck with Slit & Wooden Buttons',
      sleeveLength: 'Three-Quarter',
      careInstruction: 'Wash with Like Colors in Cold Water'
    },
    createdAt: '2026-08-24T09:00:00Z'
  },
  {
    id: 'prod-112',
    name: 'Mehvish Muslin Silk Digital Print 3-Pc Suit',
    slug: 'mehvish-muslin-silk-digital-print-3-pc-suit',
    sku: 'IC-MS-8812',
    designNumber: 'D-7715',
    categoryId: 'cat-7',
    categoryName: 'Muslin Silk Digital Print 3-Pc Sets',
    subcategory: 'Botanical Prints',
    description: 'High-definition digital botanical prints on butter-soft muslin silk with delicate hand katha threadwork on neckline, matching dyed trousers and full-size printed muslin dupatta.',
    fabric: 'Pure Silk Muslin (Top & Dupatta), Muslin Twill (Bottom)',
    minOrderSets: 1,
    workType: 'Designer Digital Print & Katha Stitching',
    style: 'Straight Fit Suit with Muslin Dupatta',
    clothingType: '3_piece',
    piecesPerSet: 4,
    wholesalePricePerPiece: 760,
    wholesalePricePerSet: 3040,
    availableSets: 16,
    totalAvailablePieces: 64,
    sizeCombination: 'M(38), L(40), XL(42), XXL(44)',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Ivory Floral', 'Teal Botanical', 'Sunset Coral'],
    collectionName: 'Mehvish Digital Silk Vol. 2',
    billingEntityId: 'entity_a',
    hsn: '621142',
    gstRate: 5,
    status: 'available',
    isNewArrival: true,
    isFeatured: true,
    media: [
      {
        id: 'm-112-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&auto=format&fit=crop&q=80',
        alt: 'Mehvish Muslin Silk Digital Suit',
        isPrimary: true
      },
      {
        id: 'm-112-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80',
        alt: 'Digital print neckline detail'
      }
    ],
    representativeDetails: {
      kurtiLength: '45 inches',
      bottomLength: '38 inches',
      dupattaLength: '2.25 meters',
      dupattaFabric: 'Pure Muslin Digital Print',
      liningIncluded: true,
      pocketIncluded: true,
      neckPattern: 'Round Neck with Katha Work Placket',
      sleeveLength: 'Three-Quarter',
      careInstruction: 'Hand Wash Cold or Dry Clean'
    },
    createdAt: '2026-08-25T14:00:00Z'
  }
];

export const MOCK_RETAILERS: Retailer[] = [
  {
    id: 'ret-101',
    email: 'rajeshwari.kurtis@gmail.com',
    businessName: 'Rajeshwari Ethnic Boutique & Wholesale',
    applicantName: 'Rajeshwari Sharma',
    mobile: '+91 98290 12345',
    whatsapp: '+91 98290 12345',
    gstin: '07AAECR8812M1Z4',
    pan: 'AAECR8812M',
    businessType: 'Wholesale Retailer',
    address: {
      street: 'Shop No. 14-16, Laxmi Market, Chandni Chowk',
      area: 'Old Delhi',
      city: 'Delhi',
      state: 'Delhi',
      stateCode: '07',
      pincode: '110006',
      landmark: 'Near Town Hall'
    },
    status: 'approved',
    classification: 'Tier 1 - Platinum',
    kycApplicationId: 'kyc-app-001',
    moqOverride: false,
    createdAt: '2026-05-14T10:00:00Z',
    totalOrdersCount: 6,
    totalOrderValue: 148500
  },
  {
    id: 'ret-102',
    email: 'ananya.boutique.jaipur@gmail.com',
    businessName: 'Ananya Designer Boutiques',
    applicantName: 'Ananya Rathore',
    mobile: '+91 94140 77665',
    whatsapp: '+91 94140 77665',
    gstin: '08ABCPR4561Q1ZR',
    pan: 'ABCPR4561Q',
    businessType: 'Boutique Owner',
    address: {
      street: 'Plot 22, Bapu Bazaar Main Road',
      area: 'Bapu Bazaar',
      city: 'Jaipur',
      state: 'Rajasthan',
      stateCode: '08',
      pincode: '302003'
    },
    status: 'under_review',
    classification: 'New Partner',
    kycApplicationId: 'kyc-app-002',
    moqOverride: false,
    createdAt: '2026-08-28T08:30:00Z',
    totalOrdersCount: 0,
    totalOrderValue: 0
  },
  {
    id: 'ret-103',
    email: 'meera.textiles.lko@gmail.com',
    businessName: 'Meera Textiles & Sarees',
    applicantName: 'Vipin Agrawal',
    mobile: '+91 99180 55443',
    whatsapp: '+91 99180 55443',
    gstin: '09AAKFA2291J1ZT',
    pan: 'AAKFA2291J',
    businessType: 'Chain Store',
    address: {
      street: 'Shop 8, Aminabad Wholesale Cloth Market',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      stateCode: '09',
      pincode: '226018'
    },
    status: 'info_required',
    classification: 'Standard Wholesale',
    kycApplicationId: 'kyc-app-003',
    moqOverride: false,
    createdAt: '2026-08-26T12:00:00Z',
    totalOrdersCount: 0,
    totalOrderValue: 0
  },
  {
    id: 'ret-104',
    email: 'surat.trendz@yahoo.com',
    businessName: 'Surat Trendz Wholesale Hub',
    applicantName: 'Ketan Patel',
    mobile: '+91 98251 11223',
    whatsapp: '+91 98251 11223',
    gstin: '24AAFPS9981B1ZG',
    pan: 'AAFPS9981B',
    businessType: 'Reseller / Distributor',
    address: {
      street: 'Ring Road Radha Krishna Market',
      city: 'Surat',
      state: 'Gujarat',
      stateCode: '24',
      pincode: '395002'
    },
    status: 'suspended',
    classification: 'Standard Wholesale',
    createdAt: '2026-04-10T11:00:00Z',
    totalOrdersCount: 3,
    totalOrderValue: 62000
  }
];

export const MOCK_KYC_APPLICATIONS: KYCApplication[] = [
  {
    id: 'kyc-app-001',
    retailerId: 'ret-101',
    businessName: 'Rajeshwari Ethnic Boutique & Wholesale',
    applicantName: 'Rajeshwari Sharma',
    businessType: 'Wholesale Whole Seller',
    mobile: '+91 98290 12345',
    whatsapp: '+91 98290 12345',
    email: 'rajeshwari.kurtis@gmail.com',
    gstin: '07AAECR8812M1Z4',
    pan: 'AAECR8812M',
    annualTurnover: '₹50 Lakhs - ₹1 Crore',
    yearsInBusiness: '8 Years',
    address: {
      street: 'Shop No. 14-16, Laxmi Market, Chandni Chowk',
      city: 'Delhi',
      state: 'Delhi',
      stateCode: '07',
      pincode: '110006'
    },
    documents: [
      {
        id: 'doc-1',
        name: 'GST_Certificate_Rajeshwari_2026.pdf',
        type: 'gst_certificate',
        url: '#',
        size: '1.4 MB',
        uploadedAt: '2026-05-14T10:05:00Z',
        status: 'verified'
      },
      {
        id: 'doc-2',
        name: 'PAN_Card_Business.jpg',
        type: 'pan_card',
        url: '#',
        size: '840 KB',
        uploadedAt: '2026-05-14T10:06:00Z',
        status: 'verified'
      },
      {
        id: 'doc-3',
        name: 'Shop_Establishment_Proof.pdf',
        type: 'shop_proof',
        url: '#',
        size: '2.1 MB',
        uploadedAt: '2026-05-14T10:07:00Z',
        status: 'verified'
      }
    ],
    status: 'approved',
    submittedAt: '2026-05-14T10:10:00Z',
    reviewedAt: '2026-05-15T11:20:00Z',
    reviewedBy: 'Prakash Mehta (Admin)',
    remarks: 'Verified GSTIN and store address physically. Premium category partner.'
  },
  {
    id: 'kyc-app-002',
    retailerId: 'ret-102',
    businessName: 'Ananya Designer Boutiques',
    applicantName: 'Ananya Rathore',
    businessType: 'Boutique Owner',
    mobile: '+91 94140 77665',
    whatsapp: '+91 94140 77665',
    email: 'ananya.boutique.jaipur@gmail.com',
    gstin: '08ABCPR4561Q1ZR',
    pan: 'ABCPR4561Q',
    annualTurnover: '₹25 Lakhs - ₹50 Lakhs',
    yearsInBusiness: '3 Years',
    address: {
      street: 'Plot 22, Bapu Bazaar Main Road',
      city: 'Jaipur',
      state: 'Rajasthan',
      stateCode: '08',
      pincode: '302003'
    },
    documents: [
      {
        id: 'doc-4',
        name: 'GST_Reg_08ABCPR4561Q1ZR.pdf',
        type: 'gst_certificate',
        url: '#',
        size: '1.8 MB',
        uploadedAt: '2026-08-28T08:35:00Z',
        status: 'pending'
      },
      {
        id: 'doc-5',
        name: 'Ananya_Boutique_VisitingCard.jpg',
        type: 'visiting_card',
        url: '#',
        size: '620 KB',
        uploadedAt: '2026-08-28T08:36:00Z',
        status: 'pending'
      }
    ],
    status: 'under_review',
    submittedAt: '2026-08-28T08:40:00Z',
    remarks: 'Awaiting GSTIN verification from portal.'
  },
  {
    id: 'kyc-app-003',
    retailerId: 'ret-103',
    businessName: 'Meera Textiles & Sarees',
    applicantName: 'Vipin Agrawal',
    businessType: 'Chain Store',
    mobile: '+91 99180 55443',
    whatsapp: '+91 99180 55443',
    email: 'meera.textiles.lko@gmail.com',
    gstin: '09AAKFA2291J1ZT',
    pan: 'AAKFA2291J',
    annualTurnover: '₹1 Crore+',
    yearsInBusiness: '12 Years',
    address: {
      street: 'Shop 8, Aminabad Wholesale Cloth Market',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      stateCode: '09',
      pincode: '226018'
    },
    documents: [
      {
        id: 'doc-6',
        name: 'GSTIN_Partial_Doc.pdf',
        type: 'gst_certificate',
        url: '#',
        size: '410 KB',
        uploadedAt: '2026-08-26T12:10:00Z',
        status: 'rejected',
        rejectionReason: 'Page 2 of GST registration certificate (Trade name Annexure) is missing.'
      }
    ],
    status: 'info_required',
    submittedAt: '2026-08-26T12:15:00Z',
    reviewedAt: '2026-08-27T09:30:00Z',
    reviewedBy: 'Sunita Jain (Compliance)',
    infoRequestNotes: 'Please re-upload complete 3-page GST certificate including Annexure A & B showing registered trade name "Meera Textiles".'
  }
];

export const MOCK_MOQ_RULES: MOQRule[] = [
  {
    id: 'moq-global',
    name: 'Standard Wholesale Global Rule',
    scope: 'global',
    minSets: 4, // 4 sets minimum across cart
    minDesigns: 1,
    minPieces: 16,
    minOrderValue: 8000,
    description: 'Minimum 4 wholesale sets required per master order enquiry to unlock instant submission.',
    isActive: true
  },
  {
    id: 'moq-chanderi',
    name: 'Chanderi & Festive Heavy Suits Rule',
    scope: 'category',
    scopeId: 'cat-5',
    minSets: 2,
    minDesigns: 1,
    minPieces: 8,
    minOrderValue: 6000,
    description: 'High-value Chanderi silk suits qualify for lower minimum set threshold (2 sets).',
    isActive: true
  }
];

export const MOCK_ORDERS: OrderEnquiry[] = [
  {
    id: 'ord-2026-8801',
    orderNumber: 'IC-ORD-8801',
    retailerId: 'ret-101',
    retailerBusinessName: 'Rajeshwari Ethnic Boutique & Wholesale',
    retailerApplicantName: 'Rajeshwari Sharma',
    retailerGstin: '07AAECR8812M1Z4',
    retailerContact: '+91 98290 12345',
    retailerEmail: 'rajeshwari.kurtis@gmail.com',
    billingAddress: {
      street: 'Shop No. 14-16, Laxmi Market, Chandni Chowk',
      city: 'Delhi',
      state: 'Delhi',
      stateCode: '07',
      pincode: '110006'
    },
    shippingAddress: {
      street: 'Shop No. 14-16, Laxmi Market, Chandni Chowk',
      city: 'Delhi',
      state: 'Delhi',
      stateCode: '07',
      pincode: '110006'
    },
    items: [
      {
        productId: 'prod-101',
        productName: 'Kashvi Chanderi Silk Zari 3-Pc Suit Set',
        sku: 'IC-CH-4091',
        designNumber: 'D-8012',
        categoryName: 'Pure Chanderi Silk 3-Pc Festive Suits',
        billingEntityId: 'entity_a',
        sets: 3,
        piecesPerSet: 4,
        totalPieces: 12,
        pieceRate: 840,
        setRate: 3360,
        lineSubtotal: 10080,
        hsn: '621142',
        gstRate: 5,
        gstAmount: 504,
        totalWithGst: 10584,
        imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=80',
        sizeCombination: 'M(38), L(40), XL(42), XXL(44)',
        color: 'Wine Red'
      },
      {
        productId: 'prod-102',
        productName: 'Jaipuri Bagru Handblock Pure Cotton 2-Pc Set',
        sku: 'IC-CT-2084',
        designNumber: 'D-3140',
        categoryName: 'Daily Wear Pure Cotton 2-Pc Sets',
        billingEntityId: 'entity_b',
        sets: 3,
        piecesPerSet: 5,
        totalPieces: 15,
        pieceRate: 420,
        setRate: 2100,
        lineSubtotal: 6300,
        hsn: '621142',
        gstRate: 5,
        gstAmount: 315,
        totalWithGst: 6615,
        imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&auto=format&fit=crop&q=80',
        sizeCombination: 'S(36), M(38), L(40), XL(42), XXL(44)',
        color: 'Indigo Blue'
      }
    ],
    totalDesigns: 2,
    totalSets: 6,
    totalPieces: 27,
    subtotal: 16380,
    totalGst: 819,
    shipping: 450,
    masterTotal: 17649,
    status: 'estimate_generated',
    timeline: [
      {
        status: 'enquiry_received',
        timestamp: '2026-08-28T14:10:00Z',
        note: 'Order Enquiry submitted by Whole Seller via Web Portal.',
        actor: 'Rajeshwari Sharma'
      },
      {
        status: 'under_review',
        timestamp: '2026-08-28T15:00:00Z',
        note: 'Inventory sets allocated and stock confirmed in Surat & Jaipur hubs.',
        actor: 'Admin Team'
      },
      {
        status: 'estimate_generated',
        timestamp: '2026-08-29T10:30:00Z',
        note: 'Dual GST Estimates EST-SUR-8801A & EST-JPR-8801B generated and dispatched to retailer WhatsApp.',
        actor: 'Iccha Accounts Dept'
      }
    ],
    entityIds: ['entity_a', 'entity_b'],
    estimates: [
      {
        id: 'est-doc-8801-a',
        estimateNumber: 'EST-SUR-8801A',
        orderId: 'ord-2026-8801',
        orderNumber: 'IC-ORD-8801',
        date: '2026-08-29',
        validUntil: '2026-09-08',
        billingEntity: MOCK_BILLING_ENTITIES[0],
        retailer: {
          id: 'ret-101',
          businessName: 'Rajeshwari Ethnic Boutique & Wholesale',
          applicantName: 'Rajeshwari Sharma',
          gstin: '07AAECR8812M1Z4',
          pan: 'AAECR8812M',
          mobile: '+91 98290 12345',
          email: 'rajeshwari.kurtis@gmail.com',
          billingAddress: {
            street: 'Shop No. 14-16, Laxmi Market, Chandni Chowk',
            city: 'Delhi',
            state: 'Delhi',
            stateCode: '07',
            pincode: '110006'
          },
          shippingAddress: {
            street: 'Shop No. 14-16, Laxmi Market, Chandni Chowk',
            city: 'Delhi',
            state: 'Delhi',
            stateCode: '07',
            pincode: '110006'
          }
        },
        items: [
          {
            productId: 'prod-101',
            productName: 'Kashvi Chanderi Silk Zari 3-Pc Suit Set',
            sku: 'IC-CH-4091',
            designNumber: 'D-8012',
            categoryName: 'Pure Chanderi Silk 3-Pc Festive Suits',
            billingEntityId: 'entity_a',
            sets: 3,
            piecesPerSet: 4,
            totalPieces: 12,
            pieceRate: 840,
            setRate: 3360,
            lineSubtotal: 10080,
            hsn: '621142',
            gstRate: 5,
            gstAmount: 504,
            totalWithGst: 10584,
            imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=80',
            sizeCombination: 'M(38), L(40), XL(42), XXL(44)',
            color: 'Wine Red'
          }
        ],
        totalSets: 3,
        totalPieces: 12,
        taxableSubtotal: 10080,
        isInterState: true,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 504,
        totalGst: 504,
        shippingCharge: 250,
        grandTotal: 10834,
        paymentTerms: [
          'This is a commercial Proforma Estimate / Order Enquiry confirmation, not a tax invoice.',
          'Stock is reserved for 5 working days from generation date.',
          'Payment via RTGS/NEFT/Bank Transfer to Iccha Fashions Pvt Ltd HDFC Bank account.',
          'Dispatch will be initiated within 24-48 hours of payment verification.'
        ]
      },
      {
        id: 'est-doc-8801-b',
        estimateNumber: 'EST-JPR-8801B',
        orderId: 'ord-2026-8801',
        orderNumber: 'IC-ORD-8801',
        date: '2026-08-29',
        validUntil: '2026-09-08',
        billingEntity: MOCK_BILLING_ENTITIES[1],
        retailer: {
          id: 'ret-101',
          businessName: 'Rajeshwari Ethnic Boutique & Wholesale',
          applicantName: 'Rajeshwari Sharma',
          gstin: '07AAECR8812M1Z4',
          pan: 'AAECR8812M',
          mobile: '+91 98290 12345',
          email: 'rajeshwari.kurtis@gmail.com',
          billingAddress: {
            street: 'Shop No. 14-16, Laxmi Market, Chandni Chowk',
            city: 'Delhi',
            state: 'Delhi',
            stateCode: '07',
            pincode: '110006'
          },
          shippingAddress: {
            street: 'Shop No. 14-16, Laxmi Market, Chandni Chowk',
            city: 'Delhi',
            state: 'Delhi',
            stateCode: '07',
            pincode: '110006'
          }
        },
        items: [
          {
            productId: 'prod-102',
            productName: 'Jaipuri Bagru Handblock Pure Cotton 2-Pc Set',
            sku: 'IC-CT-2084',
            designNumber: 'D-3140',
            categoryName: 'Daily Wear Pure Cotton 2-Pc Sets',
            billingEntityId: 'entity_b',
            sets: 3,
            piecesPerSet: 5,
            totalPieces: 15,
            pieceRate: 420,
            setRate: 2100,
            lineSubtotal: 6300,
            hsn: '621142',
            gstRate: 5,
            gstAmount: 315,
            totalWithGst: 6615,
            imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&auto=format&fit=crop&q=80',
            sizeCombination: 'S(36), M(38), L(40), XL(42), XXL(44)',
            color: 'Indigo Blue'
          }
        ],
        totalSets: 3,
        totalPieces: 15,
        taxableSubtotal: 6300,
        isInterState: true,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 315,
        totalGst: 315,
        shippingCharge: 200,
        grandTotal: 6815,
        paymentTerms: [
          'Commercial Proforma Estimate issued by Iccha Apparels & Textiles LLP (Jaipur).',
          'Cotton lots pre-washed and verified for colorfastness.',
          'Payment via RTGS/NEFT to ICICI Bank account.',
          'Door delivery via surface express transport.'
        ]
      }
    ],
    customerRemarks: 'Please pack in waterproof corrugated boxes for Delhi monsoon.',
    createdAt: '2026-08-28T14:10:00Z',
    updatedAt: '2026-08-29T10:30:00Z'
  }
];

export const MOCK_SELLER_REQUESTS: SellerContactRequest[] = [
  {
    id: 'req-call-101',
    retailerId: 'ret-102',
    customerName: 'Ananya Rathore',
    businessName: 'Ananya Designer Boutiques',
    mobile: '+91 94140 77665',
    whatsapp: '+91 94140 77665',
    cartSummary: {
      totalDesigns: 1,
      totalSets: 2,
      totalPieces: 8,
      subtotal: 6720,
      items: [
        {
          name: 'Kashvi Chanderi Silk Zari 3-Pc Suit Set',
          sku: 'IC-CH-4091',
          designNumber: 'D-8012',
          sets: 2,
          pieces: 8,
          rate: 840
        }
      ]
    },
    preferredDate: '2026-09-02',
    preferredTime: '3:00 PM - 5:00 PM IST',
    remarks: 'We are a boutique testing sample quality before placing a bulk 50 set festival order. Please allow 2 sets trial order or conduct a video call sample display.',
    status: 'contact_pending',
    createdAt: '2026-08-29T16:45:00Z'
  }
];
