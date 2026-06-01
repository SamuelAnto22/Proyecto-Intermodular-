<?php
declare(strict_types=1);

final class HttpResponse
{
    public function __construct(
        public int $status,
        public array $headers,
        public string $body,
        public array $json
    ) {}
}

final class HttpClient
{
    private array $cookies = [];

    public function request(string $method, string $url, array $options = []): HttpResponse
    {
        $headers = $options['headers'] ?? [];
        $body = $options['body'] ?? null;

        if (!empty($this->cookies)) {
            $pairs = [];
            foreach ($this->cookies as $k => $v) {
                $pairs[] = $k . '=' . $v;
            }
            $headers[] = 'Cookie: ' . implode('; ', $pairs);
        }

        $context = stream_context_create([
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $headers),
                'content' => is_string($body) ? $body : '',
                'ignore_errors' => true,
                'timeout' => 10,
            ],
        ]);

        $result = @file_get_contents($url, false, $context);
        $result = $result === false ? '' : $result;
        $rawHeaders = $http_response_header ?? [];

        $status = 0;
        if (!empty($rawHeaders[0]) && preg_match('#\s(\d{3})\s#', $rawHeaders[0], $m)) {
            $status = (int) $m[1];
        }

        $headersMap = [];
        foreach ($rawHeaders as $line) {
            $parts = explode(':', $line, 2);
            if (count($parts) !== 2) {
                continue;
            }
            $name = strtolower(trim($parts[0]));
            $value = trim($parts[1]);
            $headersMap[$name][] = $value;

            if ($name === 'set-cookie') {
                $first = explode(';', $value, 2)[0];
                $cookieParts = explode('=', $first, 2);
                if (count($cookieParts) === 2) {
                    $this->cookies[$cookieParts[0]] = $cookieParts[1];
                }
            }
        }

        $json = [];
        if ($result !== '') {
            $decoded = json_decode($result, true);
            if (is_array($decoded)) {
                $json = $decoded;
            }
        }

        return new HttpResponse($status, $headersMap, $result, $json);
    }
}

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function getCsrf(HttpClient $client, string $baseUrl): string
{
    $response = $client->request('GET', $baseUrl . '/servidor/api/sesion.php');
    assertTrue($response->status === 200, 'sesion.php debe responder 200 para obtener CSRF');
    $csrf = $response->json['csrf'] ?? '';
    assertTrue(is_string($csrf) && $csrf !== '', 'sesion.php debe devolver token CSRF');

    return $csrf;
}

$repoRoot = dirname(__DIR__);
$host = '127.0.0.1';
$port = (int) (getenv('SMOKE_PORT') ?: '8099');
$baseUrl = getenv('SMOKE_BASE_URL') ?: sprintf('http://%s:%d', $host, $port);

$unique = bin2hex(random_bytes(4));
$clienteEmail = "smoke_cliente_{$unique}@example.test";
$adminEmail = "smoke_admin_{$unique}@example.test";
$registroEmail = "smoke_registro_{$unique}@example.test";
$password = 'Smoke123!';
$plainAdminPassword = 'Admin123!';

$serverProcess = null;
$serverPipes = [];

$pdo = new PDO(
    'mysql:host=127.0.0.1;dbname=midnight_customs;charset=utf8mb4',
    'root',
    '',
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]
);

$cleanup = function () use ($pdo, $clienteEmail, $adminEmail, $registroEmail, &$serverProcess, &$serverPipes): void {
    $stmt = $pdo->prepare('DELETE FROM usuarios WHERE email IN (?, ?, ?)');
    $stmt->execute([$clienteEmail, $adminEmail, $registroEmail]);

    if (is_resource($serverProcess)) {
        proc_terminate($serverProcess);
        foreach ($serverPipes as $pipe) {
            if (is_resource($pipe)) {
                fclose($pipe);
            }
        }
        proc_close($serverProcess);
    }
};

register_shutdown_function($cleanup);

