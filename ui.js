const HP_COLOR = '#ff6060'

function drawUI() {
    const offset = w/25;
    ctx.translate(offset, offset)
    drawHP();
    ctx.translate(-offset*2, 0);
    drawLoot();
    ctx.translate(offset, -offset);
}

function drawHP () {
    const fontSize = w/50, barWidth = w / 5;
    let left = fontSize * 2, top = 0;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = fontSize + 'px Arial';
    ctx.fillStyle = 'white';
    
    ctx.fillText('HP', fontSize/2.5, top + 5);
    
    ctx.fillStyle = 'black';
    ctx.fillRect(left - 2, top - fontSize/4 - 2, barWidth + 4, fontSize/2 + 4);
    
    ctx.fillStyle = HP_COLOR;
    ctx.fillRect(left, top - fontSize/4, (player.hp/100) * barWidth, fontSize/2);
}

function drawLoot() {
    const fontSize = w/50;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = fontSize + 'px Arial';
    ctx.fillStyle = 'white';

    let lootWidth = ctx.measureText('LOOT').width;
    let numWidth = ctx.measureText(100).width;
    let left = w - (lootWidth + numWidth + fontSize);
    let top = 5;
   
    ctx.fillText('LOOT', left, top);
    ctx.fillStyle = 'gold';
    
    ctx.fillText(player.loot, left + lootWidth + fontSize/2, top);
}