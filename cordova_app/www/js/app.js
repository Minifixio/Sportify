'use strict';

// Dom7
var $$ = Dom7;

// Framework7 App main instance
var app  = new Framework7({
  root: '#app', // App root element
  name: 'Sportify', // App name
  theme: 'auto', // Automatic theme detection
  touch : {
    disableContextMenu: false,
  },

  // App routes
  routes: routes
});

// Init/Create views
var homeView = app.views.create('#view-home', {
  url: '/'
});
var playlistPage = app.views.create('#view-playlistPage', {
  url: '/playlistPage/'
});


var bpmGauge = app.gauge.create({
    el: '.bpm-gauge',
    type: 'circle',
    value: 0,
    size: 350,
    borderColor: '#f44336',
    borderWidth: 20,
    valueText: 'begin now!',
    valueFontSize: 50,
    valueTextColor: '#2196f3',
    labelText: '❤ BPM',
});

var utils = {

  debug: function(message){
    console.log("[DEBUG] " + message);
  }
};
