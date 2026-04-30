<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ─── BIN LEVELS ────────────────────────────────────────────
        // Stores ultrasonic sensor readings from Arduino every 5 seconds.
        // Each row is a snapshot of all 3 bin fill percentages (0–100).
        // collected_at: set when staff marks a bin as collected — triggers
        // a 30-second cooldown so Arduino readings don't overwrite the zero.
        Schema::create('bin_levels', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('metallic')->default(0);  // 0–100 %
            $table->unsignedTinyInteger('wet')->default(0);       // 0–100 %
            $table->unsignedTinyInteger('dry')->default(0);       // 0–100 %
            $table->timestamp('collected_at')->nullable();         // null = normal reading, set = post-collection zero
            $table->timestamps();
        });

        // ─── BIN ALERTS ────────────────────────────────────────────
        // Created automatically when a bin crosses warning (50%) or
        // critical (80%) threshold. Resolved manually by staff or
        // automatically when the level drops back below the threshold.
        Schema::create('bin_alerts', function (Blueprint $table) {
            $table->id();
            $table->enum('bin_type', ['metallic', 'wet', 'dry']);  // which bin triggered
            $table->unsignedTinyInteger('level_at_alert');          // fill % when alert fired
            $table->enum('severity', ['warning', 'critical']);      // warning ≥50% | critical ≥80%
            $table->boolean('resolved')->default(false);            // false = still active
            $table->timestamp('resolved_at')->nullable();           // set when resolved
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bin_alerts');
        Schema::dropIfExists('bin_levels');
    }
};