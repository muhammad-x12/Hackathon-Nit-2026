<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class DatabaseBackup extends Command
{
    protected $signature = 'database:backup';
    protected $description = 'Backup the database';

    public function handle()
    {
        $filename = "backup-" . date('Y-m-d') . ".sql";
        $path = storage_path("app/backups/" . $filename);

        // Ensure directory exists
        if (!file_exists(storage_path("app/backups"))) {
            mkdir(storage_path("app/backups"), 0755, true);
        }

        $command = sprintf(
            'mysqldump --user=%s --password=%s --host=%s %s > %s',
            config('database.connections.mysql.username'),
            config('database.connections.mysql.password'),
            config('database.connections.mysql.host'),
            config('database.connections.mysql.database'),
            $path
        );

        $this->info("Starting backup...");
        $returnVar = null;
        $output = null;
        exec($command, $output, $returnVar);

        if ($returnVar === 0) {
            $this->info("Backup successful: " . $filename);
        } else {
            $this->error("Backup failed.");
        }
    }
}
