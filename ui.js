const HP_COLOR = '#ff6060'

function drawUI() {
    ctx.translate(30, 35)
    drawHP();
    drawLoot();
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
    ctx.fillText('HP', fontSize/2.5, top + 5);
    ctx.fillStyle = 'black';
    ctx.fillRect(left - 2, top - 2, 204, 14);
    ctx.fillStyle = HP_COLOR;
    ctx.fillRect(left, top, (player.hp/100) * 200, 10);
}

function drawLoot() {
    const fontSize = w/50;
    let left = w - 100 - fontSize * 2;
    let top = 5;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = fontSize + 'px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('LOOT', left, top);
    ctx.fillStyle = 'gold';
    let lOffset = ctx.measureText('LOOT').width;
    ctx.fillText(player.loot, left + lOffset + fontSize/2, top);
}