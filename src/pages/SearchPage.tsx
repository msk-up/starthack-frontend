import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Search, Building2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { mockSuppliers } from '@/lib/mockData';
import { Supplier } from '@/types/procurement';

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSuppliers(mockSuppliers);
      setHasSearched(true);
    }
  };

  const toggleSupplier = (id: string) => {
    setSelectedSuppliers((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleProceed = () => {
    if (selectedSuppliers.length > 0) {
      const params = new URLSearchParams();
      selectedSuppliers.forEach(id => params.append('supplier', id));
      navigate(`/negotiation?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b backdrop-blur-2xl">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-2 shadow-lg glow-primary">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">ProcureAI</h1>
            </div>
            <Badge variant="secondary" className="px-4 py-1.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border-primary/20">
              Beta
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section - Collapsed after search */}
      <section className={`container mx-auto px-6 transition-all ${hasSearched ? 'py-8' : 'py-20 text-center'}`}>
        {!hasSearched && (
          <>
            <div className="animate-float mb-6">
              <h2 className="mb-6 text-5xl font-bold tracking-tight text-foreground">
                Find the Best Suppliers
              </h2>
            </div>
            <p className="mb-16 text-xl text-muted-foreground max-w-2xl mx-auto">
              Search for products and connect with trusted suppliers through AI-powered negotiations
            </p>
          </>
        )}

        {/* Search Bar */}
        <div className={`mx-auto ${hasSearched ? 'max-w-2xl' : 'max-w-3xl'}`}>
          <div className="glass glass-hover flex gap-3 rounded-2xl p-3 shadow-2xl">
            <Input
              type="text"
              placeholder="Search for products (e.g., laptops, steel, hoodies)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="border-0 bg-transparent text-base shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
            />
            <Button onClick={handleSearch} size={hasSearched ? "default" : "lg"} variant="default" className="gap-2 px-6">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Results */}
      {suppliers.length > 0 && (
        <section className="container mx-auto px-6 pb-24">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-2xl font-bold">Available Suppliers</h3>
            {selectedSuppliers.length > 0 && (
              <Button onClick={handleProceed} size="default" variant="default" className="gap-2">
                Proceed with {selectedSuppliers.length} Supplier
                {selectedSuppliers.length !== 1 ? 's' : ''}
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {suppliers.map((supplier) => (
              <Card
                key={supplier.id}
                className="glass glass-hover cursor-pointer p-6 transition-all hover:shadow-lg rounded-xl"
                onClick={() => toggleSupplier(supplier.id)}
              >
                <div className="flex items-center gap-6">
                  <Checkbox
                    checked={selectedSuppliers.includes(supplier.id)}
                    onCheckedChange={() => toggleSupplier(supplier.id)}
                    className="h-5 w-5"
                  />
                  
                  <div className="rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 p-2.5">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-lg font-bold">{supplier.name}</h4>
                      <Badge className="px-2 py-0.5 text-xs bg-primary/10 text-primary border-primary/20">
                        {supplier.category.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{supplier.location}</p>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold">⭐ {supplier.rating}</div>
                      <div className="text-xs text-muted-foreground">Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{supplier.responseTime}</div>
                      <div className="text-xs text-muted-foreground">Response</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{supplier.priceRange}</div>
                      <div className="text-xs text-muted-foreground">Price Range</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
