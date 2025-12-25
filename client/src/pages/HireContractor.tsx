import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  Briefcase,
  Search,
  Filter,
  Users,
  Award,
  CheckCircle,
  Loader2,
  X,
  Mail,
  Phone,
  Building2,
  TrendingUp,
} from "lucide-react";
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
  bio?: string;
  completedProjects?: number;
};

const defaultSpecialties = [
  "All",
  "Civil Work",
  "Electrical",
  "Plumbing",
  "Painting",
  "Carpentry",
  "Flooring",
  "Roofing",
  "HVAC",
  "Landscaping",
  "Interior Design",
  "Masonry",
  "Welding",
];

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
  const [selectedContractor, setSelectedContractor] = useState<ContractorListing | null>(null);

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
    return contractor.specializations?.some((spec) =>
      spec.toLowerCase().includes(selectedSpecialty.toLowerCase())
    );
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
      showToast({ type: "success", message: `✉️ Hire request sent to ${contractor.name}` });
      setSelectedContractor(null);
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Find Contractors</h1>
            <p className="text-gray-400 mt-1">
              Browse and hire skilled contractors for your projects
            </p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert Messages */}
        <AnimatePresence>
          {!currentProject && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <Card className="p-4 bg-blue-50 border-blue-200">
                <p className="text-blue-800">
                  💡 Select or create a project to send contractor hire requests.
                </p>
              </Card>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <Card className="p-4 bg-red-50 border-red-200">
                <p className="text-red-800">{error}</p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, company, or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-600 bg-gray-700/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Specialty Filters */}
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-white">Filter by Specialty</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {specialties.slice(0, 10).map((specialty) => (
                <motion.button
                  key={specialty}
                  onClick={() => setSelectedSpecialty(specialty)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedSpecialty === specialty
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600"
                  }`}
                >
                  {specialty}
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Results Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6 flex items-center justify-between"
        >
          <h2 className="text-2xl font-bold text-white">
            {isLoading ? "Loading..." : `${filteredContractors.length} Contractors Available`}
          </h2>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
              <p className="text-gray-600">Finding contractors...</p>
            </div>
          </div>
        )}

        {/* Contractors Grid */}
        {!isLoading && filteredContractors.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredContractors.map((contractor) => {
              const rating = contractor.rating?.average || 0;
              const reviews = contractor.rating?.count || 0;
              const experienceYears = contractor.createdAt
                ? Math.max(
                    1,
                    Math.floor(
                      (Date.now() - new Date(contractor.createdAt).getTime()) /
                        (1000 * 60 * 60 * 24 * 365)
                    )
                  )
                : 1;

              return (
                <motion.div key={contractor._id} variants={itemVariants}>
                  <Card className="h-full bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 hover:border-blue-500 transition-all cursor-pointer overflow-hidden">
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <motion.div whileHover={{ scale: 1.1 }}>
                          <Avatar className="w-16 h-16 border-4 border-gray-700">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl font-bold">
                              {contractor.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-white truncate">
                            {contractor.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {contractor.specializations?.[0] || "General Contractor"}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3" />
                            {contractor.company?.name || "Independent"}
                          </p>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {rating > 0 ? rating.toFixed(1) : "New"}
                        </span>
                        <span className="text-xs text-gray-500">({reviews} reviews)</span>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-700/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <Briefcase className="w-4 h-4" />
                            <span className="text-xs">Experience</span>
                          </div>
                          <p className="text-lg font-bold text-white">{experienceYears} yrs</p>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <Award className="w-4 h-4" />
                            <span className="text-xs">Projects</span>
                          </div>
                          <p className="text-lg font-bold text-white">
                            {contractor.completedProjects || 0}
                          </p>
                        </div>
                      </div>

                      {/* Location */}
                      {contractor.company?.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{contractor.company.address}</span>
                        </div>
                      )}

                      {/* Specializations */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(contractor.specializations?.length
                          ? contractor.specializations.slice(0, 3)
                          : ["General"]
                        ).map((specialty) => (
                          <span
                            key={specialty}
                            className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium"
                          >
                            {specialty}
                          </span>
                        ))}
                        {contractor.specializations && contractor.specializations.length > 3 && (
                          <span className="px-3 py-1 bg-gray-700/50 text-gray-400 rounded-full text-xs font-medium">
                            +{contractor.specializations.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Availability Badge */}
                      <div className="flex items-center justify-center mb-4">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Available Now
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                            onClick={() => handleInvite(contractor)}
                            disabled={submittingId === contractor._id || !currentProject?._id}
                          >
                            {submittingId === contractor._id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Hire Request
                              </>
                            )}
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setSelectedContractor(contractor)}
                          >
                            View Profile
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && filteredContractors.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <Users className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No contractors found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or filters
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedSpecialty("All");
                setSearchQuery("");
              }}
            >
              Clear All Filters
            </Button>
          </motion.div>
        )}
      </div>

      {/* Contractor Profile Modal */}
      <AnimatePresence>
        {selectedContractor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedContractor(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20 border-4 border-gray-100">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl font-bold">
                        {selectedContractor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedContractor.name}
                      </h2>
                      <p className="text-gray-600">
                        {selectedContractor.specializations?.[0] || "General Contractor"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedContractor(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Contact Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-900">{selectedContractor.email}</span>
                  </div>
                  {selectedContractor.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-900">{selectedContractor.phone}</span>
                    </div>
                  )}
                  {selectedContractor.company?.name && (
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-900">{selectedContractor.company.name}</span>
                    </div>
                  )}
                </div>

                {/* Rating */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Rating & Reviews</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${
                            i < Math.round(selectedContractor.rating?.average || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      {selectedContractor.rating?.average?.toFixed(1) || "New"}
                    </span>
                    <span className="text-gray-500">
                      ({selectedContractor.rating?.count || 0} reviews)
                    </span>
                  </div>
                </div>

                {/* Specializations */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedContractor.specializations || ["General"]).map((specialty) => (
                      <span
                        key={specialty}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                {selectedContractor.bio && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">About</h3>
                    <p className="text-gray-700">{selectedContractor.bio}</p>
                  </div>
                )}

                {/* Action Button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    onClick={() => handleInvite(selectedContractor)}
                    disabled={submittingId === selectedContractor._id || !currentProject?._id}
                    size="lg"
                  >
                    {submittingId === selectedContractor._id ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending Hire Request...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 mr-2" />
                        Send Hire Request
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
