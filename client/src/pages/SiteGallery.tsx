import { useMemo, useState } from "react";
import PageLayout from "@/components/page-layout";
import { FileUploader } from "@/components/file-uploader";
import { Card } from "@/components/ui/card";
import { Calendar, Camera, Download, Share2 } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useSwipe } from "@/hooks/use-swipe";
import { useUploadsStore } from "@/store";
import { useProject } from "@/context/ProjectContext";
import { cn } from "@/lib/utils";

export default function SiteGallery() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const { showToast } = useNotifications();
  const { currentProject } = useProject();
  const uploads = useUploadsStore((state) => state.uploads);
  const uploadFile = useUploadsStore((state) => state.uploadFile);
  const uploadsError = useUploadsStore((state) => state.error);

  const { bind: detailSwipe } = useSwipe({
    onSwipedDown: () => setSelectedImageId(null)
  });

  const imageUploads = useMemo(() => uploads.filter((upload) => upload.type === "image"), [uploads]);
  const galleryCategories = useMemo(() => {
    const categories = new Set(
      imageUploads.map((upload) => upload.category || "General")
    );
    return ["All", ...Array.from(categories)];
  }, [imageUploads]);

  const galleryItems = useMemo(
    () =>
      imageUploads.map((upload) => ({
        id: upload._id,
        title: upload.originalName || upload.filename,
        category: upload.category || "General",
        date: new Date(upload.createdAt).toLocaleDateString(),
        uploadedBy: upload.uploadedBy?.name || "Team member",
        description: upload.description || "Site update photo",
        image: upload.storage?.url || "",
      })),
    [imageUploads]
  );

  const filteredItems =
    selectedCategory === "All"
      ? galleryItems
      : galleryItems.filter((item) => item.category === selectedCategory);

  const selectedImage = filteredItems.find((item) => item.id === selectedImageId) || null;

  return (
    <PageLayout title="Site Gallery">
      <section className="mt-4 xs:mt-6 sm:mt-10 md:mt-16">
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4">
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Progress Gallery</h2>
          <button
            type="button"
            className="flex items-center gap-2 xs:gap-3 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-4 xs:px-6 sm:px-8 py-2 xs:py-3 sm:py-4 text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-white transition hover:border-[#cfe0ad] hover:bg-[#cfe0ad] hover:text-black touch-target focus-ring"
          >
            <Camera className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
            <span className="hidden xs:inline">Upload Photo</span>
            <span className="xs:hidden">Upload</span>
          </button>
        </div>
        {!currentProject && (
          <Card className="mt-4 border border-[#242424] bg-[#101010] p-4 text-sm xs:text-base text-[#bdbdbd]">
            Select or create a project to upload site photos.
          </Card>
        )}
        {uploadsError && (
          <Card className="mt-4 border border-red-500/40 bg-red-500/10 p-4 text-sm xs:text-base text-red-200">
            {uploadsError}
          </Card>
        )}
        <div className="mt-4 xs:mt-6">
          <FileUploader
            accept={["image/*"]}
            captureCamera
            maxSize={8 * 1024 * 1024}
            helperText="Use your camera or library to add site photos"
            onUpload={async (files) => {
              if (!currentProject) return;
              await Promise.all(
                files.map((file) =>
                  uploadFile(currentProject._id, file, { category: selectedCategory === "All" ? "General" : selectedCategory })
                )
              );
              showToast({ type: "success", message: "Photos uploaded", description: `${files.length} added` });
            }}
          />
        </div>

        {/* Category Filters - Horizontal Scroll on Mobile */}
        <div className="mt-4 xs:mt-6 sm:mt-8 scroll-x-container xs:flex-wrap xs:gap-3 sm:gap-4">
          {galleryCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "rounded-full border px-4 xs:px-6 sm:px-8 py-2 xs:py-2.5 sm:py-3",
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

      {/* Gallery Grid */}
      <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-16">
        <div className="grid grid-cols-1 gap-3 xs:gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="group cursor-pointer overflow-hidden rounded-[20px] xs:rounded-[28px] sm:rounded-[34px] border border-[#2a2a2a] bg-[#101010] transition hover:border-[#cfe0ad]"
              onClick={() => setSelectedImageId(item.id)}
            >
              <div className="relative h-[200px] xs:h-[240px] sm:h-[280px] md:h-[320px] overflow-hidden bg-[#1b1b1b]">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Camera className="h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 text-[#3a3a3a]" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition group-hover:opacity-100" />
              </div>
              <div className="p-3 xs:p-4 sm:p-6">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-white truncate">{item.title}</h3>
                  <span className="rounded-full bg-[#cfe0ad]/10 px-2 xs:px-3 py-0.5 xs:py-1 text-[0.6rem] xs:text-xs sm:text-sm font-semibold text-[#cfe0ad] shrink-0">
                    {item.category}
                  </span>
                </div>
                <p className="mt-1 xs:mt-2 text-xs xs:text-sm sm:text-base text-[#bdbdbd] line-clamp-2">{item.description}</p>
                <div className="mt-2 xs:mt-3 sm:mt-4 flex items-center gap-1 xs:gap-2 text-[0.6rem] xs:text-xs sm:text-sm text-[#8a8a8a]">
                  <Calendar className="h-3 w-3 xs:h-4 xs:w-4" />
                  <span>{item.date}</span>
                  <span>•</span>
                  <span className="truncate">{item.uploadedBy}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Selected Image Details */}
      {selectedImage && (
        <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-20">
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Image Details</h2>
          <Card className="mt-4 xs:mt-6 sm:mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-4 xs:p-6 sm:p-8 md:p-10">
            <div className="grid grid-cols-1 gap-4 xs:gap-6 sm:gap-8 md:gap-10 lg:grid-cols-2">
              <div className="overflow-hidden rounded-[20px] xs:rounded-[28px] sm:rounded-[34px] border border-[#2a2a2a]" {...detailSwipe()}>
                {selectedImage.image ? (
                  <img
                    src={selectedImage.image}
                    alt={selectedImage.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[300px] xs:h-[400px] sm:h-[500px] items-center justify-center bg-[#1b1b1b]">
                    <Camera className="h-16 w-16 xs:h-20 xs:w-20 text-[#3a3a3a]" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl xs:text-2xl sm:text-3xl font-bold text-white">{selectedImage.title}</h3>
                <p className="mt-2 xs:mt-3 sm:mt-4 text-sm xs:text-base sm:text-lg md:text-xl text-[#bdbdbd]">{selectedImage.description}</p>

                <div className="mt-4 xs:mt-6 sm:mt-8 space-y-3 xs:space-y-4">
                  <div>
                    <p className="text-[0.6rem] xs:text-xs sm:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Category</p>
                    <p className="mt-0.5 xs:mt-1 text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-white">{selectedImage.category}</p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] xs:text-xs sm:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Date Uploaded</p>
                    <p className="mt-0.5 xs:mt-1 text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-white">{selectedImage.date}</p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] xs:text-xs sm:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Uploaded By</p>
                    <p className="mt-0.5 xs:mt-1 text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-white">{selectedImage.uploadedBy}</p>
                  </div>
                </div>

                <div className="mt-auto pt-4 xs:pt-6 flex flex-col xs:flex-row gap-2 xs:gap-3 sm:gap-4">
                  <button
                    type="button"
                    className="flex flex-1 items-center justify-center gap-2 xs:gap-3 rounded-full bg-[#cfe0ad] py-3 xs:py-4 sm:py-5 text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-black transition hover:bg-[#d4e4b8] touch-target focus-ring"
                  >
                    <Download className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
                    Download
                  </button>
                  <button
                    type="button"
                    className="flex flex-1 items-center justify-center gap-2 xs:gap-3 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] py-3 xs:py-4 sm:py-5 text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-white transition hover:border-[#3a3a3a] touch-target focus-ring"
                  >
                    <Share2 className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Statistics */}
      <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-20">
        <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Statistics</h2>
        <div className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 grid grid-cols-2 gap-3 xs:gap-4 sm:gap-6 sm:grid-cols-4">
          <Card className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[28px] sm:rounded-[34px] border border-[#242424] bg-[#101010] p-4 xs:p-6 sm:p-8">
            <div className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black text-[#cfe0ad]">{galleryItems.length}</div>
            <p className="mt-1 xs:mt-2 text-xs xs:text-sm sm:text-base md:text-xl text-[#b9b9b9]">Total Photos</p>
          </Card>
          <Card className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[28px] sm:rounded-[34px] border border-[#242424] bg-[#101010] p-4 xs:p-6 sm:p-8">
            <div className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black text-[#cfe0ad]">{galleryCategories.length - 1}</div>
            <p className="mt-1 xs:mt-2 text-xs xs:text-sm sm:text-base md:text-xl text-[#b9b9b9]">Categories</p>
          </Card>
          <Card className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[28px] sm:rounded-[34px] border border-[#242424] bg-[#101010] p-4 xs:p-6 sm:p-8">
            <div className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black text-[#cfe0ad]">4</div>
            <p className="mt-1 xs:mt-2 text-xs xs:text-sm sm:text-base md:text-xl text-[#b9b9b9]">Contributors</p>
          </Card>
          <Card className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[28px] sm:rounded-[34px] border border-[#242424] bg-[#101010] p-4 xs:p-6 sm:p-8">
            <div className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black text-[#cfe0ad]">13</div>
            <p className="mt-1 xs:mt-2 text-xs xs:text-sm sm:text-base md:text-xl text-[#b9b9b9]">Days Active</p>
          </Card>
        </div>
      </section>
    </PageLayout>
  );
}
