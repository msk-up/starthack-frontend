import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, MessageSquare, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { Link } from 'react-router-dom';
import { getNegotiations, getNegotiationById, getSuppliers, getProducts, type Negotiation } from '@/lib/api';
import { Supplier, ProductCategory } from '@/types/procurement';
import { cn } from '@/lib/utils';

export default function NegotiationsHistoryPage() {
  const navigate = useNavigate();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchNegotiations = async () => {
      try {
        setLoading(true);
        const data = await getNegotiations();
        setNegotiations(data || []);
      } catch (error) {
        console.error('Error fetching negotiations:', error);
        setNegotiations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNegotiations();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleNegotiationClick = async (negotiationId: string | number) => {
    try {
      const negotiation = await getNegotiationById(negotiationId);
      if (!negotiation) {
        console.warn('Negotiation not found', negotiationId);
        return;
      }

      let supplierList: any[] = [];
      let products: any[] = [];
      try {
        const apiSuppliers = await getSuppliers();
        supplierList = Array.isArray(apiSuppliers)
          ? apiSuppliers
          : (apiSuppliers as any)?.suppliers || [];
      } catch (err) {
        console.warn('Failed to fetch suppliers, falling back to ids only', err);
      }
      try {
        products = await getProducts();
      } catch (err) {
        console.warn('Failed to fetch products for supplier names', err);
      }

      // Normalize supplier list for easier lookup
      const supplierMap = new Map<string, Supplier>();
      supplierList.forEach((s: any) => {
        const id = String(s?.supplier_id || s?.id || s?.supplier_name || '').trim();
        if (!id) return;
        const normalized: Supplier = {
          id,
          name: s?.supplier_name || s?.name || id,
          category: (s?.category as ProductCategory) || 'electronics',
          rating: s?.rating || 0,
          responseTime: s?.response_time || s?.responseTime || '',
          priceRange: s?.price_range || s?.priceRange || '',
          location: s?.location || '',
        };
        supplierMap.set(id, normalized);
        if (s?.supplier_name) supplierMap.set(String(s.supplier_name), normalized);
      });

      const mappedSuppliers: Supplier[] = (negotiation.supplier_ids || []).map((id) => {
        const key = String(id).trim();

        // Always try to derive the name from products by supplier_id
        const productMatch = products.find((p: any) => p?.supplier_id === key);
        if (productMatch) {
          return {
            id: key,
            name: productMatch.supplier_name || `Supplier ${key}`,
            category: (productMatch.category as ProductCategory) || 'electronics',
            rating: 0,
            responseTime: '',
            priceRange: '',
            location: '',
          };
        }

        // Fallback to supplier map
        const match = supplierMap.get(key);
        if (match) return match;

        return {
          id: key,
          name: `Supplier ${key}`,
          category: 'electronics',
          rating: 0,
          responseTime: '',
          priceRange: '',
          location: '',
        };
      });

      navigate('/negotiation', {
        state: {
          suppliers: mappedSuppliers,
          negotiationPrompt: negotiation.prompt,
          negotiationTones: negotiation.modes || [],
        },
      });
    } catch (error) {
      console.error('Error opening negotiation', error);
    }
  };

  // Filter negotiations
  const filteredNegotiations = negotiations.filter((ng) => {
    const matchesSearch = 
      ng.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ng.modes.some(mode => mode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || ng.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = negotiations.reduce((acc, ng) => {
    acc[ng.status] = (acc[ng.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Link to="/" className="cursor-pointer hover:opacity-80 transition-opacity">
                <Logo className="text-foreground" />
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium rounded-full">
                {filteredNegotiations.length} Negotiation{filteredNegotiations.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-title font-light tracking-tight mb-2">
              Negotiations History
            </h1>
            <p className="text-muted-foreground">
              View and manage all your previous negotiations
            </p>
          </div>

          {/* Filters and Search */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search negotiations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All ({negotiations.length})
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
              >
                Pending ({statusCounts.pending || 0})
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Active ({statusCounts.active || 0})
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('completed')}
              >
                Completed ({statusCounts.completed || 0})
              </Button>
            </div>
          </div>

          {/* Negotiations List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">Loading negotiations...</div>
            </div>
          ) : filteredNegotiations.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No negotiations match your filters'
                  : 'No negotiations found'}
              </div>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={() => navigate('/')} variant="outline">
                  Start a new negotiation
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredNegotiations.map((negotiation) => (
                <Card
                  key={String(negotiation.negotiation_id)}
                  className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleNegotiationClick(negotiation.negotiation_id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                            {truncateText(negotiation.prompt, 150)}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(negotiation.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>
                                {negotiation.supplier_ids.length} supplier
                                {negotiation.supplier_ids.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0",
                            negotiation.status === 'pending' && "border-yellow-500/50 text-yellow-700 dark:text-yellow-400",
                            negotiation.status === 'active' && "border-blue-500/50 text-blue-700 dark:text-blue-400",
                            negotiation.status === 'completed' && "border-green-500/50 text-green-700 dark:text-green-400",
                            negotiation.status === 'started' && "border-blue-500/50 text-blue-700 dark:text-blue-400"
                          )}
                        >
                          {negotiation.status}
                        </Badge>
                      </div>
                      
                      {negotiation.modes && negotiation.modes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {negotiation.modes.map((mode, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {mode}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNegotiationClick(negotiation.negotiation_id);
                          }}
                        >
                          View Details →
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

