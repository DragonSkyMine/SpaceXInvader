var ennemiShader;

function initEnnemiShader() {
	ennemiShader = initShaders("ennemi-vs","ennemi-fs");

    // active ce shader
    gl.useProgram(ennemiShader);

    // recupere la localisation de l'attribut dans lequel on souhaite acceder aux positions
    ennemiShader.vertexPositionAttribute = gl.getAttribLocation(ennemiShader, "aVertexPosition");
    gl.enableVertexAttribArray(ennemiShader.vertexPositionAttribute); // active cet attribut

    // pareil pour les coordonnees de texture
    ennemiShader.vertexCoordAttribute = gl.getAttribLocation(ennemiShader, "aVertexCoord");
    gl.enableVertexAttribArray(ennemiShader.vertexCoordAttribute);

     // adresse de la variable uniforme uOffset dans le shader
    ennemiShader.positionUniform = gl.getUniformLocation(ennemiShader, "uPosition");

    // adresse de la variable uniforme uTexture dans le shader
    ennemiShader.textureUniform = gl.getUniformLocation(ennemiShader, "uTexture");

    console.log("ennemi shader initialized");
}

var ennemiTexture;

function initEnnemiTexture() {
    // creation de la texture
    ennemiTexture = gl.createTexture();
    ennemiTexture.image = new Image();
    ennemiTexture.image.onload = function () {
        // active la texture (les operations qui suivent feront effet sur celle-ci)
        gl.bindTexture(gl.TEXTURE_2D, ennemiTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        // envoie les donnees sur GPU
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ennemiTexture.image);

        // options (filtrage+effets de bordure)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.generateMipmap(gl.TEXTURE_2D, gl.LINEAR_MIPMAP_LINEAR);

        // desactive la texture courante
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    ennemiTexture.image.src = "img/ennemi.png";
}

function Ennemi(fireType, missileSpeed, reloadTime) {
	this.initParameters(fireType, missileSpeed, reloadTime);

	// cree un nouveau buffer sur le GPU et l'active
	this.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

	// un tableau contenant les positions des sommets (sur CPU donc)
	var wo2 = 0.5*this.width;
	var ho2 = 0.5*this.height;

	var vertices = [
		-wo2,-ho2, -0.6,
		 wo2,-ho2, -0.6,
		 wo2, ho2, -0.6,
		-wo2, ho2, -0.6
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

    console.log("ennemi initialized");
}

Ennemi.prototype.initParameters = function(fireType, missileSpeed, reloadTime) {
	this.width = 0.25;
	this.height = 0.25;
	this.position = [0.0,-0.7];
	this.timer = 0.0;

	// Type de tirs
	this.fireType = fireType;

    // temps de rechagement (ms)
    this.reloadTime = reloadTime;

    // vitesse du missile
    this.missileSpeed = missileSpeed;

    this.missiles = []; // Les missiles
    this.timeBeforeNextFire = 0;
}

Ennemi.prototype.setParameters = function(elapsed) {
	// on pourrait animer des choses ici
	this.timer = this.timer+elapsed*0.0004;
	var posX = Math.sin((this.timer*0.1 + 0.5) * 75.0) *5.0 + 0.25;
	this.position[0] =  this.initX + posX/50;
	this.position[1] -= 1 * elapsed/1000;
}

Ennemi.prototype.fireMissile = function(elapsed, joueurPosition) {
	// on pourrait animer des choses ici

    // test des tirs
    this.timeBeforeNextFire -= elapsed;
    if (this.timeBeforeNextFire <= 0) {
        let positionTireMissile = [this.position[0], this.position[1] - this.height/2];

        if (this.fireType === 1){
            // Type 1 : tire sur le joueur

            // calcule des vitesses pour atteindre le joueur
            let vectorMissile = [0, this.missileSpeed];
            let vectorJoueur = [joueurPosition[0] - positionTireMissile[0], joueurPosition[1] - positionTireMissile[1]];
            let cosVector = (vectorMissile[1]*vectorJoueur[1]) / (vectorMissile[1] * Math.sqrt(vectorJoueur[0]**2+vectorJoueur[1]**2));
            let sinVector = (vectorMissile[1]*vectorJoueur[0]) / (vectorMissile[1] * Math.sqrt(vectorJoueur[0]**2+vectorJoueur[1]**2));
            let speedMissile = [sinVector * this.missileSpeed, cosVector * this.missileSpeed];

            this.missiles.push(new Missile(positionTireMissile[0], positionTireMissile[1], speedMissile[0], speedMissile[1]));
        }else if (this.fireType === 2) {
            // Type 2 : tire droit

            this.missiles.push(new Missile(positionTireMissile[0], positionTireMissile[1], 0, -this.missileSpeed));
        }else if (this.fireType === 3) {
            // Type 3 : 3 tirs en cône

            this.missiles.push(new Missile(positionTireMissile[0], positionTireMissile[1], 0, -this.missileSpeed));
            this.missiles.push(new Missile(positionTireMissile[0], positionTireMissile[1], -this.missileSpeed*0.1, -this.missileSpeed*0.9));
            this.missiles.push(new Missile(positionTireMissile[0], positionTireMissile[1], this.missileSpeed*0.1, -this.missileSpeed*0.9));
        }

        this.timeBeforeNextFire = this.reloadTime;
    }
}

Ennemi.prototype.setPosition = function(x,y) {
	this.position = [x,y];
}

Ennemi.prototype.removeMissile = function(missileIndex) {
    this.missiles.splice(missileIndex, 1);
}

Ennemi.prototype.shader = function() {
	return ennemiShader;
}

Ennemi.prototype.sendUniformVariables = function() {
	gl.uniform2fv(ennemiShader.positionUniform,this.position);
}

Ennemi.prototype.draw = function() {
	// active le buffer de position et fait le lien avec l'attribut aVertexPosition dans le shader
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.vertexAttribPointer(ennemiShader.vertexPositionAttribute, this.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

	// active le buffer de coords
	gl.bindBuffer(gl.ARRAY_BUFFER, this.coordBuffer);
	gl.vertexAttribPointer(ennemiShader.vertexCoordAttribute, this.coordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // envoie la texture au shader
    gl.activeTexture(gl.TEXTURE0); // on active l'unite de texture 0
    gl.bindTexture(gl.TEXTURE_2D, ennemiTexture); // on place maTexture dans l'unité active
    gl.uniform1i(ennemiShader.textureUniform, 0); // on dit au shader que maTextureUniform se trouve sur l'unite de texture 0


    // dessine les buffers actifs
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangles);
	gl.drawElements(gl.TRIANGLES, this.triangles.numItems, gl.UNSIGNED_SHORT, 0);
}