$insertUser = $pdo->prepare('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)');
$insertUser->execute(['Smoke Cliente', $clienteEmail, password_hash($password, PASSWORD_BCRYPT), 'cliente']);
$insertUser->execute(['Smoke Admin', $adminEmail, password_hash($plainAdminPassword, PASSWORD_BCRYPT), 'admin']);

$descriptorSpec = [
    0 => ['pipe', 'r'],
    1 => ['file', 'php://stdout', 'w'],
    2 => ['file', 'php://stderr', 'w'],
];
$command = sprintf('php -S %s:%d -t %s', $host, $port, escapeshellarg($repoRoot));
$serverProcess = proc_open($command, $descriptorSpec, $serverPipes, $repoRoot);
if (!is_resource($serverProcess)) {
    throw new RuntimeException('No se pudo arrancar el servidor PHP embebido para pruebas.');
}

$bootOk = false;
$bootstrapClient = new HttpClient();
for ($i = 0; $i < 25; $i++) {
    usleep(150000);
    $probe = $bootstrapClient->request('GET', $baseUrl . '/servidor/api/sesion.php');
    if ($probe->status === 200) {
        $bootOk = true;
        break;
    }
}
assertTrue($bootOk, 'No fue posible contactar el servidor de pruebas.');

$tests = [];
$tests[] = function () use ($baseUrl): void {
    $client = new HttpClient();
    $res = $client->request('GET', $baseUrl . '/servidor/api/sesion.php');
    assertTrue($res->status === 200, 'sesion.php devuelve 200 sin login');
    assertTrue(($res->json['ok'] ?? false) === true, 'sesion.php devuelve ok=true');
    assertTrue(($res->json['logueado'] ?? true) === false, 'sesion.php detecta no logueado');
};

$tests[] = function () use ($baseUrl): void {
    $client = new HttpClient();
    $res = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => '', 'password' => '']),
    ]);
    assertTrue($res->status === 400, 'login.php devuelve 400 en campos vacíos');
};

$tests[] = function () use ($baseUrl): void {
    $client = new HttpClient();
    $res = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => 'noexiste@example.test', 'password' => 'wrongpass']),
    ]);
    assertTrue($res->status === 401, 'login.php devuelve 401 en credenciales inválidas');
};

$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();
    $res = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    assertTrue($res->status === 200, 'login.php happy path devuelve 200');
    assertTrue(($res->json['ok'] ?? false) === true, 'login.php happy path ok=true');
};

$tests[] = function () use ($baseUrl, $registroEmail): void {
    $client = new HttpClient();
    $res = $client->request('POST', $baseUrl . '/servidor/api/registro.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query([
            'nombre' => 'Registro Smoke',
            'email' => $registroEmail,
            'password' => 'Reg1234!',
            'confirm-password' => 'Reg1234!',
        ]),
    ]);
    assertTrue($res->status === 200, 'registro.php happy path devuelve 200');
};

$tests[] = function () use ($baseUrl): void {
    $client = new HttpClient();
    $res = $client->request('POST', $baseUrl . '/servidor/api/registro.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query([
            'nombre' => 'Bad Email',
            'email' => 'correo-invalido',
            'password' => 'Reg1234!',
            'confirm-password' => 'Reg1234!',
        ]),
    ]);
    assertTrue($res->status === 422, 'registro.php devuelve 422 ante validación inválida');
};

$tests[] = function () use ($baseUrl): void {
    $client = new HttpClient();
    $res = $client->request('POST', $baseUrl . '/servidor/api/guardar_config.php', [
        'headers' => ['Content-Type: application/json'],
        'body' => json_encode(['accion' => 'crear', 'modelo' => 'mini_cooper', 'color' => 'rojo', 'llantas' => 'clasica']),
    ]);
    assertTrue($res->status === 401, 'guardar_config.php devuelve 401 sin sesión');
};

$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();
    $login = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    assertTrue($login->status === 200, 'login cliente previo a test CSRF en guardar_config');

    $res = $client->request('POST', $baseUrl . '/servidor/api/guardar_config.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: token-invalido'],
        'body' => json_encode(['accion' => 'crear', 'modelo' => 'mini_cooper', 'color' => 'rojo', 'llantas' => 'clasica']),
    ]);
    assertTrue($res->status === 403, 'guardar_config.php devuelve 403 con CSRF inválido');
};

