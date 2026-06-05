-- ============================================================
-- MIGRACIÓN: Módulo de Clientes Activos
-- Ejecutar en Hostinger -> Bases de Datos -> phpMyAdmin
-- ============================================================

-- 1. Tabla principal de clientes activos
--    (Se vincula al lead original que fue promovido)
CREATE TABLE IF NOT EXISTS active_clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,                          -- Referencia al lead original
    name VARCHAR(255) NOT NULL,
    rubro VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    social_instagram VARCHAR(255),
    social_facebook VARCHAR(255),
    social_website VARCHAR(255),
    address TEXT,                                  -- Dirección física
    logo_url VARCHAR(500),                         -- Avatar/logo del negocio
    contract_total DECIMAL(10,2) DEFAULT 0.00,     -- Monto total pactado del contrato
    project_status ENUM('ACTIVO','EN_PAUSA','COMPLETADO','CANCELADO') DEFAULT 'ACTIVO',
    project_notes TEXT,                            -- Notas generales del proyecto
    started_at DATE,                               -- Fecha de inicio del proyecto
    promoted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de pagos / facturación
CREATE TABLE IF NOT EXISTS client_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    active_client_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method ENUM('TRANSFERENCIA','EFECTIVO','TARJETA','CHEQUE','OTRO') DEFAULT 'TRANSFERENCIA',
    status ENUM('PAGADO','PENDIENTE','VENCIDO') DEFAULT 'PENDIENTE',
    description VARCHAR(500),
    payment_date DATE,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (active_client_id) REFERENCES active_clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de cambios/historial del proyecto (bitácora)
CREATE TABLE IF NOT EXISTS project_changes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    active_client_id INT NOT NULL,
    change_type ENUM('DISEÑO','FUNCIONALIDAD','CONTENIDO','SEO','CORRECCIÓN','OTRO') DEFAULT 'OTRO',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('COMPLETADO','EN_PROGRESO','PENDIENTE') DEFAULT 'COMPLETADO',
    screenshot_url VARCHAR(500),
    change_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (active_client_id) REFERENCES active_clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla de credenciales (bóveda de accesos)
CREATE TABLE IF NOT EXISTS client_credentials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    active_client_id INT NOT NULL,
    platform VARCHAR(255) NOT NULL,               -- ej: WordPress, cPanel, Google Ads
    platform_url VARCHAR(500),
    username VARCHAR(255),
    password_enc VARCHAR(500),                     -- Almacenar con cuidado
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (active_client_id) REFERENCES active_clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla de tareas del proyecto
CREATE TABLE IF NOT EXISTS project_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    active_client_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('ALTA','MEDIA','BAJA') DEFAULT 'MEDIA',
    status ENUM('PENDIENTE','EN_PROGRESO','COMPLETADO') DEFAULT 'PENDIENTE',
    due_date DATE,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (active_client_id) REFERENCES active_clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
