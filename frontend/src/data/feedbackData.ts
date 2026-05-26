export interface FeedbackEntry {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  type: "feedback" | "complaint";
  category: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Progress" | "Resolved" | "Dismissed";
  rating: number;
  comment: string;
  target: string;
  targetType: "driver" | "staff" | "vehicle" | "app" | "other";
  date: string;
}

export const INITIAL_FEEDBACKS: FeedbackEntry[] = [
  {
    id: "FDB-2026-001",
    name: "Rajesh Kumar",
    role: "Trainee",
    email: "rajesh.k@example.com",
    phone: "+91 98765 43210",
    type: "feedback",
    category: "Instructor Behaviour",
    priority: "Low",
    status: "Resolved",
    rating: 5,
    comment: "The instructor was very patient and explained all the traffic rules clearly.",
    target: "Suresh Raina (Instructor)",
    targetType: "staff",
    date: "2026-03-15",
  },
  {
    id: "CMP-2026-002",
    name: "Anita Sharma",
    role: "Trainee",
    email: "anita.s@example.com",
    phone: "+91 98765 00001",
    type: "complaint",
    category: "Vehicle Condition",
    priority: "High",
    status: "Open",
    rating: 2,
    comment: "The air conditioning in the car KA-01-MJ-1234 was not working during my session.",
    target: "KA-01-MJ-1234 (Swift)",
    targetType: "vehicle",
    date: "2026-03-18",
  },
  {
    id: "FDB-2026-003",
    name: "Vikram Singh",
    role: "Trainee",
    email: "vikram.s@example.com",
    phone: "+91 98765 00002",
    type: "feedback",
    category: "App Experience",
    priority: "Medium",
    status: "In Progress",
    rating: 4,
    comment: "The session booking process is smooth, but would love to see a dark mode.",
    target: "Student App",
    targetType: "app",
    date: "2026-03-20",
  },
  {
    id: "CMP-2026-004",
    name: "Meena Gupta",
    role: "Parent",
    email: "meena.g@example.com",
    phone: "+91 98765 00003",
    type: "complaint",
    category: "Staff Conduct",
    priority: "Critical",
    status: "Open",
    rating: 1,
    comment: "The reception staff was very rude when I called to reschedule my daughter's class.",
    target: "Reception Desk",
    targetType: "other",
    date: "2026-03-22",
  },
];

export const avatarColor = (index: number) => {
  const colors = [
    { bg: "#EDE9FE", color: "#7C3AED" },
    { bg: "#DCFCE7", color: "#059669" },
    { bg: "#FEF3C7", color: "#D97706" },
    { bg: "#FEE2E2", color: "#DC2626" },
    { bg: "#DBEAFE", color: "#2563EB" },
  ];
  return colors[index % colors.length];
};

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export const feedbackStatusVariant = (status: string): any => {
  switch (status) {
    case "Open":
      return "amber";
    case "In Progress":
      return "blue";
    case "Resolved":
      return "green";
    case "Dismissed":
      return "gray";
    default:
      return "blue";
  }
};

export const priorityVariant = (priority: string): any => {
  switch (priority) {
    case "Low":
      return "blue";
    case "Medium":
      return "amber";
    case "High":
      return "red";
    case "Critical":
      return "red";
    default:
      return "gray";
  }
};

export const targetTypeIcon = (type: string) => {
  switch (type) {
    case "driver":
      return "person";
    case "staff":
      return "badge";
    case "vehicle":
      return "directions_bus";
    case "app":
      return "smartphone";
    default:
      return "category";
  }
};
