import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider } from '@/components/ui/sidebar';
import { NegotiationSidebar } from '@/components/NegotiationSidebar';
import { Navbar } from '@/components/Navbar';
import { mockSuppliers, mockConversations } from '@/lib/mockData';
import { ProductCategory, Supplier } from '@/types/procurement';
import { createNegotiation, getNegotiations, getNegotiationById, getSuppliers, getProducts, getNegotiationTactics, getNegotiationStatus, type Negotiation, type NegotiationStatusResponse, type ProductRow } from '@/lib/api';
import OrchestrationVisual from '@/components/OrchestrationVisual';

interface SupplierWithProducts {
  id: string;
  name: string;
  category: ProductCategory;
  products: unknown[];
}

type BackendSupplierLike = {
  supplier_id?: string | number | null;
  id?: string | number | null;
  supplier_name?: string | null;
  category?: ProductCategory;
  rating?: number;
  response_time?: string;
  responseTime?: string;
  price_range?: string;
  priceRange?: string;
  location?: string;
};

interface NegotiationState {
  suppliers?: (SupplierWithProducts | Supplier)[];
  negotiationPrompt?: string;
  negotiationTones?: string[];
  negotiationId?: string | number; // Negotiation ID for fetching messages
  fromHistory?: boolean; // Flag to indicate if coming from history page
  product?: string; // The typed product from the first page
}

