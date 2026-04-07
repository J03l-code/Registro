<?php
// config.php
// IMPORTANTE: Estos datos deben venir de tu panel de Hostinger -> Bases de Datos
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si es una petición "Pre-Flight" del navegador (CORS), responder que está todo bien
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ============================================
// CREDENCIALES HOSTINGER (Rellenar en Hostinger)
// ============================================
$db_host = 'localhost'; // En Hostinger esto CASI SIEMPRE es localhost
$db_user = 'u434851126_registro_usr'; // Usuario de la base de datos
$db_pass = 'Polloloco2004@'; // Contraseña de DB
$db_name = 'u434851126_registro'; // Nombre de la DB

// Intentar la conexión con PDO (Mejor seguridad)
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    // Configurar para que PDO tire excepciones reales al equivocarnos
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    // Si la DB falla, retornar un JSON limpio en lugar del error feo de PHP.
    http_response_code(500);
    die(json_encode(["error" => "Error de Conexión a DB: " . $e->getMessage()]));
}
?>
