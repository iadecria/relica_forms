import { useState } from "react";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

export default function AdminApp() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem("admin_unlocked") === "1"
  );

  const handleLogout = () => {
    sessionStorage.removeItem("admin_unlocked");
    setUnlocked(false);
  };

  return unlocked ? (
    <AdminDashboard onLogout={handleLogout} />
  ) : (
    <AdminLogin onUnlock={() => setUnlocked(true)} />
  );
}
