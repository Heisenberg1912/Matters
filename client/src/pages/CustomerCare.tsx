import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/bottom-nav";
import { FileUploader } from "@/components/file-uploader";
import PhoneShell from "@/components/phone-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Phone, Mail, MessageCircle, HelpCircle, FileText, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";

const supportChannels = [
  {
    id: "1",
    icon: Phone,
    title: "Call Support",
    description: "Speak directly with our support team",
    contact: "+91 1800 123 4567",
    availability: "24/7 Available",
    color: "#cfe0ad"
  },
  {
    id: "2",
    icon: Mail,
    title: "Email Support",
    description: "Send us your queries via email",
    contact: "support@builtattic.com",
    availability: "Response within 24 hours",
    color: "#b8d4f1"
  },
  {
    id: "3",
    icon: MessageCircle,
    title: "Live Chat",
    description: "Chat with our support agents",
    contact: "Click to start chat",
    availability: "Mon-Sat, 9 AM - 6 PM",
    color: "#f3c5a8"
  }
];

const faqs = [
  {
    id: "1",
    question: "How do I track my project progress?",
    answer: "You can track your project progress through the Home screen which shows current phase, completion percentage, and daily insights. The Schedule page provides detailed timeline information."
  },
  {
    id: "2",
    question: "Can I add multiple contractors to my project?",
    answer: "Yes, you can add unlimited contractors to your project. Go to the Contractor page and click 'Add New Contractor' to invite team members."
  },
  {
    id: "3",
    question: "How do I manage my project budget?",
    answer: "The Budget page allows you to allocate funds across different categories, track expenses, and monitor spending. You can also add new expenses and view detailed breakdowns."
  },
  {
    id: "4",
    question: "What file formats are supported for plans?",
    answer: "We support common image formats (JPG, PNG) and PDF files for architectural plans and drawings. Maximum file size is 10MB per upload."
  },
  {
    id: "5",
    question: "How do I communicate with my contractors?",
    answer: "Use the Contractor Chat feature to send messages, share files, and coordinate with your team in real-time. All conversations are securely stored."
  }
];

const recentTickets = [
  {
    id: "T-2025-001",
    title: "Unable to upload floor plans",
    category: "Technical",
    status: "resolved",
    createdAt: "Dec 15, 2025",
    resolvedAt: "Dec 16, 2025"
  },
  {
    id: "T-2025-002",
    title: "Budget calculation discrepancy",
    category: "Billing",
    status: "in-progress",
    createdAt: "Dec 17, 2025",
    resolvedAt: null
  },
  {
    id: "T-2025-003",
    title: "Contractor not receiving notifications",
    category: "Technical",
    status: "pending",
    createdAt: "Dec 18, 2025",
    resolvedAt: null
  }
];

