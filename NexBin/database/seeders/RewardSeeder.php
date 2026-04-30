<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RewardSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('rewards')->insert([
            ['name'=>'Notebook','description'=>'1 regular notebook','points_required'=>80,'stock'=>100,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Ballpen Set','description'=>'3 pcs ballpens','points_required'=>70,'stock'=>100,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Pencil Set','description'=>'5 pcs pencils','points_required'=>60,'stock'=>100,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Eraser Pack','description'=>'2 pcs erasers','points_required'=>40,'stock'=>100,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Sharpener','description'=>'1 pc sharpener','points_required'=>30,'stock'=>100,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Ruler','description'=>'12-inch ruler','points_required'=>50,'stock'=>80,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Highlighter Set','description'=>'3 pcs highlighters','points_required'=>120,'stock'=>60,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Marker Set','description'=>'Permanent marker set','points_required'=>130,'stock'=>50,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Crayons','description'=>'12-color crayons','points_required'=>110,'stock'=>70,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Coloring Pencils','description'=>'12-color pencils','points_required'=>150,'stock'=>60,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Folder','description'=>'Plastic folder','points_required'=>60,'stock'=>90,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Long Envelope','description'=>'Pack of envelopes','points_required'=>50,'stock'=>80,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Yellow Pad','description'=>'1 pad yellow paper','points_required'=>90,'stock'=>70,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Index Cards','description'=>'1 pack index cards','points_required'=>70,'stock'=>75,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Glue Stick','description'=>'1 glue stick','points_required'=>40,'stock'=>80,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Scissors','description'=>'1 pair scissors','points_required'=>100,'stock'=>50,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Tape','description'=>'1 roll adhesive tape','points_required'=>50,'stock'=>70,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Correction Tape','description'=>'1 correction tape','points_required'=>80,'stock'=>60,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Binder Notebook','description'=>'Refillable binder notebook','points_required'=>200,'stock'=>40,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
            ['name'=>'Complete Supply Kit','description'=>'Notebook, pens, pencils set','points_required'=>300,'stock'=>30,'is_active'=>1,'image'=>null,'created_at'=>now(),'updated_at'=>now()],
        ]);
    }
}