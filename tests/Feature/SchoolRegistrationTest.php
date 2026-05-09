<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SchoolRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
    }

    public function test_school_can_register()
    {
        $response = $this->postJson('/api/auth/register-school', [
            'school_name' => 'Greenwood High',
            'subdomain' => 'greenwood',
            'admin_name' => 'Principal Skinner',
            'admin_email' => 'principal@greenwood.edu',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'school', 'token']);

        $this->assertDatabaseHas('schools', ['subdomain' => 'greenwood']);
        $this->assertDatabaseHas('users', ['email' => 'principal@greenwood.edu']);
    }

    public function test_school_admin_can_update_profile_with_logo()
    {
        Storage::fake('public');

        // Register School
        $registerResponse = $this->postJson('/api/auth/register-school', [
            'school_name' => 'Greenwood High',
            'subdomain' => 'greenwood',
            'admin_name' => 'Principal Skinner',
            'admin_email' => 'principal@greenwood.edu',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $token = $registerResponse->json('token');

        // Update Profile
        $file = UploadedFile::fake()->image('logo.jpg');

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'X-Test-Subdomain' => 'greenwood' // Need to resolve school
        ])
            ->postJson('/api/school/profile', [
                'name' => 'Greenwood International',
                'logo' => $file,
                'theme_color' => '#123456'
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('school.name', 'Greenwood International');

        // Assert file stored
        // Assert file stored
        $school = \App\Models\School::where('subdomain', 'greenwood')->first();
        Storage::disk('public')->assertExists($school->logo);
    }
}
