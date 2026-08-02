<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function require_auth() {
    if (!isset($_SESSION['user'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized access. Please sign in with Google.']);
        exit;
    }
    return $_SESSION['user'];
}
?>
