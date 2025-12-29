import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneShell from "@/components/phone-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, Newspaper, TrendingUp, Sparkles, Bell, ExternalLink } from "lucide-react";

const newsCategories = ["All", "App Updates", "Industry News", "Company", "Tips & Tricks"];

const newsItems = [
  {
    id: "1",
    category: "App Updates",
    title: "MATTERS 2.0 - Major Update Released",
    description: "We've rolled out a massive update with new features including voice notes in chat, advanced budget analytics, and improved offline mode. Check out what's new!",
    date: "Dec 15, 2025",
    readTime: "3 min read",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
    badge: "New",
    link: "/updates/2.0-release"
  },
  {
    id: "2",
    category: "Industry News",
    title: "Construction Industry Growth Projected at 12% in 2026",
    description: "Latest reports show strong growth in the construction sector driven by infrastructure projects and housing demand across India. What this means for contractors.",
    date: "Dec 12, 2025",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop",
    badge: "Trending",
    link: "/news/industry-growth-2026"
  },
  {
    id: "3",
    category: "Tips & Tricks",
    title: "5 Ways to Reduce Construction Budget Overruns",
    description: "Learn expert strategies to keep your construction projects on budget. From better material forecasting to contractor management tips.",
    date: "Dec 10, 2025",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1554224311-beee4114628b?w=800&auto=format&fit=crop",
    badge: null,
    link: "/tips/budget-management"
  },
  {
    id: "4",
    category: "Company",
    title: "BuildAttic Wins 'Best Construction Tech' Award",
    description: "We're honored to receive the Construction Technology Innovation Award 2025 for MATTERS platform. Thank you to our amazing users and team!",
    date: "Dec 8, 2025",
    readTime: "2 min read",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop",
    badge: "Award",
    link: "/company/award-2025"
  },
  {
    id: "5",
    category: "App Updates",
    title: "New Feature: AI-Powered Schedule Optimization",
    description: "MATTERS now uses AI to suggest optimal task scheduling based on weather, contractor availability, and project dependencies. Beta now available.",
    date: "Dec 5, 2025",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop",
    badge: "Beta",
    link: "/updates/ai-scheduling"
  },
  {
    id: "6",
    category: "Industry News",
    title: "New Building Safety Regulations Effective Jan 2026",
    description: "Important updates to construction safety standards that all contractors must comply with. We've updated MATTERS to help you stay compliant.",
    date: "Dec 3, 2025",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop",
    badge: "Important",
    link: "/news/safety-regulations"
  },
  {
    id: "7",
    category: "Tips & Tricks",
    title: "How to Choose the Right Contractor for Your Project",
    description: "A comprehensive guide to evaluating contractors: what to look for in ratings, reviews, certifications, and past work. Make informed hiring decisions.",
    date: "Nov 28, 2025",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop",
    badge: null,
    link: "/tips/hiring-contractors"
  },
  {
    id: "8",
    category: "Company",
    title: "MATTERS Reaches 10,000 Active Projects Milestone",
    description: "We're thrilled to announce that over 10,000 construction projects are now being managed on MATTERS. Thank you for trusting us with your builds!",
    date: "Nov 25, 2025",
    readTime: "3 min read",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop",
    badge: "Milestone",
    link: "/company/10k-projects"
  },
  {
    id: "9",
    category: "App Updates",
    title: "Mobile App Performance Improvements",
    description: "We've optimized the mobile experience with 40% faster load times, better offline support, and reduced data usage. Update now for the best experience.",
    date: "Nov 20, 2025",
    readTime: "2 min read",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop",
    badge: null,
    link: "/updates/performance"
  },
  {
    id: "10",
    category: "Industry News",
    title: "Sustainable Construction Materials: 2025 Trends",
    description: "Eco-friendly building materials are gaining traction. Explore the latest in sustainable construction and how they impact project costs and timelines.",
    date: "Nov 15, 2025",
    readTime: "10 min read",
    image: "https://images.unsplash.com/photo-1578836537282-3171d77f8632?w=800&auto=format&fit=crop",
    badge: null,
    link: "/news/sustainable-materials"
  }
];

