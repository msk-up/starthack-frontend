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

export interface ProductRow {
  product_id: string;
  product_name: string;
  supplier_id: string;
  supplier_name?: string;
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

export async function getProducts(): Promise<ProductRow[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export interface Negotiation {
  negotiation_id: string | number;
  prompt: string;
  supplier_ids: string[];
  modes: string[];
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateNegotiationRequest {
  prompt: string;
  supplier_ids: string[];
  modes?: string[];
  status?: string;
  product?: string; // Optional product name for new backend
}

// New backend negotiation structure
export interface BackendNegotiation {
  negotiation_id: string;
  product: string;
  strategy: string;
  status: string;
}

export interface BackendNegotiationsResponse {
  negotiations: BackendNegotiation[];
}

/**
 * Create a new negotiation using the new backend endpoint
 */
export async function createNegotiation(request: CreateNegotiationRequest): Promise<{ negotiation_id: string; status: string }> {
  try {
    // Map frontend format to backend format
    // Backend expects: product, prompt, tactics, suppliers
    // Frontend provides: prompt, supplier_ids, modes
    const tactics = (request.modes || []).join(', ') || request.prompt.substring(0, 100);
    const product = request.product || request.prompt.substring(0, 200) || 'General Product';
    
    const response = await fetch(`${API_BASE_URL}/negotiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product: product,
        prompt: request.prompt,
        tactics: tactics,
        suppliers: request.supplier_ids,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create negotiation: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    // Backend returns: { negotiation_id: string, status: string, suppliers: string[] }
    return {
      negotiation_id: result.negotiation_id,
      status: result.status || 'started',
    };
  } catch (error) {
    console.error('Error creating negotiation:', error);
    throw error;
  }
}

/**
 * Get all negotiations using the new backend endpoint
 */
export async function getNegotiations(): Promise<Negotiation[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/get_negotations`, {
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

    const data: BackendNegotiationsResponse = await response.json();
    
    // Map backend format to frontend format
    // Backend returns: { negotiations: [{ negotiation_id, product, strategy, status }] }
    // Frontend expects: [{ negotiation_id, prompt, supplier_ids, modes, status, created_at, updated_at }]
    const negotiations: Negotiation[] = (data.negotiations || []).map((ng) => ({
      negotiation_id: ng.negotiation_id,
      prompt: ng.product || '', // Use product as prompt
      supplier_ids: [], // Will need to fetch from agent table separately
      modes: ng.strategy ? ng.strategy.split(', ').filter(m => m.trim()) : [],
      status: ng.status || 'pending',
      created_at: new Date().toISOString(), // Backend doesn't provide this yet
      updated_at: new Date().toISOString(),
    }));

    // Try to fetch supplier_ids from agent table for each negotiation
    // This is a workaround since the backend doesn't return supplier_ids directly
    try {
      for (const ng of negotiations) {
        const statusResponse = await fetch(`${API_BASE_URL}/negotiation_status/${ng.negotiation_id}`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          ng.supplier_ids = (statusData.agents || []).map((a: any) => a.supplier_id);
        }
      }
    } catch (err) {
      console.warn('Could not fetch supplier_ids for negotiations:', err);
    }

    return negotiations;
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
 * Note: The new backend doesn't have a direct endpoint for this,
 * so we'll fetch all and filter, or use negotiation_status
 */
export async function getNegotiationById(negotiationId: string | number): Promise<Negotiation | null> {
  try {
    // Try to get from negotiation_status endpoint first
    const statusResponse = await fetch(`${API_BASE_URL}/negotiation_status/${negotiationId}`);
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      // We still need the main negotiation data, so fetch all and filter
    }

    // Fetch all negotiations and find the one we need
    const allNegotiations = await getNegotiations();
    const negotiation = allNegotiations.find(n => 
      String(n.negotiation_id) === String(negotiationId)
    );
    
    return negotiation || null;
  } catch (error) {
    console.error('Error fetching negotiation:', error);
    return null;
  }
}
