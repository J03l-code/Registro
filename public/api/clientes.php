<?php
// clientes.php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Operación LEER (Listar)
        try {
            $stmt = $pdo->query("SELECT * FROM leads ORDER BY id DESC");
            $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($clientes);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Fallo al leer datos."]);
        }
        break;

    case 'POST':
        // Operación CREAR
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (isset($data['name']) && isset($data['email'])) {
            try {
                // Preparar Query
                $stmt = $pdo->prepare("INSERT INTO leads (name, phone, email, status, source) VALUES (:name, :phone, :email, :status, :source)");
                
                // Bind y Ejecutar
                $stmt->execute([
                    ':name'   => $data['name'],
                    ':phone'  => $data['phone'] ?? null,
                    ':email'  => $data['email'],
                    ':status' => $data['status'] ?? 'FRÍO',
                    ':source' => $data['source'] ?? 'API'
                ]);
                
                $data['id'] = $pdo->lastInsertId();
                echo json_encode(["success" => true, "client" => $data]);
            } catch(PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => "Error guardando en la BDD: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Faltan datos obligatorios (name y email)."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método $method no permitido."]);
        break;
}
?>
