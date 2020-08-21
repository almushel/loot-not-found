const GRID_SIZE = 16;
const tileTypes = [
	{ name: 'ground', durability: Infinity, effects: new Set([1, 3, 4, 5]), },	//0 ground
	{ name: 'concrete', durability: 100, effects: new Set([]), },					//1 concrete
	{ name: 'wood', durability: 50, effects: new Set([0]), },						//2 wood
	{ name: 'metal', durability: 100, effects: new Set([2, 3]), },				//3 metal
	{ name: 'glass', durability: 25, effects: new Set([]), },						//4 glass
];
const tileColors = ['#202020', '#505050', '#452b25', '#707070', 'skyblue'];

class GameLevel {
	_grid = [];
	_tileHP = [];
	effects = [];
	width = 0;
	height = 0;

	get grid() { return this._grid; }
	set grid(newGrid) {
		this._grid = newGrid;
		this._tileHP.length = this._grid.length;
		this._tileHP.fill(100);
	}
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
	let newGrid = [];
	newGrid.length = width * height;
	newGrid.fill(0);
	let index = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (Math.round(Math.abs(x - width / 2)) == 4) {
				if (Math.abs(Math.floor(y - height / 2)) < 3);
				else if (y >= 15 && y <= height - 15) newGrid[index] = 1;
			}
			else if (Math.round(Math.abs(x - width / 2)) < 4) {
				if (y == 15 || y == height - 15) newGrid[index] = 1;
				else if (y >= 15 && y <= height - 15) newGrid[index] = 2;
			}
			index++;
		}
	}

	let newLevel = new GameLevel();
	newLevel.width = width;
	newLevel.height = height;
	newLevel.grid = newGrid;
	newLevel.effects = new LevelEffects(newGrid.length);

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
			if (checkTile < 0 || checkTile > currentLevel.grid.length) continue;
			tiles.push(checkTile);
		}
	}
	return tiles;
}