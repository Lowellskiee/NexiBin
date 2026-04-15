<?php
// database/migrations/xxxx_create_trash_tokens_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trash_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('token', 10)->unique();
            $table->string('type')->default('general');
            $table->integer('points')->default(20);
            $table->foreignId('claimed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('claimed_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trash_tokens');
    }
};