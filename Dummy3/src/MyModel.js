const STATES = {
    idle : 0,
    right : 1,
    left : 2,
    up : 3,
    down : 4,
    golpeando : 5,
    saltando : 6,
    bloqueando : 7,
    agachado : 8, 
    rotando : 9, 
    corriendoDcha : 10,
    corriendoIzda :11,
    recuperando : 12
}

class MyModel extends THREE.Object3D {
    constructor() {
        super();

        this.moveSpeed=1.2;
        this.model, this.skeleton;
        this.mixer, this.actions;
        this.color = new THREE.Color(0xffffff);
        this.hurtBox,this.hitBox;
        //Dirección en la que mira el personaje
        this.direccion = new THREE.Vector3(1.0, 0.0, 0.0);

        this.health=1;

        this.necesitaRotacion=false;
        
        this.animationClock = new THREE.Clock();
        this.stateClock = new THREE.Clock();
        this.moveClock = new THREE.Clock();
        this.maxStepDelay = 0.3;
        //this.maxJumpDelay = 0.25;
        this.paused = false;

        this.initStates();
        
        var diferidos=[];
        this.cargado=false;
        diferidos.push(this.initModel());
        $.when.apply(this,diferidos).done( () => {
            this.initColliders(); 
            /*this.traverseVisible(function(unNodo){
                unNodo.castShadow = true;
            });*/
            this.cargado=true;
        });
    }

    initModel(){
        var metodoDiferido = $.Deferred();

        var gltfPath = "../models/mannequin_female.glb";
        var that = this;
        var gltfLoader = new GLTFLoader();
        gltfLoader.load(gltfPath, 
            function(gltf){

                that.model = gltf.scene;
                that.model.children[0].children[3].material.color = that.color;
                that.add( that.model );

                that.skeleton = that.model.children[0].children[3].skeleton;

                var animations = gltf.animations;
                that.mixer = new THREE.AnimationMixer( that.model );
                //that.mixer.timeScale = 0.5;

                that.actions = {};

                for( let i=1; i<animations.length; i++){
                    if(animations[i].name == "Botar" || animations[i].name == "AndarAtras" || animations[i].name == "AndarAdelante"
                        || animations[i].name== "CorreAdelante" || animations[i].name == "CorrerAtras"){
                        
                        that.actions[animations[i].name]= that.mixer.clipAction(animations[i]);
                        that.actions[animations[i].name].setLoop (THREE.LoopRepeat, Infinity );
                    }else{
                        that.actions[animations[i].name]= that.mixer.clipAction(animations[i]);
                        that.actions[animations[i].name].setLoop (THREE.LoopOnce, Infinity );
                        that.actions[animations[i].name].clampWhenFinished = true;
                    }
                    if(animations[i].name == "Agacharse"){
                        that.actions[animations[i].name].setLoop (THREE.LoopOnce, Infinity );
                        that.actions[animations[i].name].clampWhenFinished = true;
                    }
                    if(animations[i].name == "CambioPlanoDerecha" || animations[i].name == "CambioPlanoIzquierda"){
                        that.actions[animations[i].name].clampWhenFinished = false;
                    }
                } 

                that.mixer.addEventListener('finished', (event)=>{
                    switch(event.action.getClip().name){
                        case "Patada":
                            that.deactivateHurtBoxes();
                            that.actions["Botar"]._effectiveWeight=0.0;
                            event.action.crossFadeTo(that.actions["Botar"], 0.2, false);
                            that.actions["Botar"].play();
                            that.state.combatState = STATES.recuperando;
                            break;
                        case "Puño1":
                            that.deactivateHurtBoxes();
                            that.actions["Botar"]._effectiveWeight=0.0;
                            event.action.crossFadeTo(that.actions["Botar"], 0.2, false);
                            that.actions["Botar"].play();
                            that.state.combatState = STATES.recuperando;
                            break;
                        case "Agacharse":
                            break;
                        case "Salto":
                            that.actions["Botar"].play();
                            event.action.stop();
                            that.state.bodyState = STATES.idle;
                            //that.state.lastMove = STATES.idle;
                            break;
                        case "CambioPlanoIzquierda":
                            var hipsPosition = that.skeleton.getBoneByName("Hips").localToWorld(new THREE.Vector3(0,0,0));
                            event.action.stop();
                            that.position.x = hipsPosition.x;
                            that.position.z = hipsPosition.z;
                            that.necesitaRotacion=true;
                            that.state.combatState = STATES.idle;
                            break;
                        case "CambioPlanoDerecha":
                            var hipsPosition = that.skeleton.getBoneByName("Hips").localToWorld(new THREE.Vector3(0,0,0));
                            event.action.stop();
                            that.position.x = hipsPosition.x;
                            that.position.z = hipsPosition.z;

                            var aux = new THREE.Vector3();
                            aux.crossVectors(that.direccion, new THREE.Vector3(0,1,0));
                            that.position.add( aux.normalize().multiplyScalar(0.3) );
                            
                            that.necesitaRotacion=true;
                            that.state.combatState = STATES.idle;
                            break;
                        case "RecibirGolpeFuerte":
                            that.actions["LevantarseSueloBien"].reset();
                            that.actions["LevantarseSueloBien"].play();
                            event.action.stop();
                            break;
                        case "RecibeGolpeDebilTorso":
                            that.actions["Botar"].play();
                            event.action.stop();
                            break;
                        case "LevantarseSueloBien":
                            that.actions["Botar"].play();
                            event.action.stop();
                            break;
                        default:
                            //that.deactivateHurtBoxes();
                            //that.actions["Botar"].play();
                            //event.action.stop();
                            break;
                    }
                });
                
                that.actions["Botar"].play();
                //console.log(that.actions);
                animate();
                metodoDiferido.resolve();
            }, null, null);

        function animate() {
            var dt = that.animationClock.getDelta();
            if ( that.mixer ) that.mixer.update( dt );
            requestAnimationFrame( animate );
        }
        return metodoDiferido.promise();
    } 

