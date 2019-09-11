'use strict';

var moyenne = [];
var moyenneFinale = 0;
var totalMoyenne = 0;
var compteur = 0;
var resultInt = 0;
var total = 0;
var refreshButtonDiv = document.getElementById("refreshButtonDiv");
var connectionPage = document.getElementById("connectionPage");
var titleHomePage = document.getElementById("titleHomePage");

// ASCII only
function bytesToString(buffer) {
  return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

// this is Nordic's UART service
var bluefruit = {
  serviceUUID: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  txCharacteristic: '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // transmit is from the phone's perspective
  rxCharacteristic: '6e400003-b5a3-f393-e0a9-e50e24dcca9e'  // receive is from the phone's perspective
};


var bluefruitConnect = {

  initializeBluetooth: function() {
      detailPage.hidden = true;
      connectionPage.hidden = false;
      this.bindBluetoothEvents();
  },

  bindBluetoothEvents: function() {
      document.addEventListener('deviceready', this.onDeviceReady, false);
      refreshButton.addEventListener('touchstart', this.refreshDeviceList, false);
      disconnectButton.addEventListener('touchstart', this.disconnect, false);
      deviceList.addEventListener('touchstart', this.connect, false); // assume not scrolling
  },

  onDeviceReady: function() {
    bluefruitConnect.refreshDeviceList();
    bluefruitConnect.showConnectionPage();
  },

  refreshDeviceList: function() {
      deviceList.innerHTML = ''; // empties the list
      ble.scan([bluefruit.serviceUUID], 5, bluefruitConnect.onDiscoverDevice, bluefruitConnect.onError);

      // if Android can't find your device try scanning for all devices
      // ble.scan([], 5, app.onDiscoverDevice, app.onError);
  },

  onDiscoverDevice: function(device) {
      var listItem = document.createElement('li'),
            html = '<b>' + device.name + '</b><br/>' +
                'RSSI: ' + device.rssi + '&nbsp;|&nbsp;' +
                device.id;

        listItem.dataset.deviceId = device.id;
        listItem.innerHTML = html;
        deviceList.appendChild(listItem);
    },

  connect: function(e) {
      var deviceId = e.target.dataset.deviceId,
          onConnect = function(peripheral) {
            bluefruitConnect.determineWriteType(peripheral);

              // subscribe for incoming data
              ble.startNotification(deviceId, bluefruit.serviceUUID, bluefruit.rxCharacteristic, bluefruitConnect.onData, bluefruitConnect.onError);
              disconnectButton.dataset.deviceId = deviceId;
              bluefruitConnect.showDetailPage();
          };

      ble.connect(deviceId, onConnect, bluefruitConnect.onError);
  },

  determineWriteType: function(peripheral) {
      // Adafruit nRF8001 breakout uses WriteWithoutResponse for the TX characteristic
      // Newer Bluefruit devices use Write Request for the TX characteristic

      var characteristic = peripheral.characteristics.filter(function(element) {
          if (element.characteristic.toLowerCase() === bluefruit.txCharacteristic) {
              return element;
          }
      })[0];

      if (characteristic.properties.indexOf('WriteWithoutResponse') > -1) {
        bluefruitConnect.writeWithoutResponse = true;
      } else {
        bluefruitConnect.writeWithoutResponse = false;
      }

  },

  onData: function(data) { // data received from Arduino

      //resultDiv.innerHTML = "";
      //resultDiv.innerHTML = resultDiv.innerHTML + "&hearts " + bytesToString(data) + "<br/>";

      resultInt=parseInt(bytesToString(data));

      bpmGauge.update({
        value: resultInt*(1/200),
        valueText: resultInt
      });

      compteur++;
      total = total+resultInt;
  },

  disconnect: function(event) {
      var deviceId = event.target.dataset.deviceId;
      ble.disconnect(deviceId, bluefruitConnect.showConnectionPage, bluefruitConnect.onError);
  },

  showConnectionPage: function() {
      detailPage.hidden = true;
      connectionPage.hidden = false;
  },

  showDetailPage: function() {
      connectionPage.hidden = true;
      detailPage.hidden = false;
  },

  onError: function(reason) {
      alert("ERROR: " + JSON.stringify(reason)); // real apps should use notification.alert
  }

};
