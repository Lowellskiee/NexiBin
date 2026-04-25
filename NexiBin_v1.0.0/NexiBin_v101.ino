// ============================================================
//  NexiBin Smart Bin — v6.0
//  Arduino UNO R4 WiFi + ST7735 TFT
//
//  FLOW:
//    READY → DETECTING → CLASSIFYING → BIN_CHECK →
//    ROTATING → DROPPING → STABILIZE → OUTPUT →
//    (QR_DISPLAY) → RESET → READY
//
//  PIN MAP:
//  ─────────────────────────────────────────────────────────
//  D2  → Ultrasonic 3 TRIG  (Dry bin)
//  D3  → Ultrasonic 3 ECHO  (Dry bin)
//  D4  → Metal sensor        (HIGH = metal)
//  D5  → Servo Motor         (single flap gate)
//  D6  → Raindrop sensor     (LOW  = wet)
//  D7  → Ultrasonic 1 TRIG  (Metal bin)
//  D8  → IR sensor           (LOW  = object present)
//  D9  → TFT DC
//  D10 → TFT CS
//  D11 → TFT MOSI  (SPI)
//  D13 → TFT SCK   (SPI)
//  A0  → Stepper IN1
//  A1  → Stepper IN3
//  A2  → Stepper IN2
//  A3  → Ultrasonic 1 ECHO  (Metal bin)
//  A4  → Ultrasonic 2 TRIG  (Wet bin)
//  A5  → Ultrasonic 2 ECHO  (Wet bin)
//  D12 → Stepper IN4
//
//  STEPPER ROTATION:
//    METAL → +220°  (≈ 1252 steps)
//    DRY   → -220°  (≈ -1252 steps)
//    WET   →  0°    (no rotation — center is wet bin)
// ============================================================

#include <WiFiS3.h>
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <SPI.h>
#include <qrcode.h>
#include <Servo.h>
#include <AccelStepper.h>
#include "logo1.h"   // Your custom logo bitmap

#define SCR_W 240
#define SCR_H 320
#define CX (SCR_W / 2)

// ─── TFT PINS ──────────────────────────────────────────────
#define TFT_CS   10
#define TFT_DC    9
#define TFT_RST  -1   // Not connected — tie RST to Arduino RST or 3V3

Adafruit_ST7789 tft = Adafruit_ST7789(TFT_CS, TFT_DC, TFT_RST);

// ─── SENSOR PINS ───────────────────────────────────────────
#define IR_PIN      8   // LOW  = object present
#define METAL_PIN   4   // HIGH = metal detected
#define RAIN_PIN    6   // LOW  = moisture detected

// ─── SERVO PIN ─────────────────────────────────────────────
#define SERVO_PIN     5
#define SERVO_OPEN   90   // degrees — open flap
#define SERVO_CLOSED  0   // degrees — closed

// ─── ULTRASONIC PINS ───────────────────────────────────────
#define ULTRA1_TRIG   7    // Metal bin
#define ULTRA1_ECHO   A3
#define ULTRA2_TRIG   A4   // Wet bin
#define ULTRA2_ECHO   A5
#define ULTRA3_TRIG   2    // Dry bin
#define ULTRA3_ECHO   3

// ─── STEPPER PINS (28BYJ-48 / ULN2003) ────────────────────
#define STEPPER_IN1  A0
#define STEPPER_IN2  A2
#define STEPPER_IN3  A1
#define STEPPER_IN4  12

// ─── STEPPER CONFIG ────────────────────────────────────────
#define STEPS_PER_REV    2048
#define STEPPER_MAX_SPD  500.0f
#define STEPPER_ACCEL    200.0f
// 220° → (2048 * 220) / 360 = 1252 steps
#define STEPS_220        1252

// ─── BIN CONFIG ────────────────────────────────────────────
#define BIN_FULL_CM      10   // distance threshold for "full"

// ─── TIMING ────────────────────────────────────────────────
#define DETECT_CONFIRM_MS      500
#define CLASSIFY_DISPLAY_MS   1000
#define BIN_CHECK_DISPLAY_MS   800
#define DROP_DELAY_MS         1500
#define STABILIZE_MS          2000
#define THANKYOU_MS           3500
#define QR_DISPLAY_MS        30000
#define COOLDOWN_MS           2000

// ─── SERVER CONFIG ─────────────────────────────────────────
const char SSID[]        = "HUAWEI-2.4G-Pty_EXT";        // ← update
const char PASS[]        = "TPyJ7CNZ";    // ← update
const char SERVER_IP[]   = "192.168.2.3";      // ← update
const int  SERVER_PORT   = 8000;
const char ENDPOINT[]    = "/api/iot/bins";
const int  WIFI_TIMEOUT  = 20;    // seconds
const int  MAX_RETRIES   = 3;

// ─── COLOR PALETTE ─────────────────────────────────────────
#define C_BG        0x0A2A
#define C_WHITE     ST77XX_WHITE
#define C_BLACK     ST77XX_BLACK
#define C_GREEN     0x07E0
#define C_RED       0xF800
#define C_YELLOW    0xFFE0
#define C_GRAY      0x8410
#define C_DARK_GRAY 0x4208
#define C_ACCENT    0x3B9F
#define C_ORANGE    0xFD00
#define C_METAL     0xC618
#define C_WET       0x065F
#define C_DRY       0xD3A0

