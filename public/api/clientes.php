<?php
// clientes.php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query("SELECT * FROM leads ORDER BY id DESC");
            $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($clientes);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Fallo al leer datos."]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);

        if (isset($data['name']) && isset($data['phone'])) {
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO leads (name, rubro, phone, email, is_contacted, did_answer, wp_sent, call_date, interest_level, notes) 
                    VALUES (:name, :rubro, :phone, :email, :contact, :answer, :wp, :calldate, :interest, :notes)
                ");

                $stmt->execute([
                    ':name' => $data['name'],
                    ':rubro' => $data['rubro'] ?? null,
                    ':phone' => $data['phone'] ?? null,
                    ':email' => $data['email'] ?? null,
                    ':contact' => $data['is_contacted'] ?? 'NO',
                    ':answer' => $data['did_answer'] ? 1 : 0,
                    ':wp' => $data['wp_sent'] ? 1 : 0,
                    ':calldate' => $data['call_date'] ?? null,
                    ':interest' => $data['interest_level'] ?? null,
                    ':notes' => $data['notes'] ?? null
                ]);

                $data['id'] = $pdo->lastInsertId();
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
        // EDICIÓN TIPO EXCEL: Permite modificar sólo lo que necesitemos
        $data = json_decode(file_get_contents("php://input"), true);

        if (isset($data['id'])) {
            $allowedFields = ['is_contacted', 'did_answer', 'wp_sent', 'call_date', 'interest_level', 'notes', 'rubro'];
            $updates = [];
            $params = [':id' => $data['id']];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = :$field";

                    if ($field === 'did_answer' || $field === 'wp_sent') {
                        $params[":$field"] = empty($data[$field]) ? 0 : 1;
                    } else {
                        $params[":$field"] = $data[$field];
                    }
                }
            }

            if (!empty($updates)) {
                $sql = "UPDATE leads SET " . implode(", ", $updates) . " WHERE id = :id";
                try {
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                    echo json_encode(["success" => true]);
                } catch (PDOException $e) {
                    http_response_code(500);
                    echo json_encode(["error" => "Error editando: " . $e->getMessage()]);
                }
            } else {
                echo json_encode(["success" => true, "msg" => "No se detectaron campos para actualizar."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Falta el ID del cliente."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método $method no permitido."]);
        break;
}
?>