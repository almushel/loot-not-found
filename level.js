class SubstanceLayer {
	constructor(size) {
		this._stride = 3; /*1: Effect Type, 2: quantity, 3: Lifetime */
		this.grid = new Array(size * this._stride);
		this.grid.fill(0);
	}

	spawnTile(index, type) {
		let typeIndex = index * this._stride;
		if (this.grid[typeIndex] == type && substanceTypes[type]) {
			this.grid[++typeIndex] += substanceTypes[type].quantity * Math.random() / 2;
		} else {
			this.grid[typeIndex++] = type;
			if (substanceTypes[type]) this.grid[typeIndex++] = substanceTypes[type].quantity;
			if (substanceTypes[type]) this.grid[typeIndex] = substanceTypes[type].life;
		}
	}

	getType(levelIndex) {
		return this.grid[levelIndex * this._stride];
	}

	setType(levelIndex, type) {
		this.grid[levelIndex * this._stride] = type;
	}

	getQuantity(levelIndex) {
		return this.grid[levelIndex * this._stride + 1];
	}

	setQuantity(levelIndex, value) {
		this.grid[levelIndex * this._stride + 1] = value;
	}

	getLife(levelIndex) {
		return this.grid[levelIndex * this._stride + 2];
	}

	setLife(levelIndex, value) {
		this.grid[levelIndex * this._stride + 2] = value;
	}

	resetTile(index) {
		let tileIndex = index * this._stride;
		this.grid[tileIndex++] = GRND;
		this.grid[tileIndex++] = GRND;
		this.grid[tileIndex] = GRND;
	}

	draw() {
		for (let e = 0; e < this.length; e++) {
			let type = this.getType(e);
			if (type <= 0) continue;
			ctx.fillStyle = substColors[type];
			let x = e % currentLevel.width, y = (e - x) / currentLevel.width * TILE_SIZE;
			x *= TILE_SIZE;
			if (objectInView(x, y)) {
				ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
			}
		}
	}

	get length() { return this.grid.length / this._stride; }
}

class GameLevel {
	_layers = [];
	objects = [];
	width = 0;
	height = 0;

	constructor(width, height) {
		this.width = width;
		this.height = height;
		this._layers[0] = new SubstanceLayer(width * height); //ground
		this._layers[1] = new SubstanceLayer(width * height); //air
	}

	spawnTile(index, type) {
		//TO DO check for legal tile
		let layer = (substanceTypes[type].state < 3) ? 0 : 1;
		
		let groundType = this.getType(0, index);
		let airType = this.getType(1, index);
		if ((substanceTypes[groundType].effects.has(type)) &&
			(airType <= GRND || substanceTypes[airType].effects.has(type)) ) {
			this._layers[layer].spawnTile(index, type);
		} else {
			elementInteraction(type, index);
		}
	}

	getType(layer, index) {
		return this._layers[layer].getType(index);
	}

	setType(layer, index, type) {
		this._layers[layer].setType(index, type);
	}

	addLife(layer, index, life) {
		let cLife = this.getLife(layer, index);
		this.setLife(layer, index, cLife + life);
	}

	getLife(layer, index) {
		return this._layers[layer].getLife(index);
	}

	setLife(layer, index, life) {
		this._layers[layer].setLife(index, life);
	}

	addQuantity(layer, index, quantity) {
		let cQuant = this.getQuantity(layer, index);
		this.setQuantity(layer, index, cQuant + quantity);
	}

	getQuantity(layer, index) {
		return this._layers[layer].getQuantity(index);
	}

	setQuantity(layer, index, quantity) {
		this._layers[layer].setQuantity(index, quantity);
	}

	resetTile(layer, index) {
		this._layers[layer].resetTile(index);
	}

	draw() {
		//TO DO: Use x/y loops for more precise draw boundaries
		let e = clamp(tileAtCoords(panX, panY), 0, this._layers[1].length);
		let length = clamp(tileAtCoords(panX + canvas.width, panY + canvas.height), 0, this._layers[1].length);
		for (e; e < length; e++) {
			let type = this.getType(1, e);
			if (!type) type = this.getType(0, e);
			ctx.fillStyle = substColors[type];
			let x = e % currentLevel.width, y = (e - x) / currentLevel.width * TILE_SIZE;
			x *= TILE_SIZE;
			if (objectInView(x, y)) {
				ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
			}
		}
	}

	drawLayer(layer) {
		this._layers[layer].draw();
	}

	get length() { return this.width * this.height };
}

