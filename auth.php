<?php
session_start();
header("Content-Type: application/json");
require_once "db.php";

$action = $_GET['action'] ?? '';

// Register User
if ($action === 'register') {
    $data = json_decode(file_get_contents("php://input"), true);
    $username = trim($data['username'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = trim($data['password'] ?? '');

    // Validate 8 characters, uppercase, lowercase, number
    $regex = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/';
    if (!preg_match($regex, $password)) {
        echo json_encode(["status" => "error", "message" => "Password must be at least 8 characters long and contain uppercase, lowercase, and a number."]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->bind_param("ss", $username, $email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        echo json_encode(["status" => "error", "message" => "Username or Email already registered!"]);
        exit;
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $username, $email, $hashedPassword);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Account created successfully! Please log in."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to create account."]);
    }
    exit;
}

// Login User
if ($action === 'login') {
    $data = json_decode(file_get_contents("php://input"), true);
    $username = trim($data['username'] ?? '');
    $password = trim($data['password'] ?? '');

    $stmt = $conn->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    $stmt->bind_param("ss", $username, $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        if (password_verify($password, $row['password'])) {
            $_SESSION['user_id'] = $row['id'];
            $_SESSION['username'] = $row['username'];
            $_SESSION['email'] = $row['email'];

            echo json_encode([
                "status" => "success",
                "message" => "Welcome back!",
                "user_id" => $row['id'],
                "username" => $row['username'],
                "email" => $row['email']
            ]);
            exit;
        }
    }
    echo json_encode(["status" => "error", "message" => "Invalid credentials."]);
    exit;
}

// Change Password
if ($action === 'change_password') {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(["status" => "error", "message" => "Unauthorized"]);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    $newPassword = trim($data['new_password'] ?? '');

    $regex = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/';
    if (!preg_match($regex, $newPassword)) {
        echo json_encode(["status" => "error", "message" => "Password does not meet requirements."]);
        exit;
    }

    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
    $stmt->bind_param("si", $hashedPassword, $_SESSION['user_id']);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Password updated successfully!"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to update password."]);
    }
    exit;
}

// Check Session
if ($action === 'check_session') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            "logged_in" => true,
            "user_id" => $_SESSION['user_id'],
            "username" => $_SESSION['username'],
            "email" => $_SESSION['email']
        ]);
    } else {
        echo json_encode(["logged_in" => false]);
    }
    exit;
}

// Logout
if ($action === 'logout') {
    session_destroy();
    echo json_encode(["status" => "success"]);
    exit;
}
?>
