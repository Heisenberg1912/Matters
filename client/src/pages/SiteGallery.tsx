import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/bottom-nav";
import { FileUploader } from "@/components/file-uploader";
import PhoneShell from "@/components/phone-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Calendar, Camera, Download, Share2 } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useSwipe } from "@/hooks/use-swipe";

const loadAsset = (path: string) => {
  try {
    return new URL(path, import.meta.url).href;
  } catch {
    return undefined;
  }
};

const placeholderImg = loadAsset("../assets/placeholders/resource-1.jpg");

const galleryCategories = ["All", "Foundation", "Structure", "Electrical", "Plumbing", "Finishing"];

const galleryItems = [
  {
    id: "1",
    title: "Foundation Excavation Complete",
    category: "Foundation",
    date: "Dec 5, 2025",
    uploadedBy: "Rajesh Kumar",
    description: "Foundation pit excavation completed to designed depth",
    image: placeholderImg
  },
  {
    id: "2",
    title: "Steel Reinforcement Layout",
    category: "Foundation",
    date: "Dec 8, 2025",
    uploadedBy: "Rajesh Kumar",
    description: "Rebar placement for foundation slab as per structural drawings",
    image: placeholderImg
  },
  {
    id: "3",
    title: "Foundation Concrete Pouring",
    category: "Foundation",
    date: "Dec 10, 2025",
    uploadedBy: "Rajesh Kumar",
    description: "M25 grade concrete poured for foundation",
    image: placeholderImg
  },
  {
    id: "4",
    title: "Ground Floor Column Formwork",
    category: "Structure",
    date: "Dec 12, 2025",
    uploadedBy: "Suresh Verma",
    description: "Column formwork erected and aligned",
    image: placeholderImg
  },
  {
    id: "5",
    title: "Electrical Conduit Installation",
    category: "Electrical",
    date: "Dec 14, 2025",
    uploadedBy: "Amit Sharma",
    description: "PVC conduits laid for ground floor wiring",
    image: placeholderImg
  },
  {
    id: "6",
    title: "Plumbing Rough-in",
    category: "Plumbing",
    date: "Dec 15, 2025",
    uploadedBy: "Vikram Patel",
    description: "Water supply and drainage pipes installed",
    image: placeholderImg
  },
  {
    id: "7",
    title: "First Floor Slab Casting",
    category: "Structure",
    date: "Dec 16, 2025",
    uploadedBy: "Rajesh Kumar",
    description: "First floor slab concrete work in progress",
    image: placeholderImg
  },
  {
    id: "8",
    title: "Brickwork Progress",
    category: "Structure",
    date: "Dec 17, 2025",
    uploadedBy: "Rajesh Kumar",
    description: "External wall brickwork up to lintel level",
    image: placeholderImg
  },
  {
    id: "9",
    title: "Electrical Panel Installation",
    category: "Electrical",
    date: "Dec 17, 2025",
    uploadedBy: "Amit Sharma",
    description: "Main distribution board mounted",
    image: placeholderImg
  }
];

