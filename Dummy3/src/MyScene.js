class MyScene extends THREE.Scene {
    constructor (myCanvas) {
        super();

        this.cameraDistance=3.0;
        this.camMinDistance=3.0;
        this.cameraHeight = 1.6;    //Altura desde la que mira la cámara
        this.cameraLookHeight = 0.8;    //Altura a la que mira la cámara
        this.cameraAspectRatio = 45;
        this.maxDistance=6;

        this.healthBar1= new THREE.Object3D();
        this.healthBar2=new THREE.Object3D();

        var robotColor1 = 0xd63232;
        var robotColor2 = 0x00b7aa;

        var ambientLightIntensity = 0.3;
        //var ambientLightColor = 0xffffff;
        //var ambientLightColor = 0x66c5ff;
        var ambientLightColor = 0x5a7dfb;
        this.spotLight;
        var spotLightIntensity = 1.0;
        this.spotLightHeight = 5;

        this.clock=new THREE.Clock();
        
        this.renderer = this.createRenderer(myCanvas);
        this.gui = this.createGUI ();
        this.pauseScreen = document.getElementById("pauseScreen");
        this.pausado = false;

        this.stats = this.createStats();
        document.body.appendChild( this.stats.domElement );

        this.keyboard = new THREEx.KeyboardState();
        this.musicaFondo = document.getElementById("musicaFondo");
        this.musicaFondo.volume = 0.1;
         
        this.robot = new MyModel();
        this.robot2 = new MyModel();

        this.robot.setColor(robotColor1);
        this.robot2.setColor(robotColor2);

        this.robot.position.set(-1,0,-0.3);
        this.robot.rotation.y=Math.PI/2;

        this.robot2.position.set(1,0,0);
        this.robot2.rotation.y=3*Math.PI/2;

        //Centro entre los dos personajes
        this.center=new THREE.Vector3(0.0,0.0,0.0);
        //Vector para calcular la dirección en la que mira la cámara
        this.camAux = new THREE.Vector3(0.0, 0.0, 0.0);
        this.camAux.subVectors(this.robot2.position, this.robot.position);
        this.camNecesitaRotacion = false;

        this.createLights (ambientLightIntensity, ambientLightColor, spotLightIntensity);
        this.createCamera ();

        //Creando suelo
        //var groundColor = 0xab7854;
        var groundColor = 0xffffff;
        this.createGround(groundColor);

        //Creando cielo
        var skyColor = 0x546bab;
        //var skyColor = 0x5a7dfb;
        //var skyColor = 0x66c5ff;
        this.createSky(skyColor);

        //Creando las nubes
        this.createClouds();

        this.add (this.robot);
        this.add (this.robot2);
    }

    //Crea las barras de vida y la cámara
    createCamera () {
        var geom=new THREE.PlaneBufferGeometry(1.5,0.1);
        var barra1=new THREE.Mesh(geom,new THREE.MeshBasicMaterial({color:0x88FF00}));

        var geomN=new THREE.PlaneBufferGeometry(1.55,0.15);
        var barraFondo1=new THREE.Mesh(geomN,new THREE.MeshBasicMaterial({color:0x000000}));

        var barra2=new THREE.Mesh(geom,new THREE.MeshBasicMaterial({color:0x88FF00}));

        var barraFondo2=new THREE.Mesh(geomN,new THREE.MeshBasicMaterial({color:0x000000}));
        
        barra1.position.x=0.75;
        barra2.position.x=-0.75;
        barraFondo1.position.set(-1.55,1,-3.01);
        barraFondo2.position.set(1.55,1,-3.01);

        this.healthBar1.add(barra1);
        this.healthBar1.add(barraFondo1);
        this.healthBar2.add(barra2);
        this.healthBar2.add(barraFondo2);

        this.healthBar1.position.set(-2.3,1,-3);
        this.healthBar2.position.set(2.3,1,-3);

        this.camera = new THREE.PerspectiveCamera(this.cameraAspectRatio, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set (0, this.cameraHeight, this.cameraDistance);
        var look = new THREE.Vector3 (0, this.cameraLookHeight, 0);
        this.camera.lookAt(look);

        this.camera.add(this.healthBar1);
        this.camera.add(this.healthBar2);
        this.camera.add(barraFondo1);
        this.camera.add(barraFondo2);

        this.add (this.camera);
    }

    createLights (ambientLightIntensity, ambientLightColor, spotLightIntensity) {
        
        var ambientLight = new THREE.AmbientLight(ambientLightColor, ambientLightIntensity);
        this.add (ambientLight);
        
        this.spotLight = new THREE.SpotLight( 0xffffff, spotLightIntensity, 0, Math.PI/8.5, 0.5, 2);
        this.spotLight.position.set( this.center.x, this.spotLightHeight, this.center.z );
        this.spotLight.target.position.set(this.center.x, this.center.y, this.center.z);
        //this.spotLight.castShadow = true;
        this.add(this.spotLight);
        this.add(this.spotLight.target);

    }

    createGround(groundColor){
        var geometryGround = new THREE.PlaneBufferGeometry( 100, 100 );
        var textureGround = new THREE.TextureLoader().load('../imgs/ground_texture891.jpg');
        textureGround.repeat.set(20,20);
        textureGround.wrapS = THREE.RepeatWrapping;
        textureGround.wrapT = THREE.RepeatWrapping;
        var materialGround = new THREE.MeshPhongMaterial ( {
            map: textureGround, 
            color:groundColor, 
        } );
        var ground = new THREE.Mesh( geometryGround, materialGround );
        //ground.receiveShadow = true;
        ground.position.y -= 0.05;
        ground.rotation.x = -Math.PI/2.0;
        this.add( ground );
    }

    createSky(skyColor){
        var geometrySky = new THREE.SphereBufferGeometry( 100, 32, 32 );
        var materialSky = new THREE.MeshPhongMaterial( { side: THREE.BackSide } );
        materialSky.emissive = new THREE.Color(skyColor);
        //materialSky.emissiveIntensity = 0.6;
        var sky = new THREE.Mesh( geometrySky, materialSky );
        this.add( sky );
    }

    createClouds(){
        var cloudGeometry = new THREE.SphereGeometry(90, 32, 32);
        var cloudTexture = new THREE.TextureLoader().load("../imgs/fair_clouds_4k.png");
        var cloudMaterial = new THREE.MeshPhongMaterial({side: THREE.BackSide});
        cloudMaterial.map = cloudTexture;
        cloudMaterial.transparent = true;
        cloudMaterial.emissive = new THREE.Color(0xffffff);
        cloudMaterial.emissiveIntensity = 0.8;
        this.cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
        this.add(this.cloudMesh);
    }

    createStats() {
        var stats = new Stats();
        stats.setMode(0);
  
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0';
        stats.domElement.style.top = '0';
  
        return stats;
    }
    
    createGUI () {
        var gui = new dat.GUI();
        
        this.guiControls = new function() {
            this.cajasOn = false;
        }
              
        var that = this;
        gui.add (this.guiControls, 'cajasOn').name('Cajas de colisión: ').listen().onChange( function (value) {
            that.robot.setBoxesVisibility(value);
            that.robot2.setBoxesVisibility(value);
        });
        
        return gui;
    }
    
    createRenderer (myCanvas) {
        
        var renderer = new THREE.WebGLRenderer();
        
        renderer.setClearColor(new THREE.Color(0xEEEEEE), 1.0);

        //renderer.shadowMap.enabled = true;
        //renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        $(myCanvas).append(renderer.domElement);
        
        return renderer;  
    }
    
    getCamera () {
        return this.camera;
    }
    
    setCameraAspect (ratio) {
        this.camera.aspect = ratio;
        this.camera.updateProjectionMatrix();
    }
    
    onWindowResize () {
        
        this.setCameraAspect (window.innerWidth / window.innerHeight);
        
        this.renderer.setSize (window.innerWidth, window.innerHeight);
    }

    checkAttackCollision(att, obj){
        var collision = {hurtB:undefined,hitB:undefined};
        var hurtB = att.getActiveHurtBoxes();
        var hitB = obj.getHitBoxes();
        var hayColision=false;
        var i =0;
        var hitBAux;

        while(i< hurtB.length && !hayColision){
            hitBAux=hurtB[i].checkCollision(hitB);
            if(hitBAux!==undefined){
                collision.hurtB=hurtB[i];
                collision.hitB=hitBAux;
                hayColision=true;
                att.deactivateHurtBoxes();
            }
            i++;
        }

        return { collision:hayColision, colliders:collision};
    }

    update () {
        
        requestAnimationFrame(() => this.update())

        TWEEN.update();

        this.cloudMesh.rotation.y += 0.0005;
        
        if(this.robot.cargado && this.robot2.cargado){
            this.robot.update();
            this.robot2.update();


            var collisionDetails1 = this.checkAttackCollision(this.robot, this.robot2);
            var collisionDetails2 = this.checkAttackCollision(this.robot2, this.robot);
            if(collisionDetails1["collision"]){
                this.robot2.receiveDamage(this.robot.direccion, collisionDetails1["colliders"]);
                this.healthBar2.scale.x=this.robot2.getHealth();
            }

            if(collisionDetails2["collision"]){
                this.robot.receiveDamage(this.robot2.direccion, collisionDetails2["colliders"]);
                this.healthBar1.scale.x=this.robot.getHealth();
            }
        

            if(this.keyboard){
                var deltaTime=this.clock.getDelta();

                if(this.keyboard.pressed("P")){
                    this.robot.pausar();
                    this.robot2.pausar();
                    //alert("JUEGO PAUSADO");
                    this.pauseScreen.style.opacity = "0.4";
                    this.musicaFondo.pause();
                    this.pausado = true;
                }
                if(this.keyboard.pressed("R")){
                    this.robot.reanudar();
                    this.robot2.reanudar();
                    this.pauseScreen.style.opacity = "0.0";
                    this.musicaFondo.play();
                    this.pausado = false;
                }

                if(!this.pausado){
                    if(this.keyboard.pressed("up")){
                        this.robot.saltar();
                    }
                    if(this.keyboard.pressed("down")){
                        this.robot.agachar();
                    }
                    if(this.keyboard.pressed("left") && !this.keyboard.pressed("right")){
                        this.robot.andarAtras();
    
                        var v=this.robot.position.clone();            
                        v.subVectors(this.robot2.position,v);
                        var dist=v.length();
    
                        if(dist>this.maxDistance){
                            this.robot.position.x += this.robot.direccion.x*deltaTime*this.robot.getMoveSpeed();
                            this.robot.position.y += this.robot.direccion.y*deltaTime*this.robot.getMoveSpeed();
                            this.robot.position.z += this.robot.direccion.z*deltaTime*this.robot.getMoveSpeed();
                        }
                        
                    }
                    if(this.keyboard.pressed("right") && !this.keyboard.pressed("left")){
                        this.robot.andarAdelante();
    
                        var v=this.robot.position.clone();         
                        v.subVectors(this.robot2.position,v);
                        var dist=v.length();
    
                        if(dist<=0.5){
                            this.robot.position.x -= this.robot.direccion.x*deltaTime*this.robot.getMoveSpeed();
                            this.robot.position.y -= this.robot.direccion.y*deltaTime*this.robot.getMoveSpeed();
                            this.robot.position.z -= this.robot.direccion.z*deltaTime*this.robot.getMoveSpeed();
                        }
                    }
                    if(!this.keyboard.pressed("down") ){
                        this.robot.levantarse();
                    }
                    if( !this.keyboard.pressed("right") && !this.keyboard.pressed("left") && !this.keyboard.pressed("up") && !this.keyboard.pressed("down")){
                        this.robot.detener();
                    }
                    if( this.keyboard.pressed("right") && this.keyboard.pressed("left") && !this.keyboard.pressed("up") && !this.keyboard.pressed("down")){
                        this.robot.detener();
                    }
                    if(this.keyboard.pressed("A")){
                        this.robot.pegarPunietazo();
                    }
                    if(this.keyboard.pressed("Z")){
                        this.robot.pegarPatada();
                    }

                    this.robot.actualizarMoveClock();
                    this.robot2.actualizarMoveClock();

                }
    
            }

            if(this.robot.necesitaRotacion){
                this.robot.lookAt(this.robot2.position);
                this.robot2.lookAt(this.robot.position);
    
                this.robot.direccion=this.robot.position.clone(); 
                this.robot.direccion.subVectors(this.robot2.position, this.robot.direccion);
                this.robot.direccion.normalize();
                var aux = new THREE.Vector3();
                aux.crossVectors(this.robot.direccion, new THREE.Vector3(0,1,0));
                this.robot.position.sub( aux.multiplyScalar(0.3) );
    
                this.robot.necesitaRotacion=false;
                this.camNecesitaRotacion = true;
            }
                
        }

        this.renderer.render (this, this.getCamera());

        this.updateCamera();

        this.spotLight.position.set( this.center.x, this.spotLightHeight, this.center.z );
        this.spotLight.target.position.set(this.center.x, this.center.y, this.center.z);

        this.stats.update();
    }

    updateCamera(){
        var v=this.robot.position.clone();

        v.subVectors(this.robot2.position,v);
        var dist=v.length();

        if(dist>(this.camMinDistance+1))
            this.cameraDistance=(dist-(this.camMinDistance+1))*0.7+this.camMinDistance;

        this.center.addVectors(this.robot2.position,this.robot.position);
        
        if(this.camNecesitaRotacion){
            var t_1 = { x:this.camAux.x, y:this.camAux.y, z:this.camAux.z };
            var t_f = { x : v.x, y : v.y, z : v.z };
            var that = this;
            var camAnimation;
            camAnimation = new TWEEN.Tween(t_1).to(t_f, 550).onUpdate( () => {
                that.camAux.x = t_1.x;
                that.camAux.y = t_1.y;
                that.camAux.z = t_1.z;
            }).start();
            this.camNecesitaRotacion = false;
        }

        v.crossVectors(this.camAux, new THREE.Vector3(0,1,0));
        v.normalize();

        this.center.divideScalar(2);
        this.center.y=this.cameraLookHeight;

        this.camera.position.set(this.cameraDistance*v.x+this.center.x, this.cameraHeight, this.cameraDistance*v.z+this.center.z);
        this.camera.lookAt(this.center);
        
    }
}


$(function () {
    
    var scene = new MyScene("#WebGL-output");

    window.addEventListener ("resize", () => scene.onWindowResize());
    
    scene.update();
});
