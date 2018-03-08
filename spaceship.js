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
	this.width = 0.160;
	this.height = 0.50;
	this.position = [0.0,-0.7];

	// temps de rechagement (ms)
    this.reloadTime = 200;

    // vitesse du missile en y
    this.missileSpeed = 1;

    this.missiles = []; // Les tirs du joueur
    this.fire = false;
    this.timeBeforeNextFire = 0;
}

Spaceship.prototype.beginFire = function() {
    this.fire = true;
}

Spaceship.prototype.stopFire = function() {
    this.fire = false;
}

Spaceship.prototype.setParameters = function(elapsed) {
	// on pourrait animer des choses ici
}

Spaceship.prototype.fireMissile = function(elapsed) {
	// on pourrait animer des choses ici

    // test des tirs
    this.timeBeforeNextFire -= elapsed;
    if (this.fire && this.timeBeforeNextFire <= 0) {
        this.missiles.push(new Missile(this.position[0], this.position[1] + this.height/2, 0, this.missileSpeed));
        this.timeBeforeNextFire = this.reloadTime;
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
