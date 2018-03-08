var weatherShader;

function initweatherShader() {
	weatherShader = initShaders("weather-vs","weather-fs");

    // active ce shader
    gl.useProgram(weatherShader);

    // recupere la localisation de l'attribut dans lequel on souhaite acceder aux positions
    weatherShader.vertexPositionAttribute = gl.getAttribLocation(weatherShader, "aVertexPosition");
    gl.enableVertexAttribArray(weatherShader.vertexPositionAttribute); // active cet attribut

    // pareil pour les coordonnees de texture
    weatherShader.vertexCoordAttribute = gl.getAttribLocation(weatherShader, "aVertexCoord");
    gl.enableVertexAttribArray(weatherShader.vertexCoordAttribute);

     // adresse de la texture uHeightfield dans le shader
		weatherShader.timeUniform = gl.getUniformLocation(weatherShader, "uTime");

    console.log("weather shader initialized");
}

function Weather() {
	this.initParameters();

	// cree un nouveau buffer sur le GPU et l'active
	this.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

	// un tableau contenant les positions des sommets (sur CPU donc)
	var vertices = [
		-1.0,-1.0, -1.0,
		 1.0,-1.0, -1.0,
		 1.0, 1.0, -1.0,
		-1.0, 1.0, -1.0
	];

	// on envoie ces positions au GPU ici (et on se rappelle de leur nombre/taille)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	this.vertexBuffer.itemSize = 3;
	this.vertexBuffer.numItems = 4;

	// meme principe pour les couleurs
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

    console.log("weather initialized");
}

Weather.prototype.shader = function() {
	return weatherShader;
}

Weather.prototype.initParameters = function() {
	this.timer = 0.0;
	this.time = 0.0;
}

Weather.prototype.setParameters = function(elapsed) {
	// we could animate something here
	this.timer = this.timer+elapsed*0.0004;
	this.time = (-Math.sin((this.timer + 0.5) * 5.0) + 1) * 0.5;
}

Weather.prototype.sendUniformVariables = function() {
	gl.uniform1f(weatherShader.timeUniform,this.time);
}

Weather.prototype.draw = function() {
	// active le buffer de position et fait le lien avec l'attribut aVertexPosition dans le shader
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.vertexAttribPointer(weatherShader.vertexPositionAttribute, this.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

	// active le buffer de coords
	gl.bindBuffer(gl.ARRAY_BUFFER, this.coordBuffer);
	gl.vertexAttribPointer(weatherShader.vertexCoordAttribute, this.coordBuffer.itemSize, gl.FLOAT, false, 0, 0);

	// dessine les buffers actifs
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangles);
	gl.drawElements(gl.TRIANGLES, this.triangles.numItems, gl.UNSIGNED_SHORT, 0);
}
