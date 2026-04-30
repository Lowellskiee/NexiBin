/*
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              NexiBin Smart Waste Sorting System                  ║
 * ║         v2.0 — Fully Revised & Cleaned                          ║
 * ║         Board: Arduino Uno R4 WiFi                               ║
 * ║         Display: ST7789 240×320                                  ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  LIBRARIES (Tools → Manage Libraries):                           ║
 * ║    • Adafruit GFX Library                                        ║
 * ║    • Adafruit ST7735 and ST7789 Library                          ║
 * ║    • WiFiS3  (built-in for Uno R4 WiFi)                          ║
 * ║    • ArduinoHttpClient                                           ║
 * ║    • ArduinoJson                                                 ║
 * ║    • AccelStepper                                                ║
 * ║    • qrcode  (by ricmoo — search "QRCode" in Library Manager)   ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  SYSTEM FLOW                                                     ║
 * ║    Splash → Calibration → WiFi → WELCOME DASHBOARD              ║
 * ║    → Wait IR → Object Detected → Stabilize → Classify           ║
 * ║    → Sort (Stepper + Servo) → Reward if Metal → Thank You       ║
 * ║    → Wait Removal (10s timeout) → RESET → DASHBOARD             ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  WIRING (FINAL — NO SHARED PINS)                                 ║
 * ║  IR Sensor         → D8   (LOW = object present)                 ║
 * ║  Metal Sensor      → D4   (HIGH = metal detected)                ║
 * ║  Rain Sensor       → D6   (LOW = wet, INPUT_PULLUP)              ║
 * ║  Servo Motor       → D5                                          ║
 * ║  Stepper IN1       → A0                                          ║
 * ║  Stepper IN2       → A2                                          ║
 * ║  Stepper IN3       → A1                                          ║
 * ║  Stepper IN4       → D12                                         ║
 * ║  Ultrasonic Metal  TRIG→D7    ECHO→A3                            ║
 * ║  Ultrasonic Wet    TRIG→A4    ECHO→A5                            ║
 * ║  Ultrasonic Dry    TRIG→D2    ECHO→D3                            ║
 * ║  TFT CS → D10  TFT DC → D9  TFT RST → -1                       ║
 * ║  TFT MOSI → D11 (HW SPI)  TFT SCK → D13 (HW SPI)               ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────
//  LIBRARIES
// ─────────────────────────────────────────────────────────────────
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <WiFiS3.h>
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>
#include <AccelStepper.h>
#include <Servo.h>
#include <qrcode.h>

// ─────────────────────────────────────────────────────────────────
//  ★  USER CONFIGURATION
// ─────────────────────────────────────────────────────────────────
const char* WIFI_SSID      = "SaytheName";
const char* WIFI_PASSWORD  = "00010001";
const char* BACKEND_HOST   = "190.100.0.249";
const int   BACKEND_PORT   = 8000;
const char* ENDPOINT_BINS  = "/api/iot/bins";
const char* ENDPOINT_TRASH = "/api/iot/trash";
const char* API_KEY        = "29ecfed016894d15fc635234785a2b66";

// ─────────────────────────────────────────────────────────────────
//  PIN DEFINITIONS
// ─────────────────────────────────────────────────────────────────
#define IR_PIN       8
#define METAL_PIN    4
#define RAIN_PIN     6
#define SERVO_PIN    5

#define IN1          A0
#define IN2          A2
#define IN3          A1
#define IN4          12

// Ultrasonic — fully independent, no shared pins
#define METAL_TRIG   7
#define METAL_ECHO   A3
#define WET_TRIG     A4
#define WET_ECHO     A5
#define DRY_TRIG     2
#define DRY_ECHO     3

// TFT
#define TFT_CS       10
#define TFT_DC        9
#define TFT_RST      -1

// ─────────────────────────────────────────────────────────────────
//  ★  PER-BIN CALIBRATION (edit these to match your physical bins)
// ─────────────────────────────────────────────────────────────────
// Distance in cm when bin is EMPTY (sensor sees bottom)
#define METAL_EMPTY_CM   35.0f
#define WET_EMPTY_CM     25.0f
#define DRY_EMPTY_CM     35.0f

// Distance in cm when bin is considered FULL (object at top)
#define METAL_FULL_CM    10.0f
#define WET_FULL_CM       6.0f
#define DRY_FULL_CM      10.0f

// Percentage threshold to trigger FULL alert (per bin)
#define METAL_FULL_THRESH  85
#define WET_FULL_THRESH    80
#define DRY_FULL_THRESH    90

// ─────────────────────────────────────────────────────────────────
//  ULTRASONIC READING CONFIG
// ─────────────────────────────────────────────────────────────────
#define US_SAMPLES         5       // Number of samples to average
#define US_SAMPLE_DELAY_MS 10      // Delay between samples (ms)
#define US_INTER_SENSOR_MS 20      // Delay between sensors to prevent crosstalk
#define US_TIMEOUT_US      25000   // pulseIn timeout (µs) — ~4.3 m max range
#define US_MAX_CM          150.0f  // Ignore readings above this (bad echo)
#define US_MIN_CM           2.0f   // Ignore readings below htis (too close)

// ─────────────────────────────────────────────────────────────────
//  MOTOR CONSTANTS
// ─────────────────────────────────────────────────────────────────
#define STEPS_PER_REV    2048.0f
#define STEPS_PER_DEG    (STEPS_PER_REV / 360.0f)
#define ANGLE_METAL       450
#define ANGLE_WET           0
#define ANGLE_DRY        -450
#define STEP_MAX_SPEED   1200
#define STEP_ACCEL        800
#define SERVO_CLOSED        0
#define SERVO_OPEN         90

// ─────────────────────────────────────────────────────────────────
//  TIMING
// ─────────────────────────────────────────────────────────────────
#define STABILIZE_MS        3000
#define SERVO_HOLD_MS       1500
#define COOLDOWN_MS         4000
#define REMOVAL_TIMEOUT_MS 10000
#define QR_TIMEOUT_MS      15000
#define SENSOR_INTERVAL     3000
#define SEND_INTERVAL      10000

// ─────────────────────────────────────────────────────────────────
//  SCREEN CONSTANTS
// ─────────────────────────────────────────────────────────────────
#define SCR_W   240
#define SCR_H   320
#define CX      (SCR_W / 2)
#define CY      (SCR_H / 2)

#define C_BG      0x0A0F
#define C_SURFACE 0x0C51
#define C_BORDER  0x294A
#define C_WHITE   0xFFFF
#define C_GREEN   0x07E0
#define C_YELLOW  0xFFE0
#define C_RED     0xF800
#define C_CYAN    0x07FF
#define C_LTGRAY  0xC618
#define C_ACCENT  0x03EF
#define C_ORANGE  0xFC00
#define C_DKGREEN 0x03E0

// ─────────────────────────────────────────────────────────────────
//  OBJECTS
// ─────────────────────────────────────────────────────────────────
Adafruit_ST7789 tft     = Adafruit_ST7789(TFT_CS, TFT_DC, TFT_RST);
WiFiClient      wifiClient;
HttpClient      http(wifiClient, BACKEND_HOST, BACKEND_PORT);
AccelStepper    stepper(AccelStepper::HALF4WIRE, IN1, IN3, IN2, IN4);
Servo           myServo;

// ─────────────────────────────────────────────────────────────────
//  GLOBAL STATE
// ─────────────────────────────────────────────────────────────────
int  metalPct = 0, wetPct = 0, dryPct = 0;
bool metalFull = false, wetFull = false, dryFull = false;
bool alertSentMetal = false, alertSentWet = false, alertSentDry = false;
bool systemBusy = false;

unsigned long lastSensor = 0;
unsigned long lastSend   = 0;

// ═════════════════════════════════════════════════════════════════
//
//  SECTION 1 — DISPLAY HELPERS
//
// ═════════════════════════════════════════════════════════════════

void printCentered(const char* text, int16_t cx, int16_t y,
                   uint8_t size = 1, uint16_t color = C_WHITE) {
  tft.setTextSize(size);
  tft.setTextColor(color);
  int16_t x1, y1; uint16_t w, h;
  tft.getTextBounds(text, 0, y, &x1, &y1, &w, &h);
  tft.setCursor(cx - w / 2, y);
  tft.print(text);
}

void drawCard(int16_t x, int16_t y, int16_t w, int16_t h,
              uint16_t fill = C_SURFACE, uint16_t border = C_BORDER) {
  tft.fillRoundRect(x, y, w, h, 8, fill);
  tft.drawRoundRect(x, y, w, h, 8, border);
}

void drawDivider(int16_t y, uint16_t color = C_BORDER) {
  tft.drawFastHLine(20, y, SCR_W - 40, color);
}

void drawAccentBars() {
  for (int i = 0; i < 4; i++) tft.drawFastHLine(0, i, SCR_W, C_ACCENT);
  for (int i = 0; i < 4; i++) tft.drawFastHLine(0, SCR_H-1-i, SCR_W, C_ACCENT);
}

void drawBadge(int16_t cx, int16_t y,
               const char* text, uint16_t bg, uint16_t fg = C_BG) {
  tft.setTextSize(1);
  int16_t x1, y1; uint16_t w, h;
  tft.getTextBounds(text, 0, y, &x1, &y1, &w, &h);
  int pw = w + 14, ph = h + 6;
  tft.fillRoundRect(cx - pw/2, y - 3, pw, ph, ph/2, bg);
  tft.setTextColor(fg);
  tft.setCursor(cx - w/2, y);
  tft.print(text);
}

void drawLogo(int16_t cx, int16_t cy, uint8_t scale = 1) {
  uint8_t r = 28 * scale;
  tft.fillCircle(cx, cy, r + 2, C_ACCENT);
  tft.fillCircle(cx, cy, r, C_SURFACE);
  uint16_t nc = C_CYAN;
  int lx = cx - 10*scale, rx = cx + 10*scale;
  int ty = cy - 13*scale, by = cy + 13*scale;
  tft.drawLine(lx, by, lx, ty, nc);
  tft.drawLine(lx, ty, rx, by, nc);
  tft.drawLine(rx, by, rx, ty, nc);
  tft.drawLine(lx+1, by, lx+1, ty, nc);
  tft.drawLine(rx+1, by, rx+1, ty, nc);
  int bx = cx-7*scale, bw = 14*scale, bby = cy+4*scale;
  tft.fillRect(bx, bby, bw, 8*scale, C_ACCENT);
  tft.drawFastHLine(bx-2, bby-1, bw+4, C_ACCENT);
  tft.fillRect(bx+2,  bby+2, 2*scale, 5*scale, C_SURFACE);
  tft.fillRect(bx+6,  bby+2, 2*scale, 5*scale, C_SURFACE);
  tft.fillRect(bx+10, bby+2, 2*scale, 5*scale, C_SURFACE);
}

void updateStatusCard(const char* line1, uint16_t col1,
                      const char* line2, uint16_t col2,
                      uint16_t borderCol) {
  tft.fillRect(10, 60, SCR_W - 20, 40, C_BG);
  drawCard(10, 60, SCR_W - 20, 40, C_SURFACE, borderCol);
  printCentered(line1, CX, 68, 2, col1);
  printCentered(line2, CX, 88, 1, col2);
}

void updateActivityLog(const char* msg, uint16_t col) {
  tft.fillRect(11, 273, SCR_W - 22, 34, C_SURFACE);
  printCentered(msg, CX, 285, 1, col);
}

// ═════════════════════════════════════════════════════════════════
//
//  SECTION 2 — STARTUP SCREENS
//
// ═════════════════════════════════════════════════════════════════

void showSplash() {
  tft.fillScreen(C_BG);
  drawAccentBars();
  drawLogo(CX, 118, 1);
  printCentered("NexiBin",                CX, 165, 3, C_WHITE);
  printCentered("Smart Waste Management", CX, 195, 1, C_LTGRAY);
  drawDivider(215, C_BORDER);
  printCentered("Initializing System...", CX, 225, 1, C_YELLOW);
  printCentered("v2.0.0",                 CX, 305, 1, C_BORDER);
  delay(2800);
}

void showCalibration() {
  tft.fillScreen(C_BG);
  for (int i = 0; i < 4; i++) tft.drawFastHLine(0, i, SCR_W, C_ACCENT);
  drawLogo(CX, 55, 1);
  drawCard(15, 90, SCR_W - 30, 44, C_SURFACE, C_BORDER);
  printCentered("System Calibration", CX, 100, 2, C_WHITE);
  printCentered("Please wait...",     CX, 120, 1, C_YELLOW);
  drawDivider(143, C_BORDER);

  const int   BAR_X = 25, BAR_Y = 155;
  const int   BAR_W = SCR_W - 50, BAR_H = 10;
  const int   STEPS = 6;
  const char* labels[STEPS] = {
    "Sensor Init",
    "Ultrasonic Check",
    "IR & Metal Sensor",
    "Rain Sensor",
    "Motor Config",
    "Self-Test"
  };

  tft.fillRoundRect(BAR_X-1, BAR_Y-1, BAR_W+2, BAR_H+2, 5, C_BORDER);

  for (int s = 0; s < STEPS; s++) {
    tft.fillRect(15, 170, SCR_W-30, 12, C_BG);
    printCentered(labels[s], CX, 172, 1, C_CYAN);
    for (int frame = 0; frame < 8; frame++) {
      for (int d = 0; d < 3; d++) {
        uint16_t col = (d == frame % 3) ? C_ACCENT : C_BORDER;
        tft.fillCircle(CX - 10 + d*10, 192, 3, col);
      }
      delay(120);
    }
    int filled = (BAR_W * (s+1)) / STEPS;
    tft.fillRoundRect(BAR_X, BAR_Y, filled, BAR_H, 4, C_ACCENT);
    tft.fillRect(BAR_X, BAR_Y+BAR_H+4, BAR_W, 10, C_BG);
    char pct[8]; sprintf(pct, "%d%%", (s+1)*100/STEPS);
    printCentered(pct, CX, BAR_Y+BAR_H+4, 1, C_LTGRAY);
  }

  tft.fillRect(15, 186, SCR_W-30, 20, C_BG);
  drawBadge(CX, 192, "  Calibration Complete  ", C_GREEN, C_BG);
  delay(900);
}

void showWiFiScreen() {
  tft.fillScreen(C_BG);
  for (int i = 0; i < 4; i++) tft.drawFastHLine(0, i, SCR_W, C_ACCENT);

  for (int a = 3; a >= 1; a--) {
    uint16_t col = (a == 3) ? C_BORDER : (a == 2) ? C_CYAN : C_ACCENT;
    int rr = a * 14;
    tft.drawCircle(CX, 70+rr, rr, col);
    tft.fillRect(CX-rr-2, 70+rr-rr-2, (rr+2)*2, rr+2, C_BG);
  }
  tft.fillCircle(CX, 112, 4, C_ACCENT);

  drawCard(15, 100, SCR_W-30, 36, C_SURFACE, C_BORDER);
  printCentered("Connecting to WiFi...", CX, 108, 1, C_WHITE);
  printCentered(WIFI_SSID,              CX, 122, 1, C_CYAN);
  drawDivider(146, C_BORDER);
  printCentered("Establishing link",    CX, 158, 1, C_YELLOW);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    for (int frame = 0; frame < 2; frame++) {
      tft.fillRect(CX-22, 175, 44, 18, C_BG);
      int barH[4] = {4, 8, 12, 16};
      for (int b = 0; b < 4; b++) {
        uint16_t bc = (b <= frame % 4) ? C_ACCENT : C_BORDER;
        tft.fillRect(CX-18+b*12, 175+(16-barH[b]), 8, barH[b], bc);
      }
      delay(400);
    }
    attempts++;
  }

  tft.fillRect(0, 148, SCR_W, 60, C_BG);

  if (WiFi.status() == WL_CONNECTED) {
    drawCard(15, 155, SCR_W-30, 100, C_SURFACE, C_GREEN);
    printCentered("Connected!", CX, 165, 2, C_GREEN);
    drawDivider(185, C_GREEN);

    String ip = WiFi.localIP().toString();
    char rssiStr[16]; sprintf(rssiStr, "%d dBm", WiFi.RSSI());

    tft.setTextSize(1);
    tft.setTextColor(C_LTGRAY); tft.setCursor(25, 193); tft.print("SSID:");
    tft.setTextColor(C_WHITE);  tft.setCursor(75, 193); tft.print(WIFI_SSID);
    tft.setTextColor(C_LTGRAY); tft.setCursor(25, 210); tft.print("IP:");
    tft.setTextColor(C_CYAN);   tft.setCursor(75, 210); tft.print(ip);
    tft.setTextColor(C_LTGRAY); tft.setCursor(25, 227); tft.print("Signal:");
    tft.setTextColor(C_YELLOW); tft.setCursor(82, 227); tft.print(rssiStr);
    drawBadge(CX, 248, "  Online  ", C_GREEN, C_BG);
    Serial.print("Connected. IP: "); Serial.println(ip);
  } else {
    drawCard(15, 155, SCR_W-30, 60, C_SURFACE, C_RED);
    printCentered("Connection Failed", CX, 168, 2, C_RED);
    printCentered("Running Offline",   CX, 195, 1, C_LTGRAY);
    Serial.println("[WARN] WiFi failed — offline mode.");
  }
  delay(2500);
}

// ═════════════════════════════════════════════════════════════════
//
//  SECTION 3 — WELCOME DASHBOARD
//
// ═════════════════════════════════════════════════════════════════

void drawOneBinBar(int16_t y, const char* label, int pct,
                   bool isFull, uint16_t labelCol) {
  tft.setTextSize(1);
  tft.setTextColor(labelCol, C_SURFACE);
  tft.setCursor(18, y); tft.print(label);

  char buf[8]; sprintf(buf, "%3d%%", pct);
  tft.setTextColor(isFull ? C_RED : C_WHITE, C_SURFACE);
  tft.setCursor(SCR_W-42, y); tft.print(buf);

  int bx = 18, by = y+11, bw = SCR_W-36, bh = 9;
  tft.fillRect(bx, by, bw, bh, C_BORDER);

  uint16_t fc = (pct >= 90) ? C_RED   :
                (pct >= 70) ? C_ORANGE :
                (pct >= 40) ? C_YELLOW : C_GREEN;

  int fill = map(pct, 0, 100, 0, bw);
  if (fill > 0) tft.fillRect(bx, by, fill, bh, fc);

  if (isFull) {
    tft.fillRoundRect(SCR_W-44, by-1, 36, 11, 5, C_RED);
    tft.setTextColor(C_WHITE, C_RED);
    tft.setCursor(SCR_W-40, by+2);
    tft.print("FULL");
  }
}

void drawBinBars() {
  drawCard(10, 108, SCR_W-20, 156, C_SURFACE, C_BORDER);
  printCentered("BIN LEVELS", CX, 114, 1, C_ACCENT);
  drawDivider(126, C_BORDER);
  drawOneBinBar(132, "METAL", metalPct, metalFull, C_LTGRAY);
  drawOneBinBar(162, "WET",   wetPct,   wetFull,   C_LTGRAY);
  drawOneBinBar(192, "DRY",   dryPct,   dryFull,   C_LTGRAY);

  if (WiFi.status() == WL_CONNECTED) {
    String ip = WiFi.localIP().toString();
    tft.setTextSize(1);
    tft.setTextColor(C_BORDER, C_SURFACE);
    tft.setCursor(18, 228); tft.print("IP: ");
    tft.setTextColor(C_CYAN, C_SURFACE);
    tft.print(ip);
  }
}

void refreshBinBars() {
  // Only redraw the inner content area to avoid full-screen flicker
  tft.fillRect(18, 128, SCR_W-36, 108, C_SURFACE);
  drawOneBinBar(132, "METAL", metalPct, metalFull, C_LTGRAY);
  drawOneBinBar(162, "WET",   wetPct,   wetFull,   C_LTGRAY);
  drawOneBinBar(192, "DRY",   dryPct,   dryFull,   C_LTGRAY);

  if (WiFi.status() == WL_CONNECTED) {
    String ip = WiFi.localIP().toString();
    tft.setTextSize(1);
    tft.setTextColor(C_BORDER, C_SURFACE);
    tft.setCursor(18, 228); tft.print("IP: ");
    tft.setTextColor(C_CYAN, C_SURFACE);
    tft.print(ip);
  }
}

void showDashboard() {
  tft.fillScreen(C_BG);

  // Header
  tft.fillRect(0, 0, SCR_W, 52, C_SURFACE);
  tft.drawFastHLine(0, 52, SCR_W, C_BORDER);
  drawLogo(30, 26, 1);
  tft.setTextColor(C_WHITE);  tft.setTextSize(2);
  tft.setCursor(64, 12); tft.print("NexiBin");
  tft.setTextColor(C_ACCENT); tft.setTextSize(1);
  tft.setCursor(64, 33); tft.print("Smart Waste System");
  drawBadge(SCR_W-30, 6, "LIVE", C_GREEN, C_BG);

  // Status card
  drawCard(10, 60, SCR_W-20, 40, C_SURFACE, C_GREEN);
  printCentered("INSERT WASTE",      CX, 68, 2, C_GREEN);
  printCentered("Monitoring active", CX, 88, 1, C_LTGRAY);

  // Bin level bars
  drawBinBars();

  // Activity log
  drawCard(10, 272, SCR_W-20, 36, C_SURFACE, C_BORDER);
  printCentered("Activity Log",         CX, 277, 1, C_LTGRAY);
  drawDivider(288, C_BORDER);
  printCentered("Waiting for input...", CX, 295, 1, C_CYAN);

  // Bottom accent
  for (int i = 0; i < 4; i++) tft.drawFastHLine(0, SCR_H-1-i, SCR_W, C_ACCENT);
}

// ═════════════════════════════════════════════════════════════════
//
//  SECTION 4 — SORTING CYCLE SCREENS
//
// ═════════════════════════════════════════════════════════════════

void showObjectDetected() {
  updateStatusCard("OBJECT DETECTED", C_YELLOW,
                   "Analyzing...",    C_LTGRAY, C_YELLOW);
  updateActivityLog("Object in chute — analyzing", C_YELLOW);
}

void showStabilizeCountdown() {
  for (int s = 3; s >= 1; s--) {
    tft.fillRect(10, 60, SCR_W-20, 40, C_BG);
    drawCard(10, 60, SCR_W-20, 40, C_SURFACE, C_YELLOW);
    printCentered("STABILIZING...", CX, 68, 1, C_YELLOW);
    char buf[4]; sprintf(buf, "%d", s);
    printCentered(buf, CX, 78, 2, C_WHITE);
    updateActivityLog("Stabilizing sensors...", C_YELLOW);
    delay(1000);
  }
}

void showClassification(const char* label, uint16_t col) {
  updateStatusCard(label, col, "Detected", C_LTGRAY, col);
  updateActivityLog(label, col);
  delay(1200);
}

void showSorting(const char* stage) {
  updateStatusCard("SORTING...", C_CYAN, stage, C_LTGRAY, C_CYAN);
  updateActivityLog(stage, C_CYAN);
}

void showWaitRemoval(int secondsLeft) {
  tft.fillRect(10, 60, SCR_W-20, 40, C_BG);
  drawCard(10, 60, SCR_W-20, 40, C_SURFACE, C_BORDER);
  printCentered("Remove object",  CX, 68, 1, C_YELLOW);
  char buf[28]; sprintf(buf, "Auto-reset in %ds", secondsLeft);
  printCentered(buf, CX, 82, 1, C_LTGRAY);
}

void showResetting() {
  updateStatusCard("RESETTING...", C_ACCENT,
                   "Please wait", C_LTGRAY, C_ACCENT);
  updateActivityLog("System resetting...", C_ACCENT);
}

void showBinFullAlert(const char* binName) {
  tft.fillScreen(C_BG);
  for (int i = 0; i < 4; i++) tft.drawFastHLine(0, i, SCR_W, C_RED);
  drawCard(15, 80, SCR_W-30, 160, C_SURFACE, C_RED);
  printCentered("BIN FULL",      CX, 100, 3, C_RED);
  drawDivider(140, C_RED);
  char line[24]; sprintf(line, "%s BIN", binName);
  printCentered(line,            CX, 155, 2, C_WHITE);
  printCentered("Please empty", CX, 185, 1, C_LTGRAY);
  printCentered("the bin now.", CX, 200, 1, C_LTGRAY);
  drawBadge(CX, 225, "  Alert sent to server  ", C_RED, C_WHITE);
  delay(3000);
}

// ═════════════════════════════════════════════════════════════════
//
//  SECTION 5 — REWARD / QR SCREEN
//
// ═════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
//  QR CONFIGURATION
//  Version 3 handles URLs up to ~77 chars (ECC_LOW).
//  If your token is very long, bump to version 4 and reduce
//  QR_MODULE_PX so the code still fits on screen.
// ─────────────────────────────────────────────────────────────────
#define QR_VERSION    3      // QR version (1–40). Version 3 = 29×29 modules.
#define QR_ECC        ECC_LOW  // Error correction: LOW gives maximum data capacity
#define QR_MODULE_PX  7      // Pixel size of each QR module (7px → 29*7 = 203px)
#define QR_QUIET_PX   4      // Quiet zone (white border) in pixels each side
#define QR_AREA_SIZE  (29 * QR_MODULE_PX + QR_QUIET_PX * 2)  // total canvas size

// Draws a real, scannable QR code centred on the TFT display.
// x0, y0 = top-left corner of the white QR canvas area.
void drawQRCode(const char* text, int16_t x0, int16_t y0) {
  // Allocate QR struct — this lives on the stack (~160 bytes for v3)
  QRCode qrcode;
  uint8_t qrData[qrcode_getBufferSize(QR_VERSION)];

  int err = qrcode_initText(&qrcode, qrData, QR_VERSION, QR_ECC, text);
  if (err != 0) {
    // Encoding failed (URL too long for this version)
    Serial.print("[QR] Error encoding — code: "); Serial.println(err);
    printCentered("QR Error", CX, y0 + QR_AREA_SIZE / 2, 1, C_RED);
    return;
  }

  Serial.print("[QR] Version: ");   Serial.print(qrcode.version);
  Serial.print("  Modules: ");      Serial.print(qrcode.size);
  Serial.print("x");                Serial.println(qrcode.size);

  // White canvas with quiet zone
  tft.fillRect(x0, y0, QR_AREA_SIZE, QR_AREA_SIZE, C_WHITE);

  // Draw each module
  for (uint8_t row = 0; row < qrcode.size; row++) {
    for (uint8_t col = 0; col < qrcode.size; col++) {
      uint16_t color = qrcode_getModule(&qrcode, col, row) ? 0x0000 : C_WHITE;
      int16_t  px    = x0 + QR_QUIET_PX + col * QR_MODULE_PX;
      int16_t  py    = y0 + QR_QUIET_PX + row * QR_MODULE_PX;
      tft.fillRect(px, py, QR_MODULE_PX, QR_MODULE_PX, color);
    }
  }
}

void showQRReward(String token) {
  tft.fillScreen(C_BG);

  // ── Top accent bar ──────────────────────────────────────────
  for (int i = 0; i < 4; i++) tft.drawFastHLine(0, i, SCR_W, C_YELLOW);

  // ── Header card ─────────────────────────────────────────────
  drawCard(15, 8, SCR_W-30, 50, C_SURFACE, C_YELLOW);
  printCentered("REWARD EARNED!",   CX, 16, 2, C_YELLOW);
  printCentered("Scan QR to claim", CX, 40, 1, C_LTGRAY);

  // ── Build claim URL ─────────────────────────────────────────
  String url = "http://";
  url += BACKEND_HOST;
  url += ":";
  url += String(BACKEND_PORT);
  url += "/trash/";
  url += token;

  Serial.print("[QR URL] "); Serial.println(url);
  Serial.print("[QR URL length] "); Serial.println(url.length());

  // ── Generating notice (shown while QR encodes) ───────────────
  int16_t qrX = (SCR_W - QR_AREA_SIZE) / 2;   // horizontally centred
  int16_t qrY = 64;

  tft.fillRect(qrX, qrY, QR_AREA_SIZE, QR_AREA_SIZE, C_SURFACE);
  printCentered("Generating QR...", CX, qrY + QR_AREA_SIZE / 2 - 4, 1, C_YELLOW);

  // ── Draw real QR code ────────────────────────────────────────
  drawQRCode(url.c_str(), qrX, qrY);

  // ── Thin yellow border around QR ────────────────────────────
  tft.drawRect(qrX - 2, qrY - 2, QR_AREA_SIZE + 4, QR_AREA_SIZE + 4, C_YELLOW);

  // ── URL text below QR ────────────────────────────────────────
  int16_t urlY = qrY + QR_AREA_SIZE + 8;
  tft.setTextSize(1);
  tft.setTextColor(C_LTGRAY);
  // Truncate URL display to fit screen width (28 chars per line)
  if (url.length() > 28) {
    tft.setCursor(12, urlY);
    tft.print(url.substring(0, 28));
    tft.setCursor(12, urlY + 12);
    tft.print(url.substring(28, min((unsigned int)url.length(), (unsigned int)56)));
  } else {
    tft.setCursor(12, urlY);
    tft.print(url);
  }

  // ── Live countdown ───────────────────────────────────────────
  int16_t cntY = SCR_H - 34;
  for (int s = QR_TIMEOUT_MS / 1000; s > 0; s--) {
    tft.fillRect(15, cntY, SCR_W-30, 26, C_BG);
    drawCard(15, cntY, SCR_W-30, 26, C_SURFACE, C_YELLOW);
    char countdown[28]; sprintf(countdown, "Expires in %d seconds", s);
    printCentered(countdown, CX, cntY + 9, 1, C_YELLOW);
    delay(1000);
  }
}

void showThankYou() {
  tft.fillScreen(C_BG);
  for (int i = 0; i < 4; i++) tft.drawFastHLine(0, i, SCR_W, C_GREEN);
  drawLogo(CX, 110, 1);
  printCentered("Thank You!",           CX, 155, 3, C_GREEN);
  printCentered("Returning to idle...", CX, 195, 1, C_LTGRAY);
  for (int i = 0; i < 4; i++) tft.drawFastHLine(0, SCR_H-1-i, SCR_W, C_GREEN);
  delay(2000);
}

// ═════════════════════════════════════════════════════════════════
//
//  SECTION 6 — ULTRASONIC SENSOR READING (FULLY REVISED)
//
//  Key improvements:
//  • No shared-pin logic whatsoever — all pins are independent
//  • Median-of-N filtering to reject spike outliers
//  • Out-of-range values discarded (too close, too far, timeout)
//  • Per-sensor inter-read delay to prevent crosstalk
//  • Last-valid caching so a bad read doesn't corrupt the display
//
// ═════════════════════════════════════════════════════════════════

// Last valid reading cache (protects against transient bad echoes)
float lastValidMetal = METAL_EMPTY_CM;
float lastValidWet   = WET_EMPTY_CM;
float lastValidDry   = DRY_EMPTY_CM;

// Take a single raw ultrasonic distance measurement (cm)
// Returns US_MAX_CM + 1 on timeout or out-of-range
float measureRawCm(uint8_t trigPin, uint8_t echoPin) {
  // Ensure trigger is low before pulse
  digitalWrite(trigPin, LOW);
  delayMicroseconds(4);

  // Send 10µs trigger pulse
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Measure echo duration with timeout
  unsigned long duration = pulseIn(echoPin, HIGH, US_TIMEOUT_US);

  // Timeout → no echo received
  if (duration == 0) return US_MAX_CM + 1.0f;

  float cm = duration * 0.0343f / 2.0f;

  // Reject physically implausible readings
  if (cm < US_MIN_CM || cm > US_MAX_CM) return US_MAX_CM + 1.0f;

  return cm;
}

// Simple insertion sort for small arrays (avoids stdlib dependency)
void sortFloats(float* arr, int n) {
  for (int i = 1; i < n; i++) {
    float key = arr[i];
    int j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j+1] = arr[j];
      j--;
    }
    arr[j+1] = key;
  }
}

// Take multiple samples and return the median.
// Falls back to the cached last-valid value if all samples are bad.
float measureFilteredCm(uint8_t trigPin, uint8_t echoPin, float& lastValid) {
  float samples[US_SAMPLES];
  int   validCount = 0;

  for (int i = 0; i < US_SAMPLES; i++) {
    float reading = measureRawCm(trigPin, echoPin);
    if (reading <= US_MAX_CM) {            // valid only
      samples[validCount++] = reading;
    }
    delay(US_SAMPLE_DELAY_MS);
  }

  // Need at least half the samples to be valid
  if (validCount < (US_SAMPLES / 2 + 1)) {
    Serial.print("[US WARN] Insufficient valid samples on TRIG=");
    Serial.print(trigPin);
    Serial.print(" — using cached ");
    Serial.println(lastValid);
    return lastValid;
  }

  // Sort valid samples and take median
  sortFloats(samples, validCount);
  float median = samples[validCount / 2];

  // Update cache and return
  lastValid = median;
  return median;
}

// ─────────────────────────────────────────────────────────────────
//  Per-bin percentage conversion using independent calibration
// ─────────────────────────────────────────────────────────────────

// Convert a distance reading to fill percentage for a specific bin.
// emptyCm  = distance when bin is empty (sensor sees the bottom)
// fullCm   = distance when bin is full  (waste level near sensor)
// A shorter distance = more full.
int distanceToPct(float distCm, float emptyCm, float fullCm) {
  // Clamp to calibrated range
  distCm = constrain(distCm, fullCm, emptyCm);

  // Map: emptyCm → 0%, fullCm → 100%
  float pct = (emptyCm - distCm) / (emptyCm - fullCm) * 100.0f;
  return constrain((int)pct, 0, 100);
}

// ─────────────────────────────────────────────────────────────────
//  Main bin-level reader — no pin switching, clean and simple
// ─────────────────────────────────────────────────────────────────
void readBinLevels() {
  // ── Metal bin ─────────────────────────────────────────────────
  float metalCm = measureFilteredCm(METAL_TRIG, METAL_ECHO, lastValidMetal);
  metalPct  = distanceToPct(metalCm, METAL_EMPTY_CM, METAL_FULL_CM);
  metalFull = (metalPct >= METAL_FULL_THRESH);

  delay(US_INTER_SENSOR_MS);   // allow echo to fully dissipate

  // ── Wet bin ───────────────────────────────────────────────────
  float wetCm = measureFilteredCm(WET_TRIG, WET_ECHO, lastValidWet);
  wetPct  = distanceToPct(wetCm, WET_EMPTY_CM, WET_FULL_CM);
  wetFull = (wetPct >= WET_FULL_THRESH);

  delay(US_INTER_SENSOR_MS);

  // ── Dry bin ───────────────────────────────────────────────────
  float dryCm = measureFilteredCm(DRY_TRIG, DRY_ECHO, lastValidDry);
  dryPct  = distanceToPct(dryCm, DRY_EMPTY_CM, DRY_FULL_CM);
  dryFull = (dryPct >= DRY_FULL_THRESH);

  Serial.print("[BIN] Metal: "); Serial.print(metalCm, 1); Serial.print("cm → ");
  Serial.print(metalPct); Serial.print("%  |  Wet: ");
  Serial.print(wetCm, 1); Serial.print("cm → ");
  Serial.print(wetPct); Serial.print("%  |  Dry: ");
  Serial.print(dryCm, 1); Serial.print("cm → ");
  Serial.print(dryPct); Serial.println("%");
}

// ─────────────────────────────────────────────────────────────────
//  Waste classification (inductive metal + rain sensors)
// ─────────────────────────────────────────────────────────────────

// Majority-vote debounce: returns true if activeState seen more than
// half the time across `samples` reads.
bool readStable(int pin, int activeState, int samples) {
  int count = 0;
  for (int i = 0; i < samples; i++) {
    if (digitalRead(pin) == activeState) count++;
    delay(5);
  }
  return (count > samples / 2);
}

// Returns stepper target angle based on waste type.
// Priority: Metal → Wet → Dry (default)
int classifyWaste() {
  bool isMetal = readStable(METAL_PIN, HIGH, 10);
  bool isWet   = readStable(RAIN_PIN,  LOW,   7);

  Serial.print("[SENSOR] Metal: "); Serial.print(isMetal ? "YES" : "no");
  Serial.print("  |  Wet: ");       Serial.println(isWet  ? "YES" : "no");

  if (isMetal && isWet) {
    Serial.println("[WARN] Both sensors active — defaulting to DRY (conflict)");
    return ANGLE_DRY;
  }
  if (isMetal) return ANGLE_METAL;
  if (isWet)   return ANGLE_WET;
  return ANGLE_DRY;
}

// ═════════════════════════════════════════════════════════════════
//
//  SECTION 7 — MOTOR CONTROL
//
// ═════════════════════════════════════════════════════════════════

void moveToAngle(int angle) {
  long steps = (long)(angle * STEPS_PER_DEG);
  stepper.moveTo(steps);
  while (stepper.distanceToGo() != 0) {
    stepper.run();
  }
}

void dropWaste() {
  Serial.println("[SERVO] Open");
  myServo.write(SERVO_OPEN);
  delay(SERVO_HOLD_MS);
  Serial.println("[SERVO] Close");
  myServo.write(SERVO_CLOSED);
  delay(300);
}

// ═════════════════════════════════════════════════════════════════
//
//  SECTION 8 — BACKEND COMMUNICATION
//
// ═════════════════════════════════════════════════════════════════

void sendBinLevels() {
  if (WiFi.status() != WL_CONNECTED) return;

  StaticJsonDocument<160> doc;
  doc["metallic"] = metalPct;
  doc["wet"]      = wetPct;
  doc["dry"]      = dryPct;
  doc["api_key"]  = API_KEY;
  String body; serializeJson(doc, body);

  http.beginRequest();
  http.post(ENDPOINT_BINS);
  http.sendHeader("Content-Type",   "application/json");
  http.sendHeader("Content-Length", body.length());
  http.beginBody();
  http.print(body);
  http.endRequest();

  int code = http.responseStatusCode();
  http.responseBody();
  Serial.print("[HTTP] /api/iot/bins → "); Serial.println(code);
}

void sendBinAlert(const char* binName, int pct) {
  if (WiFi.status() != WL_CONNECTED) return;

  char path[48];
  sprintf(path, "/api/bins/collect/%s", binName);

  StaticJsonDocument<128> doc;
  doc["fill_pct"] = pct;
  doc["alert"]    = "BIN_FULL";
  doc["api_key"]  = API_KEY;
  String body; serializeJson(doc, body);

  http.beginRequest();
  http.post(path);
  http.sendHeader("Content-Type",   "application/json");
  http.sendHeader("Content-Length", body.length());
  http.beginBody();
  http.print(body);
  http.endRequest();

  int code = http.responseStatusCode();
  http.responseBody();
  Serial.print("[HTTP] Alert/"); Serial.print(binName);
  Serial.print(" → "); Serial.println(code);
}

String sendTrashEvent(int angle) {
  if (WiFi.status() != WL_CONNECTED) return "";

  const char* wasteType = (angle == ANGLE_METAL) ? "metal" :
                          (angle == ANGLE_WET)   ? "wet"   : "dry";

  StaticJsonDocument<192> doc;
  doc["waste_type"] = wasteType;
  doc["metallic"]   = metalPct;
  doc["wet"]        = wetPct;
  doc["dry"]        = dryPct;
  doc["api_key"]    = API_KEY;
  String body; serializeJson(doc, body);

  http.beginRequest();
  http.post(ENDPOINT_TRASH);
  http.sendHeader("Content-Type",   "application/json");
  http.sendHeader("Content-Length", body.length());
  http.beginBody();
  http.print(body);
  http.endRequest();

  int    code = http.responseStatusCode();
  String res  = http.responseBody();
  Serial.print("[HTTP] /api/iot/trash → "); Serial.println(code);
  Serial.println(res);

  if ((code == 200 || code == 201) && angle == ANGLE_METAL) {
    StaticJsonDocument<256> json;
    if (!deserializeJson(json, res) && json.containsKey("token")) {
      return json["token"].as<String>();
    }
  }
  return "";
}

// ═════════════════════════════════════════════════════════════════
//
//  SECTION 9 — ALERT HANDLER
//
// ═════════════════════════════════════════════════════════════════

void handleAlerts() {
  if (metalFull && !alertSentMetal) {
    sendBinAlert("metal", metalPct);
    showBinFullAlert("METAL");
    alertSentMetal = true;
    showDashboard();
  }
  if (!metalFull) alertSentMetal = false;

  if (wetFull && !alertSentWet) {
    sendBinAlert("wet", wetPct);
    showBinFullAlert("WET");
    alertSentWet = true;
    showDashboard();
  }
  if (!wetFull) alertSentWet = false;

  if (dryFull && !alertSentDry) {
    sendBinAlert("dry", dryPct);
    showBinFullAlert("DRY");
    alertSentDry = true;
    showDashboard();
  }
  if (!dryFull) alertSentDry = false;
}

// ═════════════════════════════════════════════════════════════════
//
//  SECTION 10 — MAIN SORTING CYCLE
//
//  Flow: [DASHBOARD] → IR detected → Object Detected → Stabilize
//        → Classify → Sort → Thank You
//        → Wait removal (10s timeout) → RESET → [DASHBOARD]
//
// ═════════════════════════════════════════════════════════════════

void runSortingCycle() {
  systemBusy = true;
  Serial.println("\n[EVENT] Object detected — starting cycle");

  // STEP 1: Debounce IR
  delay(50);
  if (digitalRead(IR_PIN) != LOW) {
    Serial.println("[IR] False trigger — aborting.");
    systemBusy = false;
    return;
  }

  // STEP 2: Object Detected screen
  showObjectDetected();

  // STEP 3: 3-second stabilize countdown
  Serial.println("[SYSTEM] Stabilizing...");
  showStabilizeCountdown();

  // STEP 4: Classify waste
  int angle = classifyWaste();
  Serial.print("[RESULT] Angle target: "); Serial.println(angle);

  // STEP 5: Show classification
  if      (angle == ANGLE_METAL) showClassification("METAL WASTE", C_LTGRAY);
  else if (angle == ANGLE_WET)   showClassification("WET WASTE",   C_CYAN);
  else                           showClassification("DRY WASTE",   C_YELLOW);

  // STEP 6: Rotate stepper to target bin
  if (angle != ANGLE_WET) {
    showSorting("Rotating bin...");
    Serial.println("[STEPPER] Moving to bin...");
    moveToAngle(angle);
  } else {
    showSorting("Wet bin (centre)");
    Serial.println("[STEPPER] Centre — no rotation needed.");
  }

  // STEP 7: Drop waste
  showSorting("Dropping waste...");
  dropWaste();

  // STEP 8: Return stepper to home
  if (angle != ANGLE_WET) {
    showSorting("Returning to home...");
    Serial.println("[STEPPER] Returning to 0");
    moveToAngle(0);
  }

  Serial.println("[SYSTEM] Sorting complete.");

  // STEP 9: Backend + Reward
  if (angle == ANGLE_METAL) {
    showSorting("Getting reward...");
    String token = sendTrashEvent(angle);
    if (token.length() > 0) {
      showQRReward(token);         // 15s countdown inside
    } else {
      Serial.println("[REWARD] No token received.");
    }
  } else {
    sendTrashEvent(angle);         // silent log for wet/dry
  }

  // STEP 10: Thank You screen
  showThankYou();

  // STEP 11: Wait for object removal with 10s timeout
  Serial.println("[SYSTEM] Waiting for object removal...");
  unsigned long removalStart = millis();
  int lastSecShown = -1;

  while (digitalRead(IR_PIN) == LOW) {
    unsigned long elapsed = millis() - removalStart;
    if (elapsed >= REMOVAL_TIMEOUT_MS) {
      Serial.println("[SYSTEM] Removal timeout — auto reset.");
      break;
    }
    int secLeft = (REMOVAL_TIMEOUT_MS - elapsed) / 1000;
    if (secLeft != lastSecShown) {
      showWaitRemoval(secLeft);
      lastSecShown = secLeft;
    }
    delay(100);
  }

  // STEP 12: Reset
  Serial.println("[SYSTEM] Resetting...");
  showResetting();
  delay(COOLDOWN_MS);

  stepper.setCurrentPosition(0);
  myServo.write(SERVO_CLOSED);

  systemBusy = false;
  Serial.println("[SYSTEM] Ready — returning to dashboard.\n");

  // STEP 13: Back to dashboard
  showDashboard();
}

// ═════════════════════════════════════════════════════════════════
//
//  SETUP
//
// ═════════════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  Serial.println("=== NexiBin v2.0 Booting ===");

  // ── Classification sensors ────────────────────────────────────
  pinMode(IR_PIN,    INPUT);
  pinMode(METAL_PIN, INPUT);
  pinMode(RAIN_PIN,  INPUT_PULLUP);

  // ── Ultrasonic — all pins independently configured ────────────
  // Metal ultrasonic (D7 / A3)
  pinMode(METAL_TRIG, OUTPUT);
  pinMode(METAL_ECHO, INPUT);
  digitalWrite(METAL_TRIG, LOW);

  // Wet ultrasonic (A4 / A5)
  pinMode(WET_TRIG, OUTPUT);
  pinMode(WET_ECHO, INPUT);
  digitalWrite(WET_TRIG, LOW);

  // Dry ultrasonic (D2 / D3)
  pinMode(DRY_TRIG, OUTPUT);
  pinMode(DRY_ECHO, INPUT);
  digitalWrite(DRY_TRIG, LOW);

  // ── Servo ─────────────────────────────────────────────────────
  myServo.attach(SERVO_PIN);
  myServo.write(SERVO_CLOSED);

  // ── Stepper ───────────────────────────────────────────────────
  stepper.setMaxSpeed(STEP_MAX_SPEED);
  stepper.setAcceleration(STEP_ACCEL);
  stepper.setCurrentPosition(0);

  // ── TFT ───────────────────────────────────────────────────────
  SPI.begin();
  tft.init(240, 320);
  tft.setRotation(0);
  tft.fillScreen(C_BG);

  // ── Startup sequence ──────────────────────────────────────────
  showSplash();
  showCalibration();
  showWiFiScreen();

  // ── Initial sensor read before showing dashboard ──────────────
  readBinLevels();

  // ── Welcome dashboard ─────────────────────────────────────────
  showDashboard();

  // ── Seed timers ───────────────────────────────────────────────
  lastSensor = millis() - SENSOR_INTERVAL;
  lastSend   = millis() - SEND_INTERVAL;

  Serial.println("=== NexiBin v2.0 Ready ===");
}

// ═════════════════════════════════════════════════════════════════
//
//  LOOP — Idle monitoring + IR trigger
//
// ═════════════════════════════════════════════════════════════════

void loop() {
  unsigned long now = millis();

  // Read bin levels every SENSOR_INTERVAL (idle only)
  if (!systemBusy && now - lastSensor >= SENSOR_INTERVAL) {
    lastSensor = now;
    readBinLevels();
    refreshBinBars();
    handleAlerts();
  }

  // POST bin levels to backend every SEND_INTERVAL (idle only)
  if (!systemBusy && now - lastSend >= SEND_INTERVAL) {
    lastSend = now;
    sendBinLevels();
  }

  // IR object detection → start sorting cycle
  if (!systemBusy && digitalRead(IR_PIN) == LOW) {
    runSortingCycle();
  }
}