// ─── OBJECTS ───────────────────────────────────────────────
Servo trashServo;
AccelStepper stepper(AccelStepper::HALF4WIRE,
                     STEPPER_IN1, STEPPER_IN3,
                     STEPPER_IN2, STEPPER_IN4);

WiFiClient wifiClient;
HttpClient http(wifiClient, SERVER_IP, SERVER_PORT);

// ─── CLASSIFICATION ENUM ───────────────────────────────────
enum TrashType { TRASH_NONE, TRASH_METAL, TRASH_WET, TRASH_DRY };

// ─── STATE MACHINE ─────────────────────────────────────────
enum SystemState {
  STATE_INIT,
  STATE_WIFI_CONNECTING,
  STATE_READY,
  STATE_DETECTING,
  STATE_CLASSIFYING,
  STATE_BIN_CHECK,
  STATE_ROTATING,
  STATE_DROPPING,
  STATE_STABILIZE,
  STATE_OUTPUT,
  STATE_QR_DISPLAY,
  STATE_RESET,
  STATE_ERROR
};

SystemState currentState  = STATE_INIT;
SystemState previousState = STATE_INIT;

// ─── SESSION / RUNTIME VARS ────────────────────────────────
TrashType    classifiedAs   = TRASH_NONE;
String       sessionToken   = "";
bool         wifiConnected  = false;
String       localIP        = "";

bool metalBinFull = false;
bool wetBinFull   = false;
bool dryBinFull   = false;

unsigned long stateEnteredAt   = 0;
unsigned long lastAnimTime     = 0;
unsigned long lastCooldownEnd  = 0;
bool          animToggle       = false;

// ─── FORWARD DECLARATIONS ──────────────────────────────────
void transitionTo(SystemState next);
void handleState();

bool connectWiFi();
int  sendPostRequest(String& outToken);
void sendBinUpdate(float m, float w, float d, const char* type);

bool isObjectDetected();
bool isMetalDetected();
bool isMoistureDetected();
long readUltrasonicCM(int trig, int echo);
bool isBinFull(int trig, int echo);
void refreshBinLevels();
float getBinPercent(int trig, int echo);

void rotateForWaste(TrashType t);
void returnToCenter();
void powerDownStepper();

void openServo();
void closeServo();

const char* trashTypeName(TrashType t);
uint16_t    trashTypeColor(TrashType t);

void drawWelcomeScreen();
void drawWiFiConnectingScreen();
void drawConnectedScreen();
void drawReadyScreen(bool pulse);
void drawDetectingScreen();
void drawClassifyingScreen(TrashType t);
void drawBinCheckScreen(TrashType t, bool full);
void drawRotatingScreen(TrashType t);
void drawDroppingScreen();
void drawStabilizeScreen();
void drawThankYouScreen(TrashType t);
void drawOutputMetalScreen();
void drawQRScreen(const String& token);
void drawResetScreen();
void drawErrorScreen(const char* reason);

void drawTopBar(const char* title, uint16_t color);
void drawBottomBar(const char* msg, uint16_t color);
void drawCenteredText(const char* text, int y, uint16_t color, uint8_t size);
void drawSensorRow(int y, const char* label, bool active, uint16_t activeColor);
void drawBinBar(int x, int y, int w, int h, bool full, const char* label, uint16_t color);

// ═══════════════════════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println(F("[NexiBin] v6.0 booting..."));

  // Sensors
  pinMode(IR_PIN,    INPUT_PULLUP);
  pinMode(METAL_PIN, INPUT);
  pinMode(RAIN_PIN,  INPUT_PULLUP);

  // Ultrasonics
  pinMode(ULTRA1_TRIG, OUTPUT); pinMode(ULTRA1_ECHO, INPUT);
  pinMode(ULTRA2_TRIG, OUTPUT); pinMode(ULTRA2_ECHO, INPUT);
  pinMode(ULTRA3_TRIG, OUTPUT); pinMode(ULTRA3_ECHO, INPUT);

  // Servo
  trashServo.attach(SERVO_PIN);
  closeServo();

  // Stepper
  stepper.setMaxSpeed(STEPPER_MAX_SPD);
  stepper.setAcceleration(STEPPER_ACCEL);
  stepper.setCurrentPosition(0);

  // TFT
  tft.init(240, 320);   // for your display     // ST7735S — change to INITR_144GREENTAB if using 1.44"
  tft.setRotation(0);
  tft.fillScreen(C_BG);

  drawWelcomeScreen();
  delay(2000);

  transitionTo(STATE_WIFI_CONNECTING);
}

// ═══════════════════════════════════════════════════════════
//  LOOP
// ═══════════════════════════════════════════════════════════
void loop() {
  stepper.run();
  handleState();
}

