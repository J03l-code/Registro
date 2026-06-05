import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Users, Plus, Search, Globe, MessageCircle, CheckCircle2, TrendingUp, ChevronRight, Briefcase, Star, X, Phone, Mail } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Card, CardContent } from "../components/ui/Card"

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    ACTIVO:     { label: 'Activo',     color: 'bg-emerald-100 text-emerald-800 border-emerald-200',    dot: 'bg-emerald-500' },
    EN_PAUSA:   { label: 'En Pausa',   color: 'bg-amber-100 text-amber-800 border-amber-200',          dot: 'bg-amber-500'   },
    COMPLETADO: { label: 'Completado', color: 'bg-blue-100 text-blue-800 border-blue-200',             dot: 'bg-blue-500'    },
    CANCELADO:  { label: 'Cancelado',  color: 'bg-red-100 text-red-800 border-red-200',                dot: 'bg-red-500'     },
}

const RUBRO_AVATARS: Record<string, string> = {
    restaurante: '🍽️', farmacia: '💊', tienda: '🛍️', salon: '💇', gym: '🏋️',
    legal: '⚖️', medico: '🏥', construccion: '🏗️', tecnologia: '💻', marketing: '📣',
    educacion: '📚', transporte: '🚗',
}

function getAvatar(rubro: string): string {
    const r = (rubro || '').toLowerCase()
    for (const key of Object.keys(RUBRO_AVATARS)) {
        if (r.includes(key)) return RUBRO_AVATARS[key]
    }
    return '🏢'
}

