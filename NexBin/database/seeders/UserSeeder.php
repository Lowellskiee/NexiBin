<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $courses = [
            "BSCS","BSIT","BSN","BSCE","BSEE","BSME","BSECE","BSABE",
            "BSA","BSFT","BSBio","BSChem","BSMath","BSPhy",
            "BSAcct","BSBA-MM","BSBA-FM","BSBA-HRM",
            "BSHM","BSTM",
            "BEEd","BSEd-Eng","BSEd-Math","BSEd-Sci","BSEd-Fil",
            "BSIndTech",
            "BAComm","BAPolSci","BAPsych","BASoc",
            "BSF"
        ];

        $yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
        $sections = ["A", "B", "C"];

        for ($i = 1; $i <= 50; $i++) {

            $course = $courses[array_rand($courses)];
            $yearIndex = array_rand($yearLevels);
            $year = $yearLevels[$yearIndex];

            // Extract numeric year (1,2,3,4)
            $yearNumber = $yearIndex + 1;

            // Auto section
            $sectionLetter = $sections[array_rand($sections)];
            $section = "{$course} {$yearNumber}{$sectionLetter}";

            $studentNumber = "25-" . str_pad($i, 6, "0", STR_PAD_LEFT);

            $username = strtolower($course) . $i;

            User::create([
                'name' => $username,
                'email' => $username . '@gmail.com',
                'student_number' => $studentNumber,
                'year_level' => $year,
                'course' => $course,
                'section' => $section,
                'password' => Hash::make('123456789'),
            ]);
        }
    }
}