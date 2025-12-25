import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageLayout from "@/components/page-layout";
import { jobsApi, type Job } from "@/lib/api";
import {
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  Search,
  Filter,
  ChevronRight,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AvailableJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [page]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await jobsApi.getAll({ page, limit: 20, status: "open", search: search || undefined });
      if (response.success && response.data) {
        if (page === 1) {
          setJobs(response.data.jobs);
        } else {
          setJobs((prev) => [...prev, ...response.data!.jobs]);
        }
        setHasMore(response.data.pagination.page < response.data.pagination.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadJobs();
  };

  const formatBudget = (budget?: Job["budget"]) => {
    if (!budget) return "Negotiable";
    const { min, max, currency = "INR" } = budget;
    if (min && max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
    if (min) return `${currency} ${min.toLocaleString()}+`;
    if (max) return `Up to ${currency} ${max.toLocaleString()}`;
    return "Negotiable";
  };

  return (
    <PageLayout title="Available Jobs">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Jobs List */}
        {loading && page === 1 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-card animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card className="p-8 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted mb-4" />
            <h3 className="font-semibold mb-2">No Jobs Available</h3>
            <p className="text-sm text-muted">
              Check back later for new job opportunities.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Card
                key={job._id}
                className="p-4 cursor-pointer hover:bg-[#1a1a1a] transition"
                onClick={() => navigate(`/contractor/jobs/${job._id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{job.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted mt-1">
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="truncate">{job.project?.name}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted flex-shrink-0" />
                </div>

                {job.description && (
                  <p className="text-sm text-muted mb-3 line-clamp-2">
                    {job.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {job.requiredSpecializations?.slice(0, 3).map((spec) => (
                    <span
                      key={spec}
                      className="px-2 py-0.5 bg-[#1a1a1a] rounded text-xs"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    {job.location?.city && (
                      <div className="flex items-center gap-1 text-muted">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{job.location.city}</span>
                      </div>
                    )}
                    {job.timeline?.startDate && (
                      <div className="flex items-center gap-1 text-muted">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(job.timeline.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[#cfe0ad] font-medium">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>{formatBudget(job.budget)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-[#cfe0ad]/20 flex items-center justify-center text-xs">
                      {job.postedBy?.name?.charAt(0) || "?"}
                    </div>
                    <span className="text-sm text-muted">{job.postedBy?.name}</span>
                  </div>
                  <span className="text-xs text-muted">
                    {job.bidCount || 0} bids
                  </span>
                </div>
              </Card>
            ))}

            {hasMore && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
              >
                {loading ? "Loading..." : "Load More"}
              </Button>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
