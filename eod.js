'use strict';

const delColor = "rgb(34, 51, 55)";
const locatorColor = "rgb(89,114,121)";
const bgColor = "rgb(21, 24, 27)";
const title = "СОКРОВИЩА ГЛУБИН";
const loseText = "Увы, проиграла 😓";
const winText = "Выиграла 😃";
const menuStartText = "ИГРАТЬ ▶";

const Nothing = -3;
const Treasure = -2;
const RevealedTreasure = -1;

const MAX_TREASURES = 5;
const MAX_PINGS = 12;
const longPressMs = 500;

const START_LOCATOR_RAD = 10;
const NEW_LOCATOR_DIFF = 20;
const MAX_CIRCLES = 5;

let startButton = {};
let againButton = {};
let toggleButton = {};

const fieldMaxCols = 8;
const fieldMaxRows = 8;

let gameStarted = false;
let gameOver = false;
let numTreasures;
let pingsCount;
let field;
let hints;

let globalPos = {x: 0, y: 0};

let putHint;

let logoImage = new Image();
logoImage.src = "assets/logo.png";

let treasureImage = new Image();
treasureImage.src = "assets/sprites/treasure_64x64.png";

let markImage = new Image();
markImage.src = "assets/sprites/mark.png";

let menuBgImage = new Image();
menuBgImage.src = "assets/bg.jpg";

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

const pad = 32;
let fieldPos = {x: pad, y: pad + titleHeight + 20};

let fieldWidth;
let cellSize;
let fieldActualWidth;
let fieldActualHeight;

let bgImage;
let bgSaved;

let locatorAnims = [];

function init() {
    gameStarted = false;
    gameOver = false;
    putHint = true;

    globalPos = {x: 0, y: 0};

    numTreasures = MAX_TREASURES;
    pingsCount = MAX_PINGS;

    hints = [];
    for (let r = 0; r < fieldMaxRows; r++) {
        hints[r] = [];
        for (let c = 0; c < fieldMaxCols; c++) {
            hints[r][c] = false;
        }
    }

    field = [];
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

    bgImage = new Image();
    bgSaved = false;
    bgImage.onload = () => {
        bgSaved = true;
    }

    locatorAnims = [];

    fieldPos = {x: pad, y: pad + titleHeight + 20};

    fieldWidth = canvas.width - pad * 2;
    cellSize = fieldWidth / fieldMaxCols;
    fieldActualWidth = cellSize * fieldMaxCols;
    fieldActualHeight = cellSize * fieldMaxRows;
}

let pressTime;
let cellPressed = false;
let pressedCell = {row: -1, col: -1};
let pressTimer;

window.addEventListener("contextmenu", function(e) { e.preventDefault(); })

window.addEventListener("touchstart", function (e) {
    let touch = e.touches[0] || e.changedTouches[0];
    let touchX = touch.clientX;
    let touchY = touch.clientY;

    if (gameOver) {
        if (touchX >= againButton.x && touchX <= againButton.x + againButton.width &&
            touchY >= againButton.y && touchY <= againButton.y + againButton.height) {

            init();
            gameStarted = true;
        }

        return;
    }

    if (!gameStarted) {
        if (touchX >= startButton.x && touchX <= startButton.x + startButton.width &&
            touchY >= startButton.y && touchY <= startButton.y + startButton.height) {

            gameStarted = true;
        }

        return;
    }

    let col = Math.floor((touchX - fieldPos.x) / cellSize);
    let row = Math.floor((touchY - fieldPos.y) / cellSize);

    if (col >= 0 && row >= 0 && col < fieldMaxCols && row < fieldMaxRows) {
        cellPressed = true;
        pressedCell.col = col;
        pressedCell.row = row;
        pressTime = performance.now();
        clearTimeout(pressTimer);
        pressTimer = setTimeout(() => {
            hints[row][col] = putHint;
        }, longPressMs);
    } else {
        if (touchX >= toggleButton.x && touchX <= toggleButton.x + toggleButton.width &&
            touchY >= toggleButton.y && touchY <= toggleButton.y + toggleButton.height) {

            putHint = !putHint;
        }
    }
});

window.addEventListener("touchmove", function (e) {
    let elapsedTime = performance.now() - pressTime;
    if (cellPressed && elapsedTime > longPressMs) {
        let touch = e.touches[0] || e.changedTouches[0];
        let touchX = touch.clientX;
        let touchY = touch.clientY;

        let col = Math.floor((touchX - fieldPos.x) / cellSize);
        let row = Math.floor((touchY - fieldPos.y) / cellSize);

        if (col >= 0 && row >= 0 && col < fieldMaxCols && row < fieldMaxRows) {
            hints[row][col] = putHint;
        }
    }
});

