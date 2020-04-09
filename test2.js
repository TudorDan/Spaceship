const fps = 30; // frames per second
const GAME_LIVES = 3; // starting number of lives
const LASER_DIST = 0.6; // max distance laser can travel as fraction of screen width
const LASER_EXPLODE_DUR = 0.1; // duration of the lasers' explosion in seconds
const LASER_MAX = 10; // maximum number of lasers on screen at once
const LASER_SPD = 500; // speed of lasers in pixels per second
const asteasteroid_more_edges = 0.4; // jaggedness of the asteasteroids (0 = none, 1 = lots)
const asteasteroid_number = 3; // starting number of asteasteroids
const asteasteroid_size = 100; // starting size of asteasteroids in pixels
const asteasteroid_speed = 50; // max starting speed of asteasteroids in pixels per second
const asteasteroid_edges = 10; // average number of edgesices on each asteasteroid
const SHIP_BLINK_DUR = 0.1; // duration in seconds of a single blink during ship's invisibility
const SHIP_EXPLODE_DUR = 0.3; // duration of the ship's explosion in seconds
const SHIP_INV_DUR = 3; // duration of the ship's invisibility in seconds
const SHIP_SIZE = 30; // ship height in pixels
const SHIP_THRUST = 5; // acceleration of the ship in pixels per second per second
const SHIP_TURN_SPD = 360; // turn speed in degrees per second
const SHOW_BOUNDING = false; // show or hide collision bounding
const SHOW_CENTRE_DOT = false; // show or hide ship's centre dot
const TEXT_FADE_TIME = 2.5; // text fade time in seconds
const TEXT_SIZE = 40; // text font height in pixels

/** canvas */
let canvas = document.querySelector("#gameCanvas");
let context = canvas.getContext("2d");

// set up the game parameters
let level, lives, asteroids, ship, text, textAlpha;
newGame();

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

function generateAsteasteroidArray() {
    asteroids = [];
    let x, y;
    for (let i = 0; i < asteasteroid_number + level; i++) {
        // random asteasteroid location (not touching spaceship)
        do {
            x = Math.floor(Math.random() * canvas.width);
            y = Math.floor(Math.random() * canvas.height);
        } while (distBetweenShipAndAsteroids(ship.x, ship.y, x, y) < asteasteroid_size * 2 + ship.r);
        asteroids.push(newAsteasteroid(x, y, Math.ceil(asteasteroid_size / 2)));
    }
}

function destroyAsteasteroid(index) {
    let x = asteroids[index].x;
    let y = asteroids[index].y;
    let r = asteroids[index].r;

    // split the asteasteroid in two if necessary
    if (r == Math.ceil(asteasteroid_size / 2)) { // large asteasteroid
        asteroids.push(newAsteasteroid(x, y, Math.ceil(asteasteroid_size / 4)));
        asteroids.push(newAsteasteroid(x, y, Math.ceil(asteasteroid_size / 4)));
    } else if (r == Math.ceil(asteasteroid_size / 4)) { // medium asteasteroid
        asteroids.push(newAsteasteroid(x, y, Math.ceil(asteasteroid_size / 8)));
        asteroids.push(newAsteasteroid(x, y, Math.ceil(asteasteroid_size / 8)));
    }

    // destroy the asteasteroid
    asteroids.splice(index, 1);

    // new level when no more asteasteroids
    if (asteroids.length == 0) {
        level++;
        newLevel();
    }
}

function distBetweenShipAndAsteroids(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function drawShip(x, y, a, colour = "dodgerblue") {
    context.strokeStyle = colour;
    context.fillStyle = colour;
    context.lineWidth = SHIP_SIZE / 20;
    context.beginPath();
    context.moveTo( // nose of the ship
        x + 4 / 3 * ship.r * Math.cos(a),
        y - 4 / 3 * ship.r * Math.sin(a)
    );
    context.lineTo( // rear left
        x - ship.r * (2 / 3 * Math.cos(a) + Math.sin(a)),
        y + ship.r * (2 / 3 * Math.sin(a) - Math.cos(a))
    );
    context.lineTo( // rear right
        x - ship.r * (2 / 3 * Math.cos(a) - Math.sin(a)),
        y + ship.r * (2 / 3 * Math.sin(a) + Math.cos(a))
    );
    context.closePath();
    context.fill();
    context.stroke();
}

function explodeShip() {
    ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * fps);
}

function gameOver() {
    ship.dead = true;
    text = "Game Over";
    textAlpha = 1.0;
}

function keyDown(event) {

    if (ship.dead) {
        return;
    }
    switch (event.code) {
        case 'Space': // space bar (shoot laser)
            shootLaser();
            break;
        case 'ArrowLeft': // left arrow (rotate ship left)
            ship.rotation = SHIP_TURN_SPD / 180 * Math.PI / fps;
            break;
        case 'ArrowUp': // up arrow (thrust the ship forward)
            ship.moving = true;
            break;
        case 'ArrowRight': // right arrow (rotate ship right)
            ship.rotation = -SHIP_TURN_SPD / 180 * Math.PI / fps;
            break;
    }
}

