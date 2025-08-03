/*
* Sistem Monitoring Air dengan NodeMCU ESP8266 (Fixed Version)
*
* Fitur Utama:
* - Koneksi Wi-Fi (STA Mode)
* - Mode Access Point (AP) untuk Provisioning Awal
* - Antarmuka Web Sederhana untuk Provisioning
* - Komunikasi dengan Arduino via SoftwareSerial (JSON)
* - Registrasi perangkat ke server backend
* - Pengiriman data sensor dari Arduino ke server
* - Penerimaan perintah kontrol dari server (misal: kontrol valve)
* - OTA (Over-The-Air) Updates
* - Penyimpanan kredensial Wi-Fi dan JWT ke EEPROM
* - Penanganan error dan retry
*
* FIXED ISSUES:
* - Updated API_BASE_URL to point to IndoWater system
* - Improved error handling and retry mechanisms
* - Added better logging and debugging
* - Enhanced security with proper JWT handling
* - Fixed provisioning flow
*
* Dibuat & Dimodifikasi oleh: DODI SETIADI
* Tanggal: [29/07/2025] - Fixed Version for IndoWater System
*/

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <SoftwareSerial.h>
#include <ESP8266WebServer.h> // Untuk server web di mode AP
#include <ESP8266mDNS.h>      // Untuk mDNS di mode AP (opsional, tapi bagus)
#include <ESP8266httpUpdate.h> // Untuk OTA updates

// =====================================================
// KONFIGURASI UMUM
// =====================================================
#define DEBUG_SERIAL Serial // Menggunakan Serial untuk debug
#define ARDUINO_SERIAL mySerial // Menggunakan SoftwareSerial untuk komunikasi dengan Arduino

// Alamat EEPROM untuk menyimpan kredensial
#define EEPROM_SIZE 512
#define EEPROM_SSID_ADDR 0
#define EEPROM_PASS_ADDR 32
#define EEPROM_ID_METER_ADDR 64
#define EEPROM_JWT_ADDR 96

// URL API Backend - FIXED: Updated to IndoWater system
// CHANGE THIS TO YOUR INDOWATER API SERVER URL
const char* API_BASE_URL = "https://your-indowater-api.com"; // FIXED: Change this to your actual API URL
const char* BALANCE = "/device/credit.php"; //Endpoint Untuk Saldo Pulsa
const char* REGISTER_DEVICE_ENDPOINT = "/device/register_device.php"; //Endpoint untuk Provisioning device
const char* SUBMIT_READING_ENDPOINT = "/device/MeterReading.php";
const char* GET_COMMANDS_ENDPOINT = "/device/get_commands.php"; // Endpoint untuk polling perintah
const char* ACK_COMMAND_ENDPOINT = "/device/ack_command.php"; // Endpoint untuk ACK perintah
const char* OTA_UPDATE_ENDPOINT = "/ota/firmware.bin"; // Endpoint untuk OTA firmware

// Kredensial Wi-Fi (akan disimpan di EEPROM setelah provisioning)
String sta_ssid = "";
String sta_password = "";

// Informasi Perangkat (akan disimpan di EEPROM setelah registrasi)
String idMeter = "";
String deviceJwtToken = ""; // JWT yang diterima dari server setelah registrasi

// Status Koneksi
bool isWiFiConnected = false;
bool isDeviceRegistered = false;

// Variabel untuk komunikasi dengan Arduino
SoftwareSerial mySerial(D6, D7); // RX, TX (sesuaikan dengan pin yang terhubung ke Arduino)

// Variabel untuk polling perintah dari server
unsigned long lastCommandPollTime = 0;
const long commandPollInterval = 10000; // Poll setiap 10 detik

// Variabel untuk retry koneksi
unsigned long lastReconnectAttempt = 0;
const long reconnectInterval = 5000; // Coba reconnect setiap 5 detik

// Variabel untuk OTA
unsigned long lastOTACheckTime = 0;
const long otaCheckInterval = 3600000; // Cek OTA setiap 1 jam (3600000 ms)

// =====================================================
// SERVER WEB UNTUK PROVISIONING (MODE AP)
// =====================================
ESP8266WebServer server(80);

