const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const path = require('path')
const { NearScanner } = require('@toio/scanner')
const app = express()
const server = http.Server(app)
const io = socketio(server)

app.use(express.static(__dirname))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'))
})

app.get('/simulator', (req, res) => {
  res.sendFile(path.join(__dirname + '/simulator.html'))
})

server.listen(3000, () => {
  console.log('listening 3000')
})



// Initialize drawCube properties
let drawCube_x = 0
let drawCube_y = 0
let drawCubeClick = false

// Initialize cube1 properties
let cube1Global
let cube1_x = 0
let cube1_y = 0
let cube1_angle = 0
let cube1_reverse = false

// Initialize cube2 properties
let cube2Global
let cube2_x = 0
let cube2_y = 0
let cube2_angle = 0
let cube2_reverse = false

// Arrays for points in line
let line1 = []
let line2 = []

// Counter for counting line index arrays
let counter = 0

// Counter for moving cube1 and cube2
let moveCounter = 0

// Start movement of other toios
let play = false

async function main(){

  console.log('connected')

  const cubeList = await new NearScanner(3).start()

  // Connect to cubes
  const drawCube = await cubeList[0].connect()
  const cube1 = await cubeList[1].connect()
  const cube2 = await cubeList[2].connect()
  cube1Global = cube1
  cube2Global = cube2

  io.on('connection', async (socket) => {

    console.log("connection established, toio's turned on")

    // Store cube1 position info
    cube1.on('id:position-id', (data) => {

      cube1_x = data.x
      cube1_y = data.y
      cube1_angle = data.angle

      if(line1.length >= 4){

        player(1)

      }


    })

    //Store cube2 position info
    cube2.on('id:position-id', (data) =>{

      cube2_x = data.x
      cube2_y = data.y
      cube2_angle = data.angle

      if(line2.length >= 4){

        player(2)

      }

    })

    drawCube
    
    // Getting drawCube's position & storing it in it's global variables
    .on('id:position-id', (data) => {

      drawCube_x = data.x
      drawCube_y = data.y
    
      // console.log("x: ", drawCube_x)
      // console.log("y: ", drawCube_y)

    })

    // When drawCube is clicked, then send it's position to the client
    // continously until it's clicked again. On the second click it stops
    // drawing. 
    .on('button:press', (data) => {

      if(data.pressed == true){

        socket.emit('pos', drawCube_x, drawCube_y)

        counter++

        // Assign points to indexes within line arrays
        if(counter == 1){

          line1[0] = drawCube_x
          line1[1] = drawCube_y

        }

        else if(counter == 2){

          line1[2] = drawCube_x
          line1[3] = drawCube_y

        }

        else if(counter == 3){

          line2[0] = drawCube_x
          line2[1] = drawCube_y

        }

        else if(counter == 4){

          line2[2] = drawCube_x
          line2[3] = drawCube_y

        }

        else if(counter == 5){
          
          play = true

        }

        // console.log("button pressed")
        // console.log("x: ", drawCube_x)
        // console.log("y: ", drawCube_y)
        
        // console.log("line 1:")
        // console.log(line1[0])
        // console.log(line1[1])
        // console.log(line1[2])
        // console.log(line1[3])

        // console.log("line 2:")
        // console.log(line2[0])
        // console.log(line2[1])
        // console.log(line2[2])
        // console.log(line2[3])

        console.log(counter)

      }

    })

    // If click has occured, points will be sent to
    // server that the toio must move to
    // socket.on('move', (x, y) => {
  
    //   // if (cube_global){
        
    //   //   cube_global.move(...move(x, y, cube_x, cube_y, cube_angle), 100)
      
    //   // }
  
    // })
  
  })

}


function player(id){

  // If it's time to move toios
  // if(play){

  let targetX
  let targetY

  let diffX
  let diffY

  // toio 1

  if(id == 1){

    // Point 1 => Point 2
    if(cube1_reverse == false){

      targetX = line1[0]
      targetY = line1[1]

    }

    // Point 2 => Point 1
    if(cube1_reverse == true){

      targetX = line1[2]
      targetY = line1[3]

    }

    diffX = Math.abs(targetX - cube1_x)
    diffY = Math.abs(targetY - cube1_y)

    if((diffX < 25) && (diffY < 25)){

      if(cube1_reverse == true){

        cube1_reverse = false

      }

      else{

        cube1_reverse = true

      }
    
    }

    cube1Global.move(...move(targetX, targetY, cube1_x, cube1_y, cube1_angle), 100)


  }

  else if(id == 2){

      // Point 1 => Point 2
    if(cube2_reverse == false){

      targetX = line2[0]
      targetY = line2[1]

    }

    // Point 2 => Point 1
    if(cube2_reverse == true){

      targetX = line2[2]
      targetY = line2[3]

    }

    diffX = Math.abs(targetX - cube2_x)
    diffY = Math.abs(targetY - cube2_y)

    if((diffX < 25) && (diffY < 25)){

      if(cube2_reverse == true){

        cube2_reverse = false

      }

      else{

        cube2_reverse = true

      }
    
    }

    cube2Global.move(...move(targetX, targetY, cube2_x, cube2_y, cube2_angle), 100)

  }

  console.log("diffX: ", diffX)
  console.log("diffY: ", diffY)

  //let distance = Math.sqrt(diffX ** 2 + diffY ** 2)
}


function move(targetX, targetY, cX, cY, cA) {

  // console.log("cube = ", cube)

  // console.log("targetX = ", targetX)
  // console.log("targetY = ", targetY)

  // console.log("cubeX = ", cube.x)
  // console.log("cubeY = ", cube.y)

  let diffX = targetX - cX
  let diffY = targetY - cY
  let distance = Math.sqrt(diffX ** 2 + diffY ** 2)

  // console.log("diffX = ", diffX)
  // console.log("diffX = ", diffX)
  // console.log("diffY = ", diffY)
  // console.log("distance = ", distance)
  
  if (distance < 5) {
    return [0, 0]
  }

  let relAngle = (Math.atan2(diffY, diffX) * 180) / Math.PI - cA
  //console.log("relAngle = ", relAngle)
  relAngle = relAngle % 360

  if (relAngle < -180) {
    relAngle += 360
  } 

  else if (relAngle > 180) {
    relAngle -= 360
  }

  let ratio = Math.abs(1 - Math.abs(relAngle) / 90)
  //console.log("Ratio = ", ratio)

  let speed = 40

  if (relAngle > 0 && relAngle <= 90) {
    // forward
    console.log('test1')

    return [speed, speed * ratio]
  } 

  else if (relAngle > 90) {
    // backward
    console.log('test2')

    return [-speed, -speed * ratio]
  } 

  else if (relAngle < 0 && relAngle >= -90) {
    // forward
    console.log('test3')

    return [speed * ratio, speed]
  } 

  else if (relAngle < -90) {
    // backward
    console.log('test4')

    return [-speed * ratio, -speed]
  }

  if (relAngle > 0) {
    console.log('test5')
    return [speed, speed * ratio]
  } 

  else {
    console.log('test6')
    return [speed * ratio, speed]
  }

}


main()
