import { useState } from "react"
import { Search, Plus, MoreHorizontal, MessageCircle } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Badge } from "../components/ui/Badge"
import { Card, CardContent } from "../components/ui/Card"

const initialClients = [
    { id: 1, name: 'Juan Pérez', phone: '+525551234567', email: 'juan@example.com', status: 'CALIENTE', source: 'Web' },
    { id: 2, name: 'María García', phone: '+525559876543', email: 'maria@example.com', status: 'TIBIO', source: 'Referido' },
    { id: 3, name: 'Carlos López', phone: '+525555555555', email: 'carlos@example.com', status: 'FRÍO', source: 'Campaña FB' },
];

export function Clientes() {
    const [clients] = useState(initialClients);
    const [searchTerm, setSearchTerm] = useState("");

    const handleWhatsApp = (name: string, phone: string) => {
        const text = encodeURIComponent(`Hola ${name}, te contacto de [MiEmprendimiento], ¿cómo podemos ayudarte hoy?`);
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Clientes</h1>
                    <p className="text-gray-500 mt-1 text-sm">Administra tu cartera de clientes y prospectos.</p>
                </div>
                <Button className="bg-brand-600 hover:bg-brand-700 h-10">
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
                    {/* Aquí irían filtros adicionales */}
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
                                {filteredClients.map((client) => (
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
                                {filteredClients.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                            No se encontraron clientes que coincidan con la búsqueda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