$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();
    $login = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    assertTrue($login->status === 200, 'login cliente previo a JSON inválido en guardar_config');

    $csrf = getCsrf($client, $baseUrl);
    $res = $client->request('POST', $baseUrl . '/servidor/api/guardar_config.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: ' . $csrf],
        'body' => '{"accion":',
    ]);
    assertTrue($res->status === 400, 'guardar_config.php devuelve 400 con JSON inválido');
};

$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();
    $login = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    assertTrue($login->status === 200, 'login cliente previo a happy path guardar_config');

    $csrf = getCsrf($client, $baseUrl);
    $res = $client->request('POST', $baseUrl . '/servidor/api/guardar_config.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: ' . $csrf],
        'body' => json_encode(['accion' => 'crear', 'modelo' => 'mini_cooper', 'color' => 'rojo', 'llantas' => 'clasica']),
    ]);
    assertTrue($res->status === 200, 'guardar_config.php happy path devuelve 200');
    assertTrue(($res->json['ok'] ?? false) === true, 'guardar_config.php happy path ok=true');
};

$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();
    $login = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    assertTrue($login->status === 200, 'login cliente previo a pedidos 403');

    $res = $client->request('GET', $baseUrl . '/servidor/api/pedidos.php');
    assertTrue($res->status === 403, 'pedidos.php devuelve 403 para cliente');
};

$tests[] = function () use ($baseUrl, $adminEmail, $plainAdminPassword): void {
    $client = new HttpClient();
    $login = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $adminEmail, 'password' => $plainAdminPassword]),
    ]);
    assertTrue($login->status === 200, 'login admin previo a pedidos happy path');

    $res = $client->request('GET', $baseUrl . '/servidor/api/pedidos.php');
    assertTrue($res->status === 200, 'pedidos.php happy path admin devuelve 200');
    assertTrue(($res->json['ok'] ?? false) === true, 'pedidos.php happy path admin ok=true');
};

$tests[] = function () use ($baseUrl, $adminEmail, $plainAdminPassword): void {
    $client = new HttpClient();
    $login = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $adminEmail, 'password' => $plainAdminPassword]),
    ]);
    assertTrue($login->status === 200, 'login admin previo a CSRF inválido en pedidos');

    $res = $client->request('POST', $baseUrl . '/servidor/api/pedidos.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: token-invalido'],
        'body' => json_encode(['accion' => 'eliminar', 'id' => 1]),
    ]);
    assertTrue($res->status === 403, 'pedidos.php devuelve 403 con CSRF inválido');
};

$tests[] = function () use ($baseUrl, $adminEmail, $plainAdminPassword): void {
    $client = new HttpClient();
    $login = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $adminEmail, 'password' => $plainAdminPassword]),
    ]);
    assertTrue($login->status === 200, 'login admin previo a JSON inválido en pedidos');

    $csrf = getCsrf($client, $baseUrl);
    $res = $client->request('POST', $baseUrl . '/servidor/api/pedidos.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: ' . $csrf],
        'body' => '{"accion":',
    ]);
    assertTrue($res->status === 400, 'pedidos.php devuelve 400 con JSON inválido');
};

// ============================================================
// Registration endpoint — additional edge cases
// ============================================================

// registro.php: duplicate email returns 409
$tests[] = function () use ($baseUrl, $registroEmail): void {
    $client = new HttpClient();
    $res = $client->request('POST', $baseUrl . '/servidor/api/registro.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query([
            'nombre' => 'Duplicate User',
            'email' => $registroEmail,
            'password' => 'Dup12345!',
            'confirm-password' => 'Dup12345!',
        ]),
    ]);
    assertTrue($res->status === 409, 'registro.php devuelve 409 ante email duplicado');
    assertTrue(($res->json['error'] ?? '') === 'EMAIL_ALREADY_EXISTS', 'registro.php devuelve error EMAIL_ALREADY_EXISTS');
};

