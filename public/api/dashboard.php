<?php
require_once 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

try {
    // 1. Total de leads/prospectos
    $total = $pdo->query("SELECT COUNT(*) as c FROM leads")->fetch(PDO::FETCH_ASSOC)['c'];

    // 2. Leads Calientes
    $calientes = $pdo->query("SELECT COUNT(*) as c FROM leads WHERE status='CALIENTE'")->fetch(PDO::FETCH_ASSOC)['c'];

    // 3. Tareas de Leads prioritarias hoy
    $hoy = $pdo->query("SELECT COUNT(*) as c FROM activities WHERE DATE(scheduled_for) <= CURDATE() AND completed = FALSE")->fetch(PDO::FETCH_ASSOC)['c'];

    // 4. Últimas llamadas / actividad
    $actividades = $pdo->query("
        SELECT a.event_desc as summary, a.created_at, l.name as lead_name 
        FROM lead_history a 
        LEFT JOIN leads l ON a.lead_id = l.id 
        ORDER BY a.created_at DESC LIMIT 6
    ")->fetchAll(PDO::FETCH_ASSOC);

    // 5. Pipeline financiero de Leads
    $pipeline = $pdo->query("SELECT SUM(estimated_value) as val FROM leads WHERE status != 'CALIENTE'")->fetch(PDO::FETCH_ASSOC)['val'] ?? 0;

    // 6. Ingresos cerrados de Leads
    $ingresos = $pdo->query("SELECT SUM(estimated_value) as val FROM leads WHERE status = 'CALIENTE'")->fetch(PDO::FETCH_ASSOC)['val'] ?? 0;

    // --- NUEVAS METRICAS DE CLIENTES ACTIVOS (Opción 6) ---
    // A. Cantidad de clientes activos
    $active_clients_count = $pdo->query("SELECT COUNT(*) as c FROM active_clients WHERE project_status != 'COMPLETADO'")->fetch(PDO::FETCH_ASSOC)['c'] ?? 0;

    // B. Ingresos recaudados por clientes activos (Pagados)
    $active_payments_received = $pdo->query("SELECT SUM(amount) as val FROM client_payments WHERE status = 'PAGADO'")->fetch(PDO::FETCH_ASSOC)['val'] ?? 0;

    // C. Pagos pendientes (Pendiente + Vencido)
    $active_payments_pending = $pdo->query("SELECT SUM(amount) as val FROM client_payments WHERE status IN ('PENDIENTE', 'VENCIDO')")->fetch(PDO::FETCH_ASSOC)['val'] ?? 0;

    // D. Porcentaje de progreso de tareas general de clientes activos
    $tasks_total = $pdo->query("SELECT COUNT(*) as c FROM project_tasks")->fetch(PDO::FETCH_ASSOC)['c'] ?? 0;
    $tasks_completed = $pdo->query("SELECT COUNT(*) as c FROM project_tasks WHERE status = 'COMPLETADO'")->fetch(PDO::FETCH_ASSOC)['c'] ?? 0;
    $tasks_completion_pct = $tasks_total > 0 ? round(($tasks_completed / $tasks_total) * 100) : 0;

    // E. Historial mensual de cobros (Año en curso)
    $monthly_history = $pdo->query("
        SELECT MONTH(payment_date) as month_num, SUM(amount) as val 
        FROM client_payments 
        WHERE status = 'PAGADO' AND YEAR(payment_date) = YEAR(CURDATE()) 
        GROUP BY MONTH(payment_date)
        ORDER BY MONTH(payment_date) ASC
    ")->fetchAll(PDO::FETCH_ASSOC);

    // Formatear a arreglo plano indexado por meses del 1 al 12
    $months_names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    $chart_data = [];
    for ($i = 1; $i <= 12; $i++) {
        $val = 0;
        foreach ($monthly_history as $row) {
            if (intval($row['month_num']) === $i) {
                $val = floatval($row['val']);
                break;
            }
        }
        $chart_data[] = [
            "month" => $months_names[$i - 1],
            "total" => $val
        ];
    }

    // F. Alertas de renovaciones próximas a 30 días (Opción 1)
    $upcoming_renewals = $pdo->query("
        SELECT s.*, c.name as client_name 
        FROM client_subscriptions s
        JOIN active_clients c ON s.active_client_id = c.id
        WHERE s.status = 'ACTIVO' 
          AND s.next_due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        ORDER BY s.next_due_date ASC
    ")->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "metrics" => [
            "total" => $total,
            "calientes" => $calientes,
            "tareas_hoy" => $hoy,
            "conversion" => ($total > 0) ? round(($calientes / $total) * 100) . '%' : '0%',
            "pipeline" => floatval($pipeline),
            "revenue" => floatval($ingresos),
            
            // Addons
            "active_clients_count" => intval($active_clients_count),
            "active_payments_received" => floatval($active_payments_received),
            "active_payments_pending" => floatval($active_payments_pending),
            "tasks_completion_pct" => $tasks_completion_pct
        ],
        "recent" => $actividades,
        "financial_history" => $chart_data,
        "upcoming_renewals" => $upcoming_renewals
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error de BDD analítica: " . $e->getMessage()]);
}
?>