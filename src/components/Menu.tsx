"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from '@/context/authContext';
import { 
  LayoutDashboard, 
  Users, 
  User, 
  CalendarDays, 
  School, 
  BookOpen, 
  FileText, 
  ClipboardList, 
  MessageSquare, 
  Award, 
  Megaphone, // Pastikan ini ada warnanya (ter-import)
  LogOut, 
  Settings,
  UserCog,
  Volume2, // Alternatif kalau Megaphone rusak
  CalendarCheck
} from 'lucide-react';

const menuItems = [
  {
    title: "MENU UTAMA",
    items: [
      {
        icon: LayoutDashboard,
        label: "Beranda",
        getHref: (role: string) => `/${role === 'admin' ? 'admin' : role === 'teacher' ? 'teacher' : role === 'student' ? 'student' : ''}`,
        visible: ["admin", "teacher", "student"],
        exactMatch: true, 
      },
      {
        icon: Users,
        label: "Guru",
        href: "/list/teachers",
        visible: ["admin", "teacher"],
      },
      {
        icon: User,
        label: "Siswa",
        href: "/list/students",
        visible: ["admin", "teacher"],
      },
      {
        icon: School,
        label: "Kelas",
        href: "/list/classes",
        visible: ["admin", "teacher"],
      },
      {
        icon: BookOpen,
        label: "Mata Pelajaran",
        href: "/list/subjects",
        visible: ["admin", "teacher"],
      },
      {
        icon: CalendarCheck,
        label: "Jadwal",
        href: "/list/schedules",
        visible: ["admin"],
      },
      // {
      //   icon: FileText,
      //   label: "Ujian",
      //   getHref: (role: string) => `/${role}/examsPage`, 
      //   visible: ["admin", "teacher", "student"],
      // },

      {
        icon: FileText,
        label: "Ujian",
        getHref: (role: string | null) => { 
          if (role === 'admin') return '/admin/examPage';
          if (role === 'teacher') return '/teacher/examsPage'; 
          if (role === 'student') return '/student/examPage';
          return '/'; 
      },
        visible: ["admin", "teacher", "student",],
      },
      {
        icon: ClipboardList,
        label: "Tugas PR",
        getHref: (role: string) => `/${role}/homework`,
        visible: ["admin", "teacher", "student"],
      },
      {
        icon: MessageSquare,
        label: "Diskusi",
        href: "/list/discussions",
        visible: ["admin", "teacher", "student"],
      },
      {
        icon: Award,
        label: "Nilai",
        getHref: (role: string) => `/${role}/results`,
        visible: ["admin", "teacher", "student"],
      },
      {
        icon: CalendarDays,
        label: "Event",
        href: "/list/events",
        visible: ["admin", "teacher", "student"],
      },
      {
        icon: Megaphone, // Kalau masih tidak muncul, ganti jadi "Volume2"
        label: "Pengumuman",
        href: "/list/announcements",
        visible: ["admin", "teacher", "student"],
      },
    ],
  },
  {
    title: "LAINNYA",
    items: [
      {
        icon: User,
        label: "Profil",
        getHref: (role: string) => `/profile/${role === 'teacher' ? 'guru' : 'siswa'}`,
        visible: ["teacher", "student"],
      },
      {
        icon: UserCog,
        label: "Pengguna",
        href: "/admin/users",
        visible: ["admin"],
      },
      {
        icon: LogOut,
        label: "Keluar",
        href: "/logout",
        visible: ["admin", "teacher", "student"],
        isLogout: true,
      },
    ],
  },
];

const Menu = () => {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
     return (
       <div className="mt-4 space-y-4 px-2">
         {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-md animate-pulse"/>)}
       </div>
     );
  }

  const currentRole = user?.role;

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((section) => (
        <div className="flex flex-col gap-2" key={section.title}>
          <span className="hidden lg:block text-gray-400 font-bold text-xs uppercase tracking-wider my-4 px-4">
            {section.title}
          </span>
          
          {section.items.map((item) => {
            if (!currentRole || !item.visible.includes(currentRole)) return null;

            let finalHref = item.href || "/";
            if (item.getHref) {
              finalHref = item.getHref(currentRole);
            }

            // --- PERBAIKAN LOGIKA ACTIVE STATE ---
            let isActive = false;
            
            if ((item as any).exactMatch) {
              // Jika exactMatch: true, URL harus sama persis
              isActive = pathname === finalHref;
            } else {
              // Jika tidak, pakai logika 'dimulai dengan' (biar sub-menu tetap aktif)
              isActive = pathname === finalHref || (finalHref !== '/' && pathname.startsWith(finalHref));
            }
            // -------------------------------------

            if ((item as any).isLogout) {
              return (
                <button
                  key={item.label}
                  onClick={handleLogout}
                  className="flex items-center justify-center lg:justify-start gap-3 text-red-500 py-3 md:px-4 rounded-lg hover:bg-red-50 transition-all duration-200 w-full"
                >
                  <item.icon size={20} />
                  <span className="hidden lg:block font-medium">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                href={finalHref}
                key={item.label}
                className={`
                  flex items-center justify-center lg:justify-start gap-3 py-3 md:px-4 rounded-lg transition-all duration-200
                  ${isActive 
                    ? "bg-lamaSky text-blue-600 shadow-sm font-semibold" 
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }
                `}
              >
                <item.icon size={20} className={`flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                <span className="hidden lg:block truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;