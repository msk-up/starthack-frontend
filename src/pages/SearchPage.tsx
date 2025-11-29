import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { Search, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { mockSuppliers } from '@/lib/mockData';
import { Supplier } from '@/types/procurement';
import { Logo } from '@/components/Logo';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02)_0%,transparent_50%)] pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="cursor-pointer hover:opacity-80 transition-opacity">
              <Logo className="text-foreground" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Collapsed after search */}
      <section className={`relative container mx-auto px-6 transition-all ${hasSearched ? 'py-12' : 'py-24'}`}>
        <div className={`mx-auto ${hasSearched ? 'max-w-4xl' : 'max-w-4xl'}`}>
          {!hasSearched && (
            <div className="text-center mb-16">
              <h2 className="mb-6 text-5xl font-title font-light tracking-tight text-foreground">
                State of the Art Procurement
              </h2>
              <p className="mb-16 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Search for products and connect with trusted suppliers through AI-powered negotiations
              </p>
            </div>
          )}

          {/* Search Bar */}
          <div className={`${hasSearched ? 'max-w-2xl mx-auto' : 'max-w-3xl mx-auto'}`}>
            <div className="flex gap-3 border rounded-xl p-3 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <Input
                type="text"
                placeholder="Search for products (e.g., laptops, steel, hoodies)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="border-0 bg-transparent text-base shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
              />
              <Button onClick={handleSearch} size={hasSearched ? "default" : "lg"} variant="default" className="gap-2 px-6 shrink-0">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      {suppliers.length > 0 && (
        <section className="relative container mx-auto px-6 pb-24">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-2xl font-title font-light">Available Suppliers</h3>
              {selectedSuppliers.length > 0 && (
                <Button onClick={handleProceed} size="default" variant="default" className="gap-2">
                  Proceed with {selectedSuppliers.length} Supplier
                  {selectedSuppliers.length !== 1 ? 's' : ''}
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <Card
                  key={supplier.id}
                  className="cursor-pointer p-6 transition-all hover:border-foreground/30 hover:shadow-md border bg-card/60 backdrop-blur-sm"
                  onClick={() => toggleSupplier(supplier.id)}
                >
                <div className="flex items-center gap-6">
                  <Checkbox
                    checked={selectedSuppliers.includes(supplier.id)}
                    onCheckedChange={() => toggleSupplier(supplier.id)}
                    className="h-5 w-5"
                  />
                  
                  <div className="rounded-md bg-muted p-2.5">
                    <Building2 className="h-5 w-5 text-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-base font-semibold">{supplier.name}</h4>
                      <Badge variant="outline" className="px-2 py-0.5 text-xs">
                        {supplier.category.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{supplier.location}</p>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">{supplier.rating}</div>
                      <div className="text-xs text-muted-foreground">Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{supplier.responseTime}</div>
                      <div className="text-xs text-muted-foreground">Response</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
