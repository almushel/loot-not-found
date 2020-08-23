const HP_COLOR = '#ff6060'

function drawUI() {
    ctx.translate(30, 35)
    drawHP();
    ctx.translate(-30, -35);
}

function drawHP () {
    const fontSize = w/50;
    let left = fontSize * 2;
    let top = 0;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = fontSize + 'px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('HP', 0, 5);
    ctx.fillStyle = 'black';
    ctx.fillRect(left - 2, top - 2, 204, 14);
    ctx.fillStyle = HP_COLOR;
    ctx.fillRect(left, top, (player.hp/100) * 200, 10);
}