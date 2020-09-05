const HP_COLOR = '#ff6060'

function drawMainMenu() {
    //ctx.fillStyle = 
    let tHeight = canvas.height/4 * (canvas.width/canvas.height/2);
    tHeight = clamp(tHeight, 0, canvas.width / 1.5);
    ctx.textAlign = 'center';
    ctx.font = tHeight + 'px Arial';
    ctx.fillStyle = substColors[GOLD];
    ctx.fillText('Loot Not Found', canvas.width/2, canvas.height/2, canvas.width);
    ctx.font = tHeight/2 + 'px Arial';
    let yOffset = (tHeight * 1.25)/2;
    let x = canvas.width/2, y = canvas.height/2 + yOffset;
    let xOffset = -ctx.measureText('Press [Interact] to start').width/3;
    
    ctx.fillStyle = substColors[METAL];
    ctx.fillText('Press ', x + xOffset, y, canvas.width);
    xOffset += ctx.measureText('Press ').width/2 + ctx.measureText('[Interact] ').width/2;
    ctx.fillStyle = substColors[FIRE];
    ctx.fillText('[Interact] ', x + xOffset, y, canvas.width);
    xOffset += ctx.measureText('[Interact] ').width/2 + ctx.measureText('to start').width/2;
    ctx.fillStyle = substColors[METAL];
    ctx.fillText('to start', x + xOffset, y, canvas.width);
}

function drawUI() {
    if (controls.items) drawItemMenu();
    drawHUD();
}


function drawItemMenu() {
    const itemBoxSize = TILE_SIZE * 2;
    let bx = player.x - panX - itemBoxSize/2, by = player.y - panY - itemBoxSize/2;
    let index = 0;
    for (let y = -1; y < 2; y++) {
        for (let x = -1; x < 2; x++) {
            if ( (Math.abs(y) == 1 && Math.abs(x) == 0) || Math.abs(x) == 1 && Math.abs(y) == 0) {
                ctx.fillStyle = player.held == index ? 'dimgrey' : 'black';

                ctx.fillRect(bx + itemBoxSize * x, by + itemBoxSize * y, itemBoxSize, itemBoxSize);
                if (player.items[index]) 
                    player.items[index].draw(bx + (itemBoxSize * x) + (itemBoxSize/2), by + (itemBoxSize * y) + (itemBoxSize/2));
                index++;
            }
        }
    }
}

function drawHUD() {
    const fontSize = w/50;
    let x = Math.floor(canvas.width/2), y = canvas.height - Math.floor(fontSize * 2);
    ctx.shadowBlur = 6;
    ctx.fillStyle = averageHexColors([substColors[CNCRT], substColors[GRND] ]);
    ctx.fillRect(x - fontSize * 12.5, y - fontSize * 1, fontSize * 25, fontSize * 3);
    ctx.shadowBlur = 0;

    drawHP(x, y, fontSize);
    drawLoot(x - fontSize * 5, y, fontSize);
    drawHeldItem(x + fontSize * 5, y, fontSize);
}

function drawHP (x, y, fontSize) {
    const barWidth = fontSize * 10;
    let left = x, top = y + fontSize/2, hpRatio = player.hp/100;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = fontSize + 'px Arial';
    ctx.fillStyle = 'white';
    
    ctx.fillText('HP', x, y);
    
    ctx.fillStyle = 'black';
    ctx.fillRect(left - barWidth / 2 - 2, top - 2, barWidth + 4, fontSize/2 + 4);
    
    ctx.fillStyle = HP_COLOR;
    ctx.fillRect(left - hpRatio * barWidth / 2, top, hpRatio * barWidth, fontSize/2);
}

function drawLoot(x, y, fontSize) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = fontSize + 'px Arial';
    ctx.fillStyle = 'white';

    let lootWidth = ctx.measureText('LOOT').width;
    let numWidth = ctx.measureText(100).width;
    let left = x - (lootWidth + numWidth + fontSize);
    let top = y + fontSize/2;
   
    ctx.fillText('LOOT', left, top);
    ctx.fillStyle = '#ffca00';
    
    ctx.fillText(player.loot, left + lootWidth + fontSize/2, top);
}

function drawHeldItem(x, y, fontSize) {
    let item = (player.items[player.held] ? player.items[player.held].constructor.name : 'No Item').toUpperCase();
    
    ctx.font = fontSize + 'px Arial';
    let boxSize = ctx.measureText('FIREBOMB').width + fontSize;
    let top = y + fontSize/2, left = x + boxSize/2 + fontSize/2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(item, left, top);
}