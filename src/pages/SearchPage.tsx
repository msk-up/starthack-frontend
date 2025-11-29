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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSuppliers(mockSuppliers);
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">ProcureAI</h1>
            </div>
            <Badge variant="secondary" className="px-4 py-1.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border-primary/20">
              Beta
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="animate-float mb-6">
          <h2 className="mb-6 text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Find the Best Suppliers
          </h2>
        </div>
        <p className="mb-16 text-xl text-muted-foreground max-w-2xl mx-auto">
          Search for products and connect with trusted suppliers through AI-powered negotiations
        </p>

        {/* Search Bar */}
        <div className="mx-auto max-w-3xl">
          <div className="glass glass-hover flex gap-3 rounded-2xl p-3 shadow-2xl">
            <Input
              type="text"
              placeholder="Search for products (e.g., laptops, steel, hoodies)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="border-0 bg-transparent text-base shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
            />
            <Button onClick={handleSearch} size="lg" variant="default" className="gap-2 px-10">
              <Search className="h-5 w-5" />
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Results */}
      {suppliers.length > 0 && (
        <section className="container mx-auto px-6 pb-24">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-3xl font-bold">Available Suppliers</h3>
            {selectedSuppliers.length > 0 && (
              <Button onClick={handleProceed} size="lg" variant="default" className="gap-3">
                Proceed with {selectedSuppliers.length} Supplier
                {selectedSuppliers.length !== 1 ? 's' : ''}
              </Button>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((supplier) => (
              <Card
                key={supplier.id}
                className="glass glass-hover cursor-pointer p-8 transition-all hover:shadow-2xl rounded-2xl"
                onClick={() => toggleSupplier(supplier.id)}
              >
                <div className="mb-6 flex items-start justify-between">
                  <Checkbox
                    checked={selectedSuppliers.includes(supplier.id)}
                    onCheckedChange={() => toggleSupplier(supplier.id)}
                    className="mt-1 h-5 w-5"
                  />
                  <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-3">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                </div>

                <h4 className="mb-2 text-xl font-bold">{supplier.name}</h4>
                <p className="mb-6 text-sm text-muted-foreground">{supplier.location}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm rounded-lg bg-muted/30 p-3">
                    <span className="text-muted-foreground font-medium">Rating</span>
                    <span className="font-bold">⭐ {supplier.rating}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm rounded-lg bg-muted/30 p-3">
                    <span className="text-muted-foreground font-medium">Response Time</span>
                    <span className="font-bold">{supplier.responseTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm rounded-lg bg-muted/30 p-3">
                    <span className="text-muted-foreground font-medium">Price Range</span>
                    <span className="font-bold">{supplier.priceRange}</span>
                  </div>
                </div>

                <Badge className="mt-6 w-full justify-center py-2 bg-primary/10 text-primary border-primary/20 rounded-xl">
                  {supplier.category.replace('_', ' ')}
                </Badge>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
