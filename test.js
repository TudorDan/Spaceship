const fps = 30; // frames per second
const asteroid_more_edges = 0.4; // jaggedness of the asteasteroids (0 = none, 1 = lots)
const asteroid_NUM = 3; // starting number of asteasteroids
const asteroid_SIZE = 100; // starting size of asteasteroids in pixels
const asteroid_SPD = 50; // max starting speed of asteasteroids in pixels per second
const asteroid_edges = 10; // average number of edgesices on each asteasteroid
const SHIP_SIZE = 30; // ship height in pixels
const SHIP_move = 5; // acceleration of the ship in pixels per second per second
const SHIP_TURN_SPD = 360; // turn speed in degrees per second
const SHOW_CENTRE_DOT = false; // show or hide ship's centre dot

/**Canvas */
let canvas = document.querySelector("#gameCanvas");
let context = canvas.getContext("2d");

// set up the spaceship object
let ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: SHIP_SIZE / 2,
    angle: 90 / 180 * Math.PI, // conedges to radians
    rotation: 0,
    moving: false,
    move: {
        x: 0,
        y: 0
    }
}

// set up asteasteroids
let asteroids = [];
generateAsteroidArray();

// set up event handlers
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

// set up the game loop
setInterval(gameLogic, 1000 / fps);

function make_base() {
    let base_image = new Image();
    base_image.src = 'images/base.jpg';
    context.drawImage(base_image, 0, 0, window.innerWidth, window.innerHeight);
}

function generateAsteroidArray() {
    asteroids = [];
    let x, y;
    for (let i = 0; i < asteroid_NUM; i++) {
        // random asteroid location (not touching spaceship)
        do {
            x = Math.floor(Math.random() * canvas.width);
            y = Math.floor(Math.random() * canvas.height);
        } while (distBetweenShipAsteroids(ship.x, ship.y, x, y) < asteroid_SIZE * 2 + ship.r);
        asteroids.push(newAsteasteroid(x, y));
    }
}

