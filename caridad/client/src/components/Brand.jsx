import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";

export default function Brand({ to = "/", variant = "light" }) {
  return (
    <Link className={`brand brand--${variant}`} to={to}>
      <span className="brand__mark">
        <Logo size={22} />
      </span>
      <span>
        Ayud<em>App</em>
      </span>
    </Link>
  );
}
