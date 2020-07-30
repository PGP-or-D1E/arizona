const { app, BrowserWindow, Menu, Tray, screen, net } = require('electron')
const electron = require('electron')
const globalShortcut = electron.globalShortcut
const fs = require("fs");
var execa = require("execa");
var currentInput;

// Asynchronous read inputs and outputs
var inputs;
fs.readFile('q&a/inputs.txt', function (err, data) {
  if (err) {
    return console.error(err);
  }
  inputs = data.toString().replace(/(\r\n|\n|\r)/gm,"").split(";");
  //console.log("Asynchronous read: " + data.toString());
});

var responses;
fs.readFile('q&a/responses.txt', function (err, data) {
  if (err) {
    return console.error(err);
  }
  responses = data.toString().split("\n");
  //console.log("Asynchronous read: " + data.toString());
});

var loaded = false;


var path = require('path')
//var url = require('url')
var iconpath = path.join(__dirname, 'extraResources', 'icon.png') // path of y
var serviceScript = path.join(__dirname, 'extraResources','service.js');
// Synchronous read
//var data = fs.readFileSync('input.txt');
//console.log("Synchronous read: " + data.toString());
//console.log("Program Ended");
var win;

function createWindow () {
  const windowWidth = 400;
  const windowHeight = 500;
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const xOffset = 15;
  const winX = width - windowWidth - xOffset;
  const winY = height - windowHeight;
  // Create the browser window.
  win = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
	transparent: true,
	frame: false,
	x:winX,
	y:winY,
  icon: iconpath,
	alwaysOnTop:true,
	resizable:false,
    webPreferences: {
      nodeIntegration: true
    }
  })



    var appIcon = new Tray(iconpath)
    //appIcon.setPressedImage
    var contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App', click: function () {
                win.show()
            }
        },
        {
            label: 'Quit', click: function () {
                app.isQuiting = true
                app.quit()
            }
        }
    ])
    appIcon.setToolTip('Arizona')
    appIcon.setContextMenu(contextMenu);

  win.on('minimize',function(event){
      event.preventDefault();
      win.hide();
  });

  win.on('blur', function(event){
    //event.preventDefault();
    win.hide()
  })

  win.on('show', function(event){
    //win.hid()
    //createWindow()
  })

  win.on('close', function (event) {
      if(!app.isQuiting){
          //event.preventDefault();
          win.hide();
      }

      return false;
  });


	//Add refresh shortcut
  globalShortcut.register('ctrl+shift+a', function() {
		console.log('Bringing back app')
		win.show();
	})
	globalShortcut.register('f5', function() {
		console.log('App Refreshed')
    //win.hide()
		win.reload()
	})
	globalShortcut.register('escape', function() {
		console.log('Hiding app')
		//app.quit();
    //win.close();
	})
	globalShortcut.register('f7', function() {
		console.log('Showing console')
		win.webContents.openDevTools()
	})
  globalShortcut.register('f2', function() {
		//nextTrack();
	})
  globalShortcut.register('f3', function() {
		getArtwork();
	})
  globalShortcut.register("ctrl+shift+s", function(){
    //listen().catch(console.error);
  })



	//globalShortcut.register('enter', function(){
		//sendMessage();
	//})
  // and load the index.html of the app.
  win.loadFile('index.html')
  // Open the DevTools.
  loaded = true;
}

// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');

// Import other required libraries
const util = require('util');
// Creates a client
const client = new textToSpeech.TextToSpeechClient();
async function speak(sString) {
  // The text to synthesize
  const text = sString;

  // Construct the request
  const request = {
    input: {text: text},
    // Select the language and SSML voice gender (optional)
    voice: {languageCode: 'en-US', ssmlGender: 'FEMALE'},
    // select the type of audio encoding
    audioConfig: {audioEncoding: 'MP3'},
  };

  // Performs the text-to-speech request
  const [response] = await client.synthesizeSpeech(request);
  // Write the binary audio content to a local file
  const writeFile = util.promisify(fs.writeFile);
  await writeFile('output.mp3', response.audioContent, 'binary');
  console.log('Audio content written to file: output.mp3');
  var player = require('play-sound')(opts = {})

// $ mplayer foo.mp3
  player.play('output.mp3', function(err){
    if (err) throw err
  })
}

async function listen() {
  // Imports the Google Cloud client library
  const speech = require('@google-cloud/speech');

  // Creates a client
  const client = new speech.SpeechClient();

  // The name of the audio file to transcribe
  const fileName = 'input.wav';

  // Reads a local audio file and converts it to base64
  const file = fs.readFileSync(fileName);
  const audioBytes = file.toString('base64');

  // The audio file's encoding, sample rate in hertz, and BCP-47 language code
  const audio = {
    content: audioBytes,
  };
  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  };
  const request = {
    audio: audio,
    config: config,
  };

  // Detects speech in the audio file
  const [response] = await client.recognize(request);
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
  console.log(`Transcription: ${transcription}`);
}
//listen().catch(console.error);

