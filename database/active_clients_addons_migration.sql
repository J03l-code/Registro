-- ============================================================
-- MIGRACIÓN DE COMPLEMENTOS (ADDONS 1 Y 4)
-- Ejecutar en phpMyAdmin para agregar soporte de Renovaciones y Gestor de Archivos
-- ============================================================

-- 1. Tabla para Servicios Recurrentes / Renovaciones (Opcion 1)
CREATE TABLE IF NOT EXISTS client_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    active_client_id INT NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    billing_period ENUM('MENSUAL','TRIMESTRAL','SEMESTRAL','ANUAL') DEFAULT 'ANUAL',
    next_due_date DATE NOT NULL,
    status ENUM('ACTIVO','SUSPENDIDO','CANCELADO') DEFAULT 'ACTIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (active_client_id) REFERENCES active_clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla para el Gestor de Archivos y Entregables (Opcion 4)
CREATE TABLE IF NOT EXISTS active_client_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    active_client_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INT DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (active_client_id) REFERENCES active_clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
