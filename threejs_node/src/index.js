import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer;
let leftBellyMesh = null;
let rightBellyMesh = null;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let draggable = null; // currently dragged object
let dragPlane = new THREE.Plane();
let dragOffset = new THREE.Vector3();
let isDragging = false;
let organMeshes = []; // store all draggable organ meshes

init();
loadGLB();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Add CSS styles directly to the canvas element
    renderer.domElement.style.userSelect = 'none';
    renderer.domElement.style.webkitUserSelect = 'none';
    renderer.domElement.style.webkitTouchCallout = 'none';
    renderer.domElement.style.webkitUserDrag = 'none';

    document.body.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Prevent context menu while dragging
    window.addEventListener('contextmenu', (e) => {
        if (isDragging) e.preventDefault();
    });
}

function loadGLB() {
    const loader = new GLTFLoader();
    loader.load(
        '/organ_drag_drop_trial.glb',
        (gltf) => {
            console.log("✅ GLB loaded:", gltf.scene);

            const box = new THREE.Box3().setFromObject(gltf.scene);
            const center = box.getCenter(new THREE.Vector3());
            gltf.scene.position.sub(center);

            const size = box.getSize(new THREE.Vector3()).length();
            const scale = 2 / size;
            gltf.scene.scale.setScalar(scale);

            gltf.scene.rotation.x = THREE.MathUtils.degToRad(-110);

            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    console.log("🟢 Mesh found:", child.name);

                    if (child.name === "left_belly") leftBellyMesh = child;
                    if (child.name === "right_belly") rightBellyMesh = child;

                    if (!(child.name.includes("belly"))) {
                        child.userData.draggable = true;
                        organMeshes.push(child); // save draggable organ
                    }
                }
            });

            scene.add(gltf.scene);
        },
        undefined,
        (error) => {
            console.error("❌ Error loading GLB:", error);
        }
    );
}

function onMouseDown(event) {
    if (event.button !== 0) return;  // Only proceed for left click

    event.preventDefault();  // Prevent default to avoid browser drag UI

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        console.log(`🖱 Clicked object: ${clickedObject.name}`);

        // Hide belly parts (no drag)
        if (clickedObject === leftBellyMesh || clickedObject === rightBellyMesh) {
            if (clickedObject.visible) {
                clickedObject.visible = false;
                clickedObject.raycast = () => {};
                console.log(`👀 Hid belly part: ${clickedObject.name}`);
            }
            return;
        }

        // Start dragging organs (exclude "Plane" if needed)
        if (clickedObject.userData.draggable && clickedObject.name !== 'Plane') {
            draggable = clickedObject;
            isDragging = true;  // <<<<< IMPORTANT: set dragging state here!

            dragPlane.setFromNormalAndCoplanarPoint(
                camera.getWorldDirection(new THREE.Vector3()).negate(),
                draggable.position
            );

            const intersectPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(dragPlane, intersectPoint);
            dragOffset.copy(intersectPoint).sub(draggable.position);

            console.log(`🫀 Started dragging: ${clickedObject.name}`);
        }
    }
}

function onMouseMove(event) {
    if (!isDragging || !draggable) return;

    event.preventDefault();  // Prevent default to avoid unwanted text selection / drag UI

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersectPoint = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
        const newPos = intersectPoint.sub(dragOffset);
        draggable.position.copy(newPos);
        // Optional debug log: uncomment below if needed
        // console.log(`⬆️ Moving ${draggable.name} to`, newPos);
    }
}

function onMouseUp() {
    if (isDragging && draggable) {
        console.log(`🛑 Dropped: ${draggable.name}`);
        draggable = null;
    }
    isDragging = false;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
