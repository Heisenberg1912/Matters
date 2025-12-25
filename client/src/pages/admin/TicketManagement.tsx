import { useEffect, useState } from "react";
import PageLayout from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminDashboardApi } from "@/lib/api";
import { AlertCircle, Loader2, Search, Ticket } from "lucide-react";
import toast from "react-hot-toast";

type TicketItem = {
  _id: string;
  ticketNumber: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  user: { name: string; email: string };
  project: { name: string };
  createdAt: string;
};

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

const PRIORITY_FILTERS = [
  { value: "all", label: "All" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function TicketManagement() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [ticketUpdates, setTicketUpdates] = useState<Record<string, { status: string; priority: string }>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadTickets(1, true);
  }, [statusFilter, priorityFilter]);

  const loadTickets = async (nextPage = 1, replace = false) => {
    try {
      if (nextPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      const response = await adminDashboardApi.getTickets({
        page: nextPage,
        limit: 20,
        status: statusFilter === "all" ? undefined : statusFilter,
        priority: priorityFilter === "all" ? undefined : priorityFilter,
        search: search.trim() || undefined,
      });

      if (response.success && response.data) {
        const nextTickets = response.data.tickets as TicketItem[];
        setTickets((prev) => (replace ? nextTickets : [...prev, ...nextTickets]));
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
    loadTickets(1, true);
  };

  const updateTicketState = (id: string, status: string, priority: string) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket._id === id ? { ...ticket, status, priority } : ticket
      )
    );
  };

  const handleUpdateTicket = async (ticket: TicketItem) => {
    const updates = ticketUpdates[ticket._id] || {
      status: ticket.status,
      priority: ticket.priority,
    };

    try {
      setActionLoading(ticket._id);
      const response = await adminDashboardApi.updateTicket(ticket._id, updates);
      if (response.success) {
        updateTicketState(ticket._id, updates.status, updates.priority);
        toast.success("Ticket updated");
      } else {
        toast.error(response.error || "Failed to update ticket");
      }
    } catch (err) {
      toast.error("Failed to update ticket");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Support Tickets">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-card animate-pulse rounded-2xl" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Support Tickets">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input
              placeholder="Search ticket number or subject"
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-lg bg-[#1a1a1a] border border-border"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-10 px-3 rounded-lg bg-[#1a1a1a] border border-border"
          >
            {PRIORITY_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {tickets.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted mb-4" />
            <p className="text-sm text-muted">No tickets found</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const updateState = ticketUpdates[ticket._id] || {
                status: ticket.status,
                priority: ticket.priority,
              };

              return (
                <Card key={ticket._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-muted" />
                        <p className="font-semibold">{ticket.subject}</p>
                      </div>
                      <p className="text-xs text-muted">#{ticket.ticketNumber}</p>
                    </div>
                    <span className="text-xs text-muted">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-muted mt-2 line-clamp-2">{ticket.message}</p>

                  <div className="mt-3 text-xs text-muted">
                    <p>User: {ticket.user?.name}</p>
                    <p>Project: {ticket.project?.name}</p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <select
                      value={updateState.status}
                      onChange={(e) =>
                        setTicketUpdates((prev) => ({
                          ...prev,
                          [ticket._id]: {
                            ...updateState,
                            status: e.target.value,
                          },
                        }))
                      }
                      className="h-9 px-2 rounded-lg bg-[#1a1a1a] border border-border text-sm"
                    >
                      {STATUS_FILTERS.filter((item) => item.value !== "all").map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={updateState.priority}
                      onChange={(e) =>
                        setTicketUpdates((prev) => ({
                          ...prev,
                          [ticket._id]: {
                            ...updateState,
                            priority: e.target.value,
                          },
                        }))
                      }
                      className="h-9 px-2 rounded-lg bg-[#1a1a1a] border border-border text-sm"
                    >
                      {PRIORITY_FILTERS.filter((item) => item.value !== "all").map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => handleUpdateTicket(ticket)}
                    disabled={actionLoading === ticket._id}
                  >
                    {actionLoading === ticket._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </Card>
              );
            })}

            {hasMore && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => loadTickets(page + 1)}
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
