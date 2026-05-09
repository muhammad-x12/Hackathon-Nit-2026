<?php

// Test script to verify School and Supplier endpoints with email/password

// Test data
$testCases = [
    'Create School' => [
        'url' => 'http://localhost:8000/api/admin/create-school',
        'method' => 'POST',
        'data' => [
            'name' => 'Test School',
            'email' => 'testschool@example.com',
            'password' => 'password123',
            'subdomain' => 'testschool',
            'commission_percentage' => 5.5
        ]
    ],
    'Create Supplier' => [
        'url' => 'http://localhost:8000/api/admin/create-supplier',
        'method' => 'POST',
        'data' => [
            'name' => 'Test Supplier',
            'email' => 'testsupplier@example.com',
            'password' => 'password123',
            'contact_info' => 'Test contact info'
        ]
    ],
    'Update School' => [
        'url' => 'http://localhost:8000/api/admin/school/1',
        'method' => 'PUT',
        'data' => [
            'name' => 'Updated School',
            'email' => 'updated@example.com',
            'password' => 'newpassword123',
            'subdomain' => 'updated',
            'contact_info' => json_encode(['phone' => '123-456-7890'])
        ]
    ],
    'Update Supplier' => [
        'url' => 'http://localhost:8000/api/admin/supplier/1',
        'method' => 'PUT',
        'data' => [
            'name' => 'Updated Supplier',
            'email' => 'updatedsupplier@example.com',
            'password' => 'newpassword123',
            'contact_info' => json_encode(['phone' => '123-456-7890'])
        ]
    ]
];

echo "=== School and Supplier API Endpoints Test Cases ===\n\n";

foreach ($testCases as $testName => $testCase) {
    echo "Test: {$testName}\n";
    echo "URL: {$testCase['url']}\n";
    echo "Method: {$testCase['method']}\n";
    echo "Payload:\n";
    echo json_encode($testCase['data'], JSON_PRETTY_PRINT) . "\n";
    echo str_repeat('-', 60) . "\n\n";
}

echo "\n=== Required Fields ===\n\n";
echo "School Creation:\n";
echo "- name (required)\n";
echo "- email (required, unique)\n";
echo "- password (required, min 8 characters)\n";
echo "- subdomain (required, unique)\n";
echo "- commission_percentage (required, 0-100)\n\n";

echo "Supplier Creation:\n";
echo "- name (required)\n";
echo "- email (required, unique)\n";
echo "- password (required, min 8 characters)\n";
echo "- contact_info (optional)\n\n";

echo "School Update:\n";
echo "- name (required)\n";
echo "- email (required, unique)\n";
echo "- password (optional, min 8 characters if provided)\n";
echo "- subdomain (required, unique)\n";
echo "- contact_info (required, JSON format)\n\n";

echo "Supplier Update:\n";
echo "- name (required)\n";
echo "- email (required, unique)\n";
echo "- password (optional, min 8 characters if provided)\n";
echo "- contact_info (required, JSON format)\n\n";
