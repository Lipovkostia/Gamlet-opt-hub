
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
// ProductBadge now effectively just a string, but keeping type alias for clarity
export type ProductBadge = string; 
export type CustomerType = string;

export const ALL_CUSTOMER_TYPES: CustomerType[] = ['Розничный', 'постоянный', 'оптовый', 'крупный опт', 'средний опт'];

export interface Shop {
    id: string;
    name: string;
    ownerEmail: string;
    createdAt: string;
    roles?: string[];
}

export interface Badge {
    id: string;
    text: string;
    color: string;
}

export interface Product {
  id: string;
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
  badge?: ProductBadge | null;
  priceOverridesPerUnit?: {
    half?: number; // Price per unit override if buying half
    quarter?: number; // Price per unit override if buying quarter
  }
  costPrice?: number;
  usp1Price?: number;
  usp1UseGlobalMarkup?: boolean;
  priceTiers?: Record<string, number>; // Dynamic keys for roles (base price)
  tierPortions?: Record<string, ProductPortion[]>; // Dynamic keys for roles (allowed portions)
  tierPriceOverrides?: Record<string, { half?: number; quarter?: number }>; // Dynamic keys for roles (special prices)
  visibleToRoles?: CustomerType[]; // If undefined or empty, visible to all
}

export interface CartItem {
  cartId: string; // Unique identifier for the group, e.g. '1-half'
  id: string; // product id
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
  id: string;
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
  productId: string;
  name: string;
  quantity: number; // amount in unit
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  date: string;
  items: OrderItem[];
  totalAmount: number;
  totalWeight: number; // This might need reconsideration if mixing units
  status: OrderStatus;
}
