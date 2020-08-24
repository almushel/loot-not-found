const ROOM_SIZE = 16;
const GRID_SIZE = 16;

class SubstanceLayer {
	constructor(size) {
		this._stride = 3; /*1: Effect Type, 2: quantity, 3: Lifetime */
		this.grid = new Array(size * this._stride);
		this.grid.fill(0);
	}

	spawnTile(index, type) {
		this.grid[index * this._stride] = type;
		if (substanceTypes[type]) this.setQuantity(index, substanceTypes[type].quantity);
		if (substanceTypes[type]) this.setLife(index, substanceTypes[type].life);
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
	width = 0;
	height = 0;

	constructor(width, height) {
		this.width = width;
		this.height = height;
		this._layers[0] = new SubstanceLayer(width * height); //ground
		this._layers[1] = new SubstanceLayer(width * height); //air
	}

	spawnTile(layer, index, type) {
		this._layers[layer].spawnTile(index, type);
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
					if (rx == 0 || ry == 0 || rx == ROOM_SIZE - 1 || ry == ROOM_SIZE - 1) level.spawnTile(0, tileIndex, WOOD);
				}
			}

			roomIndex += ROOM_SIZE;
		}
		//Skip the full row of rooms
		roomIndex += ROOM_SIZE * width * GRID_SIZE;
	}

	return sealLevel(level);
}

function sealLevel(level) {
	let index = 0;
	for (let y = 0; y < level.height; y++) {
 		for (let x = 0; x < level.width; x++) {
			 if (x == 0 || y == 0 || x == level.width - 1 || y == level.height - 1) {
				 level.spawnTile(0, index, CNCRT);
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