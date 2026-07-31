#include <LiquidCrystal.h>
#include <DHT.h>
#include <WiFiNINA.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Sensors
#define DHTPIN A0
#define DHTTYPE DHT11
#define PHOTO_PIN A1
#define WATER_PIN A7
#define WATER_CONTROL_PIN 9

// Actuators
#define PUMP_PIN 10
#define CURTAIN_PIN1 13
#define CURTAIN_PIN2 A5
#define FAN_PIN 6


//functions 
void fanOff();
void fanOn();
void runPump();
void stopPump();
void checkMoisture();
void checkHumidity();
void checkLightIntensity();
void updateCurtains();
void moveCurtains(bool open);
void updateLCD();

// LCD
LiquidCrystal lcd(12,11,5,4,3,2);

const int DRY=65;
const int WET=145;

DHT dht(DHTPIN,DHTTYPE);

const char* ssid="Ramesh";
const char* password="Quarantine2020";

const char* mqtt_server="3c6221225b1a4998ae7bf76162aa5d29.s1.eu.hivemq.cloud";
const char* mqtt_username="esp32_final_project";
const char* mqtt_password="xubwex-furby0-hedpAn";
const int mqtt_port=8883;

WiFiSSLClient nanoClient;
PubSubClient client(nanoClient);

unsigned long lastMsg=0;
unsigned long lastMoistureCheck=0;
unsigned long lastHumidityCheck=0;
unsigned long lastLightCheck=0;
unsigned long lastLCDUpdate=0;

const unsigned long MOISTURE_INTERVAL=1000;
const unsigned long HUMIDITY_INTERVAL=2000;
const unsigned long LIGHT_INTERVAL=1000;
const unsigned long LCD_INTERVAL=2000;

unsigned long curtainStartTime=0;
bool curtainMoving=false;

unsigned long pumpStartTime=0;
const unsigned long MAX_PUMP_TIME=10000;

int soilLowerThreshold=30;
int soilUpperThreshold=70;

float humidityLowerThreshold=40;
float humidityUpperThreshold=80;

float lightLowerThreshold=300;
float lightUpperThreshold=700;

float airTempUpperThreshold = 27;
float airTempLowerThreshold = 22;

float luxLevel=3;
int moisturePercent=15;

float airHumidity=10;
float airTemperature=20;

enum curtainState{CURTAIN_OPEN,CURTAIN_CLOSED};
curtainState curtainMode=CURTAIN_OPEN;

enum pumpState{PUMP_ON,PUMP_OFF};
pumpState pumpMode=PUMP_OFF;

enum fanState{FAN_ON,FAN_OFF};
fanState fanMode=FAN_OFF;


void setup_wifi(){
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid,password);

  while(WiFi.status()!=WL_CONNECTED){
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");
}


void reconnect(){
  while(!client.connected()){
    String clientId="Nano33IoT-";
    clientId+=String(random(0xffff),HEX);

    if(client.connect(clientId.c_str(),mqtt_username,mqtt_password)){
      Serial.println("MQTT connected");
      client.subscribe("mydevice/controls/dropdown");
  }
    else{
      delay(5000);
    }
  }
}

void callback(char* topic, byte* payload, unsigned int length) {

  Serial.print("Topic: ");

  Serial.println(topic);

  String message = "";

  for (unsigned int i = 0; i < length; i++) {

    message += (char)payload[i];

  }

  Serial.print("Received: ");

  Serial.println(message);


  if (message == "PLANT_1") {

    Serial.println("Plant 1 selected");

}

else if (message == "PLANT_2") {

    Serial.println("Plant 2 selected");

}

else if (message == "TEST_PLANT") {

    Serial.println("Test Plant selected");

}

}

void setup(){
  Serial.begin(115200);

  dht.begin();

  lcd.begin(16,2);
  lcd.print("Greenhouse");
  lcd.setCursor(0,1);
  lcd.print("Initializing");
  delay(2000);
  lcd.clear();

  pinMode(WATER_CONTROL_PIN,OUTPUT);
  digitalWrite(WATER_CONTROL_PIN,LOW);

  pinMode(PUMP_PIN,OUTPUT);
    pinMode(FAN_PIN,OUTPUT);

  pinMode(CURTAIN_PIN1,OUTPUT);
  pinMode(CURTAIN_PIN2,OUTPUT);

  digitalWrite(PUMP_PIN,LOW);

  setup_wifi();
  client.setServer(mqtt_server,mqtt_port);
  client.setCallback(callback);
  client.setBufferSize(512);
}