export default function NewsUpdates() {
  const [mode, setMode] = useState<"construction" | "refurbish">("construction");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const navigate = useNavigate();

  const filteredNews = selectedCategory === "All"
    ? newsItems
    : newsItems.filter(item => item.category === selectedCategory);

  const getBadgeColor = (badge: string | null) => {
    if (!badge) return "";
    switch (badge) {
      case "New":
        return "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]";
      case "Trending":
        return "bg-[#f3c5a8]/10 text-[#f3c5a8] border-[#f3c5a8]";
      case "Beta":
        return "bg-[#b8d4f1]/10 text-[#b8d4f1] border-[#b8d4f1]";
      case "Award":
      case "Milestone":
        return "bg-[#cfe0ad]/10 text-[#cfe0ad] border-[#cfe0ad]";
      case "Important":
        return "bg-[#f87171]/10 text-[#f87171] border-[#f87171]";
      default:
        return "bg-[#bdbdbd]/10 text-[#bdbdbd] border-[#bdbdbd]";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "App Updates":
        return <Sparkles size={20} className="text-[#cfe0ad]" />;
      case "Industry News":
        return <TrendingUp size={20} className="text-[#b8d4f1]" />;
      case "Company":
        return <Bell size={20} className="text-[#f3c5a8]" />;
      case "Tips & Tricks":
        return <Newspaper size={20} className="text-[#e8b3d4]" />;
      default:
        return <Newspaper size={20} className="text-[#bdbdbd]" />;
    }
  };

  const menuItems = [
    { label: "Your Subscription", path: "/subscription" },
    { label: "Hire a Contractor", path: "/hire-contractor" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "News & Updates", path: "/news-updates" },
    { label: "Visit Builtattic", path: "/visit-builtattic" },
    { label: "Settings", path: "/settings" }
  ];

  return (
    <PhoneShell>
      <Sheet>
        <div className="flex h-full flex-col">
          <header className="flex flex-wrap items-center gap-6 rounded-b-[60px] border-b border-[#1f1f1f] bg-[#050505] px-6 py-10 md:flex-nowrap md:px-10 lg:px-24 lg:py-16">
            <button onClick={() => navigate(-1)} className="text-white hover:text-[#cfe0ad]">
              <ArrowLeft size={24} />
            </button>

            <SheetTrigger asChild>
              <button type="button">
                <Avatar className="h-16 w-16 border-2 border-[#232323]">
                  <AvatarFallback>G</AvatarFallback>
                </Avatar>
              </button>
            </SheetTrigger>

            <div className="flex flex-col text-white">
              <span className="text-3xl font-semibold">Oh Hi, Guest!</span>
              <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">News & Updates</span>
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

          <div className="flex-1 overflow-y-auto px-6 pb-32 md:px-10 lg:px-24">
            <div className="mx-auto w-full max-w-6xl">
              <section className="mt-16">
                <div className="flex items-center gap-6">
                  <Newspaper size={64} className="text-[#cfe0ad]" strokeWidth={1.5} />
                  <div>
                    <h2 className="text-4xl font-bold tracking-tight text-white">Latest Updates</h2>
                    <p className="mt-2 text-xl text-[#bdbdbd]">
                      Stay informed with news, features, and industry insights
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-16">
                <h3 className="text-2xl font-semibold text-white">Filter by Category</h3>
                <div className="mt-6 flex flex-wrap gap-3">
                  {newsCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-full border px-6 py-3 text-lg font-semibold transition ${
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
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold text-white">
                    {filteredNews.length} {filteredNews.length === 1 ? "Article" : "Articles"}
                  </h3>
                </div>

                <div className="mt-8 space-y-8">
                  {filteredNews.map((news) => (
                    <Card
                      key={news.id}
                      className="overflow-hidden border border-[#2a2a2a] bg-[#101010] transition hover:border-[#cfe0ad]"
                    >
                      <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-[300px_1fr]">
                        <div className="relative overflow-hidden rounded-[24px]">
                          <div className="aspect-video w-full bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]">
                            <div className="flex h-full items-center justify-center">
                              {getCategoryIcon(news.category)}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-4 py-1 text-sm font-semibold text-white">
                              {getCategoryIcon(news.category)}
                              {news.category}
                            </span>
                            {news.badge && (
                              <span className={`rounded-full border px-4 py-1 text-sm font-semibold ${getBadgeColor(news.badge)}`}>
                                {news.badge}
                              </span>
                            )}
                          </div>

                          <h4 className="mt-4 text-2xl font-bold text-white">{news.title}</h4>
                          <p className="mt-3 text-lg leading-relaxed text-[#bdbdbd]">{news.description}</p>

                          <div className="mt-6 flex items-center justify-between">
                            <div className="flex items-center gap-6 text-base text-[#8a8a8a]">
                              <span>{news.date}</span>
                              <span>•</span>
                              <span>{news.readTime}</span>
                            </div>
                            <button
                              type="button"
                              className="flex items-center gap-2 rounded-full bg-[#cfe0ad] px-6 py-3 text-base font-semibold text-black transition hover:bg-[#d4e4b8]"
                            >
                              Read More
                              <ExternalLink size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {filteredNews.length === 0 && (
                  <div className="mt-16 text-center">
                    <p className="text-2xl text-[#bdbdbd]">No articles found in this category</p>
                    <button
                      onClick={() => setSelectedCategory("All")}
                      className="mt-6 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-8 py-4 text-xl font-semibold text-white transition hover:border-[#cfe0ad]"
                    >
                      View All Articles
                    </button>
                  </div>
                )}
              </section>

              <section className="mt-20">
                <Card className="border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                  <div className="flex items-center gap-6">
                    <Bell size={48} className="text-[#cfe0ad]" />
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold text-white">Never Miss an Update</h3>
                      <p className="mt-2 text-lg text-[#bdbdbd]">
                        Get notified about new features, tips, and industry news
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full bg-[#cfe0ad] px-8 py-4 text-lg font-semibold text-black transition hover:bg-[#d4e4b8]"
                    >
                      Enable Notifications
                    </button>
                  </div>
                </Card>
              </section>
            </div>
          </div>
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
  );
}
