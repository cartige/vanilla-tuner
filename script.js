var constraints = {audio : true};
var analyser;
var audioCtx;

navigator.mediaDevices.getUserMedia(constraints)
.then(function(stream) {
  audioCtx = new AudioContext();
  var source = audioCtx.createMediaStreamSource(stream);
  analyser = audioCtx.createAnalyser();
  analyser.smoothingTimeConstant = 1;

  analyser.fftSize = 2048*2;

  console.log(analyser.fftSize);

  var bufferLength = analyser.frequencyBinCount;
  var dataArray = new Uint8Array(bufferLength);

  analyser.getByteTimeDomainData(dataArray);

  source.connect(analyser);
  // Will execute myCallback every 0.5 seconds 
  requestAnimationFrame(myCallback);
  
  console.log("hello dans mon then");
})
.catch(function(err) {
  console.log(err);
  if(err instanceof NotAllowedError){
    console.log("accepter autorisation micro");
  }
});

function autoCorrelate( buf, sampleRate ) {
  // Implements the ACF2+ algorithm
  var SIZE = buf.length;
  var rms = 0;

  for (var i=0;i<SIZE;i++) {
      var val = buf[i];
      rms += val*val;
  }
  rms = Math.sqrt(rms/SIZE);
  if (rms<0.001) // not enough signal
      return -1;

  var r1=0, r2=SIZE-1, thres=0.2;
  for (var i=0; i<SIZE/2; i++)
      if (Math.abs(buf[i])<thres) { r1=i; break; }
  for (var i=1; i<SIZE/2; i++)
      if (Math.abs(buf[SIZE-i])<thres) { r2=SIZE-i; break; }

  buf = buf.slice(r1,r2);
  SIZE = buf.length;

  var c = new Array(SIZE).fill(0);
  for (var i=0; i<SIZE; i++)
      for (var j=0; j<SIZE-i; j++)
          c[i] = c[i] + buf[j]*buf[j+i];

  var d=0; while (c[d]>c[d+1]) d++;
  var maxval=-1, maxpos=-1;
  for (var i=d; i<SIZE; i++) {
      if (c[i] > maxval) {
          maxval = c[i];
          maxpos = i;
      }
  }
  var T0 = maxpos;

  var x1=c[T0-1], x2=c[T0], x3=c[T0+1];
  a = (x1 + x3 - 2*x2)/2;
  b = (x3 - x1)/2;
  if (a) T0 = T0 - b/(2*a);

  return sampleRate/T0;
}


window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

function myCallback() {
    // var dataArray = new Uint8Array(analyser.frequencyBinCount); // Uint8Array should be the same length as the frequencyBinCount

    var buf = new Float32Array( analyser.fftSize );
    analyser.getFloatTimeDomainData( buf );
    var ac = autoCorrelate( buf, audioCtx.sampleRate );
    const tone = document.getElementById("tone");
    const greenBar = document.getElementsByClassName("greenBg")[0];
    const redBarDown = document.getElementsByClassName("redBg down")[0];
    const redBarUp = document.getElementsByClassName("redBg up")[0];
    const tunerArrow = document.getElementById("tunerArrow");

    console.log(ac);
    tone.innerHTML = getNoteFromFreq(ac);
    let midiNumber = getMidiNumber(ac);
    let midiNumberDecimal = midiNumber-Math.round(midiNumber);
    // let myColorMiddle = "white";
    // let myColorLeft = "white";
    // let myColorRight = "white";

    // if(isTheRightPitch(midiNumber)){
    //   myColorMiddle = "green";
    // }
    // if(midiNumberDecimal > 0){
    //   myColorRight = "red";
    // }
    // if(midiNumberDecimal < 0){
    //   myColorLeft = "red";
    // } 
    greenBar.style.backgroundColor = isTheRightPitch(midiNumber) ? "green" : "white";
    redBarDown.style.backgroundColor = midiNumberDecimal < -0.05 ? "red" : "white";
    redBarUp.style.backgroundColor = midiNumberDecimal > 0.05 ? "red" : "white";
    tunerArrow.style.left = ac < 0 ? "0%" : `${midiNumberDecimal*100}%`;
    requestAnimationFrame(myCallback);

}

function getNoteFromFreq (freq){

  let note = "";
                                       //freq = fm = ac
  let midiNumber = Math.round(12*Math.log2(freq/440) + 69);//midi number of closest note
  // Math.pow(2, (midiNumber-69)/12)*440;
  if(freq < 0){
    note = "Play a String";
  }else {
    const noteArray = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    note = noteArray[midiNumber%12] + (Math.floor(midiNumber/12)-1);
  }

  return note;
}


function isTheRightPitch (isPerfectNote){
  const precisionPitch = 0.07;
  return Math.abs(isPerfectNote-Math.round(isPerfectNote)) <= precisionPitch;
}

function getMidiNumber(freq){
  return 12*Math.log2(freq/440) + 69;
}





console.log("hello");

