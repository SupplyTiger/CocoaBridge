import {Home, Mail, BrainCog, Calendar, ChartBarIncreasing, Contact, Lock} from "lucide-react";

export const NAVIGATION_LINKS = [
    { name: "Dashboard", path: "/dashboard", icon: <Home className="size-5"/> },
    { name: "Inbox", path: "/inbox", icon: <Mail className="size-5"/> },
    { name: "Market Intelligence", path: "/market-intelligence" ,icon: <BrainCog className="size-5"/>},
    { name: "Analytics", path: "/analytics", icon: <ChartBarIncreasing className="size-5"/> },
    { name: "Calendar", path: "/calendar", icon: <Calendar className="size-5"/> },
    { name: "Contacts", path: "/contacts", icon: <Contact className="size-5"/> },
    { name: "Admin", path: "/admin", icon: <Lock className="size-5"/> },
];