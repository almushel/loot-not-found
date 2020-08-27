class ParticleSystem {
	_stride = 6; //0: type, 1: x, 2: y, 3: x velocity, 4: y velocity, 5: size
	lastParticle = 0;
	constructor(size) {
		this.data = new Array(size * this._stride);
		this.data.fill(0);
	}

	update() {
		for (let p = 0; p < this.data.length; p += this._stride) {
			if (this.data[p] > GRND) {
				//vx
				if (this.data[p + 3]) {
					this.data[p + 1] += this.data[p + 3]; //x position
					if (Math.abs(this.data[p + 3]) < 0.01) {
						this.data[p + 3] = 0;
					} else this.data[p + 3] *= AIR_RESISTANCE;
				}

				//vy
				if (this.data[p + 4]) {
					this.data[p + 2] += this.data[p + 4]; //y position
					if (Math.abs(this.data[p + 4]) < 0.01) {
						this.data[p + 4] = 0;
					} else this.data[p + 4] *= AIR_RESISTANCE;
				}
			}
		}
	}

	draw() {
		for (let p = 0; p < this.data.length; p += this._stride) {
			if (this.data[p] > GRND) {
				ctx.fillStyle = substColors[this.data[p]];
				if (objectInView(this.data[p + 1], this.data[p + 2])) ctx.fillRect(this.data[p + 1], this.data[p + 2], this.data[p + 5], this.data[p + 5]);
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