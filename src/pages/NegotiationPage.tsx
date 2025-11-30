import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { NegotiationSidebar } from '@/components/NegotiationSidebar';
import { mockSuppliers, mockConversations } from '@/lib/mockData';
import { ProductCategory, Supplier } from '@/types/procurement';
import { createNegotiation, getNegotiations, type Negotiation } from '@/lib/api';
import OrchestrationVisual from '@/components/OrchestrationVisual';

interface SupplierWithProducts {
  id: string;
  name: string;
  category: ProductCategory;
  products: any[];
}

export default function NegotiationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get suppliers from location state (passed from SearchPage) or fallback to URL params
  const suppliersFromState = (location.state as { suppliers?: SupplierWithProducts[] })?.suppliers;
  
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
        }))
      }
    });
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
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-title font-light tracking-tight">Negotiation Dashboard</h1>
            </div>
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium rounded-full">
              {selectedSuppliers.length} Active Suppliers
            </Badge>
          </div>
        </div>
      </header>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-4 lg:p-6">
              <div className="max-w-[1600px] mx-auto">
                <OrchestrationVisual 
                  suppliers={supplierSeats}
                  onSupplierClick={handleSupplierClick}
                  isProcessing={isProcessing}
                  onPromptSubmit={handlePromptSubmit}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

