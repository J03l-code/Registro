<?php
require_once 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

if (!isset($_GET['lead_id'])) {
    http_response_code(400);
    echo json_encode(["error" => "Falta parámetro lead_id"]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM lead_history WHERE lead_id = ? ORDER BY created_at DESC");
    $stmt->execute([$_GET['lead_id']]);
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "data" => $history]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Fallo cargando historial: " . $e->getMessage()]);
}
?>