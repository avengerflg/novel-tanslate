<?php
$sock = "/home/u960547167/backend/server.sock";

// Function to check if backend UNIX socket is alive and accepting connections.
// If dead or missing, auto-spawns Bun server.js and waits for socket readiness.
function ensure_backend_alive($sock) {
    if (file_exists($sock)) {
        $test = @stream_socket_client("unix://" . $sock, $errno, $errstr, 0.2);
        if ($test) {
            fclose($test);
            return true;
        }
    }

    // Socket is either missing or dead: clean up stale socket file
    if (file_exists($sock)) {
        @unlink($sock);
    }

    // Spawn Bun backend using proc_open
    $descriptors = [
        0 => ["pipe", "r"],
        1 => ["file", "/home/u960547167/backend/server.log", "a"],
        2 => ["file", "/home/u960547167/backend/server.log", "a"]
    ];

    $env = [
        "SOCKET_PATH" => $sock,
        "PATH" => "/usr/local/bin:/usr/bin:/bin",
        "HOME" => "/home/u960547167"
    ];

    $proc = @proc_open("/usr/bin/bun /home/u960547167/backend/server.js", $descriptors, $pipes, "/home/u960547167/backend", $env);

    // Poll up to 3.5 seconds for socket to accept connections
    $start = microtime(true);
    while (microtime(true) - $start < 3.5) {
        usleep(100000); // 100ms
        if (file_exists($sock)) {
            $test = @stream_socket_client("unix://" . $sock, $errno, $errstr, 0.2);
            if ($test) {
                fclose($test);
                return true;
            }
        }
    }

    return false;
}

if (!ensure_backend_alive($sock)) {
    http_response_code(503);
    header("Content-Type: application/json");
    echo json_encode(["error" => "Backend server is starting up, please try again in a few seconds."]);
    exit;
}

$uri = $_SERVER["REQUEST_URI"] ?? "/api";
$method = $_SERVER["REQUEST_METHOD"] ?? "GET";

// Forward request headers
$headers = [];
$found_auth = false;

if (function_exists("getallheaders")) {
    foreach (getallheaders() as $key => $val) {
        $lkey = strtolower($key);
        if ($lkey === "authorization") $found_auth = true;
        if ($lkey !== "host" && $lkey !== "content-length") {
            $headers[] = "$key: $val";
        }
    }
}

if (!$found_auth) {
    $auth = $_SERVER["HTTP_AUTHORIZATION"] ?? $_SERVER["REDIRECT_HTTP_AUTHORIZATION"] ?? null;
    if (!$auth && function_exists("apache_request_headers")) {
        $arh = apache_request_headers();
        $auth = $arh["Authorization"] ?? $arh["authorization"] ?? null;
    }
    if ($auth) {
        $headers[] = "Authorization: " . $auth;
    }
}

if (!empty($_SERVER["CONTENT_TYPE"])) {
    $headers[] = "Content-Type: " . $_SERVER["CONTENT_TYPE"];
}

$body = null;
if (in_array($method, ["POST", "PUT", "PATCH", "DELETE"])) {
    $body = file_get_contents("php://input");
}

function execute_proxy_request($uri, $sock, $method, $headers, $body) {
    $ch = curl_init("http://localhost" . $uri);
    curl_setopt($ch, CURLOPT_UNIX_SOCKET_PATH, $sock);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 120);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    $response = curl_exec($ch);
    $curl_err = curl_error($ch);
    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        "response" => $response,
        "error" => $curl_err,
        "header_size" => $header_size,
        "http_code" => $http_code
    ];
}

$res = execute_proxy_request($uri, $sock, $method, $headers, $body);

// If curl failed to connect, attempt self-healing restart once and retry
if ($res["response"] === false) {
    if (ensure_backend_alive($sock)) {
        $res = execute_proxy_request($uri, $sock, $method, $headers, $body);
    }
}

if ($res["response"] === false) {
    http_response_code(502);
    header("Content-Type: application/json");
    echo json_encode(["error" => "Proxy error: " . $res["error"]]);
    exit;
}

http_response_code($res["http_code"]);

$header_text = substr($res["response"], 0, $res["header_size"]);
$resp_body = substr($res["response"], $res["header_size"]);

$header_lines = explode("\r\n", $header_text);
foreach ($header_lines as $line) {
    if (stripos($line, "Content-Type:") === 0 || stripos($line, "Content-Disposition:") === 0) {
        header($line);
    }
}

echo $resp_body;

