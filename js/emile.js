/* global mainPage, connectionPage, refreshButton, refreshButtonDiv */
/* global detailPage, resultDiv, messageInput, sendButton, disconnectButton */
/* global ble  */
/* jshint browser: true , devel: true*/
'use strict';



/***************************************************************************** 
 * VARIABLES
*****************************************************************************/

//SPOTIFY
var spotifyIdInput = document.getElementById("spotifyId");
var updateIdButton = document.getElementById("updateIdButton");
var playRandomButton = document.getElementById("playRandomButton");
var matchButton = document.getElementById("matchButton");
var totalArray = 0;
var bpmArray = new Array();
var tempoArray = new Array();
var tempo1 = new Array();
var tempo2 = new Array();
var tempo3 = new Array();
var tempo4 = new Array();
const trackInfo = {};
var currentTrack;
var position = 0;
var randomTrack;
var nextTrack;

var pulseMax = 200;
var pulseMin = 50;

//BLUETOOTH
var moyenne = [];
var moyenneFinale = 0;
var totalMoyenne = 0;
var compteur = 0;
var resultInt = 0;
var total = 0;
var pulseCircle = document.getElementById("pulseCircle");
var refreshButtonDiv = document.getElementById("refreshButtonDiv");
var connectionPage = document.getElementById("connectionPage");
var trackImage = document.createElement("trackImage");

// Dom7
var $$ = Dom7;



/***************************************************************************** 
 * SETUP FRAMEWORK 7
*****************************************************************************/
// Framework7 App main instance
var app  = new Framework7({
  root: '#app', // App root element
  id: 'io.framework7.testapp', // App bundle ID
  name: 'Framework7', // App name
  theme: 'auto', // Automatic theme detection
  touch : {
    disableContextMenu: false,
  },


  // App root data
  data: function () {
    return {
      user: {
        firstName: 'John',
        lastName: 'Doe',
      },
      // Demo products for Catalog section
      products: [
        {
          id: '1',
          title: 'Apple iPhone 8',
          description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nisi tempora similique reiciendis, error nesciunt vero, blanditiis pariatur dolor, minima sed sapiente rerum, dolorem corrupti hic modi praesentium unde saepe perspiciatis.'
        },
        {
          id: '2',
          title: 'Apple iPhone 8 Plus',
          description: 'Velit odit autem modi saepe ratione totam minus, aperiam, labore quia provident temporibus quasi est ut aliquid blanditiis beatae suscipit odio vel! Nostrum porro sunt sint eveniet maiores, dolorem itaque!'
        },
        {
          id: '3',
          title: 'Apple iPhone X',
          description: 'Expedita sequi perferendis quod illum pariatur aliquam, alias laboriosam! Vero blanditiis placeat, mollitia necessitatibus reprehenderit. Labore dolores amet quos, accusamus earum asperiores officiis assumenda optio architecto quia neque, quae eum.'
        },
      ]
    };
  },
  // App root methods
  methods: {
    helloWorld: function () {
      app.dialog.alert('Hello World!');
    },
  },
  // App routes
  routes: routes,
});

// Init/Create views
var homeView = app.views.create('#view-home', {
  url: '/'
});
var catalogView = app.views.create('#view-catalog', {
  url: '/catalog/'
});
var settingsView = app.views.create('#view-settings', {
  url: '/settings/'
});

var bpmGauge = app.gauge.create({
    el: '.bpm-gauge',
    type: 'circle',
    value: 0,
    size: 350,
    borderColor: '#f44336',
    borderWidth: 20,
    valueText: 'start',
    valueFontSize: 60,
    valueTextColor: '#2196f3',
    labelText: '&hearts; BPM',
  });



// Login Screen Demo
$$('#my-login-screen .login-button').on('click', function () {
  var username = $$('#my-login-screen [name="username"]').val();
  var password = $$('#my-login-screen [name="password"]').val();

  // Close login screen
  app.loginScreen.close('#my-login-screen');

  // Alert username and password
  app.dialog.alert('Username: ' + username + '<br>Password: ' + password);
});





