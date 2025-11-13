export enum ProductStatus {
  Available = 'available',
  OutOfStock = 'out_of_stock',
  Hidden = 'hidden',
}

export enum OrderStatus {
  New = 'new',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export type ProductPortion = 'whole' | 'half' | 'quarter';
export type ProductUnit = 'kg' | 'g' | 'pcs' | 'l';
export type ProductPackaging = 'головка' | 'упаковка' | 'штука' | 'банка' | 'ящик';
export type ProductBadge = 'ХИТ' | 'акция' | 'мало' | 'много';
export type CustomerType = 'Розничный' | 'постоянный' | 'оптовый' | 'крупный опт' | 'средний опт';


export interface Product {
  id: number;
  name: string;
  pricePerUnit: number;
  categories: string[];
  imageUrls: string[];
  unitValue: number; // e.g., 5.3 for kg, 250 for g, 1 for pcs
  unit: ProductUnit;
  packaging: ProductPackaging;
  description: string;
  allowedPortions: ProductPortion[];
  status: ProductStatus;
  badge?: ProductBadge;
  priceOverridesPerUnit?: {
    half?: number; // Price per unit override if buying half
    quarter?: number; // Price per unit override if buying quarter
  }
  costPrice?: number;
  usp1Price?: number;
  usp1UseGlobalMarkup?: boolean;
  priceTiers?: {
    'оптовый'?: number;
    'средний опт'?: number;
    'крупный опт'?: number;
  };
}

export interface CartItem {
  cartId: string; // Unique identifier for the group, e.g. '1-half'
  id: number; // product id
  name: string;
  imageUrl: string;
  unit: ProductUnit;
  portion: ProductPortion;
  quantity: number; // count of this item/portion
  price: number; // price for ONE portion
  unitValue: number; // weight/value for ONE portion
}

// For Authentication
export interface User {
  id: number;
  email: string;
  passwordHash: string; // In a real app, never store plain text passwords
  isAdmin?: boolean;
  name?: string;
  city?: string;
  address?: string;
  customerType?: CustomerType;
}

// For Order History
export interface OrderItem {
  productId: number;
  name: string;
  quantity: number; // amount in unit
  price: number;
}

export interface Order {
  id: string;
  userId: number;
  date: string;
  items: OrderItem[];
  totalAmount: number;
  totalWeight: number; // This might need reconsideration if mixing units
  status: OrderStatus;
}