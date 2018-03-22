var spaceshipShader;

function initSpaceshipShader() {
	spaceshipShader = initShaders("spaceship-vs","spaceship-fs");

	// active ce shader
	gl.useProgram(spaceshipShader);

	// recupere la localisation de l'attribut dans lequel on souhaite acceder aux positions
	spaceshipShader.vertexPositionAttribute = gl.getAttribLocation(spaceshipShader, "aVertexPosition");
	gl.enableVertexAttribArray(spaceshipShader.vertexPositionAttribute); // active cet attribut

	// pareil pour les coordonnees de texture
	spaceshipShader.vertexCoordAttribute = gl.getAttribLocation(spaceshipShader, "aVertexCoord");
	gl.enableVertexAttribArray(spaceshipShader.vertexCoordAttribute);

	spaceshipShader.timeUniform = gl.getUniformLocation(spaceshipShader, "uTime");

	spaceshipShader.invincibleUniform = gl.getUniformLocation(spaceshipShader, "uInvincible");

	// adresse de la variable uniforme uOffset dans le shader
	spaceshipShader.positionUniform = gl.getUniformLocation(spaceshipShader, "uPosition");

	// adresse de la variable uniforme uTexture dans le shader
	spaceshipShader.textureUniform = gl.getUniformLocation(spaceshipShader, "uTexture");

	console.log("spaceship shader initialized");
}

var spaceshipTexture;

function initSpaceshipTexture() {
	// creation de la texture
	spaceshipTexture = gl.createTexture();
	spaceshipTexture.image = new Image();
	spaceshipTexture.image.onload = function () {
		// active la texture (les operations qui suivent feront effet sur celle-ci)
		gl.bindTexture(gl.TEXTURE_2D, spaceshipTexture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

		// envoie les donnees sur GPU
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, spaceshipTexture.image);

		// options (filtrage+effets de bordure)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		gl.generateMipmap(gl.TEXTURE_2D, gl.LINEAR_MIPMAP_LINEAR);

		// desactive la texture courante
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	spaceshipTexture.image.src = "img/falcon.png";
}

function Spaceship() {
	this.initParameters();

	// cree un nouveau buffer sur le GPU et l'active
	this.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

	// un tableau contenant les positions des sommets (sur CPU donc)
	var wo2 = 0.5*this.width;
	var ho2 = 0.5*this.height;

	var vertices = [
		-wo2,-ho2, -0.5,
		wo2,-ho2, -0.5,
		wo2, ho2, -0.5,
		-wo2, ho2, -0.5
	];

	// on envoie ces positions au GPU ici (et on se rappelle de leur nombre/taille)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	this.vertexBuffer.itemSize = 3;
	this.vertexBuffer.numItems = 4;

	// position de texture
	this.coordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.coordBuffer);
	var coords = [
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0
	];

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW);
	this.coordBuffer.itemSize = 2;
	this.coordBuffer.numItems = 4;

	// creation des faces du cube (les triangles) avec les indices vers les sommets
	this.triangles = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangles);
	var tri = [0,1,2,0,2,3];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(tri), gl.STATIC_DRAW);
	this.triangles.numItems = 6;

	console.log("spaceship initialized");
}

Spaceship.prototype.initParameters = function() {
	this.width = 0.096;
	this.height = 0.3;
	this.position = [0.0,-0.7];
	this.timer = 0.0;
	this.time = 0.0;
	this.score = 0.0;

	// temps de rechagement (ms)
	this.reloadTime = 200;

	// vitesse du missile en y
	this.missileSpeed = 1;

	this.missiles = []; // Les tirs du joueur
	this.fire = false;
	this.timeBeforeNextFire = 0;

	this.hp = 100;
	this.invincibleTime = 0;
	this.invincible = 0.0;
}

Spaceship.prototype.beginFire = function() {
	this.fire = true;
}

Spaceship.prototype.stopFire = function() {
	this.fire = false;
}

Spaceship.prototype.setParameters = function(elapsed) {
	// on pourrait animer des choses ici
	this.timer = this.timer+elapsed*0.0004;
	this.time = Math.max(0.0, Math.sin((this.timer + 25.0) * 0.1) *0.25 + 0.25);
	this.invincible = this.invincibleTime > 0 ? this.invincibleTime % 8 < 4 ? 1.0 : 0.0 : 0.0;
	this.invincibleTime = Math.max(0, this.invincibleTime - 1);
}

Spaceship.prototype.fireMissile = function(elapsed) {
    // test des tirs
    this.timeBeforeNextFire -= elapsed;
    if (this.fire && this.timeBeforeNextFire <= 0) {
			if (this.score > 50000) {
				this.missiles.push(new Missile(this.position[0], this.position[1] + this.height/2, 0, this.missileSpeed, true));
				this.missiles.push(new Missile(this.position[0], this.position[1] + this.height/2, -this.missileSpeed*0.2, this.missileSpeed*0.9, true));
				this.missiles.push(new Missile(this.position[0], this.position[1] + this.height/2, this.missileSpeed*0.2, this.missileSpeed*0.9, true));
			} else if (this.score > 20000) {
				this.missiles.push(new Missile(this.position[0] + (this.width * 0.25), this.position[1] + this.height/2, 0, this.missileSpeed, true));
				this.missiles.push(new Missile(this.position[0] - (this.width * 0.25), this.position[1] + this.height/2, 0, this.missileSpeed, true));
			} else {
				this.missiles.push(new Missile(this.position[0], this.position[1] + this.height/2, 0, this.missileSpeed, true));
			}
        this.timeBeforeNextFire = this.reloadTime;
    }
}

Spaceship.prototype.takeDamage = function(damages) {
	if (this.invincibleTime <= 0) {
		this.hp -= damages;
		if (this.hp < 0) {
			this.hp = 0;
		}
		this.invincibleTime = 50;
		console.log("took " + damages + " damages");
		console.log(this.hp + " hp left");
		dam = new Audio('damage.mp3');
		dam.play();
	}
}

Spaceship.prototype.setPosition = function(x,y) {
	this.position = [x,y];
}

Spaceship.prototype.removeMissile = function(missileIndex) {
	this.missiles.splice(missileIndex, 1);
}

Spaceship.prototype.shader = function() {
	return spaceshipShader;
}

Spaceship.prototype.sendUniformVariables = function() {
	gl.uniform1f(spaceshipShader.invincibleUniform,this.invincible);
	gl.uniform1f(spaceshipShader.timeUniform,this.time);
	gl.uniform2fv(spaceshipShader.positionUniform,this.position);
}

Spaceship.prototype.draw = function() {
	// active le buffer de position et fait le lien avec l'attribut aVertexPosition dans le shader
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.vertexAttribPointer(spaceshipShader.vertexPositionAttribute, this.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

	// active le buffer de coords
	gl.bindBuffer(gl.ARRAY_BUFFER, this.coordBuffer);
	gl.vertexAttribPointer(spaceshipShader.vertexCoordAttribute, this.coordBuffer.itemSize, gl.FLOAT, false, 0, 0);

	// envoie la texture au shader
	gl.activeTexture(gl.TEXTURE0); // on active l'unite de texture 0
	gl.bindTexture(gl.TEXTURE_2D, spaceshipTexture); // on place maTexture dans l'unité active
	gl.uniform1i(spaceshipShader.textureUniform, 0); // on dit au shader que maTextureUniform se trouve sur l'unite de texture 0

	// dessine les buffers actifs
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangles);
	gl.drawElements(gl.TRIANGLES, this.triangles.numItems, gl.UNSIGNED_SHORT, 0);
}
