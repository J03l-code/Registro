<?php
// active_clients.php — CRUD principal de Clientes Activos
require_once 'config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Si viene ?id=X devolvemos solo ese cliente con todos sus datos de resumen
        if (isset($_GET['id'])) {
            try {
                $stmt = $pdo->prepare("SELECT * FROM active_clients WHERE id = :id");
                $stmt->execute([':id' => $_GET['id']]);
                $client = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$client) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Cliente no encontrado.']);
                    break;
                }

                // Contar pagos y montos
                $pStmt = $pdo->prepare("
                    SELECT
                        COALESCE(SUM(CASE WHEN status = 'PAGADO' THEN amount ELSE 0 END), 0) as paid,
                        COALESCE(SUM(CASE WHEN status = 'PENDIENTE' THEN amount ELSE 0 END), 0) as pending,
                        COALESCE(SUM(CASE WHEN status = 'VENCIDO' THEN amount ELSE 0 END), 0) as overdue,
                        COUNT(*) as payment_count
                    FROM client_payments WHERE active_client_id = :id
                ");
                $pStmt->execute([':id' => $_GET['id']]);
                $paymentSummary = $pStmt->fetch(PDO::FETCH_ASSOC);

                // Contar tareas
                $tStmt = $pdo->prepare("
                    SELECT
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'COMPLETADO' THEN 1 ELSE 0 END) as completed
                    FROM project_tasks WHERE active_client_id = :id
                ");
                $tStmt->execute([':id' => $_GET['id']]);
                $taskSummary = $tStmt->fetch(PDO::FETCH_ASSOC);

                // Contar cambios
                $cStmt = $pdo->prepare("SELECT COUNT(*) as total FROM project_changes WHERE active_client_id = :id");
                $cStmt->execute([':id' => $_GET['id']]);
                $changeSummary = $cStmt->fetch(PDO::FETCH_ASSOC);

                echo json_encode([
                    'success' => true,
                    'client' => $client,
                    'payment_summary' => $paymentSummary,
                    'task_summary' => $taskSummary,
                    'change_count' => $changeSummary['total']
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => $e->getMessage()]);
            }
            break;
        }

        // Sin ?id: listar todos
        try {
            $stmt = $pdo->query("
                SELECT ac.*,
                    COALESCE((SELECT SUM(amount) FROM client_payments cp WHERE cp.active_client_id = ac.id AND cp.status = 'PAGADO'), 0) as total_paid,
                    COALESCE((SELECT SUM(amount) FROM client_payments cp WHERE cp.active_client_id = ac.id AND cp.status = 'PENDIENTE'), 0) as total_pending,
                    (SELECT COUNT(*) FROM project_tasks pt WHERE pt.active_client_id = ac.id AND pt.status != 'COMPLETADO') as open_tasks,
                    (SELECT COUNT(*) FROM project_changes pc WHERE pc.active_client_id = ac.id) as total_changes
                FROM active_clients ac
                ORDER BY ac.id DESC
            ");
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'El campo name es obligatorio.']);
            break;
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO active_clients
                    (lead_id, name, rubro, phone, email, social_instagram, social_facebook,
                     social_website, address, contract_total, project_status, project_notes, started_at)
                VALUES
                    (:lead_id, :name, :rubro, :phone, :email, :ig, :fb, :web, :address,
                     :contract, :status, :notes, :started)
            ");
            $stmt->execute([
                ':lead_id'   => $data['lead_id'] ?? 0,
                ':name'      => $data['name'],
                ':rubro'     => $data['rubro'] ?? null,
                ':phone'     => $data['phone'] ?? null,
                ':email'     => $data['email'] ?? null,
                ':ig'        => $data['social_instagram'] ?? null,
                ':fb'        => $data['social_facebook'] ?? null,
                ':web'       => $data['social_website'] ?? null,
                ':address'   => $data['address'] ?? null,
                ':contract'  => $data['contract_total'] ?? 0,
                ':status'    => $data['project_status'] ?? 'ACTIVO',
                ':notes'     => $data['project_notes'] ?? null,
                ':started'   => $data['started_at'] ?? date('Y-m-d'),
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID requerido.']);
            break;
        }

        $allowed = ['name','rubro','phone','email','social_instagram','social_facebook',
                    'social_website','address','logo_url','contract_total','project_status',
                    'project_notes','started_at'];
        $updates = [];
        $params = [':id' => $data['id']];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $updates[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (empty($updates)) {
            echo json_encode(['success' => true]);
            break;
        }

        try {
            $stmt = $pdo->prepare("UPDATE active_clients SET " . implode(', ', $updates) . " WHERE id = :id");
            $stmt->execute($params);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID requerido.']);
            break;
        }
        try {
            $stmt = $pdo->prepare("DELETE FROM active_clients WHERE id = :id");
            $stmt->execute([':id' => $data['id']]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido.']);
}
?>
