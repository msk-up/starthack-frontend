import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Search, Building2, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Supplier, ProductCategory } from '@/types/procurement';
import { Navbar } from '@/components/Navbar';
import { searchProducts, getSuppliers, checkApiHealth, type Product } from '@/lib/api';

interface SupplierWithProducts {
  id: string;
  name: string;
  category: ProductCategory;
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

  const toggleSelectAll = () => {
    if (selectedSuppliers.length === suppliers.length) {
      // Deselect all
      setSelectedSuppliers([]);
    } else {
      // Select all
      setSelectedSuppliers(suppliers.map(s => s.id));
    }
  };

  const handleProceed = () => {
    if (selectedSuppliers.length > 0) {
      // Get the full supplier objects for selected suppliers
      const selectedSupplierObjects = suppliers.filter(s => selectedSuppliers.includes(s.id));
      
      // Pass suppliers via state instead of just IDs
      navigate('/negotiation', {
        state: { suppliers: selectedSupplierObjects, product: searchQuery }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02)_0%,transparent_50%)] pointer-events-none" />
      
      {/* Floating geometric shapes */}
      {!hasSearched && (
        <>
          <div className="absolute top-20 left-10 w-72 h-72 bg-foreground/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-foreground/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-foreground/3 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
        </>
      )}
      
      {/* Header */}
      <Navbar />

      {/* Hero Section - Collapsed after search */}
      <section className={`relative container mx-auto px-6 transition-all duration-700 ${hasSearched ? 'py-12' : 'py-24'}`}>
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
          {!hasSearched && (
            <div className="text-center mb-8 w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <h2 className="mb-4 text-5xl md:text-6xl font-title font-light tracking-tight text-foreground">
                State of the Art
                <span className="block mt-2 bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text text-transparent">
                  Procurement
                </span>
              </h2>
              <p className="mb-8 text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
                Search for products and connect with suppliers. Every purchase request is managed by specialized agents working in parallel.
              </p>
            </div>
          )}

          {/* Search Bar */}
          <div className={`flex justify-center w-full transition-all duration-700 ${hasSearched ? 'max-w-2xl' : 'max-w-3xl'} animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500`}>
            <div className="flex gap-3 border-2 rounded-2xl p-4 bg-card/90 backdrop-blur-md shadow-lg hover:shadow-xl hover:border-foreground/20 transition-all duration-300 w-full relative overflow-hidden group">
              {/* Animated gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              {/* Subtle shimmer effect */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-muted/40 to-transparent group-hover:via-foreground/20 transition-colors duration-300" />
              
              <Input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleSearch();
                  }
                }}
                disabled={isLoading}
                className="border-0 bg-transparent text-base md:text-lg shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60 flex-1 relative z-10"
              />
              <Button 
                onClick={handleSearch} 
                size={hasSearched ? "default" : "lg"} 
                variant="default" 
                className="gap-2 px-6 md:px-8 shrink-0 relative z-10 hover:scale-105 transition-transform duration-200"
                disabled={isLoading}
              >
                <Search className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Landing Page Content - Only shown when not searched */}
      {!hasSearched && (
        <section className="relative container mx-auto px-6 pb-24">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mt-20">
              {/* Feature 1 */}
              <div className="text-center group animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/60 to-muted/30 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <Building2 className="h-10 w-10 text-foreground group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-2xl font-title font-light mb-4 group-hover:text-foreground transition-colors">Smart Matching</h3>
                <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">
                  AI-powered supplier matching connects you with the best vendors for your specific needs
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center group animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-900">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/60 to-muted/30 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <Zap className="h-10 w-10 text-foreground group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-2xl font-title font-light mb-4 group-hover:text-foreground transition-colors">Parallel Negotiations</h3>
                <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">
                  Multiple specialized agents work simultaneously to negotiate the best terms for your procurement
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center group animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-1100">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/60 to-muted/30 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <Clock className="h-10 w-10 text-foreground group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-2xl font-title font-light mb-4 group-hover:text-foreground transition-colors">Real-time Updates</h3>
                <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">
                  Track all negotiations in real-time with instant notifications and progress updates
                </p>
              </div>
            </div>

            {/* Additional Content Section */}
            <div className="mt-32 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-1300">
              <h3 className="text-4xl md:text-5xl font-title font-light mb-8 bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text text-transparent">
                Streamline Your Procurement
              </h3>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
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
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-title font-light">
                  {isLoading ? 'Searching...' : suppliers.length > 0 ? 'Available Suppliers' : 'No Results'}
                </h3>
                {suppliers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedSuppliers.length === suppliers.length && suppliers.length > 0}
                      onCheckedChange={toggleSelectAll}
                      className="h-5 w-5"
                    />
                    <label 
                      onClick={toggleSelectAll}
                      className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground"
                    >
                      Select All
                    </label>
                  </div>
                )}
              </div>
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
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-base font-semibold">{supplier.name}</h4>
                          <Badge variant="outline" className="px-2 py-0.5 text-xs">
                            {supplier.products.length} product{supplier.products.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
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
