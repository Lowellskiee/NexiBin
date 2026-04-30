<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds per-bin collection tracking columns to bin_levels.
 *
 * Why three separate columns instead of a JSON blob?
 *  – Easier to index, query, and reason about in PHP.
 *  – Each bin has an independent cooldown lifecycle.
 *
 * New columns
 * ───────────
 * metallic_collected_at  – timestamp of the last metallic collection event
 * wet_collected_at       – timestamp of the last wet collection event
 * dry_collected_at       – timestamp of the last dry collection event
 *
 * The existing `collected_at` column is kept for backward-compat and used as
 * a "global" event marker (e.g. the Arduino-blocker cooldown logic already
 * relies on it).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bin_levels', function (Blueprint $table) {
            $table->timestamp('metallic_collected_at')->nullable()->after('collected_at');
            $table->timestamp('wet_collected_at')->nullable()->after('metallic_collected_at');
            $table->timestamp('dry_collected_at')->nullable()->after('wet_collected_at');
        });
    }

    public function down(): void
    {
        Schema::table('bin_levels', function (Blueprint $table) {
            $table->dropColumn(['metallic_collected_at', 'wet_collected_at', 'dry_collected_at']);
        });
    }
};
