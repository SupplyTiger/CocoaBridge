import {useUser} from "@clerk/clerk-react";
import {Link, useLocation} from "react-router";
import {Search} from "lucide-react";
import {NAVIGATION_LINKS} from "./NavigationLinks.jsx";

const Sidebar = () => {
    const location = useLocation();
    const {user} = useUser();

    const mainLinks = NAVIGATION_LINKS.filter(item => item.path !== "/admin");
    const adminLinks = NAVIGATION_LINKS.filter(item => item.path === "/admin");

    return (
        <div className="drawer-side is-drawer-close:overflow-visible">
            {/* overlay to close sidebar on small screens */}
            <label htmlFor="my-drawer"
                aria-label="close sidebar"
                className="drawer-overlay"
            ></label>

            <div className="flex min-h-full flex-col bg-base-200 is-drawer-close:w-14 is-drawer-open:w-64 transition-all duration-200">

                {/* sidebar header */}
                <div className="p-4 w-full">
                    <div className="flex items-center gap-3 is-drawer-close:justify-center">
                        <img
                            src="st-icon-logo.jpg"
                            alt="SupplyTiger Logo"
                            className="size-10 bg-primary rounded-xl flex items-center justify-center shrink-0"
                        />
                        <span className="font-bold text-lg is-drawer-close:hidden">SupplyTiger</span>
                    </div>
                </div>

                {/* search bar placeholder */}
                <div className="px-4 py-2 is-drawer-close:hidden">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="input input-sm w-full pl-8"
                            readOnly
                        />
                        <Search className="size-4 absolute left-2 top-1/2 transform -translate-y-1/2" />
                    </div>
                </div>


                {/* main navigation links */}
                <ul className="menu w-full grow flex flex-col gap-2">
                    {mainLinks.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    data-tip={item.name}
                                    className={`is-drawer-close:tooltip is-drawer-close:tooltip-right is-drawer-close:justify-center ${isActive ? "bg-primary text-primary-content" : ""}`}
                                >
                                    {item.icon}
                                    <span className="is-drawer-close:hidden">{item.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                {/* admin link — visually separated */}
                <div className="w-full px-2 pb-2">
                    <div className="divider my-1 is-drawer-close:hidden"></div>
                    <ul className="menu w-full">
                        {adminLinks.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        data-tip={item.name}
                                        className={`is-drawer-close:tooltip is-drawer-close:tooltip-right is-drawer-close:justify-center ${isActive ? "bg-primary text-primary-content" : ""}`}
                                    >
                                        {item.icon}
                                        <span className="is-drawer-close:hidden">{item.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* user info */}
                <div className="p-4 w-full border-t border-base-300">
                    <div className="flex items-center gap-3 is-drawer-close:justify-center">
                        <div className="avatar shrink-0">
                            <img
                                src={user?.imageUrl}
                                alt={user?.fullName}
                                className="w-10 h-10 rounded-full"
                            />
                        </div>
                        <div className="flex-1 min-w-0 is-drawer-close:hidden">
                            <p className="text-sm font-semibold truncate">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <div className="text-xs opacity-60 truncate">
                                {user?.emailAddresses?.[0]?.emailAddress}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Sidebar;
