<?php
// project_tasks.php — CRUD de tareas del proyecto por cliente activo
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
            $stmt = $pdo->prepare("SELECT * FROM project_tasks WHERE active_client_id = :id ORDER BY FIELD(priority,'ALTA','MEDIA','BAJA'), created_at DESC");
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
                INSERT INTO project_tasks (active_client_id, title, description, priority, status, due_date)
                VALUES (:cid, :title, :desc, :priority, :status, :ddate)
            ");
            $stmt->execute([
                ':cid'      => $data['active_client_id'],
                ':title'    => $data['title'],
                ':desc'     => $data['description'] ?? null,
                ':priority' => $data['priority'] ?? 'MEDIA',
                ':status'   => $data['status'] ?? 'PENDIENTE',
                ':ddate'    => $data['due_date'] ?? null,
            ]);
            $newId = $pdo->lastInsertId();
            $stmt2 = $pdo->prepare("SELECT * FROM project_tasks WHERE id = :id");
            $stmt2->execute([':id' => $newId]);
            echo json_encode(['success' => true, 'data' => $stmt2->fetch(PDO::FETCH_ASSOC)]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['id'])) { http_response_code(400); echo json_encode(['error' => 'ID requerido.']); break; }
        $allowed = ['title','description','priority','status','due_date'];
        $updates = [];
        $params = [':id' => $data['id']];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $updates[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }
        // Si se marca como COMPLETADO, registrar timestamp
        if (isset($data['status']) && $data['status'] === 'COMPLETADO') {
            $updates[] = "completed_at = NOW()";
        }
        if (empty($updates)) { echo json_encode(['success' => true]); break; }
        try {
            $stmt = $pdo->prepare("UPDATE project_tasks SET " . implode(', ', $updates) . " WHERE id = :id");
            $stmt->execute($params);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['id'])) { http_response_code(400); echo json_encode(['error' => 'ID requerido.']); break; }
        try {
            $stmt = $pdo->prepare("DELETE FROM project_tasks WHERE id = :id");
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