// HTML untuk halaman provisioning - Enhanced with better styling
const char PROVISIONING_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IndoWater Device Setup</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 400px;
            width: 100%;
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #2c5aa0;
            margin: 0;
            font-size: 28px;
        }
        .logo p {
            color: #666;
            margin: 5px 0 0 0;
            font-size: 14px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            color: #333;
            font-weight: bold;
        }
        input[type="text"], input[type="password"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            box-sizing: border-box;
            transition: border-color 0.3s;
        }
        input[type="text"]:focus, input[type="password"]:focus {
            outline: none;
            border-color: #2c5aa0;
        }
        button {
            width: 100%;
            padding: 12px;
            background: #2c5aa0;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s;
        }
        button:hover {
            background: #1e3d6f;
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .status {
            margin-top: 20px;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
            display: none;
        }
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .device-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .device-info strong {
            color: #2c5aa0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>🌊 IndoWater</h1>
            <p>Smart Water Meter Setup</p>
        </div>
        
        <div class="device-info">
            <strong>Device ID:</strong> <span id="deviceId">Loading...</span><br>
            <strong>Status:</strong> <span id="deviceStatus">Ready for setup</span>
        </div>
        
        <form id="provisioningForm">
            <div class="form-group">
                <label for="token">Provisioning Token:</label>
                <input type="text" id="token" name="token" required 
                       placeholder="Enter provisioning token" maxlength="32">
            </div>
            
            <div class="form-group">
                <label for="ssid">WiFi Network:</label>
                <input type="text" id="ssid" name="ssid" required 
                       placeholder="Enter WiFi network name">
            </div>
            
            <div class="form-group">
                <label for="password">WiFi Password:</label>
                <input type="password" id="password" name="password" required 
                       placeholder="Enter WiFi password">
            </div>
            
            <button type="submit" id="submitBtn">Setup Device</button>
        </form>
        
        <div id="status" class="status"></div>
    </div>

    <script>
        // Get device ID
        fetch('/device-info')
            .then(response => response.json())
            .then(data => {
                document.getElementById('deviceId').textContent = data.device_id;
            })
            .catch(error => {
                document.getElementById('deviceId').textContent = 'Unknown';
            });

        document.getElementById('provisioningForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const statusDiv = document.getElementById('status');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Setting up...';
            statusDiv.style.display = 'none';
            
            const formData = {
                token: document.getElementById('token').value,
                ssid: document.getElementById('ssid').value,
                password: document.getElementById('password').value
            };
            
            fetch('/provision', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                statusDiv.style.display = 'block';
                if (data.status === 'success') {
                    statusDiv.className = 'status success';
                    statusDiv.textContent = data.message;
                    document.getElementById('deviceStatus').textContent = 'Setup complete';
                    setTimeout(() => {
                        statusDiv.textContent += ' Device will restart in 3 seconds...';
                    }, 1000);
                } else {
                    statusDiv.className = 'status error';
                    statusDiv.textContent = data.message;
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Setup Device';
                }
            })
            .catch(error => {
                statusDiv.style.display = 'block';
                statusDiv.className = 'status error';
                statusDiv.textContent = 'Connection error. Please try again.';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Setup Device';
            });
        });
    </script>
</body>
</html>
)rawliteral";

// =====================================================
// FUNGSI SETUP
// =====================================================
void setup() {
  DEBUG_SERIAL.begin(115200);
  ARDUINO_SERIAL.begin(9600);
  
  DEBUG_SERIAL.println();
  DEBUG_SERIAL.println("=================================");
  DEBUG_SERIAL.println("IndoWater NodeMCU Fixed Version");
  DEBUG_SERIAL.println("=================================");
  
  EEPROM.begin(EEPROM_SIZE);
  
  // Load credentials from EEPROM
  loadCredentials();
  
  // Cek apakah sudah ada kredensial Wi-Fi
  if (sta_ssid.length() > 0 && sta_password.length() > 0) {
    DEBUG_SERIAL.println("Found saved WiFi credentials, attempting connection...");
    connectWiFiSTA();
    
    if (isWiFiConnected) {
      DEBUG_SERIAL.println("WiFi connected successfully!");
      DEBUG_SERIAL.print("IP Address: ");
      DEBUG_SERIAL.println(WiFi.localIP());
      
      // Cek apakah device sudah terdaftar
      if (idMeter.length() > 0 && deviceJwtToken.length() > 0) {
        isDeviceRegistered = true;
        DEBUG_SERIAL.println("Device already registered: " + idMeter);
      } else {
        DEBUG_SERIAL.println("Device not registered yet");
      }
    } else {
      DEBUG_SERIAL.println("Failed to connect to WiFi, starting AP mode...");
      startAPMode();
    }
  } else {
    DEBUG_SERIAL.println("No WiFi credentials found, starting AP mode...");
    startAPMode();
  }
  
  DEBUG_SERIAL.println("Setup completed");
}