function distBetweenShipAsteroids(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function keyDown(event) {
    switch (event.code) {
        case 'ArrowLeft': // left arrow (rotationate ship left)
            ship.rotation = SHIP_TURN_SPD / 180 * Math.PI / fps;
            break;
        case 'ArrowUp': // up arrow (move the ship forward)
            ship.moving = true;
            break;
        case 'ArrowRight': // right arrow (rotationate ship right)
            ship.rotation = -SHIP_TURN_SPD / 180 * Math.PI / fps;
            break;
    }
}

function keyUp(event) {
    switch (event.code) {
        case 'ArrowLeft': // left arrow (stop rotationating left)
            ship.rotation = 0;
            break;
        case 'ArrowUp': // up arrow (stop moving)
            ship.moving = false;
            break;
        case 'ArrowRight': // right arrow (stop rotationating right)
            ship.rotation = 0;
            break;
    }
}

function newAsteasteroid(x, y) {
    let asteroid = {
        a: Math.random() * Math.PI * 2, // in radians
        additional_edges: [],
        r: asteroid_SIZE / 2,
        edges: Math.floor(Math.random() * (asteroid_edges + 1) + asteroid_edges / 2),
        x: x,
        y: y,
        xv: Math.random() * asteroid_SPD / fps * (Math.random() < 0.5 ? 1 : -1),
        yv: Math.random() * asteroid_SPD / fps * (Math.random() < 0.5 ? 1 : -1)
    };

    // populate the additional_edgesets array
    for (let i = 0; i < asteroid.edges; i++) {
        asteroid.additional_edges.push(Math.random() * asteroid_more_edges * 2 + 1 - asteroid_more_edges);
    }

    return asteroid;
}

function gameLogic() {
    // draw space
    make_base();

    // move the ship
    if (ship.moving) {
        ship.move.x += SHIP_move * Math.cos(ship.angle) / fps;
        ship.move.y -= SHIP_move * Math.sin(ship.angle) / fps;

        // draw reaction jet
        context.fillStyle = "red";
        context.strokeStyle = "yellow";
        context.lineWidth = SHIP_SIZE / 10;
        context.beginPath();
        context.moveTo( // rear left
            ship.x - ship.r * (2 / 3 * Math.cos(ship.angle) + 0.5 * Math.sin(ship.angle)),
            ship.y + ship.r * (2 / 3 * Math.sin(ship.angle) - 0.5 * Math.cos(ship.angle))
        );
        context.lineTo( // rear centre (behind the ship)
            ship.x - ship.r * 5 / 3 * Math.cos(ship.angle),
            ship.y + ship.r * 5 / 3 * Math.sin(ship.angle)
        );
        context.lineTo( // rear right
            ship.x - ship.r * (2 / 3 * Math.cos(ship.angle) - 0.5 * Math.sin(ship.angle)),
            ship.y + ship.r * (2 / 3 * Math.sin(ship.angle) + 0.5 * Math.cos(ship.angle))
        );
        context.closePath();
        context.fill();
        context.stroke();
    }

    // draw the triangular ship
    context.fillStyle = "dodgerblue";
    context.strokeStyle = "dodgerblue";
    context.lineWidth = SHIP_SIZE / 20;
    context.beginPath();
    context.moveTo( // nose of the ship
        ship.x + 4 / 3 * ship.r * Math.cos(ship.angle),
        ship.y - 4 / 3 * ship.r * Math.sin(ship.angle)
    );
    context.lineTo( // rear left
        ship.x - ship.r * (2 / 3 * Math.cos(ship.angle) + Math.sin(ship.angle)),
        ship.y + ship.r * (2 / 3 * Math.sin(ship.angle) - Math.cos(ship.angle))
    );
    context.lineTo( // rear right
        ship.x - ship.r * (2 / 3 * Math.cos(ship.angle) - Math.sin(ship.angle)),
        ship.y + ship.r * (2 / 3 * Math.sin(ship.angle) + Math.cos(ship.angle))
    );
    context.closePath();
    context.fill();
    context.stroke();

    // draw the asteroids
    context.strokeStyle = "slategrey";
    context.lineWidth = SHIP_SIZE / 20;
    let a, r, x, y, additional_edges, edges;
    for (let i = 0; i < asteroids.length; i++) {

        // get the asteroid properties
        a = asteroids[i].a;
        r = asteroids[i].r;
        x = asteroids[i].x;
        y = asteroids[i].y;
        additional_edges = asteroids[i].additional_edges;
        edges = asteroids[i].edges;

        // draw the path
        context.beginPath();
        context.moveTo(
            x + r * additional_edges[0] * Math.cos(a),
            y + r * additional_edges[0] * Math.sin(a)
        );

        // draw the polygon
        for (let j = 1; j < edges; j++) {
            context.lineTo(
                x + r * additional_edges[j] * Math.cos(a + j * Math.PI * 2 / edges),
                y + r * additional_edges[j] * Math.sin(a + j * Math.PI * 2 / edges)
            );
        }
        context.closePath();
        context.stroke();

        // move the asteroid
        asteroids[i].x += asteroids[i].xv;
        asteroids[i].y += asteroids[i].yv;

        // handle asteroid edge of screen
        if (asteroids[i].x < 0 - asteroids[i].r) {
            asteroids[i].x = canvas.width + asteroids[i].r;
        } else if (asteroids[i].x > canvas.width + asteroids[i].r) {
            asteroids[i].x = 0 - asteroids[i].r
        }
        if (asteroids[i].y < 0 - asteroids[i].r) {
            asteroids[i].y = canvas.height + asteroids[i].r;
        } else if (asteroids[i].y > canvas.height + asteroids[i].r) {
            asteroids[i].y = 0 - asteroids[i].r
        }
    }

    // centre dot
    if (SHOW_CENTRE_DOT) {
        context.fillStyle = "red";
        context.fillRect(ship.x - 1, ship.y - 1, 2, 2);
    }

    // rotationate the ship
    ship.angle += ship.rotation;

    // move the ship
    ship.x += ship.move.x;
    ship.y += ship.move.y;

    // handle edge of screen
    if (ship.x < 0 - ship.r) {
        ship.x = canvas.width + ship.r;
    } else if (ship.x > canvas.width + ship.r) {
        ship.x = 0 - ship.r;
    }
    if (ship.y < 0 - ship.r) {
        ship.y = canvas.height + ship.r;
    } else if (ship.y > canvas.height + ship.r) {
        ship.y = 0 - ship.r;
    }
}