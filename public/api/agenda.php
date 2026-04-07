<?php
require_once 'config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Operación LEER (Listar Agenda)
        try {
            $stmt = $pdo->query("
                SELECT a.*, l.name as company 
                FROM activities a 
                LEFT JOIN leads l ON a.lead_id = l.id 
                WHERE a.completed = FALSE
                ORDER BY a.scheduled_for ASC
            ");
            $agenda = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["success" => true, "data" => $agenda]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Fallo cargando agenda."]);
        }
        break;

    case 'POST':
        // Operación CREAR nueva tarea de agenda
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['summary'])) {
            try {
                $stmt = $pdo->prepare("INSERT INTO activities (type, summary, scheduled_for, lead_id) VALUES (:type, :summary, :scheduled, :lead)");
                $stmt->execute([
                    ':type' => $data['type'] ?? 'LLAMADA',
                    ':summary' => $data['summary'],
                    ':scheduled' => $data['date'] ?? date('Y-m-d H:i:s', strtotime('+1 day')),
                    ':lead' => $data['lead_id'] ?? null
                ]);
                echo json_encode(["success" => true]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => "Error al insertar: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "El resumen es requerido."]);
        }
        break;
}
?>