export default function NegotiationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get suppliers from location state (passed from SearchPage) or fallback to URL params
  const negotiationState = location.state as NegotiationState | undefined;
  const suppliersFromState = negotiationState?.suppliers;
  const negotiationPromptFromState = negotiationState?.negotiationPrompt;
  const negotiationTonesFromState = negotiationState?.negotiationTones;
  const negotiationIdFromState = negotiationState?.negotiationId;
  const productFromState = negotiationState?.product || '';
  
  // Convert SupplierWithProducts to Supplier format if needed
  const selectedSuppliers: Supplier[] = suppliersFromState 
    ? suppliersFromState.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        rating: 0, // Not available from search
        responseTime: '', // Not available from search
        priceRange: '', // Not available from search
        location: '', // Not available from search
      }))
    : (() => {
        // Fallback: try URL params (for backward compatibility)
  const searchParams = new URLSearchParams(location.search);
  const selectedSupplierIds = searchParams.getAll('supplier');
        return mockSuppliers.filter((s) => selectedSupplierIds.includes(s.id));
      })();
  
  // Calculate supplier counts per category
  const supplierCounts = selectedSuppliers.reduce((acc, supplier) => {
    acc[supplier.category] = (acc[supplier.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Auto-select the category with the most suppliers (or first available)
  const getDefaultCategory = (): ProductCategory => {
    if (selectedSuppliers.length === 0) return 'computers';
    
    // Find category with most suppliers
    const categoriesWithCounts = Object.entries(supplierCounts)
      .sort(([, a], [, b]) => b - a);
    
    return (categoriesWithCounts[0]?.[0] as ProductCategory) || 'computers';
  };

  const [activeCategory, setActiveCategory] = useState<ProductCategory>(getDefaultCategory());
  const [isProcessing, setIsProcessing] = useState(false);
  const [previousNegotiations, setPreviousNegotiations] = useState<Negotiation[]>([]);
  const [loadingNegotiations, setLoadingNegotiations] = useState(true);
  const [resetKey] = useState(0);
  const [currentNegotiationId, setCurrentNegotiationId] = useState<string | number | null>(null);
  const [previewJson, setPreviewJson] = useState<Record<string, unknown> | null>(null);
  const [negotiationStatusJson, setNegotiationStatusJson] = useState<NegotiationStatusResponse | null>(null);
  const [initialPromptFromApi, setInitialPromptFromApi] = useState<string | undefined>(undefined);

  // Set currentNegotiationId from state if available (when loading from history)
  useEffect(() => {
    if (negotiationIdFromState && !currentNegotiationId) {
      setCurrentNegotiationId(negotiationIdFromState);
    }
  }, [negotiationIdFromState, currentNegotiationId]);

  const categorizedSuppliers = selectedSuppliers.filter((s) => s.category === activeCategory);

  // Fetch previous negotiations on mount and after creating a new one
  useEffect(() => {
    const fetchNegotiations = async () => {
      try {
        setLoadingNegotiations(true);
        const negotiations = await getNegotiations();

        // Sort negotiations so newest appears first in the sidebar
        const sortedNegotiations = (negotiations || []).slice().sort((a, b) => {
          const timeA = new Date(a.created_at || 0).getTime();
          const timeB = new Date(b.created_at || 0).getTime();
          return timeB - timeA; // descending: newest on top
        });

        setPreviousNegotiations(negotiations.reverse());
      } catch (error) {
        console.error('Error fetching negotiations:', error);
        setPreviousNegotiations([]);
      } finally {
        setLoadingNegotiations(false);
      }
    };

    fetchNegotiations();
  }, []);

  // Fetch negotiation tactics/prompt for preview JSON
  useEffect(() => {
    const run = async () => {
      try {
        const data = await getNegotiationTactics();
        const prompt = (data?.prompt && String(data.prompt)) || '';
        setInitialPromptFromApi(prompt || negotiationPromptFromState);
      } catch (e) {
        setInitialPromptFromApi(negotiationPromptFromState);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build preview JSON when inputs change
  useEffect(() => {
    const supplierIds = selectedSuppliers.map((s) => s.id);
    const tacticsJoined = (negotiationTonesFromState || []).join(', ');
    const prompt = initialPromptFromApi || negotiationPromptFromState || '';
    const preview = {
      product: productFromState || '',
      prompt: prompt,
      tactics: tacticsJoined,
      suppliers: supplierIds,
    };
    setPreviewJson(preview);
  }, [selectedSuppliers, productFromState, negotiationTonesFromState, negotiationPromptFromState, initialPromptFromApi]);

  const handlePromptSubmit = async (prompt: string, tones: string[] = []) => {
    console.log('Prompt submitted:', prompt, 'Tones:', tones);
    setIsProcessing(true);
    
    try {
      // Get supplier IDs
      const supplierIds = selectedSuppliers.map(s => s.id);
      
      // Save negotiation to database with tones from TinderToneSelector
      const result = await createNegotiation({
        prompt: prompt,
        supplier_ids: supplierIds,
        modes: tones, // Use tones from TinderToneSelector
        status: 'pending',
        product: productFromState || ''
      });
      
      console.log('Negotiation created:', result);
      
      // Store the negotiation ID for use in supplier detail pages
      if (result.negotiation_id) {
        setCurrentNegotiationId(result.negotiation_id);
      }
      
      // Refresh negotiations list
      try {
        const negotiations = await getNegotiations();

        // Keep sidebar sorted with newest negotiations on top after creation
        const sortedNegotiations = (negotiations || []).slice().sort((a, b) => {
          const timeA = new Date(a.created_at || 0).getTime();
          const timeB = new Date(b.created_at || 0).getTime();
          return timeB - timeA; // descending: newest on top
        });

        setPreviousNegotiations(sortedNegotiations);
      } catch (error) {
        console.error('Error refreshing negotiations:', error);
      }
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
    }, 5000);
    } catch (error) {
      console.error('Error creating negotiation:', error);
      setIsProcessing(false);
      // Still continue with processing even if save fails
    }
  };

  // Poll negotiation_status every 3 seconds when we have a currentNegotiationId
  useEffect(() => {
    let intervalId: number | undefined;
    let stopped = false;

    const poll = async () => {
      if (!currentNegotiationId) return;
      try {
        const res = await getNegotiationStatus(String(currentNegotiationId));
        if (res) {
          setNegotiationStatusJson(res);
          // Stop polling if backend reports completion
          if (res.all_completed) {
            if (intervalId) window.clearInterval(intervalId);
            intervalId = undefined;
            stopped = true;
          }
        }
      } catch (e) {
        console.warn('Polling negotiation_status failed', e);
      }
    };

    if (currentNegotiationId) {
      // Immediate fetch
      poll();
      // Then interval
      intervalId = window.setInterval(poll, 3000);
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      stopped = true;
    };
  }, [currentNegotiationId]);

  const handleSupplierClick = (supplierId: string) => {
    // Navigate to detail view with supplier ID and category, passing supplier data via state
    navigate(`/negotiation/${supplierId}?category=${activeCategory}`, {
      state: { 
        suppliers: suppliersFromState || selectedSuppliers.map(s => ({
          id: s.id,
          name: s.name,
          category: s.category,
          products: []
        })),
        negotiationId: currentNegotiationId // Pass negotiation ID for fetching messages
      }
    });
  };
  const handleNegotiationSelect = async (negotiationId: string | number) => {
    try {
      setIsProcessing(true);
      const negotiation = await getNegotiationById(negotiationId);
      if (!negotiation) {
        console.warn('Negotiation not found', negotiationId);
        return;
      }

      let supplierList: BackendSupplierLike[] = [];
      let products: ProductRow[] = [];
      try {
        const apiSuppliers = await getSuppliers();
        if (Array.isArray(apiSuppliers)) {
          supplierList = apiSuppliers as unknown as BackendSupplierLike[];
        } else if (apiSuppliers && typeof apiSuppliers === 'object') {
          const maybeWrapped = apiSuppliers as { suppliers?: BackendSupplierLike[] };
          supplierList = Array.isArray(maybeWrapped.suppliers) ? maybeWrapped.suppliers : [];
        }
      } catch (err) {
        console.warn('Failed to fetch suppliers, falling back to ids only', err);
      }
      try {
        products = await getProducts();
      } catch (err) {
        console.warn('Failed to fetch products for supplier names', err);
      }

      // Normalize supplier list for easier lookup
      const supplierMap = new Map<string, Supplier>();
      supplierList.forEach((s) => {
        const id = String(s?.supplier_id ?? s?.id ?? s?.supplier_name ?? '').trim();
        if (!id) return;
        const normalized: Supplier = {
          id,
          name: s?.supplier_name || id,
          category: s?.category || 'electronics',
          rating: s?.rating ?? 0,
          responseTime: s?.response_time || s?.responseTime || '',
          priceRange: s?.price_range || s?.priceRange || '',
          location: s?.location || '',
        };
        supplierMap.set(id, normalized);
        if (s?.supplier_name) supplierMap.set(String(s.supplier_name), normalized);
      });

      const mappedSuppliers: Supplier[] = (negotiation.supplier_ids || []).map((id) => {
        const key = String(id).trim();

        // Always try to derive the name from products by supplier_id
        const productMatch = products.find((p: ProductRow) => p?.supplier_id === key);
        if (productMatch) {
          return {
            id: key,
            name: productMatch.supplier_name || `Supplier ${key}`,
            category: (productMatch.category as ProductCategory) || 'electronics',
            rating: 0,
            responseTime: '',
            priceRange: '',
            location: '',
          };
        }

        // Fallback to supplier map
        const match = supplierMap.get(key);
        if (match) return match;

        return {
          id: key,
          name: `Supplier ${key}`,
          category: 'electronics',
          rating: 0,
          responseTime: '',
          priceRange: '',
          location: '',
        };
      });

      // Set the current negotiation ID when loading from history
      setCurrentNegotiationId(negotiation.negotiation_id);
      
      navigate('/negotiation', {
        state: {
          suppliers: mappedSuppliers,
          negotiationPrompt: negotiation.prompt,
          negotiationTones: negotiation.modes || [],
          negotiationId: negotiation.negotiation_id, // Pass it in state too
        },
      });
    } catch (error) {
      console.error('Error opening negotiation', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartNewNegotiation = () => {
    navigate('/', { replace: true });
  };

  // Transform suppliers into seat format
  const supplierSeats = categorizedSuppliers.map(supplier => {
    const conv = mockConversations.find(c => c.supplierId === supplier.id);
    const status = conv?.status || 'idle';
    return {
      id: supplier.id,
      name: supplier.name,
      status: (status === 'negotiating' ? 'processing' : status) as 'idle' | 'processing' | 'offer_received' | 'waiting',
      lastUpdate: conv?.timestamp,
      hasNewUpdate: conv?.status === 'offer_received',
    };
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">
        {/* Sidebar */}
        <NegotiationSidebar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          supplierCounts={supplierCounts}
            previousNegotiations={previousNegotiations}
            loadingNegotiations={loadingNegotiations}
            onNegotiationSelect={handleNegotiationSelect}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
      {/* Header */}
      <Navbar 
        showBackButton 
        onBackClick={handleStartNewNegotiation}
        rightContent={
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium rounded-full">
              {selectedSuppliers.length} Active Suppliers
            </Badge>
        }
      />
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-3">
          <h1 className="text-2xl font-title font-light tracking-tight">Negotiation Dashboard</h1>
        </div>
      </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-4 lg:p-6">
              <div className="max-w-[1600px] mx-auto">
                <OrchestrationVisual 
                  suppliers={supplierSeats}
                  onSupplierClick={handleSupplierClick}
                  isProcessing={isProcessing}
                  onPromptSubmit={handlePromptSubmit}
                  initialPrompt={initialPromptFromApi || negotiationPromptFromState}
                  initialTones={negotiationTonesFromState}
                  initialHasPromptBeenSent={!!negotiationPromptFromState}
                  previewJson={previewJson}
                  negotiationStatus={negotiationStatusJson}
                  compactOrchestratorUI
                  negotiationId={currentNegotiationId}
                  key={resetKey}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
