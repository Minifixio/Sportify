'use strict';

var spotifyIdInput = document.getElementById("spotifyId");
var updateIdButton = document.getElementById("updateIdButton");
var playRandomButton = document.getElementById("playRandomButton");
var matchButton = document.getElementById("matchButton");
var player_trackTitle = document.getElementById("player_trackTitle");
var player_trackArtist = document.getElementById("player_trackArtist");
var trackImage = document.getElementById("trackImage");
var button_player = document.getElementById("button_player");
var button_playerArrowNext = document.getElementById("button_playerArrowNext");
var button_playerArrowPrevious = document.getElementById("button_playerArrowPrevious");

var totalArray = 0;
var bpmArray = new Array();
var tempoArray = new Array();
var tempo1 = new Array();
var tempo2 = new Array();
var tempo3 = new Array();
var tempo4 = new Array();

const trackInfo = {};
var currentTrack;
var randomTrack;
var position = 0;
var randomTrack;
var nextTrack;
var playingState = 0;
var lastTrack;

var pulseMax = 200;
var pulseMin = 50;


const config = {
    clientId: spotifyIDs.clientId,
    redirectUrl: "festify-spotify://callback",
    scopes: ["streaming"], // see Spotify Dev console for all scopes
    tokenExchangeUrl: spotifyIDs.tokenExchangeUrl,
    tokenRefreshUrl: spotifyIDs.tokenRefreshUrl,
};


