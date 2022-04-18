var constraints = {audio : true};
var analyser;
var audioCtx;

navigator.mediaDevices.getUserMedia(constraints)
.then(function(stream) {
  audioCtx = new AudioContext();
  var source = audioCtx.createMediaStreamSource(stream);
  analyser = audioCtx.createAnalyser();

  analyser.fftSize = 2048*2;

  console.log(analyser.fftSize);

  var bufferLength = analyser.frequencyBinCount;
  var dataArray = new Uint8Array(bufferLength);

  analyser.getByteTimeDomainData(dataArray);

  source.connect(analyser);
  
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
  if (rms<0.01) // not enough signal
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

// Will execute myCallback every 0.5 seconds 
var intervalID = window.setInterval(myCallback, 1000);

function myCallback() {
    var dataArray = new Uint8Array(analyser.frequencyBinCount); // Uint8Array should be the same length as the frequencyBinCount

    var buf = new Float32Array( analyser.fftSize );
    analyser.getFloatTimeDomainData( buf );
    var ac = autoCorrelate( buf, audioCtx.sampleRate );
    const tone = document.getElementById("tone");
    const greenBar = document.getElementsByClassName("greenBg")[0];
    const redBarDown = document.getElementsByClassName("redBg down")[0];
    const redBarUp = document.getElementsByClassName("redBg up")[0];
    // const toneArray = [{"tone": "E1", freq: 82.41},
    //                   {"tone": "F1", freq: 87.31},
    //                   {"tone": "F1#", freq: 92.5},
    //                   {"tone": "G1", freq: 98},
    //                   {"tone": "G1#", freq: 103.83},
    //                   {"tone": "A1", freq: 110},
    //                   {"tone": "A1#", freq: 107.83},
    //                   {"tone": "B1", freq: 123.47},
    //                   {"tone": "C2", freq: 130.81},
    //                   {"tone": "C2#", freq: 138.39},
    //                   {"tone": "D2", freq: 146.83},
    //                   {"tone": "D2#", freq: 155.56},
    //                   {"tone": "E2", freq: 164.81},
    //                   {"tone": "F2", freq: 174.61},
    //                   {"tone": "F2#", freq: 185},
    //                   {"tone": "G2", freq: 196},
    //                   {"tone": "G2#", freq: 207.65},
    //                   {"tone": "A2", freq: 220},
    //                   {"tone": "A2#", freq: 233.08},
    //                   {"tone": "B2", freq: 246.94},
    //                   {"tone": "C3", freq: 261.63},
    //                   {"tone": "C3#", freq: 277.18},
    //                   {"tone": "D3", freq: 293.66},
    //                   {"tone": "D3#", freq: 311.13},
    //                   {"tone": "E3", freq: 329.63}];

    console.log(ac);
    tone.innerHTML = getNoteFromFreq(ac);
    let midiNumber = getMidiNumber(ac);
    if(isTheRightPitch(midiNumber)){
      greenBar.style.backgroundColor = "green";
    }else if(midiNumber-Math.round(midiNumber) > 0){
      redBarUp.style.backgroundColor = "red";
      if(redBarDown.style.backgroundColor = "red"){
        redBarDown.style.backgroundColor = "white";
      }
    }else if(midiNumber-Math.round(midiNumber) < 0){
      redBarDown.style.backgroundColor = "red";
      if(redBarUp.style.backgroundColor = "red"){
        redBarUp.style.backgroundColor = "white";
      }
    }else{
      redBarDown.style.backgroundColor = "white";
      redBarUp.style.backgroundColor = "white";
      greenBar.style.backgroundColor = "white";
    }

}

function getNoteFromFreq (freq){

  let note = "";
  // let i = 0;
  // const midiArray = [{"tone": "E1", midi: 40},
  //                   {"tone": "F1", midi: 41},
  //                   {"tone": "F1#", midi: 42},
  //                   {"tone": "G1", midi: 43},
  //                   {"tone": "G1#", midi: 44},
  //                   {"tone": "A1", midi: 45},
  //                   {"tone": "A1#", midi: 46},
  //                   {"tone": "B1", midi: 47},
  //                   {"tone": "C2", midi: 48},
  //                   {"tone": "C2#", midi: 49},
  //                   {"tone": "D2", midi: 50},
  //                   {"tone": "D2#", midi: 51},
  //                   {"tone": "E2", midi: 52},
  //                   {"tone": "F2", midi: 53},
  //                   {"tone": "F2#", midi: 54},
  //                   {"tone": "G2", midi: 55},
  //                   {"tone": "G2#", midi: 56},
  //                   {"tone": "A2", midi: 57},
  //                   {"tone": "A2#", midi: 58},
  //                   {"tone": "B2", midi: 59},
  //                   {"tone": "C3", midi: 60},
  //                   {"tone": "C3#", midi: 61},
  //                   {"tone": "D3", midi: 62},
  //                   {"tone": "D3#", midi: 63},
  //                   {"tone": "E3", midi: 64}];

  // while(i < arr.length && freq >= arr[i].freq){
    // note = arr[i].to
    // i++;
  // }                                        //freq = fm = ac
  let midiNumber = Math.round(12*Math.log2(freq/440) + 69);//midi number of closest note
  // Math.pow(2, (midiNumber-69)/12)*440;

  // for(let i = 1 ; i < midiArray.length-1 ; i++){
  //     if(midiNumber < midiArray[i].midi + (midiArray[1].midi-midiArray[0].midi)/2 && midiNumber > midiArray[i].midi - (midiArray[1].midi-midiArray[0].midi)/2){
  //       note = midiArray[i].tone;
  //     }
  // }
  // if(midiNumber < midiArray[0].midi + (midiArray[1].midi-midiArray[0].midi)/2 && midiNumber > midiArray[0].midi - (midiArray[1].midi-midiArray[0].midi)/2){
  //   note = midiArray[0].tone;
  // }else if (midiNumber > midiArray[midiArray.length-1].midi - (midiArray[1].midi-midiArray[0].midi)/2 
  //           && midiNumber < midiArray[midiArray.length-1].midi + (midiArray[1].midi-midiArray[0].midi)/2){
  //   note = midiArray[midiArray.length-1];
  // }
  const noteArray = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  note = noteArray[midiNumber%12];
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

