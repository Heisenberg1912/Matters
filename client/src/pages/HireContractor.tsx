import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/page-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Star, MapPin, Briefcase, ArrowLeft, Search } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/context/AuthContext";
import { useProject } from "@/context/ProjectContext";
import { contractorsApi } from "@/lib/api";
import { useTeamStore } from "@/store";

type ContractorListing = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: { name?: string; address?: string };
  specializations?: string[];
  rating?: { average: number; count: number };
  createdAt?: string;
};

const defaultSpecialties = ["All", "Brickwork", "Electrical", "Plumbing", "Carpentry", "Design", "Tiling"];

export default function HireContractor() {
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const { user } = useAuth();
  const { currentProject } = useProject();
  const inviteMember = useTeamStore((state) => state.inviteMember);
  const addMember = useTeamStore((state) => state.addMember);
  const fetchTeamMembers = useTeamStore((state) => state.fetchTeamMembers);

  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [contractors, setContractors] = useState<ContractorListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const isOwner =
    currentProject?.owner &&
    (typeof currentProject.owner === "string"
      ? currentProject.owner === user?._id
      : currentProject.owner._id === user?._id);

  useEffect(() => {
    let isMounted = true;
    const fetchContractors = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await contractorsApi.getAll({
          search: searchQuery.trim() || undefined,
          specialty: selectedSpecialty !== "All" ? selectedSpecialty : undefined,
        });
        if (!isMounted) return;
        if (response.success && response.data?.contractors) {
          setContractors(response.data.contractors);
        } else {
          setError(response.error || "Failed to load contractors");
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load contractors");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const handle = setTimeout(fetchContractors, 350);
    return () => {
      isMounted = false;
      clearTimeout(handle);
    };
  }, [searchQuery, selectedSpecialty]);

  const specialties = useMemo(() => {
    const dynamic = new Set<string>();
    contractors.forEach((contractor) => {
      contractor.specializations?.forEach((spec) => dynamic.add(spec));
    });
    return ["All", ...Array.from(dynamic), ...defaultSpecialties.filter((spec) => spec !== "All")];
  }, [contractors]);

  const filteredContractors = contractors.filter((contractor) => {
    if (selectedSpecialty === "All") return true;
    return contractor.specializations?.some((spec) => spec.toLowerCase().includes(selectedSpecialty.toLowerCase()));
  });

  const handleInvite = async (contractor: ContractorListing) => {
    if (!currentProject?._id) {
      showToast({ type: "warning", message: "Select a project first" });
      return;
    }
    if (!isOwner) {
      showToast({ type: "warning", message: "Only the project owner can invite contractors" });
      return;
    }
    setSubmittingId(contractor._id);
    try {
      await inviteMember(currentProject._id, contractor.email, "worker");
      await fetchTeamMembers(currentProject._id);
      showToast({ type: "success", message: `Invite sent to ${contractor.name}` });
    } catch (err) {
      await addMember({
        name: contractor.name,
        role: "worker",
        email: contractor.email || "",
        phone: contractor.phone || "",
        department: "Contractor",
        joinDate: new Date().toISOString().split("T")[0],
        status: "active",
      });
      showToast({ type: "info", message: "Invite failed, added locally" });
    } finally {
      setSubmittingId(null);
    }
  };

  const backButton = (
    <button onClick={() => navigate(-1)} className="text-white hover:text-[#cfe0ad] touch-target focus-ring mr-2">
      <ArrowLeft size={20} className="xs:w-6 xs:h-6" />
    </button>
  );

  return (
    <PageLayout
      title="Hire a Contractor"
      customHeader={backButton}
      contentClassName="px-4 xs:px-5 sm:px-6 md:px-10 lg:px-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        {!currentProject && (
          <Card className="mt-6 border border-[#242424] bg-[#101010] p-4 text-sm xs:text-base text-[#bdbdbd]">
            Select or create a project to send contractor invites.
          </Card>
        )}
        {error && (
          <Card className="mt-4 border border-red-500/40 bg-red-500/10 p-4 text-sm xs:text-base text-red-200">
            {error}
          </Card>
        )}

        <section className="mt-8 xs:mt-12 sm:mt-16">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Find Your Perfect Contractor</h2>

          {/* Search Bar */}
          <div className="mt-4 xs:mt-6 sm:mt-8 relative">
            <Search size={20} className="absolute left-4 xs:left-5 sm:left-6 top-1/2 -translate-y-1/2 text-[#8a8a8a] xs:w-6 xs:h-6" />
            <input
              type="text"
              placeholder="Search by name, role, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-[#2a2a2a] bg-[#0c0c0c] py-3 xs:py-4 sm:py-5 pl-12 xs:pl-14 sm:pl-16 pr-4 xs:pr-6 text-base xs:text-lg sm:text-xl text-white placeholder-[#6a6a6a] outline-none focus:border-[#cfe0ad] touch-target"
            />
          </div>

          {/* Specialty Filter */}
          <div className="scroll-x-container mt-4 xs:mt-6">
            {specialties.map((specialty) => (
              <button
                key={specialty}
                onClick={() => setSelectedSpecialty(specialty)}
                className={`shrink-0 rounded-full border px-4 xs:px-5 sm:px-6 py-2 xs:py-2.5 sm:py-3 text-sm xs:text-base sm:text-lg font-semibold transition touch-target focus-ring ${
                  selectedSpecialty === specialty
                    ? "border-[#cfe0ad] bg-[#cfe0ad] text-black"
                    : "border-[#2a2a2a] bg-[#0c0c0c] text-white hover:border-[#3a3a3a]"
                }`}
              >
                {specialty}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10 xs:mt-12 sm:mt-16">
          <div className="flex items-center justify-between">
            <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold text-white">
              {filteredContractors.length} Contractors Available
            </h3>
          </div>

          {isLoading && (
            <Card className="mt-6 border border-[#2a2a2a] bg-[#101010] p-4 xs:p-6 text-base xs:text-lg text-[#bdbdbd]">
              Loading contractors...
            </Card>
          )}

          <div className="mt-4 xs:mt-6 sm:mt-8 grid grid-cols-1 gap-4 xs:gap-6 sm:gap-8 md:grid-cols-2">
            {filteredContractors.map((contractor) => {
              const rating = contractor.rating?.average ? contractor.rating.average.toFixed(1) : "New";
              const reviews = contractor.rating?.count || 0;
              const experienceYears = contractor.createdAt
                ? Math.max(1, Math.floor((Date.now() - new Date(contractor.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365)))
                : 1;

              return (
                <Card
                  key={contractor._id}
                  className="rounded-[24px] xs:rounded-[30px] sm:rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-4 xs:p-6 sm:p-8 transition hover:border-[#cfe0ad]"
                >
                  <div className="flex items-start gap-4 xs:gap-5 sm:gap-6">
                    <Avatar className="h-14 w-14 xs:h-16 xs:w-16 sm:h-20 sm:w-20 border-2 border-[#2a2a2a] shrink-0">
                      <AvatarFallback className="text-lg xs:text-xl sm:text-2xl">
                        {contractor.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg xs:text-xl sm:text-2xl font-semibold text-white truncate">{contractor.name}</h4>
                      <p className="mt-1 text-sm xs:text-base sm:text-lg text-[#bdbdbd]">
                        {contractor.specializations?.[0] || "Contractor"}
                      </p>
                      <p className="text-xs xs:text-sm sm:text-base text-[#8a8a8a]">
                        {contractor.company?.name || "Independent"}
                      </p>

                      <div className="mt-3 xs:mt-4 flex items-center gap-2">
                        <Star size={16} className="fill-[#cfe0ad] text-[#cfe0ad] xs:w-5 xs:h-5" />
                        <span className="text-base xs:text-lg sm:text-xl font-semibold text-white">{rating}</span>
                        <span className="text-xs xs:text-sm sm:text-base text-[#8a8a8a]">({reviews})</span>
                      </div>

                      <div className="mt-3 xs:mt-4 flex flex-wrap items-center gap-2 xs:gap-3 text-xs xs:text-sm text-[#bdbdbd]">
                        <div className="flex items-center gap-1 xs:gap-2">
                          <MapPin size={14} className="xs:w-4 xs:h-4" />
                          <span>{contractor.company?.address || "Remote"}</span>
                        </div>
                        <div className="flex items-center gap-1 xs:gap-2">
                          <Briefcase size={14} className="xs:w-4 xs:h-4" />
                          <span>{experienceYears} yrs</span>
                        </div>
                      </div>

                      <div className="mt-3 xs:mt-4 flex flex-wrap gap-1.5 xs:gap-2">
                        {(contractor.specializations?.length ? contractor.specializations.slice(0, 3) : ["General"]).map((specialty) => (
                          <span
                            key={specialty}
                            className="rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-2 xs:px-3 py-1 text-xs xs:text-sm text-white"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 xs:mt-6 flex items-center justify-between">
                        <div>
                          <p className="text-xs xs:text-sm text-[#8a8a8a]">Rate</p>
                          <p className="text-base xs:text-lg sm:text-2xl font-bold text-[#cfe0ad]">On request</p>
                        </div>
                        <span className="rounded-full px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm font-semibold bg-[#4ade80]/10 text-[#4ade80]">
                          Available
                        </span>
                      </div>

                      <button
                        type="button"
                        className="mt-4 xs:mt-6 w-full rounded-full bg-[#cfe0ad] py-2.5 xs:py-3 sm:py-4 text-sm xs:text-base sm:text-lg font-semibold text-black transition hover:bg-[#d4e4b8] disabled:opacity-60 touch-target focus-ring"
                        onClick={() => handleInvite(contractor)}
                        disabled={submittingId === contractor._id || !currentProject?._id}
                      >
                        {submittingId === contractor._id ? "Sending..." : "Send Hire Request"}
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {!isLoading && filteredContractors.length === 0 && (
            <div className="mt-10 xs:mt-12 sm:mt-16 text-center">
              <p className="text-lg xs:text-xl sm:text-2xl text-[#bdbdbd]">No contractors found matching your criteria</p>
              <button
                onClick={() => {
                  setSelectedSpecialty("All");
                  setSearchQuery("");
                }}
                className="mt-4 xs:mt-6 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-6 xs:px-8 py-3 xs:py-4 text-base xs:text-lg sm:text-xl font-semibold text-white transition hover:border-[#cfe0ad] touch-target focus-ring"
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