// ═══════════════════════════════════════════════════════════
//  STATE TRANSITION
// ═══════════════════════════════════════════════════════════
void transitionTo(SystemState next) {
  Serial.print(F("[STATE] "));
  Serial.print(currentState);
  Serial.print(F(" -> "));
  Serial.println(next);

  previousState  = currentState;
  currentState   = next;
  stateEnteredAt = millis();

  switch (next) {
    case STATE_WIFI_CONNECTING: drawWiFiConnectingScreen();          break;
    case STATE_READY:           drawReadyScreen(false);              break;
    case STATE_DETECTING:       drawDetectingScreen();               break;
    case STATE_CLASSIFYING:     drawClassifyingScreen(classifiedAs); break;
    case STATE_BIN_CHECK:       /* drawn inside handleState */       break;
    case STATE_ROTATING:        drawRotatingScreen(classifiedAs);    break;
    case STATE_DROPPING:        drawDroppingScreen();                break;
    case STATE_STABILIZE:       drawStabilizeScreen();               break;
    case STATE_OUTPUT:
      if (classifiedAs == TRASH_METAL) drawOutputMetalScreen();
      else drawThankYouScreen(classifiedAs);
      break;
    case STATE_QR_DISPLAY:      drawQRScreen(sessionToken);          break;
    case STATE_RESET:           drawResetScreen();                   break;
    default: break;
  }
}

// ═══════════════════════════════════════════════════════════
//  MAIN STATE HANDLER
// ═══════════════════════════════════════════════════════════
void handleState() {
  unsigned long now     = millis();
  unsigned long elapsed = now - stateEnteredAt;

  stepper.run();

  switch (currentState) {

    // ── WiFi ─────────────────────────────────────────────
    case STATE_WIFI_CONNECTING: {
      if (now - lastAnimTime > 500) {
        lastAnimTime = now;
        animToggle   = !animToggle;
        tft.fillRect(20, 95, 120, 14, C_BG);
        tft.setTextColor(C_YELLOW); tft.setTextSize(1);
        tft.setCursor(20, 96);
        tft.print(animToggle ? "Connecting..." : "Please wait..");
      }
      wifiConnected = connectWiFi();
      if (wifiConnected) {
        localIP = WiFi.localIP().toString();
        drawConnectedScreen();
        delay(1500);
        transitionTo(STATE_READY);
      } else {
        drawErrorScreen("WiFi Timeout");
        delay(4000);
        transitionTo(STATE_WIFI_CONNECTING);
      }
      break;
    }

    // ── Ready ─────────────────────────────────────────────
    case STATE_READY: {
      stepper.run();
      if (now - lastAnimTime > 1200) {
        lastAnimTime = now;
        animToggle   = !animToggle;
        drawReadyScreen(animToggle);
      }
      if (now < lastCooldownEnd) break;
      if (isObjectDetected()) {
        Serial.println(F("[DETECT] IR triggered."));
        classifiedAs = TRASH_NONE;
        transitionTo(STATE_DETECTING);
      }
      break;
    }

    // ── Detecting ─────────────────────────────────────────
    case STATE_DETECTING: {
      if (elapsed >= DETECT_CONFIRM_MS) {
        if (!isObjectDetected()) {
          Serial.println(F("[DETECT] False trigger — back to READY."));
          transitionTo(STATE_READY);
        } else {
          transitionTo(STATE_CLASSIFYING);
        }
      }
      break;
    }

    // ── Classifying ───────────────────────────────────────
    case STATE_CLASSIFYING: {
      if (elapsed < 20) {
        bool metal = false;
        for (int i = 0; i < 5; i++) {
          if (isMetalDetected()) { metal = true; break; }
          delay(20);
        }
        if (metal)                     classifiedAs = TRASH_METAL;
        else if (isMoistureDetected()) classifiedAs = TRASH_WET;
        else                           classifiedAs = TRASH_DRY;

        Serial.print(F("[CLASSIFY] ")); Serial.println(trashTypeName(classifiedAs));
        drawClassifyingScreen(classifiedAs);
      }
      if (elapsed >= CLASSIFY_DISPLAY_MS) {
        transitionTo(STATE_BIN_CHECK);
      }
      break;
    }

    // ── Bin Check ─────────────────────────────────────────
    case STATE_BIN_CHECK: {
      if (elapsed < 30) {
        refreshBinLevels();
        bool targetFull = false;
        if (classifiedAs == TRASH_METAL) targetFull = metalBinFull;
        if (classifiedAs == TRASH_WET)   targetFull = wetBinFull;
        if (classifiedAs == TRASH_DRY)   targetFull = dryBinFull;

        drawBinCheckScreen(classifiedAs, targetFull);

        if (targetFull) {
          Serial.print(F("[BIN] FULL for "));
          Serial.println(trashTypeName(classifiedAs));
          delay(2500);
          transitionTo(STATE_READY);
          break;
        }
      }
      if (elapsed >= BIN_CHECK_DISPLAY_MS) {
        transitionTo(STATE_ROTATING);
      }
      break;
    }

    // ── Rotating ──────────────────────────────────────────
    case STATE_ROTATING: {
      if (elapsed < 20) {
        rotateForWaste(classifiedAs);
      }
      stepper.run();
      if (stepper.distanceToGo() == 0) {
        Serial.println(F("[STEPPER] At target."));
        powerDownStepper();
        transitionTo(STATE_DROPPING);
      }
      break;
    }

    // ── Dropping ──────────────────────────────────────────
    case STATE_DROPPING: {
      if (elapsed < 20) {
        openServo();
        Serial.println(F("[SERVO] Opened."));
      }
      if (elapsed >= DROP_DELAY_MS) {
        closeServo();
        Serial.println(F("[SERVO] Closed."));
        returnToCenter();
        transitionTo(STATE_STABILIZE);
      }
      break;
    }

    // ── Stabilize ─────────────────────────────────────────
    case STATE_STABILIZE: {
      stepper.run();
      if (elapsed >= STABILIZE_MS && stepper.distanceToGo() == 0) {
        powerDownStepper();

        // Read updated bin levels
        refreshBinLevels();
        float pM = getBinPercent(ULTRA1_TRIG, ULTRA1_ECHO);
        float pW = getBinPercent(ULTRA2_TRIG, ULTRA2_ECHO);
        float pD = getBinPercent(ULTRA3_TRIG, ULTRA3_ECHO);
        sendBinUpdate(pM, pW, pD, trashTypeName(classifiedAs));

        transitionTo(STATE_OUTPUT);
      }
      break;
    }

    // ── Output ────────────────────────────────────────────
    case STATE_OUTPUT: {
      if (classifiedAs == TRASH_METAL) {
        if (elapsed < 20) {
          sessionToken = "";
          bool success = false;
          for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            Serial.print(F("[API] Attempt ")); Serial.print(attempt);
            Serial.print(F("/")); Serial.println(MAX_RETRIES);
            int code = sendPostRequest(sessionToken);
            if (code == 201) { success = true; break; }
            Serial.print(F("[API] HTTP ")); Serial.println(code);
            delay(1500);
          }
          if (success) {
            Serial.println("[API] Token: " + sessionToken);
            transitionTo(STATE_QR_DISPLAY);
          } else {
            drawErrorScreen("Server Error");
            delay(3000);
            transitionTo(STATE_RESET);
          }
        }
      } else {
        if (elapsed >= THANKYOU_MS) {
          transitionTo(STATE_RESET);
        }
      }
      break;
    }

    // ── QR Display ────────────────────────────────────────
    case STATE_QR_DISPLAY: {
      if (now - lastAnimTime > 1000) {
        lastAnimTime = now;
        int secsLeft = (QR_DISPLAY_MS - (int)elapsed) / 1000;
        if (secsLeft < 0) secsLeft = 0;
        tft.fillRect(20, 148, 120, 10, C_BG);
        tft.setTextColor(C_GRAY); tft.setTextSize(1);
        char buf[22];
        snprintf(buf, sizeof(buf), "Expires in %ds", secsLeft);
        tft.setCursor(20, 148); tft.print(buf);
      }
      if (elapsed >= QR_DISPLAY_MS) {
        transitionTo(STATE_RESET);
      }
      break;
    }

    // ── Reset ─────────────────────────────────────────────
    case STATE_RESET: {
      if (elapsed < 20) {
        closeServo();
        sessionToken = "";
        classifiedAs = TRASH_NONE;
        stepper.moveTo(0);   // already at center after DROPPING, but confirm
        Serial.println(F("[RESET] Homing stepper."));
      }
      stepper.run();
      if (stepper.distanceToGo() == 0) {
        powerDownStepper();
        lastCooldownEnd = millis() + COOLDOWN_MS;
        Serial.println(F("[RESET] Done — back to READY."));
        transitionTo(STATE_READY);
      }
      break;
    }

    // ── Error ─────────────────────────────────────────────
    case STATE_ERROR: {
      if (elapsed > 5000) transitionTo(STATE_READY);
      break;
    }

    default: break;
  }
}