var bpmPlayer = {

    initializeSpotify: function() {
        this.bindSpotifyEvents();
        this.initConnect();
    },

    spotifyAppClientId: spotifyIDs.clientId,
    spotifyAppClientSecret: spotifyIDs.spotifyAppClientSecret,
    accessToken: null,

    // Bind events
    bindSpotifyEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        updateIdButton.addEventListener('click', this.updateUsersPlaylist, false);
        matchButton.addEventListener('click', this.sortTracks, false);
    },

    onDeviceReady: function(){
        console.log("Ready");
        bpmPlayer.initConnect();
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
        console.log("and it's going to expire in " + expiresAt);
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

        // Empty the bpmArray in case the user re-add a playlist
        // TODO : Let the user add several playlist to the bpmArray to have a larger selection of titles
        bpmArray = [];

        bpmPlayer.getAuthToken().done(function(data){
            console.log("Success : auth token collected !");
            console.log(data);
            this.accessToken = data.access_token;
            $.ajaxSetup({
               headers : {
                'Authorization' : 'Bearer ' + this.accessToken
                }
            });

            //var spotifyIdCleared = spotifyIdInput.value.replace(/https.*playlist\//,"");
            var spotifyPlaylistId = "https://api.spotify.com/v1/playlists/" + spotifyIdInput.value.replace(/https.*playlist\//,"");

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

    },

    // Sort tracks based on their tempo
    sortTracks: function(){

        // Reset the arrays in case the user re-sort the tracks
        tempo1 = [];
        tempo2 = [];
        tempo3 = [];
        tempo4 = [];
        tempoArray = [];

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
            if(track.tempo>=tempoArray[Math.round(bpmArrayLenght*(1/4))] && track.tempo<tempoArray[Math.round(bpmArrayLenght*(2/4))]){
                tempo2.push(track);
            }

            // Medium tempos
            if(track.tempo>=tempoArray[Math.round(bpmArrayLenght*(2/4))] && track.tempo<tempoArray[Math.round(bpmArrayLenght*(3/4))]){
                tempo3.push(track);
            }

            // Fast tempos
            if(track.tempo>=tempoArray[Math.round(bpmArrayLenght*(3/4))]){
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

        if(bpmArray !== 'undefined' && bpmArray.length > 0){
          setInterval(bpmPlayer.onTrackEnd, 500);

          randomTrack = bpmArray[Math.floor(Math.random() * bpmArray.length)];

          cordova.plugins.spotify.play(randomTrack.uri, {
              clientId: bpmPlayer.spotifyAppClientId,
              token: bpmPlayer.accessToken
            }).then(() => console.log("Music is playing ????"))

          // Reset the currentTrack and BPM mean value
          currentTrack = randomTrack;
          total = 0;
          compteur = 0;
          moyenne = 0;

          console.log("(playRandomTrack) Current track : " + currentTrack.name);
          bpmPlayer.udpateTrackInfos();
          playingState = 1;
        }else{
          var toastPlaylistUnknown = app.toast.create({
            text: 'Vous devez ajouter une playlist dans la page playlist avant de lancer votre musique !',
            position: 'top',
            closeButton: true,
            closeButtonText: 'Fermer',
            closeButtonColor: 'red',
          });
          toastPlaylistUnknown.open();
          console.log("Please add a playlist");
        }
    },

    // Check constant position on the played track
    checkPosition: function(){
        cordova.plugins.spotify.getPosition()
        .then(function(value){position = value;})
        .catch();
    },

    // When a track ends,play another one based on BPM mean from the last one
    onTrackEnd: function(){

        cordova.plugins.spotify.getPosition()
        .then(function(value){position = value;})

        //console.log("(onTrackEnd) Position : " + position);

        // If the track reach the end
        if((currentTrack.duration - position) > 500){
            console.log("Track is playing !");
        }else{
            console.log("Le track " + currentTrack.name + " est fini");

            moyenne = total/compteur; // Get BPM mean value
            console.log("La moyenne est de " + moyenne);

            lastTrack = currentTrack; // Current track becomes last track played

            bpmPlayer.matchTrack(moyenne); // Match track based on last song's BPM mean value

            // If the track is the same, repeat
            if(nextTrack.name == currentTrack.name){
                bpmPlayer.matchTrack(moyenne);
            }
            else{
                console.log("Prochain track : " + nextTrack.name);
            }

            bpmPlayer.playTrack(nextTrack);

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
            console.log("(matchTrack) Match to : tempo1");
        }

        if(averageBPM>pulseMin+(pulseEtendue*(1/4)) && averageBPM<pulseMin+(pulseEtendue*(2/4))){
            nextTrack = tempo2[Math.floor(Math.random() * tempo2.length)];
            console.log("(matchTrack) Match to : tempo2");
        }

        if(averageBPM>pulseMin+(pulseEtendue*(2/4)) && averageBPM<pulseMin+(pulseEtendue*(3/4))){
            nextTrack = tempo3[Math.floor(Math.random() * tempo3.length)];
            console.log("(matchTrack) Match to : tempo3");
        }

        if(averageBPM>pulseMin+(pulseEtendue*(3/4))){
            nextTrack = tempo4[Math.floor(Math.random() * tempo4.length)];
            console.log("(matchTrack) Match to : tempo4");
        }
    },

    // Play a track
    playTrack: function(track){
        cordova.plugins.spotify.play(track.uri, {
            clientId: bpmPlayer.spotifyAppClientId,
            token: bpmPlayer.accessToken
          }).then(() => console.log("Music is playing ????"));

        console.log("(playTrack) Current track " + track.name);
        currentTrack = track;
        playingState = 1;
        bpmPlayer.udpateTrackInfos();

    },

    // Udpate track widget on the page
    udpateTrackInfos: function(){
        if(playingState == 1){
            button_player.innerHTML = "&#9616;&nbsp;&#9612;";
        }
        if(playingState == 0){
            button_player.innerHTML = "&#9654";
        }

        player_trackTitle.innerHTML = currentTrack.name;
        player_trackArtist.innerHTML = currentTrack.artists;
        trackImage.src = currentTrack.imgUrl;
    },

    // React when a user press pause
    pauseTrack: function(){
        console.log(playingState);
        if (typeof currentTrack == "undefined") {
            bpmPlayer.playRandomTrack();
         }else{
           if(playingState == 0){
               bpmPlayer.resumeTrack();
           }
           if(playingState == 1){

               cordova.plugins.spotify.pause()
               .then(() => console.log("Music is paused ???"));

               playingState = 0;

               bpmPlayer.udpateTrackInfos();

           }
         }
    },

    // React when a user press resume
    resumeTrack: function(){
        cordova.plugins.spotify.resume()
        .then(() => console.log("Music is resuming"));

        playingState = 1;

        bpmPlayer.udpateTrackInfos();
    },

    skipTrack: function(){
        nextTrack = bpmArray[Math.floor(Math.random() * bpmArray.length)];
        if(nextTrack == currentTrack){
            nextTrack = bpmArray[Math.floor(Math.random() * bpmArray.length)];
        }

        bpmPlayer.playTrack(nextTrack);
    },

    lastTrack: function(){
        bpmPlayer.playTrack(lastTrack);
    },

    updateUsersPlaylist: function(){
        bpmPlayer.listTracks();
        setTimeout(function(){
            bpmPlayer.sortTracks();
        }, 5000);
    }
};
