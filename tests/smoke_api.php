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