export function ClientesActivos() {
    const navigate = useNavigate()
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('TODOS')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [leads, setLeads] = useState<any[]>([])

    const [newClient, setNewClient] = useState({
        lead_id: '', name: '', rubro: '', phone: '', email: '',
        social_website: '', contract_total: '', started_at: new Date().toISOString().split('T')[0],
        project_notes: '', project_status: 'ACTIVO'
    })

    useEffect(() => {
        loadClients()
        // Cargar leads para promover
        fetch('/api/clientes.php')
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setLeads(data) })
    }, [])

    const loadClients = () => {
        setLoading(true)
        fetch('/api/active_clients.php')
            .then(r => r.json())
            .then(d => { if (d.success) setClients(d.data || []); setLoading(false) })
            .catch(() => setLoading(false))
    }

    // Al seleccionar un lead, pre-llenar campos
    const handleLeadSelect = (leadId: string) => {
        const lead = leads.find(l => String(l.id) === leadId)
        if (lead) {
            setNewClient(prev => ({
                ...prev,
                lead_id: leadId,
                name: lead.name || '',
                rubro: lead.rubro || '',
                phone: lead.phone || '',
                email: lead.email || '',
                social_website: lead.social_website || '',
            }))
        } else {
            setNewClient(prev => ({ ...prev, lead_id: leadId }))
        }
    }

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        fetch('/api/active_clients.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newClient, contract_total: parseFloat(newClient.contract_total) || 0 })
        })
            .then(r => r.json())
            .then(d => {
                if (d.success) { loadClients(); setIsModalOpen(false) }
            })
            .finally(() => setSaving(false))
    }

    const filtered = clients.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.rubro || '').toLowerCase().includes(search.toLowerCase())
        const matchStatus = filterStatus === 'TODOS' || c.project_status === filterStatus
        return matchSearch && matchStatus
    })

    const totalContractValue = clients.reduce((s, c) => s + parseFloat(c.contract_total || 0), 0)
    const totalPaid = clients.reduce((s, c) => s + parseFloat(c.total_paid || 0), 0)
    const activeCount = clients.filter(c => c.project_status === 'ACTIVO').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                        Clientes Activos
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Proyectos en los que estás trabajando actualmente.</p>
                </div>
                <Button className="bg-[#4a55c2] hover:bg-[#3b43a1] h-10 gap-2" onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4" /> Nuevo Cliente Activo
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-indigo-100/60">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-indigo-500 rounded-xl">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Proyectos Activos</p>
                            <p className="text-3xl font-black text-indigo-900">{activeCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/60">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-emerald-500 rounded-xl">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Valor Cobrado</p>
                            <p className="text-3xl font-black text-emerald-900">${totalPaid.toFixed(0)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-violet-100/60">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-violet-500 rounded-xl">
                            <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Contratos Totales</p>
                            <p className="text-3xl font-black text-violet-900">${totalContractValue.toFixed(0)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Buscar cliente o rubro..." className="pl-9 h-10" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex bg-gray-100 rounded-lg border border-gray-200 p-1 text-sm font-medium h-10 gap-1">
                    {['TODOS', 'ACTIVO', 'EN_PAUSA', 'COMPLETADO'].map(s => (
                        <button key={s}
                            className={`px-3 rounded-md transition-all text-xs font-bold uppercase tracking-wide ${filterStatus === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setFilterStatus(s)}>
                            {s === 'TODOS' ? 'Todos' : STATUS_CONFIG[s]?.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid de clientes */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1,2,3].map(i => (
                        <div key={i} className="h-52 rounded-2xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <Users className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-400">Sin clientes activos</h3>
                    <p className="text-sm text-gray-400 mt-1">Promueve un lead a cliente activo para empezar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(client => {
                        const cfg = STATUS_CONFIG[client.project_status] || STATUS_CONFIG.ACTIVO
                        const paid = parseFloat(client.total_paid || 0)
                        const total = parseFloat(client.contract_total || 0)
                        const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0
                        const openTasks = parseInt(client.open_tasks || 0)

                        return (
                            <div
                                key={client.id}
                                onClick={() => navigate(`/clientes-activos/${client.id}`)}
                                className="group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#4a55c2] transition-all cursor-pointer relative overflow-hidden"
                            >
                                {/* Decorative accent */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4a55c2] to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-2xl shadow-inner">
                                            {getAvatar(client.rubro)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 leading-tight">{client.name}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">{client.rubro || 'Sin rubro'}</p>
                                        </div>
                                    </div>
                                    <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                        {cfg.label}
                                    </span>
                                </div>

                                {/* Progress bar de cobro */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs text-gray-500 font-medium">Cobrado</span>
                                        <span className="text-xs font-bold text-gray-700">${paid.toFixed(0)} / ${total.toFixed(0)}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <p className="text-right text-xs text-emerald-600 font-bold mt-1">{pct.toFixed(0)}%</p>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                    <div className="flex items-center gap-3">
                                        {client.phone && (
                                            <button
                                                onClick={e => { e.stopPropagation(); window.open(`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`, '_blank') }}
                                                className="text-green-500 hover:text-green-600 p-1 rounded-lg hover:bg-green-50 transition-colors"
                                                title="WhatsApp"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                        {client.social_website && (
                                            <button
                                                onClick={e => { e.stopPropagation(); window.open(client.social_website, '_blank') }}
                                                className="text-teal-500 hover:text-teal-600 p-1 rounded-lg hover:bg-teal-50 transition-colors"
                                                title="Sitio Web"
                                            >
                                                <Globe className="w-4 h-4" />
                                            </button>
                                        )}
                                        {openTasks > 0 && (
                                            <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full font-bold">
                                                <CheckCircle2 className="w-3 h-3" />
                                                {openTasks} tareas
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400 font-medium">
                                            {client.total_changes || 0} cambios
                                        </span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#4a55c2] transition-colors" />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modal: Crear nuevo cliente activo */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-xl shadow-2xl animate-in zoom-in-95 relative border-0 rounded-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-[#4a55c2] to-violet-600 p-6 text-white">
                            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-white/70 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                            <Star className="w-8 h-8 fill-white/30 stroke-white mb-2" />
                            <h2 className="text-xl font-black">Nuevo Cliente Activo</h2>
                            <p className="text-indigo-200 text-sm mt-1">Selecciona un lead existente o crea desde cero</p>
                        </div>
                        <CardContent className="p-6 bg-white">
                            <form onSubmit={handleCreate} className="space-y-4">
                                {/* Promover desde lead */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                                        Promover desde Lead Existente (opcional)
                                    </label>
                                    <select
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a55c2] focus:border-transparent"
                                        value={newClient.lead_id}
                                        onChange={e => handleLeadSelect(e.target.value)}
                                    >
                                        <option value="">— Crear sin lead —</option>
                                        {leads.map(l => (
                                            <option key={l.id} value={l.id}>{l.name} ({l.rubro || 'sin rubro'})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Nombre del negocio *" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} required autoFocus />
                                    <Input label="Rubro" value={newClient.rubro} onChange={e => setNewClient({ ...newClient, rubro: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
                                        <Input label="Teléfono" className="pl-9" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
                                        <Input label="Email" type="email" className="pl-9" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Valor del contrato ($)" type="number" value={newClient.contract_total} onChange={e => setNewClient({ ...newClient, contract_total: e.target.value })} placeholder="0.00" />
                                    <Input label="Fecha de inicio" type="date" value={newClient.started_at} onChange={e => setNewClient({ ...newClient, started_at: e.target.value })} />
                                </div>
                                <Input label="Sitio Web" value={newClient.social_website} onChange={e => setNewClient({ ...newClient, social_website: e.target.value })} placeholder="www.ejemplo.com" />
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Notas del Proyecto</label>
                                    <textarea
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a55c2] focus:border-transparent resize-none"
                                        rows={3}
                                        placeholder="Descripción general, objetivos, acuerdos..."
                                        value={newClient.project_notes}
                                        onChange={e => setNewClient({ ...newClient, project_notes: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                    <Button type="submit" className="bg-[#4a55c2] hover:bg-[#3b43a1]" disabled={saving}>
                                        {saving ? 'Guardando...' : 'Crear Perfil'}
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
