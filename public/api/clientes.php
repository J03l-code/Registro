<?php
// clientes.php
require_once 'config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            // Selecciona a los clientes, y cuenta CUÁNTAS tareas pendientes tienen en la agenda (Alert Tracker)
            $stmt = $pdo->query("
                SELECT l.*, 
                (SELECT COUNT(*) FROM activities a WHERE a.lead_id = l.id AND a.completed = FALSE) as pending_tasks
                FROM leads l 
                ORDER BY l.id DESC
            ");
            $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($clientes);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Fallo al leer datos: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);

        if (isset($data['name']) && isset($data['phone'])) {
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO leads (name, rubro, phone, email, is_contacted, did_answer, wp_sent, call_date, interest_level, notes, estimated_value, social_instagram) 
                    VALUES (:name, :rubro, :phone, :email, :contact, :answer, :wp, :calldate, :interest, :notes, :value, :ig)
                ");

                $stmt->execute([
                    ':name' => $data['name'],
                    ':rubro' => $data['rubro'] ?? null,
                    ':phone' => $data['phone'] ?? null,
                    ':email' => $data['email'] ?? null,
                    ':contact' => $data['is_contacted'] ?? 'NO',
                    ':answer' => empty($data['did_answer']) ? 0 : 1,
                    ':wp' => empty($data['wp_sent']) ? 0 : 1,
                    ':calldate' => $data['call_date'] ?? null,
                    ':interest' => $data['interest_level'] ?? null,
                    ':notes' => $data['notes'] ?? null,
                    ':value' => $data['estimated_value'] ?? 0,
                    ':ig' => $data['social_instagram'] ?? null
                ]);

                $newId = $pdo->lastInsertId();

                // Track: Creación Inicial
                $hist = $pdo->prepare("INSERT INTO lead_history (lead_id, event_desc) VALUES (?, ?)");
                $hist->execute([$newId, "Lead inicializado en el sistema por el Administrador."]);

                $data['id'] = $newId;
                echo json_encode(["success" => true, "client" => $data]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => "Error guardando en la BDD: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Faltan datos obligatorios (name y phone)."]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);

        if (isset($data['id'])) {
            // Incorporamos el financial 'estimated_value' e instagram para update asícrono
            $allowedFields = ['is_contacted', 'did_answer', 'wp_sent', 'call_date', 'interest_level', 'notes', 'rubro', 'estimated_value', 'social_instagram', 'social_facebook', 'social_website', 'name', 'phone', 'email', 'status'];
            $updates = [];
            $params = [':id' => $data['id']];
            $friendly_changes = ""; // Acumulador de Tracking

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = :$field";

                    if ($field === 'did_answer' || $field === 'wp_sent') {
                        $estado = empty($data[$field]) ? 0 : 1;
                        $params[":$field"] = $estado;
                        $friendly_changes = "Actualizó check de {$field} a " . ($estado ? "SI" : "NO");
                    } else {
                        $params[":$field"] = $data[$field];
                        if ($field === 'interest_level')
                            $friendly_changes = "Comentó Interés: " . $data[$field];
                        if ($field === 'notes')
                            $friendly_changes = "Actualizó Expediente: " . substr($data[$field], 0, 50) . "...";
                        if ($field === 'status')
                            $friendly_changes = "Movió Pipeline a: " . $data[$field];
                        if ($field === 'estimated_value')
                            $friendly_changes = "Ajustó cotización a: $" . $data[$field];
                    }
                }
            }

            if (!empty($updates)) {
                $sql = "UPDATE leads SET " . implode(", ", $updates) . " WHERE id = :id";
                try {
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);

                    // Inyectar a la línea de tiempo silenciosamente
                    if (!empty($friendly_changes)) {
                        $hist = $pdo->prepare("INSERT INTO lead_history (lead_id, event_desc) VALUES (?, ?)");
                        $hist->execute([$data['id'], $friendly_changes]);
                    }

                    echo json_encode(["success" => true]);
                } catch (PDOException $e) {
                    http_response_code(500);
                    echo json_encode(["error" => "Error editando: " . $e->getMessage()]);
                }
            } else {
                echo json_encode(["success" => true]);
            }
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['id'])) {
            try {
                // Las FK con ON DELETE CASCADE borrarán history, documents y activities automáticamente
                $stmt = $pdo->prepare("DELETE FROM leads WHERE id = :id");
                $stmt->execute([':id' => $data['id']]);
                echo json_encode(["success" => true]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => "Error eliminando: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Se requiere id para eliminar."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método $method no permitido."]);
        break;
}
?>