export default function SiteGallery() {
  const [mode, setMode] = useState<"construction" | "refurbish">("construction");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<typeof galleryItems[0] | null>(null);
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const menuItems = [
    { label: "Your Subscription", path: "/subscription" },
    { label: "Hire a Contractor", path: "/hire-contractor" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "News & Updates", path: "/news-updates" },
    { label: "Visit Builtattic", path: "/visit-builtattic" },
    { label: "Settings", path: "/settings" }
  ];

  const { bind: detailSwipe } = useSwipe({
    onSwipedDown: () => setSelectedImage(null)
  });

  const filteredItems = selectedCategory === "All"
    ? galleryItems
    : galleryItems.filter(item => item.category === selectedCategory);

  return (
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
              <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">Site Gallery</span>
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
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-bold tracking-tight text-white">Progress Gallery</h2>
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-8 py-4 text-xl font-semibold text-white transition hover:border-[#cfe0ad] hover:bg-[#cfe0ad] hover:text-black"
                  >
                    <Camera size={24} />
                    Upload Photo
                  </button>
                </div>
                <div className="mt-6">
                  <FileUploader
                    accept={["image/*"]}
                    captureCamera
                    maxSize={8 * 1024 * 1024}
                    helperText="Use your camera or library to add site photos"
                    onUpload={(files) =>
                      showToast({ type: "success", message: "Photos uploaded", description: `${files.length} added` })
                    }
                  />
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  {galleryCategories.map((category) => (
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
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.map((item) => (
                    <Card
                      key={item.id}
                      className="group cursor-pointer overflow-hidden rounded-[34px] border border-[#2a2a2a] bg-[#101010] transition hover:border-[#cfe0ad]"
                      onClick={() => setSelectedImage(item)}
                    >
                      <div className="relative h-[320px] overflow-hidden bg-[#1b1b1b]">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Camera size={64} className="text-[#3a3a3a]" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition group-hover:opacity-100" />
                      </div>
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                          <span className="rounded-full bg-[#cfe0ad]/10 px-3 py-1 text-sm font-semibold text-[#cfe0ad]">
                            {item.category}
                          </span>
                        </div>
                        <p className="mt-2 text-base text-[#bdbdbd]">{item.description}</p>
                        <div className="mt-4 flex items-center gap-2 text-sm text-[#8a8a8a]">
                          <Calendar size={16} />
                          <span>{item.date}</span>
                          <span>•</span>
                          <span>{item.uploadedBy}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>

              {selectedImage && (
                <section className="mt-20">
                  <h2 className="text-4xl font-bold tracking-tight text-white">Image Details</h2>
                  <Card className="mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                      <div className="overflow-hidden rounded-[34px] border border-[#2a2a2a]" {...detailSwipe()}>
                        {selectedImage.image ? (
                          <img
                            src={selectedImage.image}
                            alt={selectedImage.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-[500px] items-center justify-center bg-[#1b1b1b]">
                            <Camera size={80} className="text-[#3a3a3a]" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-3xl font-bold text-white">{selectedImage.title}</h3>
                        <p className="mt-4 text-xl text-[#bdbdbd]">{selectedImage.description}</p>

                        <div className="mt-8 space-y-4">
                          <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Category</p>
                            <p className="mt-1 text-2xl font-semibold text-white">{selectedImage.category}</p>
                          </div>
                          <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Date Uploaded</p>
                            <p className="mt-1 text-2xl font-semibold text-white">{selectedImage.date}</p>
                          </div>
                          <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Uploaded By</p>
                            <p className="mt-1 text-2xl font-semibold text-white">{selectedImage.uploadedBy}</p>
                          </div>
                        </div>

                        <div className="mt-auto flex gap-4">
                          <button
                            type="button"
                            className="flex flex-1 items-center justify-center gap-3 rounded-full bg-[#cfe0ad] py-5 text-xl font-semibold text-black transition hover:bg-[#d4e4b8]"
                          >
                            <Download size={24} />
                            Download
                          </button>
                          <button
                            type="button"
                            className="flex flex-1 items-center justify-center gap-3 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] py-5 text-xl font-semibold text-white transition hover:border-[#3a3a3a]"
                          >
                            <Share2 size={24} />
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </section>
              )}

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Statistics</h2>
                <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
                  <Card className="flex flex-col items-center justify-center rounded-[34px] border border-[#242424] bg-[#101010] p-8">
                    <div className="text-6xl font-black text-[#cfe0ad]">{galleryItems.length}</div>
                    <p className="mt-2 text-xl text-[#b9b9b9]">Total Photos</p>
                  </Card>
                  <Card className="flex flex-col items-center justify-center rounded-[34px] border border-[#242424] bg-[#101010] p-8">
                    <div className="text-6xl font-black text-[#cfe0ad]">{galleryCategories.length - 1}</div>
                    <p className="mt-2 text-xl text-[#b9b9b9]">Categories</p>
                  </Card>
                  <Card className="flex flex-col items-center justify-center rounded-[34px] border border-[#242424] bg-[#101010] p-8">
                    <div className="text-6xl font-black text-[#cfe0ad]">4</div>
                    <p className="mt-2 text-xl text-[#b9b9b9]">Contributors</p>
                  </Card>
                  <Card className="flex flex-col items-center justify-center rounded-[34px] border border-[#242424] bg-[#101010] p-8">
                    <div className="text-6xl font-black text-[#cfe0ad]">13</div>
                    <p className="mt-2 text-xl text-[#b9b9b9]">Days Active</p>
                  </Card>
                </div>
              </section>
            </div>
          </div>

          <BottomNav />
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
