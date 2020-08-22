const GRID_SIZE = 16;

class SubstanceLayer {
	constructor(size) {
		this._stride = 3; /*1: Effect Type, 2: quantity, 3: Lifetime */
		this.grid = new Array(size * this._stride);
		this.grid.fill(0);
	}

	getType(levelIndex) {
		return this.grid[levelIndex * this._stride];
	}

	setType(levelIndex, type) {
		this.grid[levelIndex * this._stride] = type;
		if (substanceTypes[type]) this.setQuantity(levelIndex, substanceTypes[type].quantity);
		if (substanceTypes[type]) this.setLifeTime(levelIndex, substanceTypes[type].life);
	}

	getQuantity(levelIndex) {
		return this.grid[levelIndex * this._stride + 1];
	}

	setQuantity(levelIndex, value) {
		this.grid[levelIndex * this._stride + 1] = value;
	}

	getLifeTime(levelIndex) {
		return this.grid[levelIndex * this._stride + 2];
	}

	setLifeTime(levelIndex, value) {
		this.grid[levelIndex * this._stride + 2] = value;
	}

	draw() {
		ctx.globalAlpha = 0.4;
		for (let e = 0; e < this.length; e++) {
			let type = this.getType(e);
			if (type <= 0) continue;
			ctx.fillStyle = substColors[type];
			let x = e % currentLevel.width, y = (e - x) / currentLevel.width;
			ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
		}
		ctx.globalAlpha = 1;
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

	getTileType(layer, index) {
		return this._layers[layer].getType(index);
	}

	setTileType(layer, index, type) {
		this._layers[layer].setType(index, type);
	}

	getTileLife(layer, index) {
		return this._layers[layer].getLifeTime(index);
	}

	setTileLife(layer, index, life) {
		this._layers[layer].setLifeTime(index, life);
	}

	getTileQuantity(layer, index) {
		return this._layers[layer].getQuantity(index);
	}

	setTileQuantity(layer, index, quantity) {
		this._layers[layer].setQuantity(index, quantity);
	}

	draw(layer) {
		this._layers[layer].draw();
	}

	get length() { return this.width * this.height };
}

function drawGrid() {
	let width = currentLevel.width, height = currentLevel.height;
	let index = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let tileType = currentLevel.grid[index];
			ctx.fillStyle = tileColors[tileType];
			if (tileType) ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
			index++;
		}
	}
}

function generateLevel(width, height) {
	let newLevel = new GameLevel(width, height);
	let index = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (Math.round(Math.abs(x - width / 2)) == 4) {
				if (Math.abs(Math.floor(y - height / 2)) < 3);
				else if (y >= 15 && y <= height - 15) newLevel.setTileType(0, index, CNCRT);
			}
			else if (Math.round(Math.abs(x - width / 2)) < 4) {
				if (y == 15 || y == height - 15) newLevel.setTileType(0, index, CNCRT);
				else if (y >= 15 && y <= height - 15) newLevel.setTileType(0, index, WOOD);
			}
			index++;
		}
	}

	return newLevel;
}

function tilesNearPosition(position) {
	let index = Math.floor(Math.floor(position.y / GRID_SIZE) * currentLevel.width + Math.floor(position.x / GRID_SIZE));
	return tilesNearIndex(index);
}

function tilesNearIndex(index) {
	let tiles = [];
	for (let y = -1; y < 2; y++) {
		for (let x = -1; x < 2; x++) {
			let checkTile = index + (currentLevel.width * y) + x;
			//NOTE: Also need check for edges
			if (checkTile < 0 || checkTile > currentLevel.length) continue;
			tiles.push(checkTile);
		}
	}
	return tiles;
}