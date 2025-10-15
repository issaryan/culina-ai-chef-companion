import { Home, MessageSquare, BookHeart, User } from "lucide-react";
import { NavLink } from "react-router-dom";

export const TabBar = () => {
  return (
    <nav className="tab-bar">
      <div className="flex justify-around items-center h-16">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `tab-item ${isActive ? "active" : ""}`
          }
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">Accueil</span>
        </NavLink>

        <NavLink
          to="/culina-ai"
          className={({ isActive }) =>
            `tab-item ${isActive ? "active" : ""}`
          }
        >
          <MessageSquare className="h-6 w-6" />
          <span className="text-xs mt-1">Culina AI</span>
        </NavLink>

        <NavLink
          to="/recipes"
          className={({ isActive }) =>
            `tab-item ${isActive ? "active" : ""}`
          }
        >
          <BookHeart className="h-6 w-6" />
          <span className="text-xs mt-1">Mes Recettes</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `tab-item ${isActive ? "active" : ""}`
          }
        >
          <User className="h-6 w-6" />
          <span className="text-xs mt-1">Profil</span>
        </NavLink>
      </div>
    </nav>
  );
};
