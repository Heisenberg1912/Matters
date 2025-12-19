import { motion } from "framer-motion";
import PageLayout from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { FileText, Download, FileBarChart, TrendingUp, Users, Package } from "lucide-react";
import { useReportStore } from "@/store";
import { staggerContainer, listItem } from "@/lib/animations";
import { useProject } from "@/context/ProjectContext";
import { useNotifications } from "@/hooks/use-notifications";

export default function Reports() {
  const { currentProject } = useProject();
  const reports = useReportStore((state) => state.reports);
  const reportTypes = useReportStore((state) => state.getReportTypes());
  const recentReports = useReportStore((state) => state.getRecentReports());
  const latestReport = recentReports[0];
  const generateReport = useReportStore((state) => state.generateReport);
  const exportReport = useReportStore((state) => state.exportReport);
  const reportError = useReportStore((state) => state.error);
  const isGenerating = useReportStore((state) => state.isLoading);
  const { showToast } = useNotifications();

  const typeIcons: Record<string, typeof TrendingUp> = {
    budget: TrendingUp,
    progress: FileBarChart,
    contractor: Users,
    inventory: Package,
    weekly: FileText
  };

  return (
    <PageLayout
      title="Reports"
      contentClassName="px-4 xs:px-5 sm:px-6 md:px-10 lg:px-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        {/* Report Templates */}
        <section className="mt-8 xs:mt-12 sm:mt-16">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Report Templates</h2>
          <p className="mt-2 xs:mt-4 text-base xs:text-lg sm:text-xl text-[#bdbdbd]">Generate comprehensive reports for your project</p>
          {!currentProject && (
            <Card className="mt-4 border border-[#242424] bg-[#101010] p-4 text-sm xs:text-base text-[#bdbdbd]">
              Select or create a project to generate reports.
            </Card>
          )}
          {reportError && (
            <Card className="mt-4 border border-red-500/40 bg-red-500/10 p-4 text-sm xs:text-base text-red-200">
              {reportError}
            </Card>
          )}
          <motion.div
            className="mt-4 xs:mt-6 sm:mt-8 grid grid-cols-1 gap-4 xs:gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {reportTypes.map((template) => {
              const Icon = typeIcons[template.type] || FileText;
              return (
                <motion.div key={template.type} variants={listItem}>
                  <Card className="flex flex-col rounded-[24px] xs:rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-5 xs:p-6 sm:p-8 transition hover:border-[#cfe0ad]">
                    <div className="flex h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl xs:rounded-2xl bg-[#cfe0ad]/10">
                      <Icon size={24} className="text-[#cfe0ad] xs:w-7 xs:h-7 sm:w-8 sm:h-8" strokeWidth={1.5} />
                    </div>
                    <h3 className="mt-4 xs:mt-6 text-lg xs:text-xl sm:text-2xl font-semibold text-white">{template.name}</h3>
                    <p className="mt-2 xs:mt-3 text-sm xs:text-base text-[#bdbdbd] flex-1">{template.description}</p>
                    <button
                      className="mt-4 xs:mt-6 flex items-center justify-center gap-2 rounded-full border border-[#cfe0ad] bg-[#cfe0ad]/10 px-4 xs:px-6 py-2 xs:py-3 text-sm xs:text-base sm:text-lg font-semibold text-[#cfe0ad] transition hover:bg-[#cfe0ad] hover:text-black touch-target focus-ring"
                      onClick={async () => {
                        if (!currentProject) {
                          showToast({ type: "error", message: "Select a project first" });
                          return;
                        }
                        try {
                          await generateReport(template.type, currentProject._id);
                          showToast({ type: "success", message: "Report generated" });
                        } catch (error) {
                          showToast({
                            type: "error",
                            message: error instanceof Error ? error.message : "Failed to generate report",
                          });
                        }
                      }}
                      disabled={isGenerating}
                    >
                      <FileText size={18} className="xs:w-5 xs:h-5" />
                      Generate Report
                    </button>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Recent Reports */}
        <section className="mt-12 xs:mt-16 sm:mt-20">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Recent Reports</h2>
          <motion.div
            className="mt-4 xs:mt-6 sm:mt-8 space-y-3 xs:space-y-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {recentReports.length === 0 && (
              <Card className="border border-[#2a2a2a] bg-[#101010] p-4 xs:p-6 text-sm xs:text-base text-[#bdbdbd]">
                No reports generated yet.
              </Card>
            )}
            {recentReports.map((report) => {
              const Icon = typeIcons[report.type] || FileText;
              return (
                <motion.div key={report.id} variants={listItem}>
                  <Card className="border border-[#2a2a2a] bg-[#101010] p-4 xs:p-6 sm:p-8 transition hover:border-[#3a3a3a]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3 xs:gap-4 flex-1 min-w-0">
                        <div className="flex h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg xs:rounded-xl bg-[#b8d4f1]/10 shrink-0">
                          <Icon size={20} className="text-[#b8d4f1] xs:w-6 xs:h-6" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-white truncate">{report.name}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2 xs:gap-4 text-xs xs:text-sm text-[#8a8a8a]">
                            <span className="uppercase tracking-[0.15em] xs:tracking-[0.2em]">{report.type}</span>
                            <span className="hidden xs:inline">•</span>
                            <span>{report.generatedDate}</span>
                          </div>
                          {report.description && (
                            <p className="mt-2 text-sm xs:text-base text-[#bdbdbd] line-clamp-2">{report.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 xs:gap-3 self-end sm:self-center">
                        <button
                          className="flex h-10 w-10 xs:h-12 xs:w-12 items-center justify-center rounded-lg border border-[#2a2a2a] hover:border-[#cfe0ad] transition touch-target focus-ring"
                          onClick={() => exportReport(report.id, "pdf")}
                        >
                          <FileText size={18} className="text-white xs:w-5 xs:h-5" />
                        </button>
                        <button
                          className="flex h-10 w-10 xs:h-12 xs:w-12 items-center justify-center rounded-lg border border-[#2a2a2a] hover:border-[#cfe0ad] transition touch-target focus-ring"
                          onClick={() => exportReport(report.id, "excel")}
                        >
                          <Download size={18} className="text-white xs:w-5 xs:h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Show some data preview */}
                    {report.data && (
                      <div className="mt-4 xs:mt-6 pt-4 xs:pt-6 border-t border-[#2a2a2a]">
                        <div className="grid grid-cols-2 gap-3 xs:gap-4 md:grid-cols-4">
                          {Object.entries(report.data).slice(0, 4).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-xs uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">{key}</p>
                              <p className="mt-1 text-base xs:text-lg sm:text-xl font-semibold text-white">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Export Options */}
        <section className="mt-12 xs:mt-16 sm:mt-20">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Export Options</h2>
          <Card className="mt-4 xs:mt-6 sm:mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-4 xs:p-6 sm:p-10">
            <div className="grid grid-cols-1 gap-4 xs:gap-6 md:grid-cols-2">
              <button
                className="flex items-center gap-3 xs:gap-4 rounded-[18px] xs:rounded-[24px] border border-[#2a2a2a] bg-[#0c0c0c] p-4 xs:p-6 sm:p-8 transition hover:border-[#cfe0ad] touch-target focus-ring"
                onClick={() => {
                  if (!latestReport) {
                    showToast({ type: "info", message: "Generate a report first" });
                    return;
                  }
                  exportReport(latestReport.id, "pdf");
                }}
              >
                <div className="flex h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 items-center justify-center rounded-lg xs:rounded-xl bg-[#f87171]/10 shrink-0">
                  <FileText size={24} className="text-[#f87171] xs:w-7 xs:h-7 sm:w-8 sm:h-8" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold text-white">Export as PDF</h3>
                  <p className="mt-1 text-sm xs:text-base text-[#8a8a8a]">Professional format</p>
                </div>
              </button>

              <button
                className="flex items-center gap-3 xs:gap-4 rounded-[18px] xs:rounded-[24px] border border-[#2a2a2a] bg-[#0c0c0c] p-4 xs:p-6 sm:p-8 transition hover:border-[#cfe0ad] touch-target focus-ring"
                onClick={() => {
                  if (!latestReport) {
                    showToast({ type: "info", message: "Generate a report first" });
                    return;
                  }
                  exportReport(latestReport.id, "excel");
                }}
              >
                <div className="flex h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 items-center justify-center rounded-lg xs:rounded-xl bg-[#4ade80]/10 shrink-0">
                  <FileBarChart size={24} className="text-[#4ade80] xs:w-7 xs:h-7 sm:w-8 sm:h-8" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold text-white">Export as Excel</h3>
                  <p className="mt-1 text-sm xs:text-base text-[#8a8a8a]">Data analysis ready</p>
                </div>
              </button>
            </div>
          </Card>
        </section>
      </div>
    </PageLayout>
  );
}
