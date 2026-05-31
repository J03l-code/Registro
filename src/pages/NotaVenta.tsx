import { useState, useEffect } from "react"
import { jsPDF } from "jspdf"
import { 
  Building2, 
  User, 
  Plus, 
  Trash2, 
  Download, 
  Calculator, 
  Search,
  Receipt,
  Sparkles
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Card, CardContent } from "../components/ui/Card"

// Utility to convert image URL to base64
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      resolve(reader.result as string);
    }, false);
    reader.onerror = () => {
      reject(new Error("Error al convertir imagen a base64"));
    };
    reader.readAsDataURL(blob);
  });
};

export function NotaVenta() {
  // --- STATE FOR LOGOS BASE64 ---
  const [logosBase64, setLogosBase64] = useState<{ largo: string; compacto: string }>({ largo: "", compacto: "" });

  // --- STATE FOR CLIENTS LIST FROM CRM ---
  const [crmClients, setCrmClients] = useState<any[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // --- PERSISTED COMPANY CONFIG STATE ---
  const [companyName, setCompanyName] = useState(() => localStorage.getItem("nv_comp_name") || "PROFARNOVA CIA. LTDA.");
  const [companyRuc, setCompanyRuc] = useState(() => localStorage.getItem("nv_comp_ruc") || "1792345678001");
  const [companyAddress, setCompanyAddress] = useState(() => localStorage.getItem("nv_comp_address") || "Av. Eloy Alfaro N34-12 y Shyris, Quito");
  const [companyPhone, setCompanyPhone] = useState(() => localStorage.getItem("nv_comp_phone") || "+593 2 2999 999");
  const [companyEmail, setCompanyEmail] = useState(() => localStorage.getItem("nv_comp_email") || "info@profarnova.com");
  const [selectedLogo, setSelectedLogo] = useState<"largo" | "compacto">(() => (localStorage.getItem("nv_comp_logo") as "largo" | "compacto") || "largo");
  
  // Toggle for company settings section
  const [showCompanySettings, setShowCompanySettings] = useState(false);

  // --- DOCUMENT IDENTIFICATION ---
  const [secNum, setSecNum] = useState(() => localStorage.getItem("nv_doc_sec") || "001-001-000000123");
  const [docDate, setDocDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [docCity, setDocCity] = useState("Quito");

  // --- CLIENT DATA STATE ---
  const [clientName, setClientName] = useState("");
  const [clientRucCi, setClientRucCi] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  // --- PRODUCTS / SERVICES TABLE ---
  const [items, setItems] = useState<Array<{ qty: number; desc: string; price: number }>>([
    { qty: 2, desc: "Producto A", price: 10.00 }
  ]);

  // --- FINANCIALS ---
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("fixed");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [ivaRate, setIvaRate] = useState<number>(15); // Default 15% Ecuador standard
  const [paymentMethod, setPaymentMethod] = useState<string>("efectivo");
  const [observations, setObservations] = useState("");

  // Signature check-boxes
  const [showSellerSignature, setShowSellerSignature] = useState(true);
  const [showClientSignature, setShowClientSignature] = useState(true);

  // --- LOAD CRM CLIENTS & LOGOS ON MOUNT ---
  useEffect(() => {
    fetch("/api/clientes.php")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCrmClients(data);
      })
      .catch(err => console.error("Error al cargar clientes CRM:", err));

    const loadLogos = async () => {
      try {
        const largo = await getBase64ImageFromUrl("/Logo_largo.png");
        const compacto = await getBase64ImageFromUrl("/logo-jd-clean.png");
        setLogosBase64({ largo, compacto });
      } catch (e) {
        console.warn("No se pudieron pre-cargar los logos en base64 de manera estática. Se usarán fallbacks.", e);
      }
    };
    loadLogos();
  }, []);

  // Save company config to localStorage on change
  useEffect(() => {
    localStorage.setItem("nv_comp_name", companyName);
    localStorage.setItem("nv_comp_ruc", companyRuc);
    localStorage.setItem("nv_comp_address", companyAddress);
    localStorage.setItem("nv_comp_phone", companyPhone);
    localStorage.setItem("nv_comp_email", companyEmail);
    localStorage.setItem("nv_comp_logo", selectedLogo);
  }, [companyName, companyRuc, companyAddress, companyPhone, companyEmail, selectedLogo]);

  // --- LOGIC FOR CRM CLIENT AUTO-SELECT ---
  const handleSelectClient = (client: any) => {
    setClientName(client.name);
    setClientPhone(client.phone || "");
    setClientEmail(client.email || "");
    
    // Look up cached extra info for this client name in localStorage
    const extraProfiles = JSON.parse(localStorage.getItem("nv_client_profiles") || "{}");
    if (extraProfiles[client.name]) {
      setClientRucCi(extraProfiles[client.name].ruc || "");
      setClientAddress(extraProfiles[client.name].address || "");
    } else {
      setClientRucCi("");
      setClientAddress("");
    }
    
    setClientSearchQuery(client.name);
    setShowClientDropdown(false);
  };

  // Save client RUC & Address changes to cache
  const saveClientExtraToCache = (name: string, ruc: string, address: string) => {
    if (!name) return;
    const extraProfiles = JSON.parse(localStorage.getItem("nv_client_profiles") || "{}");
    extraProfiles[name] = { ruc, address };
    localStorage.setItem("nv_client_profiles", JSON.stringify(extraProfiles));
  };

  // --- CALCULATION LOGIC ---
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const discountAmount = discountType === "percentage" ? (subtotal * discountValue / 100) : discountValue;
  const taxableAmount = Math.max(subtotal - discountAmount, 0);
  const ivaAmount = taxableAmount * (ivaRate / 100);
  const grandTotal = taxableAmount + ivaAmount;

  // --- ITEM METHODS ---
  const addItem = () => {
    setItems([...items, { qty: 1, desc: "", price: 0 }]);
  };

  const updateItem = (index: number, field: "qty" | "desc" | "price", value: any) => {
    const updated = [...items];
    if (field === "qty") updated[index].qty = Math.max(Number(value), 1);
    else if (field === "price") updated[index].price = Math.max(Number(value), 0);
    else updated[index].desc = value;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // --- OBSERVATION TEMPLATES ---
  const appendTemplate = (text: string) => {
    setObservations(prev => prev ? `${prev}\n- ${text}` : `- ${text}`);
  };

  // --- SEQUENCE INCREMENT ---
  const incrementSequentialNumber = () => {
    // Expected format: 001-001-000000123
    const parts = secNum.split("-");
    if (parts.length === 3) {
      const numVal = parseInt(parts[2], 10);
      if (!isNaN(numVal)) {
        const incrementedNum = String(numVal + 1).padStart(9, "0");
        const nextSec = `${parts[0]}-${parts[1]}-${incrementedNum}`;
        setSecNum(nextSec);
        localStorage.setItem("nv_doc_sec", nextSec);
      }
    }
  };

  // --- PDF GENERATION WITH jspdf ---
  const handleDownloadPDF = () => {
    // Save client extra info to cache
    saveClientExtraToCache(clientName, clientRucCi, clientAddress);

    // Initialize document (A4, units in mm)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const primaryColor = [30, 58, 138]; // Navy
    const textDark = [31, 41, 55]; // Gray-800
    const textLight = [107, 114, 128]; // Gray-500
    const borderGray = [229, 231, 235]; // Gray-200

    // Top design strip
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, 15, 180, 2, "F");

    // --- 1. COMPANY LOGO & DETAILS ---
    const logoBase64 = selectedLogo === "largo" ? logosBase64.largo : logosBase64.compacto;

    if (logoBase64) {
      try {
        if (selectedLogo === "largo") {
          doc.addImage(logoBase64, "PNG", 15, 20, 85, 20);
        } else {
          doc.addImage(logoBase64, "PNG", 15, 20, 24, 24);
        }
      } catch (err) {
        console.error("Error agregando logo al PDF:", err);
      }
    } else {
      // Draw elegant placeholder
      doc.setFillColor(243, 244, 246);
      doc.rect(15, 20, 35, 12, "F");
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175);
      doc.text("PROFARNOVA", 18, 28);
    }

    // Company textual details
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text(companyName, 15, 48);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    doc.text(`RUC: ${companyRuc}`, 15, 52);
    doc.text(`Dir: ${companyAddress}`, 15, 56);
    doc.text(`Telf: ${companyPhone} | Email: ${companyEmail}`, 15, 60);

    // --- 2. DOCUMENT ID BOX ---
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.4);
    doc.setFillColor(249, 250, 251);
    doc.rect(115, 21, 80, 28, "FD");

    // Title inside box
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("NOTA DE VENTA", 155, 28, { align: "center" });

    // Sequential number inside box
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(220, 38, 38); // Red-600
    doc.text(`Nº: ${secNum}`, 155, 35, { align: "center" });

    // Date & City
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`Fecha: ${docDate}`, 120, 42);
    doc.text(`Ciudad: ${docCity}`, 120, 46);

    // Divider Line
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.3);
    doc.line(15, 66, 195, 66);

    // --- 3. CLIENT DETAILS SECTION ---
    doc.setFillColor(239, 246, 255); // Light brand blue banner
    doc.rect(15, 70, 180, 6, "F");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("DATOS DEL CLIENTE", 18, 74.2);

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    // Client Grid Left Column
    doc.setFont("Helvetica", "bold");
    doc.text("Razón Social:", 15, 81);
    doc.setFont("Helvetica", "normal");
    doc.text(clientName || "Consumidor Final", 38, 81);

    doc.setFont("Helvetica", "bold");
    doc.text("RUC / C.I.:", 15, 86);
    doc.setFont("Helvetica", "normal");
    doc.text(clientRucCi || "9999999999999", 38, 86);

    doc.setFont("Helvetica", "bold");
    doc.text("Dirección:", 15, 91);
    doc.setFont("Helvetica", "normal");
    doc.text(clientAddress || "N/A", 38, 91);

    // Client Grid Right Column
    doc.setFont("Helvetica", "bold");
    doc.text("Teléfono:", 120, 81);
    doc.setFont("Helvetica", "normal");
    doc.text(clientPhone || "N/A", 138, 81);

    doc.setFont("Helvetica", "bold");
    doc.text("Correo:", 120, 86);
    doc.setFont("Helvetica", "normal");
    doc.text(clientEmail || "N/A", 138, 86);

    // --- 4. DETAILS OF PRODUCTS/SERVICES TABLE ---
    let tableY = 98;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, tableY, 180, 8, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("Cant.", 18, tableY + 5.2);
    doc.text("Descripción de Productos o Servicios", 35, tableY + 5.2);
    doc.text("P. Unitario", 150, tableY + 5.2, { align: "right" });
    doc.text("Total", 190, tableY + 5.2, { align: "right" });

    let rowY = tableY + 8;
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);

    items.forEach((item, idx) => {
      // Row Background (Zebra striping)
      if (idx % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(15, rowY, 180, 7.5, "F");
      }

      doc.text(item.qty.toString(), 22, rowY + 5, { align: "center" });
      
      // Auto-wrap descriptions if too long
      const wrappedDesc = doc.splitTextToSize(item.desc || "Sin descripción", 105);
      doc.text(wrappedDesc, 35, rowY + 5);

      // Adjust height if text wraps
      const itemHeight = Math.max(wrappedDesc.length * 4.2, 7.5);
      
      doc.text(`$${Number(item.price).toFixed(2)}`, 150, rowY + 5, { align: "right" });
      doc.text(`$${(item.qty * item.price).toFixed(2)}`, 190, rowY + 5, { align: "right" });

      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.setLineWidth(0.2);
      doc.line(15, rowY + itemHeight, 195, rowY + itemHeight);

      rowY += itemHeight;
    });

    // --- 5. FINANCIALS & PAYMENT METHOD ---
    let totalsY = rowY + 6;

    // Left side: Payment Method & Observations
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Forma de Pago:", 15, totalsY);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);

    const payMethods = [
      { id: "efectivo", label: "Efectivo" },
      { id: "transferencia", label: "Transferencia bancaria" },
      { id: "tarjeta", label: "Tarjeta de crédito/débito" },
      { id: "otros", label: "Otros" }
    ];

    let payY = totalsY + 5;
    payMethods.forEach(method => {
      // Draw square checkbox
      doc.setDrawColor(156, 163, 175);
      doc.rect(15, payY - 3, 3.2, 3.2);
      if (paymentMethod === method.id) {
        doc.setFont("Helvetica", "bold");
        doc.text("X", 15.8, payY - 0.3);
        doc.setFont("Helvetica", "normal");
      }
      doc.text(method.label, 20, payY);
      payY += 5;
    });

    // Right side: Totales Calculation
    let rightY = totalsY;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);

    // Subtotal
    doc.text("Subtotal:", 145, rightY, { align: "right" });
    doc.text(`$${subtotal.toFixed(2)}`, 190, rightY, { align: "right" });

    // Discount
    rightY += 5;
    doc.text(`Descuento (${discountType === "percentage" ? `${discountValue}%` : "$"}):`, 145, rightY, { align: "right" });
    doc.text(`-$${discountAmount.toFixed(2)}`, 190, rightY, { align: "right" });

    // IVA
    rightY += 5;
    doc.text(`IVA (${ivaRate}%):`, 145, rightY, { align: "right" });
    doc.text(`$${ivaAmount.toFixed(2)}`, 190, rightY, { align: "right" });

    // Grand Total box
    rightY += 6;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(125, rightY - 4, 70, 7.5, "F");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text("TOTAL A PAGAR:", 128, rightY + 1.2);
    doc.text(`$${grandTotal.toFixed(2)}`, 191, rightY + 1.2, { align: "right" });

    // Restore settings
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);

    // --- 6. OBSERVATIONS ---
    let obsY = Math.max(payY + 2, rightY + 10);
    if (observations.trim()) {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Observaciones:", 15, obsY);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      
      const splitObservations = doc.splitTextToSize(observations, 180);
      doc.text(splitObservations, 15, obsY + 4);
      obsY += 4 + (splitObservations.length * 3.8);
    }

    // --- 7. SIGNATURES ---
    const sigY = 250;
    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(0.25);

    if (showSellerSignature) {
      doc.line(25, sigY, 85, sigY);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text("FIRMA O SELLO VENDEDOR", 55, sigY + 4.5, { align: "center" });
    }

    if (showClientSignature) {
      doc.line(125, sigY, 185, sigY);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text("FIRMA CLIENTE", 155, sigY + 4.5, { align: "center" });
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(textLight[0], textLight[1], textLight[2]);
      doc.text("(Respaldo del Cliente)", 155, sigY + 8, { align: "center" });
    }

    // --- 8. FOOTER ---
    const footerY = 278;
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text("Esta nota de venta sirve como comprobante de entrega y recibo de fondos.", 105, footerY, { align: "center" });
    doc.text("¡Gracias por confiar en nosotros!", 105, footerY + 3.5, { align: "center" });

    // Download PDF file
    doc.save(`NotaVenta_${secNum}.pdf`);

    // Increment document number automatically for the next generation
    incrementSequentialNumber();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-500 rounded-lg text-white">
              <Receipt className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nota de Venta</h1>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Genera e imprime notas de venta profesionales con autocompletado del CRM y descarga directa de PDF.
          </p>
        </div>
        <Button 
          onClick={handleDownloadPDF} 
          className="bg-brand-600 hover:bg-brand-700 h-11 text-white shadow-md shadow-brand-500/20 w-full sm:w-auto font-semibold flex items-center justify-center gap-2 group transition-all duration-300"
        >
          <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
          Descargar Nota de Venta (PDF)
        </Button>
      </div>

      {/* DASHBOARD COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: EDIT FORM (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* COMPANY SETTINGS CARD */}
          <Card className="border-gray-200 shadow-sm overflow-hidden transition-all duration-300">
            <div 
              onClick={() => setShowCompanySettings(!showCompanySettings)} 
              className="bg-gray-50 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-100/70 transition-colors border-b border-gray-100"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-600" />
                <span className="font-bold text-gray-800 text-sm uppercase tracking-wider">Datos de la Empresa o Negocio</span>
              </div>
              <Button size="sm" variant="ghost" className="text-brand-600 h-7 text-xs font-semibold px-2">
                {showCompanySettings ? "Ocultar" : "Editar Datos"}
              </Button>
            </div>
            
            {showCompanySettings && (
              <CardContent className="p-6 space-y-4 bg-white animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Nombre Comercial / Razón Social" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                  />
                  <Input 
                    label="RUC" 
                    value={companyRuc} 
                    onChange={(e) => setCompanyRuc(e.target.value)} 
                  />
                </div>
                <Input 
                  label="Dirección" 
                  value={companyAddress} 
                  onChange={(e) => setCompanyAddress(e.target.value)} 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Teléfono" 
                    value={companyPhone} 
                    onChange={(e) => setCompanyPhone(e.target.value)} 
                  />
                  <Input 
                    label="Correo Electrónico" 
                    value={companyEmail} 
                    onChange={(e) => setCompanyEmail(e.target.value)} 
                  />
                </div>
                
                {/* Logo selector */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Logo Corporativo</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedLogo("largo")}
                      className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${selectedLogo === "largo" ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20" : "border-gray-200 hover:bg-gray-50"}`}
                    >
                      <div>
                        <p className="font-bold text-xs text-gray-900">Logo Largo (Horizontal)</p>
                        <p className="text-[10px] text-gray-500">Ideal para membretes</p>
                      </div>
                      <div className="w-16 h-8 bg-gray-100 flex items-center justify-center rounded border overflow-hidden p-1">
                        <img src="/Logo_largo.png" alt="Logo largo" className="max-w-full max-h-full object-contain" />
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedLogo("compacto")}
                      className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${selectedLogo === "compacto" ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20" : "border-gray-200 hover:bg-gray-50"}`}
                    >
                      <div>
                        <p className="font-bold text-xs text-gray-900">Logo Circular (JD Clean)</p>
                        <p className="text-[10px] text-gray-500">Compacto y moderno</p>
                      </div>
                      <div className="w-10 h-8 bg-gray-100 flex items-center justify-center rounded border overflow-hidden p-0.5">
                        <img src="/logo-jd-clean.png" alt="Logo limpio" className="max-w-full max-h-full object-contain" />
                      </div>
                    </button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* DOCUMENT IDENTIFICATION & CLIENT BLOCK */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6 space-y-6">
              
              {/* Document ID */}
              <div>
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-brand-600" />
                  Identificación del Documento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input 
                    label="Nº Secuencial Único" 
                    value={secNum} 
                    onChange={(e) => setSecNum(e.target.value)} 
                  />
                  <Input 
                    label="Fecha de Emisión" 
                    type="date" 
                    value={docDate} 
                    onChange={(e) => setDocDate(e.target.value)} 
                  />
                  <Input 
                    label="Ciudad de Emisión" 
                    value={docCity} 
                    onChange={(e) => setDocCity(e.target.value)} 
                  />
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Client Details */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-600" />
                    Datos del Cliente
                  </h3>
                  
                  {/* Search bar inside Client details */}
                  <div className="relative w-48 sm:w-60">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar cliente CRM..."
                      className="pl-8 h-8 w-full border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      value={clientSearchQuery}
                      onChange={(e) => {
                        setClientSearchQuery(e.target.value);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                    />
                    
                    {showClientDropdown && clientSearchQuery.trim() && (
                      <div className="absolute right-0 left-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg z-30 divide-y divide-gray-50 custom-scrollbar">
                        {crmClients.filter(c => 
                          c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) || 
                          (c.phone && c.phone.includes(clientSearchQuery))
                        ).length === 0 ? (
                          <p className="p-2 text-xs text-gray-400 text-center">Sin resultados</p>
                        ) : (
                          crmClients.filter(c => 
                            c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) || 
                            (c.phone && c.phone.includes(clientSearchQuery))
                          ).map(client => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => handleSelectClient(client)}
                              className="w-full text-left p-2.5 text-xs hover:bg-brand-50 transition-colors flex justify-between items-center"
                            >
                              <div>
                                <p className="font-bold text-gray-900">{client.name}</p>
                                <p className="text-[10px] text-gray-500">{client.email || "Sin email"}</p>
                              </div>
                              <span className="text-[10px] bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full font-semibold">
                                {client.phone || "Sin telf"}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Nombre / Razón Social" 
                    value={clientName} 
                    onChange={(e) => setClientName(e.target.value)} 
                    placeholder="Consumidor Final" 
                  />
                  <Input 
                    label="Cédula / RUC / Pasaporte" 
                    value={clientRucCi} 
                    onChange={(e) => setClientRucCi(e.target.value)} 
                    placeholder="9999999999999" 
                  />
                </div>
                <Input 
                  label="Dirección (Opcional)" 
                  value={clientAddress} 
                  onChange={(e) => setClientAddress(e.target.value)} 
                  placeholder="Ej: Av. Principal y Secundaria" 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Teléfono (Opcional)" 
                    value={clientPhone} 
                    onChange={(e) => setClientPhone(e.target.value)} 
                    placeholder="Ej: +593 999 999 999" 
                  />
                  <Input 
                    label="Correo Electrónico (Opcional)" 
                    type="email" 
                    value={clientEmail} 
                    onChange={(e) => setClientEmail(e.target.value)} 
                    placeholder="Ej: cliente@ejemplo.com" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DETALLES DE PRODUCTOS O SERVICIOS CARD */}
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
              <span className="font-bold text-gray-800 text-sm uppercase tracking-wider">Detalle de Productos o Servicios</span>
              <Button size="sm" onClick={addItem} className="bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs py-1 h-8">
                <Plus className="w-3.5 h-3.5 mr-1" /> Añadir Fila
              </Button>
            </div>
            
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700 text-xs font-bold uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 w-[80px] text-center">Cant.</th>
                    <th className="px-4 py-3">Descripción Clara</th>
                    <th className="px-4 py-3 w-[140px]">Precio Unitario</th>
                    <th className="px-4 py-3 w-[120px] text-right">Total</th>
                    <th className="px-3 py-3 w-[60px] text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min={1}
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-center text-sm focus:ring-1 focus:ring-brand-500 focus:outline-none"
                          value={item.qty}
                          onChange={(e) => updateItem(idx, "qty", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="Descripción del producto..."
                          className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-brand-500 focus:outline-none"
                          value={item.desc}
                          onChange={(e) => updateItem(idx, "desc", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder="0.00"
                            className="w-full border border-gray-200 rounded pl-6 pr-2 py-1.5 text-sm focus:ring-1 focus:ring-brand-500 focus:outline-none"
                            value={item.price || ""}
                            onChange={(e) => updateItem(idx, "price", e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-gray-900 whitespace-nowrap">
                        ${(item.qty * item.price).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          disabled={items.length <= 1}
                          className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400 p-1.5 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* TOTALS & PAYMENT METHODS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Payment Method */}
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-2">Forma de Pago</h3>
                <div className="space-y-2">
                  {[
                    { id: "efectivo", label: "Efectivo" },
                    { id: "transferencia", label: "Transferencia bancaria" },
                    { id: "tarjeta", label: "Tarjeta de crédito/débito" },
                    { id: "otros", label: "Otros" }
                  ].map(method => (
                    <label 
                      key={method.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border text-sm font-medium cursor-pointer transition-all ${paymentMethod === method.id ? "bg-brand-50/50 border-brand-500 text-brand-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      <span>{method.label}</span>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                      />
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Calculations & Discounts */}
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-brand-600" />
                  Cálculo de Totales
                </h3>
                
                {/* Discount editor */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descuento</label>
                  <div className="flex gap-2">
                    <select
                      className="border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-brand-500 bg-white"
                      value={discountType}
                      onChange={(e) => {
                        setDiscountType(e.target.value as "percentage" | "fixed");
                        setDiscountValue(0);
                      }}
                    >
                      <option value="fixed">Fijo ($)</option>
                      <option value="percentage">Porcentaje (%)</option>
                    </select>
                    <div className="relative flex-1">
                      {discountType === "fixed" && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>}
                      <input
                        type="number"
                        min={0}
                        className={`w-full border border-gray-300 rounded-md py-1 px-3 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none h-8 ${discountType === "fixed" ? "pl-6" : ""}`}
                        value={discountValue || ""}
                        placeholder="0.00"
                        onChange={(e) => setDiscountValue(Math.max(Number(e.target.value), 0))}
                      />
                      {discountType === "percentage" && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>}
                    </div>
                  </div>
                </div>

                {/* IVA selector */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">IVA</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 12, 15].map(rate => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setIvaRate(rate)}
                        className={`py-1.5 rounded-md text-xs font-semibold border transition-all ${ivaRate === rate ? "border-brand-600 bg-brand-600 text-white" : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"}`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-gray-100 my-2" />

                {/* Mathematical values breakdown */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Descuento:</span>
                    <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Imponible:</span>
                    <span className="font-medium">${taxableAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA ({ivaRate}%):</span>
                    <span className="font-medium">${ivaAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-dashed border-gray-200 font-bold text-gray-900 text-base">
                    <span>Total a Pagar:</span>
                    <span className="text-brand-700 text-lg">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* OBSERVATIONS & SIGNATURES */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-2">Observaciones y Firmas</h3>
              
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Notas u Observaciones del Comprobante</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500 h-24"
                  placeholder="Ej: Términos de garantía, datos bancarios..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
                
                {/* Template buttons */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => appendTemplate("Garantía del producto: 1 año contra defectos de fábrica.")}
                    className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-200 transition-colors font-medium"
                  >
                    + Garantía
                  </button>
                  <button
                    type="button"
                    onClick={() => appendTemplate("Tiempo de entrega estimado: 24 a 48 horas laborables.")}
                    className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-200 transition-colors font-medium"
                  >
                    + Entrega
                  </button>
                  <button
                    type="button"
                    onClick={() => appendTemplate("Condiciones del servicio: Aprobación previa de requerimientos.")}
                    className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-200 transition-colors font-medium"
                  >
                    + Condiciones
                  </button>
                  <button
                    type="button"
                    onClick={() => appendTemplate("Datos bancarios: Banco Pichincha Cta. Corriente #2100456187 a nombre de PROFARNOVA.")}
                    className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-200 transition-colors font-medium"
                  >
                    + Datos Bancos
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Sección de Firmas en el PDF</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSellerSignature}
                      onChange={(e) => setShowSellerSignature(e.target.checked)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>Firma del Vendedor (Sello)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showClientSignature}
                      onChange={(e) => setShowClientSignature(e.target.checked)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>Firma del Cliente</span>
                  </label>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: LIVE SHEET PREVIEW (5 Columns) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="font-bold text-gray-600 text-xs uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              Vista Previa en Vivo (Formato PDF)
            </span>
            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-semibold">
              A4 letter standard
            </span>
          </div>

          {/* Letter sheet simulation */}
          <div className="bg-white border border-gray-300 shadow-2xl rounded-xl p-6 min-h-[640px] flex flex-col justify-between text-[11px] font-sans relative overflow-hidden transition-all duration-300">
            {/* Top Navy Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-900"></div>

            <div>
              {/* Header Grid */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  {selectedLogo === "largo" ? (
                    <img src="/Logo_largo.png" alt="Company Logo" className="h-12 w-auto object-contain mb-3 max-w-[220px]" />
                  ) : (
                    <img src="/logo-jd-clean.png" alt="Company Logo" className="h-14 w-auto object-contain mb-2 max-w-[120px]" />
                  )}
                  <h4 className="font-bold text-gray-900 text-xs">{companyName}</h4>
                  <p className="text-gray-500 leading-tight text-[9px] mt-0.5">RUC: {companyRuc}</p>
                  <p className="text-gray-500 leading-tight text-[9px]">Dir: {companyAddress}</p>
                  <p className="text-gray-500 leading-tight text-[9px]">Telf: {companyPhone}</p>
                </div>
                
                <div className="text-right border border-brand-900 rounded p-2.5 bg-gray-50/50 w-[150px]">
                  <h3 className="font-black text-brand-900 text-xs tracking-wider">NOTA DE VENTA</h3>
                  <p className="text-red-500 font-bold text-[10px] mt-0.5 font-mono">{secNum}</p>
                  <div className="text-left mt-2 pt-1.5 border-t border-gray-100 text-[8px] text-gray-600 leading-normal">
                    <p><strong>Fecha:</strong> {docDate}</p>
                    <p><strong>Ciudad:</strong> {docCity}</p>
                  </div>
                </div>
              </div>

              {/* Client banner */}
              <div className="bg-brand-50 text-brand-900 px-2.5 py-1 rounded font-bold text-[9px] tracking-wide mb-3 flex items-center gap-1 border border-brand-100/50">
                DATOS DEL CLIENTE
              </div>

              {/* Client details info */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-5 text-[9.5px] text-gray-700">
                <div>
                  <p><strong className="text-gray-900">Cliente:</strong> {clientName || "Consumidor Final"}</p>
                  <p><strong className="text-gray-900">RUC/C.I.:</strong> {clientRucCi || "9999999999999"}</p>
                  <p className="truncate"><strong className="text-gray-900">Dirección:</strong> {clientAddress || "N/A"}</p>
                </div>
                <div>
                  <p><strong className="text-gray-900">Teléfono:</strong> {clientPhone || "N/A"}</p>
                  <p><strong className="text-gray-900">Correo:</strong> {clientEmail || "N/A"}</p>
                </div>
              </div>

              {/* Table items */}
              <table className="w-full text-left mb-6">
                <thead>
                  <tr className="bg-brand-900 text-white font-bold text-[8.5px] uppercase">
                    <th className="p-1.5 rounded-l text-center w-10">Cant.</th>
                    <th className="p-1.5">Descripción</th>
                    <th className="p-1.5 text-right w-16">P. Unit.</th>
                    <th className="p-1.5 text-right w-16 rounded-r">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[9px]">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="p-1.5 text-center text-gray-500">{item.qty}</td>
                      <td className="p-1.5 font-medium text-gray-800 break-words">{item.desc || "Sin descripción"}</td>
                      <td className="p-1.5 text-right text-gray-600">${Number(item.price).toFixed(2)}</td>
                      <td className="p-1.5 text-right font-bold text-gray-900">${(item.qty * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations, observations & signatures footer */}
            <div className="space-y-6">
              <div className="flex justify-between items-start gap-4">
                {/* Observations & payment */}
                <div className="flex-1 text-[8.5px] text-gray-500">
                  <p className="font-bold text-brand-900 uppercase text-[8px] tracking-wide mb-1">Forma de pago</p>
                  <div className="grid grid-cols-2 gap-1 mb-3 text-gray-700 font-medium">
                    <span className={paymentMethod === "efectivo" ? "text-brand-600 font-bold" : ""}>
                      [ {paymentMethod === "efectivo" ? "X" : " "} ] Efectivo
                    </span>
                    <span className={paymentMethod === "transferencia" ? "text-brand-600 font-bold" : ""}>
                      [ {paymentMethod === "transferencia" ? "X" : " "} ] Transferencia
                    </span>
                    <span className={paymentMethod === "tarjeta" ? "text-brand-600 font-bold" : ""}>
                      [ {paymentMethod === "tarjeta" ? "X" : " "} ] Tarjeta
                    </span>
                    <span className={paymentMethod === "otros" ? "text-brand-600 font-bold" : ""}>
                      [ {paymentMethod === "otros" ? "X" : " "} ] Otros
                    </span>
                  </div>

                  {observations.trim() && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="font-bold text-brand-900 uppercase text-[8px] tracking-wide mb-1">Observaciones</p>
                      <p className="text-gray-600 leading-snug whitespace-pre-line text-[7.5px] italic">
                        {observations}
                      </p>
                    </div>
                  )}
                </div>

                {/* Mathematical values breakdown */}
                <div className="w-[140px] text-[9px] text-gray-600 space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-bold text-gray-800">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Descuento:</span>
                    <span className="font-bold text-gray-800">-${discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA ({ivaRate}%):</span>
                    <span className="font-bold text-gray-800">${ivaAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-t border-brand-900 font-bold text-brand-900 text-xs">
                    <span>Total:</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures simulation */}
              <div className="flex justify-around items-center pt-8 text-[7.5px] text-gray-500">
                {showSellerSignature && (
                  <div className="text-center w-[120px]">
                    <div className="border-t border-gray-300 pt-1.5 uppercase font-bold text-gray-700">
                      Firma / Sello Vendedor
                    </div>
                  </div>
                )}
                {showClientSignature && (
                  <div className="text-center w-[120px]">
                    <div className="border-t border-gray-300 pt-1.5 uppercase font-bold text-gray-700">
                      Firma Cliente
                    </div>
                  </div>
                )}
              </div>

              {/* Legal disclaimer */}
              <div className="text-center text-[7px] text-gray-400 italic pt-2 border-t border-gray-100">
                Respaldo de transacción comercial. Desarrollado con CRM SaaS.
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
