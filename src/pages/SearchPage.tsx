import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Search, Building2, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Supplier } from '@/types/procurement';
import { Logo } from '@/components/Logo';
import { searchProducts, getSuppliers, checkApiHealth, type Product } from '@/lib/api';

interface SupplierWithProducts extends Supplier {
  products: Product[];
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierWithProducts[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  // Check API availability on mount
  useEffect(() => {
    checkApiHealth().then(setApiAvailable).catch(() => setApiAvailable(false));
  }, []);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);
      
      try {
        // Search for products
        const products = await searchProducts(searchQuery);
        
        if (!products || products.length === 0) {
          setSuppliers([]);
          return;
        }
        
        // Group products by supplier
        const supplierMap = new Map<string, SupplierWithProducts>();
        
        for (const product of products) {
          const supplierId = product.supplier_id;
          
          if (!supplierId) {
            console.warn('Product missing supplier_id:', product);
            continue;
          }
          
          if (!supplierMap.has(supplierId)) {
            // Create supplier entry
            supplierMap.set(supplierId, {
              id: supplierId,
              name: product.supplier_name || 'Unknown Supplier',
              category: 'electronics' as const, // Default category, you can enhance this
              rating: 4.5, // Default rating, you can fetch from API later
              responseTime: '2h', // Default, you can fetch from API later
              priceRange: '$$', // Default, you can fetch from API later
              location: 'Unknown', // Default, you can fetch from API later
              products: [],
            });
          }
          
          supplierMap.get(supplierId)!.products.push(product);
        }
        
        // Convert map to array
        const suppliersList = Array.from(supplierMap.values());
        console.log('Grouped suppliers:', suppliersList);
        setSuppliers(suppliersList);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to search products';
        setError(errorMessage);
        console.error('Search error:', err);
        setSuppliers([]);
      } finally {
        setIsLoading(false);
      }
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
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
          {!hasSearched && (
            <div className="text-center mb-8 w-full flex flex-col items-center">
              <h2 className="mb-4 text-5xl font-title font-light tracking-tight text-foreground">
                State of the Art Procurement
              </h2>
              <p className="mb-8 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Search for products and connect with suppliers. Every purchase request is managed by specialized agents working in parallel.
              </p>
            </div>
          )}

          {/* Search Bar */}
          <div className={`flex justify-center w-full ${hasSearched ? 'max-w-2xl' : 'max-w-3xl'}`}>
            <div className="flex gap-3 border rounded-xl p-3 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow w-full relative overflow-hidden">
              {/* Subtle gray gradient at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-muted/30 to-transparent" />
              <Input
                type="text"
                placeholder="Search for products (e.g., laptops, steel, hoodies)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleSearch();
                  }
                }}
                disabled={isLoading}
                className="border-0 bg-transparent text-base shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60 flex-1 relative z-10"
              />
              <Button 
                onClick={handleSearch} 
                size={hasSearched ? "default" : "lg"} 
                variant="default" 
                className="gap-2 px-6 shrink-0 relative z-10"
                disabled={isLoading}
              >
                <Search className="h-4 w-4" />
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Landing Page Content - Only shown when not searched */}
      {!hasSearched && (
        <section className="relative container mx-auto px-6 pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              {/* Feature 1 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 mx-auto mb-4 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="text-xl font-title font-light mb-3">Smart Matching</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AI-powered supplier matching connects you with the best vendors for your specific needs
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 mx-auto mb-4 flex items-center justify-center">
                  <Search className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="text-xl font-title font-light mb-3">Parallel Negotiations</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Multiple specialized agents work simultaneously to negotiate the best terms for your procurement
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 mx-auto mb-4 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="text-xl font-title font-light mb-3">Real-time Updates</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Track all negotiations in real-time with instant notifications and progress updates
                </p>
              </div>
            </div>

            {/* Additional Content Section */}
            <div className="mt-24 text-center">
              <h3 className="text-3xl font-title font-light mb-6">Streamline Your Procurement</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Our platform automates the entire procurement process, from supplier discovery to final negotiation, 
                saving you time and ensuring you get the best deals.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Results */}
      {hasSearched && (
        <section className="relative container mx-auto px-6 pb-24">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-2xl font-title font-light">
                {isLoading ? 'Searching...' : suppliers.length > 0 ? 'Available Suppliers' : 'No Results'}
              </h3>
              {selectedSuppliers.length > 0 && (
                <Button onClick={handleProceed} size="default" variant="default" className="gap-2">
                  Proceed with {selectedSuppliers.length} Supplier
                  {selectedSuppliers.length !== 1 ? 's' : ''}
                </Button>
              )}
            </div>

            {apiAvailable === false && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  ⚠️ Backend API is not available. Make sure the server is running on {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5147'}
                </p>
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Searching for products...</p>
              </div>
            ) : suppliers.length > 0 ? (
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
                            {supplier.products.length} product{supplier.products.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{supplier.location}</p>
                        <div className="flex flex-wrap gap-2">
                          {supplier.products.slice(0, 3).map((product) => (
                            <Badge key={product.product_id} variant="secondary" className="text-xs">
                              {product.product_name}
                            </Badge>
                          ))}
                          {supplier.products.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{supplier.products.length - 3} more
                            </Badge>
                          )}
                        </div>
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
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No suppliers found for "{searchQuery}"</p>
                <p className="text-sm text-muted-foreground mt-2">Try a different search term</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
