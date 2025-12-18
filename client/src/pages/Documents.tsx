import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BottomNav from "@/components/bottom-nav";
import PhoneShell from "@/components/phone-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AnimatedPage } from "@/components/AnimatedPage";
import { FileText, FileCheck, Receipt, BadgeCheck, FileBarChart, Camera, File, Download } from "lucide-react";
import { useProjectStore, useDocumentStore } from "@/store";
import { staggerContainer, listItem } from "@/lib/animations";
import { useState } from "react";

const folderIcons = {
  Plans: FileText,
  Contracts: FileCheck,
  Invoices: Receipt,
  Permits: BadgeCheck,
  Reports: FileBarChart,
  Photos: Camera
};

export default function Documents() {
  const navigate = useNavigate();
  const mode = useProjectStore((state) => state.mode);
  const setMode = useProjectStore((state) => state.setMode);
  const folders = useDocumentStore((state) => state.folders);
  const documents = useDocumentStore((state) => state.documents);
  const selectedFolder = useDocumentStore((state) => state.selectedFolder);
  const setSelectedFolder = useDocumentStore((state) => state.setSelectedFolder);
  const totalSize = useDocumentStore((state) => state.getTotalSize());
  const recentDocuments = useDocumentStore((state) => state.getRecentDocuments());

  const menuItems = [
    { label: "Your Subscription", path: "/subscription" },
    { label: "Hire a Contractor", path: "/hire-contractor" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "News & Updates", path: "/news-updates" },
    { label: "Visit Builtattic", path: "/visit-builtattic" },
    { label: "Settings", path: "/settings" }
  ];

  const displayedDocuments = selectedFolder
    ? documents.filter(d => d.folder === selectedFolder)
    : recentDocuments;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
              <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">Documents & Files</span>
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
            <AnimatedPage>
              <div className="mx-auto w-full max-w-6xl">
                {/* Document Stats */}
                <section className="mt-16">
                  <h2 className="text-4xl font-bold tracking-tight text-white">Document Overview</h2>
                  <motion.div
                    className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    <motion.div variants={listItem}>
                      <Card className="flex flex-col items-center justify-center rounded-[46px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                        <File size={64} className="text-[#cfe0ad]" strokeWidth={1.5} />
                        <div className="mt-6 text-6xl font-black text-white">{documents.length}</div>
                        <p className="mt-2 text-xl text-[#b9b9b9]">Total Documents</p>
                      </Card>
                    </motion.div>

                    <motion.div variants={listItem}>
                      <Card className="flex flex-col items-center justify-center rounded-[46px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                        <div className="text-sm uppercase tracking-[0.4em] text-[#bdbdbd]">Storage</div>
                        <div className="mt-4 text-5xl font-black text-[#b8d4f1]">{(totalSize / (1024 * 1024)).toFixed(0)} MB</div>
                        <p className="mt-2 text-lg text-[#b9b9b9]">Used</p>
                      </Card>
                    </motion.div>

                    <motion.div variants={listItem}>
                      <Card className="flex flex-col items-center justify-center rounded-[46px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                        <Camera size={64} className="text-[#f3c5a8]" strokeWidth={1.5} />
                        <div className="mt-6 text-6xl font-black text-white">{folders.length}</div>
                        <p className="mt-2 text-xl text-[#b9b9b9]">Folders</p>
                      </Card>
                    </motion.div>
                  </motion.div>
                </section>

                {/* Folders */}
                <section className="mt-20">
                  <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-bold tracking-tight text-white">Folders</h2>
                    {selectedFolder && (
                      <button
                        onClick={() => setSelectedFolder(null)}
                        className="text-lg text-[#cfe0ad] hover:underline"
                      >
                        ← Back to all folders
                      </button>
                    )}
                  </div>
                  <motion.div
                    className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4"
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
                            className="w-full"
                          >
                            <Card className="flex flex-col items-center justify-center rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-8 transition hover:border-[#cfe0ad] hover:scale-[1.02]">
                              <Icon size={48} className="text-[#cfe0ad]" strokeWidth={1.5} />
                              <h3 className="mt-4 text-xl font-semibold text-white">{folder.name}</h3>
                              <p className="mt-2 text-sm text-[#8a8a8a]">{folder.documentCount} files</p>
                            </Card>
                          </button>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </section>

                {/* Documents List */}
                <section className="mt-20">
                  <h2 className="text-4xl font-bold tracking-tight text-white">
                    {selectedFolder ? `${selectedFolder} Files` : 'Recent Documents'}
                  </h2>
                  <motion.div
                    className="mt-8 space-y-4"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    {displayedDocuments.map((doc) => (
                      <motion.div key={doc.id} variants={listItem}>
                        <Card className="border border-[#2a2a2a] bg-[#101010] p-8 transition hover:border-[#3a3a3a]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#cfe0ad]/10">
                                <File size={24} className="text-[#cfe0ad]" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-white">{doc.name}</h3>
                                <div className="mt-1 flex items-center gap-4 text-sm text-[#8a8a8a]">
                                  <span>{doc.folder}</span>
                                  <span>•</span>
                                  <span>{formatFileSize(doc.size)}</span>
                                  <span>•</span>
                                  <span>{doc.uploadDate}</span>
                                </div>
                              </div>
                            </div>
                            <button className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#2a2a2a] hover:border-[#cfe0ad] transition">
                              <Download size={20} className="text-white" />
                            </button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </section>

                {/* Upload Button */}
                <section className="mt-20">
                  <button
                    type="button"
                    className="flex h-[200px] w-full items-center justify-center rounded-[50px] border-2 border-dashed border-[#2a2a2a] bg-[#111] text-2xl text-white transition hover:border-[#3a3a3a]"
                  >
                    <span className="flex items-center gap-4">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#3a3a3a] text-4xl">+</span>
                      Upload New Document
                    </span>
                  </button>
                </section>
              </div>
            </AnimatedPage>
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
