<?php
require_once 'config.php';
header('Content-Type: application/json');

$q = trim($_GET['q'] ?? '');

if (strlen($q) < 2) {
    echo json_encode(['success' => true, 'results' => []]);
    exit;
}

$like = "%$q%";
$results = [];

try {
    // 1. Buscar en leads (CRM)
    $stmt = $pdo->prepare("
        SELECT id, name, phone, email, status, rubro, 'lead' as type
        FROM leads
        WHERE name LIKE :q OR phone LIKE :q2 OR email LIKE :q3 OR rubro LIKE :q4
        LIMIT 5
    ");
    $stmt->execute([':q' => $like, ':q2' => $like, ':q3' => $like, ':q4' => $like]);
    $leads = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($leads as $r) {
        $results[] = [
            'id'       => $r['id'],
            'type'     => 'lead',
            'title'    => $r['name'],
            'subtitle' => trim(($r['rubro'] ?? '') . ' • ' . ($r['status'] ?? ''), ' •'),
            'meta'     => $r['phone'] ?? $r['email'] ?? '',
            'url'      => '/clientes?leadId=' . $r['id']
        ];
    }

    // 2. Buscar en clientes activos
    $stmt = $pdo->prepare("
        SELECT id, name, phone, email, rubro, project_status, 'active' as type
        FROM active_clients
        WHERE name LIKE :q OR phone LIKE :q2 OR email LIKE :q3 OR rubro LIKE :q4
        LIMIT 5
    ");
    $stmt->execute([':q' => $like, ':q2' => $like, ':q3' => $like, ':q4' => $like]);
    $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($clients as $r) {
        $results[] = [
            'id'       => $r['id'],
            'type'     => 'active',
            'title'    => $r['name'],
            'subtitle' => trim(($r['rubro'] ?? '') . ' • ' . ($r['project_status'] ?? ''), ' •'),
            'meta'     => $r['phone'] ?? $r['email'] ?? '',
            'url'      => '/clientes-activos/' . $r['id']
        ];
    }

    // 3. Buscar en actividades/agenda
    $stmt = $pdo->prepare("
        SELECT a.id, a.summary, a.type, a.scheduled_for, l.name as lead_name
        FROM activities a
        LEFT JOIN leads l ON a.lead_id = l.id
        WHERE a.summary LIKE :q AND a.completed = FALSE
        LIMIT 4
    ");
    $stmt->execute([':q' => $like]);
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($activities as $r) {
        $results[] = [
            'id'       => $r['id'],
            'type'     => 'agenda',
            'title'    => $r['summary'],
            'subtitle' => $r['type'] . ($r['lead_name'] ? ' — ' . $r['lead_name'] : ''),
            'meta'     => $r['scheduled_for'] ? date('d/m/Y H:i', strtotime($r['scheduled_for'])) : '',
            'url'      => '/agenda'
        ];
    }

    echo json_encode(['success' => true, 'results' => $results]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