// ═══════════════════════════════════════════════════════════
//  SERVO
// ═══════════════════════════════════════════════════════════
void openServo()  { trashServo.write(SERVO_OPEN);   delay(400); }
void closeServo() { trashServo.write(SERVO_CLOSED); delay(400); }

// ═══════════════════════════════════════════════════════════
//  STEPPER
// ═══════════════════════════════════════════════════════════
void rotateForWaste(TrashType t) {
  long target = 0;
  if (t == TRASH_METAL) target = +STEPS_220;
  if (t == TRASH_DRY)   target = -STEPS_220;
  // WET: target = 0 (already center)
  stepper.moveTo(target);
  Serial.print(F("[STEPPER] Target: ")); Serial.println(target);
}

void returnToCenter() {
  stepper.moveTo(0);
  Serial.println(F("[STEPPER] Returning to center."));
}

void powerDownStepper() {
  stepper.disableOutputs();
}

// ═══════════════════════════════════════════════════════════
//  SENSORS
// ═══════════════════════════════════════════════════════════
bool isObjectDetected()   { return digitalRead(IR_PIN)    == LOW;  }
bool isMetalDetected()    { return digitalRead(METAL_PIN) == HIGH; }
bool isMoistureDetected() { return digitalRead(RAIN_PIN)  == LOW;  }

long readUltrasonicCM(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH); delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long dur = pulseIn(echoPin, HIGH, 30000UL);
  if (dur == 0) return 999;
  return dur / 58L;
}

bool isBinFull(int trig, int echo) {
  long cm = readUltrasonicCM(trig, echo);
  Serial.print(F("[ULTRA] ")); Serial.print(cm); Serial.println(F(" cm"));
  return (cm > 0 && cm < BIN_FULL_CM);
}

