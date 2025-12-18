import type {
  Project,
  BudgetCategory,
  Expense,
  SpendingHistoryEntry,
  InventoryItem,
  Phase,
  Task,
  Milestone,
  Contractor,
  TeamMember,
  Document,
  Folder,
  Report
} from './types';

// Project Data
export const seedProject = (): Project => ({
  id: "proj-1",
  name: "Project Skyline",
  category: "Residential Villa",
  mode: "construction",
  startDate: "2025-12-01",
  targetEndDate: "2026-06-30",
  progress: 5
});

// Budget Categories
export const seedBudgetCategories = (): BudgetCategory[] => [
  { id: "cat-1", name: "Materials", allocated: 450000, spent: 22500, color: "#cfe0ad" },
  { id: "cat-2", name: "Labor", allocated: 350000, spent: 87500, color: "#b8d4f1" },
  { id: "cat-3", name: "Equipment", allocated: 150000, spent: 45000, color: "#f3c5a8" },
  { id: "cat-4", name: "Permits & Fees", allocated: 75000, spent: 75000, color: "#e8b3d4" },
  { id: "cat-5", name: "Contingency", allocated: 100000, spent: 0, color: "#d4e8b3" }
];

// Expenses
export const seedExpenses = (): Expense[] => [
  { id: "exp-1", date: "2025-12-17", category: "Materials", description: "Steel reinforcement bars", amount: 12500, vendor: "Steel & Co." },
  { id: "exp-2", date: "2025-12-16", category: "Labor", description: "Week 2 mason wages", amount: 28000, vendor: "Construction Crew" },
  { id: "exp-3", date: "2025-12-15", category: "Equipment", description: "Concrete mixer rental", amount: 15000, vendor: "EquipRent" },
  { id: "exp-4", date: "2025-12-14", category: "Materials", description: "Cement bags (100 units)", amount: 10000, vendor: "BuildMart" },
  { id: "exp-5", date: "2025-12-12", category: "Labor", description: "Excavation team", amount: 35000, vendor: "Earthworks Ltd" },
  { id: "exp-6", date: "2025-12-11", category: "Equipment", description: "Scaffolding setup", amount: 18000, vendor: "SafeScaffold" },
  { id: "exp-7", date: "2025-12-10", category: "Labor", description: "Site supervisor (Week 1)", amount: 24500, vendor: "Professional Supervisors" },
  { id: "exp-8", date: "2025-12-09", category: "Equipment", description: "Generator rental", amount: 12000, vendor: "PowerEquip" },
  { id: "exp-9", date: "2025-12-08", category: "Permits & Fees", description: "Building permit", amount: 45000, vendor: "Municipal Corporation" },
  { id: "exp-10", date: "2025-12-07", category: "Permits & Fees", description: "Environmental clearance", amount: 30000, vendor: "Pollution Control Board" }
];

// Spending History (for charts)
export const seedSpendingHistory = (): SpendingHistoryEntry[] => {
  const history: SpendingHistoryEntry[] = [];
  const startDate = new Date("2025-12-01");
  let cumulativeSpent = 0;

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    // Simulate spending pattern
    const dailySpend = i < 7 ? Math.random() * 5000 : Math.random() * 15000 + 5000;
    cumulativeSpent += dailySpend;

    history.push({
      date: dateStr,
      spent: Math.round(cumulativeSpent),
      allocated: 1125000
    });
  }

  return history;
};

// Inventory Items
export const seedInventoryItems = (): InventoryItem[] => [
  { id: "inv-1", name: "Cement (50kg bags)", category: "Materials", quantity: 85, unit: "bags", minStock: 50, cost: 450, location: "Warehouse A", lastUpdated: "2025-12-17" },
  { id: "inv-2", name: "Steel Rebar (12mm)", category: "Materials", quantity: 120, unit: "units", minStock: 80, cost: 850, location: "Site Storage", lastUpdated: "2025-12-16" },
  { id: "inv-3", name: "Sand (cubic meter)", category: "Materials", quantity: 45, unit: "m³", minStock: 30, cost: 1200, location: "Open Yard", lastUpdated: "2025-12-15" },
  { id: "inv-4", name: "Bricks (Standard)", category: "Materials", quantity: 2500, unit: "units", minStock: 3000, cost: 8, location: "Site Storage", lastUpdated: "2025-12-14", lowStock: true },
  { id: "inv-5", name: "Paint (20L buckets)", category: "Finishing", quantity: 18, unit: "buckets", minStock: 20, cost: 3200, location: "Warehouse B", lastUpdated: "2025-12-13", lowStock: true },
  { id: "inv-6", name: "Tiles (60x60cm)", category: "Finishing", quantity: 180, unit: "boxes", minStock: 100, cost: 2400, location: "Warehouse B", lastUpdated: "2025-12-12" },
  { id: "inv-7", name: "Electrical Wiring (100m)", category: "Electrical", quantity: 25, unit: "rolls", minStock: 15, cost: 1800, location: "Tool Room", lastUpdated: "2025-12-11" },
  { id: "inv-8", name: "PVC Pipes (4 inch)", category: "Plumbing", quantity: 60, unit: "units", minStock: 40, cost: 450, location: "Site Storage", lastUpdated: "2025-12-10" },
  { id: "inv-9", name: "Wood Planks (12ft)", category: "Materials", quantity: 150, unit: "units", minStock: 100, cost: 380, location: "Warehouse A", lastUpdated: "2025-12-09" },
  { id: "inv-10", name: "Bathroom Fittings", category: "Plumbing", quantity: 12, unit: "sets", minStock: 10, cost: 8500, location: "Warehouse B", lastUpdated: "2025-12-08" }
];