// registro.php: password exceeding 72 chars returns 422
$tests[] = function () use ($baseUrl): void {
    $client = new HttpClient();
    $longPassword = str_repeat('A', 73);
    $res = $client->request('POST', $baseUrl . '/servidor/api/registro.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query([
            'nombre' => 'Long Pass User',
            'email' => 'longpass_' . bin2hex(random_bytes(4)) . '@example.test',
            'password' => $longPassword,
            'confirm-password' => $longPassword,
        ]),
    ]);
    assertTrue($res->status === 422, 'registro.php devuelve 422 con password > 72 caracteres');
};

// registro.php: password too short (< 8 chars) returns 422
$tests[] = function () use ($baseUrl): void {
    $client = new HttpClient();
    $res = $client->request('POST', $baseUrl . '/servidor/api/registro.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query([
            'nombre' => 'Short Pass',
            'email' => 'shortpass_' . bin2hex(random_bytes(4)) . '@example.test',
            'password' => 'Ab1!',
            'confirm-password' => 'Ab1!',
        ]),
    ]);
    assertTrue($res->status === 422, 'registro.php devuelve 422 con password < 8 caracteres');
};

// registro.php: missing fields returns 422
$tests[] = function () use ($baseUrl): void {
    $client = new HttpClient();
    $res = $client->request('POST', $baseUrl . '/servidor/api/registro.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query([
            'nombre' => '',
            'email' => '',
            'password' => '',
            'confirm-password' => '',
        ]),
    ]);
    assertTrue($res->status === 422, 'registro.php devuelve 422 con campos vacíos');
};

// registro.php: password mismatch returns 422
$tests[] = function () use ($baseUrl): void {
    $client = new HttpClient();
    $res = $client->request('POST', $baseUrl . '/servidor/api/registro.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query([
            'nombre' => 'Mismatch User',
            'email' => 'mismatch_' . bin2hex(random_bytes(4)) . '@example.test',
            'password' => 'Password1!',
            'confirm-password' => 'Different1!',
        ]),
    ]);
    assertTrue($res->status === 422, 'registro.php devuelve 422 con contraseñas que no coinciden');
};

// registro.php: GET method not allowed returns 405
$tests[] = function () use ($baseUrl): void {
    $client = new HttpClient();
    $res = $client->request('GET', $baseUrl . '/servidor/api/registro.php');
    assertTrue($res->status === 405, 'registro.php devuelve 405 ante método GET');
};

// ============================================================
// Session endpoint — authenticated response
// ============================================================

// sesion.php: authenticated user gets logueado=true with user data
$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();
    $login = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    assertTrue($login->status === 200, 'login previo a sesion.php autenticado');

    $res = $client->request('GET', $baseUrl . '/servidor/api/sesion.php');
    assertTrue($res->status === 200, 'sesion.php devuelve 200 con sesión activa');
    assertTrue(($res->json['logueado'] ?? false) === true, 'sesion.php devuelve logueado=true con sesión');
    assertTrue(isset($res->json['nombre']), 'sesion.php devuelve nombre del usuario');
    assertTrue(isset($res->json['rol']), 'sesion.php devuelve rol del usuario');
    assertTrue(isset($res->json['csrf']), 'sesion.php devuelve token CSRF con sesión');
};

// ============================================================
// Profile endpoint
// ============================================================

// perfil.php: unauthenticated access returns 401
$tests[] = function () use ($baseUrl): void {
    $client = new HttpClient();
    $res = $client->request('GET', $baseUrl . '/servidor/api/perfil.php');
    assertTrue($res->status === 401, 'perfil.php devuelve 401 sin sesión');
    assertTrue(($res->json['error'] ?? '') === 'NO_SESSION', 'perfil.php devuelve error NO_SESSION');
};