/***************************************************************************** 
 * BLUETOOTH PART
*****************************************************************************/

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
      this.bindBluetoothEvents();
      detailPage.hidden = true;
  },
  
  bindBluetoothEvents: function() {
      document.addEventListener('deviceready', this.onDeviceReady, false);
      refreshButton.addEventListener('touchstart', this.refreshDeviceList, false);
      sendButton.addEventListener('click', this.sendData, false);
      disconnectButton.addEventListener('touchstart', this.disconnect, false);
      deviceList.addEventListener('touchstart', this.connect, false); // assume not scrolling
  },
  onDeviceReady: function() {
    bluefruitConnect.refreshDeviceList();
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
              sendButton.dataset.deviceId = deviceId;
              disconnectButton.dataset.deviceId = deviceId;
              resultDiv.innerHTML = "";
              bluefruitConnect.showDetailPage();
              sendButton.style.display ="none";
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

      resultDiv.innerHTML = "";
      resultDiv.innerHTML = resultDiv.innerHTML + "&hearts; " + bytesToString(data) + "<br/>";

      resultInt=parseInt(bytesToString(data));

      bpmGauge.update({
        value: resultInt*(1/200),
        valueText: resultInt
      });

      compteur++;
      total = total+resultInt;
  },

  sendData: function(event) { // send data to Arduino

      var success = function() {
          console.log("success");
          resultDiv.innerHTML = resultDiv.innerHTML + "Sent: " + messageInput.value + "<br/>";
          resultDiv.scrollTop = resultDiv.scrollHeight;
      };

      var failure = function() {
          alert("Failed writing data to the bluefruit le");
      };

      var data = stringToBytes(messageInput.value);
      var deviceId = event.target.dataset.deviceId;

      if (bluefruitConnect.writeWithoutResponse) {
          ble.writeWithoutResponse(
              deviceId,
              bluefruit.serviceUUID,
              bluefruit.txCharacteristic,
              data, success, failure
          );
      } else {
          ble.write(
              deviceId,
              bluefruit.serviceUUID,
              bluefruit.txCharacteristic,
              data, success, failure
          );
      }
  },

  disconnect: function(event) {
      var deviceId = event.target.dataset.deviceId;
      ble.disconnect(deviceId, bluefruitConnect.showConnectionPage, bluefruitConnect.onError);
      sendButton.style.display ="block";
  },
  showConnectionPage: function() {
      refreshButtonDiv.hidden = false;
      refreshButton.hidden = false;
      connectionPage.hidden = false;
      detailPage.hidden = true;
      sendButton.hidden = false;
  },
  showDetailPage: function() {
      refreshButtonDiv.hidden = true;
      refreshButton.hidden = true;
      connectionPage.hidden = true;
      detailPage.hidden = false;
      sendButton.hidden = true;
  },
  onError: function(reason) {
      alert("ERROR: " + JSON.stringify(reason)); // real apps should use notification.alert
  }

};


const config = {
    clientId: "yourclientid",
    redirectUrl: "festify-spotify://callback",
    scopes: ["streaming"], // see Spotify Dev console for all scopes
    tokenExchangeUrl: "https://yoururl/dev/exchange",
    tokenRefreshUrl: "https://yoururl/dev/refresh",
    };

