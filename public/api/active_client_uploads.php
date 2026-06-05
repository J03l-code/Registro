<?php
// active_client_uploads.php — Subida y gestión de archivos para clientes activos
require_once 'config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    if (!isset($_POST['active_client_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Falta active_client_id']);
        exit;
    }

    $active_client_id = $_POST['active_client_id'];
    $target_dir = "../uploads/";
    if (!file_exists($target_dir)) {
        mkdir($target_dir, 0755, true);
    }

    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $fileObj = $_FILES['file'];
        $unique_name = time() . '_client_' . preg_replace("/[^a-zA-Z0-9.-]/", "_", basename($fileObj['name']));
        $target_file = $target_dir . $unique_name;

        if (move_uploaded_file($fileObj['tmp_name'], $target_file)) {
            try {
                $stmt = $pdo->prepare("INSERT INTO active_client_documents (active_client_id, filename, file_url, file_size) VALUES (?, ?, ?, ?)");
                $urlPath = "uploads/" . $unique_name;
                $stmt->execute([$active_client_id, $fileObj['name'], $urlPath, $fileObj['size']]);

                echo json_encode(['success' => true, 'file_url' => $urlPath, 'filename' => $fileObj['name']]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Error al guardar en BDD: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'No se pudo guardar físicamente el archivo']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Archivo no válido']);
    }
} elseif ($method === 'GET') {
    if (!isset($_GET['client_id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Falta client_id"]);
        exit;
    }
    try {
        $stmt = $pdo->prepare("SELECT * FROM active_client_documents WHERE active_client_id = ? ORDER BY uploaded_at DESC");
        $stmt->execute([$_GET['client_id']]);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Falta id']);
        exit;
    }

    try {
        // 1. Obtener URL del archivo para borrarlo físicamente
        $stmt = $pdo->prepare("SELECT * FROM active_client_documents WHERE id = ?");
        $stmt->execute([$data['id']]);
        $doc = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($doc) {
            $physical_path = "../" . $doc['file_url'];
            if (file_exists($physical_path)) {
                unlink($physical_path);
            }
            
            // 2. Eliminar registro
            $delStmt = $pdo->prepare("DELETE FROM active_client_documents WHERE id = ?");
            $delStmt->execute([$data['id']]);
            echo json_encode(['success' => true]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Documento no encontrado']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
}
?>