// Schedule Phases and Tasks
export const seedPhases = (): Phase[] => [
  {
    id: "phase-1",
    name: "Ideation & Planning",
    startDate: "2025-12-01",
    endDate: "2025-12-15",
    progress: 80,
    tasks: [
      { id: "task-1", phaseId: "phase-1", name: "Site survey", status: "completed", startDate: "2025-12-01", endDate: "2025-12-03", assignedTo: "Amit Sharma" },
      { id: "task-2", phaseId: "phase-1", name: "Architectural design", status: "completed", startDate: "2025-12-04", endDate: "2025-12-10", assignedTo: "Priya Menon" },
      { id: "task-3", phaseId: "phase-1", name: "Budget finalization", status: "in_progress", startDate: "2025-12-11", endDate: "2025-12-15", assignedTo: "Rajesh Kumar" }
    ]
  },
  {
    id: "phase-2",
    name: "Foundation",
    startDate: "2025-12-16",
    endDate: "2026-01-15",
    progress: 20,
    tasks: [
      { id: "task-4", phaseId: "phase-2", name: "Site excavation", status: "in_progress", startDate: "2025-12-16", endDate: "2025-12-22", assignedTo: "Vikram Singh" },
      { id: "task-5", phaseId: "phase-2", name: "Foundation laying", status: "pending", startDate: "2025-12-23", endDate: "2026-01-05", assignedTo: "Suresh Reddy" },
      { id: "task-6", phaseId: "phase-2", name: "Foundation curing", status: "pending", startDate: "2026-01-06", endDate: "2026-01-15" }
    ]
  },
  {
    id: "phase-3",
    name: "Structural Work",
    startDate: "2026-01-16",
    endDate: "2026-03-15",
    progress: 0,
    tasks: [
      { id: "task-7", phaseId: "phase-3", name: "Ground floor columns", status: "pending", startDate: "2026-01-16", endDate: "2026-01-30", assignedTo: "Ravi Prakash" },
      { id: "task-8", phaseId: "phase-3", name: "Ground floor slab", status: "pending", startDate: "2026-02-01", endDate: "2026-02-15", assignedTo: "Suresh Reddy" },
      { id: "task-9", phaseId: "phase-3", name: "First floor columns", status: "pending", startDate: "2026-02-16", endDate: "2026-03-01" },
      { id: "task-10", phaseId: "phase-3", name: "First floor slab", status: "pending", startDate: "2026-03-02", endDate: "2026-03-15" }
    ]
  },
  {
    id: "phase-4",
    name: "MEP Installation",
    startDate: "2026-03-16",
    endDate: "2026-04-30",
    progress: 0,
    tasks: [
      { id: "task-11", phaseId: "phase-4", name: "Electrical rough-in", status: "pending", startDate: "2026-03-16", endDate: "2026-04-05", assignedTo: "Anil Electricals" },
      { id: "task-12", phaseId: "phase-4", name: "Plumbing rough-in", status: "pending", startDate: "2026-04-06", endDate: "2026-04-20", assignedTo: "Modern Plumbing" },
      { id: "task-13", phaseId: "phase-4", name: "HVAC installation", status: "pending", startDate: "2026-04-21", endDate: "2026-04-30" }
    ]
  },
  {
    id: "phase-5",
    name: "Finishing",
    startDate: "2026-05-01",
    endDate: "2026-06-30",
    progress: 0,
    tasks: [
      { id: "task-14", phaseId: "phase-5", name: "Flooring & tiling", status: "pending", startDate: "2026-05-01", endDate: "2026-05-20" },
      { id: "task-15", phaseId: "phase-5", name: "Painting", status: "pending", startDate: "2026-05-21", endDate: "2026-06-10" },
      { id: "task-16", phaseId: "phase-5", name: "Fixtures installation", status: "pending", startDate: "2026-06-11", endDate: "2026-06-25" },
      { id: "task-17", phaseId: "phase-5", name: "Final inspection", status: "pending", startDate: "2026-06-26", endDate: "2026-06-30" }
    ]
  }
];