// =====================================================
// FUNGSI LOOP UTAMA
// =====================================================
void loop() {
  unsigned long currentMillis = millis();
  
  // Handle web server requests in AP mode
  if (WiFi.getMode() == WIFI_AP || WiFi.getMode() == WIFI_AP_STA) {
    server.handleClient();
  }
  
  // Main operations only if connected and registered
  if (isWiFiConnected && isDeviceRegistered) {
    // Handle Arduino communication
    handleArduinoCommunication();
    
    // Poll for commands from server
    if (currentMillis - lastCommandPollTime >= commandPollInterval) {
      lastCommandPollTime = currentMillis;
      pollCommands();
    }
    
    // Check for OTA updates
    if (currentMillis - lastOTACheckTime >= otaCheckInterval) {
      lastOTACheckTime = currentMillis;
      checkOTAUpdate();
    }
  } else if (isWiFiConnected && !isDeviceRegistered) {
    // Try to register device if we have WiFi but not registered
    // This would need a provisioning token - for now just log
    DEBUG_SERIAL.println("WiFi connected but device not registered");
    delay(10000); // Wait 10 seconds before next attempt
  } else if (!isWiFiConnected) {
    // Try to reconnect WiFi
    if (currentMillis - lastReconnectAttempt >= reconnectInterval) {
      lastReconnectAttempt = currentMillis;
      if (sta_ssid.length() > 0) {
        DEBUG_SERIAL.println("Attempting WiFi reconnection...");
        connectWiFiSTA();
      }
    }
  }
  
  delay(100); // Small delay to prevent watchdog issues
}

// =====================================================
// FUNGSI KOMUNIKASI ARDUINO
// =====================================================
void handleArduinoCommunication() {
  // Read data from Arduino
  if (ARDUINO_SERIAL.available()) {
    String msgFromArduino = ARDUINO_SERIAL.readStringUntil('\n');
    msgFromArduino.trim();
    
    if (msgFromArduino.length() > 0) {
      DEBUG_SERIAL.print("Rx Arduino: ");
      DEBUG_SERIAL.println(msgFromArduino);
      
      // Parse and handle Arduino message
      handleArduinoMessage(msgFromArduino);
    }
  }
}

void handleArduinoMessage(String jsonString) {
  DynamicJsonDocument doc(512);
  DeserializationError error = deserializeJson(doc, jsonString);
  
  if (error) {
    DEBUG_SERIAL.print(F("Arduino JSON parse failed: "));
    DEBUG_SERIAL.println(error.c_str());
    return;
  }
  
  // Check if this is meter data or command acknowledgment
  if (doc.containsKey("command_id_ack")) {
    // This is a command acknowledgment
    int commandId = doc["command_id_ack"].as<int>();
    String ackStatus = doc["ack_status"].as<String>();
    String ackNotes = doc["ack_notes"].as<String>();
    String valveStatusAck = doc["valve_status_ack"].as<String>();
    
    DEBUG_SERIAL.print("Command ACK received: ID=");
    DEBUG_SERIAL.print(commandId);
    DEBUG_SERIAL.print(", Status=");
    DEBUG_SERIAL.println(ackStatus);
    
    // Send ACK to server
    sendCommandACK(commandId, ackStatus, ackNotes, valveStatusAck);
    
  } else if (doc.containsKey("flow_rate_lpm")) {
    // This is meter reading data
    float flowRate = doc["flow_rate_lpm"].as<float>();
    float meterReading = doc["meter_reading_m3"].as<float>();
    float voltage = doc["current_voltage"].as<float>();
    int doorStatus = doc["door_status"].as<int>();
    String statusMessage = doc["status_message"].as<String>();
    
    DEBUG_SERIAL.print("Meter data: Flow=");
    DEBUG_SERIAL.print(flowRate);
    DEBUG_SERIAL.print("LPM, Reading=");
    DEBUG_SERIAL.print(meterReading);
    DEBUG_SERIAL.print("m3, Status=");
    DEBUG_SERIAL.println(statusMessage);
    
    // Determine valve status based on conditions
    String valveStatus = "unknown";
    if (statusMessage == "pulsa_habis" || doorStatus == 1) {
      valveStatus = "closed";
    } else if (statusMessage == "normal") {
      valveStatus = "open";
    }
    
    // Submit meter reading to server
    submitMeterReading(flowRate, meterReading, voltage, doorStatus, statusMessage, valveStatus);
  }
}