float getBinPercent(int trig, int echo) {
  long cm = readUltrasonicCM(trig, echo);
  if (cm >= 30) return 0.0f;
  float filled = 30.0f - (float)cm;
  return constrain((filled / 30.0f) * 100.0f, 0.0f, 100.0f);
}

void refreshBinLevels() {
  metalBinFull = isBinFull(ULTRA1_TRIG, ULTRA1_ECHO);
  wetBinFull   = isBinFull(ULTRA2_TRIG, ULTRA2_ECHO);
  dryBinFull   = isBinFull(ULTRA3_TRIG, ULTRA3_ECHO);
  Serial.print(F("[BIN] Metal="));  Serial.print(metalBinFull ? "FULL" : "OK");
  Serial.print(F("  Wet="));        Serial.print(wetBinFull   ? "FULL" : "OK");
  Serial.print(F("  Dry="));        Serial.println(dryBinFull ? "FULL" : "OK");
}

// ═══════════════════════════════════════════════════════════
//  TYPE HELPERS
// ═══════════════════════════════════════════════════════════
const char* trashTypeName(TrashType t) {
  switch (t) {
    case TRASH_METAL: return "METAL";
    case TRASH_WET:   return "WET";
    case TRASH_DRY:   return "DRY";
    default:          return "NONE";
  }
}

uint16_t trashTypeColor(TrashType t) {
  switch (t) {
    case TRASH_METAL: return C_METAL;
    case TRASH_WET:   return C_WET;
    case TRASH_DRY:   return C_DRY;
    default:          return C_GRAY;
  }
}

// ═══════════════════════════════════════════════════════════
//  WIFI
// ═══════════════════════════════════════════════════════════
bool connectWiFi() {
  Serial.print(F("[WiFi] Connecting: ")); Serial.println(SSID);
  WiFi.begin(SSID, PASS);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if ((millis() - start) > (unsigned long)(WIFI_TIMEOUT * 1000)) {
      Serial.println(F("[WiFi] Timeout."));
      return false;
    }
    delay(500); Serial.print(F("."));
  }
  while (WiFi.localIP() == IPAddress(0, 0, 0, 0)) delay(300);
  Serial.print(F("\n[WiFi] IP: ")); Serial.println(WiFi.localIP());
  return true;
}

// ═══════════════════════════════════════════════════════════
//  HTTP POST — Request token for metal reward
//  POST /api/trash  →  { "token": "..." }
// ═══════════════════════════════════════════════════════════
int sendPostRequest(String& outToken) {
  outToken = "";
  http.beginRequest();
  http.post(ENDPOINT);
  http.sendHeader("Content-Type",   "application/json");
  http.sendHeader("Content-Length", "2");
  http.sendHeader("Accept",         "application/json");
  http.sendHeader("Connection",     "close");
  http.beginBody();
  http.print("{}");
  http.endRequest();

  int    statusCode = http.responseStatusCode();
  String body       = http.responseBody();

  Serial.print(F("[API] HTTP ")); Serial.println(statusCode);
  Serial.println("[API] Body: " + body);

  if (statusCode != 201) return statusCode;

  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, body)) return -99;
  if (!doc.containsKey("token")) return -98;

  outToken = doc["token"].as<String>();
  return 201;
}

// ─── Send bin level data to Laravel ────────────────────────
// POST /api/trash  with JSON body containing bin levels
void sendBinUpdate(float metal, float wet, float dry, const char* wasteType) {
  String payload = "{\"type\":\"bin_update\",\"waste\":\"";
  payload += wasteType;
  payload += "\",\"metal\":"; payload += metal;
  payload += ",\"wet\":";     payload += wet;
  payload += ",\"dry\":";     payload += dry;
  payload += "}";

  http.beginRequest();
  http.post(ENDPOINT);
  http.sendHeader("Content-Type",   "application/json");
  http.sendHeader("Content-Length", String(payload.length()));
  http.sendHeader("Accept",         "application/json");
  http.sendHeader("Connection",     "close");
  http.beginBody();
  http.print(payload);
  http.endRequest();

  int code = http.responseStatusCode();
  Serial.print(F("[BIN UPDATE] HTTP ")); Serial.println(code);
}

// ═══════════════════════════════════════════════════════════
//  TFT DRAW HELPERS
// ═══════════════════════════════════════════════════════════
void drawTopBar(const char* title, uint16_t color) {
  tft.fillRect(0, 0, SCR_W, 12, color);
  tft.setTextColor(C_BLACK); tft.setTextSize(1);
  int16_t x1, y1; uint16_t w, h;
  tft.getTextBounds(title, 0, 0, &x1, &y1, &w, &h);
  tft.setCursor((SCR_W - w) / 2, 2); tft.print(title);
}

void drawBottomBar(const char* msg, uint16_t color) {
  tft.fillRect(0, SCR_H, SCR_W, 12, color);
  tft.setTextColor(C_BLACK); tft.setTextSize(1);
  int16_t x1, y1; uint16_t w, h;
  tft.getTextBounds(msg, 0, 0, &x1, &y1, &w, &h);
  tft.setCursor((SCR_W - w) / 2, 150); tft.print(msg);
}

void drawCenteredText(const char* text, int y, uint16_t color, uint8_t size) {
  tft.setTextColor(color); tft.setTextSize(size);
  int16_t x1, y1; uint16_t w, h;
  tft.getTextBounds(text, 0, 0, &x1, &y1, &w, &h);
  tft.setCursor((SCR_W - w) / 2, y); tft.print(text);
}

