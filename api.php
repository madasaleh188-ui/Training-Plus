<?php
session_start();
header("Content-Type: application/json");
require_once "db.php";
$action = $_GET['action'] ?? '';

// Get Students (with Search support)
if ($action === 'get_students') {
    $search = trim($_GET['q'] ?? '');
    if (!empty($search)) {
        $stmt = $conn->prepare("SELECT * FROM students WHERE name LIKE ? OR cpr LIKE ? ORDER BY id DESC");
        $like = "%" . $search . "%";
        $stmt->bind_param("ss", $like, $like);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $conn->query("SELECT * FROM students ORDER BY id DESC");
    }

    $students = [];
    while ($row = $result->fetch_assoc()) {
        $students[] = $row;
    }
    echo json_encode($students);
    exit;
}

// Add Student
if ($action === 'add_student') {
    $data = json_decode(file_get_contents("php://input"), true) ?: $_POST;
    $cpr = trim($data['cpr'] ?? '');
    $addedBy = $_SESSION['username'] ?? 'Admin';

    if (strlen($cpr) !== 9 || !is_numeric($cpr) || intval($cpr) <= 0) {
        echo json_encode(["status" => "error", "message" => "CPR must be exactly 9 numbers and greater than 0!"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT added_by FROM students WHERE cpr = ?");
    $stmt->bind_param("s", $cpr);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($row = $res->fetch_assoc()) {
        echo json_encode([
            "status" => "duplicate",
            "message" => "This CPR is already in the system and was added by user: " . $row['added_by']
        ]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO students (name, cpr, added_by) VALUES ('New Student', ?, ?)");
    $stmt->bind_param("ss", $cpr, $addedBy);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Student added successfully!"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to add student record."]);
    }
    exit;
}

// Update Student Fields
if ($action === 'update_student') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['id']);
    $field = $data['field'];
    $value = $data['value'];

    $allowed_fields = ['name', 'gender', 'email', 'status', 'courses', 'ministry', 'degree'];
    if (in_array($field, $allowed_fields)) {
        $stmt = $conn->prepare("UPDATE students SET $field = ? WHERE id = ?");
        $stmt->bind_param("si", $value, $id);
        $stmt->execute();
        echo json_encode(["status" => "success"]);
    }
    exit;
}

// Upload Photo
if ($action === 'upload_photo') {
    $id = intval($_POST['id']);
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        if (!is_dir('uploads')) { mkdir('uploads', 0777, true); }
        $fileName = time() . '_' . preg_replace("/[^a-zA-Z0-9\._-]/", "", basename($_FILES['photo']['name']));
        $targetFilePath = 'uploads/' . $fileName;

        if (move_uploaded_file($_FILES['photo']['tmp_name'], $targetFilePath)) {
            $stmt = $conn->prepare("UPDATE students SET photo = ? WHERE id = ?");
            $stmt->bind_param("si", $targetFilePath, $id);
            $stmt->execute();
            echo json_encode(["status" => "success", "photo" => $targetFilePath]);
            exit;
        }
    }
    echo json_encode(["status" => "error"]);
    exit;
}

// Delete Student
if ($action === 'delete_student') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['id']);
    $stmt = $conn->prepare("DELETE FROM students WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    echo json_encode(["status" => "success"]);
    exit;
}

// Group Chat - Get Messages
if ($action === 'get_messages') {
    $result = $conn->query("SELECT * FROM group_messages ORDER BY id ASC LIMIT 50");
    $msgs = [];
    while ($row = $result->fetch_assoc()) {
        $msgs[] = $row;
    }
    echo json_encode($msgs);
    exit;
}

// Group Chat - Send Message
if ($action === 'send_message') {
    $data = json_decode(file_get_contents("php://input"), true);
    $user = $_SESSION['username'] ?? 'Anonymous';
    $msg = trim($data['message'] ?? '');

    if (!empty($msg)) {
        $stmt = $conn->prepare("INSERT INTO group_messages (username, message) VALUES (?, ?)");
        $stmt->bind_param("ss", $user, $msg);
        $stmt->execute();
        echo json_encode(["status" => "success"]);
    }
    exit;
}
?>