    initStates(){
        this.state={
            lastMove : STATES.idle,     //idle, left, right, up, down
            bodyState : STATES.idle,    //idle, saltando, agachado, corriendoIzda, corriendoDcha
            combatState : STATES.idle,   //idle, bloqueando, golpeando, rotando, recuperando
            signalReceived : false       //false, true ---> si se ha pulsado alguna tecla en el frame anterior
        }
    }

    initColliders(){
        this.hitBox=[];
        this.hurtBox=[];
        this.activeHurtBoxes=[];

        //Hurt Box:
        //0 Mano derecha
        //1 Mano izquierda
        //2 Espinilla derecha
        //3 Espinilla izquierda
        //4 Pierna derecha
        //5 Pierna izquierda

        this.hurtBox.push(new MyBoxCollider(0.1,0.25,0.1));
        this.skeleton.getBoneByName("RightHand").add(this.hurtBox[0]);
        this.hurtBox[0].position.y = -0.03;
        
        this.hitBox.push(new MyBoxCollider(0.25,0.5,0.25));
        this.skeleton.getBoneByName("Spine1").add(this.hitBox[0]);
        
        this.hurtBox.push(new MyBoxCollider(0.1,0.25,0.1));
        this.skeleton.getBoneByName("LeftHand").add(this.hurtBox[1]);
        this.hurtBox[1].position.y = -0.03;
        
        this.hitBox.push(new MyBoxCollider(0.2,0.2,0.2));
        this.skeleton.getBoneByName("Head").add(this.hitBox[1]);
        this.hitBox[1].position.y=0.09;
        this.hitBox[1].position.z=0.03;

        this.hitBox.push(new MyBoxCollider(0.1,0.5,0.1));
        this.skeleton.getBoneByName("RightLeg").add(this.hitBox[2]);
        this.hitBox[2].position.y=0.25;
        
        this.hitBox.push(new MyBoxCollider(0.1,0.5,0.1));
        this.skeleton.getBoneByName("LeftLeg").add(this.hitBox[3]);
        this.hitBox[3].position.y=0.25;

        this.hurtBox.push(new MyBoxCollider(0.1,0.5,0.1));
        this.skeleton.getBoneByName("RightLeg").add(this.hurtBox[2]);
        this.hurtBox[2].position.y=0.25;

        this.hurtBox.push(new MyBoxCollider(0.1,0.5,0.1));
        this.skeleton.getBoneByName("LeftLeg").add(this.hurtBox[3]);
        this.hurtBox[3].position.y=0.25;

        this.hitBox.push(new MyBoxCollider(0.15,0.5,0.15));
        this.skeleton.getBoneByName("RightUpLeg").add(this.hitBox[4]);
        this.hitBox[4].position.y=0.2;
        
        this.hitBox.push(new MyBoxCollider(0.15,0.5,0.15));
        this.skeleton.getBoneByName("LeftUpLeg").add(this.hitBox[5]);
        this.hitBox[5].position.y=0.2;

        this.hurtBox.push(new MyBoxCollider(0.15,0.5,0.15));
        this.skeleton.getBoneByName("RightUpLeg").add(this.hurtBox[4]);
        this.hurtBox[4].position.y=0.2;
        
        this.hurtBox.push(new MyBoxCollider(0.15,0.5,0.15));
        this.skeleton.getBoneByName("LeftUpLeg").add(this.hurtBox[5]);
        this.hurtBox[5].position.y=0.2;
    }

