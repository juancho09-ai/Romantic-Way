// ESCENA
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// CÁMARA
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 50, 140); 

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// CONFIGURACIÓN DE CONTROLES CON EL RATÓN (Nota que ahora se usa THREE.OrbitControls)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; 
controls.dampingFactor = 0.05;
controls.maxDistance = 300;    
controls.minDistance = 20;     

// 🛠️ PARÁMETROS PARA LA GALAXIA EN FORMA DE CORAZÓN
const parameters = {
    count: 160000,          // Mantener alta densidad para el brillo central
    size: 0.65,             
    radius: 7,              // Reducimos la escala del radio base porque las fórmulas de corazón usan valores pequeños
    branches: 4,            // Brazos que se van a moldear dentro del corazón
    spin: 0.8,              // Giro sutil para que no deforme la silueta del corazón
    randomness: 0.25,       // Dispersión controlada para que se note la forma
    randomnessPower: 4.0,   
    colorInside: '#ffffff', // Centro blanco brillante
    colorOutside: '#ec4899' // Bordes exteriores rosa/magenta para temática de corazón
};

const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(parameters.count * 3);
const colors = new Float32Array(parameters.count * 3);

const colorInside = new THREE.Color(parameters.colorInside);
const colorOutside = new THREE.Color(parameters.colorOutside);

for (let i = 0; i < parameters.count; i++) {
    // 1. Progresión del tamaño desde el centro hacia afuera
    const progress = Math.pow(Math.random(), 2.0); 
    const currentRadius = progress * parameters.radius;

    // 2. Ángulo base para la forma y los brazos
    const branchAngle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2;
    const spinAngle = currentRadius * parameters.spin;
    const totalAngle = branchAngle + spinAngle;

    // 3. 💖 ECUACIÓN MATEMÁTICA DEL CORAZÓN (Ajustada para 3D)
    // Usamos la famosa fórmula paramétrica para definir los ejes X y Z en base al ángulo
    const heartX = 16 * Math.pow(Math.sin(totalAngle), 3);
    const heartZ = -(13 * Math.cos(totalAngle) - 5 * Math.cos(2 * totalAngle) - 2 * Math.cos(3 * totalAngle) - Math.cos(4 * totalAngle));
    
    // Multiplicamos por el progreso para que se llene desde el centro hacia los bordes
    const baseX = heartX * progress * (parameters.radius * 0.6);
    const baseZ = heartZ * progress * (parameters.radius * 0.6);

    // 4. Dispersión aleatoria (Polvo y grosor vertical de la galaxia)
    const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * (currentRadius * 15);
    const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * (currentRadius * 5);
    const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * (currentRadius * 15);

    // 5. Coordenadas finales
    positions[i * 3 + 0] = baseX + randomX;
    positions[i * 3 + 1] = randomY; 
    positions[i * 3 + 2] = baseZ + randomZ;

    // 6. Colores y Nebulosas (Cambiamos el azul exterior por tonos morados y magentas)
    const mixedColor = colorInside.clone();
    mixedColor.lerp(colorOutside, progress);

    // Toques extras de brillo violeta en las nubes exteriores
    if (progress > 0.2 && Math.random() > 0.7) {
        mixedColor.add(new THREE.Color('#a855f7').multiplyScalar(0.4)); // Violeta cósmico
    }

    colors[i * 3 + 0] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const createParticleTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(canvas);
};

const material = new THREE.PointsMaterial({
    size: parameters.size,
    sizeAttenuation: true,       
    depthWrite: false,           
    blending: THREE.AdditiveBlending, 
    vertexColors: true,          
    map: createParticleTexture(),
    transparent: true
});

const galaxy = new THREE.Points(geometry, material);
scene.add(galaxy);

galaxy.position.set(0, 0, 0);

// ANIMACIÓN
function animate() {
    requestAnimationFrame(animate);

    galaxy.rotation.y += 0.0015;
    controls.update();

    renderer.render(scene, camera);
}

// 🏷️ CONFIGURACIÓN DE MENSAJES FLOTANTES
// ==========================================

// Seleccionamos todos los mensajitos del HTML que creaste
const labels = Array.from(document.querySelectorAll('.space-label')).map(el => {
    return {
        element: el,
        // Leemos las coordenadas 3D que configuraste en los atributos data-
        position: new THREE.Vector3(
            parseFloat(el.dataset.x),
            parseFloat(el.dataset.y),
            parseFloat(el.dataset.z)
        )
    };
});

// Un vector auxiliar para hacer los cálculos matemáticos de proyección
const tempV = new THREE.Vector3();

// ==========================================
// 🎬 ANIMACIÓN (ACTUALIZADA)
// ==========================================
function animate() {
    requestAnimationFrame(animate);

    // 1. Rotación automática continua de la galaxia de corazón
    galaxy.rotation.y += 0.0015;
    
    // 2. Actualizar controles del ratón (inercia y zoom)
    controls.update();

    // 3. Proyectar los textos HTML sobre el espacio 3D
    labels.forEach(label => {
        // Copiamos la posición 3D estática del mensaje
        tempV.copy(label.position);
        
        // Como el corazón gira en el eje Y, rotamos el punto del mensaje exactamente igual
        tempV.applyAxisAngle(new THREE.Vector3(0, 1, 0), galaxy.rotation.y);

        // Proyectamos la posición 3D usando la cámara hacia la pantalla (coordenadas 2D de -1 a 1)
        tempV.project(camera);

        // Si el texto queda por detrás de la cámara (cerca de tu cara), lo ocultamos para que no tape todo
        if (tempV.z > 1) {
            label.element.style.opacity = 0;
            return;
        }

        // Convertimos esas coordenadas matemáticas a píxeles reales de tu monitor
        const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
        const y = (tempV.y * -0.5 + 0.5) * window.innerHeight;

        // Movemos el elemento HTML a esos píxeles exactos de la pantalla
        label.element.style.left = `${x}px`;
        label.element.style.top = `${y}px`;
        label.element.style.opacity = 1; // Lo volvemos visible
    });

    // 4. Renderizar la escena final
    renderer.render(scene, camera);
}

animate();

// ==========================================
// 📏 RESPONSIVE
// ==========================================
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// 📏 RESPONSIVE
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

