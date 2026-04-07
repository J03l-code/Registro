import { useState, useEffect } from "react"
import { Calendar, PhoneCall, CheckCircle2, Clock, Plus, X, Target } from "lucide-react"
import { Card, CardContent } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"

export function Agenda() {
    const [followups, setFollowups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({ summary: '', type: 'LLAMADA', date: '' });
    const [saving, setSaving] = useState(false);

    const fetchAgenda = () => {
        setLoading(true);
        fetch('/api/agenda.php')
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.data)) {
                    setFollowups(data.data);
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchAgenda();
    }, []);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        fetch('/api/agenda.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    fetchAgenda(); // Refrescar lista final
                    setIsModalOpen(false);
                    setNewTask({ summary: '', type: 'LLAMADA', date: '' });
                }
            })
            .finally(() => setSaving(false));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Agenda de Seguimiento</h1>
                    <p className="text-gray-500 mt-1 text-sm">Programa y visualiza tus próximos contactos conectando con la BD.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="bg-brand-600 hover:bg-brand-700 h-10">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Tarea
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center text-sm text-gray-600 font-medium">
                    <div className="flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-brand-600" />
                        Agenda Activa
                    </div>
                </div>
                <CardContent className="p-0">
                    <ul className="divide-y divide-gray-100">
                        {loading && <li className="p-6 text-center text-gray-500">Sincronizando agenda...</li>}
                        {!loading && followups.length === 0 && (
                            <li className="p-10 text-center text-gray-500">Tu agenda está completamente libre en este momento.</li>
                        )}
                        {!loading && followups.map((item) => (
                            <li key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 mt-1">
                                            {item.type === 'LLAMADA' && <PhoneCall className="w-5 h-5 text-blue-500" />}
                                            {item.type === 'EMAIL' && <CheckCircle2 className="w-5 h-5 text-gray-400" />}
                                            {item.type === 'REUNIÓN' && <Calendar className="w-5 h-5 text-purple-500" />}
                                            {item.type === 'ACUERDO' && <Target className="w-5 h-5 text-green-500" />}
                                        </div>
                                        <div className="ml-4">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-gray-900">{item.summary}</p>
                                                <Badge variant="outline">{item.type}</Badge>
                                            </div>
                                            <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                                                {item.company && <span className="font-medium text-gray-700">Cliente: {item.company}</span>}
                                            </div>
                                            <div className="mt-2 flex items-center text-xs text-brand-600 font-medium bg-brand-50 px-2 py-1 rounded inline-flex">
                                                <Clock className="w-3.5 h-3.5 mr-1" />
                                                {new Date(item.scheduled_for).toLocaleString()}
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

            {/* Modal Nueva Tarea */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md animate-in zoom-in-95 duration-200 shadow-xl relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-gray-400">
                            <X className="w-5 h-5" />
                        </button>
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold">Añadir Actividad</h2>
                        </div>
                        <CardContent className="p-6">
                            <form onSubmit={handleAddTask} className="space-y-4">
                                <Input
                                    label="Detalle de la tarea"
                                    autoFocus
                                    required
                                    value={newTask.summary}
                                    onChange={(e) => setNewTask({ ...newTask, summary: e.target.value })}
                                    placeholder="Ej: Llamar a proveedor..."
                                />
                                <div className="flex flex-col gap-1.5 w-full">
                                    <label className="text-sm font-medium text-gray-700">Tipo de Acción</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newTask.type}
                                        onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                                    >
                                        <option value="LLAMADA">Llamada</option>
                                        <option value="EMAIL">Correo Electrónico</option>
                                        <option value="REUNIÓN">Reunión Virtual/Física</option>
                                        <option value="ACUERDO">Seguimiento Comercial</option>
                                    </select>
                                </div>
                                <Input
                                    label="Fecha y Hora Programada"
                                    type="datetime-local"
                                    required
                                    value={newTask.date}
                                    onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                                />
                                <div className="pt-4 flex justify-end">
                                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="mr-2">Cancelar</Button>
                                    <Button type="submit" disabled={saving} className="bg-brand-600 hover:bg-brand-700">
                                        {saving ? 'Guardando...' : 'Guardar Tarea'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
