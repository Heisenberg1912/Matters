import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { FileUploader } from "@/components/file-uploader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileCheck, Receipt, BadgeCheck, FileBarChart, Camera, File, Download } from "lucide-react";
import { useDocumentStore } from "@/store";
import { staggerContainer, listItem } from "@/lib/animations";
import { useProject } from "@/context/ProjectContext";
import { useNotifications } from "@/hooks/use-notifications";

const folderIcons = {
  Plans: FileText,
  Contracts: FileCheck,
  Invoices: Receipt,
  Permits: BadgeCheck,
  Reports: FileBarChart,
  Photos: Camera
};

export default function Documents() {
  const uploadRef = useRef<HTMLDivElement | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentProject } = useProject();
  const { showToast } = useNotifications();
  const folders = useDocumentStore((state) => state.folders);
  const documents = useDocumentStore((state) => state.documents);
  const selectedFolder = useDocumentStore((state) => state.selectedFolder);
  const setSelectedFolder = useDocumentStore((state) => state.setSelectedFolder);
  const uploadDocument = useDocumentStore((state) => state.uploadDocument);
  const docError = useDocumentStore((state) => state.error);

  // Compute derived values directly from documents to avoid infinite loops
  const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
  const recentDocuments = [...documents]
    .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate))
    .slice(0, 5);

  useEffect(() => {
    if (searchParams.get("quickAdd") !== "document") return;
    setSelectedFolder(null);
    if (!currentProject) {
      showToast({ type: "warning", message: "Select a project first" });
    } else {
      requestAnimationFrame(() => {
        uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    const next = new URLSearchParams(searchParams);
    next.delete("quickAdd");
    setSearchParams(next, { replace: true });
  }, [currentProject, searchParams, setSearchParams, setSelectedFolder, showToast]);

  const displayedDocuments = selectedFolder
    ? documents.filter(d => d.folder === selectedFolder)
    : recentDocuments;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-[100dvh] bg-[#010101] pb-24 xs:pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a0a0a] border-b border-[#1f1f1f] sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-5 sm:py-6">
          <div>
            <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-white">Documents & Files</h1>
            <p className="text-xs xs:text-sm sm:text-base text-neutral-400 mt-0.5 xs:mt-1">Manage your project documents and files</p>
            {currentProject && (
              <p className="text-xs xs:text-sm text-[#cfe0ad] mt-1.5 xs:mt-2">
                Project: <span className="font-semibold">{currentProject.name}</span>
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-6 sm:py-8">
        {/* Alert Messages */}
        {!currentProject && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 xs:mb-6"
          >
            <Card className="p-3 xs:p-4 bg-[#cfe0ad]/10 border-[#cfe0ad]/20">
              <p className="text-xs xs:text-sm sm:text-base text-[#cfe0ad]">Select or create a project to manage documents.</p>
            </Card>
          </motion.div>
        )}
        {docError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 xs:mb-6"
          >
            <Card className="p-3 xs:p-4 bg-red-500/10 border-red-500/20">
              <p className="text-xs xs:text-sm sm:text-base text-red-300">{docError}</p>
            </Card>
          </motion.div>
        )}

        {/* Document Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 xs:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 mb-4 xs:mb-6 sm:mb-8"
        >
          <Card className="p-3 xs:p-4 sm:p-5 bg-[#101010] border-[#1f1f1f] border-l-4 border-l-[#cfe0ad]">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[0.65rem] xs:text-xs sm:text-sm text-neutral-400 font-medium">Total Documents</p>
                <p className="text-xl xs:text-2xl font-bold text-white mt-0.5 xs:mt-1">{documents.length}</p>
              </div>
              <div className="bg-[#cfe0ad]/20 p-2 xs:p-3 rounded-lg shrink-0">
                <File className="w-5 h-5 xs:w-6 xs:h-6 text-[#cfe0ad]" />
              </div>
            </div>
          </Card>

          <Card className="p-3 xs:p-4 sm:p-5 bg-[#101010] border-[#1f1f1f] border-l-4 border-l-green-500">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[0.65rem] xs:text-xs sm:text-sm text-neutral-400 font-medium">Storage Used</p>
                <p className="text-xl xs:text-2xl font-bold text-white mt-0.5 xs:mt-1">{(totalSize / (1024 * 1024)).toFixed(0)} MB</p>
              </div>
              <div className="bg-green-500/20 p-2 xs:p-3 rounded-lg shrink-0">
                <FileText className="w-5 h-5 xs:w-6 xs:h-6 text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-3 xs:p-4 sm:p-5 bg-[#101010] border-[#1f1f1f] border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[0.65rem] xs:text-xs sm:text-sm text-neutral-400 font-medium">Folders</p>
                <p className="text-xl xs:text-2xl font-bold text-white mt-0.5 xs:mt-1">{folders.length}</p>
              </div>
              <div className="bg-purple-500/20 p-2 xs:p-3 rounded-lg shrink-0">
                <Camera className="w-5 h-5 xs:w-6 xs:h-6 text-purple-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Folders */}
        <section ref={uploadRef} className="mb-4 xs:mb-6 sm:mb-8">
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-4 mb-4 xs:mb-6">
            <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-white">Folders</h2>
            {selectedFolder && (
              <Button
                variant="outline"
                onClick={() => setSelectedFolder(null)}
                className="flex items-center gap-1.5 xs:gap-2 border-[#2a2a2a] text-neutral-300 hover:bg-[#1a1a1a] hover:text-white text-xs xs:text-sm"
              >
                ← Back to all folders
              </Button>
            )}
          </div>
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {folders.map((folder) => {
              const Icon = folderIcons[folder.name as keyof typeof folderIcons] || File;
              return (
                <motion.div key={folder.id} variants={listItem}>
                  <Card
                    className="cursor-pointer bg-[#101010] border-[#1f1f1f] hover:bg-[#151515] hover:border-[#cfe0ad] transition-all"
                    onClick={() => setSelectedFolder(folder.name)}
                  >
                    <div className="p-3 xs:p-4 sm:p-6 flex flex-col items-center text-center">
                      <div className="bg-[#cfe0ad]/20 p-2 xs:p-3 sm:p-4 rounded-lg mb-2 xs:mb-3 sm:mb-4">
                        <Icon className="h-5 w-5 xs:h-6 xs:w-6 sm:h-8 sm:w-8 text-[#cfe0ad]" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-white mb-0.5 xs:mb-1">{folder.name}</h3>
                      <p className="text-xs xs:text-sm text-neutral-400">{folder.documentCount} files</p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Documents List */}
        <section className="mb-4 xs:mb-6 sm:mb-8">
          <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 xs:mb-6">
            {selectedFolder ? `${selectedFolder} Files` : 'Recent Documents'}
          </h2>
          {displayedDocuments.length === 0 ? (
            <Card className="p-6 xs:p-8 text-center bg-[#101010] border-[#1f1f1f]">
              <File className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 mx-auto text-neutral-600 mb-3 xs:mb-4" />
              <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-white mb-1 xs:mb-2">No Documents Yet</h3>
              <p className="text-xs xs:text-sm sm:text-base text-neutral-400">Upload your first document to get started</p>
            </Card>
          ) : (
            <motion.div
              className="space-y-2 xs:space-y-3 sm:space-y-4"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {displayedDocuments.map((doc) => (
                <motion.div key={doc.id} variants={listItem}>
                  <Card className="bg-[#101010] border-[#1f1f1f] hover:bg-[#151515] hover:border-[#2a2a2a] transition-all">
                    <div className="p-3 xs:p-4 sm:p-6">
                      <div className="flex items-center justify-between gap-2 xs:gap-4">
                        <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="bg-[#cfe0ad]/20 p-2 xs:p-3 rounded-lg shrink-0">
                            <File className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-[#cfe0ad]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-white truncate">{doc.name}</h3>
                            <div className="mt-0.5 xs:mt-1 flex flex-wrap items-center gap-1 xs:gap-2 text-[0.6rem] xs:text-xs sm:text-sm text-neutral-400">
                              <span className="px-1.5 xs:px-2 py-0.5 xs:py-1 bg-[#1a1a1a] rounded-full">{doc.folder}</span>
                              <span className="hidden xs:inline">•</span>
                              <span>{formatFileSize(doc.size)}</span>
                              <span className="hidden xs:inline">•</span>
                              <span className="hidden xs:inline">{doc.uploadDate}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 border-[#2a2a2a] text-neutral-300 hover:bg-[#1a1a1a] hover:text-white p-2 min-w-[36px]"
                        >
                          <Download className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* Upload Section */}
        <section>
          <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 xs:mb-6">Upload Documents</h2>
          {currentProject ? (
            <Card className="p-4 xs:p-6 sm:p-8 bg-[#101010] border-[#1f1f1f]">
              <FileUploader
                accept={[
                  "application/pdf",
                  "image/*",
                  "application/vnd.ms-excel",
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                ]}
                maxSize={15 * 1024 * 1024}
                helperText="Upload plans, reports, or invoices (max 15MB)"
                onUpload={async (files) => {
                  const folder = selectedFolder || "Documents";
                  await Promise.all(
                    files.map((file) => uploadDocument(currentProject._id, file, folder))
                  );
                }}
              />
            </Card>
          ) : (
            <Card className="p-6 xs:p-8 text-center bg-[#cfe0ad]/10 border-[#cfe0ad]/20">
              <File className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 mx-auto text-[#cfe0ad] mb-3 xs:mb-4" />
              <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-white mb-1 xs:mb-2">Select a Project</h3>
              <p className="text-xs xs:text-sm sm:text-base text-neutral-400">Choose or create a project to start uploading documents</p>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
