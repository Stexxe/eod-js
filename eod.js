'use strict';

const delColor = "rgb(34, 51, 55)";
const title = "СОКРОВИЩА ГЛУБИН";
const loseText = "Ты проиграла 😓";

const fieldMaxCols = 8;
const fieldMaxRows = 8;

let gameOver = false;
let numTreasures = 3;
let maxPings = 3;

const Nothing = -3;
const Treasure = -2;
const RevealedTreasure = -1;

let field = [];
for (let r = 0; r < fieldMaxRows; r++) {
    field[r] = [];
    for (let c = 0; c < fieldMaxCols; c++) {
        field[r][c] = Nothing;
    }
}

for (let i = numTreasures; i > 0; ) {
    let row = random(0, fieldMaxRows);
    let col = random(0, fieldMaxCols);
    if (field[row][col] === Nothing && computeMinDistance(row, col) > 1) {
        field[row][col] = Treasure;
        i--;
    }
}

// TODO: Loading or menu
let treasureImage = new Image();
treasureImage.src = "assets/sprites/treasure_64x64.png";

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

ctx.font = "20px Share Tech Mono, monospace";
ctx.textBaseline = "top";
let titleHeight = ctx.measureText(title).fontBoundingBoxDescent;

ctx.font = "32px Share Tech Mono, monospace";

let numDims = [];
for (let i = 0; i < 10; i++) {
    numDims[i] = ctx.measureText(i.toString());
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let pad = 32;
let fieldPos = {x: pad, y: pad + titleHeight + 20};

let fieldWidth = canvas.width - pad * 2;
let cellSize = fieldWidth / fieldMaxCols;
let fieldActualWidth = cellSize * fieldMaxCols;
let fieldActualHeight = cellSize * fieldMaxRows;

let bgImage = new Image();
let bgSaved = false;
bgImage.onload = () => {
    bgSaved = true;
}

window.addEventListener("click", function (e) {
    if (gameOver) return;
    let col = Math.floor((e.clientX - fieldPos.x) / cellSize);
    let row = Math.floor((e.clientY - fieldPos.y) / cellSize);

    if (col >= 0 && row >= 0 && col < fieldMaxCols && row < fieldMaxRows && numTreasures > 0) {
        let content = field[row][col];
        if (content === Nothing) {
            let minDistance = computeMinDistance(row, col);
            maxPings--;
            field[row][col] = minDistance;

            if (maxPings <= 0) {
                gameOver = true;
            }
        } else if (content === Treasure) {
            field[row][col] = RevealedTreasure;
            numTreasures--;
        }
    }
});

function random(from, to) {
    return Math.floor(Math.random() * (to - from) + from);
}

function computeMinDistance(row, col) {
    let minDistance = Math.max(fieldMaxRows, fieldMaxCols);
    for (let r = 0; r < fieldMaxRows; r++) {
        for (let c = 0; c < fieldMaxCols; c++) {
            if (field[r][c] === Treasure) {
                let dist = distance({row, col}, {row: r, col: c});
                if (dist < minDistance) minDistance = dist;
            }
        }
    }
    return minDistance;
}

function distance(cell1, cell2) {
    return Math.max(Math.abs(cell1.col - cell2.col), Math.abs(cell1.row - cell2.row));
}

requestAnimationFrame(function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameOver) {
        if (!bgSaved) {
            ctx.filter = "blur(4px)";
        } else {
            ctx.filter = "none"
            ctx.drawImage(bgImage, 0, 0);

            ctx.fillStyle = "red";
            ctx.font = "32px Share Tech Mono, monospace";
            ctx.textBaseline = "top";
            ctx.fillText("Ты проиграла 😓", 0, 0);

            requestAnimationFrame(update);

            return;
        }
    }

    ctx.fillStyle = "rgb(21, 24, 27)"
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";

    ctx.save();

    ctx.translate(pad, pad);
    ctx.font = "20px Share Tech Mono, monospace";
    ctx.textBaseline = "top";

    ctx.fillText(title, 0, 0);
    ctx.translate(0, titleHeight + 20);

    ctx.strokeStyle = delColor;
    ctx.beginPath();

    for (let r = 0; r < fieldMaxRows + 1; r++) {
        ctx.moveTo(0, r * cellSize);
        ctx.lineTo(fieldActualWidth, r * cellSize);
    }

    for (let c = 0; c < fieldMaxCols + 1; c++) {
        ctx.moveTo(c * cellSize, 0);
        ctx.lineTo(c * cellSize, fieldActualHeight);
    }

    ctx.stroke();

    for (let r = 0; r < fieldMaxRows; r++) {
        for (let c = 0; c < fieldMaxCols; c++) {
            let content = field[r][c];

            switch (content) {
                case Nothing: {
                    // Render nothing
                } break;
                case Treasure: {
                    // TODO: Hide after
                    ctx.save();
                    ctx.fillStyle = "red";
                    ctx.fillRect(c * cellSize + 10, r  * cellSize + 10, 4, 4);
                    ctx.restore();
                } break;
                case RevealedTreasure: {
                    let w = cellSize/1.5;
                    let h = cellSize/1.5;
                    let x = c  * cellSize + cellSize/2 - w / 2;
                    let y = r * cellSize + cellSize/2 - w / 2;

                    ctx.drawImage(treasureImage, x, y, w, h);
                } break;
                default: {
                    let dist = content;
                    let numDim = numDims[dist];
                    let x = c  * cellSize + cellSize/2 - numDim.width/2;
                    let y = r * cellSize + numDim.actualBoundingBoxAscent + cellSize/2 - (numDim.actualBoundingBoxDescent - numDim.actualBoundingBoxAscent)/2;
                    ctx.font = "32px Share Tech Mono, monospace";
                    ctx.fillText(dist.toString(10), x, y);
                } break;
            }
        }
    }

    ctx.translate(0, fieldActualHeight);
    ctx.translate(0, 24);

    const gradient = ctx.createLinearGradient(0, 0, fieldActualWidth, 0);

    gradient.addColorStop(0, "#242a2e");
    gradient.addColorStop(0.5, "#2c717d");
    gradient.addColorStop(1, "#24272c");

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, fieldActualWidth, 2);
    ctx.restore();

    ctx.translate(0, 16);

    ctx.save();
    ctx.font = "16px Share Tech Mono, monospace";
    ctx.fillStyle = "#c9c7c7";
    ctx.fillText(`ОСТАЛОСЬ ЖМАКАНИЙ: ${maxPings}`, 0, 0);
    ctx.restore();

    ctx.restore();

    if (gameOver && !bgSaved) {
        ctx.save()
        bgImage.src = canvas.toDataURL("image/png");
        ctx.restore();
    }

    requestAnimationFrame(update);
});
