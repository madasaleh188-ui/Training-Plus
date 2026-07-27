<?php
header("Content-Type: application/json");
require_once "db.php";

$action = $_GET['action'] ?? '';

// 1. GET ALL STUDENTS
if ($action === 'get_students') {
    $result = $conn->query("SELECT * FROM students ORDER BY id DESC");
    $students = [];
    while ($row = $result->fetch_assoc()) {
        $students[] = $row;
    }
    echo json_encode($students);
    exit;
}

// 2. ADD STUDENT (WITH CPR VALIDATION)
if ($action === 'add_student') {
    $data = json_decode(file_get_contents("php://input"), true) ?: $_POST;
    $cpr = trim($data['cpr'] ?? '');

    if (strlen($cpr) !== 9 || !is_numeric($cpr) || intval($cpr) <= 0) {
        echo json_encode(["status" => "error", "message" => "CPR must be exactly 9 numbers and greater than 0!"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id FROM students WHERE cpr = ?");
    $stmt->bind_param("s", $cpr);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        echo json_encode(["status" => "duplicate", "message" => "This student is already added."]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO students (name, cpr) VALUES ('New Student', ?)");
    $stmt->bind_param("s", $cpr);
    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Student added successfully!"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to add student record."]);
    }
    exit;
}

// 3. UPDATE STUDENT FIELDS
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
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid field update."]);
    }
    exit;
}

// 4. UPLOAD PROFILE PHOTO TO SERVER
if ($action === 'upload_photo') {
    $id = intval($_POST['id']);
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        if (!is_dir('uploads')) { 
            mkdir('uploads', 0777, true); 
        }
        
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
    echo json_encode(["status" => "error", "message" => "Photo upload failed."]);
    exit;
}

// 5. DELETE STUDENT RECORD
if ($action === 'delete_student') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['id']);

    $stmt = $conn->prepare("DELETE FROM students WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    echo json_encode(["status" => "success"]);
    exit;
}

echo json_encode(["status" => "error", "message" => "Invalid endpoint."]);
?>
