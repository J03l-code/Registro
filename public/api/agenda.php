<?php
require_once 'config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            // Soporte para badge: contar pendientes de hoy
            if (isset($_GET['count_today'])) {
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) as count FROM activities
                    WHERE completed = FALSE AND DATE(scheduled_for) = CURDATE()
                ");
                $stmt->execute();
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'count' => (int)$row['count']]);
                break;
            }

            $stmt = $pdo->query("
                SELECT 
                    a.*,
                    l.name as lead_name,
                    ac.name as client_name
                FROM activities a
                LEFT JOIN leads l ON a.lead_id = l.id
                LEFT JOIN active_clients ac ON a.active_client_id = ac.id
                WHERE a.completed = FALSE
                ORDER BY a.scheduled_for ASC
            ");
            $agenda = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $agenda]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Fallo cargando agenda: ' . $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['summary'])) {
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO activities (type, summary, scheduled_for, lead_id, active_client_id, priority, notes)
                    VALUES (:type, :summary, :scheduled, :lead, :client, :priority, :notes)
                ");
                $stmt->execute([
                    ':type'     => $data['type']     ?? 'LLAMADA',
                    ':summary'  => $data['summary'],
                    ':scheduled'=> $data['date']     ?? date('Y-m-d H:i:s', strtotime('+1 day')),
                    ':lead'     => !empty($data['lead_id']) ? $data['lead_id'] : null,
                    ':client'   => !empty($data['active_client_id']) ? $data['active_client_id'] : null,
                    ':priority' => $data['priority'] ?? 'MEDIA',
                    ':notes'    => $data['notes']    ?? null,
                ]);
                echo json_encode(['success' => true]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Error al insertar: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'El resumen es requerido.']);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['id'])) {
            try {
                if (isset($data['action']) && $data['action'] === 'complete') {
                    $stmt = $pdo->prepare("UPDATE activities SET completed = TRUE WHERE id = :id");
                    $stmt->execute([':id' => $data['id']]);
                } elseif (isset($data['action']) && $data['action'] === 'reschedule' && isset($data['newDate'])) {
                    $stmt = $pdo->prepare("UPDATE activities SET scheduled_for = :newDate WHERE id = :id");
                    $stmt->execute([':id' => $data['id'], ':newDate' => $data['newDate']]);
                }
                echo json_encode(['success' => true]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Error editando tarea: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'ID es requerido.']);
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['id'])) {
            try {
                $stmt = $pdo->prepare("DELETE FROM activities WHERE id = :id");
                $stmt->execute([':id' => $data['id']]);
                echo json_encode(['success' => true]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Error borrando: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'ID requerido.']);
        }
        break;
}
?>