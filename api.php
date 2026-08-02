<?php
session_start();
header('Content-Type: application/json');

require_once 'auth.php';

// Database Connection
$db_host = 'localhost';
$db_name = 'training_plus';
$db_user = 'root';
$db_pass = '';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$action = $_GET['action'] ?? '';

// Check Session Status
if ($action === 'check_session') {
    if (isset($_SESSION['user'])) {
        echo json_encode(['authenticated' => true, 'user' => $_SESSION['user']]);
    } else {
        echo json_encode(['authenticated' => false]);
    }
    exit;
}

// Google Authentication Endpoint
if ($action === 'google_login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $token = $data['token'] ?? '';

    if (empty($token)) {
        echo json_encode(['success' => false, 'message' => 'Token required']);
        exit;
    }

    // Verify token with Google API
    $google_url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . urlencode($token);
    $response = @file_get_contents($google_url);
    $payload = json_decode($response, true);

    if (isset($payload['sub'])) {
        $google_id = $payload['sub'];
        $email = $payload['email'];
        $name = $payload['name'];
        $picture = $payload['picture'] ?? '';

        // Check if user exists
        $stmt = $pdo->prepare("SELECT * FROM users WHERE google_id = ?");
        $stmt->execute([$google_id]);
        $user = $stmt->fetch();

        if (!$user) {
            $stmt = $pdo->prepare("INSERT INTO users (google_id, name, email, picture) VALUES (?, ?, ?, ?)");
            $stmt->execute([$google_id, $name, $email, $picture]);
            $user = ['id' => $pdo->lastInsertId(), 'google_id' => $google_id, 'name' => $name, 'email' => $email, 'picture' => $picture];
        }

        $_SESSION['user'] = $user;
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid Google account token']);
    }
    exit;
}

// Sign Out Endpoint
if ($action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

// Lock all subsequent actions behind auth check
$current_user = require_auth();
$current_user_id = $current_user['id'];

// --- STUDENT ACTIONS (STRICT PRIVACY ISOLATION) ---

if ($action === 'get_students') {
    $stmt = $pdo->prepare("SELECT * FROM students WHERE user_id = ? ORDER BY id DESC");
    $stmt->execute([$current_user_id]);
    echo json_encode($stmt->fetchAll());
    exit;
}

if ($action === 'add_student') {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("INSERT INTO students (user_id, name, email, course) VALUES (?, ?, ?, ?)");
    $stmt->execute([$current_user_id, $data['name'], $data['email'], $data['course']]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'delete_student') {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("DELETE FROM students WHERE id = ? AND user_id = ?");
    $stmt->execute([$data['id'], $current_user_id]);
    echo json_encode(['success' => true]);
    exit;
}

// --- 1-ON-1 MESSAGING ACTIONS ---

if ($action === 'get_users') {
    $stmt = $pdo->query("SELECT id, name, email, picture FROM users");
    echo json_encode($stmt->fetchAll());
    exit;
}

if ($action === 'get_messages') {
    $receiver_id = intval($_GET['receiver_id'] ?? 0);
    $stmt = $pdo->prepare("
        SELECT * FROM messages 
        WHERE (sender_id = :me AND receiver_id = :other) 
           OR (sender_id = :other AND receiver_id = :me) 
        ORDER BY created_at ASC
    ");
    $stmt->execute(['me' => $current_user_id, 'other' => $receiver_id]);
    echo json_encode($stmt->fetchAll());
    exit;
}

if ($action === 'send_message') {
    $data = json_decode(file_get_contents('php://input'), true);
    $receiver_id = intval($data['receiver_id'] ?? 0);
    $message = trim($data['message'] ?? '');
    $payload = $data['student_payload'] ?? null;

    if ($receiver_id > 0) {
        $stmt = $pdo->prepare("INSERT INTO messages (sender_id, receiver_id, message, student_payload) VALUES (?, ?, ?, ?)");
        $stmt->execute([$current_user_id, $receiver_id, $message, $payload]);
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid receiver']);
    }
    exit;
}
?>
