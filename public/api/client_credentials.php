<?php
// client_credentials.php — CRUD de bóveda de credenciales/accesos
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
            $stmt = $pdo->prepare("SELECT * FROM client_credentials WHERE active_client_id = :id ORDER BY created_at DESC");
            $stmt->execute([':id' => $_GET['client_id']]);
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['active_client_id']) || !isset($data['platform'])) {
            http_response_code(400);
            echo json_encode(['error' => 'active_client_id y platform son requeridos.']);
            break;
        }
        try {
            $stmt = $pdo->prepare("
                INSERT INTO client_credentials (active_client_id, platform, platform_url, username, password_enc, notes)
                VALUES (:cid, :platform, :url, :user, :pass, :notes)
            ");
            $stmt->execute([
                ':cid'      => $data['active_client_id'],
                ':platform' => $data['platform'],
                ':url'      => $data['platform_url'] ?? null,
                ':user'     => $data['username'] ?? null,
                ':pass'     => $data['password_enc'] ?? null,
                ':notes'    => $data['notes'] ?? null,
            ]);
            $newId = $pdo->lastInsertId();
            $stmt2 = $pdo->prepare("SELECT * FROM client_credentials WHERE id = :id");
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
        $allowed = ['platform','platform_url','username','password_enc','notes'];
        $updates = [];
        $params = [':id' => $data['id']];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $updates[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }
        if (empty($updates)) { echo json_encode(['success' => true]); break; }
        try {
            $stmt = $pdo->prepare("UPDATE client_credentials SET " . implode(', ', $updates) . " WHERE id = :id");
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
            $stmt = $pdo->prepare("DELETE FROM client_credentials WHERE id = :id");
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
