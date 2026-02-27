export type UserRole = "user" | "admin" | "staff" | "super_admin";

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

export type RequestStatus =
  | "pending"
  | "reviewing"
  | "quoted"
  | "accepted"
  | "paid"
  | "ordered"
  | "in_warehouse"
  | "shipped"
  | "delivered";

export type ShipmentStatus = "pending" | "shipped" | "delivered";

export type PaymentMethod = "paystack" | "stripe" | "wallet";

export type WalletTransactionType =
  | "credit"
  | "debit"
  | "referral"
  | "cashback"
  | "refund";

export interface Profile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  role: UserRole;
  referral_code: string | null;
  referred_by_id: string | null;
  wallet_balance: number;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  price_adjustment: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  category_id: string | null;
  description: string | null;
  images: string[];
  price: number;
  currency: string;
  stock: number;
  sku: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  variants?: ProductVariant[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_price: number;
  currency: string;
  shipment_batch_id: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  shipment_batch?: ShipmentBatch;
}

export interface Request {
  id: string;
  user_id: string;
  product_name: string;
  link_or_image: string;
  description: string | null;
  budget: number | null;
  status: RequestStatus;
  quote_price: number | null;
  shipment_batch_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShipmentBatch {
  id: string;
  batch_name: string;
  shipment_date: string;
  status: ShipmentStatus;
  tracking_number: string | null;
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
  price: number;
  product?: Product;
}
