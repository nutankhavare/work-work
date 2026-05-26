import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import IndexPage from "../Pages/RolesPermissions/IndexPage";
import EditPage from "../Pages/RolesPermissions/EditPage";
import CreatePage from "../Pages/RolesPermissions/CreatePage";
import MobileHeader from "../Components/MobileHeader";
import VehicleIndexPage from "../Pages/Vehicles/VehicleIndexPage";
import VehicleShowPage from "../Pages/Vehicles/VehicleShowPage";
import VehicleCreatePage from "../Pages/Vehicles/VehicleCreatePage";
import VehicleEditPage from "../Pages/Vehicles/VehicleEditPage";
import DriverIndexPage from "../Pages/Drivers/DriverIndexPage";
import DriverShowPage from "../Pages/Drivers/DriverShowPage";
import DriverEditPage from "../Pages/Drivers/DriverEditPage";
import DriverCreatePage from "../Pages/Drivers/DriverCreatePage";
import BookingIndexPage from "../Pages/Bookings/BookingIndexPage";
import BookingShowPage from "../Pages/Bookings/BookingShowPage";
import DeviceManagementIndexPage from "../Pages/DeviceManagement/IndexPage";
import AppUsersIndexPage from "../Pages/AppUsers/IndexPage";
import StaffIndexPage from "../Pages/Staffs/StaffIndexPage";
import StaffCreatePage from "../Pages/Staffs/StaffCreatePage";
import StaffEditPage from "../Pages/Staffs/StaffEditPage";
import VehicleTrackPage from "../Pages/Vehicles/VehicleTrackPage";
import TravellerIndexPage from "../Pages/Travelers/TravellerIndexPage";
import TravellerShowPage from "../Pages/Travelers/TravellerShowPage";
import TravellerEditPage from "../Pages/Travelers/TravellerEditPage";
import StaffShowPage from "../Pages/Staffs/StaffShowPage";
import DashboardPage from "../Pages/DashboardPage";
import ComplianceIndexPage from "../Pages/Compliance/ComplianceIndexPage";
import ComplianceCreatePage from "../Pages/Compliance/ComplianceCreatePage";
import SettingsPage from "../Pages/Settings/SettingsPage";
import BulkCommunicationPage from "../Pages/BulkCommunication/BulkCommunicationPage";
import CustomerCarePage from "../Pages/CustomerCare/CustomerCarePage";
import ReportHub from "../Pages/Reports/ReportHub";
import FeedbacksPage from "../Pages/Feedbacks/FeedbacksPage";
import FeedbackResolve from "../Pages/Feedbacks/FeedbackResolve";

const AuthLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Listen for the custom event from PageHeader
  useEffect(() => {
    const handleToggle = () => toggleSidebar();
    document.addEventListener('toggle-sidebar', handleToggle);
    return () => document.removeEventListener('toggle-sidebar', handleToggle);
  }, [isSidebarOpen]);
  return (
    <div className="flex h-screen w-full bg-[#f5f6fa] overflow-hidden font-[var(--font-manrope)]">
      {/* Sidebar - Fixed/Static depending on screen */}
      <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full w-full relative overflow-hidden transition-all duration-300 ease-in-out">



        <div className="flex-1 h-full w-full overflow-y-auto custom-scrollbar">
          <div className="mx-auto w-full max-w-[1600px]">
            <Routes>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />

              {/* Roles and Permissions Pages*/}
              <Route path="roles" element={<IndexPage />} />
              <Route path="roles/create" element={<CreatePage />} />
              <Route path="roles/edit/:id" element={<EditPage />} />

              {/* Staff Management */}
              <Route path="staff" element={<StaffIndexPage />} />
              <Route path="staff/create" element={<StaffCreatePage />} />
              <Route path="staff/edit/:id" element={<StaffEditPage />} />
              <Route path="staff/show/:id" element={<StaffShowPage />} />

              {/* Vehicle Pages */}
              <Route path="vehicles" element={<VehicleIndexPage />} />
              <Route path="vehicles/show/:id" element={<VehicleShowPage />} />
              <Route path="vehicles/create" element={<VehicleCreatePage />} />
              <Route path="vehicles/edit/:id" element={<VehicleEditPage />} />
              <Route path="/vehicles/track/:vehicleNumber" element={<VehicleTrackPage />} />

              {/* Driver Pages */}
              <Route path="drivers" element={<DriverIndexPage />} />
              <Route path="drivers/create" element={<DriverCreatePage />} />
              <Route path="drivers/show/:id" element={<DriverShowPage />} />
              <Route path="drivers/edit/:id" element={<DriverEditPage />} />

              {/* Device Management */}
              <Route path="devices" element={<DeviceManagementIndexPage />} />

              {/* App Users */}
              <Route path="app-users" element={<AppUsersIndexPage />} />

              {/* Booking Pages */}
              <Route path="bookings" element={<BookingIndexPage />} />
              <Route path="bookings/show/:id" element={<BookingShowPage />} />

              {/* Traveller Pages */}
              <Route path="travellers" element={<TravellerIndexPage />} />
              <Route path="travellers/show/:id" element={<TravellerShowPage />} />
              <Route path="travellers/edit/:id" element={<TravellerEditPage />} />

              {/* Compliance Module */}
              <Route path="compliance" element={<ComplianceIndexPage />} />
              <Route path="compliance/create" element={<ComplianceCreatePage />} />

              {/* Settings Page */}
              <Route path="settings" element={<SettingsPage />} />

              {/* Bulk Communication */}
              <Route path="bulk-communication" element={<BulkCommunicationPage />} />

              {/* Customer Care */}
              <Route path="customer-care" element={<CustomerCarePage />} />

              {/* Reports */}
              <Route path="reports" element={<ReportHub />} />

              {/* Feedbacks & Complaints */}
              <Route path="feedbacks" element={<FeedbacksPage />} />
              <Route path="feedbacks/resolve/:id" element={<FeedbackResolve />} />

            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
