const HP_COLOR = '#ff6060'

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
    let x = canvas.width/2, y = canvas.height - fontSize * 2;
    ctx.shadowBlur = 6;
    ctx.fillStyle = averageHexColors([substColors[CNCRT], substColors[GRND] ]);
    ctx.fillRect(x - fontSize * 12.5, y - fontSize * 1, fontSize * 25, fontSize * 3);
    ctx.shadowBlur = 0;

    ctx.translate(x, y);
    drawHP(fontSize);
    
    x -= fontSize * 5;
    ctx.translate(-fontSize * 5, 0);
    drawLoot(fontSize);
    
    x += fontSize * 10;
    ctx.translate(fontSize * 10, 0);

    drawHeldItem(fontSize);
    ctx.translate(-x, -y);
}

function drawHP (fontSize) {
    const barWidth = fontSize * 10;
    let left = 0, top = fontSize/2, hpRatio = player.hp/100;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = fontSize + 'px Arial';
    ctx.fillStyle = 'white';
    
    ctx.fillText('HP', 0, 0);
    
    ctx.fillStyle = 'black';
    ctx.fillRect(left - barWidth / 2 - 2, top - 2, barWidth + 4, fontSize/2 + 4);
    
    ctx.fillStyle = HP_COLOR;
    ctx.fillRect(left - hpRatio * barWidth / 2, top, hpRatio * barWidth, fontSize/2);
}

function drawLoot(fontSize) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = fontSize + 'px Arial';
    ctx.fillStyle = 'white';

    let lootWidth = ctx.measureText('LOOT').width;
    let numWidth = ctx.measureText(100).width;
    let left = -(lootWidth + numWidth + fontSize);
    let top = fontSize/2;
   
    ctx.fillText('LOOT', left, top);
    ctx.fillStyle = '#ffca00';
    
    ctx.fillText(player.loot, left + lootWidth + fontSize/2, top);
}

function drawHeldItem(fontSize) {
    let item = (player.items[player.held] ? player.items[player.held].constructor.name : 'No Item').toUpperCase();
    ctx.font = fontSize + 'px Arial';
    let boxSize = ctx.measureText('FIREBOMB').width + fontSize;
    let top = fontSize/2, left = boxSize/2 + top;

    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.fillText(item, left, top);
}