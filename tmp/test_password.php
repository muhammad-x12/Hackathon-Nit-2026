<?php

use Illuminate\Support\Facades\Hash;

$u = App\Models\User::where('email', 'testsupplier2@temp.com')->first();

if ($u) {
    $u->password = 'testpass123';
    $u->save();
    echo 'Password set.' . PHP_EOL;

    $fresh = $u->fresh();
    echo 'Verify: ' . (Hash::check('testpass123', $fresh->password) ? 'SUCCESS' : 'FAILED') . PHP_EOL;
} else {
    echo 'User not found for testsupplier2@temp.com' . PHP_EOL;
}
