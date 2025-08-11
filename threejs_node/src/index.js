import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer;
let leftBellyMesh = null;
let rightBellyMesh = null;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let draggable = null; // currently dragged mesh
let dragPlane = new THREE.Plane();
let dragOffset = new THREE.Vector3();
let isDragging = false;
let originalZ = null; // store original Z on drag start

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

    // Disable user selection and dragging on canvas
    renderer.domElement.style.userSelect = 'none';
    renderer.domElement.style.webkitUserSelect = 'none';
    renderer.domElement.style.webkitTouchCallout = 'none';
    renderer.domElement.style.webkitUserDrag = 'none';

    document.body.appendChild(renderer.domElement);

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Event listeners
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
    if (event.button !== 0) return; // Left-click only
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        console.log(`🖱 Clicked object: ${clickedObject.name}`);

        if (clickedObject === leftBellyMesh || clickedObject === rightBellyMesh) {
            if (clickedObject.visible) {
                clickedObject.visible = false;
                clickedObject.raycast = () => {};
                console.log(`👀 Hid belly part: ${clickedObject.name}`);
            }
            return;
        }

        if (clickedObject.userData.draggable && clickedObject.name !== 'Plane') {
            draggable = clickedObject;
            isDragging = true;

            // Removed Z lifting, so no change here

            dragPlane.setFromNormalAndCoplanarPoint(
                camera.getWorldDirection(new THREE.Vector3()).clone().negate(),
                intersects[0].point
            );

            dragOffset.copy(intersects[0].point).sub(draggable.position);

            console.log(`🫀 Started dragging: ${clickedObject.name}`);
        }
    }
}

function onMouseMove(event) {
    if (!isDragging || !draggable) return;
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersectPoint = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
        // Move the mesh exactly to cursor, offset by dragOffset so no jump
        draggable.position.copy(intersectPoint.sub(dragOffset));
    }
}

function onMouseUp() {
    if (isDragging && draggable) {
        // Removed Z restore as well
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
