<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('collection_logs', function (Blueprint $table) {
            $table->dropForeign(['staff_id']);
            $table->foreign('staff_id')
                  ->references('id')->on('users')
                  ->onDelete('cascade');  // ← this is the fix
        });
    }

    public function down(): void
    {
        Schema::table('collection_logs', function (Blueprint $table) {
            $table->dropForeign(['staff_id']);
            $table->foreign('staff_id')
                  ->references('id')->on('users');
        });
    }
};