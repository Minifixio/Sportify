var testButton = document.getElementById("testButton");

function stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array.buffer;
}

var testApp = {

    initialize: function(){
        testButton.addEventListener('click', testApp.startTest, false);
    },

    startTest: function(){
        //testApp.playRandomTrackTest();
        bluefruitConnect.showDetailPage();
        //console.log(currentTrack.duration);
        //position = currentTrack.duration - 2000;
        //console.log(position);
        //console.log(currentTrack.duration - position);
        setInterval(testApp.onDataTest, 500);
        //setInterval(testApp.printInfos, 2000);
        //setInterval(testApp.positionTest, 500);
        //setInterval(testApp.onTrackEndTest, 500);
    },

    positionTest: function(){
        position = position+100
    },

    onDataTest: function(){
        bluefruitConnect.onData(stringToBytes(Math.round(Math.random() * (120 - 140) + 120).toString()));
    },

    onTrackEndTest: function(){
        if((currentTrack.duration - position) > 500){
            console.log("Track is playing !");
        }else{
            console.log("Le track " + currentTrack.name + " est fini");
            
            moyenne = total/compteur; // Get BPM mean value
            bpmPlayer.matchTrack(moyenne); // Match track based on last song's BPM mean value
            
            // If the track is the same, repeat
            if(nextTrack.name == currentTrack.name){
                bpmPlayer.matchTrack();
            }
            else{
                console.log("Prochain track : " + nextTrack.name);


                testApp.playTrackTest(nextTrack);
                position = currentTrack.duration - 2000;
    
                // Reset values for next song
                total=0;
                compteur=0;                
            }

        }
    },

    playRandomTrackTest: function(){
        randomTrack = bpmArray[Math.floor(Math.random() * bpmArray.length)];
        currentTrack = randomTrack;

        total = 0;
        compteur=0;

        console.log(currentTrack.name);
        bpmPlayer.udpateTrackInfos();
    },

    printInfos: function(){
        //console.log("Position : " + position + " " + " Duration " + currentTrack.duration);
        //console.log(currentTrack.duration - position);
        moyenne = total/compteur;
        console.log(moyenne);
    },

    playTrackTest: function(track){
        
        console.log("Play Track " + track.name);
        currentTrack = track;
        bpmPlayer.udpateTrackInfos();

    },
};



