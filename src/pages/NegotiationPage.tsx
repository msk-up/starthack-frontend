import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { NegotiationSidebar } from '@/components/NegotiationSidebar';
import { mockSuppliers, mockConversations } from '@/lib/mockData';
import { ProductCategory } from '@/types/procurement';
import OrchestrationVisual from '@/components/OrchestrationVisual';

export default function NegotiationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const selectedSupplierIds = searchParams.getAll('supplier');
  
  const selectedSuppliers = mockSuppliers.filter((s) => selectedSupplierIds.includes(s.id));
  
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

  const categorizedSuppliers = selectedSuppliers.filter((s) => s.category === activeCategory);

  const handlePromptSubmit = (prompt: string) => {
    console.log('Prompt submitted:', prompt);
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
    }, 5000);
  };

  const handleSupplierClick = (supplierId: string) => {
    // Navigate to detail view with supplier ID and category
    navigate(`/negotiation/${supplierId}?category=${activeCategory}`);
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

