<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['email']) && isset($data['password'])) {
    // Sistema de Administrador por defecto (Al no haber registro)
    if ($data['email'] === 'admin@crm.com' && $data['password'] === 'admin123') {
        echo json_encode([
            "success" => true,
            "token" => bin2hex(random_bytes(16)),
            "user" => ["name" => "Administrador"]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["error" => "Correo o contraseña incorrectos."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["error" => "Datos incompletos."]);
}
?>