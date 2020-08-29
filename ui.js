const HP_COLOR = '#ff6060'

function drawUI() {
    const offset = w/25;
    ctx.translate(offset, offset)
    drawHP();
    ctx.translate(-offset*2, 0);
    drawLoot();
    ctx.translate(offset, -offset);

    ctx.translate(canvas.width - offset * 2, canvas.height - offset * 2)
    drawHeldItem();
    ctx.translate(-canvas.width + offset * 2, -canvas.height + offset * 2)
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

function drawHeldItem() {
    const fontSize = w/50;
    let item = player.items[player.held] ? player.items[player.held].constructor.name : 'No Item';
    ctx.font = fontSize + 'px Arial';
    let boxSize = ctx.measureText('FireBomb').width + fontSize;
    ctx.fillStyle = player.color;
    ctx.strokeStyle = 'white';
    ctx.rect(-boxSize/2, -boxSize/4, boxSize, boxSize/2);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.fillText(item, 0, 0);
}