
import React from 'react';

export enum UserRole {
  VISITOR = 'VISITOR',
  CLIENT = 'CLIENT',
  BUSINESS = 'BUSINESS',
  DELIVERY = 'DELIVERY',
  ADMIN = 'ADMIN'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  IN_PREPARATION = 'IN_PREPARATION',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  ON_THE_WAY = 'ON_THE_WAY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface Location {
  lat: number;
  lng: number;
}

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone?: string;
  location?: Location;
  isActive?: boolean;
}

export interface Product {
  id: string;
  business_id: string;
  name:string;
  price: number;
  description: string;
  image: string;
  category: string;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  rating: number;
  rating_count?: number;
  delivery_time: string;
  delivery_fee: number;
  image: string;
  location: Location;
  is_open: boolean;
  phone: string;
  address: string;
  email: string;
  opening_hours: string;
  products?: Product[];
}

export interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicle: string;
  rating: number;
  rating_count?: number;
  is_online: boolean;
  location: Location;
  current_deliveries: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  client_id: string;
  client?: Profile;
  business_id: string;
  business?: Business;
  delivery_person_id?: string;
  delivery_person?: DeliveryPerson;
  items: CartItem[];
  total_price: number;
  status: OrderStatus;
  delivery_address: string;
  delivery_location: Location;
  special_notes?: string;
  preparation_time?: number;
  messages?: QuickMessage[];
  is_rated?: boolean;
  created_at: string;
}

export interface Rating {
  id: string;
  order_id: string;
  client_id: string;
  business_id: string;
  delivery_person_id?: string;
  business_rating: number;
  delivery_rating?: number;
  comment?: string;
}

export interface QuickMessage {
  id: string;
  order_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  role: UserRole;
  orderId?: string;
  order?: Order;
  type: 'info' | 'success' | 'warning' | 'error' | 'new_order';
  icon?: React.ElementType;
}

export interface FilterState {
  categories: string[];
  minRating: number;
  maxDeliveryTime: number; // in minutes, 0 for no filter
  maxDeliveryFee: number; // in currency, 0 for no filter
  openNow: boolean;
}