    setBoxesVisibility(visibility){
        if(this.cargado){
            for(let i=0; i<this.hitBox.length; i++){
                this.hitBox[i].setVisibility(visibility);
            }
    
            for(let i=0; i<this.hurtBox.length; i++){
                this.hurtBox[i].setVisibility(visibility);
            }
        }
        
    }

    setColor(color){
        this.color = new THREE.Color(color);
        if(this.cargado){
            this.model.children[0].children[3].material.color = this.color;
        }
    }

    deactivateHurtBoxes(){
        this.activeHurtBoxes=[];
    }

    getHealth(){
        return this.health;
    }

    update () { 
        if(this.cargado){
            for(let i=0; i<this.hitBox.length;i++)
                this.hitBox[i].changeToYellow();
            if(this.state.combatState==STATES.recuperando){
                //console.log(this.actions["Botar"]._effectiveWeight)
                if(this.actions["Botar"].getEffectiveWeight()==1.0)
                    this.state.combatState=STATES.idle;
            }
        }
        //console.log(this.model.position);
    }

    getHitBoxes(){
        return this.hitBox;
    }

    getActiveHurtBoxes(){
        return this.activeHurtBoxes;
    }

    receiveDamage(direccion, collision){
        collision["hitB"].changeToRed();
        this.position.x += direccion.x*0.1;
        this.position.y += direccion.y*0.1;
        this.position.z += direccion.z*0.1;

        this.health-=0.1;
        if(this.health<0)
            this.health=0;

        switch(collision["hurtB"].type){
            case 0:
                this.actions["Botar"].stop();
                this.actions["RecibeGolpeDebilTorso"].reset();
                this.actions["RecibeGolpeDebilTorso"].play();
                break;
            case 1:
                this.actions["Botar"].stop();
                this.actions["LevantarseSueloBien"].stop();
                this.actions["RecibirGolpeFuerte"].reset();
                this.actions["RecibirGolpeFuerte"].play();
                break;
        }
    }

    pegarPatada(){
        if(this.state.combatState == STATES.idle && this.state.bodyState != STATES.saltando && this.state.bodyState != STATES.agachado){
            this.state.lastMove=STATES.idle;
            this.state.combatState = STATES.golpeando;
            
            this.activeHurtBoxes.push(this.hurtBox[2]);
            for(let i=0; i<this.activeHurtBoxes.length; i++)
                this.activeHurtBoxes[i].type=1;

            this.actions["Botar"].stop();
            this.actions["AndarAdelante"].stop();
            this.actions["AndarAtras"].stop();
            this.actions["CorreAdelante"].stop();
            this.actions["CorrerAtras"].stop();
            this.actions["Patada"].reset();
            this.actions["Patada"].play();
        }
    }

