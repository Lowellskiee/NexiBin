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
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('user')->after('remember_token');
            $table->integer('points')->default(0)->after('role');

            $table->string('student_number')->nullable()->after('points');
            $table->string('course')->nullable()->after('student_number');
            $table->string('year_level')->nullable()->after('course');
            $table->string('section')->nullable()->after('year_level');

            $table->string('profile_photo')->nullable()->after('section');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'role',
                'points',
                'student_number',
                'course',
                'year_level',
                'section',
                'profile_photo',
            ]);

        });
    }
};
