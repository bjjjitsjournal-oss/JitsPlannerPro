import { Home, Calendar, FileText, PenTool, Award, Video } from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/classes", label: "Classes", icon: Calendar },
  { path: "/notes", label: "Notes", icon: FileText },
  { path: "/videos", label: "Videos", icon: Video },
  { path: "/belts", label: "Belts", icon: Award },
  { path: "/drawing", label: "Draw", icon: PenTool },
];

export default function StaticNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 max-w-md w-full bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="flex justify-around py-2">
        {navItems.map(({ path, label, icon: Icon }) => (
          <a 
            key={path} 
            href={path}
            className="flex flex-col items-center py-3 px-4 transition-all duration-200 rounded-xl text-gray-600 hover:text-bjj-navy hover:bg-gray-50 border-2 border-transparent"
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}