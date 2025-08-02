/*
 * Sistem Monitoring Air dengan Arduino (Final Version)
 * Kompatibel dengan validasi QR scan dan status unlock perangkat
 *
 * Fitur Utama:
 * - Pembacaan sensor aliran air
 * - Kontrol valve otomatis
 * - Monitoring tegangan
 * - Antarmuka LCD (Nokia 5110)
 * - Komunikasi dengan ESP8266 (NodeMCU) via SoftwareSerial (menggunakan JSON)
 * - Integrasi status unlock via serial
 * - Valve tetap tertutup saat unlock aktif
 * - Valve aktif kembali saat unlock dinonaktifkan (tugas selesai)
 * - Perhitungan saldo pulsa (Rupiah) berdasarkan tarif dinamis
 * - Menerima dan mengeksekusi perintah kontrol katup dari NodeMCU
 * - Mengirim status eksekusi perintah kembali ke NodeMCU
 * - Mengirim data meteran real-time ke NodeMCU
 * - Penyimpanan K_FACTOR dan jarakToleransi ke EEPROM
 * - Penanganan error komunikasi serial yang lebih baik
 * - Logika buzzer non-blocking
 *
 * Dibuat & Dimodifikasi oleh: DODI SETIADI
 * Tanggal: [28/06/2025] - Juli 2025
 */

#include <LiquidCrystal_I2C.h>    // Library untuk LCD I2C - *PERHATIAN: Diganti PC08544 di sini, periksa penggunaan yang benar*
#include <SoftwareSerial.h>       // Library untuk komunikasi serial tambahan
#include <PC08544.h>              // Library untuk LCD Nokia 5110
#include <Wire.h>                 // Library untuk komunikasi I2C (untuk LCD I2C jika digunakan)
#include <ArduinoJson.h>          // Library untuk parsing JSON
#include <EEPROM.h>               // Library untuk penyimpanan EEPROM

// Alamat EEPROM untuk menyimpan konfigurasi
#define EEPROM_K_FACTOR_ADDR 0
#define EEPROM_JARAK_TOLERANSI_ADDR 4 // Float membutuhkan 4 byte

PC08544 lcd(3,4,5,7,6); // Pins for Nokia 5110: SCLK, DIN, DC, CS, RST
SoftwareSerial myArd(19, 18); // D19 (RX), D18 (TX) for communication with NodeMCU

String idMeter = "";            // ID Meter dari NodeMCU
bool isUnlocked = false;        // Status perangkat unlocked oleh teknisi
float dataPUL = 0.0;            // Saldo pulsa dalam Rupiah (dataPUL = current_pulse_balance)
float tariffPerM3 = 0.0;        // Tarif air per m3 (didapat dari server via NodeMCU)

// Variabel untuk sensor aliran
volatile unsigned long pulseCount = 0; // Menggunakan unsigned long untuk pulsa
float K_FACTOR = 7.5;           // K-Factor sensor (Pulses per Liter) - Akan dimuat dari EEPROM/diupdate via OTA
unsigned long lastPulseTime = 0; // Waktu terakhir pulsa terdeteksi
unsigned long lastFlowCalculationTime = 0; // Waktu terakhir perhitungan flow
unsigned long flowCalculationInterval = 1000; // Hitung flow setiap 1 detik

float currentFlowRateLPM = 0.0; // Laju aliran dalam Liter per Menit (LPM)
unsigned long totalVolumeMilliLitres = 0; // Total volume air dalam mililiter (untuk disimpan ke DB)
float totalMeterReadingM3 = 0.0; // Total pembacaan meter dalam m3 (akumulatif)

// Pin Data
int flowPin = 2;        // Pin untuk sensor aliran (Interrupt pin)
int echoPin = 10;       // Pin echo untuk sensor ultrasonik
int trigPin = 11;       // Pin trigger untuk sensor ultrasonik
int teganganPin = A0;   // Pin analog untuk pembacaan tegangan
int pinValveOpen = 14;  // Pin kontrol valve (untuk membuka)
int pinValveClose = 15; // Pin kontrol valve (untuk menutup)
int miringPin = 20;     // Pin untuk sensor kemiringan
int buzzerPin = 17;     // Pin untuk buzzer