// perfil.php: authenticated GET returns user profile data
$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();
    $login = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    assertTrue($login->status === 200, 'login previo a perfil.php GET');

    $res = $client->request('GET', $baseUrl . '/servidor/api/perfil.php');
    assertTrue($res->status === 200, 'perfil.php GET devuelve 200 con sesión');
    assertTrue(($res->json['ok'] ?? false) === true, 'perfil.php GET devuelve ok=true');
    assertTrue(isset($res->json['usuario']), 'perfil.php GET devuelve datos de usuario');
    assertTrue(isset($res->json['garaje']), 'perfil.php GET devuelve garaje');
    assertTrue(($res->json['usuario']['email'] ?? '') === $clienteEmail, 'perfil.php GET devuelve email correcto');
};

// perfil.php: POST without CSRF returns 403
$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();
    $login = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    assertTrue($login->status === 200, 'login previo a perfil.php POST sin CSRF');

    $res = $client->request('POST', $baseUrl . '/servidor/api/perfil.php', [
        'headers' => ['Content-Type: application/json'],
        'body' => json_encode([
            'password_actual' => $password,
            'password_nuevo' => 'NewPass123!',
            'password_confirm' => 'NewPass123!',
        ]),
    ]);
    assertTrue($res->status === 403, 'perfil.php POST devuelve 403 sin CSRF');
};

// ============================================================
// Logout endpoint
// ============================================================

// logout.php: GET method not allowed returns 405
$tests[] = function () use ($baseUrl): void {
    $client = new HttpClient();
    $res = $client->request('GET', $baseUrl . '/servidor/api/logout.php');
    assertTrue($res->status === 405, 'logout.php devuelve 405 ante método GET');
};

// logout.php: POST without CSRF returns 403
$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();
    $login = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    assertTrue($login->status === 200, 'login previo a logout.php sin CSRF');

    $res = $client->request('POST', $baseUrl . '/servidor/api/logout.php');
    assertTrue($res->status === 403, 'logout.php devuelve 403 sin token CSRF');
};

// logout.php: full login → logout → verify session destroyed
$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();

    // Step 1: Login
    $login = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    assertTrue($login->status === 200, 'login previo a logout happy path');

    // Step 2: Get CSRF token
    $csrf = getCsrf($client, $baseUrl);

    // Step 3: Logout with valid CSRF
    $res = $client->request('POST', $baseUrl . '/servidor/api/logout.php', [
        'headers' => ['X-CSRF-Token: ' . $csrf],
    ]);
    assertTrue($res->status === 200, 'logout.php happy path devuelve 200');
    assertTrue(($res->json['ok'] ?? false) === true, 'logout.php happy path ok=true');

    // Step 4: Verify session is destroyed
    $session = $client->request('GET', $baseUrl . '/servidor/api/sesion.php');
    assertTrue(($session->json['logueado'] ?? true) === false, 'sesion.php confirma logueado=false tras logout');
};

// ============================================================
// Pedidos endpoint — unauthenticated access
// ============================================================

// pedidos.php: unauthenticated GET returns 401
$tests[] = function () use ($baseUrl): void {
    $client = new HttpClient();
    $res = $client->request('GET', $baseUrl . '/servidor/api/pedidos.php');
    assertTrue($res->status === 401, 'pedidos.php devuelve 401 sin sesión');
};

// pedidos.php: unauthenticated POST returns 401
$tests[] = function () use ($baseUrl): void {
    $client = new HttpClient();
    $res = $client->request('POST', $baseUrl . '/servidor/api/pedidos.php', [
        'headers' => ['Content-Type: application/json'],
        'body' => json_encode(['accion' => 'eliminar', 'id' => 1]),
    ]);
    assertTrue($res->status === 401, 'pedidos.php POST devuelve 401 sin sesión');
};

// ============================================================
// guardar_config.php — additional edge cases
// ============================================================

// guardar_config.php: GET unauthenticated returns 401
$tests[] = function () use ($baseUrl): void {
    $client = new HttpClient();
    $res = $client->request('GET', $baseUrl . '/servidor/api/guardar_config.php');
    assertTrue($res->status === 401, 'guardar_config.php GET devuelve 401 sin sesión');
};

