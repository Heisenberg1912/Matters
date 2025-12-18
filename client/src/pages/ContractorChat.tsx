import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/bottom-nav";
import { FileUploader } from "@/components/file-uploader";
import PhoneShell from "@/components/phone-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Send, Paperclip, Image as ImageIcon, Mic } from "lucide-react";
import { useSwipe } from "@/hooks/use-swipe";
import { useNotifications } from "@/hooks/use-notifications";

const chatContacts = [
  {
    id: "1",
    name: "Rajesh Kumar",
    role: "Site Supervisor",
    lastMessage: "Foundation work completed. Moving to next phase.",
    time: "10:30 AM",
    unread: 2,
    online: true
  },
  {
    id: "2",
    name: "Amit Sharma",
    role: "Electrician",
    lastMessage: "Wiring layout approved. Starting tomorrow.",
    time: "Yesterday",
    unread: 0,
    online: false
  },
  {
    id: "3",
    name: "Vikram Patel",
    role: "Plumber",
    lastMessage: "Need pipe measurements for bathroom",
    time: "2 days ago",
    unread: 1,
    online: true
  },
  {
    id: "4",
    name: "Suresh Verma",
    role: "Carpenter",
    lastMessage: "Door frames ready for installation",
    time: "3 days ago",
    unread: 0,
    online: false
  }
];

const messages = [
  {
    id: "1",
    sender: "Rajesh Kumar",
    text: "Good morning! Foundation work is progressing well.",
    time: "9:15 AM",
    isOwn: false
  },
  {
    id: "2",
    sender: "You",
    text: "Great! When do you expect to complete this phase?",
    time: "9:18 AM",
    isOwn: true
  },
  {
    id: "3",
    sender: "Rajesh Kumar",
    text: "We should be done by end of day. The concrete curing is on schedule.",
    time: "9:22 AM",
    isOwn: false
  },
  {
    id: "4",
    sender: "You",
    text: "Perfect. Please send me photos of the completed work.",
    time: "9:25 AM",
    isOwn: true
  },
  {
    id: "5",
    sender: "Rajesh Kumar",
    text: "Will do. I'll send them before evening.",
    time: "9:28 AM",
    isOwn: false
  },
  {
    id: "6",
    sender: "Rajesh Kumar",
    text: "Foundation work completed. Moving to next phase.",
    time: "10:30 AM",
    isOwn: false
  }
];