// Milestones
export const seedMilestones = (): Milestone[] => [
  { id: "mile-1", name: "Building permit approved", date: "2025-12-08", completed: true },
  { id: "mile-2", name: "Foundation complete", date: "2026-01-15", completed: false },
  { id: "mile-3", name: "Structural work complete", date: "2026-03-15", completed: false },
  { id: "mile-4", name: "MEP rough-in complete", date: "2026-04-30", completed: false },
  { id: "mile-5", name: "Final handover", date: "2026-06-30", completed: false }
];

// Contractors
export const seedContractors = (): Contractor[] => [
  {
    id: "con-1",
    name: "Amit Sharma",
    role: "Civil Engineer",
    company: "BuildTech Solutions",
    phone: "+91 98765 43210",
    email: "amit.sharma@buildtech.com",
    location: "Bhopal, MP",
    specialties: ["Foundation", "Structural Work", "Quality Control"],
    cost: 85000,
    availability: "scheduled",
    performanceMetrics: { quality: 92, timeliness: 88, communication: 95, costEffectiveness: 90 }
  },
  {
    id: "con-2",
    name: "Priya Menon",
    role: "Architect",
    company: "Design Architects",
    phone: "+91 98765 43211",
    email: "priya@designarch.com",
    location: "Mumbai, MH",
    specialties: ["Architectural Design", "3D Visualization", "Interior Planning"],
    cost: 120000,
    availability: "available",
    performanceMetrics: { quality: 97, timeliness: 92, communication: 98, costEffectiveness: 85 }
  },
  {
    id: "con-3",
    name: "Vikram Singh",
    role: "Site Supervisor",
    company: "Professional Supervisors",
    phone: "+91 98765 43212",
    email: "vikram@prosuper.com",
    location: "Bhopal, MP",
    specialties: ["Site Management", "Labor Coordination", "Safety Compliance"],
    cost: 60000,
    availability: "busy",
    performanceMetrics: { quality: 90, timeliness: 94, communication: 91, costEffectiveness: 93 }
  },
  {
    id: "con-4",
    name: "Suresh Reddy",
    role: "Mason Contractor",
    company: "Elite Masonry",
    phone: "+91 98765 43213",
    email: "suresh@elitemasonry.com",
    location: "Bhopal, MP",
    specialties: ["Brickwork", "Plastering", "Concrete Work"],
    cost: 45000,
    availability: "scheduled",
    performanceMetrics: { quality: 88, timeliness: 87, communication: 85, costEffectiveness: 91 }
  }
];

// Team Members
export const seedTeamMembers = (): TeamMember[] => [
  { id: "team-1", name: "Rajesh Kumar", role: "Project Manager", email: "rajesh@projectskyline.com", phone: "+91 98765 11111", department: "Management", joinDate: "2025-11-15", status: "active" },
  { id: "team-2", name: "Sneha Patel", role: "Assistant Project Manager", email: "sneha@projectskyline.com", phone: "+91 98765 22222", department: "Management", joinDate: "2025-11-20", status: "active" },
  { id: "team-3", name: "Arjun Verma", role: "Civil Engineer", email: "arjun@projectskyline.com", phone: "+91 98765 33333", department: "Engineering", joinDate: "2025-12-01", status: "active" },
  { id: "team-4", name: "Kavita Singh", role: "Architect", email: "kavita@projectskyline.com", phone: "+91 98765 44444", department: "Design", joinDate: "2025-11-25", status: "active" },
  { id: "team-5", name: "Rahul Sharma", role: "Safety Officer", email: "rahul@projectskyline.com", phone: "+91 98765 55555", department: "Safety", joinDate: "2025-12-05", status: "active" },
  { id: "team-6", name: "Pooja Desai", role: "Procurement Specialist", email: "pooja@projectskyline.com", phone: "+91 98765 66666", department: "Procurement", joinDate: "2025-12-01", status: "active" },
  { id: "team-7", name: "Anil Gupta", role: "Quality Inspector", email: "anil@projectskyline.com", phone: "+91 98765 77777", department: "Quality", joinDate: "2025-12-10", status: "active" }
];

