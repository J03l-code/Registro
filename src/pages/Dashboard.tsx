import { useState, useEffect } from "react"
import { Users, DollarSign, Wallet, Activity, Bell, ArrowUpRight, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card"
import { useNavigate } from "react-router-dom"

export function Dashboard() {
    const navigate = useNavigate()
    const [metrics, setMetrics] = useState({
        total: 0,
        calientes: 0,
        tareas_hoy: 0,
        conversion: '0%',
        pipeline: 0,
        revenue: 0,
        
        // Addons
        active_clients_count: 0,
        active_payments_received: 0,
        active_payments_pending: 0,
        tasks_completion_pct: 0
    });
    const [recent, setRecent] = useState<any[]>([]);
    const [financialHistory, setFinancialHistory] = useState<any[]>([]);
    const [upcomingRenewals, setUpcomingRenewals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard.php')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setMetrics(data.metrics);
                    setRecent(data.recent || []);
                    setFinancialHistory(data.financial_history || []);
                    setUpcomingRenewals(data.upcoming_renewals || []);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const formatMoney = (val: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(val);
    }

    const stats = [
        { name: 'Ingresos Clientes Activos', value: formatMoney(metrics.active_payments_received), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { name: 'Cobros Pendientes/Vencidos', value: formatMoney(metrics.active_payments_pending), icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { name: 'Clientes Activos', value: metrics.active_clients_count, icon: Users, color: 'text-brand-600', bg: 'bg-brand-50' },
        { name: 'Progreso de Proyectos', value: `${metrics.tasks_completion_pct}% completado`, icon: Activity, color: 'text-orange-500', bg: 'bg-orange-50' },
    ];

    // Buscar el máximo valor en el historial financiero para escalar la gráfica
    const maxRevenue = financialHistory.length > 0 ? Math.max(...financialHistory.map(d => d.total)) : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard General</h1>
                    <p className="text-gray-500 mt-1 text-sm">Monitorea tus finanzas, renovaciones y el progreso de tus proyectos activos en tiempo real.</p>
                </div>
            </div>

            {/* Tarjetas Métricas */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.name} className="overflow-hidden border-gray-100 shadow-sm relative">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.name}</p>
                                        <p className="mt-2 text-2xl font-black text-gray-950">
                                            {loading ? '...' : stat.value}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                                        <Icon className={`w-5 h-5 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Fila Media: Alertas de Renovaciones y Gráfico de Ingresos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Alertas de Renovaciones Próximas (Opción 1) */}
                <Card className="shadow-sm border-gray-200 lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100">
                        <CardTitle className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                            <Bell className="w-4 h-4 text-amber-500" />
                            Renovaciones del Mes (Próx. 30 días)
                        </CardTitle>
                        <span className="text-[10px] font-black px-2 py-0.5 bg-amber-50 text-amber-800 rounded">
                            {upcomingRenewals.length} alertas
                        </span>
                    </CardHeader>
                    <CardContent className="p-5">
                        {loading && <p className="text-gray-400 text-xs font-medium">Buscando vencimientos...</p>}
                        {!loading && upcomingRenewals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                                <CheckCircle className="w-10 h-10 text-emerald-500" />
                                <h4 className="font-bold text-xs text-gray-900">¡Todo al día!</h4>
                                <p className="text-[11px] text-gray-400 font-medium">No hay servicios (hosting/dominios) por vencer este mes.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingRenewals.map(ren => {
                                    const daysLeft = Math.ceil((new Date(ren.next_due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                                    return (
                                        <div 
                                            key={ren.id}
                                            onClick={() => navigate(`/clientes-activos/${ren.active_client_id}`)}
                                            className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 hover:border-amber-300 bg-white hover:bg-amber-50/20 shadow-sm transition-all cursor-pointer group"
                                        >
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-xs text-gray-900 truncate group-hover:text-amber-800 transition-colors">{ren.service_name}</h4>
                                                <p className="text-[10px] text-gray-400 font-bold truncate">{ren.client_name}</p>
                                                <span className={`text-[9px] font-black uppercase tracking-wider block mt-1 ${daysLeft <= 7 ? 'text-red-500' : 'text-amber-600'}`}>
                                                    Vence en {daysLeft} días ({ren.next_due_date})
                                                </span>
                                            </div>
                                            <div className="text-right shrink-0 flex items-center gap-1.5 pl-2">
                                                <span className="font-black text-xs text-gray-900">${parseFloat(ren.price).toFixed(0)}</span>
                                                <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-amber-600 transition-colors" />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Historial Financiero Anual - CSS Bar Chart (Opción 6) */}
                <Card className="shadow-sm border-gray-200 lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100">
                        <CardTitle className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                            📊 Historial de Ingresos Mensuales ({new Date().getFullYear()})
                        </CardTitle>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            Recaudado Total: {formatMoney(metrics.active_payments_received)}
                        </span>
                    </CardHeader>
                    <CardContent className="p-5">
                        {loading ? (
                            <p className="text-gray-400 text-xs font-medium">Construyendo análisis...</p>
                        ) : (
                            <div className="space-y-4">
                                {/* Bar Chart en CSS/Tailwind */}
                                <div className="h-44 flex items-end justify-between gap-1.5 pt-6 pb-2 border-b border-gray-100">
                                    {financialHistory.map(d => {
                                        const pct = maxRevenue > 0 ? (d.total / maxRevenue) * 100 : 0;
                                        return (
                                            <div key={d.month} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-1 bg-gray-950 text-white text-[9px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow z-10">
                                                    {formatMoney(d.total)}
                                                </div>
                                                {/* Barra */}
                                                <div 
                                                    style={{ height: `${Math.max(pct, 4)}%` }}
                                                    className={`w-full rounded-t-lg transition-all duration-500
                                                        ${d.total > 0 
                                                            ? 'bg-gradient-to-t from-emerald-500 to-teal-400 group-hover:from-emerald-600 group-hover:to-teal-500 shadow-sm' 
                                                            : 'bg-gray-50'
                                                        }`}
                                                />
                                                <span className="text-[10px] text-gray-400 font-bold mt-2">{d.month}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    <span>Enero</span>
                                    <span>Diciembre</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Fila Inferior: Historial de Leads y Tasa de Conversión */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle>Historial Automático de Leads / Prospectos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {loading && <p className="text-gray-400">Cargando Trazabilidad...</p>}
                            {!loading && recent.length === 0 && <p className="text-gray-400">No hay actividad reciente rastreada.</p>}
                            {recent.map((act, i) => (
                                <div key={i} className="flex flex-col border-l-2 border-brand-200 pl-4 py-2 relative">
                                    <div className="absolute w-2 h-2 bg-brand-500 rounded-full -left-[5px] top-[14px]"></div>
                                    <span className="text-sm text-gray-400 mb-1">
                                        {new Date(act.created_at).toLocaleString()}
                                    </span>
                                    <span className="font-medium text-gray-900">{act.summary}</span>
                                    <span className="text-sm text-gray-500 mt-0.5">
                                        Prospecto: <strong className="text-gray-700">{act.lead_name}</strong>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-100 h-fit">
                    <CardHeader>
                        <CardTitle>Análisis Financiero de Prospectación</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-emerald-50 rounded-lg p-5 border border-emerald-100 mb-4">
                            <h4 className="font-semibold text-emerald-900 mb-2">Tasa de Conversión: {metrics.conversion}</h4>
                            <p className="text-sm text-emerald-700 leading-relaxed">
                                Basado en tu total de {metrics.total} prospectos. De los cuales {metrics.calientes} se convirtieron en clientes cerrados/calientes.
                            </p>
                        </div>
                        <div className="bg-brand-50 rounded-lg p-5 border border-brand-100">
                            <h4 className="font-semibold text-brand-900 mb-2">Seguimiento Económico del Pipeline</h4>
                            <p className="text-sm text-brand-700 leading-relaxed">
                                El embudo de ventas está monitoreando un volumen de negociación estimado de {formatMoney(metrics.pipeline)} en cotizaciones pendientes. Ingresa a la tabla de Clientes (CRM) para agendar llamadas de seguimiento.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
