const HP_COLOR = '#ff6060'

function drawMainMenu() {
    let tHeight = canvas.height/4 * (canvas.width/canvas.height/2);
    tHeight = clamp(tHeight, 0, canvas.width / 1.5);
    colorText('Loot Not Found', canvas.width/2, canvas.height/2, substColors[GOLD], 
                tHeight + 'px Arial', 'center', 'middle');

    ctx.font = tHeight/2 + 'px Arial';
    let yOffset = (tHeight * 1.25)/2;
    let x = canvas.width/2, y = canvas.height/2 + yOffset;
    let xOffset = -ctx.measureText('Press [Interact] to start').width/3;
    
    colorText('Press ', x + xOffset, y, substColors[METAL]);
    xOffset += ctx.measureText('Press ').width/2 + ctx.measureText('[Interact] ').width/2;
    colorText('[Interact] ', x + xOffset, y, substColors[FIRE]);
    xOffset += ctx.measureText('[Interact] ').width/2 + ctx.measureText('to start').width/2;
    colorText('to start', x + xOffset, y, substColors[METAL]);
}

function drawUI() {
    if (controls.items) drawItemMenu();
    drawHUD();
}


function drawItemMenu() {
    const itemBoxSize = TILE_SIZE * 2;
    let bx = player.x - panX - itemBoxSize/2, by = player.y - panY - itemBoxSize/2;
	let index = 0;
	
	if (player.held >= 0 && player.items[player.held]) {
		colorText('Press [Interact] to drop selected item', player.x - panX, by - itemBoxSize - 16, 'white', '16px Arial', 'center');
	}

    for (let y = -1; y < 2; y++) {
        for (let x = -1; x < 2; x++) {
            if ( (Math.abs(y) == 1 && Math.abs(x) == 0) || Math.abs(x) == 1 && Math.abs(y) == 0) {
                colorRect(bx + itemBoxSize * x, by + itemBoxSize * y, itemBoxSize, itemBoxSize, (player.held == index ? 'dimgrey' : 'black'));
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
    colorRect(x, y + fontSize/2, fontSize * 25, fontSize * 3, averageHexColors([substColors[CNCRT], substColors[GRND]]), true);
    ctx.shadowBlur = 0;

    drawHP(x, y, fontSize);
    drawLoot(x - fontSize * 5, y, fontSize);
    drawHeldItem(x + fontSize * 5, y, fontSize);
}

function drawHP (x, y, fontSize) {
    const barWidth = fontSize * 10;
    let left = x, top = y + fontSize/2, hpRatio = player.hp/100;
    
    colorText('HP', x, y, 'white', fontSize + 'px Arial', 'center', 'middle');
    colorRect(left - barWidth / 2 - 2, top - 2, barWidth + 4, fontSize/2 + 4, 'black');
    colorRect(left - hpRatio * barWidth / 2, top, hpRatio * barWidth, fontSize/2, HP_COLOR);
}

function drawLoot(x, y, fontSize) {
    let lootWidth = ctx.measureText('LOOT').width;
    let numWidth = ctx.measureText(100).width;
    let top = y, left = x - (lootWidth + numWidth + fontSize);
   
    colorText('LOOT', left, top, 'white', fontSize + 'px Arial', 'left', 'middle');
    colorText(player.loot, left + lootWidth + fontSize/2, top, '#ffca00');
}

function drawHeldItem(x, y, fontSize) {
    let heldItem = player.items[player.held];
    let item = (player.items[player.held] ? player.items[player.held].constructor.name : 'No Item').toUpperCase();
    
    ctx.font = fontSize + 'px Arial';
    let boxSize = ctx.measureText('FIREBOMB').width + fontSize;
    let top = y, left = x + boxSize/2 + fontSize/2;

    colorText(item, left, top, 'white', null, 'center', 'middle');

    if (heldItem && heldItem.durability != undefined) {
        if (heldItem.durability > 0) {
            let barSize = boxSize/1.5;
            let durSize = barSize * (player.items[player.held].durability/100);
            colorRect(left - barSize/2 - 2, top + fontSize/2 - 2, barSize + 4, fontSize/2 + 4, 'black');
            colorRect(left - durSize/2, top + fontSize/2, durSize, fontSize/2, HP_COLOR);
        } else  {
			colorText('BROKEN', left, top + fontSize, HP_COLOR);
		}
    }
}