void drawSensorRow(int y, const char* label, bool active, uint16_t activeColor) {
  tft.setTextSize(1); tft.setTextColor(C_GRAY);
  tft.setCursor(4, y); tft.print(label);
  tft.fillCircle(112, y + 3, 4, active ? activeColor : C_DARK_GRAY);
}

void drawBinBar(int x, int y, int w, int h, bool full, const char* label, uint16_t color) {
  uint16_t bCol = full ? C_RED : color;
  tft.drawRect(x, y, w, h, bCol);
  tft.fillRect(x + 1, y + 1, w - 2, h - 2, full ? (uint16_t)0x3000 : (uint16_t)0x0821);
  int barH = full ? (h - 6) : (h / 5);
  tft.fillRect(x + 2, y + h - 3 - barH, w - 4, barH, bCol);
  tft.setTextSize(1); tft.setTextColor(bCol);
  int16_t x1, y1; uint16_t tw, th;
  tft.getTextBounds(label, 0, 0, &x1, &y1, &tw, &th);
  tft.setCursor(x + (w - tw) / 2, y + 2); tft.print(label);
  const char* s = full ? "FULL" : "OK";
  tft.getTextBounds(s, 0, 0, &x1, &y1, &tw, &th);
  tft.setCursor(x + (w - tw) / 2, y + h - 10); tft.print(s);
}

// ═══════════════════════════════════════════════════════════
//  SCREENS
//  (SCR_W×160 ST7735 — adjust coordinates if your panel differs)
// ═══════════════════════════════════════════════════════════

// ─── Welcome ───────────────────────────────────────────────
void drawWelcomeScreen() {
  tft.fillScreen(C_BG);

  // LOGO1 is 160×60 px, 16-bit RGB565 stored in PROGMEM (logo1.h)
  // The logo is wider than the SCR_Wpx screen, so we clip it centered:
  // offsetX will be negative, which drawRGBBitmap handles correctly
  // by simply not drawing pixels that fall outside the screen.
  int logoX = (SCR_W - LOGO1_WIDTH) / 2;   // = -16  (centered, clips edges)
  int logoY = 4;
  tft.drawRGBBitmap(logoX, logoY, LOGO1, LOGO1_WIDTH, LOGO1_HEIGHT);

  int logoBottom = logoY + LOGO1_HEIGHT + 4;
  drawCenteredText("NexiBin", logoBottom, C_WHITE, 2);
  drawCenteredText("Smart Waste Sorting", logoBottom + 18, C_GRAY, 1);
  tft.drawFastHLine(10, logoBottom + 30, 108, C_DARK_GRAY);
  drawCenteredText("v6.0  |  UNO R4 WiFi", logoBottom + 34, C_DARK_GRAY, 1);
  drawBottomBar("Starting...", C_ACCENT);
}

// ─── WiFi Connecting ───────────────────────────────────────
void drawWiFiConnectingScreen() {
  tft.fillScreen(C_BG);
  drawTopBar("WiFi Setup", C_YELLOW);
  drawCenteredText("Connecting to:", 18, C_GRAY, 1);
  drawCenteredText(SSID, 30, C_ACCENT, 1);
  tft.drawRect(44, 48, 40, 40, C_YELLOW);
  tft.setTextColor(C_YELLOW); tft.setTextSize(1);
  tft.setCursor(52, 63); tft.print("WiFi");
  drawCenteredText("Please wait...", 100, C_GRAY, 1);
  tft.setTextColor(C_YELLOW); tft.setTextSize(1);
  tft.setCursor(20, 96); tft.print("Connecting...");
  drawBottomBar("Establishing...", C_YELLOW);
}

// ─── Connected ─────────────────────────────────────────────
void drawConnectedScreen() {
  tft.fillScreen(C_BG);
  drawTopBar("Connected!", C_GREEN);
  tft.fillRoundRect(44, 25, 40, 40, 8, C_GREEN);
  tft.setTextColor(C_WHITE); tft.setTextSize(2);
  tft.setCursor(54, 37); tft.print("OK");
  drawCenteredText("WiFi Connected", 72, C_GREEN, 1);
  tft.setTextColor(C_GRAY); tft.setTextSize(1);
  tft.setCursor(4, 86); tft.print("IP:");
  tft.setTextColor(C_WHITE); tft.setCursor(24, 86);
  tft.print(localIP.c_str());
  drawBottomBar("Network OK", C_GREEN);
}

