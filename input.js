let controls = {
	u: 0, d: 0, l: 0, r: 0, //directions
	interact: 0,//Interact with world object
	use: 0, //Use held item
}

this.addEventListener('keydown', (e) => { setControl(e.which, 1); })
this.addEventListener('keyup', (e) => { setControl(e.which, 0); })

function setControl(key, to) {
	if (key == 65 || key == 37) { controls.l = to } //a or left
	if (key == 68 || key == 39) { controls.r = to } //d or right
	if (key == 87 || key == 38) { controls.u = to } //w or up
	if (key == 83 || key == 40) { controls.d = to } //s or down
	if (key == 32) { controls.interact = 1 } //space
	if (key == 17) { controls.use = 1 } //control
}

function control() {
	if (player.isDead) return null;
	let av = new Vector2(0, 0);
	if (controls.l) av.x -= 1;
	if (controls.r) av.x += 1;
	if (controls.u) av.y -= 1;
	if (controls.d) av.y += 1;

	if (controls.interact) player.hp = 0;

	return av.normalize();
}