const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:8080';

export const validateProductBySKU = async (sku) => {
  try {
    const response = await fetch(`${CATALOG_SERVICE_URL}/v1/products/search?q=${sku}`);
    if (!response.ok) return false;
    
    const products = await response.json();
    return products.some(product => product.sku === sku && product.is_active);
  } catch (error) {
    console.error('Error validating product:', error);
    // Fallback: assume product exists if catalog service is unavailable
    console.warn(`Catalog service unavailable, allowing SKU: ${sku}`);
    return false;
  }
};

export const getProductBySKU = async (sku) => {
  try {
    const response = await fetch(`${CATALOG_SERVICE_URL}/v1/products/search?q=${sku}`);
    if (!response.ok) return null;
    
    const products = await response.json();
    return products.find(product => product.sku === sku && product.is_active) || null;
  } catch (error) {
    console.error('Error getting product:', error);
    return null;
  }
};