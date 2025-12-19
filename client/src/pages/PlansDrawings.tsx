import { useMemo, useState } from "react";
import PageLayout from "@/components/page-layout";
import { FileUploader } from "@/components/file-uploader";
import { Card } from "@/components/ui/card";
import { useNotifications } from "@/hooks/use-notifications";
import { useSwipe } from "@/hooks/use-swipe";
import planPlaceholder from "../assets/placeholders/plan-placeholder.png";
import { useUploadsStore } from "@/store";
import { useProject } from "@/context/ProjectContext";

export default function PlansDrawings() {
  const [index, setIndex] = useState(0);
  const { showToast } = useNotifications();
  const { currentProject } = useProject();
  const uploads = useUploadsStore((state) => state.uploads);
  const uploadFile = useUploadsStore((state) => state.uploadFile);
  const uploadsError = useUploadsStore((state) => state.error);

  const plans = useMemo(() => {
    const planUploads = uploads.filter((upload) => {
      const category = (upload.category || '').toLowerCase();
      return ['plans', 'plan', 'drawings', 'drawing'].includes(category);
    });

    return planUploads.map((upload) => ({
      id: upload._id,
      title: upload.originalName || upload.filename,
      date: new Date(upload.createdAt).toLocaleDateString(),
      category: upload.category || 'Plans',
      typology: currentProject?.type || 'Project',
      regulations: currentProject?.location?.city ? `Local regulations (${currentProject.location.city})` : 'Local regulations',
      estimate: currentProject?.timeline?.expectedEndDate ? 'Target completion set' : 'Timeline pending',
      details: currentProject?.description || 'No additional details provided.',
      startedAt: currentProject?.timeline?.startDate
        ? new Date(currentProject.timeline.startDate).toLocaleDateString()
        : 'Not set',
      location: currentProject?.location?.city || 'Not set',
      deadline: currentProject?.timeline?.expectedEndDate
        ? new Date(currentProject.timeline.expectedEndDate).toLocaleDateString()
        : 'Not set',
      src: upload.storage?.url || planPlaceholder,
    }));
  }, [uploads, currentProject]);

  const fallbackPlan = useMemo(
    () => ({
      id: 'plan-placeholder',
      title: currentProject?.name ? `${currentProject.name} Plan` : 'Upload Plans',
      date: new Date().toLocaleDateString(),
      category: currentProject?.type || 'Project',
      typology: currentProject?.type || 'Project',
      regulations: currentProject?.location?.city ? `Local regulations (${currentProject.location.city})` : 'Local regulations',
      estimate: currentProject?.timeline?.expectedEndDate ? 'Target completion set' : 'Timeline pending',
      details: currentProject?.description || 'Upload drawings to see details here.',
      startedAt: currentProject?.timeline?.startDate
        ? new Date(currentProject.timeline.startDate).toLocaleDateString()
        : 'Not set',
      location: currentProject?.location?.city || 'Not set',
      deadline: currentProject?.timeline?.expectedEndDate
        ? new Date(currentProject.timeline.expectedEndDate).toLocaleDateString()
        : 'Not set',
      src: planPlaceholder,
    }),
    [currentProject]
  );

  const displayPlans = plans.length > 0 ? plans : [fallbackPlan];
  const activePlan = displayPlans[index] ?? displayPlans[0];

  const { bind: swipePlan } = useSwipe({
    onSwipedLeft: () => go(1),
    onSwipedRight: () => go(-1)
  });

  const go = (delta: number) => {
    setIndex((prev) => {
      const total = displayPlans.length;
      const next = (prev + delta + total) % total;
      return next;
    });
  };

  return (
    <PageLayout
      title="Plans + Drawings"
      contentClassName="px-4 xs:px-5 sm:px-6 md:px-10 lg:px-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        <section className="mt-8 xs:mt-12 sm:mt-16 space-y-4 xs:space-y-6">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Plans + Drawings</h2>
          {!currentProject && (
            <Card className="border border-[#242424] bg-[#101010] p-4 text-sm xs:text-base text-[#bdbdbd]">
              Select or create a project to upload plans.
            </Card>
          )}
          {uploadsError && (
            <Card className="border border-red-500/40 bg-red-500/10 p-4 text-sm xs:text-base text-red-200">
              {uploadsError}
            </Card>
          )}
          <FileUploader
            accept={["application/pdf", "image/*"]}
            maxSize={15 * 1024 * 1024}
            helperText="PDFs, drawings, photos. Swipe the viewer below to move between uploads."
            onUpload={async (files) => {
              if (!currentProject) return;
              await Promise.all(
                files.map((file) =>
                  uploadFile(currentProject._id, file, { category: "plans" })
                )
              );
              showToast({
                type: "success",
                message: "Plans uploaded",
                description: `${files.length} file(s) added`,
              });
            }}
          />
        </section>

        <section className="mt-12 xs:mt-16 sm:mt-20">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl xs:text-2xl sm:text-4xl font-bold tracking-tight text-white">Uploaded Plans/Drawings</h2>
            <div className="flex gap-2 xs:gap-4 text-lg xs:text-2xl text-muted">
              <button
                type="button"
                onClick={() => go(-1)}
                className="rounded-full border border-[#2a2a2a] px-3 xs:px-4 py-1 touch-target focus-ring"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="rounded-full border border-[#2a2a2a] px-3 xs:px-4 py-1 touch-target focus-ring"
              >
                ›
              </button>
            </div>
          </div>
          <Card
            className="mt-4 xs:mt-6 sm:mt-8 flex h-[280px] xs:h-[360px] sm:h-[420px] md:h-[520px] items-center justify-center overflow-hidden rounded-[24px] xs:rounded-[34px] sm:rounded-[46px] border border-[#2a2a2a] bg-[#101010]"
            {...swipePlan()}
          >
            {activePlan?.src ? (
              <img
                src={activePlan.src}
                alt={activePlan.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full bg-[#1c1c1c]" />
            )}
          </Card>
          <div className="mt-4 xs:mt-6 flex justify-center gap-2 xs:gap-3">
            {displayPlans.map((plan, dot) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setIndex(dot)}
                className={`h-2 w-2 xs:h-3 xs:w-3 rounded-full transition touch-target ${dot === index ? "bg-[var(--pill,#cfe0ad)]" : "bg-[#2a2a2a]"}`}
              />
            ))}
          </div>
        </section>

        <section className="mt-12 xs:mt-16 sm:mt-20">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Details</h2>
          <div className="mt-4 xs:mt-6 sm:mt-8 rounded-[30px] xs:rounded-[40px] sm:rounded-[50px] border border-[#2a2a2a] bg-[#0f0f0f] p-4 xs:p-6 sm:p-10">
            <table className="w-full border-collapse text-sm xs:text-base sm:text-xl text-muted">
              <tbody>
                {[
                  ["Title", activePlan?.title],
                  ["Date uploaded", activePlan?.date],
                  ["Category", activePlan?.category],
                  ["Typology", activePlan?.typology],
                  ["Local regulations", activePlan?.regulations],
                  ["Estimated time", activePlan?.estimate],
                  ["Project details", activePlan?.details],
                  ["Construction started at", activePlan?.startedAt],
                  ["Location", activePlan?.location],
                  ["Deadline", activePlan?.deadline]
                ].map(([label, value]) => (
                  <tr key={label} className="border-t border-[#1f1f1f] first:border-t-0">
                    <td className="py-3 xs:py-4 pr-4 xs:pr-8 text-left text-xs xs:text-sm uppercase tracking-[0.2em] xs:tracking-[0.35em] text-[#d4d4d4]">{label}</td>
                    <td className="py-3 xs:py-4 text-right text-white break-words max-w-[150px] xs:max-w-none">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
