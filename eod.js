const delColor = "rgb(34, 51, 55)";
const title = "ECHOES OF THE DEEP";

const fieldMaxCols = 8;
const fieldMaxRows = 8;

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

field[4][4] = Treasure;

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

let clickedCell = {row: -1, col: -1};
let pad = 32;
let fieldPos = {x: pad, y: pad + titleHeight + 20};

let fieldWidth = canvas.width - pad * 2;
let cellSize = fieldWidth / fieldMaxCols;
let actualWidth = cellSize * fieldMaxCols;
let actualHeight = cellSize * fieldMaxRows;

window.addEventListener("click", function (e) {
    let col = Math.floor((e.clientX - fieldPos.x) / cellSize);
    let row = Math.floor((e.clientY - fieldPos.y) / cellSize);

    if (col >= 0 && row >= 0 && col < fieldMaxCols && row < fieldMaxRows) {
        clickedCell.row = row;
        clickedCell.col = col;
    }

    console.log(clickedCell);
});

function distance(cell1, cell2) {
    return Math.max(Math.abs(cell1.col - cell2.col), Math.abs(cell1.row - cell2.row));
}

requestAnimationFrame(function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
        ctx.lineTo(actualWidth, r * cellSize);
    }

    for (let c = 0; c < fieldMaxCols + 1; c++) {
        ctx.moveTo(c * cellSize, 0);
        ctx.lineTo(c * cellSize, actualHeight);
    }

    ctx.stroke();

    if (clickedCell.row >= 0 && clickedCell.col >= 0) {
        ctx.font = "32px Share Tech Mono, monospace";

        let minDistance = Math.max(fieldMaxRows, fieldMaxCols);
        for (let r = 0; r < fieldMaxRows; r++) {
            for (let c = 0; c < fieldMaxCols; c++) {
                if (field[r][c] === Treasure) {
                    let dist = distance(clickedCell, {row: r, col: c});
                    if (dist < minDistance) minDistance = dist;
                }
            }
        }

        let numDim = numDims[minDistance];
        let x = clickedCell.col  * cellSize + cellSize/2 - numDim.width/2;
        let y = clickedCell.row * cellSize + numDim.actualBoundingBoxAscent + cellSize/2 - (numDim.actualBoundingBoxDescent - numDim.actualBoundingBoxAscent)/2;
        ctx.fillText(minDistance.toString(10), x, y);
    }

    for (let r = 0; r < fieldMaxRows; r++) {
        for (let c = 0; c < fieldMaxCols; c++) {
            if (field[r][c] === Treasure) {
                ctx.save();
                ctx.fillStyle = "red";
                ctx.fillRect(c * cellSize, r  * cellSize, cellSize, cellSize);
                ctx.restore();
            }
        }
    }

    ctx.restore();

    requestAnimationFrame(update);
});
