import { useEffect, useState } from "react";
import PageLayout from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminDashboardApi, type User } from "@/lib/api";
import { AlertCircle, BadgeCheck, Loader2, Search, UserCheck } from "lucide-react";
import toast from "react-hot-toast";

type ContractorUser = User & {
  contractor?: {
    isVerified?: boolean;
    verifiedAt?: string;
  };
  company?: {
    name?: string;
  };
};

const VERIFIED_FILTERS = [
  { value: "all", label: "All" },
  { value: "true", label: "Verified" },
  { value: "false", label: "Unverified" },
];

export default function ContractorVerification() {
  const [contractors, setContractors] = useState<ContractorUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadContractors(1, true);
  }, [verifiedFilter]);

  const loadContractors = async (nextPage = 1, replace = false) => {
    try {
      if (nextPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await adminDashboardApi.getContractors({
        page: nextPage,
        limit: 20,
        verified: verifiedFilter === "all" ? undefined : verifiedFilter,
        search: search.trim() || undefined,
      });

      if (response.success && response.data) {
        setContractors((prev) =>
          replace ? (response.data.contractors as ContractorUser[]) : [...prev, ...(response.data.contractors as ContractorUser[])]
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
    loadContractors(1, true);
  };

  const handleVerify = async (contractor: ContractorUser, verified: boolean) => {
    try {
      setActionLoading(contractor._id);
      const response = await adminDashboardApi.verifyContractor(contractor._id, verified);
      if (response.success) {
        setContractors((prev) =>
          prev.map((item) =>
            item._id === contractor._id
              ? {
                  ...item,
                  contractor: {
                    ...item.contractor,
                    isVerified: verified,
                    verifiedAt: response.data?.verifiedAt || item.contractor?.verifiedAt,
                  },
                }
              : item
          )
        );
        toast.success(verified ? "Contractor verified" : "Verification removed");
      } else {
        toast.error(response.error || "Failed to update verification");
      }
    } catch (err) {
      toast.error("Failed to update verification");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Contractor Verification">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-card animate-pulse rounded-2xl" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Contractor Verification">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input
              placeholder="Search contractors"
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
          value={verifiedFilter}
          onChange={(e) => setVerifiedFilter(e.target.value)}
          className="h-10 px-3 rounded-lg bg-[#1a1a1a] border border-border"
        >
          {VERIFIED_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {contractors.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted mb-4" />
            <p className="text-sm text-muted">No contractors found</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {contractors.map((contractor) => (
              <Card key={contractor._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted" />
                      <p className="font-semibold">{contractor.name}</p>
                      {contractor.contractor?.isVerified && (
                        <BadgeCheck className="h-4 w-4 text-[#cfe0ad]" />
                      )}
                    </div>
                    <p className="text-sm text-muted">{contractor.email}</p>
                    {contractor.company?.name && (
                      <p className="text-xs text-muted">{contractor.company.name}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      contractor.contractor?.isVerified
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {contractor.contractor?.isVerified ? "Verified" : "Pending"}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  {contractor.contractor?.isVerified ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerify(contractor, false)}
                      disabled={actionLoading === contractor._id}
                    >
                      {actionLoading === contractor._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Remove Verification"
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleVerify(contractor, true)}
                      disabled={actionLoading === contractor._id}
                    >
                      {actionLoading === contractor._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Verify Contractor"
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            ))}

            {hasMore && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => loadContractors(page + 1)}
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
