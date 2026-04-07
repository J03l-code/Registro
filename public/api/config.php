<?php
// config.php
// IMPORTANTE: Estos datos deben venir de tu panel de Hostinger -> Bases de Datos
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// ============================================
// ZONA HORARIA: Guayaquil, Ecuador (UTC-5)
// ============================================
date_default_timezone_set('America/Guayaquil');

// Si es una petición "Pre-Flight" del navegador (CORS), responder que está todo bien
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ============================================
// CREDENCIALES HOSTINGER (Rellenar en Hostinger)
// ============================================
$db_host = 'localhost';
$db_user = 'u434851126_registro_usr';
$db_pass = 'Polloloco2004!';
$db_name = 'u434851126_registro';

// Intentar la conexión con PDO (Mejor seguridad)
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Sincronizar MySQL al mismo huso horario de Ecuador
    $pdo->exec("SET time_zone = '-05:00'");
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode(["error" => "Error de Conexión a DB: " . $e->getMessage()]));
}
?>