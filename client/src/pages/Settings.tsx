import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/bottom-nav";
import { EmptyState } from "@/components/empty-state";
import { FileUploader } from "@/components/file-uploader";
import PhoneShell from "@/components/phone-shell";
import { SearchBar } from "@/components/search-bar";
import { Fab } from "@/components/fab";
import { useNotifications } from "@/hooks/use-notifications";
import { useOffline } from "@/hooks/use-offline";
import { useTheme } from "@/hooks/use-theme";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const preferences = ["Email alerts", "SMS alerts", "Weekly reports", "Product updates"];
const languages = ["English", "Hindi", "Spanish", "French"];

export default function Settings() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const { isOnline, queue, lastSynced, syncNow } = useOffline();
  const { showToast } = useNotifications();
  const [language, setLanguage] = useState("English");
  const [profileName, setProfileName] = useState("Guest User");
  const navigate = useNavigate();

  const menuItems = [
    { label: "Your Subscription", path: "/subscription" },
    { label: "Hire a Contractor", path: "/hire-contractor" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "News & Updates", path: "/news-updates" },
    { label: "Visit Builtattic", path: "/visit-builtattic" },
    { label: "Settings", path: "/settings" }
  ];

  const handleSave = () => {
    showToast({ type: "success", message: "Settings saved", description: "Your preferences are updated" });
  };

  return (
    <PhoneShell>
      <Sheet>
        <div className="flex h-full flex-col">
          <header className="flex flex-wrap items-center gap-6 rounded-b-[60px] border-b border-[#1f1f1f] bg-[#050505] px-6 py-10 md:flex-nowrap md:px-12 lg:px-6 md:px-10 lg:px-6 md:px-10 lg:px-24 lg:py-16">
            <SheetTrigger asChild>
              <button type="button">
                <Avatar className="h-14 w-14 border-2 border-[#232323]">
                  <AvatarFallback>G</AvatarFallback>
                </Avatar>
              </button>
            </SheetTrigger>

            <div className="flex flex-col text-white">
              <span className="text-2xl font-semibold md:text-3xl">Settings & Profile</span>
              <span className="text-sm uppercase tracking-[0.25em] text-[#c7c7c7]">Personalize your workspace</span>
            </div>

            <div className="ml-auto flex items-center gap-3 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] p-2 text-sm font-semibold">
              <span className="rounded-full bg-[#cfe0ad] px-3 py-1 text-black">{isOnline ? "Online" : "Offline"}</span>
              <span className="text-[#b7b7b7]">Synced {lastSynced ? new Date(lastSynced).toLocaleTimeString() : "—"}</span>
              <button
                type="button"
                className="rounded-full bg-[#cfe0ad] px-3 py-1 text-black"
                onClick={() => {
                  syncNow();
                  showToast({ type: "info", message: "Sync triggered" });
                }}
              >
                Sync
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 pb-32 md:px-10 lg:px-6 md:px-10 lg:px-6 md:px-10 lg:px-24">
            <div className="mx-auto w-full max-w-6xl space-y-12 py-8 md:py-12">
              <SearchBar placeholder="Search settings" />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="col-span-2 space-y-6 rounded-[32px] border border-[#2a2a2a] bg-[#0d0d0d] p-8">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
                    <div className="h-20 w-20 overflow-hidden rounded-full border border-[#2a2a2a]">
                      <Avatar className="h-full w-full">
                        <AvatarFallback className="text-xl">{profileName.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 space-y-3">
                      <label className="text-sm uppercase tracking-[0.25em] text-[#8a8a8a]">Display Name</label>
                      <input
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-4 py-3 text-lg text-white outline-none focus:border-[#cfe0ad]"
                      />
                    </div>
                  </div>
                  <FileUploader
                    label="Upload profile photo"
                    accept={["image/*"]}
                    maxSize={5 * 1024 * 1024}
                    captureCamera
                    helperText="Use your phone camera or upload from files"
                    onUpload={() => showToast({ type: "success", message: "Photo uploaded" })}
                  />
                  <div className="flex flex-wrap gap-3">
                    {preferences.map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        className="rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#cfe0ad]"
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Theme</p>
                      <p className="text-lg text-white">Current: {resolvedTheme}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {(["light", "dark", "system"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setTheme(option)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${
                            theme === option ? "bg-[#cfe0ad] text-black" : "border border-[#2a2a2a] text-white"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="rounded-full border border-[#2a2a2a] px-4 py-2 text-sm text-white"
                        onClick={toggleTheme}
                      >
                        Toggle
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Language</p>
                      <p className="text-lg text-white">{language}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {languages.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setLanguage(lang)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${
                            language === lang ? "bg-[#cfe0ad] text-black" : "border border-[#2a2a2a] text-white"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="rounded-full bg-[#cfe0ad] px-6 py-3 text-sm font-semibold text-black"
                      onClick={handleSave}
                    >
                      Save changes
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-[#2a2a2a] px-6 py-3 text-sm font-semibold text-white"
                      onClick={() =>
                        showToast({ type: "info", message: "Notifications updated", description: "Preferences refreshed" })
                      }
                    >
                      Refresh notifications
                    </button>
                  </div>
                </Card>

                <div className="space-y-4">
                  <Card className="space-y-3 rounded-[32px] border border-[#2a2a2a] bg-[#0f0f0f] p-6">
                    <p className="text-lg font-semibold text-white">Offline queue</p>
                    {queue.length === 0 ? (
                      <EmptyState title="No queued actions" description="Everything is synced" className="p-4" />
                    ) : (
                      <div className="space-y-2 text-sm text-[#cfcfcf]">
                        {queue.map((item) => (
                          <div key={item.id} className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-3">
                            <p className="font-semibold text-white">{item.type}</p>
                            <p className="text-xs text-[#8a8a8a]">{JSON.stringify(item.payload)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  <Card className="space-y-3 rounded-[32px] border border-[#2a2a2a] bg-[#0f0f0f] p-6">
                    <p className="text-lg font-semibold text-white">Security</p>
                    <p className="text-sm text-[#b9b9b9]">Two-factor authentication and session controls</p>
                    <button
                      type="button"
                      className="rounded-full border border-[#2a2a2a] px-4 py-2 text-sm font-semibold text-white"
                      onClick={() => showToast({ type: "success", message: "2FA enabled" })}
                    >
                      Enable 2FA
                    </button>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          <Fab label="Help" onClick={() => showToast({ type: "info", message: "Need help?", description: "We are here for you" })} />
          <BottomNav />
        </div>

        <SheetContent>
          <div className="space-y-10 text-2xl">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="w-full text-left font-medium transition hover:text-[#cfe0ad]"
              >
                {item.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </PhoneShell>
  );
}
