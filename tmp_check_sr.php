<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$email = 'digontomindia@gmail.com';
$password = 'cXo#H1t#k6tS%*QsZbSRMm9J*f!VUnKr';

$response = \Illuminate\Support\Facades\Http::post('https://apiv2.shiprocket.in/v1/external/auth/login', [
    'email' => $email,
    'password' => $password,
]);

echo "Status: " . $response->status() . "\n";
print_r($response->json());
