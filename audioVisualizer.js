// Original: Songs on the Sun by Nelson Rodrigues
// https://speckyboy.com/audio-visualization-code-snippets/

let canvas = document.querySelector("canvas");
let ctx = canvas.getContext("2d");

canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;

let centerX = canvas.width / 2;
let centerY = canvas.height / 2;
let radius = document.body.clientWidth <= 425 ? 120 : 160;
let steps = document.body.clientWidth <= 425 ? 60 : 120;
let interval = 360 / steps;
let pointsUp = [];
let pointsDown = [];
let running = false;
let pCircle = 2 * Math.PI * radius;
let angleExtra = 90;

for(let angle = 0; angle < 360; angle += interval) {
  let distUp = 1.1;
  let distDown = 0.9;

  pointsUp.push({
    angle: angle + angleExtra,
    x: centerX + radius * Math.cos((-angle + angleExtra) * Math.PI / 180) * distUp,
    y: centerY + radius * Math.sin((-angle + angleExtra) * Math.PI / 180) * distUp,
    dist: distUp
  });

  pointsDown.push({
    angle: angle + angleExtra + 5,
    x: centerX + radius * Math.cos((-angle + angleExtra + 5) * Math.PI / 180) * distDown,
    y: centerY + radius * Math.sin((-angle + angleExtra + 5) * Math.PI / 180) * distDown,
    dist: distDown
  });
}

const context = new AudioContext();
const splitter = context.createChannelSplitter();

const analyserL = context.createAnalyser();
analyserL.fftSize = 8192;

const analyserR = context.createAnalyser();
analyserR.fftSize = 8192;

splitter.connect(analyserL, 0, 0);
splitter.connect(analyserR, 1, 0);

const bufferLengthL = analyserL.frequencyBinCount;
const audioDataArrayL = new Uint8Array(bufferLengthL);

const bufferLengthR = analyserR.frequencyBinCount;
const audioDataArrayR = new Uint8Array(bufferLengthR);

const audio = new Audio();

function loadAudio(mp3file) {
  audio.loop = false;
  audio.autoplay = false;
  audio.crossOrigin = "anonymous";

  audio.addEventListener('canplay', handleCanplay);
  audio.src = mp3file;
  audio.load();
  running = true;
}

function handleCanplay() {
  const source = context.createMediaElementSource(audio);
  source.connect(splitter);
  splitter.connect(context.destination);
}

function toggleAudio() {
  if (running === false) {
    loadAudio(mp3file); // Use the received mp3file
    document.querySelector('.call-to-action').remove();
  }

  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
}

canvas.addEventListener('click', toggleAudio);

document.body.addEventListener('touchend', function(ev) {
  context.resume();
});

function drawLine(points) {
  let origin = points[0];

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineJoin = 'round';
  ctx.moveTo(origin.x, origin.y);

  for (let i = 0; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.lineTo(origin.x, origin.y);
  ctx.stroke();
}

function connectPoints(pointsA, pointsB) {
  for (let i = 0; i < pointsA.length; i++) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.moveTo(pointsA[i].x, pointsA[i].y);
    ctx.lineTo(pointsB[i].x, pointsB[i].y);
    ctx.stroke();
  }
}

function update(dt) {
  let audioIndex, audioValue;

  analyserL.getByteFrequencyData(audioDataArrayL);
  analyserR.getByteFrequencyData(audioDataArrayR);

  for (let i = 0; i < pointsUp.length; i++) {
    audioIndex = Math.ceil(pointsUp[i].angle * (bufferLengthL / (pCircle * 2))) | 0;
    audioValue = audioDataArrayL[audioIndex] / 255;

    pointsUp[i].dist = 1.1 + audioValue * 0.8;
    pointsUp[i].x = centerX + radius * Math.cos(-pointsUp[i].angle * Math.PI / 180) * pointsUp[i].dist;
    pointsUp[i].y = centerY + radius * Math.sin(-pointsUp[i].angle * Math.PI / 180) * pointsUp[i].dist;

    audioIndex = Math.ceil(pointsDown[i].angle * (bufferLengthR / (pCircle * 2))) | 0;
    audioValue = audioDataArrayR[audioIndex] / 255;

    pointsDown[i].dist = 0.9 + audioValue * 0.2;
    pointsDown[i].x = centerX + radius * Math.cos(-pointsDown[i].angle * Math.PI / 180) * pointsDown[i].dist;
    pointsDown[i].y = centerY + radius * Math.sin(-pointsDown[i].angle * Math.PI / 180) * pointsDown[i].dist;
  }
}

function draw(dt) {
  requestAnimationFrame(draw);

  if (running) {
    update(dt);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawLine(pointsUp);
  drawLine(pointsDown);
  connectPoints(pointsUp, pointsDown);
}

draw();