// Default Value (sebagian besar akan diganti oleh data server)
float jarakToleransi = 10.0;    // Toleransi jarak untuk sensor ultrasonik (cm) - Akan dimuat dari EEPROM/diupdate via OTA
float teganganVolt;             // Nilai tegangan yang dibaca
float pemakaianSesi = 0;        // Total pemakaian air dalam sesi saat ini (Liter)
int distance = 0;               // Jarak dari sensor ultrasonik

// Status Kontrol
bool buzzerTerusan = false;     // Status buzzer menyala terus
bool kirimHabis = false;        // Status pengiriman data saat pulsa habis
bool cekPintuTertutup = true;   // Status pengecekan pintu (true = tertutup, false = terbuka)
bool cekValveTutupOtomatis = false; // Flag untuk valve yang tertutup otomatis (misal karena pulsa habis)
bool lowVoltageDetected = false; // Flag untuk deteksi tegangan rendah

// Variabel untuk pengiriman data meteran periodik ke NodeMCU
unsigned long lastMeterDataSendTime = 0;
const long meterDataSendInterval = 5000; // Kirim data meteran setiap 5 detik

// Variabel untuk buzzer non-blocking
unsigned long previousBuzzerMillis = 0;
const long buzzerInterval = 100; // Interval kedip buzzer

// Fungsi interrupt untuk menghitung jumlah pulsa dari sensor aliran
void IRAM_ATTR pulseCounter() { // IRAM_ATTR untuk performa interrupt lebih baik
    pulseCount++;
}

// Fungsi untuk menulis float ke EEPROM
void writeFloatToEEPROM(int address, float value) {
    byte* p = (byte*)(void*)&value;
    for (int i = 0; i < sizeof(value); i++) {
        EEPROM.write(address + i, *p++);
    }
    EEPROM.commit();
}

// Fungsi untuk membaca float dari EEPROM
float readFloatFromEEPROM(int address) {
    float value;
    byte* p = (byte*)(void*)&value;
    for (int i = 0; i < sizeof(value); i++) {
        *p++ = EEPROM.read(address + i);
    }
    return value;
}

void setup() {
    Serial.begin(9600);    // Inisialisasi komunikasi serial utama (untuk debugging)
    myArd.begin(9600);     // Inisialisasi komunikasi serial dengan NodeMCU
    delay(2000);           // Delay untuk stabilisasi

    EEPROM.begin(512); // Inisialisasi EEPROM dengan ukuran yang cukup

    // Muat K_FACTOR dari EEPROM
    float loadedKFactor = readFloatFromEEPROM(EEPROM_K_FACTOR_ADDR);
    if (isnan(loadedKFactor) || loadedKFactor == 0.0) { // Cek jika nilai tidak valid atau nol
        K_FACTOR = 7.5; // Gunakan nilai default
        writeFloatToEEPROM(EEPROM_K_FACTOR_ADDR, K_FACTOR); // Simpan default ke EEPROM
        Serial.println("K_FACTOR default (7.5) dimuat dan disimpan ke EEPROM.");
    } else {
        K_FACTOR = loadedKFactor;
        Serial.print("K_FACTOR dimuat dari EEPROM: "); Serial.println(K_FACTOR, 2);
    }

    // Muat jarakToleransi dari EEPROM
    float loadedJarakToleransi = readFloatFromEEPROM(EEPROM_JARAK_TOLERANSI_ADDR);
    if (isnan(loadedJarakToleransi) || loadedJarakToleransi == 0.0) { // Cek jika nilai tidak valid atau nol
        jarakToleransi = 15.0; // Gunakan nilai default
        writeFloatToEEPROM(EEPROM_JARAK_TOLERANSI_ADDR, jarakToleransi); // Simpan default ke EEPROM
        Serial.println("Jarak Toleransi default (15.0) dimuat dan disimpan ke EEPROM.");
    } else {
        jarakToleransi = loadedJarakToleransi;
        Serial.print("Jarak Toleransi dimuat dari EEPROM: "); Serial.println(jarakToleransi, 2);
    }

    pinMode(flowPin, INPUT_PULLUP);    // Mengatur pin sensor aliran sebagai input dengan pull-up
    attachInterrupt(digitalPinToInterrupt(flowPin), pulseCounter, FALLING); // Mengatur interrupt pada pin sensor aliran

    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
    pinMode(pinValveOpen, OUTPUT);
    pinMode(pinValveClose, OUTPUT);
    pinMode(miringPin, INPUT); // Asumsi digital input
    pinMode(buzzerPin, OUTPUT);
    digitalWrite(buzzerPin, LOW); // Pastikan buzzer mati di awal

    // Pastikan valve mati di awal
    valve_mati();

    // Inisialisasi LCD
    lcd.begin(84, 48);    // Inisialisasi LCD Nokia 5110
    lcd.setCursor(0, 0);
    lcd.print("   WELCOME");
    lcd.setCursor(0, 2);
    lcd.print("  INDO WATER");
    lcd.setCursor(0, 3);
    lcd.print("   SOLUTION");
    lcd.setCursor(0, 5);
    lcd.print("---SSA---");
    delay(3000);
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Connecting to");
    lcd.setCursor(0, 1);
    lcd.print("Network...");

    lastFlowCalculationTime = millis();
    lastMeterDataSendTime = millis(); // Inisialisasi waktu pengiriman data meteran
}

