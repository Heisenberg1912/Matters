import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BottomNav from "@/components/bottom-nav";
import PhoneShell from "@/components/phone-shell";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { InventoryItemForm } from "@/components/forms/InventoryItemForm";
import { Package, AlertCircle } from "lucide-react";
import { useProjectStore, useInventoryStore } from "@/store";
import { staggerContainer, listItem, scaleIn, cardHover } from "@/lib/animations";

export default function Inventory() {
  const navigate = useNavigate();
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const mode = useProjectStore((state) => state.mode);
  const setMode = useProjectStore((state) => state.setMode);
  const selectedCategory = useInventoryStore((state) => state.selectedCategory);
  const setSelectedCategory = useInventoryStore((state) => state.setSelectedCategory);
  const allItems = useInventoryStore((state) => state.items);

  // Compute derived values with useMemo to prevent infinite loops
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

  const menuItems = [
    { label: "Your Subscription", path: "/subscription" },
    { label: "Hire a Contractor", path: "/hire-contractor" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "News & Updates", path: "/news-updates" },
    { label: "Visit Builtattic", path: "/visit-builtattic" },
    { label: "Settings", path: "/settings" }
  ];

  return (
    <AnimatedPage>
      <PhoneShell>
        <Sheet>
          <div className="flex h-full flex-col">
            <header className="flex flex-wrap items-center gap-6 rounded-b-[60px] border-b border-[#1f1f1f] bg-[#050505] px-6 py-10 md:flex-nowrap md:px-10 lg:px-24 lg:py-16">
              <SheetTrigger asChild>
                <button type="button">
                  <Avatar className="h-16 w-16 border-2 border-[#232323]">
                    <AvatarFallback>G</AvatarFallback>
                  </Avatar>
                </button>
              </SheetTrigger>

            <div className="flex flex-col text-white">
              <span className="text-3xl font-semibold">Oh Hi, Guest!</span>
              <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">Inventory Management</span>
            </div>

            <div className="ml-auto flex rounded-full border border-[#2a2a2a] bg-[#0c0c0c] p-2 text-base font-semibold">
              {(["construction", "refurbish"] as const).map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => setMode(state)}
                  className={`rounded-full px-6 py-2 transition ${
                    mode === state ? "bg-[var(--pill,#cfe0ad)] text-black" : "text-white"
                  }`}
                >
                  {state.toUpperCase()}
                </button>
              ))}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 md:px-10 lg:px-24 pb-32">
            <div className="mx-auto w-full max-w-6xl">
              <section className="mt-16">
                <h2 className="text-4xl font-bold tracking-tight text-white">Inventory Summary</h2>
                <motion.div
                  className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  <motion.div variants={scaleIn}>
                    <Card className="flex flex-col items-center justify-center rounded-[46px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                      <Package size={64} className="text-[#cfe0ad]" strokeWidth={1.5} />
                      <div className="mt-6 text-6xl font-black text-white">{allItems.length}</div>
                      <p className="mt-2 text-xl text-[#b9b9b9]">Total Items</p>
                    </Card>
                  </motion.div>

                  <motion.div variants={scaleIn}>
                    <Card className="flex flex-col items-center justify-center rounded-[46px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                      <div className="text-sm uppercase tracking-[0.4em] text-[#bdbdbd]">Total Value</div>
                      <div className="mt-4 text-5xl font-black text-[#cfe0ad]">₹{(totalValue / 1000).toFixed(0)}K</div>
                      <p className="mt-2 text-lg text-[#b9b9b9]">In Stock</p>
                    </Card>
                  </motion.div>

                  <motion.div variants={scaleIn}>
                    <Card className="flex flex-col items-center justify-center rounded-[46px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                      <AlertCircle size={64} className="text-[#f3c5a8]" strokeWidth={1.5} />
                      <div className="mt-6 text-6xl font-black text-white">{lowStockCount}</div>
                      <p className="mt-2 text-xl text-[#b9b9b9]">Low Stock Items</p>
                    </Card>
                  </motion.div>
                </motion.div>
              </section>

              <section className="mt-20">
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-bold tracking-tight text-white">Filter by Category</h2>
                </div>
                <div className="mt-8 flex gap-4">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-full border px-8 py-3 text-lg font-semibold transition ${
                        selectedCategory === category
                          ? "border-[#cfe0ad] bg-[#cfe0ad] text-black"
                          : "border-[#2a2a2a] bg-[#0c0c0c] text-white hover:border-[#3a3a3a]"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </section>

              <section className="mt-16">
                <h2 className="text-4xl font-bold tracking-tight text-white">Inventory Items</h2>
                <motion.div
                  className="mt-8 space-y-6"
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
                        className={`border bg-[#101010] p-8 ${
                          item.lowStock || item.quantity < item.minStock
                            ? "border-[#f3c5a8]"
                            : "border-[#2a2a2a]"
                        }`}
                      >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <h3 className="text-2xl font-semibold text-white">{item.name}</h3>
                            {(item.lowStock || item.quantity < item.minStock) && (
                              <span className="flex items-center gap-2 rounded-full bg-[#f3c5a8]/10 px-4 py-1 text-sm font-semibold text-[#f3c5a8]">
                                <AlertCircle size={16} />
                                Low Stock
                              </span>
                            )}
                          </div>
                          <div className="mt-4 grid grid-cols-1 gap-x-12 gap-y-3 text-lg text-[#bdbdbd] sm:grid-cols-2">
                            <div>
                              <span className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Category</span>
                              <p className="mt-1 text-white">{item.category}</p>
                            </div>
                            <div>
                              <span className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Quantity</span>
                              <p className="mt-1 text-white">
                                {item.quantity} {item.unit}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Location</span>
                              <p className="mt-1 text-white">{item.location}</p>
                            </div>
                            <div>
                              <span className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Min Stock</span>
                              <p className="mt-1 text-white">
                                {item.minStock} {item.unit}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Unit Cost</span>
                              <p className="mt-1 text-white">₹{item.cost}</p>
                            </div>
                            <div>
                              <span className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Last Updated</span>
                              <p className="mt-1 text-white">{item.lastUpdated}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Total Value</div>
                          <div className="mt-2 text-3xl font-bold text-[#cfe0ad]">
                            ₹{(item.quantity * item.cost).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </section>

              <section className="mt-20">
                <motion.button
                  type="button"
                  onClick={() => setItemFormOpen(true)}
                  whileHover={{ scale: 1.01, borderColor: "#3a3a3a" }}
                  whileTap={{ scale: 0.99 }}
                  className="flex h-[200px] w-full items-center justify-center rounded-[50px] border-2 border-dashed border-[#2a2a2a] bg-[#111] text-2xl text-white transition"
                >
                  <span className="flex items-center gap-4">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#3a3a3a] text-4xl">+</span>
                    Add New Inventory Item
                  </span>
                </motion.button>
              </section>
            </div>
          </div>

          <BottomNav />

          <InventoryItemForm
            open={itemFormOpen}
            onClose={() => setItemFormOpen(false)}
          />
        </div>

        <SheetContent>
          <div className="space-y-10 text-2xl">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="w-full text-left font-medium transition hover:text-[#cfe0ad]"
              >
                {item.label}
              </button>
            ))}
            </div>
          </SheetContent>
        </Sheet>
      </PhoneShell>
    </AnimatedPage>
  );
}