    pegarPunietazo(){
        if(this.state.combatState == STATES.idle && this.state.bodyState != STATES.saltando && this.state.bodyState != STATES.agachado){
            this.state.lastMove=STATES.idle;
            this.state.combatState = STATES.golpeando;
            
            this.activeHurtBoxes.push(this.hurtBox[0]);
            for(let i=0; i<this.activeHurtBoxes.length; i++)
                this.activeHurtBoxes[i].type=0;

            this.actions["Botar"].stop();
            this.actions["AndarAdelante"].stop();
            this.actions["AndarAtras"].stop();
            this.actions["CorreAdelante"].stop();
            this.actions["CorrerAtras"].stop();
            this.actions["Puño1"].reset();
            this.actions["Puño1"].play();
        }
    }

    getMoveSpeed(){
        var speed = this.moveSpeed;
        if(this.state.bodyState == STATES.corriendoIzda || this.state.bodyState == STATES.corriendoDcha){
            speed *= 2.75;
        }
        return speed;
    }

    actualizarMoveClock(){
        this.moveClock.getDelta();
    }

    actualizarStateClock(){
        this.stateClock.getDelta();
    }

    andarAdelante(){
        if(this.state.combatState == STATES.idle){
            if(this.lastMove==STATES.left)
                this.actions["AndarAtras"].stop();
            if(this.state.lastMove == STATES.right && !this.state.signalReceived){
                var delta = this.stateClock.getDelta();
                if(delta<this.maxStepDelay){
                    this.state.bodyState = STATES.corriendoDcha;
                    this.state.lastMove = STATES.idle;
                    this.actions["Botar"].stop();
                    this.actions["CorreAdelante"].reset();
                    this.actions["CorreAdelante"].play();
                    timeScale*=2;
                }else{
                    this.actualizarStateClock();
                    this.actions["Botar"].stop();
                    this.actions["AndarAdelante"].reset();
                    this.actions["AndarAdelante"].play();
                }
            }else{
                if(this.state.bodyState == STATES.idle && this.state.lastMove != STATES.right){
                    this.actualizarStateClock();
                    this.state.lastMove = STATES.right;
                    this.actions["Botar"].stop();
                    this.actions["AndarAdelante"].reset();
                    this.actions["AndarAdelante"].play();
                }
            }
            if(this.state.bodyState != STATES.agachado){
                var deltaTime = this.moveClock.getDelta();
                this.position.x += this.direccion.x*deltaTime*this.getMoveSpeed();
                this.position.y += this.direccion.y*deltaTime*this.getMoveSpeed();
                this.position.z += this.direccion.z*deltaTime*this.getMoveSpeed();
            }
            
        }

        this.state.signalReceived = true;
    }

    andarAtras(){
        if(this.state.combatState == STATES.idle){
            if(this.lastMove==STATES.right)
                this.actions["AndarAdelante"].stop();
            if(this.state.lastMove == STATES.left && !this.state.signalReceived){
                var delta = this.stateClock.getDelta();
                if(delta<this.maxStepDelay){
                    this.state.bodyState = STATES.corriendoIzda;
                    this.state.lastMove = STATES.idle;
                    this.actions["Botar"].stop();
                    this.actions["CorrerAtras"].reset();
                    this.actions["CorrerAtras"].play();
                }else{
                    this.actualizarStateClock();
                    this.actions["Botar"].stop();
                    this.actions["AndarAtras"].reset();
                    this.actions["AndarAtras"].play();
                }
            }else{
                if(this.state.bodyState == STATES.idle && this.state.lastMove != STATES.left){
                    this.actualizarStateClock();
                    this.state.lastMove = STATES.left;
                    this.actions["Botar"].stop();
                    this.actions["AndarAtras"].reset();
                    this.actions["AndarAtras"].play();
                }
            }
            if(this.state.bodyState != STATES.agachado){
                var deltaTime = this.moveClock.getDelta();
                this.position.x -= this.direccion.x*deltaTime*this.getMoveSpeed();
                this.position.y -= this.direccion.y*deltaTime*this.getMoveSpeed();
                this.position.z -= this.direccion.z*deltaTime*this.getMoveSpeed();
            }
        }

        this.state.signalReceived = true;
    }