export default function ContractorChat() {
  const [mode, setMode] = useState<"construction" | "refurbish">("construction");
  const [selectedContact, setSelectedContact] = useState(chatContacts[0]);
  const [messageText, setMessageText] = useState("");
  const [showContacts, setShowContacts] = useState(false);
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const menuItems = [
    { label: "Your Subscription", path: "/subscription" },
    { label: "Hire a Contractor", path: "/hire-contractor" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "News & Updates", path: "/news-updates" },
    { label: "Visit Builtattic", path: "/visit-builtattic" },
    { label: "Settings", path: "/settings" }
  ];

  const { bind: swipeChat } = useSwipe({
    onSwipedRight: () => setShowContacts(true),
    onSwipedLeft: () => setShowContacts(false)
  });

  return (
    <PhoneShell>
      <Sheet>
        <div className="flex h-full flex-col">
          <header className="flex flex-wrap items-center gap-6 rounded-b-[60px] border-b border-[#1f1f1f] bg-[#050505] px-6 py-10 md:flex-nowrap md:px-10 lg:px-24 lg:py-16">
            <SheetTrigger asChild>
              <button type="button">
                <Avatar className="h-16 w-16 border-2 border-[#232323]">
                  <AvatarFallback>G</AvatarFallback>
                </Avatar>
              </button>
            </SheetTrigger>

            <div className="flex flex-col text-white">
              <span className="text-3xl font-semibold">Oh Hi, Guest!</span>
              <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">Contractor Chat</span>
            </div>

            <div className="ml-auto flex rounded-full border border-[#2a2a2a] bg-[#0c0c0c] p-2 text-base font-semibold">
              {(["construction", "refurbish"] as const).map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => setMode(state)}
                  className={`rounded-full px-6 py-2 transition ${
                    mode === state ? "bg-[var(--pill,#cfe0ad)] text-black" : "text-white"
                  }`}
                >
                  {state.toUpperCase()}
                </button>
              ))}
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden px-6 md:px-10 lg:px-24 pb-32">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pt-12 lg:flex-row" {...swipeChat()}>
              <div className="flex items-center justify-between lg:hidden">
                <h2 className="text-2xl font-semibold text-white">Messages</h2>
                <button
                  type="button"
                  className="rounded-full border border-[#2a2a2a] px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => setShowContacts((prev) => !prev)}
                >
                  {showContacts ? "Hide contacts" : "View contacts"}
                </button>
              </div>
              {/* Contacts List */}
              <div className={`w-full flex-shrink-0 lg:w-[360px] ${showContacts ? "" : "hidden lg:block"}`}>
                <h2 className="text-3xl font-bold tracking-tight text-white">Contacts</h2>
                <div className="mt-8 space-y-4">
                  {chatContacts.map((contact) => (
                    <Card
                      key={contact.id}
                      className={`cursor-pointer border bg-[#101010] p-6 transition ${
                        selectedContact.id === contact.id
                          ? "border-[#cfe0ad]"
                          : "border-[#2a2a2a] hover:border-[#3a3a3a]"
                      }`}
                      onClick={() => {
                        setSelectedContact(contact);
                        setShowContacts(false);
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-16 w-16 border-2 border-[#2a2a2a]">
                            <AvatarFallback className="text-xl">
                              {contact.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          {contact.online && (
                            <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full border-2 border-[#101010] bg-[#4ade80]" />
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-baseline justify-between">
                            <h3 className="text-xl font-semibold text-white">{contact.name}</h3>
                            <span className="text-sm text-[#8a8a8a]">{contact.time}</span>
                          </div>
                          <p className="text-base text-[#8a8a8a]">{contact.role}</p>
                          <p className="mt-2 truncate text-base text-[#bdbdbd]">{contact.lastMessage}</p>
                        </div>
                        {contact.unread > 0 && (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#cfe0ad] text-sm font-bold text-black">
                            {contact.unread}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex flex-1 flex-col">
                <Card className="flex flex-1 flex-col rounded-[32px] border border-[#2a2a2a] bg-[#0a0a0a]">
                  {/* Chat Header */}
                  <div className="flex flex-wrap items-center gap-4 border-b border-[#2a2a2a] p-6 sm:p-8">
                    <div className="relative">
                      <Avatar className="h-16 w-16 border-2 border-[#2a2a2a]">
                        <AvatarFallback className="text-xl">
                          {selectedContact.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      {selectedContact.online && (
                        <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full border-2 border-[#0a0a0a] bg-[#4ade80]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-2xl font-semibold text-white">{selectedContact.name}</h3>
                      <p className="text-lg text-[#8a8a8a]">
                        {selectedContact.online ? "Online" : "Offline"} | {selectedContact.role}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="ml-auto rounded-full border border-[#2a2a2a] px-3 py-2 text-sm font-semibold text-white lg:hidden"
                      onClick={() => setShowContacts(true)}
                    >
                      Contacts
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                    <div className="space-y-6">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-[24px] px-5 py-4 ${
                              message.isOwn
                                ? "bg-[#cfe0ad] text-black"
                                : "border border-[#2a2a2a] bg-[#151515] text-white"
                            }`}
                          >
                            {!message.isOwn && (
                              <p className="mb-1 text-sm font-semibold text-[#cfe0ad]">{message.sender}</p>
                            )}
                            <p className="text-base sm:text-lg">{message.text}</p>
                            <p
                              className={`mt-2 text-right text-sm ${
                                message.isOwn ? "text-black/60" : "text-[#8a8a8a]"
                              }`}
                            >
                              {message.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-[#2a2a2a] p-4 sm:p-6">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      <button
                        type="button"
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#151515] text-[#bdbdbd] transition hover:border-[#3a3a3a] hover:text-white"
                      >
                        <Paperclip size={22} />
                      </button>
                      <button
                        type="button"
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#151515] text-[#bdbdbd] transition hover:border-[#3a3a3a] hover:text-white"
                      >
                        <ImageIcon size={22} />
                      </button>
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 rounded-full border border-[#2a2a2a] bg-[#151515] px-6 py-3 text-base text-white placeholder-[#6a6a6a] outline-none focus:border-[#cfe0ad]"
                      />
                      <button
                        type="button"
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#151515] text-[#bdbdbd] transition hover:border-[#3a3a3a] hover:text-white"
                      >
                        <Mic size={22} />
                      </button>
                      <button
                        type="button"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#cfe0ad] text-black transition hover:bg-[#d4e4b8]"
                        onClick={() => {
                          showToast({ type: "success", message: "Message sent" });
                          setMessageText("");
                        }}
                      >
                        <Send size={22} />
                      </button>
                    </div>
                    <div className="mt-4">
                      <FileUploader
                        accept={["application/pdf", "image/*"]}
                        maxSize={10 * 1024 * 1024}
                        captureCamera
                        helperText="Attach docs or snap a quick photo"
                        onUpload={(files) =>
                          showToast({
                            type: "success",
                            message: "Files attached",
                            description: `${files.length} file(s)`
                          })
                        }
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

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
