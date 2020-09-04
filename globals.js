const MIN_ROOM_SIZE = 8;
const ROOM_SIZE = 16;
const TILE_SIZE = 16;
const PARTICLE_SIZE = TILE_SIZE/4;

const AIR_RESISTANCE = 0.96;
const FRICTION = 0.94;

const NOEFF = -1; //No effect
const GRND = 0;
const CNCRT = 1;
const WOOD = 2;
const METAL = 3;
const GLASS = 4;
const GOLD = 5;
const WATER = 6;
const BLOOD = 7;
const OIL = 8;
const ICE = 9;

const FIRE = 10;
const SMOKE = 11;
const GAS = 12;
const STEAM = 13;
const SHOCK = 14;
const BMIST = 15; //Blood mist
const E_STM = 16; //Electrified steam

const ALL_SUBST = [GRND, CNCRT, WOOD, METAL, GLASS, WATER, FIRE, SMOKE, GAS, STEAM, SHOCK];
const WALL_SUBST = [CNCRT, WOOD, METAL];
const SOLID_SUBST = [CNCRT, WOOD, METAL, GLASS];

const EMPTY_SET = new Set();
const SOLID_SUBST_SET = new Set(SOLID_SUBST);
const GAS_SUBST_SET = new Set([FIRE, SMOKE, GAS, STEAM, SHOCK]);
const ALL_SUBST_SET = new Set(ALL_SUBST);

/*
	Substances properties:
		state:
			1 (solid): no expansion, layer 0
			2 (liquid): slow expansion into empty space, layer 0
			3 (gas): faster expansion into empty space, layer 1
			4 (plasma): fastest exansion into vulnerable tiles, layer 1
		life: lifetime and/or durability of substance tile
		quantity: amount of substance in tile (used for expansion)
		decay: rate at which substance life counts down every frame
		ondeath: substance tile left behind when life reaches zero
		
*/

const substanceTypes = [];
//.effects[0] is ground layer .effect[1] is air layer
substanceTypes[GRND] = { life: Infinity, quantity: 1, state: 0, effects: new Set([WATER, OIL, BLOOD, ICE, SMOKE, STEAM, GAS]), };
//liquid/solid
substanceTypes[CNCRT] = { life: 100, quantity: 1, state: 1, effects: EMPTY_SET, ondeath: NOEFF, };
substanceTypes[WOOD] = { life: 50, quantity: 1, state: 1, effects: new Set([FIRE]), ondeath: NOEFF, };
substanceTypes[METAL] = { life: 200, quantity: 1, state: 1, effects: new Set([SHOCK]), ondeath: NOEFF, };
substanceTypes[GLASS] = { life: 25, quantity: 1, state: 1, effects: EMPTY_SET, ondeath: NOEFF, };
substanceTypes[WATER] = { life: 100, quantity: 32, state: 2, effects: new Set([SMOKE, STEAM, SHOCK, GAS, WATER, BLOOD]), ondeath: NOEFF, };
substanceTypes[OIL] = { life: 200, quantity: 8, state: 2, effects: new Set([SMOKE, STEAM, GAS, FIRE, OIL, WATER]), ondeath: NOEFF, };
substanceTypes[BLOOD] = { life: 100, quantity: 64, state: 2, effects: new Set([SMOKE, STEAM, SHOCK, GAS, BLOOD]), ondeath: NOEFF, };
substanceTypes[ICE] = { life: 100, quantity: 1, state: 2, effects: new Set([SMOKE, STEAM, SHOCK, GAS]), ondeath: WATER, };
//energy/gas
substanceTypes[FIRE] = { life: 60, quantity: 1, state: 4, effects: new Set([WOOD, STEAM, WATER]), ondeath: SMOKE, };
substanceTypes[SMOKE] = { life: 60, quantity: 32, state: 3, effects: new Set([SMOKE, GRND, WATER, BLOOD, OIL, FIRE, STEAM]), ondeath: NOEFF, };
substanceTypes[GAS] = { life: 60, quantity: 60, state: 3, effects: new Set([GAS, GRND, WATER]), ondeath: NOEFF, };
substanceTypes[STEAM] = { life: 120, quantity: 64, state: 3, effects: new Set([STEAM, GRND, WATER]), ondeath: NOEFF, };
substanceTypes[SHOCK] = { life: 60, quantity: 60, state: 4, effects: EMPTY_SET, ondeath: NOEFF, };

const substColors = new Array(substanceTypes.length).fill('#000000');
substColors[GRND] = '#202020';
substColors[CNCRT] = '#454545';
substColors[WOOD] = '#402920';
substColors[METAL] = '#8585a0';
substColors[GOLD] = '#ffca00';
substColors[GLASS] = '#9090ff';
substColors[WATER] = '#4040b0';
substColors[BLOOD] = '#330000';
substColors[ICE] = '#f0f0ff';
substColors[FIRE] = '#d03510';
substColors[SMOKE] = '#121212';
substColors[GAS] = '#00ff00';
substColors[STEAM] = '#b0b0cf';
substColors[SHOCK] = '#ffff00';

//Using map to set every index to a unique array filled with NOEFF instead of a bunch of references to the same array, which I would never want
const effectMatrix = new Array(substanceTypes.length).fill(null).map(() => { return new Array(substanceTypes.length).fill(NOEFF) });
//[firstEffect][secondEffect] = result
effectMatrix[WATER][FIRE] = STEAM;
effectMatrix[FIRE][WATER] = STEAM;
effectMatrix[FIRE][GRND] = SMOKE;
effectMatrix[FIRE][SMOKE] = SMOKE;
effectMatrix[FIRE][STEAM] = STEAM;
effectMatrix[STEAM][FIRE] = STEAM;

let canvas, ctx, w, h, panX, panY;
let particles;