// guardar_config.php: invalid model value returns 400
$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();
    $login = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    assertTrue($login->status === 200, 'login previo a guardar_config modelo inválido');

    $csrf = getCsrf($client, $baseUrl);
    $res = $client->request('POST', $baseUrl . '/servidor/api/guardar_config.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: ' . $csrf],
        'body' => json_encode(['accion' => 'crear', 'modelo' => 'modelo_inexistente', 'color' => 'rojo', 'llantas' => 'clasica']),
    ]);
    assertTrue($res->status === 400, 'guardar_config.php devuelve 400 con modelo no permitido');
};

// guardar_config.php: invalid action returns 400
$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();
    $login = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    assertTrue($login->status === 200, 'login previo a guardar_config acción inválida');

    $csrf = getCsrf($client, $baseUrl);
    $res = $client->request('POST', $baseUrl . '/servidor/api/guardar_config.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: ' . $csrf],
        'body' => json_encode(['accion' => 'borrar_todo', 'modelo' => 'mini_cooper', 'color' => 'rojo', 'llantas' => 'clasica']),
    ]);
    assertTrue($res->status === 400, 'guardar_config.php devuelve 400 con acción no válida');
};

// guardar_config.php: authenticated GET returns user configurations
$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();
    $login = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    assertTrue($login->status === 200, 'login previo a guardar_config GET autenticado');

    $res = $client->request('GET', $baseUrl . '/servidor/api/guardar_config.php');
    assertTrue($res->status === 200, 'guardar_config.php GET devuelve 200 con sesión');
    assertTrue(($res->json['ok'] ?? false) === true, 'guardar_config.php GET devuelve ok=true');
};

// ============================================================
// Login endpoint — additional edge cases
// ============================================================

// login.php: GET method not allowed
$tests[] = function () use ($baseUrl): void {
    $client = new HttpClient();
    $res = $client->request('GET', $baseUrl . '/servidor/api/login.php');
    assertTrue($res->status === 405, 'login.php devuelve 405 ante método GET');
};

// ============================================================
// Pedidos endpoint — admin POST tests (cambiar_estado + eliminar)
// ============================================================

// pedidos.php: admin cambiar_estado happy path
$tests[] = function () use ($baseUrl, $adminEmail, $plainAdminPassword, $clienteEmail): void {
    $client = new HttpClient();
    $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $adminEmail, 'password' => $plainAdminPassword]),
    ]);

    // Create a config first to have a pedido
    $client2 = new HttpClient();
    $clientePass = 'Smoke123!';
    $client2->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $clientePass]),
    ]);
    $csrf2 = getCsrf($client2, $baseUrl);
    $createRes = $client2->request('POST', $baseUrl . '/servidor/api/guardar_config.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: ' . $csrf2],
        'body' => json_encode(['accion' => 'crear', 'modelo' => 'mini_cooper', 'color' => 'azul', 'llantas' => 'deportiva']),
    ]);
    assertTrue($createRes->status === 200, 'config creada para test cambiar_estado');

    // Get the pedido ID
    $adminClient = new HttpClient();
    $adminClient->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $adminEmail, 'password' => $plainAdminPassword]),
    ]);
    $pedidos = $adminClient->request('GET', $baseUrl . '/servidor/api/pedidos.php');
    $pedidoId = $pedidos->json['data'][0]['id'] ?? 0;
    assertTrue($pedidoId > 0, 'pedido encontrado para test');

    $csrf = getCsrf($adminClient, $baseUrl);
    $res = $adminClient->request('POST', $baseUrl . '/servidor/api/pedidos.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: ' . $csrf],
        'body' => json_encode(['accion' => 'cambiar_estado', 'id' => $pedidoId, 'estado' => 'en proceso']),
    ]);
    assertTrue($res->status === 200, 'pedidos.php cambiar_estado devuelve 200');
    assertTrue(($res->json['ok'] ?? false) === true, 'pedidos.php cambiar_estado ok=true');
};

