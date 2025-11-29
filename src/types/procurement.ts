export interface Supplier {
  id: string;
  name: string;
  category: ProductCategory;
  rating: number;
  responseTime: string;
  priceRange: string;
  location: string;
}

export interface Conversation {
  id: string;
  supplierId: string;
  status: 'negotiating' | 'waiting' | 'offer_received' | 'completed';
  lastMessage: string;
  timestamp: Date;
  progress: number;
}

export interface Offer {
  id: string;
  supplierId: string;
  supplierName: string;
  category: ProductCategory;
  price: number;
  deliveryTime: string;
  terms: string;
  timestamp: Date;
  summary: string;
  isPotential: boolean;
  isWinner?: boolean;
}

export type ProductCategory = 'computers' | 'metal' | 'hoodies' | 'office_supplies' | 'electronics';

export const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'computers', label: 'Computers' },
  { value: 'metal', label: 'Metal' },
  { value: 'hoodies', label: 'Hoodies' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'electronics', label: 'Electronics' },
];