function keyUp(event) {

    if (ship.dead) {
        return;
    }

    switch (event.code) {
        case 'Space': // space bar (allow shooting again)
            ship.canShoot = true;
            break;
        case 'ArrowLeft': // left arrow (stop rotating left)
            ship.rotation = 0;
            break;
        case 'ArrowUp': // up arrow (stop thrusting)
            ship.moving = false;
            break;
        case 'ArrowRight': // right arrow (stop rotating right)
            ship.rotation = 0;
            break;
    }
}

function newAsteasteroid(x, y, r) {
    let lvlMult = 1 + 0.1 * level;
    let asteroid = {
        x: x,
        y: y,
        xv: Math.random() * asteasteroid_speed * lvlMult / fps * (Math.random() < 0.5 ? 1 : -1),
        yv: Math.random() * asteasteroid_speed * lvlMult / fps * (Math.random() < 0.5 ? 1 : -1),
        a: Math.random() * Math.PI * 2, // in radians
        r: r,
        additional_edges: [],
        edges: Math.floor(Math.random() * (asteasteroid_edges + 1) + asteasteroid_edges / 2)
    };

    // populate the additional_edgesets array
    for (let i = 0; i < asteroid.edges; i++) {
        asteroid.additional_edges.push(Math.random() * asteasteroid_more_edges * 2 + 1 - asteasteroid_more_edges);
    }

    return asteroid;
}

function newGame() {
    level = 0;
    lives = GAME_LIVES;
    ship = newShip();
    newLevel();
}

function newLevel() {
    text = "Level " + (level + 1);
    textAlpha = 1.0;
    generateAsteasteroidArray();
}

function newShip() {
    return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        angle: 90 / 180 * Math.PI, // conedges to radians
        r: SHIP_SIZE / 2,
        blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
        blinkTime: Math.ceil(SHIP_BLINK_DUR * fps),
        canShoot: true,
        dead: false,
        explodeTime: 0,
        lasers: [],
        rotation: 0,
        moving: false,
        move: {
            x: 0,
            y: 0
        }
    }
}

function shootLaser() {
    // create the laser object
    if (ship.canShoot && ship.lasers.length < LASER_MAX) {
        ship.lasers.push({ // from the nose of the ship
            x: ship.x + 4 / 3 * ship.r * Math.cos(ship.angle),
            y: ship.y - 4 / 3 * ship.r * Math.sin(ship.angle),
            xv: LASER_SPD * Math.cos(ship.angle) / fps,
            yv: -LASER_SPD * Math.sin(ship.angle) / fps,
            dist: 0,
            explodeTime: 0
        });
    }

    // prevent further shooting
    ship.canShoot = false;
}

function drawAsteroid(a, r, x, y, additional_edges, edges, color, i) {
    context.strokeStyle = "slategrey";
    context.lineWidth = SHIP_SIZE / 20;

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

    // show asteasteroid's collision circle
    if (SHOW_BOUNDING) {
        context.strokeStyle = "lime";
        context.beginPath();
        context.arc(x, y, r, 0, Math.PI * 2, false);
        context.stroke();
    }
    // let temp = Math.floor(Math.random() * colorArray.length)
    // color = colorArray[temp];
    context.fillStyle = 'black';
    context.fill();
}

