function colorText(text, x, y, color, font, align, baseline) {
    if (font) ctx.font = font;
    if (align) ctx.textAlign = align;
    if (baseline) ctx.textBaseline = baseline;
    if (color) ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

function colorRect(x, y, w, h, color, center) {
    let xOffset = center ? -w/2 : 0,
        yOffset = center ? -h/2 : 0;

    if (color) ctx.fillStyle = color;
    ctx.fillRect(x + xOffset, y + yOffset, w, h);
}

function setShadow(color, blur, oX, oY) {
    if (color) ctx.shadowColor = color;
    if (blur) ctx.shadowBlur = blur; 
    if (oX) ctx.shadowOffsetX = oX;
    if (oY) ctx.shadowOffsetY = oY;
}

function resetShadow() {
    ctx.shadowColor = '';
    ctx.shadowBlur = 0; 
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function averageHexColors(colors) {
    if (colors.length == 1) return colors[0];
    let total = [0,0,0];
    for (let color of colors) {
        total[0] += parseInt(color.slice(1, 3), 16);
        total[1] += parseInt(color.slice(3, 5), 16);
        total[2] += parseInt(color.slice(5, 7), 16);
    }

    if (total[0]) total[0] = clamp(Math.floor(total[0] / colors.length), 0, 255);
    if (total[1]) total[1] = clamp(Math.floor(total[1] / colors.length), 0, 255);
    if (total[2]) total[2] = clamp(Math.floor(total[2] / colors.length), 0, 255);

    let string = '#';
    for (let num of total) {
        if (num < 16) string += '0';
        string += num.toString(16);
    }
    return string;
}

function hexColorToInts(color) {
    let subst = [color.slice(1, 3), color.slice(3, 5), color.slice(5, 7)];

    return [parseInt(subst[0], 16), parseInt(subst[1], 16), parseInt(subst[2], 16)];
}

function addHexColors(color1, color2) {
    let subst1 = [color1.slice(1, 3), color1.slice(3, 5), color1.slice(5, 7)]
    let subst2 = [color2.slice(1, 3), color2.slice(3, 5), color2.slice(5, 7)]
    let sums = [];

    for (let c = 0; c < subst1.length; c++) {
        let sum = parseInt(subst1[c], 16) + parseInt(subst2[c], 16);
        sum = clamp(sum, 0, 255);
        sums.push(sum);
    }

    return ('#' + sums[0].toString(16) + sums[1].toString(16) + sums[2].toString(16));
}

function screenTransition(fromDraw, toDraw, callback) {
    const timeLimit = 30;
    if (screenTransition.timer == undefined) screenTransition.timer = 0;
    if (screenTransition.direction == undefined) screenTransition.direction = 1;
    
    if (screenTransition.direction > 0) {
        if (screenTransition.timer < timeLimit) {
            screenTransition.timer += screenTransition.direction;
            fromDraw();
            ctx.globalAlpha = screenTransition.timer / timeLimit;
            colorRect(0,0,w,h,'black');
            ctx.globalAlpha = 1;
        } else screenTransition.direction = -1;
    } else if (screenTransition.direction < 1) {
        if (screenTransition.timer > 0) {
            screenTransition.timer += screenTransition.direction;
            toDraw();
            ctx.globalAlpha = screenTransition.timer / timeLimit;
            colorRect(0,0,w,h,'black');
            ctx.globalAlpha = 1;
        }
        else {
            screenTransition.timer = 0;
            screenTransition.direction = 1;
            callback();
            return true;
        }
    }
    return false;
}