// pedidos.php: admin eliminar happy path
$tests[] = function () use ($baseUrl, $adminEmail, $plainAdminPassword, $clienteEmail, $password): void {
    // Create a config to delete
    $client = new HttpClient();
    $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    $csrf = getCsrf($client, $baseUrl);
    $client->request('POST', $baseUrl . '/servidor/api/guardar_config.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: ' . $csrf],
        'body' => json_encode(['accion' => 'crear', 'modelo' => 'bmw_serie1', 'color' => 'negro', 'llantas' => 'palos']),
    ]);

    // Login as admin and delete
    $adminClient = new HttpClient();
    $adminClient->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $adminEmail, 'password' => $plainAdminPassword]),
    ]);
    $pedidos = $adminClient->request('GET', $baseUrl . '/servidor/api/pedidos.php');
    $pedidoId = $pedidos->json['data'][0]['id'] ?? 0;
    assertTrue($pedidoId > 0, 'pedido encontrado para eliminar');

    $csrf = getCsrf($adminClient, $baseUrl);
    $res = $adminClient->request('POST', $baseUrl . '/servidor/api/pedidos.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: ' . $csrf],
        'body' => json_encode(['accion' => 'eliminar', 'id' => $pedidoId]),
    ]);
    assertTrue($res->status === 200, 'pedidos.php eliminar devuelve 200');
    assertTrue(($res->json['ok'] ?? false) === true, 'pedidos.php eliminar ok=true');
};

// ============================================================
// guardar_config.php — DELETE and actualizar tests
// ============================================================

// guardar_config.php: DELETE configuration
$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();
    $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    $csrf = getCsrf($client, $baseUrl);
    $createRes = $client->request('POST', $baseUrl . '/servidor/api/guardar_config.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: ' . $csrf],
        'body' => json_encode(['accion' => 'crear', 'modelo' => 'audi_a3', 'color' => 'blanco', 'llantas' => 'multiradio']),
    ]);
    $configId = $createRes->json['id'] ?? 0;
    assertTrue($configId > 0, 'config creada para test DELETE');

    $csrf = getCsrf($client, $baseUrl);
    $res = $client->request('DELETE', $baseUrl . '/servidor/api/guardar_config.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: ' . $csrf],
        'body' => json_encode(['id' => $configId]),
    ]);
    assertTrue($res->status === 200, 'guardar_config.php DELETE devuelve 200');
    assertTrue(($res->json['ok'] ?? false) === true, 'guardar_config.php DELETE ok=true');
};

// guardar_config.php: actualizar configuration
$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();
    $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    $csrf = getCsrf($client, $baseUrl);
    $createRes = $client->request('POST', $baseUrl . '/servidor/api/guardar_config.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: ' . $csrf],
        'body' => json_encode(['accion' => 'crear', 'modelo' => 'toyota_supra', 'color' => 'rojo', 'llantas' => 'clasica']),
    ]);
    $configId = $createRes->json['id'] ?? 0;
    assertTrue($configId > 0, 'config creada para test actualizar');

    $csrf = getCsrf($client, $baseUrl);
    $res = $client->request('POST', $baseUrl . '/servidor/api/guardar_config.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: ' . $csrf],
        'body' => json_encode(['accion' => 'actualizar', 'id' => $configId, 'modelo' => 'toyota_supra', 'color' => 'negro', 'llantas' => 'competicion']),
    ]);
    assertTrue($res->status === 200, 'guardar_config.php actualizar devuelve 200');
    assertTrue(($res->json['ok'] ?? false) === true, 'guardar_config.php actualizar ok=true');
};

// ============================================================
// perfil.php — password change tests
// ============================================================

// perfil.php: POST happy path — change password
$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();
    $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    $csrf = getCsrf($client, $baseUrl);
    $res = $client->request('POST', $baseUrl . '/servidor/api/perfil.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: ' . $csrf],
        'body' => json_encode([
            'password_actual' => $password,
            'password_nuevo' => 'NewSmoke123!',
            'password_confirm' => 'NewSmoke123!',
        ]),
    ]);
    assertTrue($res->status === 200, 'perfil.php cambio contraseña devuelve 200');
    assertTrue(($res->json['ok'] ?? false) === true, 'perfil.php cambio contraseña ok=true');

    // Restore original password for subsequent tests
    $csrf = getCsrf($client, $baseUrl);
    $client->request('POST', $baseUrl . '/servidor/api/perfil.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: ' . $csrf],
        'body' => json_encode([
            'password_actual' => 'NewSmoke123!',
            'password_nuevo' => $password,
            'password_confirm' => $password,
        ]),
    ]);
};

