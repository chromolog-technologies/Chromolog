<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed initial admin user account for Chromolog Command Center
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@chromologtechnologies.com'],
            [
                'name' => 'Chromolog Administrator',
                'email' => 'admin@chromologtechnologies.com',
                'password' => Hash::make('admin123'),
                'email_verified_at' => now(),
            ]
        );
    }
}