window.addEventListener("touchend", function (e) {
    let touch = e.touches[0] || e.changedTouches[0];
    let touchX = touch.clientX;
    let touchY = touch.clientY;

    let elapsedTime = performance.now() - pressTime;
    if (elapsedTime < longPressMs) {
        let col = Math.floor((touchX - fieldPos.x) / cellSize);
        let row = Math.floor((touchY - fieldPos.y) / cellSize);

        if (cellPressed && pressedCell.col === col && pressedCell.row === row) {
            clearInterval(pressTimer);
            let content = field[row][col];
            if (content === Nothing) {
                let minDistance = computeMinDistance(row, col);
                pingsCount--;
                field[row][col] = minDistance;
                startLocatorAnim(col * cellSize + cellSize/2, row * cellSize + cellSize/2, minDistance * cellSize + cellSize/2);

                if (pingsCount <= 0) {
                    gameOver = true;
                }
            } else if (content === Treasure) {
                field[row][col] = RevealedTreasure;
                numTreasures--;
                gameOver = (numTreasures === 0);
            }

            cellPressed = false;
        }
    }
});

function translate(dx, dy) {
    globalPos.x += dx;
    globalPos.y += dy;

    ctx.translate(dx, dy);
}

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

function drawButton(buttonText, width, height, textStyle, borderStyle) {
    ctx.save();

    ctx.shadowColor = 'rgba(255,255,255,0.7)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.strokeStyle = borderStyle;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 25);
    ctx.stroke();

    ctx.font = "48px Share Tech Mono, monospace";
    ctx.textBaseline = "top";
    ctx.fillStyle = textStyle;

    let meas = ctx.measureText(buttonText);
    ctx.fillText(buttonText, width/2 - meas.width/2, height/2 - (meas.actualBoundingBoxDescent-meas.actualBoundingBoxAscent)/2);

    ctx.restore();
}

function textDim(text) {
    let meas = ctx.measureText(text);
    return {width: meas.width, height: meas.actualBoundingBoxDescent - meas.actualBoundingBoxAscent};
}

function applyShadow() {
    ctx.shadowColor = 'rgba(255,255,255,0.7)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
}

function startLocatorAnim(x, y, maxRad) {
    locatorAnims.push({x: x, y: y, maxRad: maxRad, rads: [START_LOCATOR_RAD], diff: 0});
}

function drawCircle(x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
}

function fillMultiText(text, lineHeight) {
    let maxWidth = canvas.width - pad*2;

    let start = 0;
    let end = 0;
    let i = 0;
    for (let c of text) {
        if (/\s/.test(c)) {
            let chunk = safeSlice(text, start, i);
            if (ctx.measureText(chunk).width < maxWidth) {
                end = i;
            } else {
                let t = safeSlice(text, start, end)
                ctx.fillText(t, 0, 0);
                let meas = ctx.measureText(t);
                translate(0, Math.max(lineHeight, meas.actualBoundingBoxDescent - meas.actualBoundingBoxAscent));
                start = end + 1;
            }
        }

        i++;
    }

    ctx.fillText(safeSlice(text, start), 0, 0);

    function safeSlice(str, start, end) {
        return Array.from(str).slice(start, end).join('');
    }
}

init();

