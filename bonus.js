var bonusShader;

function initBonusShader() {
	bonusShader = initShaders("bonus-vs","bonus-fs");

    // active ce shader
    gl.useProgram(bonusShader);

    // recupere la localisation de l'attribut dans lequel on souhaite acceder aux positions
    bonusShader.vertexPositionAttribute = gl.getAttribLocation(bonusShader, "aVertexPosition");
    gl.enableVertexAttribArray(bonusShader.vertexPositionAttribute); // active cet attribut

    // pareil pour les coordonnees de texture
    bonusShader.vertexCoordAttribute = gl.getAttribLocation(bonusShader, "aVertexCoord");
    gl.enableVertexAttribArray(bonusShader.vertexCoordAttribute);

     // adresse de la variable uniforme uOffset dans le shader
    bonusShader.positionUniform = gl.getUniformLocation(bonusShader, "uPosition");

    // adresse de la variable uniforme uTexture dans le shader
    bonusShader.textureUniform = gl.getUniformLocation(bonusShader, "uTexture");

		// adresse de la variable uniforme uType dans le shader
		bonusShader.typeUniform = gl.getUniformLocation(bonusShader, "uType");

    console.log("bonus shader initialized");
}

var bonusTexture;

function initBonusTexture() {
    // creation de la texture
    bonusTexture = gl.createTexture();
    bonusTexture.image = new Image();
    bonusTexture.image.onload = function () {
        // active la texture (les operations qui suivent feront effet sur celle-ci)
        gl.bindTexture(gl.TEXTURE_2D, bonusTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        // envoie les donnees sur GPU
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bonusTexture.image);

        // options (filtrage+effets de bordure)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.generateMipmap(gl.TEXTURE_2D, gl.LINEAR_MIPMAP_LINEAR);

        // desactive la texture courante
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    bonusTexture.image.src = "img/bonus.png";
}

function Bonus(x, y, type) {
	this.initParameters(x, y, type);

	// cree un nouveau buffer sur le GPU et l'active
	this.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

	// un tableau contenant les positions des sommets (sur CPU donc)
	var wo2 = 0.5*this.width;
	var ho2 = 0.5*this.height;

	let zTranform = Math.random()/10;

	var vertices = [
		-wo2,-ho2, -0.5 - zTranform,
		 wo2,-ho2, -0.5 - zTranform,
		 wo2, ho2, -0.5 - zTranform,
		-wo2, ho2, -0.5 - zTranform
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

    //console.log("bonus initialized");
}

Bonus.prototype.initParameters = function(x, y, type) {
	this.width = 0.033;
	this.height = 0.033;
	this.position = [x, y];
	this.type = type;
}

Bonus.prototype.setParameters = function(elapsed) {

}

Bonus.prototype.shader = function() {
	return bonusShader;
}

Bonus.prototype.sendUniformVariables = function() {
	gl.uniform2fv(bonusShader.positionUniform,this.position);
	gl.uniform1i(bonusShader.typeUniform,this.type);
}

Bonus.prototype.draw = function() {
	// active le buffer de position et fait le lien avec l'attribut aVertexPosition dans le shader
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.vertexAttribPointer(bonusShader.vertexPositionAttribute, this.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

	// active le buffer de coords
	gl.bindBuffer(gl.ARRAY_BUFFER, this.coordBuffer);
	gl.vertexAttribPointer(bonusShader.vertexCoordAttribute, this.coordBuffer.itemSize, gl.FLOAT, false, 0, 0);

	let texture = bonusTexture;

    // envoie la texture au shader
    gl.activeTexture(gl.TEXTURE0); // on active l'unite de texture 0
    gl.bindTexture(gl.TEXTURE_2D, texture); // on place maTexture dans l'unité active
    gl.uniform1i(bonusShader.textureUniform, 0); // on dit au shader que maTextureUniform se trouve sur l'unite de texture 0


    // dessine les buffers actifs
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangles);
	gl.drawElements(gl.TRIANGLES, this.triangles.numItems, gl.UNSIGNED_SHORT, 0);
}
