const segmentLength=0.07;

class MyBoxCollider extends THREE.Mesh{
    constructor(sizeX,sizeY,sizeZ){
        super();
        this.geometry=new THREE.BoxGeometry(sizeX,sizeY,sizeZ,
                                            Math.ceil(sizeX/segmentLength),
                                            Math.ceil(sizeY/segmentLength),
                                            Math.ceil(sizeZ/segmentLength));
        //this.geometry=new THREE.BoxGeometry(sizeX,sizeY,sizeZ,10,10,10);
        this.redMaterial = new THREE.MeshBasicMaterial({color:0xCF0000, transparent:true, opacity:0.4});
        this.yellowMaterial = new THREE.MeshBasicMaterial({color:0xCFFF00, transparent:true, opacity:0.4});

        this.raycaster= new THREE.Raycaster();
        this.material=this.yellowMaterial;
        this.material.transparent=true;
        this.material.opacity=0.4;
        
        this.visible=false;
    }

    checkCollision(collidableMeshList){
        var pos = this.position.clone();
        this.localToWorld( pos );

        for (var vertexIndex = 0; vertexIndex < this.geometry.vertices.length; vertexIndex++)
	    {		
            var localVertex = this.geometry.vertices[vertexIndex].clone();
            var globalVertex=this.localToWorld(localVertex);
            var directionVector = globalVertex.sub( pos );
            
            var raycaster = new THREE.Raycaster(pos, directionVector.clone().normalize());
            var collisionResults = raycaster.intersectObjects( collidableMeshList );
            
            if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) {
                return collisionResults[0].object;
            }   
        }	

        return undefined;
    }

    changeToYellow(){
        this.material=this.yellowMaterial;
    }

    changeToRed(){
        this.material=this.redMaterial;
    }

    setVisibility(visible){
        this.visible=visible;
    }
}