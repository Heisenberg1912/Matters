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
import { staggerContainer, listItem, cardHover } from "@/lib/animations";

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
            {/* Header - Mobile Optimized */}
            <header className="flex flex-col gap-3 xs:gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6 rounded-b-[30px] xs:rounded-b-[40px] sm:rounded-b-[50px] md:rounded-b-[60px] border-b border-[#1f1f1f] bg-[#050505] px-4 py-4 xs:px-5 xs:py-5 sm:px-6 sm:py-8 md:px-10 md:py-10 lg:px-24 lg:py-16">
              <div className="flex items-center gap-3 xs:gap-4 sm:gap-6">
                <SheetTrigger asChild>
                  <button type="button" className="shrink-0">
                    <Avatar className="h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 border-2 border-[#232323]">
                      <AvatarFallback className="text-sm xs:text-base sm:text-lg md:text-xl">G</AvatarFallback>
                    </Avatar>
                  </button>
                </SheetTrigger>

                <div className="flex flex-col text-white min-w-0 flex-1">
                  <span className="text-base xs:text-lg sm:text-2xl md:text-3xl font-semibold truncate">Oh Hi, Guest!</span>
                  <span className="text-[0.6rem] xs:text-xs sm:text-sm uppercase tracking-[0.15em] xs:tracking-[0.25em] sm:tracking-[0.35em] text-[#c7c7c7] truncate">Budget Management</span>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex rounded-full border border-[#2a2a2a] bg-[#0c0c0c] p-1 xs:p-1.5 sm:p-2 text-[0.65rem] xs:text-xs sm:text-sm md:text-base font-semibold sm:ml-auto self-start sm:self-auto w-fit">
                {(["construction", "refurbish"] as const).map((state) => (
                  <button
                    key={state}
                    type="button"
                    onClick={() => setMode(state)}
                    className={`rounded-full px-2.5 py-1 xs:px-3 xs:py-1.5 sm:px-4 sm:py-2 md:px-6 transition active:scale-95 ${
                      mode === state ? "bg-[var(--pill,#cfe0ad)] text-black" : "text-white"
                    }`}
                  >
                    <span className="hidden sm:inline">{state.toUpperCase()}</span>
                    <span className="sm:hidden">{state === "construction" ? "BUILD" : "REFURB"}</span>
                  </button>
                ))}
              </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-3 xs:px-4 sm:px-6 md:px-10 lg:px-24 pb-20 xs:pb-24 sm:pb-28 md:pb-32 touch-scroll">
              <div className="mx-auto w-full max-w-6xl">
                {/* Budget Overview Section */}
                <section className="mt-4 xs:mt-6 sm:mt-10 md:mt-16">
                  <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Budget Overview</h2>
                  <Card className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-3 xs:p-4 sm:p-6 md:p-8 lg:p-10">
                    <div className="grid grid-cols-1 gap-4 xs:gap-5 sm:gap-6 md:gap-8 lg:grid-cols-2">
                      {/* Progress Ring */}
                      <div className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[30px] sm:rounded-[40px] md:rounded-[50px] lg:rounded-[60px] border border-[#1f1f1f] bg-[#050505] p-4 xs:p-5 sm:p-6 md:p-8 lg:p-10">
                        <div className="shrink-0">
                          <ProgressRing value={percentSpent} size={120} strokeWidth={12} className="xs:hidden" />
                          <ProgressRing value={percentSpent} size={160} strokeWidth={14} className="hidden xs:block sm:hidden" />
                          <ProgressRing value={percentSpent} size={200} strokeWidth={16} className="hidden sm:block md:hidden" />
                          <ProgressRing value={percentSpent} size={240} strokeWidth={18} className="hidden md:block lg:hidden" />
                          <ProgressRing value={percentSpent} size={280} strokeWidth={20} className="hidden lg:block" />
                        </div>
                        <div className="mt-4 xs:mt-5 sm:mt-6 md:mt-8 text-center">
                          <div className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white">{percentSpent}%</div>
                          <p className="mt-2 xs:mt-3 sm:mt-4 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-[#b9b9b9]">Budget Utilized</p>
                        </div>
                      </div>

                      {/* Budget Stats */}
                      <div className="flex flex-col rounded-[20px] xs:rounded-[30px] sm:rounded-[40px] md:rounded-[50px] lg:rounded-[60px] border border-[#1f1f1f] bg-[#050505] p-4 xs:p-5 sm:p-6 md:p-8 lg:p-10">
                        <div className="space-y-4 xs:space-y-5 sm:space-y-6">
                          <div>
                            <p className="text-[0.6rem] xs:text-xs sm:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] sm:tracking-[0.4em] text-[#bdbdbd]">Total Allocated</p>
                            <p className="mt-1 xs:mt-2 text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-white">₹{(totalAllocated / 1000).toFixed(0)}K</p>
                          </div>
                          <div>
                            <p className="text-[0.6rem] xs:text-xs sm:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] sm:tracking-[0.4em] text-[#bdbdbd]">Total Spent</p>
                            <p className="mt-1 xs:mt-2 text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-[#cfe0ad]">₹{(totalSpent / 1000).toFixed(0)}K</p>
                          </div>
                          <div>
                            <p className="text-[0.6rem] xs:text-xs sm:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] sm:tracking-[0.4em] text-[#bdbdbd]">Remaining</p>
                            <p className="mt-1 xs:mt-2 text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-white">₹{((totalAllocated - totalSpent) / 1000).toFixed(0)}K</p>
                          </div>
                        </div>

                        <div className="mt-auto pt-4 xs:pt-5 sm:pt-6">
                          <div className="h-3 xs:h-4 sm:h-5 md:h-6 overflow-hidden rounded-full border border-[#2a2a2a] bg-[#0d0d0d]">
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

                {/* Category Breakdown */}
                <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-20">
                  <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Category Breakdown</h2>
                  <motion.div
                    className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 space-y-3 xs:space-y-4"
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
                          <Card className="border border-[#2a2a2a] bg-[#101010] p-4 xs:p-5 sm:p-6 md:p-8">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-white truncate">{category.name}</h3>
                                  <span className="text-sm xs:text-base sm:text-lg md:text-xl text-[#bdbdbd] shrink-0">{categoryPercent}%</span>
                                </div>
                                <div className="mt-2 xs:mt-3 sm:mt-4 flex flex-wrap items-baseline gap-2 xs:gap-3 sm:gap-4 md:gap-6 text-xs xs:text-sm sm:text-base md:text-lg text-[#bdbdbd]">
                                  <span>Spent: <span className="font-semibold text-white">₹{category.spent.toLocaleString()}</span></span>
                                  <span className="hidden xs:inline">/</span>
                                  <span>Allocated: <span className="font-semibold text-white">₹{category.allocated.toLocaleString()}</span></span>
                                </div>
                                <div className="mt-2 xs:mt-3 sm:mt-4 h-2 xs:h-3 sm:h-4 overflow-hidden rounded-full border border-[#2a2a2a] bg-[#0d0d0d]">
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

                {/* Recent Expenses */}
                <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-20">
                  <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Recent Expenses</h2>
                  <Card className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 border border-[#2a2a2a] bg-[#0f0f0f] p-4 xs:p-5 sm:p-6 md:p-8 lg:p-10">
                    <motion.div
                      className="space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6"
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                    >
                      {expenses.slice(0, 5).map((expense, idx) => (
                        <motion.div
                          key={expense.id}
                          variants={listItem}
                          className={`flex flex-col xs:flex-row xs:items-center justify-between gap-2 xs:gap-4 py-3 xs:py-4 sm:py-5 md:py-6 ${
                            idx !== 0 ? "border-t border-[#1f1f1f]" : ""
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-baseline gap-2 xs:gap-3 sm:gap-4">
                              <h4 className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-white truncate">{expense.description}</h4>
                              <span className="text-[0.6rem] xs:text-xs sm:text-sm uppercase tracking-[0.15em] xs:tracking-[0.2em] sm:tracking-[0.3em] text-[#b8d4f1] shrink-0">{expense.category}</span>
                            </div>
                            <div className="mt-1 xs:mt-2 flex flex-wrap gap-2 xs:gap-3 sm:gap-4 md:gap-6 text-[0.65rem] xs:text-xs sm:text-sm md:text-base text-[#bdbdbd]">
                              <span>{expense.vendor}</span>
                              <span>•</span>
                              <span>{expense.date}</span>
                            </div>
                          </div>
                          <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-white shrink-0">₹{expense.amount.toLocaleString()}</div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </Card>
                </section>

                {/* Add Expense Button */}
                <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-20">
                  <motion.button
                    type="button"
                    onClick={() => setExpenseFormOpen(true)}
                    whileHover={{ scale: 1.01, borderColor: "#3a3a3a" }}
                    whileTap={{ scale: 0.99 }}
                    className="flex h-[100px] xs:h-[120px] sm:h-[150px] md:h-[180px] lg:h-[200px] w-full items-center justify-center rounded-[20px] xs:rounded-[30px] sm:rounded-[40px] md:rounded-[50px] border-2 border-dashed border-[#2a2a2a] bg-[#111] text-base xs:text-lg sm:text-xl md:text-2xl text-white transition active:scale-[0.98]"
                  >
                    <span className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                      <span className="flex h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-full border border-[#3a3a3a] text-2xl xs:text-3xl sm:text-4xl">+</span>
                      <span className="hidden xs:inline">Add New Expense</span>
                      <span className="xs:hidden">Add Expense</span>
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

          {/* Side Menu Sheet */}
          <SheetContent>
            <div className="space-y-5 xs:space-y-6 sm:space-y-8 md:space-y-10 text-base xs:text-lg sm:text-xl md:text-2xl pt-6 xs:pt-8 sm:pt-10">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="w-full text-left font-medium transition hover:text-[#cfe0ad] active:scale-[0.98]"
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
