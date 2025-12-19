import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import PageLayout from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { InventoryItemForm } from "@/components/forms/InventoryItemForm";
import { Package, AlertCircle } from "lucide-react";
import { useInventoryStore } from "@/store";
import { staggerContainer, listItem, scaleIn, cardHover } from "@/lib/animations";
import { useProject } from "@/context/ProjectContext";
import { cn } from "@/lib/utils";

export default function Inventory() {
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const { currentProject } = useProject();
  const selectedCategory = useInventoryStore((state) => state.selectedCategory);
  const setSelectedCategory = useInventoryStore((state) => state.setSelectedCategory);
  const allItems = useInventoryStore((state) => state.items);
  const inventoryError = useInventoryStore((state) => state.error);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "All") {
      return allItems;
    }
    return allItems.filter((item) => item.category === selectedCategory);
  }, [allItems, selectedCategory]);

  const lowStockCount = useMemo(() => {
    return allItems.filter((item) => item.lowStock || item.quantity < item.minStock).length;
  }, [allItems]);

  const totalValue = useMemo(() => {
    return allItems.reduce((sum, item) => sum + item.quantity * item.cost, 0);
  }, [allItems]);

  const categories = useMemo(() => {
    const cats = new Set(allItems.map((item) => item.category));
    return ["All", ...Array.from(cats).sort()];
  }, [allItems]);

  return (
    <PageLayout
      title="Inventory Management"
      extras={
        <InventoryItemForm
          open={itemFormOpen}
          onClose={() => setItemFormOpen(false)}
        />
      }
    >
      {/* Inventory Summary */}
      <section className="mt-4 xs:mt-6 sm:mt-10 md:mt-16">
        <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Inventory Summary</h2>
        {!currentProject && (
          <Card className="mt-4 border border-[#242424] bg-[#101010] p-4 xs:p-5 sm:p-6 text-sm xs:text-base text-[#bdbdbd]">
            Select or create a project to view inventory details.
          </Card>
        )}
        {inventoryError && (
          <Card className="mt-4 border border-red-500/40 bg-red-500/10 p-4 xs:p-5 sm:p-6 text-sm xs:text-base text-red-200">
            {inventoryError}
          </Card>
        )}
        <motion.div
          className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 gap-3 xs:gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={scaleIn}>
            <Card className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[30px] sm:rounded-[38px] md:rounded-[46px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-4 xs:p-6 sm:p-8 md:p-10">
              <Package className="h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-[#cfe0ad]" strokeWidth={1.5} />
              <div className="mt-3 xs:mt-4 sm:mt-5 md:mt-6 text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black text-white">{allItems.length}</div>
              <p className="mt-1 xs:mt-2 text-sm xs:text-base sm:text-lg md:text-xl text-[#b9b9b9]">Total Items</p>
            </Card>
          </motion.div>

          <motion.div variants={scaleIn}>
            <Card className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[30px] sm:rounded-[38px] md:rounded-[46px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-4 xs:p-6 sm:p-8 md:p-10">
              <div className="text-[0.55rem] xs:text-[0.6rem] sm:text-xs md:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] sm:tracking-[0.4em] text-[#bdbdbd]">Total Value</div>
              <div className="mt-2 xs:mt-3 sm:mt-4 text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black text-[#cfe0ad]">₹{(totalValue / 1000).toFixed(0)}K</div>
              <p className="mt-1 xs:mt-2 text-xs xs:text-sm sm:text-base md:text-lg text-[#b9b9b9]">In Stock</p>
            </Card>
          </motion.div>

          <motion.div variants={scaleIn}>
            <Card className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[30px] sm:rounded-[38px] md:rounded-[46px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-4 xs:p-6 sm:p-8 md:p-10 sm:col-span-2 lg:col-span-1">
              <AlertCircle className="h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-[#f3c5a8]" strokeWidth={1.5} />
              <div className="mt-3 xs:mt-4 sm:mt-5 md:mt-6 text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black text-white">{lowStockCount}</div>
              <p className="mt-1 xs:mt-2 text-sm xs:text-base sm:text-lg md:text-xl text-[#b9b9b9]">Low Stock Items</p>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Filter by Category - Horizontal Scroll on Mobile */}
      <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-20">
        <div className="flex items-center justify-between">
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Filter by Category</h2>
        </div>
        <div className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 scroll-x-container xs:flex-wrap xs:gap-3 sm:gap-4">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "rounded-full border px-3 py-1.5 xs:px-4 xs:py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3",
                "text-xs xs:text-sm sm:text-base md:text-lg font-semibold",
                "transition active:scale-95 touch-target focus-ring no-select",
                selectedCategory === category
                  ? "border-[#cfe0ad] bg-[#cfe0ad] text-black"
                  : "border-[#2a2a2a] bg-[#0c0c0c] text-white hover:border-[#3a3a3a]"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Inventory Items */}
      <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-16">
        <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Inventory Items</h2>
        <motion.div
          className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              variants={listItem}
              whileHover={cardHover}
            >
              <Card
                className={cn(
                  "border bg-[#101010] p-4 xs:p-5 sm:p-6 md:p-8",
                  item.lowStock || item.quantity < item.minStock
                    ? "border-[#f3c5a8]"
                    : "border-[#2a2a2a]"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 xs:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 xs:gap-3 sm:gap-4">
                      <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-white">{item.name}</h3>
                      {(item.lowStock || item.quantity < item.minStock) && (
                        <span className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 rounded-full bg-[#f3c5a8]/10 px-2 py-0.5 xs:px-3 xs:py-1 sm:px-4 text-[0.6rem] xs:text-xs sm:text-sm font-semibold text-[#f3c5a8]">
                          <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                          Low Stock
                        </span>
                      )}
                    </div>
                    <div className="mt-2 xs:mt-3 sm:mt-4 grid grid-cols-2 gap-x-4 xs:gap-x-6 sm:gap-x-8 md:gap-x-12 gap-y-2 xs:gap-y-3 text-xs xs:text-sm sm:text-base md:text-lg text-[#bdbdbd]">
                      <div>
                        <span className="text-[0.55rem] xs:text-[0.6rem] sm:text-xs md:text-sm uppercase tracking-[0.15em] xs:tracking-[0.2em] sm:tracking-[0.3em] text-[#8a8a8a]">Category</span>
                        <p className="mt-0.5 xs:mt-1 text-white">{item.category}</p>
                      </div>
                      <div>
                        <span className="text-[0.55rem] xs:text-[0.6rem] sm:text-xs md:text-sm uppercase tracking-[0.15em] xs:tracking-[0.2em] sm:tracking-[0.3em] text-[#8a8a8a]">Quantity</span>
                        <p className="mt-0.5 xs:mt-1 text-white">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                      <div>
                        <span className="text-[0.55rem] xs:text-[0.6rem] sm:text-xs md:text-sm uppercase tracking-[0.15em] xs:tracking-[0.2em] sm:tracking-[0.3em] text-[#8a8a8a]">Location</span>
                        <p className="mt-0.5 xs:mt-1 text-white truncate">{item.location}</p>
                      </div>
                      <div>
                        <span className="text-[0.55rem] xs:text-[0.6rem] sm:text-xs md:text-sm uppercase tracking-[0.15em] xs:tracking-[0.2em] sm:tracking-[0.3em] text-[#8a8a8a]">Min Stock</span>
                        <p className="mt-0.5 xs:mt-1 text-white">
                          {item.minStock} {item.unit}
                        </p>
                      </div>
                      <div>
                        <span className="text-[0.55rem] xs:text-[0.6rem] sm:text-xs md:text-sm uppercase tracking-[0.15em] xs:tracking-[0.2em] sm:tracking-[0.3em] text-[#8a8a8a]">Unit Cost</span>
                        <p className="mt-0.5 xs:mt-1 text-white">₹{item.cost}</p>
                      </div>
                      <div>
                        <span className="text-[0.55rem] xs:text-[0.6rem] sm:text-xs md:text-sm uppercase tracking-[0.15em] xs:tracking-[0.2em] sm:tracking-[0.3em] text-[#8a8a8a]">Last Updated</span>
                        <p className="mt-0.5 xs:mt-1 text-white">{item.lastUpdated}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-[0.55rem] xs:text-[0.6rem] sm:text-xs md:text-sm uppercase tracking-[0.15em] xs:tracking-[0.2em] sm:tracking-[0.3em] text-[#8a8a8a]">Total Value</div>
                    <div className="mt-1 xs:mt-2 text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-[#cfe0ad]">
                      ₹{(item.quantity * item.cost).toLocaleString()}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Add Item Button */}
      <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-20">
        <motion.button
          type="button"
          onClick={() => setItemFormOpen(true)}
          whileHover={{ scale: 1.01, borderColor: "#3a3a3a" }}
          whileTap={{ scale: 0.99 }}
          className="flex h-[100px] xs:h-[120px] sm:h-[150px] md:h-[180px] lg:h-[200px] w-full items-center justify-center rounded-[20px] xs:rounded-[30px] sm:rounded-[40px] md:rounded-[50px] border-2 border-dashed border-[#2a2a2a] bg-[#111] text-base xs:text-lg sm:text-xl md:text-2xl text-white transition active:scale-[0.98] touch-target focus-ring"
        >
          <span className="flex items-center gap-2 xs:gap-3 sm:gap-4">
            <span className="flex h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-full border border-[#3a3a3a] text-2xl xs:text-3xl sm:text-4xl">+</span>
            <span className="hidden xs:inline">Add New Inventory Item</span>
            <span className="xs:hidden">Add Item</span>
          </span>
        </motion.button>
      </section>
    </PageLayout>
  );
}
