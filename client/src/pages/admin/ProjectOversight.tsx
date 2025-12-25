import { useEffect, useState } from "react";
import PageLayout from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi, type Project } from "@/lib/api";
import { AlertCircle, Building2, Loader2, Search } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
];

export default function ProjectOversight() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadProjects(1, true);
  }, [statusFilter]);

  const loadProjects = async (nextPage = 1, replace = false) => {
    try {
      if (nextPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      const response = await adminApi.getProjects({
        page: nextPage,
        limit: 20,
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      if (response.success && response.data) {
        setProjects((prev) =>
          replace ? response.data.projects : [...prev, ...response.data.projects]
        );
        setHasMore(response.data.pagination.page < response.data.pagination.pages);
        setPage(nextPage);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = () => {
    loadProjects(1, true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planning":
        return <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs">Planning</span>;
      case "in_progress":
        return <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs">In Progress</span>;
      case "completed":
        return <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">Completed</span>;
      case "on_hold":
        return <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs">On Hold</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-gray-500/20 text-gray-400 text-xs">{status}</span>;
    }
  };

  if (loading) {
    return (
      <PageLayout title="Project Oversight">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-card animate-pulse rounded-2xl" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Project Oversight">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input
              placeholder="Search projects"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-lg bg-[#1a1a1a] border border-border"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {projects.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted mb-4" />
            <p className="text-sm text-muted">No projects found</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Card key={project._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted" />
                      <p className="font-semibold">{project.name}</p>
                    </div>
                    <p className="text-sm text-muted">
                      Owner: {typeof project.owner === "string" ? project.owner : project.owner?.name}
                    </p>
                  </div>
                  {getStatusBadge(project.status)}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted">Budget</p>
                    <p className="font-medium">
                      INR {project.budget?.estimated?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Spent</p>
                    <p className="font-medium">
                      INR {project.budget?.spent?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Progress</p>
                    <p className="font-medium">
                      {project.progress?.percentage?.toFixed(0) || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Created</p>
                    <p className="font-medium">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}

            {hasMore && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => loadProjects(page + 1)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
