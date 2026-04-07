-- schema.sql
-- Base de datos para CRM Estilo Enterprise SaaS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Tabla de Usuarios (Autenticación)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Enum para el estado de los clientes
CREATE TYPE lead_status AS ENUM ('FRÍO', 'TIBIO', 'CALIENTE');
-- Tabla de Clientes (Gestión CRM)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    status lead_status DEFAULT 'FRÍO',
    source VARCHAR(255),
    -- Ej: 'Web', 'Referido', 'Redes Sociales'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de Actividades y Agenda de Seguimiento
-- (Las actividades a futuro tendrán "scheduled_for" lleno de datos)
CREATE TYPE activity_type AS ENUM ('LLAMADA', 'EMAIL', 'ACUERDO', 'REUNIÓN');
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    type activity_type NOT NULL,
    summary TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    -- Si es null, fue una acción pasada inmediata. Si hay valor, es agenda.
    completed BOOLEAN DEFAULT false,
    -- Para marcar actividades a futuro como terminadas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Funciones típicas para manejar tiempos de actualización
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_leads_updated_at BEFORE
UPDATE ON leads FOR EACH MATCH EXECUTE PROCEDURE update_updated_at_column();