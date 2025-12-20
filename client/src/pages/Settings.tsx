import { useEffect, useState } from "react";
import PageLayout from "@/components/page-layout";
import { EmptyState } from "@/components/empty-state";
import { FileUploader } from "@/components/file-uploader";
import { SearchBar } from "@/components/search-bar";
import { Fab } from "@/components/fab";
import { useNotifications } from "@/hooks/use-notifications";
import { useOffline } from "@/hooks/use-offline";
import { useTheme } from "@/hooks/use-theme";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

const preferences = ["Email alerts", "SMS alerts", "Weekly reports", "Product updates"];
const languages = ["English", "Hindi", "Spanish", "French"];

export default function Settings() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const { isOnline, queue, lastSynced, syncNow } = useOffline();
  const { showToast } = useNotifications();
  const { user, updateProfile } = useAuth();
  const { isInstallable, isInstalled, install } = useInstallPrompt();

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      showToast({ type: "success", message: "App installed successfully!" });
    }
  };
  const [language, setLanguage] = useState("English");
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    company: "",
    specializations: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        company: user.company || "",
        specializations: user.specializations?.join(", ") || "",
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: profileForm.name.trim() || user?.name,
        phone: profileForm.phone.trim(),
        company: profileForm.company.trim() || undefined,
        specializations: profileForm.specializations
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      showToast({ type: "success", message: "Profile updated" });
    } catch (error) {
      showToast({ type: "error", message: "Failed to update profile" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const syncStatus = (
    <div className="flex items-center gap-2 xs:gap-3 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-2 xs:px-3 py-1.5 xs:py-2 text-xs font-semibold">
      <span className="rounded-full bg-[#cfe0ad] px-2 xs:px-3 py-0.5 xs:py-1 text-black">{isOnline ? "Online" : "Offline"}</span>
      <span className="text-[#b7b7b7] hidden xs:inline">Synced {lastSynced ? new Date(lastSynced).toLocaleTimeString() : "-"}</span>
      <button
        type="button"
        className="rounded-full bg-[#cfe0ad] px-2 xs:px-3 py-0.5 xs:py-1 text-black touch-target"
        onClick={() => {
          syncNow();
          showToast({ type: "info", message: "Sync triggered" });
        }}
      >
        Sync
      </button>
    </div>
  );

  return (
    <PageLayout
      title="Settings & Profile"
      showModeToggle={false}
      extras={syncStatus}
      contentClassName="px-4 xs:px-5 sm:px-6 md:px-10 lg:px-24"
    >
      <div className="mx-auto w-full max-w-6xl space-y-8 xs:space-y-10 sm:space-y-12 py-4 xs:py-6 sm:py-8 md:py-12">
        <SearchBar placeholder="Search settings" />

        <div className="grid grid-cols-1 gap-4 xs:gap-6 lg:grid-cols-3">
          <Card className="col-span-1 lg:col-span-2 space-y-4 xs:space-y-6 rounded-[24px] xs:rounded-[28px] sm:rounded-[32px] border border-[#2a2a2a] bg-[#0d0d0d] p-4 xs:p-6 sm:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
              <div className="h-16 w-16 xs:h-18 xs:w-18 sm:h-20 sm:w-20 overflow-hidden rounded-full border border-[#2a2a2a] shrink-0">
                <Avatar className="h-full w-full">
                  <AvatarFallback className="text-base xs:text-lg sm:text-xl">{profileForm.name.slice(0, 2) || "GU"}</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 space-y-2 xs:space-y-3">
                <label className="text-xs uppercase tracking-[0.2em] xs:tracking-[0.25em] text-[#8a8a8a]">Display Name</label>
                <input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl xs:rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-3 xs:px-4 py-2 xs:py-3 text-sm xs:text-base text-white outline-none focus:border-[#cfe0ad] touch-target"
                />
                <p className="text-xs text-[#8a8a8a]">Profile email: {user?.email || "guest@matters.local"}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 xs:gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] xs:tracking-[0.25em] text-[#8a8a8a]">Phone</label>
                <input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="mt-2 w-full rounded-xl xs:rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-3 xs:px-4 py-2 xs:py-3 text-sm xs:text-base text-white outline-none focus:border-[#cfe0ad] touch-target"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] xs:tracking-[0.25em] text-[#8a8a8a]">Company</label>
                <input
                  value={profileForm.company}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, company: e.target.value }))}
                  className="mt-2 w-full rounded-xl xs:rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-3 xs:px-4 py-2 xs:py-3 text-sm xs:text-base text-white outline-none focus:border-[#cfe0ad] touch-target"
                />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] xs:tracking-[0.25em] text-[#8a8a8a]">Specializations</label>
              <input
                value={profileForm.specializations}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, specializations: e.target.value }))}
                placeholder="e.g., Electrical, Plumbing"
                className="mt-2 w-full rounded-xl xs:rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-3 xs:px-4 py-2 xs:py-3 text-sm xs:text-base text-white outline-none focus:border-[#cfe0ad] touch-target"
              />
            </div>
            <FileUploader
              label="Upload profile photo"
              accept={["image/*"]}
              maxSize={5 * 1024 * 1024}
              captureCamera
              helperText="Use your phone camera or upload from files"
              onUpload={() => showToast({ type: "success", message: "Photo uploaded" })}
            />
            <div className="flex flex-wrap gap-2 xs:gap-3">
              {preferences.map((pref) => (
                <button
                  key={pref}
                  type="button"
                  className="rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm font-semibold text-white transition hover:border-[#cfe0ad] touch-target focus-ring"
                >
                  {pref}
                </button>
              ))}
            </div>
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4 rounded-xl xs:rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-3 xs:p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Theme</p>
                <p className="text-sm xs:text-base text-white">Current: {resolvedTheme}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 xs:gap-3">
                {(["light", "dark", "system"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTheme(option)}
                    className={`rounded-full px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm font-semibold touch-target ${
                      theme === option ? "bg-[#cfe0ad] text-black" : "border border-[#2a2a2a] text-white"
                    }`}
                  >
                    {option}
                  </button>
                ))}
                <button
                  type="button"
                  className="rounded-full border border-[#2a2a2a] px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm text-white touch-target"
                  onClick={toggleTheme}
                >
                  Toggle
                </button>
              </div>
            </div>
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4 rounded-xl xs:rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-3 xs:p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Language</p>
                <p className="text-sm xs:text-base text-white">{language}</p>
              </div>
              <div className="flex flex-wrap gap-2 xs:gap-3">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`rounded-full px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm font-semibold touch-target ${
                      language === lang ? "bg-[#cfe0ad] text-black" : "border border-[#2a2a2a] text-white"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 xs:gap-3">
              <button
                type="button"
                className="rounded-full bg-[#cfe0ad] px-4 xs:px-6 py-2 xs:py-3 text-xs xs:text-sm font-semibold text-black disabled:opacity-60 touch-target focus-ring"
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                className="rounded-full border border-[#2a2a2a] px-4 xs:px-6 py-2 xs:py-3 text-xs xs:text-sm font-semibold text-white touch-target focus-ring"
                onClick={() =>
                  showToast({ type: "info", message: "Notifications updated", description: "Preferences refreshed" })
                }
              >
                Refresh notifications
              </button>
            </div>
          </Card>

          <div className="space-y-3 xs:space-y-4">
            <Card className="space-y-2 xs:space-y-3 rounded-[24px] xs:rounded-[28px] sm:rounded-[32px] border border-[#2a2a2a] bg-[#0f0f0f] p-4 xs:p-5 sm:p-6">
              <p className="text-base xs:text-lg font-semibold text-white">Offline queue</p>
              {queue.length === 0 ? (
                <EmptyState title="No queued actions" description="Everything is synced" className="p-3 xs:p-4" />
              ) : (
                <div className="space-y-2 text-xs xs:text-sm text-[#cfcfcf]">
                  {queue.map((item) => (
                    <div key={item.id} className="rounded-lg xs:rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-2 xs:p-3">
                      <p className="font-semibold text-white">{item.type}</p>
                      <p className="text-xs text-[#8a8a8a] truncate">{JSON.stringify(item.payload)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="space-y-3 xs:space-y-4 rounded-[24px] xs:rounded-[28px] sm:rounded-[32px] border border-[#2a2a2a] bg-[#0f0f0f] p-4 xs:p-5 sm:p-6">
              <p className="text-base xs:text-lg font-semibold text-white">Session</p>
              <p className="text-xs xs:text-sm text-[#b9b9b9]">
                Authentication is disabled. This workspace runs in guest mode.
              </p>
              <div className="rounded-xl border border-[#1f1f1f] bg-[#0b0b0b] p-3 text-xs xs:text-sm text-[#cfcfcf]">
                Profile updates are saved to your session and local storage.
              </div>
            </Card>

            <Card className="space-y-3 xs:space-y-4 rounded-[24px] xs:rounded-[28px] sm:rounded-[32px] border border-[#2a2a2a] bg-[#0f0f0f] p-4 xs:p-5 sm:p-6">
              <p className="text-base xs:text-lg font-semibold text-white">Install App</p>
              <p className="text-xs xs:text-sm text-[#b9b9b9]">
                {isInstalled
                  ? "App is installed! You can access it from your home screen."
                  : "Install Matters on your device for quick access and offline support."}
              </p>
              {isInstalled ? (
                <div className="flex items-center gap-2 text-[#cfe0ad]">
                  <svg className="h-4 w-4 xs:h-5 xs:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs xs:text-sm font-medium">Installed</span>
                </div>
              ) : isInstallable ? (
                <button
                  type="button"
                  className="rounded-full bg-[#cfe0ad] px-4 xs:px-6 py-2 xs:py-3 text-xs xs:text-sm font-semibold text-black touch-target focus-ring"
                  onClick={handleInstall}
                >
                  Install App
                </button>
              ) : (
                <p className="text-xs text-[#8a8a8a]">
                  Use Chrome, Edge, or Safari to install this app on your device.
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>

      <Fab label="Help" onClick={() => showToast({ type: "info", message: "Need help?", description: "We are here for you" })} />
    </PageLayout>
  );
}
