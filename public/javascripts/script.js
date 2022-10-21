

// Canvas Related 
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
// const socket = io("http://localhost:3000")
const socket = io("/pong")
let isReferee = false
let paddleIndex = 0;
let roomId ; 
let width = 500;
let height = 700;
let playerName;
let opponentplayerName;
let joinRoomId

// Paddle
let paddleHeight = 10;
let paddleWidth = 50;
let paddleDiff = 25;
let paddleX = [ 225, 225 ];
let trajectoryX = [ 0, 0 ];
let playerMoved = false;

// Ball
let ballX = 250;
let ballY = 350;
let ballRadius = 5;
let ballDirection = 1;

// Speed
let speedY = 2;
let speedX = 0;
// let computerSpeed = 4;

// Score for Both Players
let score = [ 0, 0 ];

// Create Canvas Element
function createCanvas() {
  canvas.id = 'canvas';
  canvas.width = width;
  canvas.height = height;
  document.body.appendChild(canvas);
  renderCanvas();
}

// Wait for Opponents
function renderIntro() {
  // Canvas Background
  context.fillStyle = 'black';
  context.fillRect(0, 0, width, height);

  // Intro Text
  context.fillStyle = 'white';
  context.font = "32px Courier New";
  context.fillText("Waiting for opponent...", 20, (canvas.height / 2) - 30);
  context.fillText(roomId ? roomId : "", 20, (canvas.height / 2) - 70);
}

// Render Everything on Canvas
function renderCanvas() {
  // Canvas Background
  context.fillStyle = 'black';
  context.fillRect(0, 0, width, height);

  // Paddle Color
  context.fillStyle = 'white';

  // Bottom Paddle
  context.fillRect(paddleX[0], height - 20, paddleWidth, paddleHeight);

  // Top Paddle
  context.fillRect(paddleX[1], 10, paddleWidth, paddleHeight);

  // Dashed Center Line
  context.beginPath();
  context.setLineDash([4]);
  context.moveTo(0, 350);
  context.lineTo(500, 350);
  context.strokeStyle = 'grey';
  context.stroke();

  // Ball
  context.beginPath();
  context.arc(ballX, ballY, ballRadius, 2 * Math.PI, false);
  context.fillStyle = 'white';
  context.fill();

  // Score
  context.font = "32px Courier New";
  context.fillText(score[0], 20, (canvas.height / 2) + 50);
  context.fillText(opponentplayerName, 20, (canvas.height / 2) - 110);
  context.fillText(score[1], 20, (canvas.height / 2) - 30);
  context.fillText(roomId, 20, (canvas.height / 2) + 90);
  context.fillText(playerName, 20, (canvas.height / 2) + 120);
  context.fillText(roomId, 20, (canvas.height / 2) - 70);
}

// Reset Ball to Center
function ballReset() {
  ballX = width / 2;
  ballY = height / 2;
  speedY = 3;
  
  socket.emit("ballMove",{
    ballX,
    ballY,
    score
  })
}

// Adjust Ball Movement
function ballMove() {
  // Vertical Speed
  ballY += speedY * ballDirection;
  // Horizontal Speed
  if (playerMoved) {
    ballX += speedX;
  }

  socket.emit("ballMove",{
    ballX,
    ballY,
    score
  })
}

// Determine What Ball Bounces Off, Score Points, Reset Ball
function ballBoundaries() {
  // Bounce off Left Wall
  if (ballX < 0 && speedX < 0) {
    speedX = -speedX;
  }
  // Bounce off Right Wall
  if (ballX > width && speedX > 0) {
    speedX = -speedX;
  }
  // Bounce off player paddle (bottom)
  if (ballY > height - paddleDiff) {
    if (ballX >= paddleX[0] && ballX <= paddleX[0] + paddleWidth) {
      // Add Speed on Hit
      if (playerMoved) {
        speedY += 1;
        // Max Speed
        if (speedY > 5) {
          speedY = 5;
        }
      }
      ballDirection = -ballDirection;
      trajectoryX[0] = ballX - (paddleX[0] + paddleDiff);
      speedX = trajectoryX[0] * 0.3;
    } else {
      // Reset Ball, add to Computer Score
      ballReset();
      score[1]++;
    }
  }
  // Bounce off computer paddle (top)
  if (ballY < paddleDiff) {
    if (ballX >= paddleX[1] && ballX <= paddleX[1] + paddleWidth) {
      // Add Speed on Hit
      if (playerMoved) {
        speedY += 1;
        // Max Speed
        if (speedY > 5) {
          speedY = 5;
        }
      }
      ballDirection = -ballDirection;
      trajectoryX[1] = ballX - (paddleX[1] + paddleDiff);
      speedX = trajectoryX[1] * 0.3;
    } else {
      // Reset Ball, Increase Computer Difficulty, add to Player Score
      // if (computerSpeed < 6) {
      //   computerSpeed += 0.5;
      // }
      ballReset();
      score[0]++;
    }
  }
}