void loop() {
    unsigned long currentMillis = millis();

    // --- Pembacaan Serial dari NodeMCU ---
    if (myArd.available()) {
        String msgFromNodeMCU = myArd.readStringUntil('\n');
        msgFromNodeMCU.trim();
        Serial.print("Rx NodeMCU: ");
        Serial.println(msgFromNodeMCU);
        
        handleNodeMCU_JSON(msgFromNodeMCU);
    }

    // --- Pemantauan Sensor & Logika Kontrol ---
    checkWaterFlow(); // Ini juga mengurangi saldo dan mengupdate totalMeterReadingM3
    checkDoorStatus(); // Fungsi ini juga mengontrol valve berdasarkan isUnlocked
    checkVoltage(); // Fungsi ini juga mengontrol valve
    checkTiltSensor(); // Asumsi sensor miring diaktifkan (saat ini hanya buzzer)

    // --- Logika Kontrol Valve Utama (Prioritas Otomatis) ---
    // Valve hanya akan terbuka jika:
    // 1. Tidak dalam mode "unlocked" oleh teknisi
    // 2. Saldo pulsa > 0
    // 3. Pintu tertutup
    // 4. Tegangan normal (tidak rendah)
    // 5. Tidak ada perintah penutupan otomatis yang aktif
    
    if (!isUnlocked && dataPUL > 0 && cekPintuTertutup && !lowVoltageDetected && !cekValveTutupOtomatis) {
        valve_buka(); // Tetap buka jika semua kondisi terpenuhi
    } else {
        valve_tutup(); // Tutup valve jika salah satu kondisi tidak terpenuhi
    }

    // --- Tampilan LCD ---
    tampilLCD(String(dataPUL, 2), idMeter); // Tampilkan saldo dengan 2 desimal

    // --- Logika Buzzer (Prioritas) ---
    // Prioritas: Pintu Terbuka > Perangkat Miring > Tegangan Rendah > Pulsa Rendah
    if (distance > jarakToleransi && !isUnlocked) { // Pintu terbuka dan tidak di-unlock
        buzzerTerus();
    } else if (digitalRead(miringPin) == LOW) { // Perangkat miring
        buzzerTerus();
    } else if (lowVoltageDetected) { // Tegangan rendah
        buzzerKedip();
    } else if (dataPUL < 3000.0 && dataPUL > 0.0) { // Pulsa rendah (Rp 3000 ke bawah)
        buzzerKedip();
    } else {
        buzzerMati(); // Matikan buzzer jika tidak ada kondisi peringatan
    }

    // --- Peringatan Pulsa Habis ---
    if (dataPUL <= 0.0) {
        if (!kirimHabis) {
            // Kirim data pemakaian terakhir saat pulsa habis
            sendMeterDataToNodeMCU(currentFlowRateLPM, totalMeterReadingM3, teganganVolt, distance > jarakToleransi, "pulsa_habis");
            kirimHabis = true;
        }
        // Atur flag valve tertutup otomatis
        cekValveTutupOtomatis = true;
    } else {
        kirimHabis = false; // Reset flag jika pulsa sudah diisi kembali
        cekValveTutupOtomatis = false; // Reset flag jika pulsa sudah diisi kembali
    }

    // --- Kirim Data Meteran ke NodeMCU secara Periodik ---
    if (currentMillis - lastMeterDataSendTime >= meterDataSendInterval) {
        lastMeterDataSendTime = currentMillis;
        // Kirim data meteran saat ini ke NodeMCU
        sendMeterDataToNodeMCU(currentFlowRateLPM, totalMeterReadingM3, teganganVolt, distance > jarakToleransi, "normal");
    }
}

