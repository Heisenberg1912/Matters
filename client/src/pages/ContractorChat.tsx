import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageLayout from "@/components/page-layout";
import { FileUploader } from "@/components/file-uploader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Send, Paperclip, Image as ImageIcon, Mic } from "lucide-react";
import { useSwipe } from "@/hooks/use-swipe";
import { useNotifications } from "@/hooks/use-notifications";
import { useProject } from "@/context/ProjectContext";
import { useChatStore, useTeamStore } from "@/store";

const assistantContact = {
  id: "assistant",
  name: "Builtattic Assistant",
  role: "Project AI",
  online: true,
};

export default function ContractorChat() {
  const [searchParams] = useSearchParams();
  const [messageText, setMessageText] = useState("");
  const [showContacts, setShowContacts] = useState(false);
  const { showToast } = useNotifications();
  const { currentProject } = useProject();

  const teamMembers = useTeamStore((state) => state.members);
  const loadHistory = useChatStore((state) => state.loadHistory);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const analyzeImage = useChatStore((state) => state.analyzeImage);
  const messages = useChatStore((state) => state.messages);
  const isLoading = useChatStore((state) => state.isLoading);
  const chatError = useChatStore((state) => state.error);

  const contacts = useMemo(
    () => [
      assistantContact,
      ...teamMembers.map((member) => ({
        id: member.id,
        name: member.name,
        role: member.role,
        online: member.status === "active",
      })),
    ],
    [teamMembers]
  );

  const defaultContactId = searchParams.get("contactId") || assistantContact.id;
  const [selectedContactId, setSelectedContactId] = useState(defaultContactId);

  useEffect(() => {
    if (currentProject?._id) {
      loadHistory(currentProject._id);
    }
  }, [currentProject?._id, loadHistory]);

  useEffect(() => {
    if (searchParams.get("contactId")) {
      setSelectedContactId(searchParams.get("contactId") as string);
    }
  }, [searchParams]);

  const selectedContact =
    contacts.find((contact) => contact.id === selectedContactId) || assistantContact;
  const isAssistant = selectedContact.id === assistantContact.id;

  const { bind: swipeChat } = useSwipe({
    onSwipedRight: () => setShowContacts(true),
    onSwipedLeft: () => setShowContacts(false)
  });

  const handleSend = async () => {
    if (!messageText.trim()) return;
    if (!currentProject?._id) {
      showToast({ type: "warning", message: "Select a project first" });
      return;
    }
    if (!isAssistant) {
      showToast({ type: "info", message: "Direct messaging is coming soon" });
      return;
    }
    try {
      await sendMessage(messageText.trim(), currentProject._id);
      setMessageText("");
    } catch (error) {
      showToast({ type: "error", message: "Failed to send message" });
    }
  };

  const handleUpload = async (files: File[]) => {
    if (!isAssistant) {
      showToast({ type: "info", message: "Image analysis works with the assistant only" });
      return;
    }
    const file = files.find((item) => item.type.startsWith("image/"));
    if (!file) {
      showToast({ type: "warning", message: "Upload an image to analyze" });
      return;
    }
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    try {
      await analyzeImage(base64, "Analyze this site image");
      showToast({ type: "success", message: "Image analyzed" });
    } catch (error) {
      showToast({ type: "error", message: "Failed to analyze image" });
    }
  };

  return (
    <PageLayout
      title="Project Chat"
      showModeToggle={false}
      contentClassName="px-4 xs:px-5 sm:px-6 md:px-10 lg:px-24"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 xs:gap-6 sm:gap-8 pt-4 xs:pt-6 sm:pt-10 lg:flex-row" {...swipeChat()}>
        <div className="flex items-center justify-between lg:hidden">
          <h2 className="text-xl xs:text-2xl font-semibold text-white">Messages</h2>
          <button
            type="button"
            className="rounded-full border border-[#2a2a2a] px-3 xs:px-4 py-2 text-xs xs:text-sm font-semibold text-white touch-target focus-ring"
            onClick={() => setShowContacts((prev) => !prev)}
          >
            {showContacts ? "Hide contacts" : "View contacts"}
          </button>
        </div>

        {/* Contacts List */}
        <div className={`w-full flex-shrink-0 lg:w-[360px] ${showContacts ? "" : "hidden lg:block"}`}>
          <h2 className="text-2xl xs:text-3xl font-bold tracking-tight text-white">Contacts</h2>
          <div className="mt-4 xs:mt-6 sm:mt-8 space-y-3 xs:space-y-4">
            {contacts.map((contact) => (
              <Card
                key={contact.id}
                className={`cursor-pointer border bg-[#101010] p-4 xs:p-5 sm:p-6 transition touch-target ${
                  selectedContact.id === contact.id
                    ? "border-[#cfe0ad]"
                    : "border-[#2a2a2a] hover:border-[#3a3a3a]"
                }`}
                onClick={() => {
                  setSelectedContactId(contact.id);
                  setShowContacts(false);
                }}
              >
                <div className="flex items-center gap-3 xs:gap-4">
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 border-2 border-[#2a2a2a]">
                      <AvatarFallback className="text-base xs:text-lg sm:text-xl">
                        {contact.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    {contact.online && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 rounded-full border-2 border-[#101010] bg-[#4ade80]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-white truncate">{contact.name}</h3>
                      <span className="text-xs xs:text-sm text-[#8a8a8a] shrink-0">{contact.id === "assistant" ? "Live" : "Team"}</span>
                    </div>
                    <p className="text-sm xs:text-base text-[#8a8a8a]">{contact.role}</p>
                    <p className="mt-1 xs:mt-2 truncate text-sm xs:text-base text-[#bdbdbd]">
                      {contact.id === "assistant" ? "Project insights available" : "Direct chat coming soon"}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          <Card className="flex flex-1 flex-col rounded-[20px] xs:rounded-[26px] sm:rounded-[32px] border border-[#2a2a2a] bg-[#0a0a0a]">
            {/* Chat Header */}
            <div className="flex flex-wrap items-center gap-3 xs:gap-4 border-b border-[#2a2a2a] p-4 xs:p-5 sm:p-6 md:p-8">
              <div className="relative shrink-0">
                <Avatar className="h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 border-2 border-[#2a2a2a]">
                  <AvatarFallback className="text-base xs:text-lg sm:text-xl">
                    {selectedContact.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                {selectedContact.online && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 rounded-full border-2 border-[#0a0a0a] bg-[#4ade80]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold text-white truncate">{selectedContact.name}</h3>
                <p className="text-sm xs:text-base sm:text-lg text-[#8a8a8a]">
                  {selectedContact.online ? "Online" : "Offline"} | {selectedContact.role}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-[#2a2a2a] px-3 py-2 text-xs xs:text-sm font-semibold text-white lg:hidden touch-target focus-ring"
                onClick={() => setShowContacts(true)}
              >
                Contacts
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 xs:p-5 sm:p-6 md:p-8">
              {chatError && (
                <Card className="mb-4 border border-red-500/40 bg-red-500/10 p-3 xs:p-4 text-sm xs:text-base text-red-200">
                  {chatError}
                </Card>
              )}
              {!isAssistant && (
                <Card className="border border-[#2a2a2a] bg-[#101010] p-3 xs:p-4 text-sm xs:text-base text-[#bdbdbd]">
                  Direct contractor messaging is coming soon. Switch to the assistant for immediate help.
                </Card>
              )}
              {isAssistant && (
                <div className="space-y-4 xs:space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.timestamp}-${index}`}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] xs:max-w-[80%] rounded-[16px] xs:rounded-[20px] sm:rounded-[24px] px-4 xs:px-5 py-3 xs:py-4 ${
                          message.role === "user"
                            ? "bg-[#cfe0ad] text-black"
                            : "border border-[#2a2a2a] bg-[#151515] text-white"
                        }`}
                      >
                        {message.role !== "user" && (
                          <p className="mb-1 text-xs xs:text-sm font-semibold text-[#cfe0ad]">{selectedContact.name}</p>
                        )}
                        <p className="text-sm xs:text-base sm:text-lg whitespace-pre-line">{message.content}</p>
                        <p
                          className={`mt-2 text-right text-xs xs:text-sm ${
                            message.role === "user" ? "text-black/60" : "text-[#8a8a8a]"
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <Card className="border border-[#2a2a2a] bg-[#101010] p-3 xs:p-4 text-sm xs:text-base text-[#bdbdbd]">
                      Start a conversation with the assistant.
                    </Card>
                  )}
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-[#2a2a2a] p-3 xs:p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 xs:gap-3 sm:gap-4">
                <button
                  type="button"
                  className="flex h-10 w-10 xs:h-11 xs:w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#151515] text-[#bdbdbd] transition hover:border-[#3a3a3a] hover:text-white touch-target focus-ring"
                >
                  <Paperclip size={18} className="xs:w-5 xs:h-5 sm:w-[22px] sm:h-[22px]" />
                </button>
                <button
                  type="button"
                  className="flex h-10 w-10 xs:h-11 xs:w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#151515] text-[#bdbdbd] transition hover:border-[#3a3a3a] hover:text-white touch-target focus-ring"
                >
                  <ImageIcon size={18} className="xs:w-5 xs:h-5 sm:w-[22px] sm:h-[22px]" />
                </button>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={isAssistant ? "Type your message..." : "Select the assistant to chat"}
                  className="flex-1 min-w-0 rounded-full border border-[#2a2a2a] bg-[#151515] px-4 xs:px-5 sm:px-6 py-2 xs:py-2.5 sm:py-3 text-sm xs:text-base text-white placeholder-[#6a6a6a] outline-none focus:border-[#cfe0ad] touch-target"
                  disabled={!isAssistant || !currentProject?._id}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSend();
                    }
                  }}
                />
                <button
                  type="button"
                  className="flex h-10 w-10 xs:h-11 xs:w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#151515] text-[#bdbdbd] transition hover:border-[#3a3a3a] hover:text-white touch-target focus-ring"
                >
                  <Mic size={18} className="xs:w-5 xs:h-5 sm:w-[22px] sm:h-[22px]" />
                </button>
                <button
                  type="button"
                  className="flex h-10 w-10 xs:h-11 xs:w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#cfe0ad] text-black transition hover:bg-[#d4e4b8] disabled:opacity-60 touch-target focus-ring"
                  onClick={handleSend}
                  disabled={!isAssistant || isLoading || !currentProject?._id}
                >
                  <Send size={18} className="xs:w-5 xs:h-5 sm:w-[22px] sm:h-[22px]" />
                </button>
              </div>
              <div className="mt-3 xs:mt-4">
                <FileUploader
                  accept={["application/pdf", "image/*"]}
                  maxSize={10 * 1024 * 1024}
                  captureCamera
                  helperText="Attach docs or snap a quick photo"
                  onUpload={handleUpload}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
