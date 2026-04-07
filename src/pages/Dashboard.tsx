import { Users, PhoneCall, Target, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card"

const mockStats = [
    { name: 'Clientes Totales', value: '248', icon: Users, change: '+12%', changeType: 'positive' },
    { name: 'Leads Calientes', value: '42', icon: Target, change: '+4%', changeType: 'positive' },
    { name: 'Llamadas Hoy', value: '15', icon: PhoneCall, change: '-2', changeType: 'negative' },
    { name: 'Conversión', value: '24%', icon: TrendingUp, change: '+2.1%', changeType: 'positive' },
];

export function Dashboard() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 mt-1 text-sm">Resumen de tu actividad y leads de hoy.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {mockStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.name} className="overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 truncate">{stat.name}</p>
                                        <p className="mt-2 text-3xl font-semibold text-gray-900">{stat.value}</p>
                                    </div>
                                    <div className="bg-brand-50 p-3 rounded-lg">
                                        <Icon className="w-6 h-6 text-brand-600" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm">
                                    <span className={stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}>
                                        {stat.change}
                                    </span>
                                    <span className="text-gray-500 ml-2">vs el mes pasado</span>
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
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">Llamada de seguimiento</span>
                                        <span className="text-sm text-gray-500">Con Carlos Mendoza</span>
                                    </div>
                                    <span className="text-sm text-gray-400">Hace {i + 1} horas</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tareas Prioritarias</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex items-center space-x-3">
                                    <input type="checkbox" className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded" />
                                    <span className="text-gray-700">Contactar lead caliente (Web)</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
