import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Clientes } from './pages/Clientes'
import { Agenda } from './pages/Agenda'
import { NotaVenta } from './pages/NotaVenta'
import { ClientesActivos } from './pages/ClientesActivos'
import { PerfilClienteActivo } from './pages/PerfilClienteActivo'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes filterMode="main" />} />
        <Route path="/clientes-activos" element={<ClientesActivos />} />
        <Route path="/clientes-activos/:id" element={<PerfilClienteActivo />} />
        <Route path="/contactados" element={<Clientes filterMode="archived" />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/nota-venta" element={<NotaVenta />} />
      </Route>
    </Routes>
  )
}

export default App

