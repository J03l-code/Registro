import { useState, useEffect } from "react"
import { Search, Plus, X, MessageCircle, Filter, Eye, DollarSign, AtSign, ArrowRight, BellRing, CalendarClock, Download, UploadCloud, FileText, LayoutList, KanbanSquare } from "lucide-react"
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

// Columnas Kanban atadas al ENUM de SQL
const KANBAN_COLS = [
    { id: 'FRÍO', title: 'Recién Llegados (Fríos)', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
    { id: 'TIBIO', title: 'En Negociación (Tibios)', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800' },
    { id: 'CALIENTE', title: 'Cerrado / Pagado (Calientes)', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' }
];

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

    // FASE 10: CONMUTADOR DE VISTAS (TABLA / KANBAN)
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

    // Estados de Expediente / Línea de tiempo
    const [panelOpen, setPanelOpen] = useState(false);
    const [currentLead, setCurrentLead] = useState<any>(null);
    const [selectedHistory, setSelectedHistory] = useState<any[]>([]);
    const [leadFiles, setLeadFiles] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);

    // Estados de Tareas Cruzadas
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskSaving, setTaskSaving] = useState(false);
    const [newTask, setNewTask] = useState({ type: 'LLAMADA', summary: '', scheduled_for: '' });

    const [newClient, setNewClient] = useState({
        name: '', rubro: '', phone: '', email: 'n/a@n/a.com', is_contacted: 'SÍ', did_answer: false, wp_sent: false, interest_level: '', notes: '', estimated_value: 0
    });

    useEffect(() => {
        fetch('/api/clientes.php')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setClients(data.map(c => ({ ...c, status: c.status || 'FRÍO' })));
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
                    data.client.pending_tasks = 0;
                    data.client.status = 'FRÍO';
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

        if (currentLead && currentLead.id === id) {
            setCurrentLead((prev: any) => ({ ...prev, [field]: value }));
        }
    };

    const handleWhatsApp = (name: string, phone: string) => {
        const text = encodeURIComponent(`Hola ${name}, te contacto de [MiEmprendimiento], ¿cómo podemos ayudarte hoy?`);
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
    };

    const openHistoryPanel = (lead: any) => {
        setCurrentLead(lead);
        setSelectedHistory([]);
        setLeadFiles([]);
        setPanelOpen(true);
        fetch(`/api/history.php?lead_id=${lead.id}`).then(r => r.json()).then(d => { if (d.success) setSelectedHistory(d.data || []); });
        fetch(`/api/upload.php?lead_id=${lead.id}`).then(r => r.json()).then(d => { if (d.success) setLeadFiles(d.data || []); });
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        setTaskSaving(true);
        fetch('/api/agenda.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newTask, lead_id: currentLead.id })
        }).then(r => r.json()).then(data => {
            if (data.success) {
                setClients(prev => prev.map(c => c.id === currentLead.id ? { ...c, pending_tasks: (c.pending_tasks || 0) + 1 } : c));
                setCurrentLead((prev: any) => ({ ...prev, pending_tasks: (prev.pending_tasks || 0) + 1 }));
                setIsTaskModalOpen(false);
                openHistoryPanel(currentLead);
            }
        }).finally(() => setTaskSaving(false));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('lead_id', currentLead.id);

        fetch('/api/upload.php', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setLeadFiles([{ filename: data.filename, file_url: data.file_url, created_at: new Date().toISOString() }, ...leadFiles]);
                    openHistoryPanel(currentLead);
                } else {
                    alert("Error subiendo: " + data.error);
                }
            })
            .finally(() => setUploading(false));
    };

    const handleExportCSV = () => {
        let content = "Nombre,Rubro,Telefono,Cotizacion($),Contactado,Contesto,WhatsApp,Interes,Fecha Llamada,EstadoPipeline,Notas\n";
        clients.forEach(c => {
            const name = `"${(c.name || '').replace(/"/g, '""')}"`;
            const rubro = `"${(c.rubro || '').replace(/"/g, '""')}"`;
            const phone = `"${c.phone}"`;
            const valor = c.estimated_value || 0;
            const contactado = `"${c.is_contacted}"`;
            const contesto = (c.did_answer == 1) ? '"SÍ"' : '"NO"';
            const wp = (c.wp_sent == 1) ? '"SÍ"' : '"NO"';
            const interes = `"${(c.interest_level || '').replace(/"/g, '""')}"`;
            const fecha = `"${c.call_date || ''}"`;
            const status = `"${c.status || 'FRÍO'}"`;
            const notas = `"${(c.notes || '').replace(/"/g, '""').replace(/\n/g, '  ')}"`;

            content += `${name},${rubro},${phone},${valor},${contactado},${contesto},${wp},${interes},${fecha},${status},${notas}\n`;
        });

        const blob = new Blob(["\ufeff", content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Reporte_Clientes_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ----- NÚCLEO DRAG & DROP PARA KANBAN -----
    const onDragStart = (e: React.DragEvent, id: number) => {
        e.dataTransfer.setData("clientId", id.toString());
    };
    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };
    const onDrop = (e: React.DragEvent, statusId: string) => {
        e.preventDefault();
        const id = parseInt(e.dataTransfer.getData("clientId"));
        if (!id) return;

        // Obtenemos al cliente temporal
        const clientFound = clients.find(c => c.id === id);
        if (!clientFound || clientFound.status === statusId) return; // Ya está aquí

        // Mover visualmente (Actualización Optimista)
        setClients(prev => prev.map(c => c.id === id ? { ...c, status: statusId } : c));

        // Impactar Backend de manera silenciosa
        fetch('/api/clientes.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: statusId })
        });
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
                    <p className="text-gray-500 mt-1 text-sm">Gestiona y rastrea tu pipeline a velocidad corporativa.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {/* Toggler KANBAN / TABLE */}
                    <div className="flex bg-gray-100 rounded-md border border-gray-200 p-1 mr-2 text-sm font-medium h-10">
                        <button
                            className={`flex items-center px-4 rounded ${viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                            onClick={() => setViewMode('table')}>
                            <LayoutList className="w-4 h-4 mr-2" /> Hoja de Cálculo
                        </button>
                        <button
                            className={`flex items-center px-4 rounded ${viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                            onClick={() => setViewMode('kanban')}>
                            <KanbanSquare className="w-4 h-4 mr-2" /> Pipeline Kanban
                        </button>
                    </div>

                    <div className="relative w-full sm:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Buscar..." className="pl-9 h-10 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    <Button variant="outline" className="h-10 border-green-600 bg-green-50 text-green-700 hover:bg-green-100 flex-shrink-0" onClick={handleExportCSV}>
                        <Download className="w-4 h-4 mr-1" /> EXPORTAR
                    </Button>

                    <Button variant="outline" className={`h-10 border-gray-300 flex-shrink-0 ${showFilters ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`} onClick={() => setShowFilters(!showFilters)}>
                        <Filter className="w-4 h-4 mr-1" /> Filtros
                    </Button>
                    <Button className="bg-brand-600 hover:bg-brand-700 h-10 flex-shrink-0" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-1" /> Lead
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

            {/* COMPORTAMIENTO CONDICIONAL DEL DOM (TABLA vs KANBAN) */}
            {viewMode === 'table' ? (
                <Card className="flex-1 border-gray-300 shadow-sm overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
                    <CardContent className="p-0 overflow-x-auto h-[70vh]">
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
                                        <td className="px-3 py-2 border-r border-gray-200 text-center relative pointer-events-auto">
                                            <button onClick={() => openHistoryPanel(client)} className="text-[#4a55c2] hover:bg-gray-200 p-1.5 rounded transition-all">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            {client.pending_tasks == 0 && client.status !== 'CALIENTE' && (
                                                <span className="absolute top-[8px] right-[8px] flex h-3 w-3" title="Atención Obligatoria: Sin Agendamiento Futuro">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 flex items-center justify-center">
                                                        <BellRing className="w-2 h-2 text-white absolute left-[1px] top-[1.5px] scale-[0.8]" />
                                                    </span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 border-r border-gray-200 font-bold text-gray-900 border-l-[3px] border-l-transparent hover:border-l-brand-600 focus-within:border-l-brand-600">
                                            <input className="w-full bg-transparent border-0 focus:ring-0 p-0 font-bold hover:bg-gray-100 focus:bg-white focus:outline-none" value={client.name} onChange={(e) => setClients(prev => prev.map(c => c.id === client.id ? { ...c, name: e.target.value } : c))} onBlur={(e) => handleUpdateField(client.id, 'name', e.target.value)} />
                                        </td>
                                        <td className="px-4 py-2 border-r border-gray-200 text-brand-700 font-semibold flex items-center">
                                            <span className="mr-0.5 text-xs text-gray-400">$</span>
                                            <input type="number" className="w-full bg-transparent border-0 focus:ring-0 p-0 font-medium text-sm hover:bg-gray-100 focus:bg-white" value={client.estimated_value || ''} placeholder="0.00" onChange={(e) => setClients(prev => prev.map(c => c.id === client.id ? { ...c, estimated_value: e.target.value } : c))} onBlur={(e) => handleUpdateField(client.id, 'estimated_value', parseFloat(e.target.value) || 0)} />
                                        </td>
                                        <td className="px-4 py-2 border-r border-gray-200">
                                            <input className="w-full bg-transparent border-0 text-gray-600 focus:ring-0 p-0 text-sm hover:bg-gray-100 focus:bg-white" value={client.rubro || ''} placeholder="Ingresar..." onChange={(e) => setClients(prev => prev.map(c => c.id === client.id ? { ...c, rubro: e.target.value } : c))} onBlur={(e) => handleUpdateField(client.id, 'rubro', e.target.value)} />
                                        </td>
                                        <td className="px-4 py-2 border-r border-gray-200 flex items-center justify-between group-hover:bg-gray-50">
                                            <input className="w-full bg-transparent min-w-[80px] border-0 font-medium text-gray-700 focus:ring-0 p-0 text-sm" value={client.phone || ''} onChange={(e) => setClients(prev => prev.map(c => c.id === client.id ? { ...c, phone: e.target.value } : c))} onBlur={(e) => handleUpdateField(client.id, 'phone', e.target.value)} />
                                            <button onClick={() => handleWhatsApp(client.name, client.phone)} className="text-green-500 hover:text-green-600 transition-colors outline-none ml-1 p-1 hover:bg-green-50 rounded" title="Abrir WhatsApp"><MessageCircle className="w-4 h-4" /></button>
                                        </td>
                                        <td className="px-4 py-2 border-r border-gray-200 text-center">
                                            <select value={client.is_contacted || 'NO'} onChange={(e) => handleUpdateField(client.id, 'is_contacted', e.target.value)} className={`text-sm rounded-full px-3 py-1 font-semibold border focus:ring-0 cursor-pointer appearance-none text-center outline-none ${client.is_contacted === 'SÍ' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                <option value="SÍ">sí</option>
                                                <option value="NO">no</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-2 border-r border-gray-200 text-center">
                                            <input type="checkbox" checked={client.did_answer == 1 || client.did_answer === true} onChange={(e) => handleUpdateField(client.id, 'did_answer', e.target.checked)} className="w-5 h-5 rounded border-gray-400 text-[#4a55c2] focus:ring-[#4a55c2] cursor-pointer" />
                                        </td>
                                        <td className="px-4 py-2 border-r border-gray-200 text-center">
                                            <input type="checkbox" checked={client.wp_sent == 1 || client.wp_sent === true} onChange={(e) => handleUpdateField(client.id, 'wp_sent', e.target.checked)} className="w-5 h-5 rounded border-gray-400 text-green-500 focus:ring-green-500 cursor-pointer" />
                                        </td>
                                        <td className="p-0 border-r border-gray-200 h-full">
                                            <textarea className="w-full h-full min-h-[60px] bg-transparent border-0 text-xs text-gray-600 p-2 focus:ring-0 focus:bg-yellow-50 resize-y leading-tight" value={client.notes || ''} placeholder="Añadir nota..." onChange={(e) => setClients(prev => prev.map(c => c.id === client.id ? { ...c, notes: e.target.value } : c))} onBlur={(e) => handleUpdateField(client.id, 'notes', e.target.value)} />
                                        </td>
                                        <td className="px-4 py-2 border-r border-gray-200">
                                            <input type="date" className="w-full bg-transparent border-0 text-gray-600 focus:ring-0 p-0 text-xs cursor-text" value={client.call_date ? client.call_date.split('T')[0] : ''} onChange={(e) => handleUpdateField(client.id, 'call_date', e.target.value)} />
                                        </td>
                                        <td className="p-1 h-full">
                                            <textarea className={`w-full h-full min-h-[60px] text-xs font-semibold p-2 border-0 focus:ring-2 focus:ring-blue-500 resize-y leading-tight transition-colors rounded ${getInterestColor(client.interest_level)}`} value={client.interest_level || ''} placeholder="Escribir (Azul='no desea', Verde='interesa', Gris='no contenta')..." onChange={(e) => setClients(prev => prev.map(c => c.id === client.id ? { ...c, interest_level: e.target.value } : c))} onBlur={(e) => handleUpdateField(client.id, 'interest_level', e.target.value)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            ) : (
                // BOARD KANBAN VISUAL (Arrastrar y Soltar)
                <div className="flex-1 flex gap-6 overflow-x-auto h-[70vh] pb-4 px-2 animate-in slide-in-from-bottom-4 duration-300">
                    {KANBAN_COLS.map(column => (
                        <div
                            key={column.id}
                            className={`flex flex-col w-[350px] min-w-[320px] rounded-xl border-2 border-dashed ${column.border} bg-gray-50/50 p-3 h-full transition-colors`}
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, column.id)}
                        >
                            <h3 className={`font-bold uppercase tracking-wider text-sm mb-3 px-2 py-1.5 rounded bg-white border ${column.border} ${column.text} shadow-sm border-b-2`}>
                                {column.title} — {filteredClients.filter(c => c.status === column.id).length}
                            </h3>

                            <div className="flex-1 overflow-y-auto space-y-3 px-1 custom-scrollbar">
                                {filteredClients.filter(c => c.status === column.id).map(client => (
                                    <div
                                        key={client.id}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, client.id)}
                                        className="bg-white border text-left border-gray-200 rounded-lg p-4 shadow-sm cursor-grab active:cursor-grabbing hover:border-[#4a55c2] hover:shadow-md transition-all group relative"
                                    >
                                        {client.pending_tasks == 0 && client.status !== 'CALIENTE' && (
                                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5" title="Sin Tareas Programadas">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-full w-full bg-red-500"></span>
                                            </span>
                                        )}

                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-gray-900 leading-tight">{client.name}</h4>
                                            <button onClick={() => openHistoryPanel(client)} className="text-gray-400 hover:text-[#4a55c2]" title="Abrir Expediente">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <p className="text-sm text-gray-600 mb-1 flex items-center">
                                            <DollarSign className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                            <span className="font-semibold text-gray-800">{client.estimated_value ? `$${client.estimated_value}` : '$0.00'}</span>
                                        </p>

                                        <p className="text-xs text-gray-500 line-clamp-2 italic mb-3">
                                            "{client.notes || 'Sin notas descriptivas'}"
                                        </p>

                                        <div className="flex pt-3 border-t border-gray-100 justify-between items-center">
                                            <button onClick={() => handleWhatsApp(client.name, client.phone)} className="flex items-center text-xs text-green-600 font-semibold hover:bg-green-50 p-1.5 rounded transition-colors">
                                                <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp
                                            </button>
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                                {client.rubro || 'Sin Rubro'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {filteredClients.filter(c => c.status === column.id).length === 0 && (
                                    <div className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm font-medium">
                                        Arrastrar aquí
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* PANEL LATERAL: EXPEDIENTE Y TRAZABILIDAD TIMELINE Y CLOUD DRIVE */}
            {panelOpen && currentLead && (
                <div className="fixed inset-0 z-40 flex justify-end">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPanelOpen(false)}></div>
                    <div className="w-full max-w-sm md:max-w-md bg-white h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#4a55c2] text-white">
                            <h2 className="text-lg font-bold">Expediente del Cliente</h2>
                            <button onClick={() => setPanelOpen(false)} className="text-white hover:text-gray-200"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50">

                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-xl font-bold text-gray-900">{currentLead.name}</h3>
                                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                        {currentLead.status || 'FRÍO'}
                                    </span>
                                </div>
                                <p className="text-sm text-brand-600 font-semibold mb-4">{currentLead.rubro || 'Sin rubro asignado'}</p>

                                <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                                    <div className="flex items-center">
                                        <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                                        <input type="number" placeholder="Valor de Cotización ($)" className="text-sm bg-gray-50 border-gray-200 rounded px-2 py-1 w-full" value={currentLead.estimated_value || ''} onChange={(e) => setCurrentLead({ ...currentLead, estimated_value: e.target.value })} onBlur={(e) => handleUpdateField(currentLead.id, 'estimated_value', parseFloat(e.target.value) || 0)} />
                                    </div>
                                    <div className="flex items-center">
                                        <AtSign className="w-4 h-4 text-pink-500 mr-2" />
                                        <input placeholder="@usuario_instagram" className="text-sm bg-gray-50 border-gray-200 rounded px-2 py-1 w-full" value={currentLead.social_instagram || ''} onChange={(e) => setCurrentLead({ ...currentLead, social_instagram: e.target.value })} onBlur={(e) => handleUpdateField(currentLead.id, 'social_instagram', e.target.value)} />
                                    </div>
                                </div>

                                {currentLead.pending_tasks == 0 && currentLead.status !== 'CALIENTE' ? (
                                    <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg flex items-start border border-red-100">
                                        <BellRing className="w-4 h-4 mr-2 shrink-0" /> ALERTA: Sin acciones calendarizadas.
                                    </div>
                                ) : (
                                    <div className="mt-4 p-3 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100">
                                        ✔ Cliente en seguimiento activo / cerrado ({currentLead.pending_tasks} tareas).
                                    </div>
                                )}

                                {currentLead.status !== 'CALIENTE' && (
                                    <Button onClick={() => { setNewTask({ type: 'LLAMADA', summary: '', scheduled_for: '' }); setIsTaskModalOpen(true); }} className="w-full mt-4 bg-orange-100 text-orange-700 hover:bg-orange-200 shadow-none border border-orange-200 font-bold">
                                        <CalendarClock className="w-4 h-4 mr-2" /> Agendar Siguiente Paso
                                    </Button>
                                )}
                            </div>

                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                                <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center">
                                    <UploadCloud className="w-4 h-4 mr-2" /> Archivos Adjuntos
                                </h3>
                                <div className="space-y-2 mb-3">
                                    {leadFiles.length === 0 ? <p className="text-xs text-blue-400 font-medium">Vacío (Sin contratos/recibos)</p> :
                                        leadFiles.map((file, i) => (
                                            <a key={i} href={file.file_url} target="_blank" rel="noreferrer" className="flex items-center text-xs bg-white border border-blue-100 p-2 rounded hover:bg-blue-100 transition-colors">
                                                <FileText className="w-3 h-3 mr-2 text-blue-500 flex-shrink-0" />
                                                <span className="truncate flex-1 text-blue-800 font-medium">{file.filename}</span>
                                            </a>
                                        ))}
                                </div>
                                <label className="text-xs cursor-pointer bg-white text-blue-600 font-semibold border-2 border-dashed border-blue-300 w-full rounded p-3 text-center flex items-center justify-center hover:bg-blue-50 transition-colors">
                                    {uploading ? 'Subiendo...' : 'Agregar Archivo PDF / JPG'}
                                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                </label>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center">
                                    <ArrowRight className="w-4 h-4 mr-2 text-[#4a55c2]" /> Timeline Automático
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

            {isTaskModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 shadow-xl">
                    <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 relative border-0 rounded-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white text-center">
                            <CalendarClock className="w-12 h-12 mx-auto mb-2 opacity-90" />
                            <h2 className="text-2xl font-black">Siguiente Paso</h2>
                            <p className="text-orange-100 text-sm mt-1">Conecta esta alerta a tu Agenda Central</p>
                        </div>
                        <CardContent className="p-6 bg-white">
                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Tipo de Acción</label>
                                    <select className="w-full mt-1 border-gray-200 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500" value={newTask.type} onChange={e => setNewTask({ ...newTask, type: e.target.value })}>
                                        <option value="LLAMADA">Llamada Telefónica</option>
                                        <option value="EMAIL">Enviar Correo Electrónico</option>
                                        <option value="REUNIÓN">Reunión Virtual/Física</option>
                                        <option value="ACUERDO">Cerrar Acuerdo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Resumen</label>
                                    <Input value={newTask.summary} onChange={e => setNewTask({ ...newTask, summary: e.target.value })} placeholder="Ej: Llamar..." required className="mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Fecha y Hora</label>
                                    <Input type="datetime-local" value={newTask.scheduled_for} onChange={e => setNewTask({ ...newTask, scheduled_for: e.target.value })} required className="mt-1" />
                                </div>
                                <div className="flex justify-end pt-4 gap-3">
                                    <Button type="button" variant="outline" onClick={() => setIsTaskModalOpen(false)}>Descartar</Button>
                                    <Button type="submit" disabled={taskSaving} className="bg-orange-600 hover:bg-orange-700 font-bold">{taskSaving ? 'Guardando...' : 'Confirmar Tarea'}</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

        </div>
    )
}
