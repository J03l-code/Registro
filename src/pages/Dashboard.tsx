import { useState, useEffect } from "react"
import { Users, PhoneCall, DollarSign, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card"

export function Dashboard() {
    const [metrics, setMetrics] = useState({
        total: 0,
        calientes: 0,
        tareas_hoy: 0,
        conversion: '0%',
        pipeline: 0,
        revenue: 0
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

    const formatMoney = (val: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(val);
    }

    const stats = [
        { name: 'Potencial a Cobrar', value: formatMoney(metrics.pipeline), icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { name: 'Ingresos Cerrados', value: formatMoney(metrics.revenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { name: 'Clientes Totales', value: metrics.total, icon: Users, color: 'text-brand-600', bg: 'bg-brand-50' },
        { name: 'Tareas Asignadas (Urgentes)', value: metrics.tareas_hoy, icon: PhoneCall, color: 'text-orange-500', bg: 'bg-orange-50' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard General</h1>
                    <p className="text-gray-500 mt-1 text-sm">Monitorea tus finanzas y clientes conectados en tiempo real.</p>
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
                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle>Historial Automático de Vida</CardTitle>
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
                                        Cliente Analizado: <strong className="text-gray-700">{act.lead_name}</strong>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-100 h-fit">
                    <CardHeader>
                        <CardTitle>Análisis Financiero de Interés</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-emerald-50 rounded-lg p-5 border border-emerald-100 mb-4">
                            <h4 className="font-semibold text-emerald-900 mb-2">Tasa de Conversión: {metrics.conversion}</h4>
                            <p className="text-sm text-emerald-700 leading-relaxed">
                                Basado en tu total de {metrics.total} leads. De los cuales {metrics.calientes} están en estatus Ganado/Caliente.
                            </p>
                        </div>
                        <div className="bg-brand-50 rounded-lg p-5 border border-brand-100">
                            <h4 className="font-semibold text-brand-900 mb-2">Seguimiento Económico del Pipeline</h4>
                            <p className="text-sm text-brand-700 leading-relaxed">
                                La tabla de Trazabilidad Total está monitoreando un volumen de negociación pendiente de {formatMoney(metrics.pipeline)}. Ingresa a la tabla de Clientes para asignarles tareas de seguimiento a las cotizaciones más altas.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
