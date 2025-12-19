import { motion } from "framer-motion";
import PageLayout from "@/components/page-layout";
import { FileUploader } from "@/components/file-uploader";
import { Card } from "@/components/ui/card";
import { FileText, FileCheck, Receipt, BadgeCheck, FileBarChart, Camera, File, Download } from "lucide-react";
import { useDocumentStore } from "@/store";
import { staggerContainer, listItem } from "@/lib/animations";
import { useProject } from "@/context/ProjectContext";

const folderIcons = {
  Plans: FileText,
  Contracts: FileCheck,
  Invoices: Receipt,
  Permits: BadgeCheck,
  Reports: FileBarChart,
  Photos: Camera
};

export default function Documents() {
  const { currentProject } = useProject();
  const folders = useDocumentStore((state) => state.folders);
  const documents = useDocumentStore((state) => state.documents);
  const selectedFolder = useDocumentStore((state) => state.selectedFolder);
  const setSelectedFolder = useDocumentStore((state) => state.setSelectedFolder);
  const totalSize = useDocumentStore((state) => state.getTotalSize());
  const recentDocuments = useDocumentStore((state) => state.getRecentDocuments());
  const uploadDocument = useDocumentStore((state) => state.uploadDocument);
  const docError = useDocumentStore((state) => state.error);

  const displayedDocuments = selectedFolder
    ? documents.filter(d => d.folder === selectedFolder)
    : recentDocuments;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <PageLayout title="Documents & Files">
      {/* Document Stats */}
      <section className="mt-4 xs:mt-6 sm:mt-10 md:mt-16">
        <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Document Overview</h2>
        {!currentProject && (
          <Card className="mt-4 border border-[#242424] bg-[#101010] p-4 text-sm xs:text-base text-[#bdbdbd]">
            Select or create a project to manage documents.
          </Card>
        )}
        {docError && (
          <Card className="mt-4 border border-red-500/40 bg-red-500/10 p-4 text-sm xs:text-base text-red-200">
            {docError}
          </Card>
        )}
        <motion.div
          className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 gap-3 xs:gap-4 sm:gap-6 sm:grid-cols-3"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={listItem}>
            <Card className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[30px] sm:rounded-[38px] md:rounded-[46px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-4 xs:p-6 sm:p-8 md:p-10">
              <File className="h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-[#cfe0ad]" strokeWidth={1.5} />
              <div className="mt-3 xs:mt-4 sm:mt-5 md:mt-6 text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black text-white">{documents.length}</div>
              <p className="mt-1 xs:mt-2 text-sm xs:text-base sm:text-lg md:text-xl text-[#b9b9b9]">Total Documents</p>
            </Card>
          </motion.div>

          <motion.div variants={listItem}>
            <Card className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[30px] sm:rounded-[38px] md:rounded-[46px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-4 xs:p-6 sm:p-8 md:p-10">
              <div className="text-[0.55rem] xs:text-[0.6rem] sm:text-xs md:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] sm:tracking-[0.4em] text-[#bdbdbd]">Storage</div>
              <div className="mt-2 xs:mt-3 sm:mt-4 text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black text-[#b8d4f1]">{(totalSize / (1024 * 1024)).toFixed(0)} MB</div>
              <p className="mt-1 xs:mt-2 text-xs xs:text-sm sm:text-base md:text-lg text-[#b9b9b9]">Used</p>
            </Card>
          </motion.div>

          <motion.div variants={listItem}>
            <Card className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[30px] sm:rounded-[38px] md:rounded-[46px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-4 xs:p-6 sm:p-8 md:p-10">
              <Camera className="h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-[#f3c5a8]" strokeWidth={1.5} />
              <div className="mt-3 xs:mt-4 sm:mt-5 md:mt-6 text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black text-white">{folders.length}</div>
              <p className="mt-1 xs:mt-2 text-sm xs:text-base sm:text-lg md:text-xl text-[#b9b9b9]">Folders</p>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Folders */}
      <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-20">
        <div className="flex items-center justify-between">
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Folders</h2>
          {selectedFolder && (
            <button
              onClick={() => setSelectedFolder(null)}
              className="text-sm xs:text-base sm:text-lg text-[#cfe0ad] hover:underline touch-target focus-ring"
            >
              ← Back to all folders
            </button>
          )}
        </div>
        <motion.div
          className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 grid grid-cols-2 gap-3 xs:gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {folders.map((folder) => {
            const Icon = folderIcons[folder.name as keyof typeof folderIcons] || File;
            return (
              <motion.div key={folder.id} variants={listItem}>
                <button
                  onClick={() => setSelectedFolder(folder.name)}
                  className="w-full touch-target focus-ring rounded-[20px] xs:rounded-[28px] sm:rounded-[34px]"
                >
                  <Card className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[28px] sm:rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-4 xs:p-6 sm:p-8 transition hover:border-[#cfe0ad] hover:scale-[1.02]">
                    <Icon className="h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 text-[#cfe0ad]" strokeWidth={1.5} />
                    <h3 className="mt-2 xs:mt-3 sm:mt-4 text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-white">{folder.name}</h3>
                    <p className="mt-1 xs:mt-2 text-[0.65rem] xs:text-xs sm:text-sm text-[#8a8a8a]">{folder.documentCount} files</p>
                  </Card>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Documents List */}
      <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-20">
        <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">
          {selectedFolder ? `${selectedFolder} Files` : 'Recent Documents'}
        </h2>
        <motion.div
          className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 space-y-3 xs:space-y-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {displayedDocuments.map((doc) => (
            <motion.div key={doc.id} variants={listItem}>
              <Card className="border border-[#2a2a2a] bg-[#101010] p-3 xs:p-4 sm:p-6 md:p-8 transition hover:border-[#3a3a3a]">
                <div className="flex items-center justify-between gap-3 xs:gap-4">
                  <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="flex h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg bg-[#cfe0ad]/10 shrink-0">
                      <File className="h-5 w-5 xs:h-6 xs:w-6 text-[#cfe0ad]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-white truncate">{doc.name}</h3>
                      <div className="mt-0.5 xs:mt-1 flex flex-wrap items-center gap-1 xs:gap-2 sm:gap-4 text-[0.6rem] xs:text-xs sm:text-sm text-[#8a8a8a]">
                        <span>{doc.folder}</span>
                        <span className="hidden xs:inline">•</span>
                        <span>{formatFileSize(doc.size)}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">{doc.uploadDate}</span>
                      </div>
                    </div>
                  </div>
                  <button className="flex h-10 w-10 xs:h-12 xs:w-12 items-center justify-center rounded-lg border border-[#2a2a2a] hover:border-[#cfe0ad] transition shrink-0 touch-target focus-ring">
                    <Download className="h-4 w-4 xs:h-5 xs:w-5 text-white" />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Upload Section */}
      <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-20">
        <button
          type="button"
          className="flex h-[100px] xs:h-[120px] sm:h-[150px] md:h-[180px] lg:h-[200px] w-full items-center justify-center rounded-[20px] xs:rounded-[30px] sm:rounded-[40px] md:rounded-[50px] border-2 border-dashed border-[#2a2a2a] bg-[#111] text-base xs:text-lg sm:text-xl md:text-2xl text-white transition hover:border-[#3a3a3a] touch-target focus-ring"
          onClick={() => setSelectedFolder(null)}
        >
          <span className="flex items-center gap-2 xs:gap-3 sm:gap-4">
            <span className="flex h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-full border border-[#3a3a3a] text-2xl xs:text-3xl sm:text-4xl">+</span>
            <span className="hidden xs:inline">Upload New Document</span>
            <span className="xs:hidden">Upload</span>
          </span>
        </button>
        {currentProject && (
          <div className="mt-4 xs:mt-6">
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
          </div>
        )}
      </section>
    </PageLayout>
  );
}
