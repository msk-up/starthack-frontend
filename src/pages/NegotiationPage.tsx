import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockSuppliers, mockConversations } from '@/lib/mockData';
import { CATEGORIES, ProductCategory } from '@/types/procurement';
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b backdrop-blur-2xl">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="glass" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-2 shadow-lg glow-primary">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Negotiation Dashboard</h1>
              </div>
            </div>
            <Badge className="px-4 py-2 text-sm font-semibold rounded-full bg-primary/10 text-primary border-primary/20">{selectedSuppliers.length} Active Suppliers</Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto flex gap-6 p-6">
        {/* Left Panel - Product Categories */}
        <div className="w-80 shrink-0">
          <Card className="glass sticky top-24 p-6 rounded-2xl shadow-2xl">
            <h3 className="mb-6 text-lg font-bold">Product Categories</h3>
            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as ProductCategory)}>
              <TabsList className="grid w-full grid-cols-1 gap-3 bg-transparent p-0">
                {CATEGORIES.map((cat) => {
                  const count = selectedSuppliers.filter((s) => s.category === cat.value).length;
                  return count > 0 ? (
                    <TabsTrigger
                      key={cat.value}
                      value={cat.value}
                      className="justify-between data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-lg rounded-xl py-3"
                    >
                      <span className="font-semibold">{cat.label}</span>
                      <Badge className="ml-2 bg-primary/20 text-primary border-0 rounded-full">
                        {count}
                      </Badge>
                    </TabsTrigger>
                  ) : null;
                })}
              </TabsList>
            </Tabs>
          </Card>
        </div>

        {/* Right Panel - Prompt & Orchestration */}
        <div className="flex-1">
          <PromptInput onSubmit={handlePromptSubmit} isProcessing={isProcessing} />
          
          <OrchestrationVisual 
            suppliers={supplierSeats}
            onSupplierClick={handleSupplierClick}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
}