// ======================================================
// FUNGSI KOMUNIKASI & PARSING JSON
// ======================================================

void handleNodeMCU_JSON(String jsonString) {
    if (jsonString.length() == 0) {
        Serial.println("Pesan kosong diterima dari NodeMCU.");
        return;
    }

    DynamicJsonDocument doc(512); // Ukuran buffer JSON, sesuaikan jika payload lebih besar
    DeserializationError error = deserializeJson(doc, jsonString);

    if (error) {
        Serial.print(F("Deserialisasi JSON gagal dari NodeMCU: "));
        Serial.println(error.c_str());
        return;
    }

    // --- Penanganan Perintah dari NodeMCU (Kontrol Katup atau Update Info) ---
    if (doc.containsKey("command_type") && doc.containsKey("command_id")) {
        String command_type = doc["command_type"].as<String>();
        int command_id = doc["command_id"].as<int>();
        String current_valve_status_from_node = doc["current_valve_status"].as<String>(); // Status katup yang dilaporkan NodeMCU

        Serial.print("NodeMCU Command: "); Serial.println(command_type);
        Serial.print("Command ID: "); Serial.println(command_id);
        Serial.print("Current Valve Status (NodeMCU): "); Serial.println(current_valve_status_from_node);

        String ack_status = "failed"; // Default status
        String ack_notes = "Perintah tidak dikenali atau tidak dieksekusi.";
        String reported_valve_status = current_valve_status_from_node; // Default, akan diupdate jika berhasil

        if (command_type == "valve_open") {
            if (dataPUL > 0 && cekPintuTertutup && !lowVoltageDetected) { // Hanya buka jika kondisi aman
                valve_buka_by_command(); // Fungsi baru untuk eksekusi perintah
                ack_status = "acknowledged";
                ack_notes = "Katup berhasil dibuka oleh perintah.";
                reported_valve_status = "open";
            } else {
                ack_status = "failed";
                ack_notes = "Gagal membuka katup: Kondisi tidak terpenuhi (pulsa habis/pintu terbuka/tegangan rendah).";
                // Tetap laporkan status katup saat ini
                reported_valve_status = (digitalRead(pinValveOpen) == HIGH && digitalRead(pinValveClose) == LOW) ? "open" : "closed";
            }
        } else if (command_type == "valve_close") {
            valve_tutup_by_command(); // Fungsi baru untuk eksekusi perintah
            ack_status = "acknowledged";
            ack_notes = "Katup berhasil ditutup oleh perintah.";
            reported_valve_status = "closed";
        } else if (command_type == "arduino_config_update" && doc.containsKey("config_data")) {
            // Menerima update konfigurasi untuk Arduino
            JsonObject configData = doc["config_data"];
            if (configData.containsKey("k_factor")) {
                float newKFactor = configData["k_factor"].as<float>();
                if (!isnan(newKFactor) && newKFactor > 0) {
                    K_FACTOR = newKFactor;
                    writeFloatToEEPROM(EEPROM_K_FACTOR_ADDR, K_FACTOR);
                    Serial.print("K_FACTOR diperbarui ke: "); Serial.println(K_FACTOR, 2);
                    ack_notes += "K_FACTOR diperbarui. ";
                } else {
                    ack_notes += "K_FACTOR tidak valid. ";
                }
            }
            if (configData.containsKey("jarak_toleransi")) {
                float newJarakToleransi = configData["jarak_toleransi"].as<float>();
                if (!isnan(newJarakToleransi) && newJarakToleransi >= 0) {
                    jarakToleransi = newJarakToleransi;
                    writeFloatToEEPROM(EEPROM_JARAK_TOLERANSI_ADDR, jarakToleransi);
                    Serial.print("Jarak Toleransi diperbarui ke: "); Serial.println(jarakToleransi, 2);
                    ack_notes += "Jarak Toleransi diperbarui. ";
                } else {
                    ack_notes += "Jarak Toleransi tidak valid. ";
                }
            }
            ack_status = "acknowledged";
            ack_notes = "Konfigurasi diperbarui: " + ack_notes;
        }
        // Tambahkan penanganan perintah lain jika ada (misal: "reset_flow")

        // Kirim status eksekusi kembali ke NodeMCU
        sendACKToNodeMCU(command_id, ack_status, ack_notes, reported_valve_status);

    } else {
        // Ini adalah data pulsa/tarif/id_meter/is_unlocked dari NodeMCU
        idMeter = doc["id_meter"].as<String>();
        dataPUL = doc["data_pulsa"].as<float>(); // Saldo pulsa (Rupiah)
        tariffPerM3 = doc["tarif_per_m3"].as<float>(); // Tarif per m3 (Rupiah)
        isUnlocked = doc["is_unlocked"].as<bool>(); // Status unlock dari server

        Serial.print("ID: "); Serial.println(idMeter);
        Serial.print("Pulsa: "); Serial.println(dataPUL);
        Serial.print("Tarif/m3: "); Serial.println(tariffPerM3);
        Serial.print("Unlocked: "); Serial.println(isUnlocked ? "TRUE" : "FALSE");

        // Perbarui logika kontrol valve berdasarkan isUnlocked dari server
        if (isUnlocked) {
            Serial.println("[PERANGKAT DI-UNLOCK OLEH SERVER]");
            // Jika di-unlock, valve harus mati/terbuka (sesuai kebutuhan teknisi)
            // Untuk tujuan teknisi, valve tidak boleh menutup otomatis
            valve_mati(); // Pastikan valve dalam keadaan netral
        } else {
            Serial.println("[PERANGKAT DI-LOCK KEMBALI OLEH SERVER]");
            // Logika kontrol valve utama di loop() akan mengambil alih
        }
    }
}

