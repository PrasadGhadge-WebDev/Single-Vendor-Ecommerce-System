import { toast } from "react-toastify";

export const ensureLoggedIn = ({ user, navigate, location, message }) => {
  if (user) return true;

  toast.warning(message || "Please login to continue");

  const from = location?.pathname
    ? `${location.pathname}${location.search || ""}${location.hash || ""}`
    : "/";

  navigate("/login", { state: { from } });
  return false;
};

