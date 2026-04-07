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
    -- Campos Tipo Hoja de Cálculo
    is_contacted ENUM('SÍ', 'NO') DEFAULT 'NO',
    did_answer BOOLEAN DEFAULT FALSE,
    wp_sent BOOLEAN DEFAULT FALSE,
    call_date DATE NULL,
    interest_level VARCHAR(255) NULL,
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