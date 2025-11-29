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
      <header className="glass sticky top-0 z-50 border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">ProcureAI</h1>
            </div>
            <Badge variant="secondary" className="text-xs">
              Beta
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <h2 className="mb-4 text-4xl font-bold tracking-tight">
          Find the Best Suppliers
        </h2>
        <p className="mb-12 text-lg text-muted-foreground">
          Search for products and connect with trusted suppliers through AI-powered negotiations
        </p>

        {/* Search Bar */}
        <div className="mx-auto max-w-2xl">
          <div className="glass glass-hover flex gap-2 rounded-xl p-2">
            <Input
              type="text"
              placeholder="Search for products (e.g., laptops, steel, hoodies)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
            />
            <Button onClick={handleSearch} size="lg" className="gap-2 px-8">
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
            <h3 className="text-2xl font-semibold">Available Suppliers</h3>
            {selectedSuppliers.length > 0 && (
              <Button onClick={handleProceed} size="lg" className="gap-2">
                Proceed with {selectedSuppliers.length} Supplier
                {selectedSuppliers.length !== 1 ? 's' : ''}
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((supplier) => (
              <Card
                key={supplier.id}
                className="glass glass-hover cursor-pointer p-6 transition-all"
                onClick={() => toggleSupplier(supplier.id)}
              >
                <div className="mb-4 flex items-start justify-between">
                  <Checkbox
                    checked={selectedSuppliers.includes(supplier.id)}
                    onCheckedChange={() => toggleSupplier(supplier.id)}
                    className="mt-1"
                  />
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>

                <h4 className="mb-2 text-lg font-semibold">{supplier.name}</h4>
                <p className="mb-4 text-sm text-muted-foreground">{supplier.location}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rating</span>
                    <span className="font-medium">⭐ {supplier.rating}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Response Time</span>
                    <span className="font-medium">{supplier.responseTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Price Range</span>
                    <span className="font-medium">{supplier.priceRange}</span>
                  </div>
                </div>

                <Badge variant="secondary" className="mt-4">
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
