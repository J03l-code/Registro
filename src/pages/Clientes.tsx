import { useState, useEffect } from "react"
import { Search, Plus, X, MessageCircle, Filter, Eye, DollarSign, AtSign, ArrowRight, BellRing } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Card, CardContent } from "../components/ui/Card"

const getInterestColor = (text: string) => {
    const t = (text || '').toLowerCase();
    if (t.includes('no desea') || t.includes('rechazó')) return 'bg-cyan-300 text-cyan-900 border-cyan-400';
    if (t.includes('enviar') || t.includes('interesado') || t.includes('contactar') || t.includes('cotizar')) return 'bg-green-400 text-green-900 border-green-500';
    if (t.includes('equivocado') || t.includes('no contest')) return 'bg-gray-200 text-gray-700 border-gray-300';
    return 'bg-white border-gray-300';
};

export function Clientes() {
    const [clients, setClients] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterContactado, setFilterContactado] = useState("TODOS");
    const [filterAnswered, setFilterAnswered] = useState("TODOS");
    const [filterWp, setFilterWp] = useState("TODOS");
    const [showFilters, setShowFilters] = useState(false);

    // Estados de Expediente / Línea de tiempo
    const [panelOpen, setPanelOpen] = useState(false);
    const [currentLead, setCurrentLead] = useState<any>(null);
    const [selectedHistory, setSelectedHistory] = useState<any[]>([]);

    const [newClient, setNewClient] = useState({
        name: '', rubro: '', phone: '', email: 'n/a@n/a.com', is_contacted: 'SÍ', did_answer: false, wp_sent: false, interest_level: '', notes: '', estimated_value: 0
    });

    useEffect(() => {
        fetch('/api/clientes.php')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setClients(data);
                setLoading(false);
            })
            .catch(e => {
                console.error("Error", e);
                setLoading(false);
            });
    }, []);

    const handleAddClient = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        fetch('/api/clientes.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newClient)
        })
            .then(r => r.json())
            .then(data => {
                if (data.success && data.client) {
                    data.client.pending_tasks = 0; // Al crearlo, trae 0 pendientes.
                    setClients([data.client, ...clients]);
                    setIsModalOpen(false);
                    setNewClient({ name: '', rubro: '', phone: '', email: '', is_contacted: 'NO', did_answer: false, wp_sent: false, interest_level: '', notes: '', estimated_value: 0 });
                } else {
                    alert("Error: " + (data.error || "Datos inválidos."));
                }
            })
            .finally(() => setSaving(false));
    };

    const handleUpdateField = (id: number, field: string, value: any) => {
        setClients(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
        fetch('/api/clientes.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, [field]: value })
        }).catch(err => console.error("Error al guardado background:", err));

        // Si actualizamos datos mientras vemos el expediente lateral, sincronizamos el panel visual también
        if (currentLead && currentLead.id === id) {
            setCurrentLead((prev: any) => ({ ...prev, [field]: value }));
        }
    };

    const handleWhatsApp = (name: string, phone: string) => {
        const text = encodeURIComponent(`Hola ${name}, te contacto de [MiEmprendimiento], ¿cómo podemos ayudarte hoy?`);
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
    };

    // Abre el slide-over panel de Expediente (Timeline)
    const openHistoryPanel = (lead: any) => {
        setCurrentLead(lead);
        setSelectedHistory([]);
        setPanelOpen(true);
        fetch(`/api/history.php?lead_id=${lead.id}`)
            .then(r => r.json())
            .then(d => { if (d.success) setSelectedHistory(d.data); });
    };

    const filteredClients = clients.filter(c => {
        const matchText = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.rubro && c.rubro.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.phone && c.phone.includes(searchTerm));
        const matchContacted = filterContactado === "TODOS" || c.is_contacted === filterContactado;

        let matchAnswered = true;
        if (filterAnswered === "SÍ") matchAnswered = (c.did_answer == 1 || c.did_answer === true);
        if (filterAnswered === "NO") matchAnswered = (c.did_answer == 0 || c.did_answer === false);

        let matchWp = true;
        if (filterWp === "SÍ") matchWp = (c.wp_sent == 1 || c.wp_sent === true);
        if (filterWp === "NO") matchWp = (c.wp_sent == 0 || c.wp_sent === false);

        return matchText && matchContacted && matchAnswered && matchWp;
    });

    return (
        <div className="space-y-4 relative w-full h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-900 tracking-tight">Embudo de Llamadas</h1>
                    <p className="text-gray-500 mt-1 text-sm">Gestiona tus contactos fríos a velocidad de hoja de cálculo.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Buscar..." className="pl-9 h-10 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <Button variant="outline" className={`h-10 border-gray-300 ${showFilters ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`} onClick={() => setShowFilters(!showFilters)}>
                        <Filter className="w-4 h-4 mr-2" />
                        Filtros
                    </Button>
                    <Button className="bg-brand-600 hover:bg-brand-700 h-10 flex-shrink-0" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Lead
                    </Button>
                </div>
            </div>

            {showFilters && (
                <Card className="animate-in fade-in slide-in-from-top-2 border-gray-200">
                    <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-6 bg-gray-50/50">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado de Contacto</label>
                            <div className="flex bg-white rounded-md border border-gray-200 p-1 w-full text-sm font-medium h-9">
                                <button className={`flex-1 rounded ${filterContactado === 'TODOS' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500'}`} onClick={() => setFilterContactado('TODOS')}>Todos</button>
                                <button className={`flex-1 rounded ${filterContactado === 'SÍ' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-500'}`} onClick={() => setFilterContactado('SÍ')}>Sí</button>
                                <button className={`flex-1 rounded ${filterContactado === 'NO' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-gray-500'}`} onClick={() => setFilterContactado('NO')}>No</button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">¿Contestó a la Llamada?</label>
                            <div className="flex bg-white rounded-md border border-gray-200 p-1 w-full text-sm font-medium h-9">
                                <button className={`flex-1 rounded ${filterAnswered === 'TODOS' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500'}`} onClick={() => setFilterAnswered('TODOS')}>Todos</button>
                                <button className={`flex-1 rounded ${filterAnswered === 'SÍ' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-gray-500'}`} onClick={() => setFilterAnswered('SÍ')}>Contestó</button>
                                <button className={`flex-1 rounded ${filterAnswered === 'NO' ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-gray-500'}`} onClick={() => setFilterAnswered('NO')}>Ausente</button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Mensaje WhatsApp</label>
                            <div className="flex bg-white rounded-md border border-gray-200 p-1 w-full text-sm font-medium h-9">
                                <button className={`flex-1 rounded ${filterWp === 'TODOS' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500'}`} onClick={() => setFilterWp('TODOS')}>Todos</button>
                                <button className={`flex-1 rounded ${filterWp === 'SÍ' ? 'bg-[#e7f9ee] text-[#1e8b46] shadow-sm' : 'text-gray-500'}`} onClick={() => setFilterWp('SÍ')}>Enviados</button>
                                <button className={`flex-1 rounded ${filterWp === 'NO' ? 'bg-gray-100 text-gray-600 shadow-sm' : 'text-gray-500'}`} onClick={() => setFilterWp('NO')}>Faltantes</button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="flex-1 border-gray-300 shadow-sm overflow-hidden">
                <CardContent className="p-0 overflow-x-auto h-[65vh]">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-[#4a55c2] text-white font-medium sticky top-0 z-10 shadow-sm border-b border-[#3b43a1]">
                            <tr>
                                <th className="px-3 py-3 border-r border-[#3b43a1] w-[60px] text-center" title="Expediente y Alertas">Info</th>
                                <th className="px-4 py-3 border-r border-[#3b43a1] min-w-[200px]">Nombre del Negocio</th>
                                <th className="px-4 py-3 border-r border-[#3b43a1] w-[140px]">Cotización</th>
                                <th className="px-4 py-3 border-r border-[#3b43a1] w-[140px]">Rubro</th>
                                <th className="px-4 py-3 border-r border-[#3b43a1] w-[140px]">Teléfono</th>
                                <th className="px-4 py-3 border-r border-[#3b43a1] w-[110px] text-center">Contactado</th>
                                <th className="px-4 py-3 border-r border-[#3b43a1] w-[90px] text-center">Contestó</th>
                                <th className="px-2 py-3 border-r border-[#3b43a1] w-[110px] text-center whitespace-nowrap text-xs">WhatsApp Env.</th>
                                <th className="px-4 py-3 border-r border-[#3b43a1] min-w-[250px]">Notas de Llamada</th>
                                <th className="px-4 py-3 border-r border-[#3b43a1] w-[150px]">Fecha Llamada</th>
                                <th className="px-4 py-3 w-[250px]">Interés en el Servicio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                <tr><td colSpan={11} className="px-6 py-10 text-center text-gray-500">Cargando datos estilo Excel...</td></tr>
                            ) : filteredClients.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-50 transition-colors group">

                                    {/* Botón Detalles + Next Step Alert */}
                                    <td className="px-3 py-2 border-r border-gray-200 text-center relative pointer-events-auto">
                                        <button onClick={() => openHistoryPanel(client)} className="text-[#4a55c2] hover:bg-gray-200 p-1.5 rounded transition-all">
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        {/* Alerta de Olvido: Si no hay pending tasks, significa que olvidamos hacer un Next-Step */}
                                        {client.pending_tasks == 0 && (
                                            <span className="absolute top-[8px] right-[8px] flex h-3 w-3" title="Atención Obligatoria: Sin Agendamiento Futuro">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 flex items-center justify-center">
                                                    <BellRing className="w-2 h-2 text-white absolute left-[1px] top-[1.5px] scale-[0.8]" />
                                                </span>
                                            </span>
                                        )}
                                    </td>

                                    {/* Nombre */}
                                    <td className="px-4 py-2 border-r border-gray-200 font-bold text-gray-900 border-l-[3px] border-l-transparent hover:border-l-brand-600 focus-within:border-l-brand-600">
                                        <input
                                            className="w-full bg-transparent border-0 focus:ring-0 p-0 font-bold hover:bg-gray-100 focus:bg-white focus:outline-none"
                                            value={client.name}
                                            onChange={(e) => setClients(prev => prev.map(c => c.id === client.id ? { ...c, name: e.target.value } : c))}
                                            onBlur={(e) => handleUpdateField(client.id, 'name', e.target.value)}
                                        />
                                    </td>

                                    {/* Finanzas / Cotización */}
                                    <td className="px-4 py-2 border-r border-gray-200 text-brand-700 font-semibold flex items-center">
                                        <span className="mr-0.5 text-xs text-gray-400">$</span>
                                        <input
                                            type="number"
                                            className="w-full bg-transparent border-0 focus:ring-0 p-0 font-medium text-sm hover:bg-gray-100 focus:bg-white"
                                            value={client.estimated_value || ''}
                                            placeholder="0.00"
                                            onChange={(e) => setClients(prev => prev.map(c => c.id === client.id ? { ...c, estimated_value: e.target.value } : c))}
                                            onBlur={(e) => handleUpdateField(client.id, 'estimated_value', parseFloat(e.target.value) || 0)}
                                        />
                                    </td>

                                    {/* Rubro */}
                                    <td className="px-4 py-2 border-r border-gray-200">
                                        <input
                                            className="w-full bg-transparent border-0 text-gray-600 focus:ring-0 p-0 text-sm hover:bg-gray-100 focus:bg-white"
                                            value={client.rubro || ''}
                                            placeholder="Ingresar..."
                                            onChange={(e) => setClients(prev => prev.map(c => c.id === client.id ? { ...c, rubro: e.target.value } : c))}
                                            onBlur={(e) => handleUpdateField(client.id, 'rubro', e.target.value)}
                                        />
                                    </td>

                                    {/* Teléfono y WP */}
                                    <td className="px-4 py-2 border-r border-gray-200 flex items-center justify-between group-hover:bg-gray-50">
                                        <input
                                            className="w-full bg-transparent min-w-[80px] border-0 font-medium text-gray-700 focus:ring-0 p-0 text-sm"
                                            value={client.phone || ''}
                                            onChange={(e) => setClients(prev => prev.map(c => c.id === client.id ? { ...c, phone: e.target.value } : c))}
                                            onBlur={(e) => handleUpdateField(client.id, 'phone', e.target.value)}
                                        />
                                        <button onClick={() => handleWhatsApp(client.name, client.phone)} className="text-green-500 hover:text-green-600 transition-colors outline-none ml-1 p-1 hover:bg-green-50 rounded" title="Abrir WhatsApp">
                                            <MessageCircle className="w-4 h-4" />
                                        </button>
                                    </td>

                                    {/* Contactado Select */}
                                    <td className="px-4 py-2 border-r border-gray-200 text-center">
                                        <select
                                            value={client.is_contacted || 'NO'}
                                            onChange={(e) => handleUpdateField(client.id, 'is_contacted', e.target.value)}
                                            className={`text-sm rounded-full px-3 py-1 font-semibold border focus:ring-0 cursor-pointer appearance-none text-center outline-none ${client.is_contacted === 'SÍ' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                                        >
                                            <option value="SÍ">sí</option>
                                            <option value="NO">no</option>
                                        </select>
                                    </td>

                                    {/* Contestó Checkbox */}
                                    <td className="px-4 py-2 border-r border-gray-200 text-center">
                                        <input
                                            type="checkbox"
                                            checked={client.did_answer == 1 || client.did_answer === true}
                                            onChange={(e) => handleUpdateField(client.id, 'did_answer', e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-400 text-[#4a55c2] focus:ring-[#4a55c2] cursor-pointer"
                                        />
                                    </td>

                                    {/* WP Enviado Checkbox */}
                                    <td className="px-4 py-2 border-r border-gray-200 text-center">
                                        <input
                                            type="checkbox"
                                            checked={client.wp_sent == 1 || client.wp_sent === true}
                                            onChange={(e) => handleUpdateField(client.id, 'wp_sent', e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-400 text-green-500 focus:ring-green-500 cursor-pointer"
                                        />
                                    </td>

                                    {/* Notas Multi-linea */}
                                    <td className="p-0 border-r border-gray-200 h-full">
                                        <textarea
                                            className="w-full h-full min-h-[60px] bg-transparent border-0 text-xs text-gray-600 p-2 focus:ring-0 focus:bg-yellow-50 resize-y leading-tight"
                                            value={client.notes || ''}
                                            placeholder="Añadir nota..."
                                            onChange={(e) => setClients(prev => prev.map(c => c.id === client.id ? { ...c, notes: e.target.value } : c))}
                                            onBlur={(e) => handleUpdateField(client.id, 'notes', e.target.value)}
                                        />
                                    </td>

                                    {/* Fecha de Llamada */}
                                    <td className="px-4 py-2 border-r border-gray-200">
                                        <input
                                            type="date"
                                            className="w-full bg-transparent border-0 text-gray-600 focus:ring-0 p-0 text-xs cursor-text"
                                            value={client.call_date ? client.call_date.split('T')[0] : ''}
                                            onChange={(e) => handleUpdateField(client.id, 'call_date', e.target.value)}
                                        />
                                    </td>

                                    {/* Interés con Colores Dinámicos */}
                                    <td className="p-1 h-full">
                                        <textarea
                                            className={`w-full h-full min-h-[60px] text-xs font-semibold p-2 border-0 focus:ring-2 focus:ring-blue-500 resize-y leading-tight transition-colors rounded ${getInterestColor(client.interest_level)}`}
                                            value={client.interest_level || ''}
                                            placeholder="Escribir (Azul='no desea', Verde='interesa', Gris='no contenta')..."
                                            onChange={(e) => setClients(prev => prev.map(c => c.id === client.id ? { ...c, interest_level: e.target.value } : c))}
                                            onBlur={(e) => handleUpdateField(client.id, 'interest_level', e.target.value)}
                                        />
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* PANEL LATERAL: EXPEDIENTE Y TRAZABILIDAD TIMELINE */}
            {panelOpen && currentLead && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPanelOpen(false)}></div>
                    <div className="w-full max-w-sm md:max-w-md bg-white h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#4a55c2] text-white">
                            <h2 className="text-lg font-bold">Expediente del Cliente</h2>
                            <button onClick={() => setPanelOpen(false)} className="text-white hover:text-gray-200"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50">

                            {/* Cabecera del Expediente */}
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{currentLead.name}</h3>
                                <p className="text-sm text-brand-600 font-semibold mb-4">{currentLead.rubro || 'Sin rubro asignado'}</p>

                                {/* Social Tracking */}
                                <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                                    <div className="flex items-center">
                                        <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                                        <input
                                            type="number"
                                            placeholder="Valor de Cotización ($)"
                                            className="text-sm bg-gray-50 border-gray-200 rounded px-2 py-1 w-full"
                                            value={currentLead.estimated_value || ''}
                                            onChange={(e) => setCurrentLead({ ...currentLead, estimated_value: e.target.value })}
                                            onBlur={(e) => handleUpdateField(currentLead.id, 'estimated_value', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <AtSign className="w-4 h-4 text-pink-500 mr-2" />
                                        <input
                                            placeholder="@usuario_instagram"
                                            className="text-sm bg-gray-50 border-gray-200 rounded px-2 py-1 w-full"
                                            value={currentLead.social_instagram || ''}
                                            onChange={(e) => setCurrentLead({ ...currentLead, social_instagram: e.target.value })}
                                            onBlur={(e) => handleUpdateField(currentLead.id, 'social_instagram', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {currentLead.pending_tasks == 0 && (
                                    <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg flex items-start border border-red-100">
                                        <BellRing className="w-4 h-4 mr-2 shrink-0" />
                                        ALERTA CRM: Este prospecto fue abandonado en el embudo. No tiene acciones calendarizadas. Asigna un seguimiento.
                                    </div>
                                )}
                            </div>

                            {/* LINEA DE TIEMPO / HISTORY */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center">
                                    <ArrowRight className="w-4 h-4 mr-2 text-[#4a55c2]" />
                                    Timeline Automático
                                </h3>
                                <div className="pl-4 border-l-2 border-[#4a55c2] space-y-6 relative">
                                    {selectedHistory.length === 0 ? (
                                        <p className="text-sm text-gray-400">No hay eventos grabados aún.</p>
                                    ) : (
                                        selectedHistory.map((h, idx) => (
                                            <div key={idx} className="relative">
                                                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-white border-2 border-[#4a55c2] rounded-full"></div>
                                                <span className="block text-xs font-bold text-gray-400 mb-0.5">{new Date(h.created_at).toLocaleString()}</span>
                                                <p className="text-sm text-gray-700 leading-snug">{h.event_desc}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Creador */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 relative border-0">
                        <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-gray-400 p-1"><X className="w-5 h-5" /></button>
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                            <div className="p-2 bg-brand-100 rounded-lg text-brand-600"><Plus className="w-5 h-5" /></div>
                            <h2 className="text-xl font-bold">Crear Lead con Meta-datos</h2>
                        </div>
                        <CardContent className="p-6">
                            <form onSubmit={handleAddClient} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Nombre de Negocio" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} required autoFocus />
                                    <Input label="Teléfono" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Rubro" value={newClient.rubro} onChange={(e) => setNewClient({ ...newClient, rubro: e.target.value })} />
                                    <Input label="Cotización ($)" type="number" value={newClient.estimated_value} onChange={(e) => setNewClient({ ...newClient, estimated_value: parseFloat(e.target.value) })} />
                                </div>

                                <div className="pt-4 flex justify-end pb-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="mr-3">Cancelar</Button>
                                    <Button type="submit" className="bg-[#4a55c2] hover:bg-[#3b43a1]" disabled={saving}>Guardar Prospecto</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
