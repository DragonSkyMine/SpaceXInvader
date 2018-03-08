var missileShader;

function initMissileShader() {
	missileShader = initShaders("missile-vs","missile-fs");

    // active ce shader
    gl.useProgram(missileShader);

    // recupere la localisation de l'attribut dans lequel on souhaite acceder aux positions
    missileShader.vertexPositionAttribute = gl.getAttribLocation(missileShader, "aVertexPosition");
    gl.enableVertexAttribArray(missileShader.vertexPositionAttribute); // active cet attribut

    // pareil pour les coordonnees de texture
    missileShader.vertexCoordAttribute = gl.getAttribLocation(missileShader, "aVertexCoord");
    gl.enableVertexAttribArray(missileShader.vertexCoordAttribute);

     // adresse de la variable uniforme uOffset dans le shader
    missileShader.positionUniform = gl.getUniformLocation(missileShader, "uPosition");

    // adresse de la variable uniforme uTexture dans le shader
    missileShader.textureUniform = gl.getUniformLocation(missileShader, "uTexture");

    console.log("missile shader initialized");
}

var missileTexture;

function initMissileTexture() {
    // creation de la texture
    missileTexture = gl.createTexture();
    missileTexture.image = new Image();
    missileTexture.image.onload = function () {
        // active la texture (les operations qui suivent feront effet sur celle-ci)
        gl.bindTexture(gl.TEXTURE_2D, missileTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        // envoie les donnees sur GPU
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, missileTexture.image);

        // options (filtrage+effets de bordure)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.generateMipmap(gl.TEXTURE_2D, gl.LINEAR_MIPMAP_LINEAR);

        // desactive la texture courante
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    missileTexture.image.src = "img/tesla.png";
}

function Missile(x, y, speedX, speedY) {
	this.initParameters(x, y, speedX, speedY);

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

    console.log("missile initialized");
}

Missile.prototype.initParameters = function(x, y, speedX, speedY) {
	this.width = 0.05;
	this.height = 0.1;
	this.position = [x, y];
	this.speed = [speedX, speedY];
}

Missile.prototype.setParameters = function(elapsed) {
	// on pourrait animer des choses ici
    this.position[0] += this.speed[0] * elapsed/1000;
    this.position[1] += this.speed[1] * elapsed/1000;
}

Missile.prototype.shader = function() {
	return missileShader;
}

Missile.prototype.sendUniformVariables = function() {
	gl.uniform2fv(missileShader.positionUniform,this.position);
}

Missile.prototype.draw = function() {
	// active le buffer de position et fait le lien avec l'attribut aVertexPosition dans le shader
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.vertexAttribPointer(missileShader.vertexPositionAttribute, this.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

	// active le buffer de coords
	gl.bindBuffer(gl.ARRAY_BUFFER, this.coordBuffer);
	gl.vertexAttribPointer(missileShader.vertexCoordAttribute, this.coordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // envoie la texture au shader
    gl.activeTexture(gl.TEXTURE0); // on active l'unite de texture 0
    gl.bindTexture(gl.TEXTURE_2D, missileTexture); // on place maTexture dans l'unité active
    gl.uniform1i(missileShader.textureUniform, 0); // on dit au shader que maTextureUniform se trouve sur l'unite de texture 0


    // dessine les buffers actifs
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangles);
	gl.drawElements(gl.TRIANGLES, this.triangles.numItems, gl.UNSIGNED_SHORT, 0);
}
