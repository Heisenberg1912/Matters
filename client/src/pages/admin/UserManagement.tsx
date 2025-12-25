import { useEffect, useState } from "react";
import PageLayout from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi, type User } from "@/lib/api";
import { AlertCircle, Loader2, Search, Shield, UserCog } from "lucide-react";
import toast from "react-hot-toast";

const ROLE_OPTIONS = [
  { value: "user", label: "Customer" },
  { value: "contractor", label: "Contractor" },
  { value: "admin", label: "Admin" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadUsers(1, true);
  }, [roleFilter, statusFilter]);

  const loadUsers = async (nextPage = 1, replace = false) => {
    try {
      if (nextPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await adminApi.getUsers({
        page: nextPage,
        limit: 20,
        search: search.trim() || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      if (response.success && response.data) {
        setUsers((prev) => (replace ? response.data.users : [...prev, ...response.data.users]));
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
    loadUsers(1, true);
  };

  const updateUserState = (id: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((user) => (user._id === id ? { ...user, ...updates } : user)));
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      setActionLoading(id);
      const response = await adminApi.updateUser(id, { role });
      if (response.success && response.data) {
        updateUserState(id, response.data);
        toast.success("Role updated");
      } else {
        toast.error(response.error || "Failed to update role");
      }
    } catch (err) {
      toast.error("Failed to update role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      setActionLoading(user._id);
      const response = await adminApi.updateUser(user._id, { isActive: !user.isActive });
      if (response.success && response.data) {
        updateUserState(user._id, response.data);
        toast.success(user.isActive ? "User deactivated" : "User activated");
      } else {
        toast.error(response.error || "Failed to update status");
      }
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <PageLayout title="User Management">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-card animate-pulse rounded-2xl" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="User Management">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input
              placeholder="Search by name or email"
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

        <div className="grid grid-cols-2 gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 rounded-lg bg-[#1a1a1a] border border-border"
          >
            <option value="all">All Roles</option>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
        </div>

        {users.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted mb-4" />
            <p className="text-sm text-muted">No users found</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <Card key={user._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-muted">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Shield className="h-3.5 w-3.5" />
                      <span className="capitalize">{user.role}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${
                        user.isActive
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    className="h-9 px-2 rounded-lg bg-[#1a1a1a] border border-border text-sm"
                    disabled={actionLoading === user._id}
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(user)}
                    disabled={actionLoading === user._id}
                  >
                    {actionLoading === user._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserCog className="h-4 w-4 mr-1" />
                        {user.isActive ? "Deactivate" : "Activate"}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}

            {hasMore && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => loadUsers(page + 1)}
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
