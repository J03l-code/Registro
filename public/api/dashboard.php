<?php
require_once 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

try {
    // 1. Total de clientes
    $total = $pdo->query("SELECT COUNT(*) as c FROM leads")->fetch(PDO::FETCH_ASSOC)['c'];

    // 2. Clientes Calientes
    $calientes = $pdo->query("SELECT COUNT(*) as c FROM leads WHERE status='CALIENTE'")->fetch(PDO::FETCH_ASSOC)['c'];

    // 3. Tareas Prioritarias hoy
    $hoy = $pdo->query("SELECT COUNT(*) as c FROM activities WHERE DATE(scheduled_for) <= CURDATE() AND completed = FALSE")->fetch(PDO::FETCH_ASSOC)['c'];

    // 4. Últimas llamadas / actividad (Sacadas desde History para más precisión)
    $actividades = $pdo->query("
        SELECT a.event_desc as summary, a.created_at, l.name as lead_name 
        FROM lead_history a 
        LEFT JOIN leads l ON a.lead_id = l.id 
        ORDER BY a.created_at DESC LIMIT 6
    ")->fetchAll(PDO::FETCH_ASSOC);

    // 5. NUEVO: PIPELINE ECONÓMICO FINANCIERO ($)
    $pipeline = $pdo->query("SELECT SUM(estimated_value) as val FROM leads WHERE status != 'CALIENTE'")->fetch(PDO::FETCH_ASSOC)['val'] ?? 0;

    // 6. INGRESOS CERRADOS FINANCIEROS ($)
    $ingresos = $pdo->query("SELECT SUM(estimated_value) as val FROM leads WHERE status = 'CALIENTE'")->fetch(PDO::FETCH_ASSOC)['val'] ?? 0;


    echo json_encode([
        "success" => true,
        "metrics" => [
            "total" => $total,
            "calientes" => $calientes,
            "tareas_hoy" => $hoy,
            "conversion" => ($total > 0) ? round(($calientes / $total) * 100) . '%' : '0%',
            "pipeline" => floatval($pipeline),
            "revenue" => floatval($ingresos)
        ],
        "recent" => $actividades
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error de BDD analítica: " . $e->getMessage()]);
}
?>