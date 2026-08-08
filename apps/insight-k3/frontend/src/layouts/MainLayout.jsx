import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles/layout.css";
import "../styles/sidebar.css";

function MainLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="app">
      <Topbar
        toggleSidebar={() => setOpen((currentOpen) => !currentOpen)}
      />

      {open && (
        <div
          className="overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <Sidebar
        open={open}
        close={() => setOpen(false)}
      />

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
