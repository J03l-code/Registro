-- schema_mysql.sql
-- Base de datos MySQL compatible nativamente con hPanel de Hostinger
CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rubro VARCHAR(100) NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    status ENUM('FRÍO', 'TIBIO', 'CALIENTE') DEFAULT 'FRÍO',
    source VARCHAR(255),
    is_contacted ENUM('SÍ', 'NO') DEFAULT 'NO',
    did_answer BOOLEAN DEFAULT FALSE,
    wp_sent BOOLEAN DEFAULT FALSE,
    call_date DATE NULL,
    interest_level VARCHAR(255) NULL,
    -- FASE 6: Campos Financieros y Trazabilidad de Redes Sociales
    estimated_value DECIMAL(10, 2) DEFAULT 0.00,
    social_instagram VARCHAR(255) NULL,
    social_facebook VARCHAR(255) NULL,
    social_website VARCHAR(255) NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT,
    type ENUM('LLAMADA', 'EMAIL', 'ACUERDO', 'REUNIÓN') NOT NULL,
    summary TEXT,
    scheduled_for DATETIME NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);
-- FASE 6: Trazabilidad del Historial (Timeline Absoluto)
CREATE TABLE IF NOT EXISTS lead_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    event_desc TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);
-- NOTA PARA EL USUARIO: Si tu tabla 'leads' YA existía, debes correr estos comandos de seguridad 
-- en el SQL de phpMyAdmin para actualizar la tabla sin borrar a tus clientes que ya tienes ahí:
/*
 ALTER TABLE leads ADD COLUMN estimated_value DECIMAL(10,2) DEFAULT 0.00;
 ALTER TABLE leads ADD COLUMN social_instagram VARCHAR(255) NULL;
 ALTER TABLE leads ADD COLUMN social_facebook VARCHAR(255) NULL;
 ALTER TABLE leads ADD COLUMN social_website VARCHAR(255) NULL;
 */