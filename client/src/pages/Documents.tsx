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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Documents & Files</h1>
            <p className="text-gray-400 mt-1">Manage your project documents and files</p>
            {currentProject && (
              <p className="text-sm text-blue-400 mt-2">
                Project: <span className="font-semibold">{currentProject.name}</span>
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert Messages */}
        {!currentProject && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="p-4 bg-blue-500/10 border-blue-500/20">
              <p className="text-blue-300">Select or create a project to manage documents.</p>
            </Card>
          </motion.div>
        )}
        {docError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="p-4 bg-red-500/10 border-red-500/20">
              <p className="text-red-300">{docError}</p>
            </Card>
          </motion.div>
        )}

        {/* Document Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <Card className="p-5 bg-gray-800/50 border-gray-700 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-medium">Total Documents</p>
                <p className="text-2xl font-bold text-white mt-1">{documents.length}</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <File className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gray-800/50 border-gray-700 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-medium">Storage Used</p>
                <p className="text-2xl font-bold text-white mt-1">{(totalSize / (1024 * 1024)).toFixed(0)} MB</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gray-800/50 border-gray-700 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-medium">Folders</p>
                <p className="text-2xl font-bold text-white mt-1">{folders.length}</p>
              </div>
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <Camera className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Folders */}
        <section ref={uploadRef} className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Folders</h2>
            {selectedFolder && (
              <Button
                variant="outline"
                onClick={() => setSelectedFolder(null)}
                className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                ← Back to all folders
              </Button>
            )}
          </div>
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {folders.map((folder) => {
              const Icon = folderIcons[folder.name as keyof typeof folderIcons] || File;
              return (
                <motion.div key={folder.id} variants={listItem}>
                  <Card
                    className="cursor-pointer bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 hover:border-blue-500 transition-all"
                    onClick={() => setSelectedFolder(folder.name)}
                  >
                    <div className="p-6 flex flex-col items-center text-center">
                      <div className="bg-blue-500/20 p-4 rounded-lg mb-4">
                        <Icon className="h-8 w-8 text-blue-400" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">{folder.name}</h3>
                      <p className="text-sm text-gray-400">{folder.documentCount} files</p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Documents List */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            {selectedFolder ? `${selectedFolder} Files` : 'Recent Documents'}
          </h2>
          {displayedDocuments.length === 0 ? (
            <Card className="p-8 text-center bg-gray-800/50 border-gray-700">
              <File className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Documents Yet</h3>
              <p className="text-gray-400">Upload your first document to get started</p>
            </Card>
          ) : (
            <motion.div
              className="space-y-4"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {displayedDocuments.map((doc) => (
                <motion.div key={doc.id} variants={listItem}>
                  <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 hover:border-gray-600 transition-all">
                    <div className="p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="bg-blue-500/20 p-3 rounded-lg shrink-0">
                            <File className="h-6 w-6 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white truncate">{doc.name}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-400">
                              <span className="px-2 py-1 bg-gray-700/50 rounded-full text-xs">{doc.folder}</span>
                              <span>•</span>
                              <span>{formatFileSize(doc.size)}</span>
                              <span>•</span>
                              <span>{doc.uploadDate}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          <Download className="h-4 w-4" />
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
          <h2 className="text-2xl font-bold text-white mb-6">Upload Documents</h2>
          {currentProject ? (
            <Card className="p-8 bg-gray-800/50 border-gray-700">
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
            <Card className="p-8 text-center bg-blue-500/10 border-blue-500/20">
              <File className="w-16 h-16 mx-auto text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a Project</h3>
              <p className="text-gray-400">Choose or create a project to start uploading documents</p>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