// ─── Ready ─────────────────────────────────────────────────
void drawReadyScreen(bool pulse) {
  tft.fillScreen(C_BG);
  drawTopBar("System Ready", C_ACCENT);
  drawCenteredText("NexiBin Active", 16, C_WHITE, 1);

  tft.fillRect(2, 28, SCR_W, 58, 0x0821);
  tft.setTextColor(C_GRAY); tft.setTextSize(1);
  tft.setCursor(6, 31); tft.print("SENSORS");
  tft.drawFastHLine(6, 40, 116, C_DARK_GRAY);
  drawSensorRow(43, "IR Object", isObjectDetected(),   C_GREEN);
  drawSensorRow(54, "Metal",     isMetalDetected(),    C_METAL);
  drawSensorRow(65, "Moisture",  isMoistureDetected(), C_YELLOW);

  tft.fillRect(2, 90, 124, 44, 0x0821);
  tft.setTextColor(C_GRAY); tft.setTextSize(1);
  tft.setCursor(6, 93); tft.print("BIN LEVELS");
  tft.drawFastHLine(6, 102, 116, C_DARK_GRAY);
  drawBinBar(4,  105, 34, 26, metalBinFull, "MTL", C_METAL);
  drawBinBar(47, 105, 34, 26, wetBinFull,   "WET", C_WET);
  drawBinBar(90, 105, 34, 26, dryBinFull,   "DRY", C_DRY);

  // Pulse indicator
  tft.fillCircle(64, 140, 5, pulse ? C_GREEN : C_DARK_GRAY);
  tft.setTextColor(C_GRAY); tft.setTextSize(1);
  tft.setCursor(28, 136); tft.print("AWAITING");

  drawBottomBar("NexiBin Ready", C_ACCENT);
}

// ─── Detecting ─────────────────────────────────────────────
void drawDetectingScreen() {
  tft.fillScreen(C_BG);
  drawTopBar("Object Detected!", C_YELLOW);
  tft.fillRoundRect(44, 30, 40, 40, 8, C_YELLOW);
  tft.setTextColor(C_BLACK); tft.setTextSize(3);
  tft.setCursor(58, 41); tft.print("!");
  drawCenteredText("Confirming...", 80, C_WHITE, 1);
  drawCenteredText("Hold item steady", 94, C_GRAY, 1);
  drawBottomBar("Detecting...", C_YELLOW);
}

// ─── Classifying ───────────────────────────────────────────
void drawClassifyingScreen(TrashType t) {
  tft.fillScreen(C_BG);
  uint16_t col = trashTypeColor(t);
  drawTopBar("Classifying", col);
  tft.fillRoundRect(10, 18, 108, 38, 6, col);
  drawCenteredText("DETECTED:", 22, C_BLACK, 1);
  drawCenteredText(trashTypeName(t), 32, C_WHITE, 2);
  tft.drawFastHLine(4, 62, 120, C_DARK_GRAY);
  tft.setTextColor(C_GRAY); tft.setTextSize(1);
  tft.setCursor(4, 66); tft.print("SENSOR READINGS:");
  drawSensorRow(78,  "IR Object", isObjectDetected(),   C_GREEN);
  drawSensorRow(90,  "Metal",     isMetalDetected(),    C_METAL);
  drawSensorRow(102, "Moisture",  isMoistureDetected(), C_YELLOW);
  if (t == TRASH_METAL)
    drawCenteredText("Reward QR incoming!", 120, C_METAL, 1);
  else if (t == TRASH_WET)
    drawCenteredText("Routing to WET bin", 120, C_WET, 1);
  else
    drawCenteredText("Routing to DRY bin", 120, C_DRY, 1);
  drawBottomBar("Classifier v2", col);
}

// ─── Bin Check ─────────────────────────────────────────────
void drawBinCheckScreen(TrashType t, bool full) {
  tft.fillScreen(C_BG);
  uint16_t col = full ? C_RED : C_GREEN;
  drawTopBar("Bin Level Check", col);
  drawBinBar(2,  16, 38, 30, metalBinFull, "MTL", C_METAL);
  drawBinBar(45, 16, 38, 30, wetBinFull,   "WET", C_WET);
  drawBinBar(88, 16, 38, 30, dryBinFull,   "DRY", C_DRY);
  if (full) {
    tft.fillRoundRect(4, 54, 120, 32, 6, C_RED);
    drawCenteredText("Bin is FULL!", 58, C_WHITE, 1);
    drawCenteredText("Cannot sort trash.", 70, C_WHITE, 1);
    drawBottomBar("Bin Full", C_RED);
  } else {
    char buf[22];
    snprintf(buf, sizeof(buf), "%s bin OK", trashTypeName(t));
    drawCenteredText(buf, 60, C_GREEN, 1);
    drawCenteredText("Proceeding...", 74, C_GRAY, 1);
    drawBottomBar("Bin Available", C_GREEN);
  }
}

// ─── Rotating ──────────────────────────────────────────────
void drawRotatingScreen(TrashType t) {
  tft.fillScreen(C_BG);
  uint16_t col = trashTypeColor(t);
  drawTopBar("Rotating...", col);
  tft.drawCircle(64, 90, 30, col);
  tft.fillTriangle(64, 60, 57, 74, 71, 74, col);
  int deg = (t == TRASH_METAL) ? 220 : (t == TRASH_DRY) ? -220 : 0;
  char buf[16];
  snprintf(buf, sizeof(buf), "%+d degrees", deg);
  drawCenteredText(trashTypeName(t), 126, C_WHITE, 1);
  drawCenteredText(buf, 138, col, 1);
  drawBottomBar("Stepper active", col);
}