// =====================================================
// FUNGSI HTTP REQUEST
// =====================================================
String httpPOST(String endpoint, String payload, String authToken = "") {
  if (!isWiFiConnected) {
    DEBUG_SERIAL.println("WiFi not connected, cannot make HTTP request");
    return "{\"status\":\"error\",\"message\":\"No WiFi connection\"}";
  }
  
  WiFiClient client;
  HTTPClient http;
  
  String url = String(API_BASE_URL) + endpoint;
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  
  if (authToken.length() > 0) {
    http.addHeader("Authorization", "Bearer " + authToken);
  }
  
  DEBUG_SERIAL.print("POST to: ");
  DEBUG_SERIAL.println(url);
  DEBUG_SERIAL.print("Payload: ");
  DEBUG_SERIAL.println(payload);
  
  int httpResponseCode = http.POST(payload);
  String response = "";
  
  if (httpResponseCode > 0) {
    DEBUG_SERIAL.printf("[HTTP] POST... code: %d\n", httpResponseCode);
    response = http.getString();
    DEBUG_SERIAL.print("Response: ");
    DEBUG_SERIAL.println(response);
  } else {
    DEBUG_SERIAL.printf("[HTTP] POST... failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
    response = "{\"status\":\"error\",\"message\":\"HTTP request failed\"}";
  }
  
  http.end();
  return response;
}

String httpGET(String endpoint, String authToken = "") {
  if (!isWiFiConnected) {
    DEBUG_SERIAL.println("WiFi not connected, cannot make HTTP request");
    return "{\"status\":\"error\",\"message\":\"No WiFi connection\"}";
  }
  
  WiFiClient client;
  HTTPClient http;
  
  String url = String(API_BASE_URL) + endpoint;
  http.begin(client, url);
  
  if (authToken.length() > 0) {
    http.addHeader("Authorization", "Bearer " + authToken);
  }
  
  DEBUG_SERIAL.print("GET from: ");
  DEBUG_SERIAL.println(url);
  
  int httpResponseCode = http.GET();
  String response = "";
  
  if (httpResponseCode > 0) {
    DEBUG_SERIAL.printf("[HTTP] GET... code: %d\n", httpResponseCode);
    response = http.getString();
  } else {
    DEBUG_SERIAL.printf("[HTTP] GET... failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
    response = "{\"status\":\"error\",\"message\":\"HTTP request failed\"}";
  }
  
  http.end();
  return response;
}

// =====================================================
// FUNGSI API CALLS
// =====================================================
bool registerDevice(String provisioningToken) {
  DynamicJsonDocument doc(256);
  doc["provisioning_token"] = provisioningToken;
  doc["device_id"] = String(ESP.getChipId()); // Menggunakan Chip ID sebagai ID unik perangkat

  String payload;
  serializeJson(doc, payload);

  String response = httpPOST(REGISTER_DEVICE_ENDPOINT, payload);

  DynamicJsonDocument responseDoc(512);
  DeserializationError error = deserializeJson(responseDoc, response);

  if (error) {
    DEBUG_SERIAL.print(F("Device registration JSON parse failed: "));
    DEBUG_SERIAL.println(error.c_str());
    return false;
  }

  if (responseDoc["status"] == "success") {
    idMeter = responseDoc["id_meter"].as<String>();
    deviceJwtToken = responseDoc["jwt_token"].as<String>();
    
    // Save to EEPROM
    saveString(EEPROM_ID_METER_ADDR, idMeter);
    saveString(EEPROM_JWT_ADDR, deviceJwtToken);
    
    isDeviceRegistered = true;
    
    DEBUG_SERIAL.println("Device registered successfully!");
    DEBUG_SERIAL.print("Meter ID: ");
    DEBUG_SERIAL.println(idMeter);
    
    return true;
  } else {
    DEBUG_SERIAL.print("Device registration failed: ");
    DEBUG_SERIAL.println(responseDoc["message"].as<String>());
    return false;
  }
}

void submitMeterReading(float flowRate, float meterReading, float voltage, int doorStatus, String statusMessage, String valveStatus) {
  if (!isDeviceRegistered) {
    DEBUG_SERIAL.println("Device not registered, cannot submit reading");
    return;
  }
  
  DynamicJsonDocument doc(512);
  doc["id_meter"] = idMeter;
  doc["flow_rate_lpm"] = flowRate;
  doc["meter_reading_m3"] = meterReading;
  doc["current_voltage"] = voltage;
  doc["door_status"] = doorStatus;
  doc["status_message"] = statusMessage;
  doc["valve_status"] = valveStatus;

  String payload;
  serializeJson(doc, payload);

  String response = httpPOST(SUBMIT_READING_ENDPOINT, payload, deviceJwtToken);

  DynamicJsonDocument responseDoc(256);
  DeserializationError error = deserializeJson(responseDoc, response);

  if (error) {
    DEBUG_SERIAL.print(F("Submit reading JSON parse failed: "));
    DEBUG_SERIAL.println(error.c_str());
    return;
  }

  if (responseDoc["status"] == "success") {
    DEBUG_SERIAL.println("Meter reading submitted successfully");
    
    // Update pulsa dan status unlock dari server
    float newPulsa = responseDoc["data_pulsa"].as<float>();
    float newTarif = responseDoc["tarif_per_m3"].as<float>();
    bool newUnlockedStatus = responseDoc["is_unlocked"].as<bool>();

    // Kirim ke Arduino
    DynamicJsonDocument arduinoUpdateDoc(128);
    arduinoUpdateDoc["id_meter"] = idMeter;
    arduinoUpdateDoc["data_pulsa"] = newPulsa;
    arduinoUpdateDoc["tarif_per_m3"] = newTarif;
    arduinoUpdateDoc["is_unlocked"] = newUnlockedStatus;
    
    String arduinoUpdatePayload;
    serializeJson(arduinoUpdateDoc, arduinoUpdatePayload);
    
    ARDUINO_SERIAL.println(arduinoUpdatePayload);
    DEBUG_SERIAL.print("Tx Arduino (Update): ");
    DEBUG_SERIAL.println(arduinoUpdatePayload);

  } else {
    DEBUG_SERIAL.print("Failed to submit meter reading: ");
    DEBUG_SERIAL.println(responseDoc["message"].as<String>());
  }
}

void pollCommands() {
  if (!isDeviceRegistered) {
    return;
  }

  String url = String(GET_COMMANDS_ENDPOINT) + "?id_meter=" + idMeter;
  String response = httpGET(url, deviceJwtToken);

  DynamicJsonDocument responseDoc(512);
  DeserializationError error = deserializeJson(responseDoc, response);

  if (error) {
    DEBUG_SERIAL.print(F("Poll commands JSON parse failed: "));
    DEBUG_SERIAL.println(error.c_str());
    return;
  }

  if (responseDoc["status"] == "success" && responseDoc.containsKey("commands")) {
    JsonArray commands = responseDoc["commands"].as<JsonArray>();
    
    for (JsonObject command : commands) {
      String command_type = command["command_type"].as<String>();
      int command_id = command["command_id"].as<int>();
      String current_valve_status = command["current_valve_status"].as<String>();

      DEBUG_SERIAL.print("Received command: ");
      DEBUG_SERIAL.print(command_type);
      DEBUG_SERIAL.print(" (ID: ");
      DEBUG_SERIAL.print(command_id);
      DEBUG_SERIAL.println(")");

      // Forward command to Arduino
      DynamicJsonDocument arduinoCommandDoc(256);
      arduinoCommandDoc["command_type"] = command_type;
      arduinoCommandDoc["command_id"] = command_id;
      arduinoCommandDoc["current_valve_status"] = current_valve_status;
      
      // Add config data if it's a config update command
      if (command.containsKey("parameters")) {
        JsonObject parameters = command["parameters"];
        if (command_type == "arduino_config_update") {
          arduinoCommandDoc["config_data"] = parameters;
        }
      }
      
      String arduinoCommandPayload;
      serializeJson(arduinoCommandDoc, arduinoCommandPayload);
      
      ARDUINO_SERIAL.println(arduinoCommandPayload);
      DEBUG_SERIAL.print("Tx Arduino (Command): ");
      DEBUG_SERIAL.println(arduinoCommandPayload);
    }
  }
}

void sendCommandACK(int commandId, String status, String notes, String valveStatusAck) {
  if (!isDeviceRegistered) {
    return;
  }
  
  DynamicJsonDocument doc(256);
  doc["command_id"] = commandId;
  doc["status"] = status;
  doc["notes"] = notes;
  doc["valve_status_ack"] = valveStatusAck;

  String payload;
  serializeJson(doc, payload);

  String response = httpPOST(ACK_COMMAND_ENDPOINT, payload, deviceJwtToken);

  DynamicJsonDocument responseDoc(128);
  DeserializationError error = deserializeJson(responseDoc, response);

  if (error) {
    DEBUG_SERIAL.print(F("Command ACK JSON parse failed: "));
    DEBUG_SERIAL.println(error.c_str());
    return;
  }

  if (responseDoc["status"] == "success") {
    DEBUG_SERIAL.print("Command ACK sent successfully for ID: ");
    DEBUG_SERIAL.println(commandId);
  } else {
    DEBUG_SERIAL.print("Failed to send command ACK: ");
    DEBUG_SERIAL.println(responseDoc["message"].as<String>());
  }
}

// =====================================================
// FUNGSI OTA UPDATE
// =====================================================
void checkOTAUpdate() {
  if (!isDeviceRegistered) {
    return;
  }
  
  DEBUG_SERIAL.println("Checking for OTA updates...");
  
  WiFiClient client;
  String url = String(API_BASE_URL) + OTA_UPDATE_ENDPOINT + "?device_id=" + String(ESP.getChipId()) + "&version=1.0.0";
  
  HTTPClient http;
  http.begin(client, url);
  http.addHeader("Authorization", "Bearer " + deviceJwtToken);
  
  int httpCode = http.GET();
  
  if (httpCode == HTTP_CODE_OK) {
    int contentLength = http.getSize();
    if (contentLength > 0) {
      DEBUG_SERIAL.println("OTA update available, starting download...");
      
      t_httpUpdate_return ret = ESPhttpUpdate.update(client, url, "1.0.0");
      
      switch (ret) {
        case HTTP_UPDATE_FAILED:
          DEBUG_SERIAL.printf("OTA Update failed. Error (%d): %s\n", ESPhttpUpdate.getLastError(), ESPhttpUpdate.getLastErrorString().c_str());
          break;
        case HTTP_UPDATE_NO_UPDATES:
          DEBUG_SERIAL.println("OTA: No updates available");
          break;
        case HTTP_UPDATE_OK:
          DEBUG_SERIAL.println("OTA Update successful, restarting...");
          ESP.restart();
          break;
      }
    }
  } else if (httpCode == HTTP_CODE_NOT_MODIFIED) {
    DEBUG_SERIAL.println("OTA: Firmware is up to date");
  } else {
    DEBUG_SERIAL.printf("OTA check failed, HTTP code: %d\n", httpCode);
  }
  
  http.end();
}

// =====================================================
// FUNGSI KONEKSI WI-FI
// =====================================================
void connectWiFiSTA() {
  DEBUG_SERIAL.print("Connecting to WiFi: ");
  DEBUG_SERIAL.println(sta_ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(sta_ssid.c_str(), sta_password.c_str());

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) { // Coba 30 kali (30 detik)
    delay(1000);
    DEBUG_SERIAL.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    isWiFiConnected = true;
    DEBUG_SERIAL.println();
    DEBUG_SERIAL.println("WiFi connected successfully!");
    DEBUG_SERIAL.print("IP address: ");
    DEBUG_SERIAL.println(WiFi.localIP());
  } else {
    isWiFiConnected = false;
    DEBUG_SERIAL.println();
    DEBUG_SERIAL.println("Failed to connect to WiFi");
  }
}

void startAPMode() {
  DEBUG_SERIAL.println("Starting Access Point mode...");
  
  String apName = "IndoWater-" + String(ESP.getChipId());
  WiFi.mode(WIFI_AP);
  WiFi.softAP(apName.c_str(), "12345678"); // Default password
  
  DEBUG_SERIAL.print("AP Name: ");
  DEBUG_SERIAL.println(apName);
  DEBUG_SERIAL.print("AP IP address: ");
  DEBUG_SERIAL.println(WiFi.softAPIP());
  
  setupWebServer();
}

void setupWebServer() {
  // Serve main provisioning page
  server.on("/", HTTP_GET, []() {
    server.send_P(200, "text/html", PROVISIONING_HTML);
  });
  
  // Device info endpoint
  server.on("/device-info", HTTP_GET, []() {
    DynamicJsonDocument doc(128);
    doc["device_id"] = String(ESP.getChipId());
    doc["status"] = "ready";
    
    String response;
    serializeJson(doc, response);
    
    server.send(200, "application/json", response);
  });

  // Provisioning endpoint
  server.on("/provision", HTTP_POST, []() {
    String responseJson = "{\"status\":\"error\", \"message\":\"Invalid request\"}";
    
    if (server.hasArg("plain")) {
      String body = server.arg("plain");
      DEBUG_SERIAL.print("Received provisioning data: ");
      DEBUG_SERIAL.println(body);
      
      DynamicJsonDocument doc(256);
      DeserializationError error = deserializeJson(doc, body);
      
      if (!error) {
        String token = doc["token"].as<String>();
        String ssid = doc["ssid"].as<String>();
        String password = doc["password"].as<String>();
        
        DEBUG_SERIAL.print("Received token: ");
        DEBUG_SERIAL.println(token.substring(0, 8) + "...");
        DEBUG_SERIAL.print("Received SSID: ");
        DEBUG_SERIAL.println(ssid);
        DEBUG_SERIAL.print("Received Password: ");
        DEBUG_SERIAL.println(password.substring(0, 3) + "...");

        if (registerDevice(token)) {
          sta_ssid = ssid;
          sta_password = password;
          saveCredentials(); // Simpan SSID dan Password baru
          responseJson = "{\"status\":\"success\", \"message\":\"Device provisioned successfully. Restarting...\"}";
          server.send(200, "application/json", responseJson);
          delay(2000); // Beri waktu klien menerima respons
          ESP.restart(); // Restart untuk beralih ke STA mode
        } else {
          responseJson = "{\"status\":\"failed\", \"message\":\"Device registration failed. Check token or server connection.\"}";
        }
      } else {
        responseJson = "{\"status\":\"failed\", \"message\":\"JSON parsing error: " + String(error.c_str()) + "\"}";
      }
    }
    server.send(200, "application/json", responseJson);
  });

  server.begin();
  DEBUG_SERIAL.println("HTTP server started");
}

// =====================================================
// FUNGSI EEPROM
// =====================================================
void saveCredentials() {
  saveString(EEPROM_SSID_ADDR, sta_ssid);
  saveString(EEPROM_PASS_ADDR, sta_password);
  DEBUG_SERIAL.println("Credentials saved to EEPROM");
}

void loadCredentials() {
  sta_ssid = loadString(EEPROM_SSID_ADDR);
  sta_password = loadString(EEPROM_PASS_ADDR);
  idMeter = loadString(EEPROM_ID_METER_ADDR);
  deviceJwtToken = loadString(EEPROM_JWT_ADDR);
  
  DEBUG_SERIAL.println("Credentials loaded from EEPROM");
  if (sta_ssid.length() > 0) {
    DEBUG_SERIAL.print("SSID: ");
    DEBUG_SERIAL.println(sta_ssid);
  }
  if (idMeter.length() > 0) {
    DEBUG_SERIAL.print("Meter ID: ");
    DEBUG_SERIAL.println(idMeter);
  }
}

void saveString(int addr, String data) {
  int len = data.length();
  EEPROM.write(addr, len);
  for (int i = 0; i < len; i++) {
    EEPROM.write(addr + 1 + i, data[i]);
  }
  EEPROM.commit();
}

String loadString(int addr) {
  int len = EEPROM.read(addr);
  String data = "";
  for (int i = 0; i < len; i++) {
    data += char(EEPROM.read(addr + 1 + i));
  }
  return data;
}