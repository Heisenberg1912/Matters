import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BottomNav from "@/components/bottom-nav";
import PhoneShell from "@/components/phone-shell";
import ProgressRing from "@/components/progress-ring";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { useProjectStore, useBudgetStore } from "@/store";
import { staggerContainer, listItem, scaleIn, cardHover } from "@/lib/animations";

export default function Budget() {
  const navigate = useNavigate();
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const mode = useProjectStore((state) => state.mode);
  const setMode = useProjectStore((state) => state.setMode);
  const categories = useBudgetStore((state) => state.categories);
  const expenses = useBudgetStore((state) => state.expenses);
  const totalAllocated = useBudgetStore((state) => state.getTotalAllocated());
  const totalSpent = useBudgetStore((state) => state.getTotalSpent());
  const percentSpent = useBudgetStore((state) => state.getPercentSpent());

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
              <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">Budget Management</span>
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
                <h2 className="text-4xl font-bold tracking-tight text-white">Budget Overview</h2>
                <Card className="mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <div className="flex flex-col items-center justify-center rounded-[60px] border border-[#1f1f1f] bg-[#050505] p-10">
                      <ProgressRing value={percentSpent} size={280} strokeWidth={20} />
                      <div className="mt-8 text-center">
                        <div className="text-8xl font-black text-white">{percentSpent}%</div>
                        <p className="mt-4 text-2xl text-[#b9b9b9]">Budget Utilized</p>
                      </div>
                    </div>

                    <div className="flex flex-col rounded-[60px] border border-[#1f1f1f] bg-[#050505] p-10">
                      <div className="space-y-6">
                        <div>
                          <p className="text-sm uppercase tracking-[0.4em] text-[#bdbdbd]">Total Allocated</p>
                          <p className="mt-2 text-5xl font-bold text-white">₹{(totalAllocated / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-[0.4em] text-[#bdbdbd]">Total Spent</p>
                          <p className="mt-2 text-5xl font-bold text-[#cfe0ad]">₹{(totalSpent / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-[0.4em] text-[#bdbdbd]">Remaining</p>
                          <p className="mt-2 text-5xl font-bold text-white">₹{((totalAllocated - totalSpent) / 1000).toFixed(0)}K</p>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="h-6 overflow-hidden rounded-full border border-[#2a2a2a] bg-[#0d0d0d]">
                          <div
                            className="h-full rounded-full bg-[var(--pill,#cfe0ad)]"
                            style={{ width: `${percentSpent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Category Breakdown</h2>
                <motion.div
                  className="mt-8 space-y-4"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {categories.map((category) => {
                    const categoryPercent = Math.round((category.spent / category.allocated) * 100);
                    return (
                      <motion.div
                        key={category.id}
                        variants={listItem}
                        whileHover={cardHover}
                      >
                        <Card className="border border-[#2a2a2a] bg-[#101010] p-8">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-2xl font-semibold text-white">{category.name}</h3>
                              <span className="text-xl text-[#bdbdbd]">{categoryPercent}%</span>
                            </div>
                            <div className="mt-4 flex items-baseline gap-6 text-lg text-[#bdbdbd]">
                              <span>Spent: <span className="font-semibold text-white">₹{category.spent.toLocaleString()}</span></span>
                              <span>/</span>
                              <span>Allocated: <span className="font-semibold text-white">₹{category.allocated.toLocaleString()}</span></span>
                            </div>
                            <div className="mt-4 h-4 overflow-hidden rounded-full border border-[#2a2a2a] bg-[#0d0d0d]">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${categoryPercent}%`,
                                  backgroundColor: category.color
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Recent Expenses</h2>
                <Card className="mt-8 border border-[#2a2a2a] bg-[#0f0f0f] p-10">
                  <motion.div
                    className="space-y-6"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    {expenses.slice(0, 5).map((expense, idx) => (
                      <motion.div
                        key={expense.id}
                        variants={listItem}
                        className={`flex items-center justify-between py-6 ${
                          idx !== 0 ? "border-t border-[#1f1f1f]" : ""
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-baseline gap-4">
                            <h4 className="text-xl font-semibold text-white">{expense.description}</h4>
                            <span className="text-sm uppercase tracking-[0.3em] text-[#b8d4f1]">{expense.category}</span>
                          </div>
                          <div className="mt-2 flex gap-6 text-base text-[#bdbdbd]">
                            <span>{expense.vendor}</span>
                            <span>•</span>
                            <span>{expense.date}</span>
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-white">₹{expense.amount.toLocaleString()}</div>
                      </motion.div>
                    ))}
                  </motion.div>
                </Card>
              </section>

              <section className="mt-20">
                <motion.button
                  type="button"
                  onClick={() => setExpenseFormOpen(true)}
                  whileHover={{ scale: 1.01, borderColor: "#3a3a3a" }}
                  whileTap={{ scale: 0.99 }}
                  className="flex h-[200px] w-full items-center justify-center rounded-[50px] border-2 border-dashed border-[#2a2a2a] bg-[#111] text-2xl text-white transition"
                >
                  <span className="flex items-center gap-4">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#3a3a3a] text-4xl">+</span>
                    Add New Expense
                  </span>
                </motion.button>
              </section>
            </div>
          </div>

          <BottomNav />

          <ExpenseForm
            open={expenseFormOpen}
            onClose={() => setExpenseFormOpen(false)}
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
