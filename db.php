<?php
$host = "localhost";
$user = "root";     // Your MySQL username
$pass = "";         // Your MySQL password
$dbname = "training_plus";

$conn = new mysqli($host, $user, $pass, $dbname);
if ($conn->connect_error) {
    header("Content-Type: application/json");
    die(json_encode(["status" => "error", "message" => "Database Connection Failed: " . $conn->connect_error]));
}

$conn->set_charset("utf8mb4");
?>
