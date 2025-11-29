import { Supplier, Conversation, Offer, ProductCategory } from '@/types/procurement';

export const mockSuppliers: Supplier[] = [
  {
    id: 's3',
    name: 'MetalWorks Inc',
    category: 'metal',
    rating: 4.9,
    responseTime: '1h',
    priceRange: '$$$',
    location: 'Pennsylvania, USA',
  },
  {
    id: 's4',
    name: 'Steel Innovations',
    category: 'metal',
    rating: 4.7,
    responseTime: '3h',
    priceRange: '$$',
    location: 'Ohio, USA',
  },
  {
    id: 's5',
    name: 'Precision Steel Co',
    category: 'metal',
    rating: 4.8,
    responseTime: '2h',
    priceRange: '$$$',
    location: 'Michigan, USA',
  },
  {
    id: 's6',
    name: 'Industrial Metals Ltd',
    category: 'metal',
    rating: 4.6,
    responseTime: '4h',
    priceRange: '$$',
    location: 'Indiana, USA',
  },
];

export const mockConversations: Conversation[] = [
  {
    id: 'c3',
    supplierId: 's3',
    status: 'offer_received',
    lastMessage: 'Final offer attached with 2-week delivery',
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
    progress: 95,
  },
  {
    id: 'c4',
    supplierId: 's4',
    status: 'waiting',
    lastMessage: 'Waiting for pricing from production team',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    progress: 40,
  },
  {
    id: 'c5',
    supplierId: 's5',
    status: 'negotiating',
    lastMessage: 'Reviewing your volume requirements',
    timestamp: new Date(Date.now() - 1000 * 60 * 35),
    progress: 65,
  },
  {
    id: 'c6',
    supplierId: 's6',
    status: 'offer_received',
    lastMessage: 'Competitive quote ready for your review',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    progress: 90,
  },
];

export const mockOffers: Offer[] = [
  {
    id: 'o3',
    supplierId: 's3',
    supplierName: 'MetalWorks Inc',
    category: 'metal',
    price: 28000,
    deliveryTime: '2 weeks',
    terms: 'Payment on delivery, certified materials',
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
    summary: '2 tons of stainless steel grade 304, certified quality with material certificates.',
    isPotential: true,
  },
  {
    id: 'o5',
    supplierId: 's5',
    supplierName: 'Precision Steel Co',
    category: 'metal',
    price: 26500,
    deliveryTime: '3 weeks',
    terms: 'Net 30 payment terms, quality guarantee',
    timestamp: new Date(Date.now() - 1000 * 60 * 35),
    summary: '2 tons of stainless steel grade 316, premium quality with full traceability.',
    isPotential: true,
  },
  {
    id: 'o6',
    supplierId: 's6',
    supplierName: 'Industrial Metals Ltd',
    category: 'metal',
    price: 27200,
    deliveryTime: '2 weeks',
    terms: 'Payment upon delivery, ISO certified',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    summary: '2 tons of stainless steel grade 304, fast delivery with complete documentation.',
    isPotential: true,
  },
];

export const getSuppliersByCategory = (category: ProductCategory): Supplier[] => {
  return mockSuppliers.filter((s) => s.category === category);
};

export const getConversationBySupplier = (supplierId: string): Conversation | undefined => {
  return mockConversations.find((c) => c.supplierId === supplierId);
};

export const getOffersByCategory = (category: ProductCategory): Offer[] => {
  return mockOffers.filter((o) => o.category === category);
};