// Folders
export const seedFolders = (): Folder[] => [
  { id: "folder-1", name: "Plans", icon: "FileText", documentCount: 8 },
  { id: "folder-2", name: "Contracts", icon: "FileCheck", documentCount: 5 },
  { id: "folder-3", name: "Invoices", icon: "Receipt", documentCount: 12 },
  { id: "folder-4", name: "Permits", icon: "BadgeCheck", documentCount: 4 },
  { id: "folder-5", name: "Reports", icon: "FileBarChart", documentCount: 6 },
  { id: "folder-6", name: "Photos", icon: "Camera", documentCount: 45 }
];

// Documents
export const seedDocuments = (): Document[] => [
  { id: "doc-1", name: "Architectural Floor Plan.pdf", type: "pdf", folder: "Plans", size: 2500000, uploadDate: "2025-12-05", description: "Ground floor layout" },
  { id: "doc-2", name: "Structural Design.pdf", type: "pdf", folder: "Plans", size: 3200000, uploadDate: "2025-12-06", description: "Structural calculations and drawings" },
  { id: "doc-3", name: "Electrical Layout.pdf", type: "pdf", folder: "Plans", size: 1800000, uploadDate: "2025-12-07", description: "Electrical wiring plan" },
  { id: "doc-4", name: "Plumbing Schematic.pdf", type: "pdf", folder: "Plans", size: 1600000, uploadDate: "2025-12-08", description: "Plumbing and drainage layout" },
  { id: "doc-5", name: "Contractor Agreement - BuildTech.pdf", type: "pdf", folder: "Contracts", size: 450000, uploadDate: "2025-12-02", description: "Main contractor agreement" },
  { id: "doc-6", name: "Architect Contract.pdf", type: "pdf", folder: "Contracts", size: 380000, uploadDate: "2025-11-28", description: "Architectural services contract" },
  { id: "doc-7", name: "Building Permit.pdf", type: "pdf", folder: "Permits", size: 520000, uploadDate: "2025-12-08", description: "Municipal building permit" },
  { id: "doc-8", name: "Environmental Clearance.pdf", type: "pdf", folder: "Permits", size: 680000, uploadDate: "2025-12-07", description: "Environmental approval certificate" },
  { id: "doc-9", name: "Invoice - Steel Supply.pdf", type: "pdf", folder: "Invoices", size: 180000, uploadDate: "2025-12-15", description: "Steel reinforcement bars" },
  { id: "doc-10", name: "Invoice - Cement.pdf", type: "pdf", folder: "Invoices", size: 150000, uploadDate: "2025-12-14", description: "Cement bags purchase" },
  { id: "doc-11", name: "Site Photo - Day 1.jpg", type: "image", folder: "Photos", size: 4200000, uploadDate: "2025-12-01", description: "Initial site condition" },
  { id: "doc-12", name: "Site Photo - Excavation.jpg", type: "image", folder: "Photos", size: 3800000, uploadDate: "2025-12-16", description: "Excavation progress" },
  { id: "doc-13", name: "Weekly Progress Report - Week 1.pdf", type: "pdf", folder: "Reports", size: 850000, uploadDate: "2025-12-08", description: "First week summary" },
  { id: "doc-14", name: "Weekly Progress Report - Week 2.pdf", type: "pdf", folder: "Reports", size: 920000, uploadDate: "2025-12-15", description: "Second week summary" },
  { id: "doc-15", name: "Budget Tracking Sheet.xlsx", type: "spreadsheet", folder: "Reports", size: 240000, uploadDate: "2025-12-17", description: "Detailed budget analysis" }
];

// Reports
export const seedReports = (): Report[] => [
  {
    id: "rep-1",
    name: "Budget Summary - December 2025",
    type: "budget",
    generatedDate: "2025-12-17",
    description: "Monthly budget analysis",
    data: { totalSpent: 230000, totalAllocated: 1125000, percentSpent: 20 }
  },
  {
    id: "rep-2",
    name: "Project Progress Report - Week 2",
    type: "progress",
    generatedDate: "2025-12-15",
    description: "Bi-weekly progress update",
    data: { overallProgress: 5, completedTasks: 2, totalTasks: 17 }
  },
  {
    id: "rep-3",
    name: "Contractor Performance Analysis",
    type: "contractor",
    generatedDate: "2025-12-12",
    description: "Performance metrics for all contractors",
    data: { averageQuality: 91, averageTimeliness: 90 }
  },
  {
    id: "rep-4",
    name: "Inventory Status Report",
    type: "inventory",
    generatedDate: "2025-12-16",
    description: "Current inventory levels",
    data: { totalItems: 10, lowStockItems: 2, totalValue: 542950 }
  },
  {
    id: "rep-5",
    name: "Weekly Summary - Week 3",
    type: "weekly",
    generatedDate: "2025-12-17",
    description: "Comprehensive weekly report",
    data: { progress: 5, budget: 20, issues: 2, milestones: 1 }
  }
];
