import { useEffect, useState } from "react"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import { Users, LayoutDashboard, CalendarDays, LogOut, Archive, Receipt, Star } from "lucide-react"
import { cn } from "../../lib/utils"
import { GlobalSearch } from "../ui/GlobalSearch"

export function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [agendaCount, setAgendaCount] = useState(0);

    // Protección de Rutas (Private Router a nivel Layout)
    useEffect(() => {
        const token = localStorage.getItem('crm_token');
        if (!token) {
            navigate('/login', { replace: true });
            return;
        }
        // Badge de agenda - tareas de hoy
        fetch('/api/agenda.php?count_today=1')
            .then(r => r.json())
            .then(d => { if (d.success) setAgendaCount(d.count || 0) })
            .catch(() => {})
    }, [navigate]);

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        localStorage.removeItem('crm_token');
        localStorage.removeItem('crm_user');
        navigate('/login', { replace: true });
    }

    const navLinks = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Clientes', path: '/clientes', icon: Users },
        { name: 'Clientes Activos', path: '/clientes-activos', icon: Star },
        { name: 'Contactados', path: '/contactados', icon: Archive },
        { name: 'Agenda', path: '/agenda', icon: CalendarDays },
        { name: 'Nota de venta', path: '/nota-venta', icon: Receipt },
    ];


    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="h-16 flex items-center px-4 border-b border-gray-200 gap-2">
                    <img src="/logo-jd-clean.png" alt="JiyaneDesign" className="w-8 h-8 object-contain shrink-0" />
                    <span className="font-black text-gray-900 text-base tracking-tight">JiyaneDesign</span>
                </div>
                {/* Búsqueda global en sidebar */}
                <div className="px-4 pt-4 pb-2">
                    <GlobalSearch />
                </div>
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));

                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={cn(
                                    "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-brand-50 text-brand-700"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                )}
                            >
                                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                                <span className="flex-1">{link.name}</span>
                                {link.path === '/agenda' && agendaCount > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
                                        {agendaCount > 9 ? '9+' : agendaCount}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>
                <div className="p-4 border-t border-gray-200">
                    <button onClick={handleLogout} className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 transition-colors w-full">
                        <LogOut className="w-5 h-5 mr-3 text-red-500" />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar mobile */}
                <header className="h-16 md:hidden bg-white border-b border-gray-200 flex items-center px-4 gap-3">
                    <div className="flex items-center gap-1.5 shrink-0">
                        <img src="/logo-jd-clean.png" alt="JiyaneDesign" className="w-7 h-7 object-contain" />
                        <span className="font-black text-gray-900 text-sm">JiyaneDesign</span>
                    </div>
                    <div className="flex-1">
                        <GlobalSearch />
                    </div>
                    <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 shrink-0">
                        <LogOut className="w-5 h-5" />
                    </button>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
