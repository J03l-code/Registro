<?php
require_once 'config.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_POST['lead_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Falta identificar el lead_id del cliente']);
        exit;
    }

    $lead_id = $_POST['lead_id'];

    // Validar y crear la carpeta de almacenamiento de Hostinger
    $target_dir = "../uploads/";
    if (!file_exists($target_dir)) {
        mkdir($target_dir, 0755, true);
    }

    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $fileObj = $_FILES['file'];
        // Generar un nombre de archivo único para evitar sobreescritura (Ej: 1673849_cotizacion.pdf)
        $unique_name = time() . '_' . preg_replace("/[^a-zA-Z0-9.-]/", "_", basename($fileObj['name']));
        $target_file = $target_dir . $unique_name;

        if (move_uploaded_file($fileObj['tmp_name'], $target_file)) {
            try {
                // Registrar Binario en MySQL
                $stmt = $pdo->prepare("INSERT INTO lead_documents (lead_id, filename, file_url) VALUES (?, ?, ?)");
                $urlPath = "uploads/" . $unique_name;
                $stmt->execute([$lead_id, $fileObj['name'], $urlPath]);

                // Trackear History (OPCIONAL/ESTÉTICO)
                $hist = $pdo->prepare("INSERT INTO lead_history (lead_id, event_desc) VALUES (?, ?)");
                $hist->execute([$lead_id, "Adjuntó un archivo: " . $fileObj['name']]);

                echo json_encode(['success' => true, 'file_url' => $urlPath, 'filename' => $fileObj['name']]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Archivo subido pero no guardado en BDD: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'El servidor no pudo guardar físicamente el archivo']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Archivo dañado o nulo (' . ($_FILES['file']['error'] ?? 'desconocido') . ')']);
    }
}
// Para extraer la lista de archivos de un Lead en específico
elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['lead_id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Se requiere lead_id"]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM lead_documents WHERE lead_id = ? ORDER BY created_at DESC");
        $stmt->execute([$_GET['lead_id']]);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Fallo MySQL al buscar archivos: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
}
?>