function generateLevel(width, height) {
	let rooms = [];
	let index = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (x == 0 || y == 0 || x == width - 1 || y == height - 1 || (x == Math.floor(width/2) && y == Math.floor(height/2)) ) {
				rooms.push([0,0,0,0]);				
			}
			else {
				let width = Math.floor(MIN_ROOM_SIZE + Math.random() * (ROOM_SIZE - MIN_ROOM_SIZE)),
					height = Math.floor(MIN_ROOM_SIZE + Math.random() * (ROOM_SIZE - MIN_ROOM_SIZE)),
					left = Math.floor(Math.random() * (ROOM_SIZE - width)),
					top = Math.floor(Math.random() * (ROOM_SIZE - height));
			
				rooms.push([left, top, left + width, top + height]);
			}
			index++;
		}
	}

	return generateTileGrid(rooms, width, height);
}

function generateTileGrid(rooms, width, height) {
	let lootLeft = 404;
	let level = new GameLevel(width * ROOM_SIZE, height * ROOM_SIZE);
	let roomIndex = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let room = width * y + x;
			if (rooms[room] == 0) {
				roomIndex += ROOM_SIZE;
				continue;
			}

			let wallType = SOLID_SUBST[Math.floor(Math.random() * SOLID_SUBST.length)];
			let left = rooms[room][0], top = rooms[room][1], right = rooms[room][2], bottom = rooms[room][3];
			for (let ry = top; ry < bottom; ry++) {
				for (let rx = left; rx < right; rx++) {
					let tileIndex = roomIndex + (ry * ROOM_SIZE * width) + rx;
					if (rx >= left || ry >= top || rx <= right - 1 || ry <= bottom - 1) {
						if (rx == left || ry == top || rx == right - 1 || ry == bottom - 1) {
							level.setType(0, tileIndex, wallType);
							level.setQuantity(0, tileIndex, 1);
							level.setLife(0, tileIndex, substanceTypes[wallType].life);
						} else if (lootLeft > 0 && Math.random() > 0.9) {
							let lx = tileIndex % level.width, ly = (tileIndex - x) / level.width;
							let loot = new LootPiece(Math.floor(lx) * TILE_SIZE, Math.floor(ly) * TILE_SIZE);
							loot.x += loot.size;
							loot.y += loot.size;
							
							level.objects.push(loot);
							lootLeft--;
						}
					}
				}
			}

			roomIndex += ROOM_SIZE;
		}
		//Skip the full row of rooms
		roomIndex += ROOM_SIZE * width * ROOM_SIZE;
	}

	while(lootLeft > lootLeft) {
		let x = y = TILE_SIZE;
		if (Math.random() > 0.6) {
			x += Math.random() * ((ROOM_SIZE * TILE_SIZE) - TILE_SIZE), y += Math.random() * (level.height * TILE_SIZE - TILE_SIZE);
		} else {
			x += Math.random() * (level.width * TILE_SIZE - TILE_SIZE) , y += Math.random() * (ROOM_SIZE * TILE_SIZE - TILE_SIZE);
		}
		
		x -= x % TILE_SIZE;
		y -= y % TILE_SIZE;
		
		if (Math.random() > 0.5) x = ((1 + level.width - 2) * TILE_SIZE) - x;
		if (Math.random() > 0.5) y = ((1 + level.height - 2) * TILE_SIZE) - y;
		level.objects.push(new LootPiece(x, y));
		lootLeft--;
	}

	return sealLevel(level);
}

function sealLevel(level) {
	let index = 0;
	for (let y = 0; y < level.height; y++) {
 		for (let x = 0; x < level.width; x++) {
			 if (x == 0 || y == 0 || x == level.width - 1 || y == level.height - 1) {
				level.setType(0, index, CNCRT);
				level.setQuantity(0, index, 1);
				level.setLife(0, index, substanceTypes[CNCRT].life);
			 }
			 index++;
		 }
	}

	return level;
}

//NOTE: This is problematic for objects larger than TILE_SIZE
function tilesNearPosition(x, y) {
	let index = tileAtCoords(x, y);
	return tilesNearIndex(index);
}

function tilesNearIndex(index) {
	let tiles = []; 
	for (let y = -1; y < 2; y++) {
		for (let x = -1; x < 2; x++) {
			let checkTile = index + (currentLevel.width * y);
			if (Math.floor(checkTile / currentLevel.width) !=  Math.floor((checkTile + x) / currentLevel.width))
				continue;
			checkTile += x;
			if (checkTile < 0 || checkTile > currentLevel.length) continue;
			tiles.push(checkTile);
		}
	}
	return tiles;
}

function tileAtCoords(x, y) {
	return Math.floor(Math.floor(y / TILE_SIZE) * currentLevel.width + Math.floor(x / TILE_SIZE));
}