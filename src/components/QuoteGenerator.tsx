import { useState } from 'react';
import { X, Printer, Plus, Trash2, Building2 } from 'lucide-react';
import { Button } from './ui/Button';

export function QuoteGenerator({ lead, onClose }: { lead: any, onClose: () => void }) {
    const [items, setItems] = useState([{ desc: 'Asesoría Integral Básica', qty: 1, price: 1500 }]);
    const [taxRate, setTaxRate] = useState(0);

    const subtotal = items.reduce((acc, curr) => acc + (curr.qty * curr.price), 0);
    const tax = subtotal * (taxRate / 100);
    const grandTotal = subtotal + tax;

    const addItem = () => setItems([...items, { desc: '', qty: 1, price: 0 }]);
    const updateItem = (index: number, field: string, value: any) => {
        const arr = [...items];
        (arr[index] as any)[field] = value;
        setItems(arr);
    };
    const removeItem = (index: number) => {
        if (items.length === 1) return;
        const arr = [...items]; arr.splice(index, 1); setItems(arr);
    };

    const handlePrint = () => {
        window.print();
    };

    const formatMoney = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="fixed inset-0 bg-gray-500/80 backdrop-blur-sm z-[100] flex justify-center p-2 sm:p-6 overflow-y-auto print:bg-white print:p-0 print:absolute print:inset-0">

            {/* Controles de Configuración Ocultos en modo Impresión */}
            <div className="hidden sm:flex flex-col gap-4 w-[300px] mr-6 print:hidden">
                <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center">⚙️ Editor de Presupuesto</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Impuestos / IVA (%)</label>
                            <select
                                className="w-full mt-1 border-gray-200 rounded-lg text-sm"
                                value={taxRate} onChange={e => setTaxRate(Number(e.target.value))}
                            >
                                <option value={0}>0% (Neto/Exento)</option>
                                <option value={8}>8% (Frontera)</option>
                                <option value={16}>16% (IVA Normal)</option>
                                <option value={21}>21% (IVA General)</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <Button onClick={addItem} variant="outline" className="w-full text-brand-600 border-brand-200 bg-brand-50 hover:bg-brand-100">
                                <Plus className="w-4 h-4 mr-2" /> Fila de Concepto
                            </Button>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-100 space-y-3">
                        <Button onClick={handlePrint} className="w-full bg-[#4a55c2] hover:bg-[#3b43a1] font-bold shadow-lg shadow-brand-500/30">
                            <Printer className="w-4 h-4 mr-2" /> Exportar a PDF
                        </Button>
                        <Button onClick={onClose} variant="ghost" className="w-full text-gray-500">Cerrar</Button>
                    </div>
                </div>
            </div>

            {/* Papel Visual A4 (Se convertirá en el PDF final) */}
            <div className="bg-white w-full max-w-[800px] min-h-[1056px] shadow-2xl relative flex flex-col mx-auto print:shadow-none print:m-0 print:w-full print:max-w-none">
                {/* BOTÓN MÓVIL (Oculto en PDF) */}
                <button onClick={onClose} className="absolute right-4 top-4 text-brand-100 opacity-50 hover:opacity-100 print:hidden z-10"><X className="w-8 h-8" /></button>

                {/* CABECERA CORPORATIVA DE COTIZACIÓN */}
                <div className="bg-[#121A2F] text-white p-10 flex justify-between items-start print:bg-[#121A2F] print:-webkit-print-color-adjust-exact">
                    <div>
                        <div className="flex items-center mb-3">
                            <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center mr-3">
                                <Building2 className="text-white w-6 h-6" />
                            </div>
                            <h1 className="text-2xl font-black tracking-widest text-white">EMPRESA S.A.</h1>
                        </div>
                        <p className="text-gray-400 text-sm">Ciudad de Operaciones, C.P. 54321</p>
                        <p className="text-gray-400 text-sm">contacto@tudominio.com | +52 555 123 4567</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-black text-white opacity-90 tracking-widest mb-2 uppercase">Cotización</h2>
                        <p className="text-brand-300 font-mono text-lg">#{Math.floor(1000 + Math.random() * 9000)}-{new Date().getFullYear()}</p>
                        <p className="text-gray-400 text-sm mt-1">Fecha: {new Date().toLocaleDateString('es-ES')}</p>
                        <p className="text-gray-400 text-sm">Válida por: 15 días</p>
                    </div>
                </div>

                {/* DATOS DEL CLIENTE REDENRIZADOS DESDE EL CRM */}
                <div className="p-10 flex justify-between border-b border-gray-100">
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Preparado Para:</h4>
                        <p className="text-lg font-bold text-gray-900 border-b border-dashed border-gray-200 inline-block">{lead.name}</p>
                        <p className="text-gray-600 mt-1">{lead.rubro || 'Comercio General'}</p>
                        <p className="text-gray-500 text-sm mt-2 font-medium">📞 {lead.phone}</p>
                        <p className="text-gray-500 text-sm">✉️ {lead.email || 'A quien corresponda'}</p>
                    </div>
                </div>

                {/* TABLA DE CONCEPTOS (LA MAGIA) */}
                <div className="flex-1 p-10 pb-0">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-gray-900 text-sm uppercase tracking-wider text-gray-900">
                                <th className="py-3 font-black w-1/2">Descripción del Servicio/Producto</th>
                                <th className="py-3 font-black text-center w-[15%]">Cant.</th>
                                <th className="py-3 font-black text-right w-[15%]">Precio U.</th>
                                <th className="py-3 font-black text-right w-[20%]">Monto Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100 group relative">
                                    {/* Control Basura para quitar filas */}
                                    <td className="absolute -left-10 top-3 print:hidden opacity-0 group-hover:opacity-100 cursor-pointer text-red-400 hover:text-red-500 transition-opacity" onClick={() => removeItem(idx)}>
                                        <Trash2 className="w-5 h-5" />
                                    </td>
                                    <td className="py-4 align-top">
                                        {/* Editor Invisible */}
                                        <textarea
                                            className="w-full bg-transparent border-0 resize-none outline-none focus:ring-0 p-0 text-gray-800 focus:bg-yellow-50"
                                            rows={2}
                                            value={item.desc}
                                            onChange={(e) => updateItem(idx, 'desc', e.target.value)}
                                            placeholder="Ej: Licencia anual de software de gestión..."
                                        />
                                    </td>
                                    <td className="py-4 align-top text-center">
                                        <input type="number" min={1} className="w-16 bg-transparent border-0 outline-none text-center font-brand font-medium focus:bg-yellow-50 p-0" value={item.qty} onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))} />
                                    </td>
                                    <td className="py-4 align-top text-right">
                                        <div className="flex items-center justify-end">
                                            <span className="text-gray-400 text-xs mr-1">$</span>
                                            <input type="number" step="0.01" className="w-24 bg-transparent border-0 outline-none text-right font-medium focus:bg-yellow-50 p-0" value={item.price} onChange={(e) => updateItem(idx, 'price', Number(e.target.value))} />
                                        </div>
                                    </td>
                                    <td className="py-4 align-top text-right font-bold text-gray-900">
                                        {formatMoney(item.qty * item.price)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* TOTALES FINANCIEROS */}
                <div className="p-10 pt-6 flex justify-end">
                    <div className="w-1/2 md:w-[45%]">
                        <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
                            <span>Subtotal Operativo</span>
                            <span className="font-semibold">{formatMoney(subtotal)}</span>
                        </div>
                        {taxRate > 0 && (
                            <div className="flex justify-between py-2 border-b border-gray-100 text-gray-500">
                                <span>Impuestos (IVA {taxRate}%)</span>
                                <span>{formatMoney(tax)}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-4 text-2xl font-black text-gray-900 border-b-4 border-brand-900 mt-2">
                            <span>Total a Pagar</span>
                            <span>{formatMoney(grandTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* NOTAS FINALES (PIE DE PÁGINA) */}
                <div className="p-10 text-xs text-gray-400 italic">
                    <p>Aprobación requerida para inicio de trabajos. Los precios mostrados están sujetos a las tasas de cambio de moneda aplicables el día de liquidación. Métodos de pago aceptados: Transferencia SPEI, Depósito y Tarjeta de Crédito vía pasarela comercial (+3% feed). GRACIAS POR SU PREFERENCIA.</p>
                </div>

            </div>

            {/* Botón flotante móvil que solo aparece en pantallas pequeñsa */}
            <Button onClick={handlePrint} className="sm:hidden fixed bottom-6 left-6 right-6 bg-[#4a55c2] shadow-2xl py-6 font-bold z-50 print:hidden">
                <Printer className="w-5 h-5 mr-2" /> GENERAR PDF
            </Button>

        </div>
    );
}
