import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { CATEGORIES, ProductCategory } from '@/types/procurement';

interface NegotiationSidebarProps {
  activeCategory: ProductCategory;
  onCategoryChange: (category: ProductCategory) => void;
  supplierCounts: Record<string, number>;
}

export function NegotiationSidebar({ 
  activeCategory, 
  onCategoryChange,
  supplierCounts 
}: NegotiationSidebarProps) {
  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold px-4 py-3">
            Product Categories
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-4">
            <Tabs value={activeCategory} onValueChange={(v) => onCategoryChange(v as ProductCategory)}>
              <TabsList className="grid w-full grid-cols-1 gap-3 bg-transparent p-0">
                {CATEGORIES.map((cat) => {
                  const count = supplierCounts[cat.value] || 0;
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
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
