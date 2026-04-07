import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Briefcase } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Card, CardContent } from "../components/ui/Card"

export function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate auth
        setTimeout(() => {
            setLoading(false);
            navigate('/');
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
                <div className="w-12 h-12 bg-white flex items-center justify-center rounded-xl shadow-sm border border-gray-100 mb-4">
                    <Briefcase className="w-8 h-8 text-brand-600" />
                </div>
                <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
                    Bienvenido de vuelta
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Inicia sesión para gestionar tus clientes
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="px-4 py-8 sm:px-10 border-0 shadow-lg sm:rounded-2xl">
                    <CardContent className="p-0">
                        <form className="space-y-6" onSubmit={handleLogin}>
                            <Input
                                label="Correo electrónico"
                                type="email"
                                placeholder="ejemplo@empresa.com"
                                required
                            />

                            <Input
                                label="Contraseña"
                                type="password"
                                placeholder="••••••••"
                                required
                            />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                        Recordarme
                                    </label>
                                </div>
                                <div className="text-sm">
                                    <a href="#" className="font-medium text-brand-600 hover:text-brand-500">
                                        ¿Olvidaste tu contraseña?
                                    </a>
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-11 bg-brand-600 hover:bg-brand-700" disabled={loading}>
                                {loading ? "Verificando..." : "Iniciar sesión"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
