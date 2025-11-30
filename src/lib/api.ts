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
  [key: string]: unknown;
}

export interface ProductRow {
  product_id: string;
  product_name: string;
  supplier_id: string;
  supplier_name?: string;
  [key: string]: unknown;
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
    
    // Keep it a simple GET without custom headers to avoid CORS preflight
    const response = await fetch(url, { method: 'GET' });
    
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

export interface Message {
  message_id?: string;
  negotiation_id?: string;
  ng_id?: string;
  supplier_id?: string;
  sup_id?: string;
  content?: string;
  role?: string;
  // Some backends use these alternative fields
  message_text?: string;
  message_timestamp?: string;
  text?: string;
  timestamp?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface ConversationResponse {
  message: Message[];
}

/**
 * Get conversation messages for a specific negotiation and supplier
 */
export async function getConversation(negotiationId: string, supplierId: string): Promise<Message[]> {
  try {
    console.log(`[getConversation] Fetching conversation for negotiationId: ${negotiationId}, supplierId: ${supplierId}`);
    const url = `${API_BASE_URL}/conversation/${encodeURIComponent(negotiationId)}/${encodeURIComponent(supplierId)}`;
    console.log(`[getConversation] URL: ${url}`);
    
    // Keep request simple to avoid CORS preflight
    const response = await fetch(url, { method: 'GET' });

    console.log(`[getConversation] Response status: ${response.status}`);

    if (!response.ok) {
      // For 500 errors, backend might return empty array, so try to parse JSON first
      if (response.status === 500) {
        try {
          const data = await response.json();
          if (data.message) {
            console.warn(`[getConversation] Backend returned 500 but with data:`, data);
            return data.message || [];
          }
        } catch (e) {
          // If JSON parsing fails, continue with error handling
        }
      }
      
      const errorText = await response.text();
      console.error(`[getConversation] Error response: ${response.status} ${response.statusText} - ${errorText}`);
      
      if (response.status === 404) {
        console.warn(`[getConversation] No messages found for negotiation ${negotiationId} and supplier ${supplierId}`);
        return [];
      }
      
      // For other errors, return empty array instead of throwing
      console.warn(`[getConversation] Request failed with status ${response.status}, returning empty array`);
      return [];
    }

    const raw = (await response.json()) as unknown;
    console.log(`[getConversation] Received data:`, raw);

    // Normalise multiple possible shapes into a Message[]: { message: [...] } or [...] or { messages: [...] }
    let messages: Message[] = [];

    if (Array.isArray(raw)) {
      messages = raw as Message[];
    } else if (raw && typeof raw === 'object') {
      const container = raw as { message?: unknown; messages?: unknown };
      if (Array.isArray(container.message)) {
        messages = container.message as Message[];
      } else if (Array.isArray(container.messages)) {
        messages = container.messages as Message[];
      } else {
        console.warn('[getConversation] Unexpected object shape; returning empty array');
      }
    } else {
      console.warn('[getConversation] Unexpected response type; returning empty array');
    }

    // Debug: log keys of first message for field-name verification
    if (messages.length > 0) {
      const keys = Object.keys(messages[0] || {});
      console.log('[getConversation] First message keys:', keys);
    }
    console.log(`[getConversation] Returning ${messages.length} messages`);
    return messages;
  } catch (error) {
    console.error('[getConversation] Error fetching conversation:', error);
    
    // Handle CORS and network errors gracefully
    if (error instanceof TypeError) {
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        console.error('[getConversation] Network/CORS error - backend might be down or CORS not configured');
        // Return empty array instead of crashing
        return [];
      }
    }
    
    // For any other error, return empty array
    return [];
  }
}


// ---- Additional helper endpoints for fallback JSON display ----

export interface NegotiationStatusAgent {
  supplier_id: string;
  message_count: number;
  [key: string]: unknown;
}

export interface NegotiationStatusResponse {
  negotiation_id: string;
  agents: NegotiationStatusAgent[];
   // Newer backend includes a global completion flag
   all_completed?: boolean;
  [key: string]: unknown;
}

/**
 * Get negotiation status and message counts per supplier
 */
export async function getNegotiationStatus(negotiationId: string): Promise<NegotiationStatusResponse | null> {
  try {
    const url = `${API_BASE_URL}/negotiation_status/${encodeURIComponent(negotiationId)}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data as NegotiationStatusResponse;
  } catch (e) {
    console.error('Error fetching negotiation status:', e);
    return null;
  }
}

// ---- Orchestrator activity timeline ----

export interface OrchestratorActivityItem {
  activity_id: string;
  supplier_id: string | null;
  supplier_name?: string | null;
  action?: string | null;
  summary?: string | null;
  details?: string | null;
  completed?: boolean | null;
  timestamp: string | null;
}

export interface OrchestratorActivityResponse {
  negotiation_id: string;
  count: number;
  activities: OrchestratorActivityItem[];
}

/**
 * Fetch orchestrator activity feed for a negotiation. Optional supplier filter.
 */
export async function getOrchestratorActivity(
  negotiationId: string,
  supplierId?: string
): Promise<OrchestratorActivityResponse | null> {
  try {
    const base = `${API_BASE_URL}/orchestrator_activity/${encodeURIComponent(negotiationId)}`;
    const url = supplierId ? `${base}?supplier_id=${encodeURIComponent(supplierId)}` : base;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    const data = (await res.json()) as OrchestratorActivityResponse;
    // Normalize a bit just in case
    data.activities = Array.isArray(data.activities) ? data.activities : [];
    return data;
  } catch (e) {
    console.error('Error fetching orchestrator activity:', e);
    return null;
  }
}

export interface NegotiationItem {
  negotiation_id: string;
  product: string;
  strategy: string;
  status: string;
  [key: string]: unknown;
}

export interface ListNegotiationsResponse {
  negotiations: NegotiationItem[];
}

/**
 * List all negotiations
 */
export async function listNegotiations(): Promise<NegotiationItem[]> {
  try {
    const url = `${API_BASE_URL}/get_negotations`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      return [];
    }
    const data: ListNegotiationsResponse = await res.json();
    const list = Array.isArray(data.negotiations) ? data.negotiations : [];
    return list;
  } catch (e) {
    console.error('Error listing negotiations:', e);
    return [];
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

// ---- Negotiation tactics / prompt helper ----
export interface NegotiationTacticsResponse {
  // Preferred shape
  prompt?: string;
  tactics?: string[];
  [key: string]: unknown;
}

/**
 * Fetch negotiation tactics/prompt from backend. We try a couple of likely endpoints
 * and return a tolerant shape with a `prompt` string and optional `tactics` list.
 */
export async function getNegotiationTactics(): Promise<NegotiationTacticsResponse> {
  const candidates = [
    `${API_BASE_URL}/negotiation_tactics`,
    `${API_BASE_URL}/negotiation%20tactics`,
    `${API_BASE_URL}/tactics`,
  ];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) continue;
      const data = (await res.json()) as unknown;
      // Normalize to { prompt, tactics }
      if (typeof data === 'string') {
        return { prompt: data };
      }
      if (Array.isArray(data)) {
        // If array of strings, assume tactics list
        if (data.every((v) => typeof v === 'string')) return { tactics: data };
      }
      const obj = (data && typeof data === 'object') ? data as Record<string, unknown> : {};
      const prompt = (obj.prompt || obj.default_prompt || obj.example || obj.sample) as string | undefined || '';
      const tactics = (obj.tactics || obj.modes || obj.options) as string[] | undefined;
      if (prompt || tactics) return { prompt, tactics } as NegotiationTacticsResponse;
      // Fallback: return raw object so caller can inspect
      return obj as NegotiationTacticsResponse;
    } catch (e) {
      // try next candidate
      continue;
    }
  }
  return { prompt: '' };
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
      // Use Promise.all to fetch all supplier_ids in parallel for better performance
      const supplierPromises = negotiations.map(async (ng) => {
        try {
          const statusResponse = await fetch(`${API_BASE_URL}/negotiation_status/${ng.negotiation_id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (statusResponse.ok) {
            const statusData = (await statusResponse.json()) as {
              agents?: Array<{ supplier_id?: string | number | null; sup_id?: string | number | null }>;
            };
            // Backend returns sup_id, but we need to handle both supplier_id and sup_id
            const supplierIds = (statusData.agents || [])
              .map((a) => String(a.supplier_id ?? a.sup_id ?? ''))
              .filter((id) => id && id !== 'undefined' && id !== 'null');
            return { negotiationId: ng.negotiation_id, supplierIds };
          }
        } catch (err) {
          console.warn(`Failed to fetch supplier_ids for negotiation ${ng.negotiation_id}:`, err);
        }
        return { negotiationId: ng.negotiation_id, supplierIds: [] };
      });

      const supplierResults = await Promise.all(supplierPromises);
      
      // Map supplier_ids back to negotiations
      supplierResults.forEach((result) => {
        const negotiation = negotiations.find(ng => String(ng.negotiation_id) === String(result.negotiationId));
        if (negotiation) {
          negotiation.supplier_ids = result.supplierIds;
        }
      });
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
