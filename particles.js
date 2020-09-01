class ParticleSystem {
	_stride = 6; //0: type, 1: x, 2: y, 3: x velocity, 4: y velocity, 5: size
	lastParticle = 0;
	constructor(size) {
		this.data = new Array(size * this._stride);
		this.data.fill(0);
	}

	reset() {
		this.data.fill(0);
	}

	update() {
		for (let p = 0; p < this.data.length; p += this._stride) {
			if (this.data[p] > GRND) {
				if (this.data[p + 3]) {
					//Update x position and check for collision
					let tx = this.data[p + 1] + this.data[p + 3]
					if (currentLevel.getType(0, tileAtCoords(tx, this.data[p+2])) > GRND) {
						this.data[p + 3] *= -1;
					} else this.data[p + 1] = tx; //x position
					
					//Update x velocity
					if (Math.abs(this.data[p + 3]) < 0.01) {
						this.data[p + 3] = 0;
					} else this.data[p + 3] *= AIR_RESISTANCE;
				}

				if (this.data[p + 4]) {
					//Update y position and check for collision
					let ty = this.data[p + 2] + this.data[p + 4];
					if (currentLevel.getType(0, tileAtCoords(this.data[p+1], ty)) > GRND) {
						this.data[p + 3] *= -1;
					} else this.data[p + 2] = ty; //y position
					
					//Update y velocity
					if (Math.abs(this.data[p + 4]) < 0.01) {
						this.data[p + 4] = 0;
					} else this.data[p + 4] *= AIR_RESISTANCE;
				}
			}
		}
	}

	draw() {
		for (let p = 0; p < this.data.length; p += this._stride) {
			if (this.data[p] > GRND && pointInView(this.data[p + 1], this.data[p + 2])) {
				let tile = tileAtCoords(Math.round(this.data[p + 1]), Math.round(this.data[p + 2]));
				let tileType = currentLevel.getType(1, tile);
				let color = tileType > GRND ? averageHexColors([ substColors[tileType], substColors[this.data[p]]]) : substColors[this.data[p]];

				ctx.fillStyle = color;
				ctx.fillRect(this.data[p + 1], this.data[p + 2], this.data[p + 5], this.data[p + 5]);
			}
		}
	}

	spawn(particle, amount) {
		if (Array.isArray(particle) && particle.length == this._stride) {
			let particlesSpawned = 0;

			for (let p = 0; p < this.data.length; p += this._stride) {
				if (this.data[p] == GRND) {
					for (let i = 0; i < particle.length; i++) {
						this.data[p + i] = particle[i];
					}
					particlesSpawned++;
				}
				if (particlesSpawned >= amount) break;
			}

			//Overwrite older particles if no empty particles found
			if (particlesSpawned < amount) {
				for (particlesSpawned; particlesSpawned < amount; particlesSpawned++) {
					for (let i = 0; i < particle.length; i++) {
						this.data[this.lastParticle + i] = particle[i];
					}
					this.lastParticle += this._stride;
					if (this.lastParticle >= this.data.length) this.lastParticle = 0;
				}
			}
		} else {
			throw new Error('invalid particle definition')
		}
	}
}