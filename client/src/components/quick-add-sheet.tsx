import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, DollarSign, Package, FileText, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNotifications } from "@/hooks/use-notifications";
import { useProject } from "@/context/ProjectContext";
import { cn } from "@/lib/utils";

type QuickAddSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type QuickAddAction = {
  id: string;
  label: string;
  description: string;
  to: string;
  quickAdd: string;
  requiresProject: boolean;
  icon: typeof Calendar;
};

export default function QuickAddSheet({ open, onOpenChange }: QuickAddSheetProps) {
  const navigate = useNavigate();
  const { currentProject } = useProject();
  const { showToast } = useNotifications();

  const actions = useMemo<QuickAddAction[]>(
    () => [
      {
        id: "task",
        label: "Add task",
        description: "Create a new schedule task.",
        to: "/schedule",
        quickAdd: "task",
        requiresProject: true,
        icon: Calendar,
      },
      {
        id: "expense",
        label: "Add expense",
        description: "Log a new cost entry.",
        to: "/budget",
        quickAdd: "expense",
        requiresProject: true,
        icon: DollarSign,
      },
      {
        id: "inventory",
        label: "Add inventory",
        description: "Track a new material item.",
        to: "/inventory",
        quickAdd: "inventory",
        requiresProject: true,
        icon: Package,
      },
      {
        id: "document",
        label: "Upload document",
        description: "Attach plans or reports.",
        to: "/documents",
        quickAdd: "document",
        requiresProject: true,
        icon: FileText,
      },
      {
        id: "contractor",
        label: "Invite contractor",
        description: "Add someone to your project team.",
        to: "/contractor",
        quickAdd: "contractor",
        requiresProject: true,
        icon: UserPlus,
      },
    ],
    []
  );

  const handleAction = (action: QuickAddAction) => {
    if (action.requiresProject && !currentProject) {
      showToast({ type: "warning", message: "Select a project first" });
      return;
    }
    navigate(`${action.to}?quickAdd=${action.quickAdd}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Quick add</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 xs:gap-4 sm:grid-cols-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => handleAction(action)}
              className={cn(
                "flex h-full flex-col rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4 text-left",
                "transition hover:border-[#cfe0ad] focus-ring touch-target"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cfe0ad]/10">
                  <action.icon className="h-5 w-5 text-[#cfe0ad]" />
                </span>
                <div>
                  <p className="text-base font-semibold text-white">{action.label}</p>
                  <p className="text-xs text-[#9a9a9a]">{action.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        {!currentProject && (
          <div className="rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] p-3 text-xs text-[#bdbdbd]">
            Quick actions need a project. Pick one from the header to continue.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
