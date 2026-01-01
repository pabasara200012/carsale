import { Vehicle, VehicleSearchFilters } from '../types';

// Vehicle utility functions
export const filterVehicles = (vehicles: Vehicle[], filters: VehicleSearchFilters): Vehicle[] => {
  return vehicles.filter(vehicle => {
    // Brand filter
    if (filters.brand && !vehicle.brand.toLowerCase().includes(filters.brand.toLowerCase())) {
      return false;
    }

    // Model filter
    if (filters.model && !vehicle.model.toLowerCase().includes(filters.model.toLowerCase())) {
      return false;
    }

    // Chassis number filter
    if (filters.chassisNumber && !vehicle.chassisNumber.toLowerCase().includes(filters.chassisNumber.toLowerCase())) {
      return false;
    }

    // Country filter
    if (filters.country && !vehicle.country.toLowerCase().includes(filters.country.toLowerCase())) {
      return false;
    }

    // Price range filter
    if (filters.minPrice && vehicle.price < filters.minPrice) {
      return false;
    }

    if (filters.maxPrice && vehicle.price > filters.maxPrice) {
      return false;
    }

    // Status filter
    if (filters.status && vehicle.status !== filters.status) {
      return false;
    }

    return true;
  });
};

// Calculate total cost including tax and duty
export const calculateTotalCost = (basePrice: number, taxPercentage: number, dutyPercentage: number): {
  tax: number;
  duty: number;
  total: number;
} => {
  const tax = (basePrice * taxPercentage) / 100;
  const duty = (basePrice * dutyPercentage) / 100;
  const total = basePrice + tax + duty;

  return { tax, duty, total };
};

// Calculate profit
export const calculateProfit = (vehicle: Vehicle): number => {
  const price = vehicle.price ?? vehicle.purchasePrice ?? vehicle.cifValue ?? 0;
  const tax = vehicle.tax ?? 0;
  const duty = vehicle.duty ?? 0;
  const totalCost = price + tax + duty;
  const selling = vehicle.sellingPrice ?? vehicle.totalAmount ?? vehicle.netProfit ?? 0;
  return selling - totalCost;
};

// Format currency
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Generate unique chassis number (for demo purposes)
export const generateChassisNumber = (brand: string, model: string): string => {
  const brandCode = brand.substring(0, 2).toUpperCase();
  const modelCode = model.substring(0, 2).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString();
  const paddedRandom = random.length < 3 ? '0'.repeat(3 - random.length) + random : random;
  
  return `${brandCode}${modelCode}${timestamp}${paddedRandom}`;
};

// Validate vehicle data
export const validateVehicleData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.chassisNumber || data.chassisNumber.trim().length === 0) {
    errors.push('Chassis number is required');
  }

  if (!data.brand || data.brand.trim().length === 0) {
    errors.push('Brand is required');
  }

  if (!data.model || data.model.trim().length === 0) {
    errors.push('Model is required');
  }

  if (!data.country || data.country.trim().length === 0) {
    errors.push('Country is required');
  }

  if (!data.price || data.price <= 0) {
    errors.push('Price must be greater than 0');
  }

  if (!data.year || data.year < 1900 || data.year > new Date().getFullYear() + 1) {
    errors.push('Invalid year');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Get vehicle status color class
export const getStatusColorClass = (status: string): string => {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800';
    case 'sold':
      return 'bg-blue-100 text-blue-800';
    case 'reserved':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Sort vehicles by different criteria
export const sortVehicles = (vehicles: Vehicle[], sortBy: string, sortOrder: 'asc' | 'desc' = 'asc'): Vehicle[] => {
  return [...vehicles].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'brand':
        comparison = a.brand.localeCompare(b.brand);
        break;
      case 'model':
        comparison = a.model.localeCompare(b.model);
        break;
      case 'year':
        comparison = a.year - b.year;
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'profit':
        comparison = calculateProfit(a) - calculateProfit(b);
        break;
      default:
        return 0;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });
};