    saltar(){
        if(this.state.combatState == STATES.idle){
            if(this.state.lastMove == STATES.up && !this.state.signalReceived){
                var delta = this.stateClock.getDelta();
                if(delta<this.maxStepDelay){
                    this.state.combatState = STATES.rotando;
                    this.state.lastMove = STATES.idle;
                    this.state.bodyState = STATES.idle;
                    this.actions["Botar"].stop();
                    this.actions["Salto"].stop();
                    this.actions["AndarAdelante"].stop();
                    this.actions["AndarAtras"].stop();
                    this.actions["CorreAdelante"].stop();
                    this.actions["CorrerAtras"].stop();
                    this.actions["CambioPlanoIzquierda"].reset();
                    this.actions["CambioPlanoIzquierda"].play();
                }else{
                    this.actualizarStateClock();
                    this.state.lastMove = STATES.idle;
                }
            }else{
                //if(this.state.bodyState == STATES.idle && this.state.lastMove != STATES.up){
                if(this.state.bodyState == STATES.idle 
                  || this.state.bodyState == STATES.corriendoDcha 
                  || this.state.bodyState == STATES.corriendoIzda ){

                    this.actualizarStateClock();
                    this.state.lastMove = STATES.up;
                    this.state.bodyState = STATES.saltando;
                    this.actions["Botar"].stop();
                    this.actions["Salto"].reset();
                    this.actions["Salto"].play();
                    this.actions["AndarAdelante"].stop();
                    this.actions["AndarAtras"].stop();
                    this.actions["CorreAdelante"].stop();
                    this.actions["CorrerAtras"].stop();
                }
            }
        }

        this.state.signalReceived = true;
    }

    agachar(){
        if(this.state.combatState == STATES.idle){
            if(this.state.lastMove == STATES.down && !this.state.signalReceived){
                var delta = this.stateClock.getDelta();
                if(delta<this.maxStepDelay){
                    this.state.combatState = STATES.rotando;
                    this.state.lastMove = STATES.idle;
                    this.state.bodyState = STATES.idle;
                    this.actions["Botar"].stop();
                    this.actions["AndarAdelante"].stop();
                    this.actions["AndarAtras"].stop();
                    this.actions["CorreAdelante"].stop();
                    this.actions["CorrerAtras"].stop();
                    this.actions["Agacharse"].stop();
                    this.actions["CambioPlanoDerecha"].reset();
                    this.actions["CambioPlanoDerecha"].play();
                }else{
                    this.actualizarStateClock();
                    this.state.lastMove = STATES.idle;
                }
            }else{
                //if(this.state.bodyState == STATES.idle && this.state.lastMove != STATES.down){
                if(this.state.bodyState == STATES.idle ){
                    this.actualizarStateClock();
                    this.state.lastMove = STATES.down;
                    this.state.bodyState = STATES.agachado;
                    this.actions["Botar"].stop();
                    this.actions["Agacharse"].reset();
                    this.actions["Agacharse"].play();
                }
            }
        }

        this.state.signalReceived = true;
    }

    levantarse(){
        if(this.state.bodyState == STATES.agachado){
            this.state.bodyState = STATES.idle;
            this.actions["Agacharse"].crossFadeTo(this.actions["Botar"], 0.2, false);
            this.actions["Botar"].play();
        }
    }

    detener(){
        if(this.state.combatState==STATES.idle){
            if(this.state.bodyState == STATES.corriendoIzda || this.state.bodyState == STATES.corriendoDcha || this.state.bodyState == STATES.agachado){
                this.state.bodyState = STATES.idle;
            }

            if(this.state.bodyState == STATES.idle){
                this.actions["Botar"].play();
            }else{
                this.actions["Botar"].stop();
            }

            this.actions["AndarAdelante"].stop();
            this.actions["AndarAtras"].stop();
            this.actions["CorreAdelante"].stop();
            this.actions["CorrerAtras"].stop();
            /*if(this.state.bodyState = STATES.agachado){
                this.actions["Abajo"].crossFadeTo(that.actions["Botar"], 0.2, false);
            }*/
            
        }
        this.state.signalReceived = false;
    }

    pausar(){
        if(!this.paused){
            this.mixer.timeScale = 0.0;
            this.stateClock.stop();
            this.moveClock.stop();
            this.paused = true;
        }
    }

    reanudar(){
        if(this.paused){
            this.mixer.timeScale = 1.0;
            this.stateClock.start();
            this.moveClock.start();
            this.paused = false;
        }
        
    }

}