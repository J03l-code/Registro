import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { 
    ArrowLeft, DollarSign, Calendar, Landmark, Key, 
    Globe, Phone, Mail, Eye, EyeOff, Save, Trash2, 
    CheckCircle2, RefreshCw, CheckSquare, PlusCircle, Trash, ExternalLink, X
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Card, CardContent } from "../components/ui/Card"

const PAYMENT_METHODS = ['TRANSFERENCIA', 'EFECTIVO', 'TARJETA', 'CHEQUE', 'OTRO']
const PAYMENT_STATUSES = ['PENDIENTE', 'PAGADO', 'VENCIDO']
const CHANGE_TYPES = ['DISEÑO', 'FUNCIONALIDAD', 'CONTENIDO', 'SEO', 'CORRECCIÓN', 'OTRO']
const PRIORITIES = ['ALTA', 'MEDIA', 'BAJA']
const PROJECT_STATUSES = ['ACTIVO', 'EN_PAUSA', 'COMPLETADO', 'CANCELADO']


export function PerfilClienteActivo() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    // Tabs
    const [activeTab, setActiveTab] = useState<'resumen' | 'pagos' | 'cambios' | 'credenciales' | 'tareas'>('resumen')

    // Cliente
    const [client, setClient] = useState<any>(null)
    const [paymentSummary, setPaymentSummary] = useState<any>(null)
    const [taskSummary, setTaskSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [updatingClient, setUpdatingClient] = useState(false)

    // Datos de sub-secciones
    const [payments, setPayments] = useState<any[]>([])
    const [changes, setChanges] = useState<any[]>([])
    const [credentials, setCredentials] = useState<any[]>([])
    const [tasks, setTasks] = useState<any[]>([])

    // Mostrar contraseñas toggles
    const [showPass, setShowPass] = useState<Record<number, boolean>>({})

    // Modals y nuevos elementos
    const [newPayment, setNewPayment] = useState({ amount: '', method: 'TRANSFERENCIA', status: 'PENDIENTE', description: '', due_date: '', payment_date: '' })
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

    const [newChange, setNewChange] = useState({ change_type: 'OTRO', title: '', description: '', status: 'COMPLETADO', change_date: new Date().toISOString().split('T')[0] })
    const [isChangeModalOpen, setIsChangeModalOpen] = useState(false)

    const [newCred, setNewCred] = useState({ platform: '', platform_url: '', username: '', password_enc: '', notes: '' })
    const [isCredModalOpen, setIsCredModalOpen] = useState(false)

    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIA', status: 'PENDIENTE', due_date: '' })
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)

    useEffect(() => {
        loadAllData()
    }, [id])

    const loadAllData = async () => {
        if (!id) return
        setLoading(true)
        try {
            // Cargar datos básicos de cliente
            const resClient = await fetch(`/api/active_clients.php?id=${id}`)
            const dataClient = await resClient.json()
            if (dataClient.success) {
                setClient(dataClient.client)
                setPaymentSummary(dataClient.payment_summary)
                setTaskSummary(dataClient.task_summary)
            } else {
                alert("Error al cargar el cliente.")
                navigate('/clientes-activos')
                return
            }

            // Cargar pagos
            const resP = await fetch(`/api/client_payments.php?client_id=${id}`)
            const dP = await resP.json()
            if (dP.success) setPayments(dP.data || [])

            // Cargar cambios
            const resC = await fetch(`/api/project_changes.php?client_id=${id}`)
            const dC = await resC.json()
            if (dC.success) setChanges(dC.data || [])

            // Cargar credenciales
            const resCr = await fetch(`/api/client_credentials.php?client_id=${id}`)
            const dCr = await resCr.json()
            if (dCr.success) setCredentials(dCr.data || [])

            // Cargar tareas
            const resT = await fetch(`/api/project_tasks.php?client_id=${id}`)
            const dT = await resT.json()
            if (dT.success) setTasks(dT.data || [])

        } catch (e) {
            console.error("Error al cargar perfil de cliente activo", e)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateClient = async (e: React.FormEvent) => {
        e.preventDefault()
        setUpdatingClient(true)
        try {
            const res = await fetch('/api/active_clients.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(client)
            })
            const data = await res.json()
            if (data.success) {
                alert("Información del cliente actualizada con éxito.")
                loadAllData()
            } else {
                alert("Error al actualizar: " + data.error)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setUpdatingClient(false)
        }
    }

    const handleDeleteClient = async () => {
        if (!confirm(`¿Estás seguro de eliminar a "${client.name}" de Clientes Activos?\n\nSe borrará todo su historial financiero, bitácora de cambios, credenciales y tareas.`)) return
        try {
            const res = await fetch('/api/active_clients.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: client.id })
            })
            const data = await res.json()
            if (data.success) {
                navigate('/clientes-activos')
            } else {
                alert("Error al eliminar: " + data.error)
            }
        } catch (e) {
            console.error(e)
        }
    }

    // --- ACCIONES DE PAGOS ---
    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/client_payments.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    ...newPayment, 
                    active_client_id: id,
                    amount: parseFloat(newPayment.amount) || 0
                })
            })
            const data = await res.json()
            if (data.success) {
                setIsPaymentModalOpen(false)
                setNewPayment({ amount: '', method: 'TRANSFERENCIA', status: 'PENDIENTE', description: '', due_date: '', payment_date: '' })
                loadAllData()
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleUpdatePaymentStatus = async (paymentId: number, status: string) => {
        try {
            const updateData: any = { id: paymentId, status }
            if (status === 'PAGADO') {
                updateData.payment_date = new Date().toISOString().split('T')[0]
            }
            const res = await fetch('/api/client_payments.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            })
            const data = await res.json()
            if (data.success) loadAllData()
        } catch (e) {
            console.error(e)
        }
    }

    const handleDeletePayment = async (paymentId: number) => {
        if (!confirm("¿Deseas eliminar este registro de pago?")) return
        try {
            await fetch('/api/client_payments.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: paymentId })
            })
            loadAllData()
        } catch (e) {
            console.error(e)
        }
    }

    // --- ACCIONES DE CAMBIOS ---
    const handleAddChange = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/project_changes.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newChange, active_client_id: id })
            })
            const data = await res.json()
            if (data.success) {
                setIsChangeModalOpen(false)
                setNewChange({ change_type: 'OTRO', title: '', description: '', status: 'COMPLETADO', change_date: new Date().toISOString().split('T')[0] })
                loadAllData()
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleDeleteChange = async (changeId: number) => {
        if (!confirm("¿Deseas eliminar este cambio de la bitácora?")) return
        try {
            await fetch('/api/project_changes.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: changeId })
            })
            loadAllData()
        } catch (e) {
            console.error(e)
        }
    }

    // --- ACCIONES DE CREDENCIALES ---
    const handleAddCred = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/client_credentials.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newCred, active_client_id: id })
            })
            const data = await res.json()
            if (data.success) {
                setIsCredModalOpen(false)
                setNewCred({ platform: '', platform_url: '', username: '', password_enc: '', notes: '' })
                loadAllData()
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleDeleteCred = async (credId: number) => {
        if (!confirm("¿Deseas eliminar esta credencial de acceso?")) return
        try {
            await fetch('/api/client_credentials.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: credId })
            })
            loadAllData()
        } catch (e) {
            console.error(e)
        }
    }

    // --- ACCIONES DE TAREAS ---
    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/project_tasks.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newTask, active_client_id: id })
            })
            const data = await res.json()
            if (data.success) {
                setIsTaskModalOpen(false)
                setNewTask({ title: '', description: '', priority: 'MEDIA', status: 'PENDIENTE', due_date: '' })
                loadAllData()
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleUpdateTaskStatus = async (taskId: number, status: string) => {
        try {
            const res = await fetch('/api/project_tasks.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: taskId, status })
            })
            const data = await res.json()
            if (data.success) loadAllData()
        } catch (e) {
            console.error(e)
        }
    }

    const handleDeleteTask = async (taskId: number) => {
        if (!confirm("¿Deseas eliminar esta tarea?")) return
        try {
            await fetch('/api/project_tasks.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: taskId })
            })
            loadAllData()
        } catch (e) {
            console.error(e)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <RefreshCw className="w-10 h-10 text-[#4a55c2] animate-spin" />
                <p className="text-gray-500 font-medium">Cargando expediente del cliente...</p>
            </div>
        )
    }

    if (!client) return null

    // Calcular datos financieros resumidos
    const contractTotal = parseFloat(client.contract_total || 0)
    const totalPaid = parseFloat(paymentSummary?.paid || 0)
    const totalPending = parseFloat(paymentSummary?.pending || 0)
    const totalOverdue = parseFloat(paymentSummary?.overdue || 0)
    const balanceRemaining = Math.max(contractTotal - totalPaid, 0)
    const cobroPct = contractTotal > 0 ? Math.min((totalPaid / contractTotal) * 100, 100) : 0

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Cabecera / Breadcrumb */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <button 
                    onClick={() => navigate('/clientes-activos')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-semibold"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver a Clientes Activos
                </button>
                <button
                    onClick={handleDeleteClient}
                    className="flex items-center gap-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar Cliente Activo
                </button>
            </div>

            {/* Perfil del Cliente General */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#4a55c2] to-violet-500" />
                
                <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-indigo-50 to-indigo-100/80 border border-indigo-200 flex items-center justify-center text-4xl shadow-inner shrink-0">
                        🏢
                    </div>
                    <div className="text-center md:text-left space-y-1">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{client.name}</h1>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border 
                                ${client.project_status === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : ''}
                                ${client.project_status === 'EN_PAUSA' ? 'bg-amber-100 text-amber-800 border-amber-200' : ''}
                                ${client.project_status === 'COMPLETADO' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
                                ${client.project_status === 'CANCELADO' ? 'bg-red-100 text-red-800 border-red-200' : ''}
                            `}>
                                {client.project_status}
                            </span>
                        </div>
                        <p className="text-sm font-bold text-[#4a55c2]">{client.rubro || 'Sin rubro asignado'}</p>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 pt-3 text-xs text-gray-500 font-medium">
                            {client.phone && (
                                <span className="flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {client.phone}
                                </span>
                            )}
                            {client.email && (
                                <span className="flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-gray-400" /> {client.email}
                                </span>
                            )}
                            {client.social_website && (
                                <a href={client.social_website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-teal-600 hover:underline">
                                    <Globe className="w-3.5 h-3.5" /> {client.social_website}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dashboard Financiero Rápido */}
                <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8 flex flex-col justify-center min-w-[240px]">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Avance de Cobro</span>
                        <span className="text-sm font-black text-gray-800">${totalPaid.toFixed(0)} / ${contractTotal.toFixed(0)}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" style={{ width: `${cobroPct}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-600 font-black">{cobroPct.toFixed(0)}% cobrado</span>
                        <span className="text-gray-500 font-bold">Resta: ${balanceRemaining.toFixed(0)}</span>
                    </div>
                </div>
            </div>

            {/* Tabs de Navegación */}
            <div className="flex border-b border-gray-200 overflow-x-auto gap-1">
                {[
                    { id: 'resumen', label: '📋 Resumen e Info', count: null },
                    { id: 'pagos', label: '💰 Facturación y Pagos', count: payments.length },
                    { id: 'cambios', label: '🌐 Control de Cambios', count: changes.length },
                    { id: 'credenciales', label: '🔑 Bóveda de Accesos', count: credentials.length },
                    { id: 'tareas', label: '✅ Plan de Trabajo', count: tasks.filter(t => t.status !== 'COMPLETADO').length }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id as any)}
                        className={`flex items-center gap-2 py-3 px-5 border-b-2 font-bold text-sm transition-all whitespace-nowrap outline-none
                            ${activeTab === t.id 
                                ? 'border-[#4a55c2] text-[#4a55c2] bg-indigo-50/30' 
                                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                            }`}
                    >
                        {t.label}
                        {t.count !== null && t.count > 0 && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full 
                                ${t.id === 'tareas' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                                {t.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* CONTENIDO DE TABS */}
            <div className="mt-4">
                {/* 1. RESUMEN E INFORMACION */}
                {activeTab === 'resumen' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Formulario de Información General */}
                        <Card className="lg:col-span-2 border-gray-200">
                            <CardContent className="p-6">
                                <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Actualizar Datos Generales</h3>
                                <form onSubmit={handleUpdateClient} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Nombre del Negocio" value={client.name || ''} onChange={e => setClient({ ...client, name: e.target.value })} required />
                                        <Input label="Rubro / Industria" value={client.rubro || ''} onChange={e => setClient({ ...client, rubro: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Teléfono" value={client.phone || ''} onChange={e => setClient({ ...client, phone: e.target.value })} />
                                        <Input label="Correo Electrónico" type="email" value={client.email || ''} onChange={e => setClient({ ...client, email: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <Input label="Instagram" value={client.social_instagram || ''} onChange={e => setClient({ ...client, social_instagram: e.target.value })} placeholder="@instagram" />
                                        <Input label="Facebook" value={client.social_facebook || ''} onChange={e => setClient({ ...client, social_facebook: e.target.value })} placeholder="fb.com/pagina" />
                                        <Input label="Sitio Web" value={client.social_website || ''} onChange={e => setClient({ ...client, social_website: e.target.value })} placeholder="https://www..." />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <Input label="Dirección Física" value={client.address || ''} onChange={e => setClient({ ...client, address: e.target.value })} />
                                        </div>
                                        <div>
                                            <Input label="Fecha Inicio Proyecto" type="date" value={client.started_at || ''} onChange={e => setClient({ ...client, started_at: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Monto Total Contrato ($)" type="number" value={client.contract_total || 0} onChange={e => setClient({ ...client, contract_total: parseFloat(e.target.value) || 0 })} />
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Estado del Proyecto</label>
                                            <select 
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a55c2] focus:border-transparent font-semibold"
                                                value={client.project_status || 'ACTIVO'}
                                                onChange={e => setClient({ ...client, project_status: e.target.value })}
                                            >
                                                {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Notas del Proyecto</label>
                                        <textarea
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a55c2] focus:border-transparent resize-none"
                                            rows={4}
                                            value={client.project_notes || ''}
                                            onChange={e => setClient({ ...client, project_notes: e.target.value })}
                                            placeholder="Detalles sobre entregables, acuerdos del contrato, etc."
                                        />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <Button type="submit" className="bg-[#4a55c2] hover:bg-[#3b43a1] gap-2" disabled={updatingClient}>
                                            <Save className="w-4 h-4" /> {updatingClient ? 'Guardando...' : 'Guardar Cambios'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Columna derecha: Widgets de resumen rápido */}
                        <div className="space-y-6">
                            {/* Resumen Financiero */}
                            <Card className="border-gray-200">
                                <CardContent className="p-6 space-y-4">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                        <Landmark className="w-5 h-5 text-indigo-500" />
                                        Estado Financiero
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase">Pactado</p>
                                            <p className="text-lg font-black text-indigo-900">${contractTotal.toFixed(0)}</p>
                                        </div>
                                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Cobrado</p>
                                            <p className="text-lg font-black text-emerald-900">${totalPaid.toFixed(0)}</p>
                                        </div>
                                        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3">
                                            <p className="text-[10px] font-bold text-amber-600 uppercase">Pendiente</p>
                                            <p className="text-lg font-black text-amber-900">${totalPending.toFixed(0)}</p>
                                        </div>
                                        <div className="bg-red-50/50 border border-red-100 rounded-xl p-3">
                                            <p className="text-[10px] font-bold text-red-600 uppercase">Vencido</p>
                                            <p className="text-lg font-black text-red-900">${totalOverdue.toFixed(0)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Resumen de entregables */}
                            <Card className="border-gray-200">
                                <CardContent className="p-6 space-y-4">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                                        Plan de Trabajo
                                    </h4>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500 font-semibold">Progreso general</span>
                                        <span className="text-xs font-bold text-gray-800">
                                            {taskSummary?.completed || 0} / {taskSummary?.total || 0} completados
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-500 rounded-full" 
                                            style={{ width: `${taskSummary?.total > 0 ? (taskSummary.completed / taskSummary.total) * 100 : 0}%` }} 
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* 2. FACTURACION Y PAGOS */}
                {activeTab === 'pagos' && (
                    <Card className="border-gray-200">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-950">Registro de Pagos y Cuotas</h3>
                                <Button className="bg-[#4a55c2] hover:bg-[#3b43a1] h-9 gap-1.5 text-xs font-bold" onClick={() => setIsPaymentModalOpen(true)}>
                                    <PlusCircle className="w-4 h-4" /> Agregar Pago / Cobro
                                </Button>
                            </div>

                            {payments.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <DollarSign className="w-12 h-12 mx-auto text-gray-200 mb-2" />
                                    <p className="font-medium">No se han registrado cobros ni pagos.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b border-gray-100">
                                            <tr>
                                                <th className="px-4 py-3">Descripción / Cuota</th>
                                                <th className="px-4 py-3">Monto</th>
                                                <th className="px-4 py-3">Método</th>
                                                <th className="px-4 py-3">F. Límite / Vencimiento</th>
                                                <th className="px-4 py-3">F. de Pago</th>
                                                <th className="px-4 py-3">Estado</th>
                                                <th className="px-4 py-3 text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {payments.map(p => (
                                                <tr key={p.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-semibold text-gray-900">{p.description || 'Cuota de proyecto'}</td>
                                                    <td className="px-4 py-3 font-black text-gray-900">${parseFloat(p.amount).toFixed(2)}</td>
                                                    <td className="px-4 py-3"><span className="bg-gray-100 text-gray-700 text-[10px] font-black px-2 py-0.5 rounded">{p.method}</span></td>
                                                    <td className="px-4 py-3 text-gray-500">{p.due_date ? p.due_date.split(' ')[0] : 'N/A'}</td>
                                                    <td className="px-4 py-3 text-gray-500">{p.payment_date ? p.payment_date.split(' ')[0] : '—'}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border
                                                            ${p.status === 'PAGADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                                            ${p.status === 'PENDIENTE' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                                            ${p.status === 'VENCIDO' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                                        `}>
                                                            {p.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {p.status !== 'PAGADO' && (
                                                                <button
                                                                    onClick={() => handleUpdatePaymentStatus(p.id, 'PAGADO')}
                                                                    className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2 py-1 rounded shadow-sm"
                                                                >
                                                                    Marcar Pagado
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={() => handleDeletePayment(p.id)}
                                                                className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"
                                                            >
                                                                <Trash className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* 3. CONTROL DE CAMBIOS */}
                {activeTab === 'cambios' && (
                    <Card className="border-gray-200">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-950 font-black">Historial de Implementaciones en el Sistema</h3>
                                <Button className="bg-[#4a55c2] hover:bg-[#3b43a1] h-9 gap-1.5 text-xs font-bold" onClick={() => setIsChangeModalOpen(true)}>
                                    <PlusCircle className="w-4 h-4" /> Registrar Cambio
                                </Button>
                            </div>

                            {changes.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Globe className="w-12 h-12 mx-auto text-gray-200 mb-2" />
                                    <p className="font-medium">No se han registrado implementaciones ni cambios aún.</p>
                                </div>
                            ) : (
                                <div className="relative border-l border-indigo-200 ml-4 space-y-6">
                                    {changes.map(ch => (
                                        <div key={ch.id} className="relative pl-6">
                                            <div className="absolute -left-[5.5px] top-1 w-2.5 h-2.5 rounded-full bg-[#4a55c2] ring-4 ring-indigo-100" />
                                            <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 max-w-3xl space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded mr-2">
                                                            {ch.change_type}
                                                        </span>
                                                        <h4 className="font-bold text-gray-950 inline-block">{ch.title}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-gray-500 font-semibold">{ch.change_date}</span>
                                                        <button 
                                                            onClick={() => handleDeleteChange(ch.id)}
                                                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 leading-relaxed">{ch.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* 4. ACCESOS Y CREDENCIALES */}
                {activeTab === 'credenciales' && (
                    <Card className="border-gray-200">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-950 font-black">Bóveda de Accesos Directos</h3>
                                <Button className="bg-[#4a55c2] hover:bg-[#3b43a1] h-9 gap-1.5 text-xs font-bold" onClick={() => setIsCredModalOpen(true)}>
                                    <PlusCircle className="w-4 h-4" /> Registrar Acceso
                                </Button>
                            </div>

                            {credentials.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Key className="w-12 h-12 mx-auto text-gray-200 mb-2" />
                                    <p className="font-medium">No se han registrado contraseñas ni accesos.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {credentials.map(cr => (
                                        <Card key={cr.id} className="border-gray-200 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                                            <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-500" />
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                                                        <Key className="w-4 h-4 text-indigo-500" />
                                                        {cr.platform}
                                                    </h4>
                                                    <button 
                                                        onClick={() => handleDeleteCred(cr.id)}
                                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="space-y-1 text-sm">
                                                    <p className="text-gray-500 text-xs">Usuario / Correo</p>
                                                    <p className="font-semibold text-gray-800">{cr.username || '—'}</p>
                                                </div>

                                                <div className="space-y-1 text-sm">
                                                    <p className="text-gray-500 text-xs">Contraseña</p>
                                                    <div className="flex items-center justify-between bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-150">
                                                        <input 
                                                            type={showPass[cr.id] ? "text" : "password"}
                                                            value={cr.password_enc || ''}
                                                            readOnly
                                                            className="bg-transparent border-none p-0 text-sm font-semibold focus:ring-0 text-gray-800 w-full outline-none"
                                                        />
                                                        <button 
                                                            onClick={() => setShowPass(prev => ({ ...prev, [cr.id]: !prev[cr.id] }))}
                                                            className="text-gray-400 hover:text-gray-600 outline-none"
                                                        >
                                                            {showPass[cr.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                {cr.platform_url && (
                                                    <a 
                                                        href={cr.platform_url} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        Ir a plataforma <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}

                                                {cr.notes && (
                                                    <p className="text-[11px] text-gray-500 italic bg-gray-50 p-2 rounded">
                                                        {cr.notes}
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* 5. PLAN DE TRABAJO / TAREAS */}
                {activeTab === 'tareas' && (
                    <Card className="border-gray-200">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-950 font-black">Plan de Trabajo / Deliverables</h3>
                                <Button className="bg-[#4a55c2] hover:bg-[#3b43a1] h-9 gap-1.5 text-xs font-bold" onClick={() => setIsTaskModalOpen(true)}>
                                    <PlusCircle className="w-4 h-4" /> Agregar Tarea
                                </Button>
                            </div>

                            {tasks.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <CheckSquare className="w-12 h-12 mx-auto text-gray-200 mb-2" />
                                    <p className="font-medium">No hay tareas programadas para el proyecto.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tasks.map(t => (
                                        <div 
                                            key={t.id} 
                                            className={`flex items-center justify-between border rounded-2xl p-4 shadow-sm bg-white transition-all
                                                ${t.status === 'COMPLETADO' ? 'opacity-60 border-gray-100' : 'border-gray-200 hover:border-indigo-300'}`}
                                        >
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <input 
                                                    type="checkbox"
                                                    checked={t.status === 'COMPLETADO'}
                                                    onChange={e => handleUpdateTaskStatus(t.id, e.target.checked ? 'COMPLETADO' : 'PENDIENTE')}
                                                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-1"
                                                />
                                                <div className="min-w-0">
                                                    <h4 className={`font-bold text-sm text-gray-900 ${t.status === 'COMPLETADO' ? 'line-through text-gray-400' : ''}`}>
                                                        {t.title}
                                                    </h4>
                                                    {t.description && (
                                                        <p className={`text-xs text-gray-500 mt-0.5 truncate ${t.status === 'COMPLETADO' ? 'line-through text-gray-400' : ''}`}>
                                                            {t.description}
                                                        </p>
                                                    )}
                                                    {t.due_date && (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 mt-1.5">
                                                            <Calendar className="w-3 h-3" /> Límite: {t.due_date.split(' ')[0]}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded border
                                                    ${t.priority === 'ALTA' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                                    ${t.priority === 'MEDIA' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                                    ${t.priority === 'BAJA' ? 'bg-gray-100 text-gray-600 border-gray-200' : ''}
                                                `}>
                                                    {t.priority}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteTask(t.id)}
                                                    className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* --- MODAL PAGO --- */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 relative border-0 rounded-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
                            <button onClick={() => setIsPaymentModalOpen(false)} className="absolute right-4 top-4 text-white/70 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-black">Registrar Cobro / Cuota</h2>
                        </div>
                        <CardContent className="p-6 bg-white">
                            <form onSubmit={handleAddPayment} className="space-y-4">
                                <Input label="Descripción de la cuota" value={newPayment.description} onChange={e => setNewPayment({ ...newPayment, description: e.target.value })} required placeholder="Pago inicial, mensualidad, etc." />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Monto ($)" type="number" value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })} required />
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Método</label>
                                        <select 
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a55c2] focus:border-transparent font-semibold"
                                            value={newPayment.method}
                                            onChange={e => setNewPayment({ ...newPayment, method: e.target.value })}
                                        >
                                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Estado</label>
                                        <select 
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a55c2] focus:border-transparent font-semibold"
                                            value={newPayment.status}
                                            onChange={e => setNewPayment({ ...newPayment, status: e.target.value })}
                                        >
                                            {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <Input label="Fecha Límite" type="date" value={newPayment.due_date} onChange={e => setNewPayment({ ...newPayment, due_date: e.target.value })} />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button>
                                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Guardar Cobro</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* --- MODAL CAMBIO --- */}
            {isChangeModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 relative border-0 rounded-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-[#4a55c2] p-6 text-white">
                            <button onClick={() => setIsChangeModalOpen(false)} className="absolute right-4 top-4 text-white/70 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-black">Registrar Implementación</h2>
                        </div>
                        <CardContent className="p-6 bg-white">
                            <form onSubmit={handleAddChange} className="space-y-4">
                                <Input label="Título del cambio / tarea" value={newChange.title} onChange={e => setNewChange({ ...newChange, title: e.target.value })} required placeholder="Ej: Rediseño de cabecera" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Tipo de cambio</label>
                                        <select 
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a55c2] focus:border-transparent font-semibold"
                                            value={newChange.change_type}
                                            onChange={e => setNewChange({ ...newChange, change_type: e.target.value })}
                                        >
                                            {CHANGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <Input label="Fecha" type="date" value={newChange.change_date} onChange={e => setNewChange({ ...newChange, change_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Detalles del cambio</label>
                                    <textarea
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a55c2] focus:border-transparent resize-none"
                                        rows={3}
                                        value={newChange.description}
                                        onChange={e => setNewChange({ ...newChange, description: e.target.value })}
                                        placeholder="Escribe qué cambios se implementaron en producción o en el sistema..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsChangeModalOpen(false)}>Cancelar</Button>
                                    <Button type="submit" className="bg-[#4a55c2] hover:bg-[#3b43a1]">Guardar Registro</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* --- MODAL ACCESO --- */}
            {isCredModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 relative border-0 rounded-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-violet-500 to-indigo-600 p-6 text-white">
                            <button onClick={() => setIsCredModalOpen(false)} className="absolute right-4 top-4 text-white/70 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-black">Registrar Acceso / Plataforma</h2>
                        </div>
                        <CardContent className="p-6 bg-white">
                            <form onSubmit={handleAddCred} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Plataforma *" value={newCred.platform} onChange={e => setNewCred({ ...newCred, platform: e.target.value })} required placeholder="WordPress, hosting, etc." />
                                    <Input label="Usuario / Email" value={newCred.username} onChange={e => setNewCred({ ...newCred, username: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Contraseña" value={newCred.password_enc} onChange={e => setNewCred({ ...newCred, password_enc: e.target.value })} />
                                    <Input label="URL de Plataforma" value={newCred.platform_url} onChange={e => setNewCred({ ...newCred, platform_url: e.target.value })} placeholder="https://..." />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Notas / Info adicional</label>
                                    <textarea
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a55c2] focus:border-transparent resize-none"
                                        rows={2}
                                        value={newCred.notes}
                                        onChange={e => setNewCred({ ...newCred, notes: e.target.value })}
                                        placeholder="Códigos de recuperación, accesos adicionales..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsCredModalOpen(false)}>Cancelar</Button>
                                    <Button type="submit" className="bg-violet-600 hover:bg-violet-700">Guardar Acceso</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* --- MODAL TAREA --- */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 relative border-0 rounded-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-6 text-white">
                            <button onClick={() => setIsTaskModalOpen(false)} className="absolute right-4 top-4 text-white/70 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-black">Crear Deliverable / Tarea</h2>
                        </div>
                        <CardContent className="p-6 bg-white">
                            <form onSubmit={handleAddTask} className="space-y-4">
                                <Input label="Nombre de tarea *" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} required placeholder="Ej: Configurar pixel de meta" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Prioridad</label>
                                        <select 
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a55c2] focus:border-transparent font-semibold"
                                            value={newTask.priority}
                                            onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                        >
                                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <Input label="Fecha Límite" type="date" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Descripción</label>
                                    <textarea
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a55c2] focus:border-transparent resize-none"
                                        rows={2}
                                        value={newTask.description}
                                        onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                        placeholder="Descripción detallada del deliverable..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsTaskModalOpen(false)}>Cancelar</Button>
                                    <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Guardar Tarea</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
