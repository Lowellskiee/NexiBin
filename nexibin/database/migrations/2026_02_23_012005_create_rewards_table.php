<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('rewards', function (Blueprint $table) {
            $table->id();
            $table->string('name');                 // Reward name
            $table->text('description')->nullable(); 
            $table->integer('points_required');     // Points needed
            $table->integer('stock')->default(0);   // Available quantity
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('rewards');
    }
};