// ─── Dropping ──────────────────────────────────────────────
void drawDroppingScreen() {
  tft.fillScreen(C_BG);
  drawTopBar("Releasing Trash", C_ORANGE);
  tft.fillRoundRect(34, 30, 60, 60, 8, C_ORANGE);
  tft.setTextColor(C_BLACK); tft.setTextSize(1);
  tft.setCursor(46, 48); tft.print("SERVO");
  tft.setTextSize(2); tft.setCursor(44, 62); tft.print("OPEN");
  drawCenteredText("Dropping trash...", 100, C_WHITE, 1);
  drawCenteredText("Please wait", 114, C_GRAY, 1);
  drawBottomBar("Flap gate open", C_ORANGE);
}

// ─── Stabilize ─────────────────────────────────────────────
void drawStabilizeScreen() {
  tft.fillScreen(C_BG);
  drawTopBar("Stabilizing...", C_ACCENT);
  drawCenteredText("Servo closed.", 30, C_GREEN, 1);
  drawCenteredText("Returning to center.", 44, C_GRAY, 1);
  drawCenteredText("Measuring bins...", 60, C_GRAY, 1);
  drawCenteredText("Sending to server...", 74, C_GRAY, 1);
  drawBottomBar("Please wait", C_ACCENT);
}

// ─── Thank You (non-metal) ─────────────────────────────────
void drawThankYouScreen(TrashType t) {
  tft.fillScreen(C_BG);
  uint16_t col = trashTypeColor(t);
  drawTopBar("Thank You!", col);
  tft.fillRoundRect(34, 20, 60, 60, 12, col);
  tft.setTextColor(C_WHITE); tft.setTextSize(3);
  tft.setCursor(50, 36); tft.print(":)");
  char buf[22];
  snprintf(buf, sizeof(buf), "%s sorted!", trashTypeName(t));
  drawCenteredText(buf, 90, col, 1);
  drawCenteredText("Thank you for using", 104, C_WHITE, 1);
  drawCenteredText("NexiBin!", 116, C_WHITE, 1);
  drawCenteredText("Resetting...", 132, C_DARK_GRAY, 1);
  drawBottomBar("NexiBin v6.0", col);
}

// ─── Output Metal — API in progress ────────────────────────
void drawOutputMetalScreen() {
  tft.fillScreen(C_BG);
  drawTopBar("Generating QR", C_METAL);
  drawCenteredText("Metal logged!", 20, C_WHITE, 1);
  drawCenteredText("Contacting server...", 34, C_GRAY, 1);
  tft.fillRect(34, 50, 60, 40, 0x0821);
  tft.drawRect(34, 50, 60, 40, C_METAL);
  tft.setTextColor(C_METAL); tft.setTextSize(1);
  tft.setCursor(38, 58); tft.print("POST");
  tft.setCursor(38, 70); tft.print("/api/trash");
  drawCenteredText("Please wait...", 100, C_GRAY, 1);
  drawBottomBar("Reward incoming", C_METAL);
}

// ─── QR Code ───────────────────────────────────────────────
void drawQRScreen(const String& token) {
  tft.fillScreen(C_WHITE);
  drawTopBar("Scan to Redeem", C_GREEN);

  String qrData = "http://";
  qrData += SERVER_IP; qrData += ":"; qrData += SERVER_PORT;
  qrData += "/api/trash/"; qrData += token;

  QRCode qrcode;
  uint8_t qrcodeData[qrcode_getBufferSize(3)];
  qrcode_initText(&qrcode, qrcodeData, 3, 0, qrData.c_str());

  int scale   = 90 / qrcode.size;
  int qrW     = qrcode.size * scale;
  int offsetX = (SCR_W - qrW) / 2;
  int offsetY = 20;

  tft.fillRect(offsetX - 4, offsetY - 4, qrW + 8, qrW + 8, C_WHITE);
  for (int y = 0; y < qrcode.size; y++)
    for (int x = 0; x < qrcode.size; x++)
      if (qrcode_getModule(&qrcode, x, y))
        tft.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale, C_BLACK);

  int qrBottom = offsetY + qrW + 8;
  tft.drawFastHLine(0, qrBottom + 2, SCR_W, C_GRAY);
  drawCenteredText("Scan for reward!", qrBottom + 6, C_BLACK, 1);
  tft.setTextColor(C_GRAY); tft.setTextSize(1);
  tft.setCursor(20, 148); tft.print("Expires in 30s");
  drawBottomBar("NexiBin Rewards", C_GREEN);
}

// ─── Reset ─────────────────────────────────────────────────
void drawResetScreen() {
  tft.fillScreen(C_BG);
  drawTopBar("Resetting...", C_ACCENT);
  drawCenteredText("Closing servo...",   28, C_WHITE, 1);
  drawCenteredText("Homing stepper...", 44, C_GRAY,  1);
  drawCenteredText("Clearing session...", 60, C_GRAY, 1);
  drawBottomBar("Please wait", C_ACCENT);
}

// ─── Error ─────────────────────────────────────────────────
void drawErrorScreen(const char* reason) {
  tft.fillScreen(C_BG);
  drawTopBar("Error", C_RED);
  tft.fillRoundRect(44, 24, 40, 40, 8, C_RED);
  tft.setTextColor(C_WHITE); tft.setTextSize(3);
  tft.setCursor(57, 34); tft.print("X");
  drawCenteredText(reason, 74, C_WHITE, 1);
  drawCenteredText("Retrying...", 90, C_GRAY, 1);
  drawBottomBar("Check connection", C_RED);
}
