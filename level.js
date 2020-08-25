const ROOM_SIZE = 16;
const GRID_SIZE = 16;

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
			let x = e % currentLevel.width, y = (e - x) / currentLevel.width * GRID_SIZE;
			x *= GRID_SIZE;
			if (objectInview(x, y)) {
				ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
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

	draw(layer) {
		if (layer == 1) ctx.globalAlpha = 0.6;
		this._layers[layer].draw();
		if (layer == 1) ctx.globalAlpha = 1;
	}

	get length() { return this.width * this.height };
}

function generateLevel(width, height) {
	let rooms = [];
	let index = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (x == 0 || y == 0 || x == width - 1 || y == height - 1) rooms[index] = 0;
			else if ((x % 2 != 0) && (y % 2 != 0)) rooms[index] = 1;
			else rooms[index] = 0;
			index++;
		}
	}

	return generateTileGrid(rooms, width, height);
}

function generateTileGrid(rooms, width, height) {
	const lootSize = GRID_SIZE/4;
	let lootLeft = 404;
	let level = new GameLevel(width * ROOM_SIZE, height * ROOM_SIZE);
	let roomIndex = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (rooms[width * y + x] == 0) {
				roomIndex += ROOM_SIZE;
				continue;
			}

			for (let ry = 0; ry < ROOM_SIZE; ry++) {
				for (let rx = 0; rx < ROOM_SIZE; rx++) {
					let tileIndex = roomIndex + (ry * ROOM_SIZE * width) + rx;
					if (rx == 0 || ry == 0 || rx == ROOM_SIZE - 1 || ry == ROOM_SIZE - 1) {
						level.setType(0, tileIndex, WOOD);
						level.setQuantity(0, tileIndex, 1);
						level.setLife(0, tileIndex, substanceTypes[WOOD].life);
					}else if (lootLeft > 0 && Math.random() > 0.9) {
						let lx = tileIndex % level.width, ly = (tileIndex - x) / level.width;
						level.objects.push(new LootPiece(Math.floor(lx) * GRID_SIZE + lootSize, Math.floor(ly) * GRID_SIZE + lootSize));
						lootLeft--;
					}
				}
			}

			roomIndex += ROOM_SIZE;
		}
		//Skip the full row of rooms
		roomIndex += ROOM_SIZE * width * GRID_SIZE;
	}

	while(lootLeft > 0) {
		let x = y = GRID_SIZE;
		if (Math.random() > 0.6) {
			x += Math.random() * ((ROOM_SIZE * GRID_SIZE) - GRID_SIZE), y += Math.random() * (level.height * GRID_SIZE - GRID_SIZE);
		} else {
			x += Math.random() * (level.width * GRID_SIZE - GRID_SIZE) , y += Math.random() * (ROOM_SIZE * GRID_SIZE - GRID_SIZE);
		}
		
		x -= x % GRID_SIZE;
		y -= y % GRID_SIZE;
		
		if (Math.random() > 0.5) x = ((1 + level.width - 2) * GRID_SIZE) - x;
		if (Math.random() > 0.5) y = ((1 + level.height - 2) * GRID_SIZE) - y;
		level.objects.push(new LootPiece(x + lootSize * 2, y + lootSize * 2));
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

function tilesNearPosition(position) {
	let index = tileAtCoords(position.x, position.y);
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
	return Math.floor(Math.floor(y / GRID_SIZE) * currentLevel.width + Math.floor(x / GRID_SIZE));
}