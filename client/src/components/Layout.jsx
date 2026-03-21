/**
 * LAYOUT COMPONENT
 *
 * @description Root layout wrapper component that provides consistent structure
 * across all pages. Includes header, page content (Outlet), and footer.
 *
 * @component
 * @returns {JSX.Element} Layout structure with Header, Outlet (nested routes), and Footer
 *
 * @usage
 * Used in React Router as a parent route to wrap all child routes
 * <Route path="/" element={<Layout />}>
 *   <Route index element={<Home />} />
 * </Route>
 *
 * @architecture
 * The Outlet component from React Router renders child routes in place
 * This allows header/footer to persist across different pages
 */

import React, { useContext } from "react";
import Footer from "./Footer";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import ToastHost from "./ToastHost";
import { UserContext } from "../context/userContext";

/**
 * Main Layout Component
 * @returns {JSX.Element} Rendered layout with persistent Header/Footer
 */
const Layout = () => {
  const { toasts, dismissToast } = useContext(UserContext);

  return (
    <div className="app-shell">
      {/* Header: Contains navigation, branding, user info */}
      <Header />

      {/* Outlet: React Router renders child route component here */}
      {/* This allows navigation between pages while keeping header/footer visible */}
      <main className="app-content">
        <Outlet />
      </main>

      {/* Footer: Contains site info, links, copyright */}
      <Footer />

      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default Layout;
