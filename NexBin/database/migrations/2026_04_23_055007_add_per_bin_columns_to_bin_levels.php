<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bin_levels', function (Blueprint $table) {
            // Only adding peak columns — the *_collected_at columns
            // already exist from 2026_04_22_175432_add_per_bin_collection...
            $table->unsignedTinyInteger('metallic_peak')->default(0)->after('dry');
            $table->unsignedTinyInteger('wet_peak')->default(0)->after('metallic_peak');
            $table->unsignedTinyInteger('dry_peak')->default(0)->after('wet_peak');
        });
    }

    public function down(): void
    {
        Schema::table('bin_levels', function (Blueprint $table) {
            $table->dropColumn(['metallic_peak', 'wet_peak', 'dry_peak']);
        });
    }
};