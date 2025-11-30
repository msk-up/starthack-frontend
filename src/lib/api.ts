const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5147';

/**
 * Check if the backend API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

export interface Product {
  product_id: string;
  product_name: string;
  supplier_id: string;
  supplier_name?: string;
  similarity_score?: number;
}

export interface Supplier {
  supplier_id: string;
  supplier_name: string;
  [key: string]: any;
}

export interface SearchResponse {
  products: Product[];
}

/**
 * Search for products using fuzzy search
 */
export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const url = `${API_BASE_URL}/search?product=${encodeURIComponent(query)}`;
    console.log('Searching products:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Search failed:', response.status, errorText);
      throw new Error(`Search failed: ${response.status} ${response.statusText}`);
    }
    
    const products: Product[] = await response.json();
    console.log('Search results:', products);
    return products;
  } catch (error) {
    console.error('Error searching products:', error);
    // If it's a network error, provide more helpful message
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to backend. Make sure the API server is running on ' + API_BASE_URL);
    }
    throw error;
  }
}

/**
 * Get all suppliers
 */
export async function getSuppliers(): Promise<Supplier[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/suppliers`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch suppliers: ${response.statusText}`);
    }
    
    const suppliers: Supplier[] = await response.json();
    return suppliers;
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw error;
  }
}

/**
 * Get supplier details by ID
 */
export async function getSupplierById(supplierId: string): Promise<Supplier | null> {
  try {
    const suppliers = await getSuppliers();
    return suppliers.find(s => s.supplier_id === supplierId) || null;
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return null;
  }
}

export interface Negotiation {
  negotiation_id: number;
  prompt: string;
  supplier_ids: string[];
  modes: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNegotiationRequest {
  prompt: string;
  supplier_ids: string[];
  modes?: string[];
  status?: string;
}

/**
 * Create a new negotiation
 */
export async function createNegotiation(request: CreateNegotiationRequest): Promise<{ negotiation_id: number; status: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/negotiations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        supplier_ids: request.supplier_ids,
        modes: request.modes || [],
        status: request.status || 'pending',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create negotiation: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating negotiation:', error);
    throw error;
  }
}

/**
 * Get all negotiations
 */
export async function getNegotiations(): Promise<Negotiation[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/negotiations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch negotiations: ${response.status} ${response.statusText} - ${errorText}`);
      
      // If 404, the endpoint might not exist or table doesn't exist - return empty array
      if (response.status === 404) {
        console.warn('Negotiations endpoint returned 404. Returning empty array.');
        return [];
      }
      
      throw new Error(`Failed to fetch negotiations: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching negotiations:', error);
    // If it's a network error, return empty array instead of throwing
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Cannot connect to backend for negotiations. Returning empty array.');
      return [];
    }
    // For other errors, return empty array to prevent UI breaking
    return [];
  }
}

/**
 * Get a specific negotiation by ID
 */
export async function getNegotiationById(negotiationId: number): Promise<Negotiation | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/negotiations/${negotiationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch negotiation: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching negotiation:', error);
    throw error;
  }
}