requestAnimationFrame(function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameStarted) { // Main menu
        ctx.save();
        ctx.filter = "invert(55%) contrast(100%) hue-rotate(45deg) sepia(30%)";
        ctx.drawImage(menuBgImage, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // ctx.save()
        ctx.save()

        translate(pad, pad * 2);


        applyShadow();

        ctx.fillStyle = "rgb(108, 51, 145)"
        ctx.font = "32px Share Tech Mono, monospace";
        ctx.textBaseline = "top";
        let firstPart = "С Днем Рождения 🎁";
        ctx.fillText(firstPart, 0, 0)
        translate(0, textDim(firstPart).height + pad);

        let secondPart = "Моя Любимая ❤️"
        ctx.fillText(secondPart, 0, 0)
        translate(0, textDim(secondPart).height + pad);
        ctx.fillText("Валька!!! 🥳", 0, 0);

        startButton.width = canvas.width - pad*2;
        startButton.height = 80;
        translate(0, pad*4);
        startButton.x = globalPos.x;
        startButton.y = globalPos.y;

        drawButton(menuStartText, startButton.width, startButton.height, bgColor, bgColor);

        translate(0, startButton.height + pad);
        let ratio = 1.37
        let imageW = canvas.width - pad*2;
        let imageH = imageW / ratio;

        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(imageW/2, imageH/2, 120, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(logoImage, 0, 0, imageW, imageH);

        ctx.restore();

        globalPos = {x: 0, y: 0};
        requestAnimationFrame(update);
        return;
    }

    if (gameOver) {
        if (!bgSaved) {
            ctx.filter = "blur(4px)";
        } else {
            ctx.filter = "none"
            ctx.save();
            ctx.drawImage(bgImage, 0, 0);

            ctx.shadowColor = 'rgba(255,255,255,0.7)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillStyle = "rgb(191,69,69)";
            ctx.font = "32px Share Tech Mono, monospace";
            ctx.textBaseline = "top";

            let text = loseText;
            if (numTreasures === 0) {
                text = winText;
            }

            let loseTextMeas = ctx.measureText(text)
            let textHeight = loseTextMeas.actualBoundingBoxDescent - loseTextMeas.actualBoundingBoxAscent;
            let textX = canvas.width/2 - loseTextMeas.width/2;
            let textY = canvas.height/2 - textHeight;
            ctx.fillText(text, textX, textY);

            ctx.save();
            againButton.x = pad;
            againButton.y = canvas.height / 2 + pad;
            againButton.width = canvas.width - pad*2;
            againButton.height = 80;
            translate(pad, canvas.height / 2 + pad);
            drawButton("Заново ↻", againButton.width, againButton.height, "white", "white");
            ctx.restore()

            ctx.restore()
            globalPos = {x: 0, y: 0};

            requestAnimationFrame(update);

            return;
        }
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";

    ctx.save();

    translate(pad, pad);
    ctx.font = "20px Share Tech Mono, monospace";
    ctx.textBaseline = "top";

    ctx.fillText(title, 0, 0);
    translate(0, titleHeight + 20);

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

            let rendered = false;

            switch (content) {
                case Nothing: {
                    // Render nothing
                } break;
                case Treasure: {
                    // ctx.save();
                    // ctx.fillStyle = "red";
                    // ctx.fillRect(c * cellSize + 10, r  * cellSize + 10, 4, 4);
                    // ctx.restore();
                } break;
                case RevealedTreasure: {
                    let w = cellSize/1.5;
                    let h = cellSize/1.5;
                    let x = c  * cellSize + cellSize/2 - w / 2;
                    let y = r * cellSize + cellSize/2 - w / 2;

                    ctx.drawImage(treasureImage, x, y, w, h);
                    rendered = true;
                } break;
                default: {
                    let dist = content;
                    let numDim = numDims[dist];
                    let x = c  * cellSize + cellSize/2 - numDim.width/2;
                    let y = r * cellSize + numDim.actualBoundingBoxAscent + cellSize/2 - (numDim.actualBoundingBoxDescent - numDim.actualBoundingBoxAscent)/2;
                    ctx.font = "32px Share Tech Mono, monospace";
                    ctx.fillText(dist.toString(10), x, y);
                    rendered = true;
                } break;
            }

            if (!rendered && hints[r][c]) {
                let w = cellSize/1.5;
                let h = cellSize/1.5;
                let x = c  * cellSize + cellSize/2 - w / 2;
                let y = r * cellSize + cellSize/2 - w / 2;

                ctx.drawImage(markImage, x, y, w, h);
            }
        }
    }

    ctx.save();

    locatorAnims = locatorAnims.filter((anim) => {
        return anim.rads.some(r => r < anim.maxRad)
    });
    let inc = 1;

    ctx.strokeStyle = locatorColor;
    for (let anim of locatorAnims) {
        for (let i = 0; i < anim.rads.length; i++) {
            drawCircle(anim.x, anim.y, anim.rads[i]);
            anim.rads[i] += inc;

            if (anim.rads[i] >= anim.maxRad) {
                anim.rads[i] = anim.maxRad;
            }
        }

        anim.diff += inc;

        if (anim.diff >= NEW_LOCATOR_DIFF) {
            if (anim.rads.length < MAX_CIRCLES) {
                anim.rads.push(START_LOCATOR_RAD);
            }

            anim.diff = 0;
        }
    }

    ctx.restore();

    translate(0, fieldActualHeight);
    translate(0, 24);

    const gradient = ctx.createLinearGradient(0, 0, fieldActualWidth, 0);

    gradient.addColorStop(0, "#242a2e");
    gradient.addColorStop(0.5, "#2c717d");
    gradient.addColorStop(1, "#24272c");

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, fieldActualWidth, 2);
    ctx.restore();

    translate(0, 16);

    ctx.save();
    ctx.font = "16px Share Tech Mono, monospace";
    ctx.fillStyle = "#c9c7c7";
    ctx.fillText(`ОСТАЛОСЬ ЖМАКАНИЙ: ${pingsCount}`, 0, 0);
    ctx.restore();

    ctx.save();

    toggleButton.width = toggleButton.height = 64;

    ctx.strokeStyle = "white";
    translate(canvas.width - pad*2 - toggleButton.width, 0);
    toggleButton.x = globalPos.x;
    toggleButton.y = globalPos.y;
    ctx.fillStyle = putHint ? "rgb(130,195,115)" : "rgb(221,106,114)";
    ctx.beginPath();
    ctx.fillRect(0, 0, toggleButton.width, toggleButton.height);
    ctx.stroke();
    ctx.drawImage(markImage, 0, 0, toggleButton.width, toggleButton.height);

    translate(pad*2 + toggleButton.width - canvas.width, toggleButton.height + pad/2);
    ctx.textBaseline = "top";
    ctx.font = "14px Share Tech Mono, monospace";
    ctx.fillStyle = "#2c717d";
    fillMultiText("💡 Найди все спрятанные сокровища. " +
        "Цифры обозначают расстояние до ближайшего сокровища. " +
        "Нажми на клетку и держи чтобы поставить ✓, в тех местах где ты думаешь сокровищ точно нет.", 30);

    ctx.restore();
    ctx.restore();

    if (gameOver && !bgSaved) {
        ctx.save()
        bgImage.src = canvas.toDataURL("image/png");
        ctx.restore();
    }

    globalPos = {x: 0, y: 0};

    requestAnimationFrame(update);
});