// Fungsi untuk mengirim data meteran ke NodeMCU dalam format JSON
void sendMeterDataToNodeMCU(float flowRate, float meterReading, float voltage, bool doorOpen, String statusMessage) {
    DynamicJsonDocument doc(256); // Sesuaikan ukuran buffer jika data lebih besar
    
    doc["flow_rate_lpm"] = serialized(String(flowRate, 2)); // Format ke 2 desimal
    doc["meter_reading_m3"] = serialized(String(meterReading, 3)); // Format ke 3 desimal
    doc["current_voltage"] = serialized(String(voltage, 2));
    doc["door_status"] = doorOpen ? 1 : 0; // Status pintu: 0 (closed) atau 1 (open)
    doc["status_message"] = statusMessage; // Misal: "normal", "pulsa_habis", "pintu_terbuka", "tegangan_rendah"

    String output;
    serializeJson(doc, output);

    myArd.println(output); // Kirim JSON string ke NodeMCU
    Serial.print("Tx NodeMCU (Meter Data): ");
    Serial.println(output);
}

// Fungsi untuk mengirim ACK perintah kembali ke NodeMCU
void sendACKToNodeMCU(int commandId, String status, String notes, String reportedValveStatus) {
    DynamicJsonDocument doc(256);
    doc["command_id_ack"] = commandId;
    doc["status_ack"] = status; // "acknowledged" atau "failed"
    doc["notes_ack"] = notes;
    doc["valve_status_ack"] = reportedValveStatus; // Status katup yang dilaporkan Arduino

    String output;
    serializeJson(doc, output);

    myArd.println(output);
    Serial.print("Tx NodeMCU (Command ACK): ");
    Serial.println(output);
}

// ======================================================
// FUNGSI-FUNGSI SENSOR & KONTROL
// ======================================================