// Computer Movement
// function computerAI() {
//   if (playerMoved) {
//     if (paddleX[1] + paddleDiff < ballX) {
//       paddleX[1] += computerSpeed;
//     } else {
//       paddleX[1] -= computerSpeed;
//     }
//     if (paddleX[1] < 0) {
//       paddleX[1] = 0;
//     } else if (paddleX[1] > (width - paddleWidth)) {
//       paddleX[1] = width - paddleWidth;
//     }
//   }
// }

// Called Every Frame
function animate() {
  // computerAI();
 
  if(isReferee){

    ballMove();
    ballBoundaries();
  }
  renderCanvas();
  window.requestAnimationFrame(animate);
}

// Load Game, Reset Everything
function loadGame() {
  createCanvas();
  renderIntro();

  socket.emit("ready" , {roomId,opponentplayerName : playerName})
}
  
function startGame(){
  paddleIndex = isReferee ? 1 :0 ;
  window.requestAnimationFrame(animate);
  canvas.addEventListener('mousemove', (e) => {
    playerMoved = true;
    paddleX[paddleIndex] = e.offsetX;
    if (paddleX[paddleIndex] < 0) {
      paddleX[paddleIndex] = 0;
    }
    if (paddleX[paddleIndex] > (width - paddleWidth)) {
      paddleX[paddleIndex] = width - paddleWidth;
    }

    socket.emit("paddleMove",{
      xPosition : paddleX[paddleIndex]
    })
    // Hide Cursor
    canvas.style.cursor = 'none';
  });
}

// On Load


  // loadGame();


document.querySelectorAll(".header-btn").forEach(elm=>{
  
  elm.addEventListener("click",()=>{
    document.querySelectorAll(".header-btn").forEach(elmt=>{
      if(elmt.classList.contains("active-btn")){
        elmt.classList.remove("active-btn")
      }
    })
    if(elm.classList.contains("active-btn")){
      elm.classList.remove("active-btn")
      
    }else{
      document.querySelectorAll(".box-room").forEach(html=>{
        if(html.classList.contains("active-box-room")){
          html.classList.remove("active-box-room")
        }
      })

      if(elm.textContent.trim() === "Random"){
        document.querySelector(".random-box").classList.add("active-box-room")
      }else if(elm.textContent.trim() === "Join Room"){
        document.querySelector(".join-room-box").classList.add("active-box-room")
      }else if(elm.textContent.trim() === "Create Room"){
        document.querySelector(".create-room-box").classList.add("active-box-room")
      }
    
      elm.classList.add("active-btn")
    }
  })
})

document.getElementById("create-room-btn").addEventListener("click",()=>{
  playerName = document.getElementById("creator-name").value.trim()
  if(!playerName){
    document.getElementById("error-name").textContent = "Please Enter Name"
    
  }
  else{
     roomId = `Room${Math.floor(Date.now() * Math.random())}`.slice(0,10)
    
    document.getElementsByClassName("roomId-share")[0].classList.add("active-roomId")
    document.getElementById("RoomId-text").textContent = `Your Room ID is ${roomId} share room id to your friend to connect `
  }
 
})

// to start game by creatorr of the room 
document.getElementById("startCreateRoombtn").addEventListener("click",()=>{
  playerName = document.getElementById("creator-name").value.trim()
  if(!playerName){
    document.getElementById("error-name").textContent = "Please Enter Name"
    return
  }
  loadGame()
  document.getElementsByClassName("container")[0].style.display = "none"
})
// 
document.getElementById("startWithRondom").addEventListener("click",()=>{
  playerName = document.getElementById("random-name").value.trim()
  
  if(!playerName){

    document.getElementById("error-name-random").textContent = "Please Enter Name"
    return
  }else if(playerName){
    loadGame()
    document.getElementsByClassName("container")[0].style.display = "none"
  }
})

// to join rooom 
document.getElementById("joinRoombtn").addEventListener("click",()=>{
  playerName = document.getElementById("join-name").value.trim()
  roomId = document.getElementById("join-room-id").value.trim()

  if(!playerName){
    document.getElementById("error-name-join").textContent = "Please Enter Name"
    
  }
  if(!roomId){
    document.getElementById("error-Id-join").textContent = "Please room Id"

  }
  if(playerName && roomId){
    
    loadGame()
    document.getElementsByClassName("container")[0].style.display = "none"

  }
  

})

socket.on("connect",(data)=>{
  console.log("Connected ")
})

socket.on("startGame",(refereeData)=>{
  
  isReferee = refereeData.refereeId === playerName
  roomId = refereeData.roomId

  playerName = refereeData.room.playerId[0]
  opponentplayerName =  refereeData.room.playerId[1] 



  
    startGame()
})

socket.on("paddleMove",(paddleData)=>{
    // update paddle position
  

    const opponentPaddleIndex = 1 - paddleIndex 
    

  paddleX[opponentPaddleIndex] = paddleData.xPosition
})
socket.on("ballMove",(ballData)=>{
  // update Ball position
  ({ballX , ballY , score} = ballData)

})