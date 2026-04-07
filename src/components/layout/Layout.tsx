import { Outlet, Link, useLocation } from "react-router-dom"
import { Users, LayoutDashboard, CalendarDays, LogOut, Briefcase } from "lucide-react"
import { cn } from "../../lib/utils"

export function Layout() {
    const location = useLocation();

    const navLinks = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Clientes', path: '/clientes', icon: Users },
        { name: 'Agenda', path: '/agenda', icon: CalendarDays },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <Briefcase className="w-6 h-6 text-brand-600 mr-2" />
                    <span className="font-bold text-gray-900 text-lg tracking-tight">CRM SaaS</span>
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
                                {link.name}
                            </Link>
                        )
                    })}
                </nav>
                <div className="p-4 border-t border-gray-200">
                    <Link to="/login" className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 transition-colors w-full">
                        <LogOut className="w-5 h-5 mr-3" />
                        Cerrar sesión
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar mobile */}
                <header className="h-16 md:hidden bg-white border-b border-gray-200 flex items-center px-4 justify-between">
                    <div className="flex items-center">
                        <Briefcase className="w-6 h-6 text-brand-600 mr-2" />
                        <span className="font-bold text-gray-900 leading-none">CRM</span>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
