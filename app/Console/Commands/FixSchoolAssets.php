<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\School;
use Illuminate\Support\Facades\Storage;

class FixSchoolAssets extends Command
{
    protected $signature = 'app:fix-school-assets';
    protected $description = 'Generate placeholder logos and banners for schools';

    public function handle()
    {
        $schools = School::all();

        foreach ($schools as $school) {
            $this->info("Checking assets for: {$school->name}");

            // Logo
            if (!$school->logo || !Storage::disk('public')->exists($school->logo)) {
                $logoPath = 'schools/logos/placeholder_' . $school->id . '.png';
                $this->createPlaceholder($school->name, 200, 200, storage_path("app/public/{$logoPath}"));
                $school->logo = $logoPath;
                $this->line(" - Generated logo: {$logoPath}");
            }

            // Banner
            if (!$school->school_banner || !Storage::disk('public')->exists($school->school_banner)) {
                $bannerPath = 'schools/banners/placeholder_' . $school->id . '.png';
                $this->createPlaceholder($school->name . ' - Welcome to our store', 1200, 400, storage_path("app/public/{$bannerPath}"), true);
                $school->school_banner = $bannerPath;
                $this->line(" - Generated banner: {$bannerPath}");
            }

            $school->save();
        }

        $this->info('All school assets have been checked and placeholders generated where missing.');
    }

    private function createPlaceholder($text, $width, $height, $path, $isBanner = false)
    {
        $dir = dirname($path);
        if (!file_exists($dir)) {
            mkdir($dir, 0755, true);
        }

        $image = imagecreate($width, $height);

        // Use consistent but different colors for each school based on ID
        // Or just random for variety
        $bg = imagecolorallocate($image, rand(50, 150), rand(50, 150), rand(150, 255));
        $textColor = imagecolorallocate($image, 255, 255, 255);

        // GD internal font (1-5)
        $font = 5;

        $textWidth = imagefontwidth($font) * strlen($text);
        $textHeight = imagefontheight($font);

        $x = ($width - $textWidth) / 2;
        $y = ($height - $textHeight) / 2;

        imagestring($image, $font, $x, $y, $text, $textColor);

        imagepng($image, $path);
        imagedestroy($image);
    }
}
