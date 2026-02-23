import {Outlet} from "react-router";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import Footer from "../components/Footer.jsx";

const DashboardLayout = () => {
    return (
        <div className="drawer lg:drawer-open">
            <input
            id="my-drawer"
            type="checkbox"
            className="drawer-toggle"
            defaultChecked
            />
            <div className="drawer-content flex flex-col min-h-screen">
                <Navbar />
                <div className="p-4 flex-1">
                    <Outlet />
                    </div>
                <Footer />
            </div>
            <Sidebar />
        </div>
    );
}

export default DashboardLayout;