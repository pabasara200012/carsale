// User and Authentication Types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

// Vehicle Types
export interface Vehicle {
  id: string;
  chassisNumber: string;
  brand: string;
  model: string;
  year: number;
  grade: string;
  country: string;
  
  // Financial Information
  purchasePrice: number; // Original price paid for the vehicle
  cifValue: number; // Cost, Insurance, and Freight value
  lcValue: number; // Letter of Credit value
  sellingPrice: number; // Final selling price
  netProfit: number; // Calculated: sellingPrice - (CIF value + Tax)
  
  // Payment Tracking
  advancePayment: number; // Amount paid in advance
  restPayment: number; // Calculated: sellingPrice - advancePayment
  
  // Tax and Duty (legacy support)
  price: number; // For backward compatibility
  tax: number;
  duty: number;
  totalAmount: number;
  
  // Shipping Information
  shippingCompany?: string; // Optional shipping company name
  shippingDate?: Date; // Optional shipping date
  arrivalDate?: Date; // Optional arrival date
  
  // Purchaser Details (all optional)
  purchaserName?: string;
  purchaserPhone?: string;
  purchaserIdNumber?: string;
  purchaserAddress?: string;
  
  images: string[]; // Cloudinary URLs
  addedBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
  status: 'available' | 'sold' | 'reserved';
}

// Tax and Duty Configuration
export interface TaxDutyConfig {
  id: string;
  country: string;
  taxPercentage: number;
  dutyPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Types
export interface Payment {
  id: string;
  vehicleId: string;
  amount: number;
  type: 'advance' | 'full';
  paymentDate: Date;
  userId: string;
  status: 'pending' | 'completed' | 'failed';
}

// Search Filters
export interface VehicleSearchFilters {
  brand?: string;
  model?: string;
  chassisNumber?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
}

// Form Types
export interface VehicleFormData {
  chassisNumber: string;
  brand: string;
  model: string;
  year: number;
  grade: string;
  country: string;
  
  // Financial Information
  purchasePrice: number;
  cifValue: number;
  lcValue?: number;
  tax: number;
  sellingPrice: number;
  advancePayment: number;
  
  // Shipping Information
  shippingCompany: string;
  shippingDate: string; // Using string for form inputs
  arrivalDate: string;
  
  // Purchaser Details
  purchaserName: string;
  purchaserPhone: string;
  purchaserIdNumber: string;
  purchaserAddress: string;
  
  // Legacy support
  price: number;
  images: File[];
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  displayName: string;
  confirmPassword: string;
}
