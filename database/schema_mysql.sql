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
CREATE TABLE IF NOT EXISTS lead_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    event_desc TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);
-- FASE 8: Gestor de Archivos (Drive Interno)
CREATE TABLE IF NOT EXISTS lead_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);
/*
 INSTRUCCIONES PARA EL USUARIO:
 Si tu sistema ya estaba rodando, NO necesitas alterar las tablas viejas.
 Sólo copia y PEGA este fragmento en tu MySQL (Hostinger) para crear la nueva zona de archivos:
 
 CREATE TABLE IF NOT EXISTS lead_documents (
 id INT AUTO_INCREMENT PRIMARY KEY,
 lead_id INT NOT NULL,
 filename VARCHAR(255) NOT NULL,
 file_url VARCHAR(255) NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
 );
 */