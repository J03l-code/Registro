<?php
// project_changes.php — CRUD de bitácora de cambios del proyecto
require_once 'config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (!isset($_GET['client_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'client_id requerido.']);
            break;
        }
        try {
            $stmt = $pdo->prepare("SELECT * FROM project_changes WHERE active_client_id = :id ORDER BY change_date DESC, created_at DESC");
            $stmt->execute([':id' => $_GET['client_id']]);
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['active_client_id']) || !isset($data['title'])) {
            http_response_code(400);
            echo json_encode(['error' => 'active_client_id y title son requeridos.']);
            break;
        }
        try {
            $stmt = $pdo->prepare("
                INSERT INTO project_changes (active_client_id, change_type, title, description, status, screenshot_url, change_date)
                VALUES (:cid, :type, :title, :desc, :status, :ss, :cdate)
            ");
            $stmt->execute([
                ':cid'    => $data['active_client_id'],
                ':type'   => $data['change_type'] ?? 'OTRO',
                ':title'  => $data['title'],
                ':desc'   => $data['description'] ?? null,
                ':status' => $data['status'] ?? 'COMPLETADO',
                ':ss'     => $data['screenshot_url'] ?? null,
                ':cdate'  => $data['change_date'] ?? date('Y-m-d'),
            ]);
            $newId = $pdo->lastInsertId();
            $stmt2 = $pdo->prepare("SELECT * FROM project_changes WHERE id = :id");
            $stmt2->execute([':id' => $newId]);
            echo json_encode(['success' => true, 'data' => $stmt2->fetch(PDO::FETCH_ASSOC)]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['id'])) { http_response_code(400); echo json_encode(['error' => 'ID requerido.']); break; }
        try {
            $stmt = $pdo->prepare("DELETE FROM project_changes WHERE id = :id");
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
