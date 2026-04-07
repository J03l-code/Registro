import { useState, useEffect } from "react"
import { Search, Plus, X, Phone, MessageCircle } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Card, CardContent } from "../components/ui/Card"

// Utilidad simple para extraer colores según el nivel de interés en el servicio
const getInterestColor = (text: string) => {
    const t = (text || '').toLowerCase();
    if (t.includes('no desea') || t.includes('rechazó')) return 'bg-cyan-300 text-cyan-900 border-cyan-400';
    if (t.includes('enviar') || t.includes('interesado') || t.includes('contactar')) return 'bg-green-400 text-green-900 border-green-500';
    if (t.includes('equivocado') || t.includes('no contest')) return 'bg-gray-200 text-gray-700 border-gray-300';
    return 'bg-white border-gray-300';
};

export function Clientes() {
    const [clients, setClients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Nuevo cliente adaptado
    const [newClient, setNewClient] = useState({
        name: '', rubro: '', phone: '', email: 'n/a@n/a.com', is_contacted: 'SÍ', did_answer: false, wp_sent: false, interest_level: '', notes: ''
    });

    // 1. Cargar Base de datos
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

    // 2. Guardar Permanentemente en BD Nuevo Lead
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
                    setClients([data.client, ...clients]);
                    setIsModalOpen(false);
                    setNewClient({ name: '', rubro: '', phone: '', email: 'n/a@n/a.com', is_contacted: 'NO', did_answer: false, wp_sent: false, interest_level: '', notes: '' });
                } else {
                    alert("Error: " + (data.error || "Datos inválidos."));
                }
            })
            .finally(() => setSaving(false));
    };


    // 3. ACTUALIZACIÓN AUTOMÁTICA EN LÍNEA (ESTILO EXCEL)
    const handleUpdateField = (id: number, field: string, value: any) => {
        // Actualización optimista de interfaz
        setClients(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));

        // Viaje silencioso al servidor Backend para guardado imperceptible
        fetch('/api/clientes.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, [field]: value })
        }).catch(err => console.error("Error al guardado background:", err));
    };

    const handleWhatsApp = (name: string, phone: string) => {
        const text = encodeURIComponent(`Hola ${name}, te contacto de [MiEmprendimiento], ¿cómo podemos ayudarte hoy?`);
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.rubro && c.rubro.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
                        <Input
                            placeholder="Buscar (Nombre / Rubro)"
                            className="pl-9 h-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button className="bg-brand-600 hover:bg-brand-700 h-10 flex-shrink-0" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Cliente
                    </Button>
                </div>
            </div>

            <Card className="flex-1 border-gray-300 shadow-sm overflow-hidden">
                <CardContent className="p-0 overflow-x-auto h-[70vh]">
                    {/* TABLA TIPO EXCEL */}
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-[#4a55c2] text-white font-medium sticky top-0 z-10 shadow-sm border-b border-[#3b43a1]">
                            <tr>
                                <th className="px-4 py-3 border-r border-[#3b43a1] min-w-[200px]">Nombre del Negocio</th>
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
                                <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-500">Cargando datos estilo Excel...</td></tr>
                            ) : filteredClients.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-50 transition-colors group">
                                    {/* Nombre */}
                                    <td className="px-4 py-2 border-r border-gray-200 font-bold text-gray-900 border-l-[3px] border-l-transparent hover:border-l-brand-600 focus-within:border-l-brand-600">
                                        <input
                                            className="w-full bg-transparent border-0 focus:ring-0 p-0 font-bold hover:bg-gray-100 focus:bg-white focus:outline-none"
                                            value={client.name}
                                            onChange={(e) => setClients(prev => prev.map(c => c.id === client.id ? { ...c, name: e.target.value } : c))}
                                            onBlur={(e) => handleUpdateField(client.id, 'name', e.target.value)}
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
                                            checked={client.did_answer === 1 || client.did_answer === true}
                                            onChange={(e) => handleUpdateField(client.id, 'did_answer', e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-400 text-[#4a55c2] focus:ring-[#4a55c2] cursor-pointer"
                                        />
                                    </td>

                                    {/* WP Enviado Checkbox */}
                                    <td className="px-4 py-2 border-r border-gray-200 text-center">
                                        <input
                                            type="checkbox"
                                            checked={client.wp_sent === 1 || client.wp_sent === true}
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

                                    {/* Interés en el servicio Coloreado */}
                                    <td className="p-1 h-full">
                                        <textarea
                                            className={`w-full h-full min-h-[60px] text-xs font-semibold p-2 border-0 focus:ring-2 focus:ring-blue-500 resize-y leading-tight transition-colors rounded ${getInterestColor(client.interest_level)}`}
                                            value={client.interest_level || ''}
                                            placeholder="Escribir nivel de interés..."
                                            onChange={(e) => setClients(prev => prev.map(c => c.id === client.id ? { ...c, interest_level: e.target.value } : c))}
                                            onBlur={(e) => handleUpdateField(client.id, 'interest_level', e.target.value)}
                                        />
                                    </td>

                                </tr>
                            ))}
                            {!loading && filteredClients.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                                        No hay registros vacíos para llamar. Agrega uno nuevo arriba.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Modal Creador Normalizado */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1">
                            <X className="w-5 h-5" />
                        </button>
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                            <div className="p-2 bg-brand-100 rounded-lg text-brand-600"><Phone className="w-5 h-5" /></div>
                            <h2 className="text-xl font-bold text-gray-900">Prospecto para Llamada</h2>
                        </div>
                        <CardContent className="p-6">
                            <form onSubmit={handleAddClient} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Nombre de Negocio" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} required autoFocus />
                                    <Input label="Teléfono" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} required />
                                </div>
                                <Input label="Rubro Comercial" value={newClient.rubro} onChange={(e) => setNewClient({ ...newClient, rubro: e.target.value })} placeholder="Ej: Automotriz, Dental, Barbershop..." />

                                <div className="pt-4 flex justify-end pb-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="mr-3">Cancelar</Button>
                                    <Button type="submit" className="bg-[#4a55c2] hover:bg-[#3b43a1]" disabled={saving}>
                                        {saving ? "Creando lead..." : "Añadir a la Fila"}
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
