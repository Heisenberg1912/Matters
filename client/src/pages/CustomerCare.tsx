import { useEffect, useState } from "react";
import PageLayout from "@/components/page-layout";
import { FileUploader } from "@/components/file-uploader";
import { Card } from "@/components/ui/card";
import { Phone, Mail, MessageCircle, HelpCircle, FileText, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useProject } from "@/context/ProjectContext";
import { supportApi } from "@/lib/api";
import { useUploadsStore } from "@/store";

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
    answer: "Use the Contractor Chat feature to send messages, share files, and coordinate with your team. All conversations are securely stored."
  }
];

export default function CustomerCare() {
  const { showToast } = useNotifications();
  const { currentProject } = useProject();
  const uploadFile = useUploadsStore((state) => state.uploadFile);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Array<{
    _id: string;
    ticketNumber: string;
    subject: string;
    category: string;
    status: "resolved" | "in_progress" | "pending";
    createdAt: string;
    resolvedAt?: string;
  }>>([]);
  const [ticketsError, setTicketsError] = useState("");
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [formState, setFormState] = useState({
    subject: "",
    category: "Technical Support",
    message: "",
  });
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadTickets = async () => {
      if (!currentProject?._id) {
        setTickets([]);
        setTicketsError("");
        return;
      }
      setTicketsLoading(true);
      setTicketsError("");
      try {
        const response = await supportApi.getTickets(currentProject._id);
        if (response.success && response.data?.tickets) {
          setTickets(response.data.tickets);
        } else {
          setTicketsError(response.error || "Failed to load support tickets");
        }
      } catch (error) {
        setTicketsError(error instanceof Error ? error.message : "Failed to load support tickets");
      } finally {
        setTicketsLoading(false);
      }
    };

    loadTickets();
  }, [currentProject?._id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle2 size={16} className="text-[#4ade80] xs:w-5 xs:h-5" />;
      case "in_progress":
        return <Clock size={16} className="text-[#cfe0ad] xs:w-5 xs:h-5" />;
      case "pending":
        return <AlertCircle size={16} className="text-[#f3c5a8] xs:w-5 xs:h-5" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]";
      case "in_progress":
        return "bg-[#cfe0ad]/10 text-[#cfe0ad] border-[#cfe0ad]";
      case "pending":
        return "bg-[#f3c5a8]/10 text-[#f3c5a8] border-[#f3c5a8]";
      default:
        return "";
    }
  };

  const handleUploadAttachments = async (files: File[]) => {
    if (!currentProject?._id) {
      showToast({ type: "warning", message: "Select a project first" });
      return;
    }
    try {
      const uploads = await Promise.all(
        files.map((file) =>
          uploadFile(currentProject._id, file, { category: "support_ticket" })
        )
      );
      const ids = uploads.filter(Boolean).map((upload) => upload!._id);
      setAttachmentIds((prev) => [...prev, ...ids]);
    } catch (error) {
      showToast({ type: "error", message: "Failed to upload attachments" });
    }
  };

  const handleSubmit = async () => {
    if (!currentProject?._id) {
      showToast({ type: "warning", message: "Select a project first" });
      return;
    }
    if (!formState.subject.trim() || !formState.message.trim()) {
      showToast({ type: "error", message: "Subject and message are required" });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await supportApi.createTicket({
        project: currentProject._id,
        subject: formState.subject.trim(),
        category: formState.category,
        message: formState.message.trim(),
        attachments: attachmentIds,
      });
      if (response.success && response.data?.ticket) {
        const newTicket = response.data.ticket;
        setTickets((prev) => [newTicket, ...prev]);
        setFormState({ subject: "", category: "Technical Support", message: "" });
        setAttachmentIds([]);
        showToast({ type: "success", message: "Ticket submitted" });
      } else {
        throw new Error(response.error || "Failed to submit ticket");
      }
    } catch (error) {
      showToast({ type: "error", message: error instanceof Error ? error.message : "Failed to submit ticket" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout
      title="Customer Care"
      contentClassName="px-4 xs:px-5 sm:px-6 md:px-10 lg:px-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        {!currentProject && (
          <Card className="mt-6 border border-[#242424] bg-[#101010] p-4 text-sm xs:text-base text-[#bdbdbd]">
            Select or create a project to view support options.
          </Card>
        )}

        <section className="mt-8 xs:mt-12 sm:mt-16">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">How Can We Help?</h2>
          <div className="mt-4 xs:mt-6 sm:mt-8 grid grid-cols-1 gap-4 xs:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {supportChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <Card
                  key={channel.id}
                  className="group cursor-pointer rounded-[24px] xs:rounded-[30px] sm:rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-5 xs:p-6 sm:p-8 transition hover:border-[#cfe0ad] touch-target"
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="flex h-14 w-14 xs:h-16 xs:w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${channel.color}20` }}
                    >
                      <Icon size={28} style={{ color: channel.color }} strokeWidth={1.5} className="xs:w-8 xs:h-8 sm:w-10 sm:h-10" />
                    </div>
                    <h3 className="mt-4 xs:mt-5 sm:mt-6 text-lg xs:text-xl sm:text-2xl font-semibold text-white">{channel.title}</h3>
                    <p className="mt-1 xs:mt-2 text-sm xs:text-base sm:text-lg text-[#bdbdbd]">{channel.description}</p>
                    <p className="mt-3 xs:mt-4 text-base xs:text-lg sm:text-xl font-semibold text-[#cfe0ad] break-all">{channel.contact}</p>
                    <p className="mt-1 xs:mt-2 text-xs xs:text-sm sm:text-base text-[#8a8a8a]">{channel.availability}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mt-12 xs:mt-16 sm:mt-20">
          <div className="flex items-center gap-3 xs:gap-4">
            <HelpCircle size={28} className="text-[#cfe0ad] xs:w-8 xs:h-8 sm:w-9 sm:h-9 shrink-0" strokeWidth={1.5} />
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">FAQs</h2>
          </div>
          <div className="mt-4 xs:mt-6 sm:mt-8 space-y-3 xs:space-y-4">
            {faqs.map((faq) => {
              const isExpanded = expandedFaq === faq.id;
              return (
                <Card
                  key={faq.id}
                  className="overflow-hidden rounded-[20px] xs:rounded-[28px] sm:rounded-[34px] border border-[#2a2a2a] bg-[#101010]"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                    className="w-full p-4 xs:p-5 sm:p-6 md:p-8 text-left transition hover:bg-[#151515] touch-target focus-ring"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-white">{faq.question}</h3>
                      <div className="text-2xl xs:text-3xl sm:text-4xl text-[#bdbdbd] shrink-0">
                        {isExpanded ? "-" : "+"}
                      </div>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-[#2a2a2a] bg-[#0a0a0a] p-4 xs:p-5 sm:p-6 md:p-8">
                      <p className="text-sm xs:text-base sm:text-lg md:text-xl leading-relaxed text-[#bdbdbd]">{faq.answer}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mt-12 xs:mt-16 sm:mt-20">
          <div className="flex items-center gap-3 xs:gap-4">
            <FileText size={28} className="text-[#cfe0ad] xs:w-8 xs:h-8 sm:w-9 sm:h-9 shrink-0" strokeWidth={1.5} />
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Your Tickets</h2>
          </div>
          {ticketsError && (
            <Card className="mt-4 border border-red-500/40 bg-red-500/10 p-4 text-sm xs:text-base text-red-200">
              {ticketsError}
            </Card>
          )}
          {ticketsLoading && (
            <Card className="mt-6 border border-[#2a2a2a] bg-[#101010] p-4 xs:p-6 text-base xs:text-lg text-[#bdbdbd]">
              Loading tickets...
            </Card>
          )}
          <div className="mt-4 xs:mt-6 sm:mt-8 space-y-4 xs:space-y-6">
            {tickets.map((ticket) => (
              <Card
                key={ticket._id}
                className="rounded-[20px] xs:rounded-[28px] sm:rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-4 xs:p-5 sm:p-6 md:p-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 xs:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 xs:gap-3 sm:gap-4">
                      <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-white">{ticket.subject}</h3>
                      <span className={`flex items-center gap-1 xs:gap-2 rounded-full border px-2 xs:px-3 sm:px-4 py-0.5 xs:py-1 text-xs xs:text-sm font-semibold ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        {ticket.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-3 xs:mt-4 flex flex-wrap gap-4 xs:gap-6 text-xs xs:text-sm sm:text-base md:text-lg text-[#bdbdbd]">
                      <div>
                        <span className="text-xs uppercase tracking-[0.15em] xs:tracking-[0.2em] text-[#8a8a8a]">Ticket</span>
                        <p className="mt-1 font-semibold text-white">{ticket.ticketNumber}</p>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-[0.15em] xs:tracking-[0.2em] text-[#8a8a8a]">Category</span>
                        <p className="mt-1 font-semibold text-white">{ticket.category}</p>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-[0.15em] xs:tracking-[0.2em] text-[#8a8a8a]">Created</span>
                        <p className="mt-1 font-semibold text-white">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 text-xs xs:text-sm sm:text-base md:text-lg font-semibold text-white transition hover:border-[#cfe0ad] hover:bg-[#cfe0ad] hover:text-black touch-target focus-ring"
                    onClick={() => showToast({ type: "info", message: "Support will reach out soon" })}
                  >
                    View Details
                  </button>
                </div>
              </Card>
            ))}
            {tickets.length === 0 && !ticketsLoading && (
              <Card className="border border-[#2a2a2a] bg-[#101010] p-4 xs:p-6 text-base xs:text-lg text-[#bdbdbd]">
                No support tickets yet.
              </Card>
            )}
          </div>
        </section>

        <section className="mt-12 xs:mt-16 sm:mt-20">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Need More Help?</h2>
          <Card className="mt-4 xs:mt-6 sm:mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-4 xs:p-6 sm:p-8 md:p-10">
            <div className="space-y-4 xs:space-y-6">
              <p className="text-sm xs:text-base sm:text-lg md:text-2xl text-[#bdbdbd]">
                Can't find what you're looking for? Submit a new support ticket.
              </p>
              <div className="grid grid-cols-1 gap-4 xs:gap-6 sm:grid-cols-2">
                <div>
                  <label className="text-sm xs:text-base sm:text-lg font-semibold text-white">Subject</label>
                  <input
                    type="text"
                    placeholder="Brief description of your issue"
                    value={formState.subject}
                    onChange={(event) => setFormState((prev) => ({ ...prev, subject: event.target.value }))}
                    className="mt-2 w-full rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-4 xs:px-5 sm:px-6 py-3 xs:py-3.5 sm:py-4 text-sm xs:text-base sm:text-lg md:text-xl text-white placeholder-[#6a6a6a] outline-none focus:border-[#cfe0ad] touch-target"
                  />
                </div>
                <div>
                  <label className="text-sm xs:text-base sm:text-lg font-semibold text-white">Category</label>
                  <select
                    value={formState.category}
                    onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))}
                    className="mt-2 w-full rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-4 xs:px-5 sm:px-6 py-3 xs:py-3.5 sm:py-4 text-sm xs:text-base sm:text-lg md:text-xl text-white outline-none focus:border-[#cfe0ad] touch-target"
                  >
                    <option>Technical Support</option>
                    <option>Billing</option>
                    <option>Feature Request</option>
                    <option>General Inquiry</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm xs:text-base sm:text-lg font-semibold text-white">Message</label>
                <textarea
                  rows={4}
                  placeholder="Please describe your issue in detail..."
                  value={formState.message}
                  onChange={(event) => setFormState((prev) => ({ ...prev, message: event.target.value }))}
                  className="mt-2 w-full rounded-[16px] xs:rounded-[20px] sm:rounded-[24px] border border-[#2a2a2a] bg-[#0c0c0c] px-4 xs:px-5 sm:px-6 py-3 xs:py-3.5 sm:py-4 text-sm xs:text-base sm:text-lg md:text-xl text-white placeholder-[#6a6a6a] outline-none focus:border-[#cfe0ad]"
                />
              </div>
              <div>
                <label className="text-sm xs:text-base sm:text-lg font-semibold text-white">Attachments</label>
                <FileUploader
                  accept={["image/*", "application/pdf"]}
                  captureCamera
                  maxSize={10 * 1024 * 1024}
                  helperText="Add screenshots or documents"
                  onUpload={handleUploadAttachments}
                />
                {attachmentIds.length > 0 && (
                  <p className="mt-2 text-xs xs:text-sm text-[#8a8a8a]">{attachmentIds.length} attachment(s) added</p>
                )}
              </div>
              <button
                type="button"
                className="w-full rounded-full bg-[#cfe0ad] py-3 xs:py-4 sm:py-5 md:py-6 text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-black transition hover:bg-[#d4e4b8] disabled:opacity-60 touch-target focus-ring"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
          </Card>
        </section>

        <section className="mt-12 xs:mt-16 sm:mt-20">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Quick Links</h2>
          <div className="mt-4 xs:mt-6 sm:mt-8 grid grid-cols-1 gap-4 xs:gap-6 sm:grid-cols-2">
            {[
              { title: "User Guide", description: "Learn how to use all features" },
              { title: "Video Tutorials", description: "Step-by-step video guides" },
              { title: "Community Forum", description: "Connect with other users" },
              { title: "Release Notes", description: "Latest updates and features" }
            ].map((link) => (
              <Card
                key={link.title}
                className="group cursor-pointer rounded-[20px] xs:rounded-[28px] sm:rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-4 xs:p-5 sm:p-6 md:p-8 transition hover:border-[#cfe0ad] touch-target"
              >
                <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-white">{link.title}</h3>
                <p className="mt-1 xs:mt-2 text-sm xs:text-base sm:text-lg text-[#bdbdbd]">{link.description}</p>
                <div className="mt-3 xs:mt-4 text-sm xs:text-base sm:text-lg font-semibold text-[#cfe0ad]">Learn More</div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
