const controls = {
	u: 0, d: 0, l: 0, r: 0, //directions
	items: 0, //toggle held items menu
	interact: 0,//Interact with world object
	action: 0, //Use held item
}
const controlsLastFrame = {u: 0, d: 0, l: 0, r: 0, items: 0,interact: 0, action: 0,}

this.addEventListener('keydown', e => setControl(e.which, 1));
this.addEventListener('keyup', e => setControl(e.which, 0));

function setControl(key, to) {
	//console.log(key);
	if (key == 65 || key == 37) { controls.l = to } //a or left
	if (key == 68 || key == 39) { controls.r = to } //d or right
	if (key == 87 || key == 38) { controls.u = to } //w or up
	if (key == 83 || key == 40) { controls.d = to } //s or down
	if (key == 69) { controls.items = to};
	if (key == 32) { controls.action = to } //space
	if (key == 17) { controls.interact = to } //control
}

function control() {
	if (player.isDead) return null;
	let av = new Vector2(0, 0);
	if (controls.items) {
		if (controls.u) player.held = 0;
		if (controls.l) player.held = 1;
		if (controls.r) player.held = 2;
		if (controls.d) player.held = 3;
		if (controls.interact) player.drop(player.held);
	} else {
		if (controls.l) av.x -= 1;
		if (controls.r) av.x += 1;
		if (controls.u) av.y -= 1;
		if (controls.d) av.y += 1;
		if (controls.action && !controlsLastFrame.action) player.use();
		if (controls.interact && !controlsLastFrame.interact) {
			if (player.interactables[0]) player.interact();
		} 
			
	}

	for (let key in controls) {
		if (controls.hasOwnProperty(key)) {
			controlsLastFrame[key] = controls[key];
		}
	}

	return av.normalize();
}