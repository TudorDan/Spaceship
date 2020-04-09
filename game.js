/**Canvas */
// frames per second
const fps = 30;

const ship_size = 30; //pixels

const turn_speed = 360; // rotation in degrees per second

let canvas = document.querySelector('#gameCanvas');

let context = canvas.getContext('2d');

function make_base() {
    let base_image = new Image();
    base_image.src = 'images/base.jpg';
    context.drawImage(base_image, 0, 0, window.innerWidth, window.innerHeight);
}

let ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: ship_size / 2,
    a: 90 / 180 * Math.PI, // radians  orientation of the ship
    rotation: 0,
    moving: false,
    move: {
        x: 0,
        y: 0
    }
}


document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

setInterval(gameLogic, 1000 / fps);

function keyDown(event) {
    switch (event.code) {
        case 'KeyA': // left arrow (rotate ship left)
            ship.rotation = turn_speed / 180 * Math.PI / fps;
            break;
        case 'KeyW': // up arrow (thrust the ship forward)
            ship.moving = true;
            break;
        case 'KeyD': // right arrow (rotate ship right)
            ship.rotation = -turn_speed / 180 * Math.PI / fps;
            break;
    }
}

function keyUp(event) {
    switch (event.code) {
        case 'KeyA': // left arrow (stop rotating left)
            ship.rotation = 0;
            break;
        case 'KeyW': // up arrow (stop thrusting)
            ship.moving = false;
            break;
        case 'KeyD': // right arrow (stop rotating right)
            ship.rotation = 0;
            break;
    }
}

function gameLogic() {
    // create background
    make_base();

    // create spaceship
    context.strokeStyle = "blue";
    context.lineWidth = ship_size / 20;
    context.beginPath();
    context.moveTo( // nose of the ship
        ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
        ship.y - 4 / 3 * ship.r * Math.sin(ship.a)
    );
    context.lineTo( // rear left
        ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + Math.sin(ship.a)),
        ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - Math.cos(ship.a))
    );
    context.lineTo( // rear right
        ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - Math.sin(ship.a)),
        ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + Math.cos(ship.a))
    );
    context.closePath();
    context.stroke();

    // rotate the ship
    ship.a += ship.rotation;

    // move the ship
    ship.x += ship.move.x;
    ship.y += ship.move.y;
}