var bpmPlayer = {

    initializeSpotify: function() {
        this.bindSpotifyEvents();
        this.initConnect();
        setInterval(bpmPlayer.checkPosition, 10);
    },

    spotifyAppClientId: "yourclientid",
    spotifyAppClientSecret: "yourclientsecret",
    accessToken: null,

    // Bind events
    bindSpotifyEvents: function() {
        updateIdButton.addEventListener('click', bpmPlayer.listTracks, false);
        matchButton.addEventListener('click', bpmPlayer.matchTrack, false);
        playRandomButton.addEventListener('click', bpmPlayer.playRandomTrack, false);
    },
    
    // Init connect with API to access to playlist data's
    initConnect: function(){
        localStorage.clear();
        cordova.plugins.spotifyAuth
        .authorize(config)
        .then(function(accessToken, expiresAt) {
            bpmPlayer.accessToken = accessToken.accessToken;
        console.log("Got an access token, its ")
        console.log(accessToken);
        console.log("ts going to expire in " + expiresAt);
        });
    },

    // Get auth token to access Spotify's web API
    getAuthToken: function(){
        return $.ajax({
                url: "https://accounts.spotify.com/api/token",
                method: "POST",
                dataType: "json",
                crossDomain: true,
                contentType: "application/x-www-form-urlencoded; charset=utf-8",
                data: {grant_type : "client_credentials"},
                cache: false,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Basic " + btoa(bpmPlayer.spotifyAppClientId + ":" + bpmPlayer.spotifyAppClientSecret));
            }})
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.log(errorThrown);
                console.log("Ah bah non, erreur : " + textStatus);
            });
    },

    // Get user playlist's with all the tracks
    listTracks: function(){
        bpmPlayer.getAuthToken().done(function(data){
            console.log("Success : auth token collected !");
            console.log(data);
            this.accessToken = data.access_token;
            $.ajaxSetup({
               headers : {
                'Authorization' : 'Bearer ' + this.accessToken
                }  
            });
            
            var spotifyIdCleared = spotifyIdInput.value.replace(/https.*playlist\//,"");
            var spotifyPlaylistId = "https://api.spotify.com/v1/playlists/" + spotifyIdCleared; 

            $.getJSON(spotifyPlaylistId, function(data){ // Get the playlist 
                console.log("Et voila la playlist :");
                console.log(data);

                data.tracks.items.forEach(function(trackEntry){

                    var trackObject = {}; // Creating a track object to store track data's

                    $.getJSON("https://api.spotify.com/v1/audio-features/" + trackEntry.track.id, function(audioFeatures){
                        
                        // Adding tempo, uri and duration from /audio-features/
                        trackObject.tempo = audioFeatures.tempo;
                        trackObject.uri = audioFeatures.uri;
                        trackObject.duration = audioFeatures.duration_ms;

                    });

                    $.getJSON("https://api.spotify.com/v1/tracks/" + trackEntry.track.id, function(tracks){

                        // Adding imgUrl, name from /tracks/
                        trackObject.imgUrl = tracks.album.images[2].url;
                        trackObject.name = tracks.name;

                        // Adding artist from /tracks/
                        // TODO : Add several artists
                        var artists = tracks.artists;
                        artists.forEach(function(artistsNames){
                            trackObject.artists = artistsNames.name
                        })
                    });

                    // Push trackObject to the main track array
                    bpmArray.push(trackObject);

                });
            });
        });
        console.log("BPM Array :");
        console.log(bpmArray);

        sortTracks(); // Sort tracks
    },

    // Sort tracks based on their tempo
    sortTracks: function(){

        console.log("Function : sortTracks");

        // Add all tracks tempos to an array
        bpmArray.forEach(function(track) {
            tempoArray.push(track.tempo);
          });

        // Sort the array in the ascent order based on tracks BPMs
        tempoArray.sort(function(a, b) {
            return a - b;
          });
        
        var bpmArrayLenght = bpmArray.length;
        
        // Add tracks to 4 categories (arrays) based on the average tempo amplitude
        bpmArray.forEach(function(track){

            // Low tempos
            if(track.tempo<tempoArray[Math.round(bpmArrayLenght*(1/4))]){
                tempo1.push(track);
            }

            // Cool tempos
            if(track.tempo>tempoArray[Math.round(bpmArrayLenght*(1/4))] && track.tempo<tempoArray[Math.round(bpmArrayLenght*(2/4))]){
                tempo2.push(track);
            }

            // Medium tempos
            if(track.tempo>tempoArray[Math.round(bpmArrayLenght*(2/4))] && track.tempo<tempoArray[Math.round(bpmArrayLenght*(3/4))]){
                tempo3.push(track);
            }

            // Fast tempos
            if(track.tempo>tempoArray[Math.round(bpmArrayLenght*(3/4))]){
                tempo4.push(track);
            }
        })
        console.log(tempo1);
        console.log(tempo2);
        console.log(tempo3);
        console.log(tempo4);
    },

    // Play a random track when the run begin
    playRandomTrack: function(){
        randomTrack = bpmArray[Math.floor(Math.random() * bpmArray.length)];
        cordova.plugins.spotify.play(randomTrack.uri, { 
            clientId: bpmPlayer.spotifyAppClientId,
            token: bpmPlayer.accessToken
          }).then(() => console.log("Music is playing ????"));
        
        // Reset the currentTrack and BPM mean value
        currentTrack = randomTrack;
        total = 0;
        compteur=0;
    },

    // Check constant position on the played track
    checkPosition: function(){
        /**cordova.plugins.spotify.getPosition()
        .then(function(value){position = value;})
        .catch(); */
    },

    // When a track ends,play another one based on BPM mean from the last one
    onTrackEnd: function(){
        
        // If the track reach the end
        if(currentTrack.duration - position < 500){
            console.log("Track is playing !");
        }else{
            console.log("Le track " + currentTrack.name + " est fini");
            
            moyenne = total/compteur; // Get BPM mean value
            matchTrack(moyenne); // Match track based on last song's BPM mean value
            
            // If the track is the same, repeat
            if(nextTrack.name == currentTrack.name){
                matchTrack();
            }
            else{
                console.log("Prochain track : " + nextTrack.name);
            }

            playTrack(nextTrack);

            // Reset values for next song
            total=0;
            compteur=0;
        }
    },

    // Match a track based on an average BPM
    matchTrack: function(averageBPM){
                
        var pulseEtendue = pulseMax - pulseMin;

        // Pick a song from the 4 categories of tempo intensity
        if(averageBPM<pulseMin+(pulseEtendue*(1/4))){
            nextTrack = tempo1[Math.floor(Math.random() * tempo1.length)];
        }

        if(averageBPM>pulseMin+(pulseEtendue*(1/4)) && averageBPM<pulseMin+(pulseEtendue*(2/4))){
            nextTrack = tempo2[Math.floor(Math.random() * tempo2.length)];
        }

        if(averageBPM>pulseMin+(pulseEtendue*(2/4)) && averageBPM<pulseMin+(pulseEtendue*(3/4))){
            nextTrack = tempo3[Math.floor(Math.random() * tempo3.length)];
        }

        if(averageBPM>pulseMin+(pulseEtendue*(3/4))){
            nextTrack = tempo4[Math.floor(Math.random() * tempo4.length)];
        }
    },

    // Play a track
    playTrack: function(track){
        cordova.plugins.spotify.play(track.uri, { 
            clientId: bpmPlayer.spotifyAppClientId,
            token: bpmPlayer.accessToken
          }).then(() => console.log("Music is playing ????"));
        
        currentTrack = nextTrack;
    },

    // Udpate track widget on the page
    // TODO
    udpateTrackInfos: function(){

    },

    // React when a user press pause
    // TODO
    pauseTrack: function(){

    },

    // React when a user press resume
    // TODO
    resumeTrack: function(){

    }
};

/***************************************************************************** 
 * TODO
*****************************************************************************/

/**
 * recup position a partir de getPosition
 * faire une boucle while(currentTrack.duration - position > 1500) ajouter +1 a une valeur pour faire la barre de progression
 * a la fin de la boucle -> appeler match track
 * 
 * onTrackEnd() -> appeler des le lancement si playState = pause rien faire
 * 
 * changeTrack() -> changer de track en fonction du currentTrack.tempo
 * 
 * matchTrack(moyenne) => en fonction de moyenne et de currentTrack -> rapport ==> nextTempo
 * 
 * playTrack(nextTempo) => joue track en fonction du tempo
 * 
 * A FAIRE :
 * playState => sur pause ou pas
 * currentTrack{} => contient : position, tempo, name, imgUrl
 * 
 */
