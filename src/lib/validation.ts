export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePrice = (price: string | number): boolean => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(numPrice) && numPrice >= 0 && numPrice <= 9999.99;
};

export const validateSlug = (slug: string): boolean => {
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
};

export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>\"'&]/g, '');
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateLength = (value: string, min: number, max: number): boolean => {
  const length = value.trim().length;
  return length >= min && length <= max;
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateMenuItem = (item: {
  name: string;
  price: string | number;
  description?: string;
  category_id: string;
}): ValidationResult => {
  const errors: string[] = [];
  
  if (!validateRequired(item.name)) {
    errors.push('Item name is required');
  } else if (!validateLength(item.name, 2, 100)) {
    errors.push('Item name must be between 2 and 100 characters');
  }
  
  if (!validatePrice(item.price)) {
    errors.push('Price must be a valid number between 0 and 9999.99');
  }
  
  if (item.description && !validateLength(item.description, 0, 500)) {
    errors.push('Description must be less than 500 characters');
  }
  
  if (!validateRequired(item.category_id)) {
    errors.push('Category is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateRestaurant = (restaurant: {
  name: string;
  slug: string;
  description?: string;
}): ValidationResult => {
  const errors: string[] = [];
  
  if (!validateRequired(restaurant.name)) {
    errors.push('Restaurant name is required');
  } else if (!validateLength(restaurant.name, 2, 100)) {
    errors.push('Restaurant name must be between 2 and 100 characters');
  }
  
  if (!validateRequired(restaurant.slug)) {
    errors.push('URL slug is required');
  } else if (!validateSlug(restaurant.slug)) {
    errors.push('URL slug must contain only lowercase letters, numbers, and hyphens');
  }
  
  if (restaurant.description && !validateLength(restaurant.description, 0, 1000)) {
    errors.push('Description must be less than 1000 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateStaffUser = (staff: {
  email: string;
  role: string;
}): ValidationResult => {
  const errors: string[] = [];
  
  if (!validateRequired(staff.email)) {
    errors.push('Email is required');
  } else if (!validateEmail(staff.email)) {
    errors.push('Please enter a valid email address');
  }
  
  const validRoles = ['KITCHEN', 'WAITSTAFF', 'BARTENDER'];
  if (!validRoles.includes(staff.role)) {
    errors.push('Please select a valid role');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};