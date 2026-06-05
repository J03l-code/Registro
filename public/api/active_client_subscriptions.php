<?php
// active_client_subscriptions.php — CRUD de renovaciones (Hosting, Dominios, etc.)
require_once 'config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['dashboard_upcoming'])) {
            // Obtener suscripciones que vencen en los próximos 30 días
            try {
                $stmt = $pdo->query("
                    SELECT s.*, c.name as client_name 
                    FROM client_subscriptions s
                    JOIN active_clients c ON s.active_client_id = c.id
                    WHERE s.status = 'ACTIVO' 
                      AND s.next_due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
                    ORDER BY s.next_due_date ASC
                ");
                echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Fallo al cargar renovaciones para dashboard: ' . $e->getMessage()]);
            }
            break;
        }

        if (!isset($_GET['client_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta client_id']);
            exit;
        }
        $client_id = $_GET['client_id'];
        try {
            $stmt = $pdo->prepare("SELECT * FROM client_subscriptions WHERE active_client_id = ? ORDER BY next_due_date ASC");
            $stmt->execute([$client_id]);
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['active_client_id'], $data['service_name'], $data['price'], $data['next_due_date'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Faltan campos obligatorios']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO client_subscriptions (active_client_id, service_name, price, billing_period, next_due_date, status) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['active_client_id'],
                $data['service_name'],
                $data['price'],
                $data['billing_period'] ?? 'ANUAL',
                $data['next_due_date'],
                $data['status'] ?? 'ACTIVO'
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta id']);
            exit;
        }

        // Si viene "renovado" => true, calculamos la siguiente fecha de vencimiento y actualizamos
        if (isset($data['renewed']) && $data['renewed'] === true) {
            try {
                // Obtener datos actuales
                $stmt = $pdo->prepare("SELECT * FROM client_subscriptions WHERE id = ?");
                $stmt->execute([$data['id']]);
                $sub = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$sub) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Suscripción no encontrada']);
                    exit;
                }

                $next_date = new DateTime($sub['next_due_date']);
                switch ($sub['billing_period']) {
                    case 'MENSUAL':
                        $next_date->modify('+1 month');
                        break;
                    case 'TRIMESTRAL':
                        $next_date->modify('+3 months');
                        break;
                    case 'SEMESTRAL':
                        $next_date->modify('+6 months');
                        break;
                    case 'ANUAL':
                    default:
                        $next_date->modify('+1 year');
                        break;
                }
                $new_due_date = $next_date->format('Y-m-d');

                // 1. Crear cuota de pago pagada en el historial de pagos del cliente para registrar el ingreso histórico
                $payStmt = $pdo->prepare("
                    INSERT INTO client_payments (active_client_id, amount, method, status, description, payment_date, due_date) 
                    VALUES (?, ?, 'TRANSFERENCIA', 'PAGADO', ?, CURDATE(), ?)
                ");
                $payStmt->execute([
                    $sub['active_client_id'],
                    $sub['price'],
                    "Renovación: " . $sub['service_name'],
                    $sub['next_due_date']
                ]);

                // 2. Actualizar suscripción al siguiente ciclo
                $upStmt = $pdo->prepare("UPDATE client_subscriptions SET next_due_date = ? WHERE id = ?");
                $upStmt->execute([$new_due_date, $data['id']]);

                echo json_encode(['success' => true, 'next_due_date' => $new_due_date]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Error al renovar: ' . $e->getMessage()]);
            }
            break;
        }

        try {
            $stmt = $pdo->prepare("
                UPDATE client_subscriptions 
                SET service_name = ?, price = ?, billing_period = ?, next_due_date = ?, status = ? 
                WHERE id = ?
            ");
            $stmt->execute([
                $data['service_name'],
                $data['price'],
                $data['billing_period'],
                $data['next_due_date'],
                $data['status'],
                $data['id']
            ]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta id']);
            exit;
        }
        try {
            $stmt = $pdo->prepare("DELETE FROM client_subscriptions WHERE id = ?");
            $stmt->execute([$data['id']]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        break;
}
?>
