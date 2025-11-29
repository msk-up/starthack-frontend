import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, TrendingUp, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { NegotiationSidebar } from '@/components/NegotiationSidebar';
import { mockSuppliers, mockConversations } from '@/lib/mockData';
import { ProductCategory } from '@/types/procurement';
import PromptInput from '@/components/PromptInput';
import OrchestrationVisual from '@/components/OrchestrationVisual';

export default function NegotiationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const selectedSupplierIds = searchParams.getAll('supplier');
  
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('computers');
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedSuppliers = mockSuppliers.filter((s) => selectedSupplierIds.includes(s.id));
  const categorizedSuppliers = selectedSuppliers.filter((s) => s.category === activeCategory);
  
  // Calculate supplier counts per category
  const supplierCounts = selectedSuppliers.reduce((acc, supplier) => {
    acc[supplier.category] = (acc[supplier.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
          <header className="glass sticky top-0 z-50 border-b backdrop-blur-2xl">
            <div className="px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="lg:hidden">
                    <Button variant="glass" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SidebarTrigger>
                  <Button variant="glass" size="icon" onClick={() => navigate('/')}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-2 shadow-lg glow-primary">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Negotiation Dashboard
                    </h1>
                  </div>
                </div>
                <Badge className="px-4 py-2 text-sm font-semibold rounded-full bg-primary/10 text-primary border-primary/20">
                  {selectedSuppliers.length} Active Suppliers
                </Badge>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <PromptInput onSubmit={handlePromptSubmit} isProcessing={isProcessing} />
              
              <OrchestrationVisual 
                suppliers={supplierSeats}
                onSupplierClick={handleSupplierClick}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

