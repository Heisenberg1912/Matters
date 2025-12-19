import { useEffect, useMemo, useState } from "react";
import { useProject } from "@/context/ProjectContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers, Plus, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const projectTypes = ["residential", "commercial", "industrial", "renovation", "other"];

export default function ProjectSwitcher({ className }: { className?: string }) {
  const { currentProject, projects, fetchProjects, createProject, selectProjectById, isLoading } = useProject();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formState, setFormState] = useState({
    name: "",
    type: "residential",
    city: "",
    budget: "",
    expectedEndDate: "",
  });

  useEffect(() => {
    if (open && projects.length === 0) {
      fetchProjects();
    }
  }, [open, projects.length, fetchProjects]);

  const projectLabel = useMemo(() => {
    if (currentProject?.name) {
      return currentProject.name;
    }
    return "Select project";
  }, [currentProject?.name]);

  const handleChange = (key: string, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!formState.name.trim()) {
      setError("Project name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createProject({
        name: formState.name.trim(),
        type: formState.type,
        location: formState.city ? { city: formState.city } : undefined,
        budget: formState.budget ? { estimated: Number(formState.budget), spent: 0 } : undefined,
        timeline: formState.expectedEndDate
          ? { expectedEndDate: formState.expectedEndDate }
          : undefined,
      });
      setOpen(false);
      setFormState({ name: "", type: "residential", city: "", budget: "", expectedEndDate: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[#3a3a3a] active:scale-95",
          className
        )}
      >
        <FolderOpen className="h-4 w-4 text-[#cfe0ad]" />
        <span className="max-w-[140px] truncate">{projectLabel}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Projects</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Select a project</p>
              <div className="space-y-2">
                {projects.length === 0 && (
                  <div className="rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] p-4 text-sm text-[#bdbdbd]">
                    No projects yet. Create your first project below.
                  </div>
                )}
                {projects.map((project) => (
                  <button
                    key={project._id}
                    type="button"
                    onClick={async () => {
                      await selectProjectById(project._id);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left text-sm transition",
                      project._id === currentProject?._id
                        ? "border-[#cfe0ad] bg-[#cfe0ad]/10 text-white"
                        : "border-[#2a2a2a] bg-[#0c0c0c] text-[#d5d5d5] hover:border-[#3a3a3a]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{project.name}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#8a8a8a]">{project.type || "project"}</p>
                      </div>
                      {project._id === currentProject?._id && (
                        <span className="rounded-full bg-[#cfe0ad] px-2 py-1 text-[0.6rem] font-semibold text-black">
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[#2a2a2a] pt-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Plus className="h-4 w-4 text-[#cfe0ad]" />
                Create new project
              </div>
              {error && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={formState.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    placeholder="e.g. Skyline Residence"
                    disabled={isSubmitting || isLoading}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select
                      value={formState.type}
                      onValueChange={(value) => handleChange("type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Project type" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="project-city">City</Label>
                    <Input
                      id="project-city"
                      value={formState.city}
                      onChange={(event) => handleChange("city", event.target.value)}
                      placeholder="City"
                      disabled={isSubmitting || isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="project-budget">Estimated Budget</Label>
                    <Input
                      id="project-budget"
                      type="number"
                      value={formState.budget}
                      onChange={(event) => handleChange("budget", event.target.value)}
                      placeholder="5000000"
                      disabled={isSubmitting || isLoading}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="project-end-date">Target End Date</Label>
                    <Input
                      id="project-end-date"
                      type="date"
                      value={formState.expectedEndDate}
                      onChange={(event) => handleChange("expectedEndDate", event.target.value)}
                      disabled={isSubmitting || isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? "Creating..." : (
                    <span className="flex items-center justify-center gap-2">
                      <Layers className="h-4 w-4" />
                      Create Project
                    </span>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
