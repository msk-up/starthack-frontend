import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { NegotiationSidebar } from '@/components/NegotiationSidebar';
import { Navbar } from '@/components/Navbar';
import { mockSuppliers, mockConversations } from '@/lib/mockData';
import { ProductCategory, Supplier } from '@/types/procurement';
import { createNegotiation, getNegotiations, getNegotiationById, getSuppliers, getProducts, type Negotiation } from '@/lib/api';
import OrchestrationVisual from '@/components/OrchestrationVisual';

interface SupplierWithProducts {
  id: string;
  name: string;
  category: ProductCategory;
  products: any[];
}

interface NegotiationState {
  suppliers?: (SupplierWithProducts | Supplier)[];
  negotiationPrompt?: string;
  negotiationTones?: string[];
  fromHistory?: boolean; // Flag to indicate if coming from history page
}

export default function NegotiationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get suppliers from location state (passed from SearchPage) or fallback to URL params
  const negotiationState = location.state as NegotiationState | undefined;
  const suppliersFromState = negotiationState?.suppliers;
  const negotiationPromptFromState = negotiationState?.negotiationPrompt;
  const negotiationTonesFromState = negotiationState?.negotiationTones;
  const fromHistory = negotiationState?.fromHistory || false;
  
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
  const [resetKey, setResetKey] = useState(0);
  const [currentNegotiationId, setCurrentNegotiationId] = useState<string | number | null>(null);

  const categorizedSuppliers = selectedSuppliers.filter((s) => s.category === activeCategory);

  // Fetch previous negotiations on mount and after creating a new one
  useEffect(() => {
    const fetchNegotiations = async () => {
      try {
        setLoadingNegotiations(true);
        const negotiations = await getNegotiations();
        setPreviousNegotiations(negotiations || []);
      } catch (error) {
        console.error('Error fetching negotiations:', error);
        setPreviousNegotiations([]);
      } finally {
        setLoadingNegotiations(false);
      }
    };

    fetchNegotiations();
  }, []);

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
      });
      
      console.log('Negotiation created:', result);
      
      // Store the negotiation ID for use in supplier detail pages
      if (result.negotiation_id) {
        setCurrentNegotiationId(result.negotiation_id);
      }
      
      // Refresh negotiations list
      try {
        const negotiations = await getNegotiations();
        setPreviousNegotiations(negotiations);
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

      let supplierList: any[] = [];
      let products: any[] = [];
      try {
        const apiSuppliers = await getSuppliers();
        supplierList = Array.isArray(apiSuppliers)
          ? apiSuppliers
          : (apiSuppliers as any)?.suppliers || [];
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
      supplierList.forEach((s: any) => {
        const id = String(s?.supplier_id || s?.id || s?.supplier_name || '').trim();
        if (!id) return;
        const normalized: Supplier = {
          id,
          name: s?.supplier_name || s?.name || id,
          category: (s?.category as ProductCategory) || 'electronics',
          rating: s?.rating || 0,
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
        const productMatch = products.find((p: any) => p?.supplier_id === key);
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

      // Set the current negotiation ID
      setCurrentNegotiationId(negotiationId);
      
      navigate('/negotiation', {
        state: {
          suppliers: mappedSuppliers,
          negotiationPrompt: negotiation.prompt,
          negotiationTones: negotiation.modes || [],
        },
      });
    } catch (error) {
      console.error('Error opening negotiation', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartNewNegotiation = () => {
    // Always go back to home/search page
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
                  initialPrompt={negotiationPromptFromState}
                  initialTones={negotiationTonesFromState}
                  initialHasPromptBeenSent={!!negotiationPromptFromState}
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
