<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('collection_logs', function (Blueprint $table) {
            $table->id();
            $table->string('bin');
            $table->string('location');
            $table->string('bin_type'); // wet dry metallic
            $table->foreignId('staff_id')->constrained('users');
            $table->timestamp('collected_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('collection_logs');
    }
};
