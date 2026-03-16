<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RewardsSeeder extends Seeder
{
    public function run()
    {
        DB::table('rewards')->insert([
            ['name' => 'Eco Sticker Pack', 'points_required' => 20, 'stock' => 100],
            ['name' => 'Ballpen', 'points_required' => 30, 'stock' => 100],
            ['name' => 'Notebook', 'points_required' => 40, 'stock' => 100],
            ['name' => 'Eco Tote Bag', 'points_required' => 60, 'stock' => 50],
            ['name' => 'Reusable Water Bottle', 'points_required' => 120, 'stock' => 30],
            ['name' => 'Umbrella', 'points_required' => 150, 'stock' => 20],
            ['name' => 'Powerbank', 'points_required' => 250, 'stock' => 15],
            ['name' => '100 PHP Voucher', 'points_required' => 300, 'stock' => 20],
            ['name' => 'Bluetooth Earphones', 'points_required' => 600, 'stock' => 10],
            ['name' => 'Backpack', 'points_required' => 800, 'stock' => 5],
            ['name' => '500 PHP Voucher', 'points_required' => 1000, 'stock' => 5],
        ]);
    }
}