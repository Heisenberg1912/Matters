import { useEffect, useState } from "react";
import PageLayout from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contractorDashboardApi, type User } from "@/lib/api";
import { AlertCircle, BadgeCheck, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type ContractorUser = User & {
  company?: {
    name?: string;
    address?: string;
    license?: string;
    gstin?: string;
    website?: string;
  };
  specializations?: string[];
  contractor?: {
    isVerified?: boolean;
    bio?: string;
    yearsExperience?: number;
    hourlyRate?: number;
    dailyRate?: number;
    serviceAreas?: Array<{ city: string; state: string }>;
    availabilityStatus?: string;
    portfolioImages?: string[];
  };
};

const SPECIALIZATIONS = [
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

const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "on_leave", label: "On Leave" },
];

export default function ContractorProfile() {
  const [profile, setProfile] = useState<ContractorUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState("available");
  const [originalAvailability, setOriginalAvailability] = useState("available");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    companyName: "",
    companyAddress: "",
    companyLicense: "",
    companyGstin: "",
    companyWebsite: "",
    bio: "",
    yearsExperience: "",
    hourlyRate: "",
    dailyRate: "",
    specializations: [] as string[],
    portfolioText: "",
  });

  const [serviceAreas, setServiceAreas] = useState<Array<{ city: string; state: string }>>([
    { city: "", state: "" },
  ]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await contractorDashboardApi.getProfile();
      if (response.success && response.data) {
        const data = response.data as ContractorUser;
        setProfile(data);
        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          companyName: data.company?.name || "",
          companyAddress: data.company?.address || "",
          companyLicense: data.company?.license || "",
          companyGstin: data.company?.gstin || "",
          companyWebsite: data.company?.website || "",
          bio: data.contractor?.bio || "",
          yearsExperience: data.contractor?.yearsExperience?.toString() || "",
          hourlyRate: data.contractor?.hourlyRate?.toString() || "",
          dailyRate: data.contractor?.dailyRate?.toString() || "",
          specializations: data.specializations || [],
          portfolioText: (data.contractor?.portfolioImages || []).join("\n"),
        });
        const nextAvailability = data.contractor?.availabilityStatus || "available";
        setAvailability(nextAvailability);
        setOriginalAvailability(nextAvailability);
        const nextAreas = data.contractor?.serviceAreas?.length
          ? data.contractor.serviceAreas
          : [{ city: "", state: "" }];
        setServiceAreas(nextAreas);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialization = (spec: string) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((item) => item !== spec)
        : [...prev.specializations, spec],
    }));
  };

  const updateServiceArea = (index: number, field: "city" | "state", value: string) => {
    setServiceAreas((prev) =>
      prev.map((area, idx) => (idx === index ? { ...area, [field]: value } : area))
    );
  };

  const addServiceArea = () => {
    setServiceAreas((prev) => [...prev, { city: "", state: "" }]);
  };

  const removeServiceArea = (index: number) => {
    setServiceAreas((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        company: {
          name: formData.companyName.trim() || undefined,
          address: formData.companyAddress.trim() || undefined,
          license: formData.companyLicense.trim() || undefined,
          gstin: formData.companyGstin.trim() || undefined,
          website: formData.companyWebsite.trim() || undefined,
        },
        specializations: formData.specializations,
        bio: formData.bio.trim() || undefined,
        yearsExperience: formData.yearsExperience ? Number(formData.yearsExperience) : undefined,
        hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : undefined,
        dailyRate: formData.dailyRate ? Number(formData.dailyRate) : undefined,
        serviceAreas: serviceAreas
          .map((area) => ({
            city: area.city.trim(),
            state: area.state.trim(),
          }))
          .filter((area) => area.city || area.state),
        portfolioImages: formData.portfolioText
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const response = await contractorDashboardApi.updateProfile(payload);
      if (response.success && response.data) {
        let updatedProfile = response.data as ContractorUser;
        if (availability !== originalAvailability) {
          const availabilityResponse = await contractorDashboardApi.updateAvailability(
            availability as "available" | "busy" | "on_leave"
          );
          if (availabilityResponse.success) {
            updatedProfile = {
              ...updatedProfile,
              contractor: {
                ...updatedProfile.contractor,
                availabilityStatus: availability,
              },
            };
            setOriginalAvailability(availability);
          }
        }
        setProfile(updatedProfile);
        toast.success("Profile updated");
      } else {
        toast.error(response.error || "Failed to update profile");
      }
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="My Profile">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-card animate-pulse rounded-2xl" />
          ))}
        </div>
      </PageLayout>
    );
  }

  if (!profile) {
    return (
      <PageLayout title="My Profile">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted mb-4" />
          <p className="text-sm text-muted">Failed to load profile</p>
          <Button onClick={loadProfile} className="mt-4">Retry</Button>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="My Profile">
      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{profile.name}</h3>
              <p className="text-sm text-muted">{profile.email}</p>
            </div>
            {profile.contractor?.isVerified && (
              <div className="flex items-center gap-1 text-xs text-[#cfe0ad]">
                <BadgeCheck className="h-4 w-4" />
                Verified
              </div>
            )}
          </div>
          <div className="mt-4">
            <Label className="mb-2 block">Availability</Label>
            <div className="flex gap-2">
              {AVAILABILITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAvailability(option.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs transition",
                    availability === option.value
                      ? "bg-[#cfe0ad] text-black"
                      : "bg-[#1a1a1a] hover:bg-[#2a2a2a]"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">Basic Info</h3>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              className="mt-1"
            />
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">Company Details</h3>
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="companyAddress">Address</Label>
            <Input
              id="companyAddress"
              value={formData.companyAddress}
              onChange={(e) => setFormData((prev) => ({ ...prev, companyAddress: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="companyLicense">License</Label>
              <Input
                id="companyLicense"
                value={formData.companyLicense}
                onChange={(e) => setFormData((prev) => ({ ...prev, companyLicense: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="companyGstin">GSTIN</Label>
              <Input
                id="companyGstin"
                value={formData.companyGstin}
                onChange={(e) => setFormData((prev) => ({ ...prev, companyGstin: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="companyWebsite">Website</Label>
            <Input
              id="companyWebsite"
              value={formData.companyWebsite}
              onChange={(e) => setFormData((prev) => ({ ...prev, companyWebsite: e.target.value }))}
              className="mt-1"
            />
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">Specializations</h3>
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => toggleSpecialization(spec)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs transition",
                  formData.specializations.includes(spec)
                    ? "bg-[#cfe0ad] text-black"
                    : "bg-[#1a1a1a] hover:bg-[#2a2a2a]"
                )}
              >
                {spec}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">Experience</h3>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              rows={4}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="yearsExperience">Years of Experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                value={formData.yearsExperience}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, yearsExperience: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hourlyRate">Hourly Rate (INR)</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData((prev) => ({ ...prev, hourlyRate: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dailyRate">Daily Rate (INR)</Label>
              <Input
                id="dailyRate"
                type="number"
                value={formData.dailyRate}
                onChange={(e) => setFormData((prev) => ({ ...prev, dailyRate: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">Service Areas</h3>
          {serviceAreas.map((area, index) => (
            <div key={`${area.city}-${index}`} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>City</Label>
                <Input
                  value={area.city}
                  onChange={(e) => updateServiceArea(index, "city", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label>State</Label>
                <Input
                  value={area.state}
                  onChange={(e) => updateServiceArea(index, "state", e.target.value)}
                  className="mt-1"
                />
              </div>
              {serviceAreas.length > 1 && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => removeServiceArea(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addServiceArea}>
            <Plus className="h-4 w-4 mr-1" />
            Add Area
          </Button>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">Portfolio</h3>
          <Textarea
            value={formData.portfolioText}
            onChange={(e) => setFormData((prev) => ({ ...prev, portfolioText: e.target.value }))}
            rows={4}
            placeholder="Paste image URLs (one per line)"
          />
        </Card>

        <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </Button>
      </div>
    </PageLayout>
  );
}