export default function CustomerCare() {
  const [mode, setMode] = useState<"construction" | "refurbish">("construction");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle2 size={20} className="text-[#4ade80]" />;
      case "in-progress":
        return <Clock size={20} className="text-[#cfe0ad]" />;
      case "pending":
        return <AlertCircle size={20} className="text-[#f3c5a8]" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]";
      case "in-progress":
        return "bg-[#cfe0ad]/10 text-[#cfe0ad] border-[#cfe0ad]";
      case "pending":
        return "bg-[#f3c5a8]/10 text-[#f3c5a8] border-[#f3c5a8]";
      default:
        return "";
    }
  };

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
              <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">Customer Care</span>
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

          <div className="flex-1 overflow-y-auto px-6 md:px-10 lg:px-24 pb-32">
            <div className="mx-auto w-full max-w-6xl">
              <section className="mt-16">
                <h2 className="text-4xl font-bold tracking-tight text-white">How Can We Help?</h2>
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {supportChannels.map((channel) => {
                    const Icon = channel.icon;
                    return (
                      <Card
                        key={channel.id}
                        className="group cursor-pointer rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-8 transition hover:border-[#cfe0ad]"
                      >
                        <div className="flex flex-col items-center text-center">
                          <div
                            className="flex h-20 w-20 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${channel.color}20` }}
                          >
                            <Icon size={40} style={{ color: channel.color }} strokeWidth={1.5} />
                          </div>
                          <h3 className="mt-6 text-2xl font-semibold text-white">{channel.title}</h3>
                          <p className="mt-2 text-lg text-[#bdbdbd]">{channel.description}</p>
                          <p className="mt-4 text-xl font-semibold text-[#cfe0ad]">{channel.contact}</p>
                          <p className="mt-2 text-base text-[#8a8a8a]">{channel.availability}</p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>

              <section className="mt-20">
                <div className="flex items-center gap-4">
                  <HelpCircle size={36} className="text-[#cfe0ad]" strokeWidth={1.5} />
                  <h2 className="text-4xl font-bold tracking-tight text-white">Frequently Asked Questions</h2>
                </div>
                <div className="mt-8 space-y-4">
                  {faqs.map((faq) => {
                    const isExpanded = expandedFaq === faq.id;
                    return (
                      <Card
                        key={faq.id}
                        className="overflow-hidden rounded-[34px] border border-[#2a2a2a] bg-[#101010]"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                          className="w-full p-8 text-left transition hover:bg-[#151515]"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-semibold text-white">{faq.question}</h3>
                            <div className="ml-8 text-4xl text-[#bdbdbd]">
                              {isExpanded ? "−" : "+"}
                            </div>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-[#2a2a2a] bg-[#0a0a0a] p-8">
                            <p className="text-xl leading-relaxed text-[#bdbdbd]">{faq.answer}</p>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </section>

              <section className="mt-20">
                <div className="flex items-center gap-4">
                  <FileText size={36} className="text-[#cfe0ad]" strokeWidth={1.5} />
                  <h2 className="text-4xl font-bold tracking-tight text-white">Your Support Tickets</h2>
                </div>
                <div className="mt-8 space-y-6">
                  {recentTickets.map((ticket) => (
                    <Card
                      key={ticket.id}
                      className="rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-8"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <h3 className="text-2xl font-semibold text-white">{ticket.title}</h3>
                            <span className={`flex items-center gap-2 rounded-full border px-4 py-1 text-sm font-semibold ${getStatusColor(ticket.status)}`}>
                              {getStatusIcon(ticket.status)}
                              {ticket.status.replace("-", " ").toUpperCase()}
                            </span>
                          </div>
                          <div className="mt-4 flex gap-8 text-lg text-[#bdbdbd]">
                            <div>
                              <span className="text-sm uppercase tracking-[0.2em] text-[#8a8a8a]">Ticket ID</span>
                              <p className="mt-1 font-semibold text-white">{ticket.id}</p>
                            </div>
                            <div>
                              <span className="text-sm uppercase tracking-[0.2em] text-[#8a8a8a]">Category</span>
                              <p className="mt-1 font-semibold text-white">{ticket.category}</p>
                            </div>
                            <div>
                              <span className="text-sm uppercase tracking-[0.2em] text-[#8a8a8a]">Created</span>
                              <p className="mt-1 font-semibold text-white">{ticket.createdAt}</p>
                            </div>
                            {ticket.resolvedAt && (
                              <div>
                                <span className="text-sm uppercase tracking-[0.2em] text-[#8a8a8a]">Resolved</span>
                                <p className="mt-1 font-semibold text-white">{ticket.resolvedAt}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-6 py-3 text-lg font-semibold text-white transition hover:border-[#cfe0ad] hover:bg-[#cfe0ad] hover:text-black"
                        >
                          View Details
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Need More Help?</h2>
                <Card className="mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                  <div className="space-y-6">
                    <p className="text-2xl text-[#bdbdbd]">
                      Can't find what you're looking for? Submit a new support ticket and our team will get back to you as soon as possible.
                    </p>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label className="text-lg font-semibold text-white">Subject</label>
                        <input
                          type="text"
                          placeholder="Brief description of your issue"
                          className="mt-2 w-full rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-6 py-4 text-xl text-white placeholder-[#6a6a6a] outline-none focus:border-[#cfe0ad]"
                        />
                      </div>
                      <div>
                        <label className="text-lg font-semibold text-white">Category</label>
                        <select className="mt-2 w-full rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-6 py-4 text-xl text-white outline-none focus:border-[#cfe0ad]">
                          <option>Technical Support</option>
                          <option>Billing</option>
                          <option>Feature Request</option>
                          <option>General Inquiry</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-lg font-semibold text-white">Message</label>
                      <textarea
                        rows={6}
                        placeholder="Please describe your issue in detail..."
                        className="mt-2 w-full rounded-[24px] border border-[#2a2a2a] bg-[#0c0c0c] px-6 py-4 text-xl text-white placeholder-[#6a6a6a] outline-none focus:border-[#cfe0ad]"
                      />
                    </div>
                    <div>
                      <label className="text-lg font-semibold text-white">Attachments</label>
                      <FileUploader
                        accept={["image/*", "application/pdf"]}
                        captureCamera
                        maxSize={10 * 1024 * 1024}
                        helperText="Add screenshots or documents (camera friendly)"
                        onUpload={(files) =>
                          showToast({
                            type: "success",
                            message: "Files attached",
                            description: `${files.length} file(s)`
                          })
                        }
                      />
                    </div>
                    <button
                      type="button"
                      className="w-full rounded-full bg-[#cfe0ad] py-6 text-2xl font-semibold text-black transition hover:bg-[#d4e4b8]"
                      onClick={() => showToast({ type: "success", message: "Ticket submitted" })}
                    >
                      Submit Ticket
                    </button>
                  </div>
                </Card>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Quick Links</h2>
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {[
                    { title: "User Guide", description: "Learn how to use all features" },
                    { title: "Video Tutorials", description: "Step-by-step video guides" },
                    { title: "Community Forum", description: "Connect with other users" },
                    { title: "Release Notes", description: "Latest updates and features" }
                  ].map((link) => (
                    <Card
                      key={link.title}
                      className="group cursor-pointer rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-8 transition hover:border-[#cfe0ad]"
                    >
                      <h3 className="text-2xl font-semibold text-white">{link.title}</h3>
                      <p className="mt-2 text-lg text-[#bdbdbd]">{link.description}</p>
                      <div className="mt-4 text-lg font-semibold text-[#cfe0ad]">Learn More →</div>
                    </Card>
                  ))}
                </div>
              </section>
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
