import { Calendar, PhoneCall, CheckCircle2, Clock } from "lucide-react"
import { Card, CardContent } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"

const pendingFollowups = [
    { id: 1, name: 'María García', company: 'Tech Corp', action: 'Llamada de seguimiento', date: 'Hoy, 14:00', type: 'call', priority: 'high' },
    { id: 2, name: 'Carlos López', company: 'Digital Services', action: 'Enviar propuesta comercial', date: 'Hoy, 16:30', type: 'email', priority: 'medium' },
    { id: 3, name: 'Ana Torres', company: 'Logistics SA', action: 'Reunión de cierre', date: 'Mañana, 10:00', type: 'meeting', priority: 'high' },
];

export function Agenda() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Agenda de Seguimiento</h1>
                    <p className="text-gray-500 mt-1 text-sm">Próximos contactos y tareas por realizar.</p>
                </div>
            </div>

            <Card>
                <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center text-sm text-gray-600 font-medium">
                    <div className="flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-brand-600" />
                        Agenda para los próximos 7 días
                    </div>
                </div>
                <CardContent className="p-0">
                    <ul className="divide-y divide-gray-200">
                        {pendingFollowups.map((item) => (
                            <li key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 mt-1">
                                            {item.type === 'call' && <PhoneCall className="w-5 h-5 text-brand-500" />}
                                            {item.type === 'email' && <CheckCircle2 className="w-5 h-5 text-gray-400" />}
                                            {item.type === 'meeting' && <Calendar className="w-5 h-5 text-purple-500" />}
                                        </div>
                                        <div className="ml-4">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-gray-900">{item.action}</p>
                                                <Badge variant={item.priority === 'high' ? 'error' : 'warning'}>
                                                    {item.priority === 'high' ? 'Urgente' : 'Normal'}
                                                </Badge>
                                            </div>
                                            <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                                                <span className="font-medium text-gray-700">{item.name}</span>
                                                <span>({item.company})</span>
                                            </div>
                                            <div className="mt-2 text-sm flex items-center text-brand-600 font-medium">
                                                <Clock className="w-4 h-4 mr-1.5" />
                                                {item.date}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">Reprogramar</Button>
                                        <Button size="sm" className="bg-brand-600 text-white">Completar</Button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
