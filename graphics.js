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