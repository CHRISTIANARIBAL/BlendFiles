
// import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let scene, camera, renderer, controls;
let selectedMesh = null;

init();
animate();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 10, 0);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = 0;
  controls.enableRotate = false;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.update();

  const light = new THREE.HemisphereLight(0xffffff, 0x444444);
  light.position.set(0, 20, 0);
  scene.add(light);

  const loader = new GLTFLoader();
  loader.load('nigana_nga_animate.glb', function(gltf) {
    const model = gltf.scene;
    model.traverse(function(child) {
      if (child.isMesh) {
        if (child.name.includes("Slice_Area")) {
          // Make it clickable without visible outline
          child.userData.isTrigger = true;
        } else if (child.morphTargetInfluences) {
          selectedMesh = child;
        }
      }
    });
    scene.add(model);
  });

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  window.addEventListener('click', function(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    for (let i = 0; i < intersects.length; i++) {
      const obj = intersects[i].object;
      if (obj.userData.isTrigger && selectedMesh) {
        selectedMesh.morphTargetInfluences[0] = 1; // Trigger shape key
        break;
      }
    }
  }, false);

  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