void checkWaterFlow() {
    unsigned long currentMillis = millis();
    if (currentMillis - lastFlowCalculationTime >= flowCalculationInterval) {
        // Nonaktifkan interrupt saat membaca pulseCount
        detachInterrupt(digitalPinToInterrupt(flowPin));

        // Hitung laju aliran
        unsigned long elapsedMillis = currentMillis - lastFlowCalculationTime;
        float elapsedSeconds = elapsedMillis / 1000.0;

        // Hitung volume air yang mengalir sejak perhitungan terakhir
        // K-FACTOR adalah Pulsa per Liter, jadi (Pulsa / K_FACTOR) = Liter
        float volumeThisIntervalLitres = (float)pulseCount / K_FACTOR;
        
        totalVolumeMilliLitres += (unsigned long)(volumeThisIntervalLitres * 1000.0); // Akumulasi total dalam mililiter
        totalMeterReadingM3 = totalVolumeMilliLitres / 1000000.0; // Konversi mililiter ke m3
        
        pemakaianSesi += volumeThisIntervalLitres; // Akumulasi pemakaian sesi (Liter)

        // Hitung laju aliran dalam LPM (Liter per Menit)
        if (elapsedSeconds > 0) {
            currentFlowRateLPM = (volumeThisIntervalLitres / elapsedSeconds) * 60.0;
        } else {
            currentFlowRateLPM = 0.0;
        }

        // PENGURANGAN SALDO PULSA (RUPIAH)
        if (dataPUL > 0 && tariffPerM3 > 0) {
            float tariffPerLiter = tariffPerM3 / 1000.0; // Tarif per liter
            float costThisInterval = volumeThisIntervalLitres * tariffPerLiter;
            dataPUL -= costThisInterval;
            if (dataPUL < 0) dataPUL = 0; // Pastikan saldo tidak negatif
        }

        Serial.print("Pulses: "); Serial.print(pulseCount);
        Serial.print("\tFlow: "); Serial.print(currentFlowRateLPM, 2); Serial.print(" L/min");
        Serial.print("\tVolume Interval: "); Serial.print(volumeThisIntervalLitres, 3); Serial.print(" L");
        Serial.print("\tTotal Volume (m3): "); Serial.print(totalMeterReadingM3, 3); Serial.print(" m3");
        Serial.print("\tSaldo: Rp "); Serial.println(dataPUL, 2);

        pulseCount = 0; // Reset pulsa setelah perhitungan
        lastFlowCalculationTime = currentMillis;

        // Aktifkan kembali interrupt
        attachInterrupt(digitalPinToInterrupt(flowPin), pulseCounter, FALLING);
    }
}


void checkDoorStatus() {
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
    long duration = pulseIn(echoPin, HIGH);
    distance = duration * 0.034 / 2; // Jarak dalam cm

    bool doorCurrentlyOpen = (distance > jarakToleransi);

    if (doorCurrentlyOpen) {
        if (cekPintuTertutup) { // Jika sebelumnya tertutup, sekarang terbuka
            cekPintuTertutup = false;
            if (!isUnlocked) { // Jika tidak dalam mode teknisi
                valve_tutup(); // Tutup valve jika pintu terbuka dan bukan mode teknisi
                sendMeterDataToNodeMCU(currentFlowRateLPM, totalMeterReadingM3, teganganVolt, true, "pintu_terbuka");
            }
        }
    } else {
        if (!cekPintuTertutup) { // Jika sebelumnya terbuka, sekarang tertutup
            cekPintuTertutup = true;
            if (!isUnlocked) { // Jika tidak dalam mode teknisi
                // Valve akan diatur oleh logika utama loop() berdasarkan semua kondisi
                sendMeterDataToNodeMCU(currentFlowRateLPM, totalMeterReadingM3, teganganVolt, false, "pintu_tertutup");
            }
        }
    }
}

void checkTiltSensor() {
    int bacaSensor = digitalRead(miringPin);
    if (bacaSensor == LOW) { // Asumsi LOW = miring
        Serial.println("Tilt detected");
        // Buzzer dikontrol di loop() utama
        // sendMeterDataToNodeMCU(currentFlowRateLPM, totalMeterReadingM3, teganganVolt, distance > jarakToleransi, "miring_terdeteksi");
    } else {
        // Buzzer dikontrol di loop() utama
    }
}

void buzzerKedip() {
    unsigned long currentMillis = millis();
    if (currentMillis - previousBuzzerMillis >= buzzerInterval) {
        previousBuzzerMillis = currentMillis;
        if (digitalRead(buzzerPin) == LOW) {
            tone(buzzerPin, 500);
        } else {
            noTone(buzzerPin);
        }
    }
}

