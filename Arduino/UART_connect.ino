/* ###############################
 * LIBRARIES
 ############################### */
#define USE_ARDUINO_INTERRUPTS true
#include <PulseSensorPlayground.h> 
#include <Arduino.h>
#include <SPI.h>
#if SOFTWARE_SERIAL_AVAILABLE
  #include <SoftwareSerial.h>
#endif

#include "Adafruit_BLE.h"
#include "Adafruit_BluefruitLE_SPI.h"
#include "Adafruit_BluefruitLE_UART.h"
#include "BluefruitConfig.h"

/* ###############################
 * VARIABLES
 ############################### */
const int PULSE_OUTPUT = 9; // Fil violet du PulseSensor sur le port 11
int THRESHOLD = 550; // Seuil de précision
PulseSensorPlayground pulseSensor; // Instance de PulseSensorPlayground

/* ...or hardware serial, which does not need the RTS/CTS pins. Uncomment this line */
Adafruit_BluefruitLE_UART ble(Serial1, BLUEFRUIT_UART_MODE_PIN);

// A small helper
void error(const __FlashStringHelper*err) {
  Serial.println(err);
  while (1);
}

/* ###############################
 * SETUP
 ############################### */
void setup(void)
{
  while (!Serial);  // required for Flora & Micro
  delay(500);

  Serial.begin(115200);

  pulseSensor.analogInput(PULSE_OUTPUT); // Init le capteur
  pulseSensor.setThreshold(THRESHOLD); // Init le seuil de précision
  if (pulseSensor.begin()) {
      Serial.println("Capteur connecté !");  // Check de connection carte / capteur
  }

  Serial.println(F("Adafruit Factory Reset Example"));
  Serial.println(F("------------------------------------------------"));

  /* Initialise the module */
  Serial.print(F("Initialising the Bluefruit LE module: "));

  if ( !ble.begin(VERBOSE_MODE) )
  {
    error(F("Couldn't find Bluefruit, make sure it's in CoMmanD mode & check wiring?"));
  }
  Serial.println( F("OK!") );

  /* Perform a factory reset to make sure everything is in a known state */
  Serial.println(F("Performing a factory reset: "));
  if (! ble.factoryReset() ){
    error(F("Couldn't factory reset"));
  }

  Serial.println("Requesting Bluefruit info:");
  /* Print Bluefruit information */
  ble.info();

  Serial.println(F("DONE!"));
}

/**************************************************************************/
/*!
    @brief  Constantly poll for new command or response data
*/
/**************************************************************************/
void loop(void)
{
  int myBPM = pulseSensor.getBeatsPerMinute(); // Recupérer le BPM
  
  if(pulseSensor.sawStartOfBeat()) { // Check si il y a un signal
    ble.print("AT+BLEUARTTX=");
    ble.println(myBPM);
    //delay(2000);    
  }
  delay(20);
}
