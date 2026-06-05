import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Calendar, PhoneCall, CheckCircle2, Clock, Plus, X, Target, Mail, Trash2, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"

const TASK_TYPES = ['LLAMADA', 'EMAIL', 'REUNIÓN', 'ACUERDO']
const PRIORITIES = ['ALTA', 'MEDIA', 'BAJA']

const TYPE_META: Record<string, { icon: any; color: string; bg: string }> = {
    LLAMADA:  { icon: PhoneCall,    color: 'text-blue-500',   bg: 'bg-blue-50' },
    EMAIL:    { icon: Mail,         color: 'text-gray-500',   bg: 'bg-gray-50' },
    REUNIÓN:  { icon: Calendar,     color: 'text-purple-500', bg: 'bg-purple-50' },
    ACUERDO:  { icon: Target,       color: 'text-emerald-500',bg: 'bg-emerald-50' },
}

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
    ALTA:  { label: 'ALTA',  cls: 'bg-red-100 text-red-700 border border-red-200' },
    MEDIA: { label: 'MEDIA', cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
    BAJA:  { label: 'BAJA',  cls: 'bg-gray-100 text-gray-600 border border-gray-200' },
}

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay()
}

export function Agenda() {
    const navigate = useNavigate()
    const [followups, setFollowups] = useState<any[]>([])
    const [leads, setLeads] = useState<any[]>([])
    const [activeClients, setActiveClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [reschedulingTask, setReschedulingTask] = useState<any>(null)
    const [newDate, setNewDate] = useState("")
    const [statusTab, setStatusTab] = useState<'activas' | 'completadas'>('activas')
    const [filter, setFilter] = useState<'todas' | 'hoy' | 'semana' | 'vencidas'>('todas')
    const [filterType, setFilterType] = useState<string>('TODAS')
    const [calMonth, setCalMonth] = useState(new Date().getMonth())
    const [calYear, setCalYear] = useState(new Date().getFullYear())
    const [selectedDay, setSelectedDay] = useState<number | null>(null)

    const [newTask, setNewTask] = useState({
        summary: '', type: 'LLAMADA', date: '', priority: 'MEDIA',
        notes: '', lead_id: '', active_client_id: ''
    })

    const fetchAgenda = () => {
        setLoading(true)
        fetch('/api/agenda.php')
            .then(r => r.json())
            .then(d => { if (d.success) setFollowups(d.data || []) })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchAgenda()
        fetch('/api/clientes.php').then(r => r.json()).then(d => { if (d.success) setLeads(d.data || []) })
        fetch('/api/active_clients.php').then(r => r.json()).then(d => { if (d.success) setActiveClients(d.data || []) })
    }, [])

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        fetch('/api/agenda.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
        }).then(r => r.json()).then(d => {
            if (d.success) {
                fetchAgenda()
                setIsModalOpen(false)
                setNewTask({ summary: '', type: 'LLAMADA', date: '', priority: 'MEDIA', notes: '', lead_id: '', active_client_id: '' })
            }
        }).finally(() => setSaving(false))
    }

    const handleToggleComplete = (id: number, currentCompleted: boolean | number) => {
        const isCompleted = currentCompleted === true || Number(currentCompleted) === 1
        const action = isCompleted ? 'uncomplete' : 'complete'
        const msg = isCompleted ? "¿Marcar esta actividad como pendiente?" : "¿Marcar esta actividad como completada?"
        if (!confirm(msg)) return
        fetch('/api/agenda.php', { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ id, action }) 
        })
        .then(r => r.json())
        .then(d => { if (d.success) fetchAgenda() })
    }

    const handleDelete = (id: number) => {
        if (!confirm("¿Eliminar esta tarea de la agenda?")) return
        fetch('/api/agenda.php', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
            .then(r => r.json()).then(d => { if (d.success) fetchAgenda() })
    }

    const handleReschedule = (e: React.FormEvent) => {
        e.preventDefault()
        if (!reschedulingTask || !newDate) return
        setSaving(true)
        fetch('/api/agenda.php', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: reschedulingTask.id, action: 'reschedule', newDate }) })
            .then(r => r.json()).then(d => { if (d.success) { fetchAgenda(); setReschedulingTask(null); setNewDate("") } })
            .finally(() => setSaving(false))
    }

    const now = new Date()
    const today = now.toDateString()

    // Separamos tareas activas de completadas
    const activeTasks = useMemo(() => {
        return followups.filter(t => !t.completed || t.completed === '0' || t.completed === 0 || t.completed === false)
    }, [followups])

    const completedTasks = useMemo(() => {
        return followups.filter(t => t.completed === true || t.completed === 1 || t.completed === '1')
    }, [followups])

    const filtered = useMemo(() => {
        let list = statusTab === 'activas' ? [...activeTasks] : [...completedTasks]

        // Filtro tipo
        if (filterType !== 'TODAS') list = list.filter(t => t.type === filterType)
        // Filtro tiempo
        if (filter === 'hoy') list = list.filter(t => new Date(t.scheduled_for).toDateString() === today)
        else if (filter === 'semana') {
            const end = new Date(); end.setDate(end.getDate() + 7)
            list = list.filter(t => new Date(t.scheduled_for) <= end)
        } else if (filter === 'vencidas') list = list.filter(t => new Date(t.scheduled_for) < now)
        // Filtro día calendario
        if (selectedDay !== null) {
            list = list.filter(t => {
                const d = new Date(t.scheduled_for)
                return d.getFullYear() === calYear && d.getMonth() === calMonth && d.getDate() === selectedDay
            })
        }
        return list
    }, [activeTasks, completedTasks, statusTab, filter, filterType, selectedDay, calYear, calMonth])

    // Días con tareas pendientes en el mes actual
    const daysWithTasks = useMemo(() => {
        return new Set(
            activeTasks.filter(t => {
                const d = new Date(t.scheduled_for)
                return d.getFullYear() === calYear && d.getMonth() === calMonth
            }).map(t => new Date(t.scheduled_for).getDate())
        )
    }, [activeTasks, calYear, calMonth])

    const todayCount = activeTasks.filter(t => new Date(t.scheduled_for).toDateString() === today).length
    const overdueCount = activeTasks.filter(t => new Date(t.scheduled_for) < now).length

    const daysInMonth = getDaysInMonth(calYear, calMonth)
    const firstDay = getFirstDayOfMonth(calYear, calMonth)
    const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Agenda Pro</h1>
                    <p className="text-gray-500 mt-1 text-sm font-medium">Gestiona llamadas, reuniones y compromisos con tus clientes.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="bg-[#4a55c2] hover:bg-[#3b43a1] h-10 font-bold gap-1.5">
                    <Plus className="w-4 h-4" /> Nueva Actividad
                </Button>
            </div>

            {/* KPIs rápidos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Pendientes', value: activeTasks.length, cls: 'text-[#4a55c2]', bg: 'bg-indigo-50' },
                    { label: 'Para Hoy', value: todayCount, cls: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: '⚠️ Vencidas', value: overdueCount, cls: 'text-red-500', bg: 'bg-red-50' },
                    { label: 'Completadas', value: completedTasks.length, cls: 'text-slate-600', bg: 'bg-slate-100' },
                ].map(k => (
                    <div key={k.label} className={`${k.bg} rounded-2xl p-4 border border-white`}>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{k.label}</p>
                        <p className={`text-3xl font-black mt-1 ${k.cls}`}>{k.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Mini Calendario */}
                <Card className="border-gray-200 shadow-sm lg:col-span-1 h-fit">
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1) } else setCalMonth(m => m-1) }} className="text-gray-400 hover:text-gray-700 font-bold px-2 py-1 rounded hover:bg-gray-100">‹</button>
                            <span className="font-black text-sm text-gray-900">{MONTHS[calMonth]} {calYear}</span>
                            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1) } else setCalMonth(m => m+1) }} className="text-gray-400 hover:text-gray-700 font-bold px-2 py-1 rounded hover:bg-gray-100">›</button>
                        </div>
                    </div>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {DAYS.map(d => <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1
                                const isToday = new Date().getDate() === day && new Date().getMonth() === calMonth && new Date().getFullYear() === calYear
                                const hasTasks = daysWithTasks.has(day)
                                const isSelected = selectedDay === day
                                return (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDay(isSelected ? null : day)}
                                        className={`relative text-center text-xs font-bold py-1.5 rounded-lg transition-all
                                            ${isSelected ? 'bg-[#4a55c2] text-white shadow-md' : isToday ? 'bg-indigo-100 text-[#4a55c2]' : 'hover:bg-gray-100 text-gray-700'}
                                        `}
                                    >
                                        {day}
                                        {hasTasks && !isSelected && (
                                            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500 block" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                        {selectedDay && (
                            <button onClick={() => setSelectedDay(null)} className="mt-3 w-full text-xs font-bold text-indigo-600 hover:underline">
                                ✕ Limpiar filtro de día
                            </button>
                        )}
                    </CardContent>
                </Card>

                {/* Lista de tareas */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Selectores principales: Activas / Completadas */}
                    <div className="flex border-b border-gray-200 gap-4">
                        <button
                            onClick={() => { setStatusTab('activas'); setSelectedDay(null) }}
                            className={`pb-2 text-sm font-black transition-all border-b-2
                                ${statusTab === 'activas' ? 'border-[#4a55c2] text-[#4a55c2]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            📅 Actividades Pendientes ({activeTasks.length})
                        </button>
                        <button
                            onClick={() => { setStatusTab('completadas'); setSelectedDay(null) }}
                            className={`pb-2 text-sm font-black transition-all border-b-2
                                ${statusTab === 'completadas' ? 'border-[#4a55c2] text-[#4a55c2]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            ✅ Completadas ({completedTasks.length})
                        </button>
                    </div>

                    {/* Filtros */}
                    <div className="flex flex-wrap gap-2">
                        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 shadow-sm">
                            {(['todas','hoy','semana','vencidas'] as const).map(f => (
                                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all capitalize
                                    ${filter === f ? 'bg-[#4a55c2] text-white shadow' : 'text-gray-500 hover:text-gray-800'}`}>
                                    {f === 'todas' ? 'Todas' : f === 'hoy' ? '🔥 Hoy' : f === 'semana' ? '📅 Esta semana' : '⚠️ Vencidas'}
                                </button>
                            ))}
                        </div>
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                            className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-black text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-[#4a55c2]"
                        >
                            <option value="TODAS">Todos los tipos</option>
                            {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* Items */}
                    {loading && <p className="text-center text-gray-400 py-12 font-medium">Sincronizando agenda...</p>}
                    {!loading && filtered.length === 0 && (
                        <div className="text-center py-16 text-gray-400">
                            <Calendar className="w-12 h-12 mx-auto text-gray-200 mb-3" />
                            <p className="font-bold">No hay actividades en esta sección.</p>
                        </div>
                    )}
                    <div className="space-y-3">
                        {filtered.map(item => {
                            const isCompleted = item.completed === true || item.completed === 1 || item.completed === '1'
                            const scheduledDate = new Date(item.scheduled_for)
                            const isOverdue = !isCompleted && (scheduledDate < now)
                            const isToday = scheduledDate.toDateString() === today
                            const meta = TYPE_META[item.type] || TYPE_META['LLAMADA']
                            const Icon = meta.icon
                            const pMeta = PRIORITY_META[item.priority || 'MEDIA']
                            const clientLabel = item.client_name ? `👔 ${item.client_name}` : item.lead_name ? `🔍 ${item.lead_name}` : null

                            return (
                                <div key={item.id} className={`bg-white border rounded-2xl p-4 shadow-sm transition-all hover:shadow-md
                                    ${isCompleted ? 'border-slate-200 bg-slate-50/50 opacity-80' : isOverdue ? 'border-red-200 bg-red-50/30' : isToday ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-200'}
                                `}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl ${isCompleted ? 'bg-slate-100' : meta.bg} flex items-center justify-center shrink-0`}>
                                                <Icon className={`w-5 h-5 ${isCompleted ? 'text-slate-400' : meta.color}`} />
                                            </div>
                                            <div className="min-w-0 space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className={`font-black text-sm text-gray-900 ${isCompleted ? 'line-through text-gray-400' : ''}`}>{item.summary}</p>
                                                    {!isCompleted && <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${pMeta.cls}`}>{pMeta.label}</span>}
                                                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-600">{item.type}</span>
                                                    {isOverdue && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> VENCIDA</span>}
                                                    {isToday && !isCompleted && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">HOY</span>}
                                                    {isCompleted && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">COMPLETADO</span>}
                                                </div>
                                                
                                                {clientLabel && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (item.active_client_id) {
                                                                navigate(`/clientes-activos/${item.active_client_id}`)
                                                            } else if (item.lead_id) {
                                                                navigate(`/clientes`)
                                                            }
                                                        }}
                                                        className="text-xs text-[#4a55c2] hover:text-[#3b43a1] font-bold hover:underline text-left block"
                                                    >
                                                        {clientLabel}
                                                    </button>
                                                )}

                                                {item.notes && <p className="text-xs text-gray-400 italic truncate">📝 {item.notes}</p>}
                                                <div className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg
                                                    ${isCompleted ? 'bg-slate-150 text-slate-500' : isOverdue ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-[#4a55c2]'}`}>
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {scheduledDate.toLocaleString('es-MX', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {!isCompleted && (
                                                <button onClick={() => { setReschedulingTask(item); setNewDate(item.scheduled_for?.slice(0,16) || '') }} className="text-xs border border-gray-200 text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-lg font-bold transition-colors" title="Reprogramar">
                                                    📅
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleToggleComplete(item.id, item.completed)} 
                                                className={`text-xs px-2 py-1 rounded-lg font-bold transition-colors flex items-center gap-1
                                                    ${isCompleted ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                                                title={isCompleted ? "Marcar como pendiente" : "Marcar como completada"}
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                {isCompleted && <span className="text-[10px]">Reabrir</span>}
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors" title="Eliminar permanentemente">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Modal Nueva Actividad */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 relative border-0 rounded-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-[#4a55c2] to-violet-600 p-6 text-white">
                            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
                            <h2 className="text-xl font-black">Nueva Actividad de Agenda</h2>
                            <p className="text-xs text-indigo-200 font-medium mt-1">Programa llamadas, reuniones y compromisos</p>
                        </div>
                        <CardContent className="p-6 bg-white">
                            <form onSubmit={handleAddTask} className="space-y-4">
                                <Input label="Descripción de la actividad *" autoFocus required value={newTask.summary} onChange={e => setNewTask({ ...newTask, summary: e.target.value })} placeholder="Ej: Llamar para confirmar propuesta..." />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Tipo de Acción</label>
                                        <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a55c2] focus:border-transparent font-semibold" value={newTask.type} onChange={e => setNewTask({ ...newTask, type: e.target.value })}>
                                            {TASK_TYPES.map(t => <option key={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Prioridad</label>
                                        <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a55c2] focus:border-transparent font-semibold" value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
                                            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <Input label="Fecha y Hora *" type="datetime-local" required value={newTask.date} onChange={e => setNewTask({ ...newTask, date: e.target.value })} />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Vincular a Lead (CRM)</label>
                                        <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a55c2] focus:border-transparent font-semibold" value={newTask.lead_id} onChange={e => setNewTask({ ...newTask, lead_id: e.target.value, active_client_id: '' })}>
                                            <option value="">-- Sin lead --</option>
                                            {leads.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Vincular a Cliente Activo</label>
                                        <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a55c2] focus:border-transparent font-semibold" value={newTask.active_client_id} onChange={e => setNewTask({ ...newTask, active_client_id: e.target.value, lead_id: '' })}>
                                            <option value="">-- Sin cliente --</option>
                                            {activeClients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Notas Internas</label>
                                    <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a55c2] focus:border-transparent resize-none" rows={2} value={newTask.notes} onChange={e => setNewTask({ ...newTask, notes: e.target.value })} placeholder="Contexto adicional, recordatorios, puntos clave..." />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={saving} className="bg-[#4a55c2] hover:bg-[#3b43a1]">{saving ? 'Guardando...' : 'Guardar Actividad'}</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Modal Reprogramar */}
            {reschedulingTask && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-sm shadow-2xl animate-in zoom-in-95 relative border-0 rounded-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-6 text-white">
                            <button onClick={() => setReschedulingTask(null)} className="absolute right-4 top-4 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
                            <Clock className="w-8 h-8 mb-2" />
                            <h2 className="text-lg font-black">Reprogramar</h2>
                            <p className="text-xs text-amber-100 truncate mt-1">"{reschedulingTask.summary}"</p>
                        </div>
                        <CardContent className="p-6 bg-white">
                            <form onSubmit={handleReschedule} className="space-y-4">
                                <Input label="Nueva Fecha y Hora" type="datetime-local" required value={newDate} onChange={e => setNewDate(e.target.value)} />
                                <div className="flex gap-3">
                                    <Button type="button" variant="ghost" onClick={() => setReschedulingTask(null)} className="flex-1">Cancelar</Button>
                                    <Button type="submit" disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600">{saving ? 'Guardando...' : 'Confirmar'}</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
