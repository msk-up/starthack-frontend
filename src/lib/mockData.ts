import { Supplier, Conversation, Offer, ProductCategory } from '@/types/procurement';

export const mockSuppliers: Supplier[] = [
  {
    id: 's1',
    name: 'TechCore Solutions',
    category: 'computers',
    rating: 4.8,
    responseTime: '2h',
    priceRange: '$$$',
    location: 'California, USA',
  },
  {
    id: 's2',
    name: 'Digital Dynamics',
    category: 'computers',
    rating: 4.6,
    responseTime: '4h',
    priceRange: '$$',
    location: 'Texas, USA',
  },
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
    name: 'Apparel Masters',
    category: 'hoodies',
    rating: 4.5,
    responseTime: '2h',
    priceRange: '$$',
    location: 'New York, USA',
  },
  {
    id: 's6',
    name: 'Fashion Forward',
    category: 'hoodies',
    rating: 4.4,
    responseTime: '5h',
    priceRange: '$',
    location: 'California, USA',
  },
];

export const mockConversations: Conversation[] = [
  {
    id: 'c1',
    supplierId: 's1',
    status: 'offer_received',
    lastMessage: 'We can offer 15% discount on bulk orders',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    progress: 90,
  },
  {
    id: 'c2',
    supplierId: 's2',
    status: 'negotiating',
    lastMessage: 'Checking inventory for requested quantity',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    progress: 60,
  },
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
];

export const mockOffers: Offer[] = [
  {
    id: 'o1',
    supplierId: 's1',
    supplierName: 'TechCore Solutions',
    category: 'computers',
    price: 45000,
    deliveryTime: '3 weeks',
    terms: 'Payment within 30 days, 1-year warranty',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    summary: '50 Dell Latitude laptops with i7 processor, 16GB RAM, 512GB SSD. Volume discount applied.',
    isPotential: true,
  },
  {
    id: 'o2',
    supplierId: 's2',
    supplierName: 'Digital Dynamics',
    category: 'computers',
    price: 42000,
    deliveryTime: '4 weeks',
    terms: 'Payment within 45 days, 2-year warranty',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    summary: '50 HP EliteBook laptops with i7 processor, 16GB RAM, 512GB SSD. Extended warranty included.',
    isPotential: true,
  },
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
    id: 'o4',
    supplierId: 's5',
    supplierName: 'Apparel Masters',
    category: 'hoodies',
    price: 3500,
    deliveryTime: '2 weeks',
    terms: 'Payment upfront, free shipping',
    timestamp: new Date(Date.now() - 1000 * 60 * 50),
    summary: '200 custom branded hoodies, premium cotton blend, full-color logo print.',
    isPotential: false,
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
