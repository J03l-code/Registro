import { useState, useEffect } from "react"
import { Users, PhoneCall, Target, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card"

export function Dashboard() {
    const [metrics, setMetrics] = useState({
        total: 0,
        calientes: 0,
        tareas_hoy: 0,
        conversion: '0%'
    });
    const [recent, setRecent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard.php')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setMetrics(data.metrics);
                    setRecent(data.recent || []);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const stats = [
        { name: 'Clientes Totales', value: metrics.total, icon: Users, color: 'text-brand-600', bg: 'bg-brand-50' },
        { name: 'Leads Calientes', value: metrics.calientes, icon: Target, color: 'text-red-500', bg: 'bg-red-50' },
        { name: 'Tareas Pendientes', value: metrics.tareas_hoy, icon: PhoneCall, color: 'text-orange-500', bg: 'bg-orange-50' },
        { name: 'Conversión Est.', value: metrics.conversion, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard General</h1>
                    <p className="text-gray-500 mt-1 text-sm">Monitorea tus clientes conectados en tiempo real.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.name} className="overflow-hidden border-gray-100 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 truncate">{stat.name}</p>
                                        <p className="mt-2 text-3xl font-semibold text-gray-900">
                                            {loading ? '...' : stat.value}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-lg ${stat.bg}`}>
                                        <Icon className={`w-6 h-6 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {loading && <p className="text-gray-400">Cargando...</p>}
                            {!loading && recent.length === 0 && <p className="text-gray-400">No hay actividad reciente.</p>}
                            {recent.map((act, i) => (
                                <div key={i} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">{act.summary}</span>
                                        <span className="text-sm text-gray-500">
                                            {act.lead_name ? `Con ${act.lead_name}` : 'Actividad general'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(act.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Simulamos las llamadas u otras tareas del mes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información de Servidor</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-brand-50 rounded-lg p-5 border border-brand-100">
                            <h4 className="font-semibold text-brand-900 mb-2">Conectado a MySQL Hostinger</h4>
                            <p className="text-sm text-brand-700 leading-relaxed">
                                Tu ecosistema SaaS está conectado correctamente con la base de datos de producción mediante la API REST en PHP. Todas las visualizaciones de este panel analítico se calculan dinámicamente según la cantidad de clientes ingresados.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