var artworkURL;
var spotifyUpdateInterval = 3; //In seconds

function checkSpotifyArt(){
  getArtwork();
}
async function getArtwork(){
  const {stdout} = await execa('osascript', ['-e',
  'tell application "Spotify" to return current track\'s artwork url']);
  if(stdout != artworkURL){
    artworkURL = stdout;
    win.webContents.send('artwork', stdout);
    showNotification("Now Playing");
    getTrackInfo();
  }

}

async function getTrackInfo(){
  const [artist, title] = await Promise.all([getArtist(), getTrackTitle()]);
    win.webContents.send('trackInfo', artist + ";" + title);
}
async function getArtist(){
  const {stdout} = await execa('osascript', ['-e',
  'tell application "Spotify" to return current track\'s artist']);
  //console.log(art);
  return stdout;
}
async function getTrackTitle(){
  const {stdout} = await execa('osascript', ['-e',
  'tell application "Spotify" to return current track\'s name']);
  return stdout;
}

app.whenReady().then(createWindow)
var onMac = false;
if (process.platform == 'darwin') {
  onMac = true;
}
if(onMac){
  var t=setInterval(checkSpotifyArt,spotifyUpdateInterval * 1000);
}

/*function authorizeSpotify(){
/*
  const request = net.request({
    method: 'GET',
    protocol: 'https:',
    hostname: 'spotify.com',
    port: 443,
    path: "/authorize?client_id=eb0929c190354d7ea0b7e8a065ad68ed&response_type=code&redirect_uri=https://localhost/callback&scope=user-read-private%20user-read-email&state=34fFs29kd09'"
  });

  request.on('response', (response) => {
  console.log(`STATUS: ${response.statusCode}`);
  response.on('error', (error) => {
    console.log(`ERROR: ${JSON.stringify(error)}`)
  })
})


  request.on('login', (authInfo, callback) => {
    console.log("Logging in");
    callback('chris.strnad', 'Dixiegreenwood1!')

})


  var authWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      'node-integration': false,
      'web-security': false
  });
  // This is just an example url - follow the guide for whatever service you are using
  var authUrl = 'https://accounts.spotify.com/authorize?client_id=eb0929c190354d7ea0b7e8a065ad68ed&response_type=code&redirect_uri=http://localhost:8888&scope=user-read-private%20user-read-email&state=34fFs29kd09'

  authWindow.loadURL(authUrl);
  authWindow.show();
  var keyWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      'node-integration': false,
      'web-security': false
  });
  keyWindow.loadURL("http://localhost:8888")
  keyWindow.show()
  // 'will-navigate' is an event emitted when the window.location changes
  // newUrl should contain the tokens you need
  authWindow.webContents.on('will-navigate', function (event, newUrl) {
      console.log(newUrl);

      // More complex code to handle tokens goes here
  });

  authWindow.on('closed', function() {
      authWindow = null;
  });

}
*/
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  win.show()
  win.webContents.focus();
  if (BrowserWindow.getAllWindows().length === 0) {
    //createWindow()
  }
})




var currentMessage;
function readAnswers(message){
  if(message.startsWith("!")){
    currentMessage = message.substring(1,message.length);
    //speak(currentMessage);
    win.webContents.send('statusUpdate', currentMessage);
  }else if(message.startsWith("*")){
    currentMessage = message.substring(1,message.length);
    win.webContents.send('lyrics', currentMessage);
  }{
    console.log(message);

  }
}

const { Worker, isMainThread } = require("worker_threads");

function runService(workerData) {
  const worker = new Worker(serviceScript, { workerData });
  //worker.postMessage(workerData);
  worker.on("message", incoming => readAnswers(incoming));
  worker.onerror = function (event) {
		console.log(event);
	}
  worker.on("exit", code =>
    console.log(`Worker stopped with exit code ${code}`)
  );
  //worker.postMessage("exit");
  //setTimeout(() => worker.postMessage("you won't see me"), 100);
}

function showNotification(notif){
  win.webContents.send('notification', notif);
}

async function run() {
  const result = runService({currentInput,inputs,responses});
  //console.log({ isMainThread });
}

//run().catch(err => console.error(err));


const { ipcMain } = require('electron')
ipcMain.on('asynchronous-query', (event, arg) => { //When an input is given
	if(arg != ""){
		currentInput = arg;
		run();
		//event.reply('asynchronous-reply', currentMessage);
	}

})

ipcMain.on('synchronous-message', (event, arg) => {
  console.log(arg) // prints "ping"
  event.returnValue = 'Sync return';
})