void buzzerTerus() {
    tone(buzzerPin, 500);
    previousBuzzerMillis = millis(); // Reset timer kedip jika buzzer terus
}

void buzzerMati() {
    noTone(buzzerPin);
    previousBuzzerMillis = millis(); // Reset timer kedip jika buzzer mati
}

void checkVoltage() {
    teganganVolt = analogRead(teganganPin);
    // Konversi ADC ke Volt. Sesuaikan faktor kalibrasi (0.00489) dan pembagi tegangan (jika ada)
    // Asumsi: sensor voltage divider 1:5, 1024 ADC steps = 5V
    float actualVoltage = teganganVolt * (5.0 / 1024.0) * 5.0; // Jika menggunakan pembagi 1:5

    bool currentLowVoltage = false;
    if (actualVoltage < 5.0) { // Angka 5.0V ini bisa disesuaikan ambang batas tegangan rendah
        currentLowVoltage = true;
        if (!lowVoltageDetected) { // Jika baru terdeteksi rendah
            sendMeterDataToNodeMCU(currentFlowRateLPM, totalMeterReadingM3, actualVoltage, distance > jarakToleransi, "tegangan_rendah");
        }
    }
    lowVoltageDetected = currentLowVoltage;

    Serial.print("Voltage: "); Serial.println(actualVoltage, 2);
}

void tampilLCD(String lcdpulsa, String nopelanggan) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("ID:" + nopelanggan);
    lcd.setCursor(0, 1);
    lcd.print("P :Rp " + lcdpulsa);
    lcd.setCursor(0, 2);

    // Konversi pulsa ke liter berdasarkan tarif yang diterima dari server
    if (tariffPerM3 > 0) {
        float pulsaF = lcdpulsa.toFloat();
        float tariffPerLiter = tariffPerM3 / 1000.0; // Rupiah per Liter
        float estimatedLiter = pulsaF / tariffPerLiter; // Liter yang bisa didapat dari pulsa
        lcd.print("(" + String(estimatedLiter, 1) +" L)"); // Tampilkan 1 desimal
    } else {
        lcd.print("(Calc L..)"); // Tampilkan pesan jika tarif belum ada
    }
    lcd.setCursor(0, 3);
    lcd.print("Flow: " + String(currentFlowRateLPM, 1) + " L/m");
    lcd.setCursor(0, 4);
    lcd.print("Meter: " + String(totalMeterReadingM3, 3) + " m3");
}

// Fungsi untuk membuka valve yang dipanggil oleh logika otomatis atau perintah
void valve_buka() {
    digitalWrite(pinValveOpen, HIGH);
    digitalWrite(pinValveClose, LOW);
    // Tidak ada delay di sini agar tidak blocking loop()
    // Delay penutupan akan dihandle oleh valve_mati() setelah durasi tertentu jika diperlukan
}

// Fungsi untuk menutup valve yang dipanggil oleh logika otomatis atau perintah
void valve_tutup() {
    digitalWrite(pinValveOpen, LOW);
    digitalWrite(pinValveClose, HIGH);
    // Tidak ada delay di sini agar tidak blocking loop()
}

// Fungsi untuk mematikan valve (netral)
void valve_mati() {
    digitalWrite(pinValveOpen, LOW);
    digitalWrite(pinValveClose, LOW);
}

// Fungsi khusus untuk membuka valve berdasarkan perintah dari NodeMCU
void valve_buka_by_command() {
    Serial.println("Executing command: OPEN VALVE");
    digitalWrite(pinValveOpen, HIGH);
    digitalWrite(pinValveClose, LOW);
    delay(4700); // Durasi untuk membuka valve (blocking sementara)
    valve_mati(); // Matikan setelah selesai
}

// Fungsi khusus untuk menutup valve berdasarkan perintah dari NodeMCU
void valve_tutup_by_command() {
    Serial.println("Executing command: CLOSE VALVE");
    digitalWrite(pinValveOpen, LOW);
    digitalWrite(pinValveClose, HIGH);
    delay(5000); // Durasi untuk menutup valve (blocking sementara)
    valve_mati(); // Matikan setelah selesai
}

