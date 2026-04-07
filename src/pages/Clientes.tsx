import { useState, useEffect } from "react"
import { Search, Plus, MoreHorizontal, MessageCircle, X } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Badge } from "../components/ui/Badge"
import { Card, CardContent } from "../components/ui/Card"

export function Clientes() {
    const [clients, setClients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', status: 'FRÍO', source: 'Web' });

    // 1. Cargar Base de datos de Hostinger
    useEffect(() => {
        fetch('/api/clientes.php')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setClients(data);
                setLoading(false);
            })
            .catch(e => {
                console.error("No se pudo contactar la API", e);
                setLoading(false);
            });
    }, []);

    const handleWhatsApp = (name: string, phone: string) => {
        const text = encodeURIComponent(`Hola ${name}, te contacto de [MiEmprendimiento], ¿cómo podemos ayudarte hoy?`);
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
    };

    // 2. Guardar Permanentemente en la Base de datos
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
                    setNewClient({ name: '', phone: '', email: '', status: 'FRÍO', source: 'Web' });
                } else {
                    alert("Error de Hostinger: " + (data.error || "Datos inválidos."));
                }
            })
            .catch(err => {
                alert("Error de red contactando al servidor.");
                console.error(err);
            })
            .finally(() => setSaving(false));
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Clientes</h1>
                    <p className="text-gray-500 mt-1 text-sm">Administra tu cartera de clientes y prospectos reales.</p>
                </div>
                <Button className="bg-brand-600 hover:bg-brand-700 h-10" onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Cliente
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar clientes..."
                            className="pl-9 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Contacto</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4">Origen</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Cargando base de datos...</td></tr>
                                ) : filteredClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{client.name}</div>
                                            <div className="text-gray-500 text-xs mt-0.5">{client.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{client.phone}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={
                                                client.status === 'CALIENTE' ? 'error' :
                                                    client.status === 'TIBIO' ? 'warning' : 'outline'
                                            }>
                                                {client.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{client.source}</td>
                                        <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-green-600 hover:text-green-700 hover:bg-green-50 px-2"
                                                onClick={() => handleWhatsApp(client.name, client.phone)}
                                                aria-label="Contactar por WhatsApp"
                                            >
                                                <MessageCircle className="w-4 h-4 mr-1.5" />
                                                WhatsApp
                                            </Button>
                                            <Button variant="ghost" size="sm" className="px-2 text-gray-400 hover:text-gray-900">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filteredClients.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                            No hay clientes guardados en la base de datos de Hostinger.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Modal para Crear Cliente */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Registrar Cliente Real</h2>
                        </div>
                        <CardContent className="p-6">
                            <form onSubmit={handleAddClient} className="space-y-4">
                                <Input
                                    label="Nombre Completo"
                                    value={newClient.name}
                                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Teléfono (Con código de país)"
                                    value={newClient.phone}
                                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                    placeholder="+521234567890"
                                    required
                                />
                                <Input
                                    label="Correo Electrónico"
                                    type="email"
                                    value={newClient.email}
                                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                    required
                                />
                                <div className="flex flex-col gap-1.5 w-full">
                                    <label className="text-sm font-medium text-gray-700">Estado del Lead</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                        value={newClient.status}
                                        onChange={(e) => setNewClient({ ...newClient, status: e.target.value })}
                                    >
                                        <option value="FRÍO">Frío</option>
                                        <option value="TIBIO">Tibio</option>
                                        <option value="CALIENTE">Caliente</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5 w-full">
                                    <label className="text-sm font-medium text-gray-700">Origen de Contacto</label>
                                    <Input
                                        value={newClient.source}
                                        onChange={(e) => setNewClient({ ...newClient, source: e.target.value })}
                                        placeholder="Ej: Web, Referido, Facebook"
                                        required
                                    />
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="mr-2 text-gray-600">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="bg-brand-600 hover:bg-brand-700" disabled={saving}>
                                        {saving ? "Guardando DB..." : "Guardar Cliente"}
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
