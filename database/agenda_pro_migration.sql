-- ============================================================
-- MIGRACIÓN AGENDA PRO
-- Agrega prioridad, notas y vínculo a cliente activo en activities
-- Ejecutar en phpMyAdmin de Hostinger
-- ============================================================

ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS priority ENUM('ALTA','MEDIA','BAJA') DEFAULT 'MEDIA',
    ADD COLUMN IF NOT EXISTS notes TEXT NULL,
    ADD COLUMN IF NOT EXISTS active_client_id INT NULL,
    ADD CONSTRAINT fk_act_active_client FOREIGN KEY (active_client_id) REFERENCES active_clients(id) ON DELETE SET NULL;
