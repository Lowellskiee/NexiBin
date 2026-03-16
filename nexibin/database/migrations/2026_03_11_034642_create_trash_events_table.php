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
        Schema::create('trash_events', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // wet dry metallic
            $table->integer('points');
            $table->string('token')->unique();
            $table->boolean('is_claimed')->default(false);
            $table->timestamps();
        });
    }   

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trash_events');
    }
};
