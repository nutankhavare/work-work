export type Role = {
    id: string;
    roleName: string;
    department: string;
    accessLevel: "Root Access" | "Full Access" | "Partial Access" | "Read Only";
    description: string;
    permissions: string[];
    assignedUsers: number;
    lastModified: string;
    status: "Active" | "Inactive";
    createdBy: string;
};

export const INITIAL_ROLES: Role[] = [
    {
        id: "ROLE-001",
        roleName: "SUPER-ADMIN",
        department: "Core Administration",
        accessLevel: "Root Access",
        description: "Complete system access with authority to manage all modules and organization settings.",
        permissions: ["View Dashboard", "Manage Roles", "Full Staff Control", "Financial Access"],
        assignedUsers: 2,
        lastModified: "Mar 12, 2026",
        status: "Active",
        createdBy: "System",
    },
    {
        id: "ROLE-002",
        roleName: "FLEET-MANAGER",
        department: "Fleet Operations",
        accessLevel: "Full Access",
        description: "Responsible for vehicle maintenance, driver assignments, and session scheduling.",
        permissions: ["View Vehicles", "Edit Vehicles", "Manage Drivers", "Schedule Sessions"],
        assignedUsers: 5,
        lastModified: "Mar 15, 2026",
        status: "Active",
        createdBy: "Admin User",
    },
    {
        id: "ROLE-003",
        roleName: "FRONT-DESK",
        department: "Reception & Support",
        accessLevel: "Partial Access",
        description: "Handles trainee inquiries, registrations, and basic attendance tracking.",
        permissions: ["View Trainees", "Add Trainees", "View Sessions", "Process Inquiries"],
        assignedUsers: 8,
        lastModified: "Mar 18, 2026",
        status: "Active",
        createdBy: "Admin User",
    },
    {
        id: "ROLE-004",
        roleName: "ACCOUNTS",
        department: "Finance",
        accessLevel: "Partial Access",
        description: "Manages fee collection, payroll, and financial reporting.",
        permissions: ["View Finance", "Manage Payments", "Generate Reports"],
        assignedUsers: 3,
        lastModified: "Apr 02, 2026",
        status: "Active",
        createdBy: "Admin User",
    },
    {
        id: "ROLE-005",
        roleName: "HR-MANAGER",
        department: "Human Resources",
        accessLevel: "Full Access",
        description: "Manages employee onboarding, attendance, leave, and payroll coordination.",
        permissions: ["Manage Staff", "View Attendance", "Approve Leave", "Payroll Access"],
        assignedUsers: 2,
        lastModified: "Apr 10, 2026",
        status: "Active",
        createdBy: "System",
    },
    {
        id: "ROLE-006",
        roleName: "DRIVER",
        department: "Fleet Operations",
        accessLevel: "Read Only",
        description: "Limited access for drivers to view assigned routes and schedules.",
        permissions: ["View Routes", "View Schedule"],
        assignedUsers: 12,
        lastModified: "Mar 28, 2026",
        status: "Active",
        createdBy: "Fleet Manager",
    },
    {
        id: "ROLE-007",
        roleName: "VIEWER",
        department: "General",
        accessLevel: "Read Only",
        description: "Read-only access for auditors and external stakeholders.",
        permissions: ["View Dashboard", "View Reports"],
        assignedUsers: 4,
        lastModified: "Feb 15, 2026",
        status: "Inactive",
        createdBy: "Admin User",
    }
];

export const roleStatusVariant = (status: string) => {
    switch (status) {
        case "Active": return "green";
        case "Inactive": return "red";
        default: return "gray";
    }
};

export const accessLevelMeta: Record<string, { bg: string; color: string }> = {
    "Root Access": { bg: "#FEE2E2", color: "#DC2626" },
    "Full Access": { bg: "#EDE9FE", color: "#7C3AED" },
    "Partial Access": { bg: "#DBEAFE", color: "#2563EB" },
    "Read Only": { bg: "#FEF3C7", color: "#D97706" },
};

export const getAvatarColor = (index: number) => {
    const colors = [
        { bg: "#EDE9FE", cl: "#7C3AED" },
        { bg: "#DBEAFE", cl: "#2563EB" },
        { bg: "#DCFCE7", cl: "#059669" },
        { bg: "#FEF3C7", cl: "#D97706" },
        { bg: "#FEE2E2", cl: "#DC2626" },
        { bg: "#F3F4F6", cl: "#374151" },
    ];
    return colors[index % colors.length];
};