function gameLogic() {
    let blinkOn = ship.blinkNum % 2 == 0;
    let exploding = ship.explodeTime > 0;

    // draw space
    make_base();

    // draw the asteroids
    let a, r, x, y, additional_edges, edges, color;
    // let colorArray = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', '#E6B333', '#3366E6', '#999966', '#99FF99',
    //     '#B34D4D', '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A',
    //     '#33FFCC', '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC', '#66664D', '#991AFF', '#E666FF', '#4DB3FF',
    //     '#1AB399', '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680', '#4D8066', '#809980', '#E6FF80', '#1AFF33',
    //     '#999933', '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3', '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6',
    //     '#6666FF'];

    for (let i = 0; i < asteroids.length; i++) {
        drawAsteroid(a, r, x, y, additional_edges, edges, color, i);
    }

    // thrust the ship
    if (ship.moving && !ship.dead) {
        ship.move.x += SHIP_THRUST * Math.cos(ship.angle) / fps;
        ship.move.y -= SHIP_THRUST * Math.sin(ship.angle) / fps;

        // draw the thruster
        if (!exploding && blinkOn) {
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
    }

    // draw the triangular ship
    if (!exploding) {
        if (blinkOn && !ship.dead) {
            drawShip(ship.x, ship.y, ship.angle);
        }

        // handle blinking
        if (ship.blinkNum > 0) {

            // reduce the blink time
            ship.blinkTime--;

            // reduce the blink num
            if (ship.blinkTime == 0) {
                ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * fps);
                ship.blinkNum--;
            }
        }
    } else {
        // draw the explosion (concentric circles of different colours)
        context.fillStyle = "darkred";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false);
        context.fill();
        context.fillStyle = "red";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false);
        context.fill();
        context.fillStyle = "orange";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false);
        context.fill();
        context.fillStyle = "yellow";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false);
        context.fill();
        context.fillStyle = "white";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false);
        context.fill();
    }

    // show ship's collision circle
    if (SHOW_BOUNDING) {
        context.strokeStyle = "lime";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
        context.stroke();
    }

    // show ship's centre dot
    if (SHOW_CENTRE_DOT) {
        context.fillStyle = "red";
        context.fillRect(ship.x - 1, ship.y - 1, 2, 2);
    }

    // draw the lasers
    for (let i = 0; i < ship.lasers.length; i++) {
        if (ship.lasers[i].explodeTime == 0) {
            context.fillStyle = "salmon";
            context.beginPath();
            context.arc(ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 15, 0, Math.PI * 2, false);
            context.fill();
        } else {
            // draw the eplosion
            context.fillStyle = "orangered";
            context.beginPath();
            context.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.75, 0, Math.PI * 2, false);
            context.fill();
            context.fillStyle = "salmon";
            context.beginPath();
            context.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.5, 0, Math.PI * 2, false);
            context.fill();
            context.fillStyle = "pink";
            context.beginPath();
            context.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.25, 0, Math.PI * 2, false);
            context.fill();
        }
    }

    // draw the game text
    if (textAlpha >= 0) {
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "rgba(255, 255, 255, " + textAlpha + ")";
        context.font = "small-caps " + TEXT_SIZE + "px dejavu sans mono";
        context.fillText(text, canvas.width / 2, canvas.height * 0.75);
        textAlpha -= (1.0 / TEXT_FADE_TIME / fps);
    } else if (ship.dead) {
        // after "game over" fades, start a new game
        newGame();
    }

    // draw the lives
    let lifeColour;
    for (let i = 0; i < lives; i++) {
        lifeColour = exploding && i == lives - 1 ? "red" : "white";
        drawShip(SHIP_SIZE + i * SHIP_SIZE * 1.2, SHIP_SIZE, 0.5 * Math.PI, lifeColour);
    }

    // detect laser hits on asteasteroids
    let ax, ay, ar, lx, ly;
    for (let i = asteroids.length - 1; i >= 0; i--) {

        // grab the asteasteroid properties
        ax = asteroids[i].x;
        ay = asteroids[i].y;
        ar = asteroids[i].r;

        // loop over the lasers
        for (let j = ship.lasers.length - 1; j >= 0; j--) {

            // grab the laser properties
            lx = ship.lasers[j].x;
            ly = ship.lasers[j].y;

            // detect hits
            if (ship.lasers[j].explodeTime == 0 && distBetweenShipAndAsteroids(ax, ay, lx, ly) < ar) {

                // destroy the asteasteroid and activate the laser explosion
                destroyAsteasteroid(i);
                ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * fps);
                break;
            }
        }
    }

    // check for asteasteroid collisions (when not exploding)
    if (!exploding) {

        // only check when not blinking
        if (ship.blinkNum == 0 && !ship.dead) {
            for (let i = 0; i < asteroids.length; i++) {
                if (distBetweenShipAndAsteroids(ship.x, ship.y, asteroids[i].x, asteroids[i].y) < ship.r + asteroids[i].r) {
                    explodeShip();
                    destroyAsteasteroid(i);
                    break;
                }
            }
        }

        // rotate the ship
        ship.angle += ship.rotation;

        // move the ship
        ship.x += ship.move.x;
        ship.y += ship.move.y;
    } else {
        // reduce the explode time
        ship.explodeTime--;

        // reset the ship after the explosion has finished
        if (ship.explodeTime == 0) {
            lives--;
            if (lives == 0) {
                gameOver();
            } else {
                ship = newShip();
            }
        }
    }

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

    // move the lasers
    for (let i = ship.lasers.length - 1; i >= 0; i--) {

        // check distance travelled
        if (ship.lasers[i].dist > LASER_DIST * canvas.width) {
            ship.lasers.splice(i, 1);
            continue;
        }

        // handle the explosion
        if (ship.lasers[i].explodeTime > 0) {
            ship.lasers[i].explodeTime--;

            // destroy the laser after the duration is up
            if (ship.lasers[i].explodeTime == 0) {
                ship.lasers.splice(i, 1);
                continue;
            }
        } else {
            // move the laser
            ship.lasers[i].x += ship.lasers[i].xv;
            ship.lasers[i].y += ship.lasers[i].yv;

            // calculate the distance travelled
            ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2));
        }

        // handle edge of screen
        if (ship.lasers[i].x < 0) {
            ship.lasers[i].x = canvas.width;
        } else if (ship.lasers[i].x > canvas.width) {
            ship.lasers[i].x = 0;
        }
        if (ship.lasers[i].y < 0) {
            ship.lasers[i].y = canvas.height;
        } else if (ship.lasers[i].y > canvas.height) {
            ship.lasers[i].y = 0;
        }
    }

    // move the asteasteroids
    for (let i = 0; i < asteroids.length; i++) {
        asteroids[i].x += asteroids[i].xv;
        asteroids[i].y += asteroids[i].yv;

        // handle asteasteroid edge of screen
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
}