use php artisan tinker


User::create([
  'name' => 'Admin',
  'email' => 'admin@gmail.com',
  'password' => bcrypt('admin123'),
  'student_number' => '00-000000',
  'role' => 'admin'
]);

User::create([
  'name' => 'Staff',
  'email' => 'staff@gmail.com',
  'password' => bcrypt('staff123'),
  'student_number' => '00-000001',
  'role' => 'staff'
]);

