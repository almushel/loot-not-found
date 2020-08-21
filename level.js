const GRID_SIZE = 16;

const NOEFF = -1; //No effect
const GRND = 0;
const CNCRT = 1;
const WOOD = 2;
const METAL = 3;
const GLASS = 4;
const WATER = 5;

const FIRE = 10;
const SMOKE = 11;
const GAS = 12;
const STEAM = 13;
const SHOCK = 14;
const E_STM = 15; //Electrified steam

const ALL_SUBST = [GRND, CNCRT, WOOD, METAL, GLASS, WATER, FIRE, SMOKE, GAS, STEAM, SHOCK];
const SOLID_SUBST = [GRND, CNCRT, WOOD, METAL, GLASS, WATER];
const GAS_SUBST = [FIRE, SMOKE, GAS, STEAM, SHOCK]

const EMPTY_SET = new Set();
const SOLID_SUBST_SET = new Set(SOLID_SUBST);
const GAS_SUBST_SET = new Set(GAS_SUBST);
const ALL_SUBST_SET = new Set(ALL_SUBST);

const substanceTypes = [];
//.effects[0] is ground layer .effect[1] is air layer
substanceTypes[GRND]  = {life: Infinity, quantity: 1, effects: [SOLID_SUBST_SET, new Set([SMOKE, STEAM, GAS])], };
//liquid/solid
substanceTypes[CNCRT] = {life: 100, quantity: 1, effects: [EMPTY_SET, EMPTY_SET], ondeath: NOEFF, };
substanceTypes[WOOD]  = {life: 50, quantity: 1, effects: [EMPTY_SET, new Set([FIRE])], ondeath: NOEFF, };
substanceTypes[METAL] = {life: 200, quantity: 1, effects: [EMPTY_SET, new Set([SHOCK])], ondeath: NOEFF, };
substanceTypes[GLASS] = {life: 25, quantity: 1, effects: [EMPTY_SET, EMPTY_SET], ondeath: NOEFF, };
substanceTypes[WATER] = {life: Infinity, quantity: 1, effects: [EMPTY_SET, new Set([SMOKE, STEAM, SHOCK, GAS])], ondeath: NOEFF, };
//energy/gas
substanceTypes[FIRE]  = {life: 60, quantity: 1, effects: [EMPTY_SET, EMPTY_SET], ondeath: SMOKE, };
substanceTypes[SMOKE] = {life: 30, quantity: 32, effects: [SOLID_SUBST_SET, EMPTY_SET], ondeath: NOEFF, };
substanceTypes[GAS]   = {life: 60, quantity: 60, effects: [EMPTY_SET, EMPTY_SET], ondeath: NOEFF, };
substanceTypes[STEAM] = {life: 30, quantity: 8, effects: [EMPTY_SET, EMPTY_SET], ondeath: NOEFF, };
substanceTypes[SHOCK] = {life: 60, quantity: 60, effects: [EMPTY_SET, EMPTY_SET], ondeath: NOEFF, };

const substColors = [];
substColors[GRND] = '#202020';
substColors[CNCRT] = '#505050';
substColors[WOOD] = '#452b25';
substColors[METAL] = '#707070';
substColors[GLASS] = 'skyblue';
substColors[WATER] = '#2020ff';
substColors[FIRE] = 'red';
substColors[SMOKE] = '#090909';
substColors[GAS] = 'green';
substColors[STEAM] = '#c0f0ff';
substColors[SHOCK] = 'yellow';
substColors[E_STM] = 'orange'; //Electrified steam

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