void loop(){
  unsigned long now=millis();

  if(now-lastMoistureCheck>=MOISTURE_INTERVAL){
    lastMoistureCheck=now;
    checkMoisture();
  }

  if(now-lastHumidityCheck>=HUMIDITY_INTERVAL){
    lastHumidityCheck=now;
    checkHumidity();
  }

  if(now-lastLightCheck>=LIGHT_INTERVAL){
    lastLightCheck=now;
    checkLightIntensity();
  }

  if(now-lastLCDUpdate>=LCD_INTERVAL){
    lastLCDUpdate=now;
    updateLCD();
  }

  if(!client.connected())
    reconnect();

  client.loop();

  if(now-lastMsg>=5000){
    lastMsg=now;

    JsonDocument doc;
    doc["temperature"]=airTemperature;
    doc["humidity"]=airHumidity;
    doc["moisture"]=moisturePercent;
    doc["light"]=luxLevel;

    char message[256];
    serializeJson(doc,message);

    client.publish("home/sensor",message);
  }
  switch(fanMode){
    case FAN_ON:
      if(airTemperature<airTempLowerThreshold){
        fanOff();
        fanMode = FAN_OFF;
      }
      break;
    case FAN_OFF:
      if(airTemperature>airTempUpperThreshold){
        fanOn();
        fanMode = FAN_ON;
      }
      break;
  }



  updateCurtains();


  switch(curtainMode){
    case CURTAIN_OPEN:
      if(luxLevel>lightUpperThreshold||airTemperature>airTempUpperThreshold){
        moveCurtains(false);
        curtainMode=CURTAIN_CLOSED;
      }
      break;

    case CURTAIN_CLOSED:
      if(luxLevel<lightLowerThreshold||airTemperature<airTempLowerThreshold){
        moveCurtains(true);
        curtainMode=CURTAIN_OPEN;
      }
      break;
  }

  switch(pumpMode){
    case PUMP_ON:
      if(moisturePercent>soilUpperThreshold||now-pumpStartTime>=MAX_PUMP_TIME){
        stopPump();
        pumpMode=PUMP_OFF;
      }
      
      break;

    case PUMP_OFF:
      if(moisturePercent<soilLowerThreshold){
        runPump();
        pumpMode=PUMP_ON;
      }
      
      break;
  }
}


void updateLCD(){
  lcd.clear();

  lcd.setCursor(0,0);
  lcd.print("T:");
  lcd.print((int)airTemperature);
  lcd.print((char)223);
  lcd.print("C H:");
  lcd.print((int)airHumidity);
  lcd.print("%");

  lcd.setCursor(0,1);

  if(moisturePercent<=20)
    lcd.print("Soil:Dry ");
  else if(moisturePercent<=60)
    lcd.print("Soil:Med ");
  else
    lcd.print("Soil:Wet ");

  lcd.print("P:");

  if(pumpMode==PUMP_ON)
    lcd.print("ON");
  else
    lcd.print("OFF");
}


void moveCurtains(bool open){
  curtainStartTime=millis();
  curtainMoving=true;

  if(open){
    digitalWrite(CURTAIN_PIN1,HIGH);
    digitalWrite(CURTAIN_PIN2,LOW);
  }
  else{
    digitalWrite(CURTAIN_PIN1,LOW);
    digitalWrite(CURTAIN_PIN2,HIGH);
  }
}


void updateCurtains(){
  if(curtainMoving&&millis()-curtainStartTime>=300){
    digitalWrite(CURTAIN_PIN1,LOW);
    digitalWrite(CURTAIN_PIN2,LOW);
    curtainMoving=false;
  }
}

//Changed stuff on this
void checkLightIntensity(){
 luxLevel = 2807.27163-468.52591*log(analogRead(PHOTO_PIN));
if (luxLevel<0)
  luxLevel=0;

}


void checkHumidity(){
  float h=dht.readHumidity();
  float t=dht.readTemperature();

  if(!isnan(h))
    airHumidity=h;

  if(!isnan(t))
    airTemperature=t;
}


void checkMoisture(){
  digitalWrite(WATER_CONTROL_PIN,HIGH);
  delay(10);

  long total=0;

  for(int i=0;i<10;i++){
    total+=analogRead(WATER_PIN);
    delay(5);
  } 

  digitalWrite(WATER_CONTROL_PIN,LOW);

  int moistureLevel=total/10;

  moisturePercent=map(moistureLevel,DRY,WET,0,100);
  moisturePercent=constrain(moisturePercent,0,100);
}


void runPump(){
  digitalWrite(PUMP_PIN,HIGH);
  pumpStartTime=millis();
}


void stopPump(){
  digitalWrite(PUMP_PIN,LOW);
}
void fanOff(){
  digitalWrite(FAN_PIN,LOW);
}
void fanOn(){
  digitalWrite(FAN_PIN,HIGH);
}