import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Briefcase } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Card, CardContent } from "../components/ui/Card"

export function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("admin@crm.com");
    const [password, setPassword] = useState("admin123");
    const [error, setError] = useState("");

    // Si ya tiene sesión, mandarlo de vuelta al panel
    useEffect(() => {
        if (localStorage.getItem('crm_token')) {
            navigate('/');
        }
    }, [navigate]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        fetch('/api/auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    localStorage.setItem('crm_token', data.token);
                    localStorage.setItem('crm_user', data.user.name);
                    navigate('/');
                } else {
                    setError(data.error);
                }
            })
            .catch(err => setError("No se pudo contactar al servidor: " + err.message))
            .finally(() => setLoading(false));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
                <div className="w-12 h-12 bg-white flex items-center justify-center rounded-xl shadow-sm border border-gray-100 mb-4">
                    <Briefcase className="w-8 h-8 text-brand-600" />
                </div>
                <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
                    Panel de Administración
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Usa admin@crm.com y admin123
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="px-4 py-8 sm:px-10 border-0 shadow-lg sm:rounded-2xl">
                    <CardContent className="p-0">
                        <form className="space-y-6" onSubmit={handleLogin}>
                            <Input
                                label="Correo electrónico"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            <Input
                                label="Contraseña"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm text-center font-medium">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full h-11 bg-brand-600 hover:bg-brand-700 font-bold" disabled={loading}>
                                {loading ? "Verificando Servidor..." : "Iniciar sesión segura"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
