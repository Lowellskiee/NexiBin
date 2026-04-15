#include <CheapStepper.h>     // Library to control stepper
#include <Servo.h>            // Library to control servo motor

Servo servo1;

// ===== PIN ASSIGNMENTS =====
#define IR_PIN 4              // IR sensor pin
#define METAL_PIN 2           // Metal proximity sensor pin
#define MOISTURE_PIN A5       // Raindrop (wet sensor) pin
#define SERVO_PIN 3           // Servo motor pin

// ===== VARIABLES =====
int soil = 0;                 // One reading from moisture sensor
int wetValue = 0;             // Average wetness result
int soilBaseline = 500;       // Starting moisture baseline (can adjust)

// Stepper motor pins (fixed)
CheapStepper stepper(8, 9, 10, 11);



// =================================================================
//  MOTOR CALIBRATION — (2 cycles) Servo + Stepper test
// =================================================================
void calibrateMotors() {
  Serial.println("Motor Calibration Started...");

  for (int i = 0; i < 2; i++) {
    Serial.print("Calibration cycle: ");
    Serial.println(i + 1);

    // Stepper rotate a bit CW (testing movement)
    stepper.moveDegreesCW(90);
    delay(500);

    // Stepper go back CCW (back to zero)
    stepper.moveDegreesCCW(90);
    delay(500);

    // Servo test: open
    servo1.write(180);
    delay(500);

    // Servo test: close (home position)
    servo1.write(0);
    delay(500);
  }

  // FINAL ZERO RESET
  Serial.println("Resetting motors to ZERO position...");
  servo1.write(0);            // Servo fully closed
  delay(500);
}



// =================================================================
//  MOISTURE CALIBRATION (OPTIONAL, but included)
// =================================================================
void calibrateMoistureSensor() {

  long total = 0;
  for (int i = 0; i < 20; i++) {
    total += analogRead(MOISTURE_PIN);
    delay(30);
  }

  soilBaseline = total / 20;   // Baseline stored

  Serial.print("Moisture Baseline Set To: ");
  Serial.println(soilBaseline);
}



// =================================================================
//  SETUP FUNCTION — RUNS ONCE
// =================================================================
void setup() {
  Serial.begin(9600);

  pinMode(IR_PIN, INPUT);
  pinMode(METAL_PIN, INPUT_PULLUP);
  servo1.attach(SERVO_PIN);

  stepper.setRpm(15);

  Serial.println("Starting Calibration...");
  calibrateMotors();
  calibrateMoistureSensor();

  Serial.println("System Ready.\n");
}



// =================================================================
//  MAIN LOOP — RUNS FOREVER
// =================================================================
void loop() {

  // ========== 1. CHECK IF TRASH IS PRESENT ==========
  if (digitalRead(IR_PIN) == LOW) {   // IR sees object
    Serial.println("Object Detected...");

    delay(300); // small delay for stable reading


    // ========== 2. CHECK METAL FIRST ==========
    int isMetal = digitalRead(METAL_PIN);

    if (isMetal == LOW) {
      Serial.println("Metal Detected!");

      // Move to metal bin
      stepper.moveDegreesCW(240);
      delay(500);

      // Open lid
      servo1.write(180);
      delay(700);

      // Close lid
      servo1.write(0);
      delay(700);

      // Return to home
      stepper.moveDegreesCCW(240);
      delay(500);

      return;   // Stop checking wet/dry since it's metal
    }


    // ========== 3. NOT METAL → CHECK WETNESS ==========
    long moistureTotal = 0;

    for (int i = 0; i < 3; i++) {
      soil = analogRead(MOISTURE_PIN);
      moistureTotal += soil;
      delay(50);
    }

    wetValue = moistureTotal / 3;     // Average reading

    Serial.print("Wetness Raw Value: ");
    Serial.println(wetValue);


    // ========== 4. DETERMINE WET OR DRY ==========
    if (wetValue < soilBaseline - 50) {
      // More water → lower reading
      Serial.println("Wet Waste Detected!");

      // Move to wet bin
      stepper.moveDegreesCW(120);
      delay(500);

      // Lid open
      servo1.write(180);
      delay(700);

      // Lid close
      servo1.write(0);
      delay(700);

      // Back to home
      stepper.moveDegreesCCW(120);
      delay(500);

    } else {
      // Dry Waste
      Serial.println("Dry Waste Detected!");

      // Only servo opens (no stepper rotation)
      servo1.write(180);
      delay(700);

      servo1.write(0);
      delay(700);
    }

  }

  // If no object → do nothing
}