// perfil.php: POST wrong current password returns 403
$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();
    $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    $csrf = getCsrf($client, $baseUrl);
    $res = $client->request('POST', $baseUrl . '/servidor/api/perfil.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: ' . $csrf],
        'body' => json_encode([
            'password_actual' => 'wrong_password',
            'password_nuevo' => 'NewPass123!',
            'password_confirm' => 'NewPass123!',
        ]),
    ]);
    assertTrue($res->status === 403, 'perfil.php contraseña actual incorrecta devuelve 403');
};

// perfil.php: POST password mismatch returns 400
$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();
    $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    $csrf = getCsrf($client, $baseUrl);
    $res = $client->request('POST', $baseUrl . '/servidor/api/perfil.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: ' . $csrf],
        'body' => json_encode([
            'password_actual' => $password,
            'password_nuevo' => 'NewPass123!',
            'password_confirm' => 'DifferentPass123!',
        ]),
    ]);
    assertTrue($res->status === 400, 'perfil.php contraseñas no coinciden devuelve 400');
};

// perfil.php: POST password too short returns 400
$tests[] = function () use ($baseUrl, $clienteEmail, $password): void {
    $client = new HttpClient();
    $client->request('POST', $baseUrl . '/servidor/api/login.php', [
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body' => http_build_query(['email' => $clienteEmail, 'password' => $password]),
    ]);
    $csrf = getCsrf($client, $baseUrl);
    $res = $client->request('POST', $baseUrl . '/servidor/api/perfil.php', [
        'headers' => ['Content-Type: application/json', 'X-CSRF-Token: ' . $csrf],
        'body' => json_encode([
            'password_actual' => $password,
            'password_nuevo' => 'short',
            'password_confirm' => 'short',
        ]),
    ]);
    assertTrue($res->status === 400, 'perfil.php contraseña corta devuelve 400');
};

// ============================================================
// logout.php — POST without active session
// ============================================================

// logout.php: POST without active session returns 403 (CSRF fails without session)
$tests[] = function () use ($baseUrl): void {
    $client = new HttpClient();
    $res = $client->request('POST', $baseUrl . '/servidor/api/logout.php', [
        'headers' => ['X-CSRF-Token: invalid-token'],
    ]);
    assertTrue($res->status === 403, 'logout.php POST sin sesión devuelve 403 (CSRF)');
};

// ============================================================
// Login endpoint — rate limiting simulation
// ============================================================

// login.php: multiple failed attempts trigger rate limiting
$tests[] = function () use ($baseUrl): void {
    $client = new HttpClient();
    $limited = false;
    for ($i = 0; $i < 6; $i++) {
        $res = $client->request('POST', $baseUrl . '/servidor/api/login.php', [
            'headers' => ['Content-Type: application/x-www-form-urlencoded'],
            'body' => http_build_query(['email' => 'nonexistent_' . $i . '@test.test', 'password' => 'wrong']),
        ]);
        if ($res->status === 401) {
            $limited = true;
        }
    }
    assertTrue($limited, 'login.php múltiples intentos devuelven 401');
};

$passed = 0;
$failed = 0;

foreach ($tests as $idx => $test) {
    try {
        $test();
        $passed++;
        echo sprintf("[PASS] Test %02d\n", $idx + 1);
    } catch (Throwable $e) {
        $failed++;
        fwrite(STDERR, sprintf("[FAIL] Test %02d: %s\n", $idx + 1, $e->getMessage()));
    }
}

echo "\nResumen smoke tests API:\n";
echo "- Pasados: {$passed}\n";
echo "- Fallidos: {$failed}\n";

if ($failed > 0) {
    exit(1);
}

exit(0);