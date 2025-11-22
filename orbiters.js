const orbitDetails = {
    orbiters: [],
    numOrbiters: 4,
    orbitConfigs: Array.from({ length: 5 }, (_, i) => ({
        radiusX: 60 + i * 20,
        radiusY: 30 + i * 15,
        rotation: i * Math.PI / 8,
    })),
    orbitSpeed: 0.05, // Radians per frame
    movementMode: "orbit", //or "transfer" or "turret"
    steeringStrength: 2, //Smaller = slower turn, larger = snappier
    targetTransferSpeed: 20,
    initTransfer: function(vader) {
        this.movementMode = "transfer";
        const center = getVaderCenter(vader);
        const initVelocity = 20;
        const gBehind = document.getElementById("orbitersBehind");
        this.orbiters.forEach(o => {
            const orbiterPos = { x: parseInt(o.circle.getAttribute("cx")), y: parseInt(o.circle.getAttribute("cy")) };
            const dx = orbiterPos.x - center.x;
            const dy = orbiterPos.y - center.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1; //Avoid division by zero
            const vx = (dx / dist) * initVelocity;
            const vy = (dy / dist) * initVelocity;
            o.circle.setAttribute("data-vx", vx);
            o.circle.setAttribute("data-vy", vy);
            gBehind.appendChild(o.circle); //Move all to "behind" so they tuck behind the turret
        });
    }
};

function setupOrbiters() {
    const gFront = document.getElementById("orbitersFront");
    const gBehind = document.getElementById("orbitersBehind");
    for (let i = 0; i < orbitDetails.numOrbiters; i++) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.classList.add("orbiter");
        circle.setAttribute("cx", -100); //Off-screen
        circle.setAttribute("cy", -100); //Off-screen
        circle.setAttribute("r", 5);
        //circle.setAttribute("fill", "url(#radgrad)");
        gBehind.appendChild(circle);

        const config = orbitDetails.orbitConfigs[i % orbitDetails.orbitConfigs.length];
        orbitDetails.orbiters.push({ 
            circle, 
            angle: (i / orbitDetails.numOrbiters) * 2 * Math.PI,
            ...config,
         });
    }
}

function updateOrbiters() {
    //Decorates the runner vader or the turret

    if (isPaused()) return;

    const runner = document.querySelector("#gameContainer .vader.runner");
    const turret = document.getElementById("turret");
    const turretCenter = getVaderCenter(turret);
        
    if (runner == null && orbitDetails.movementMode === "orbit") {
        orbitDetails.orbiters.forEach(o => {
            o.circle.setAttribute("cx", -100); //Get off-screen
            o.circle.setAttribute("cy", -100); //Get off-screen
        });
        return;
    }

    if (orbitDetails.movementMode === "orbit" || orbitDetails.movementMode === "turret") {
        const center = orbitDetails.movementMode === "turret" ? turretCenter : getVaderCenter(runner);
        const gFront = document.getElementById("orbitersFront");
        const gBehind = document.getElementById("orbitersBehind");

        orbitDetails.orbiters.forEach(o => {
            o.angle += orbitDetails.orbitSpeed;

            //Eliptical parametric equations with rotation
            const xRaw = o.radiusX * Math.cos(o.angle);
            const yRaw = o.radiusY * Math.sin(o.angle);
            const x = center.x + xRaw * Math.cos(o.rotation) - yRaw * Math.sin(o.rotation);
            const y = center.y + xRaw * Math.sin(o.rotation) + yRaw * Math.cos(o.rotation);
            const z = (Math.sin(o.angle) + 1) / 2; //0 to 1
            const r = 4 + z * 6;
            o.circle.setAttribute("cx", x);
            o.circle.setAttribute("cy", y);
            o.circle.setAttribute("r", r);

            const radius = 3 + z * 4;
            const parent = radius > 5 ? gFront : gBehind;
            if (o.circle.parentNode !== parent) {
                parent.appendChild(o.circle);
            }
        });
    } else if (orbitDetails.movementMode === "transfer") {
        let numOrbitersTransferred = 0;
        orbitDetails.orbiters.forEach(o => {
            let vx = parseFloat(o.circle.getAttribute("data-vx"));
            let vy = parseFloat(o.circle.getAttribute("data-vy"));
            let x = parseFloat(o.circle.getAttribute("cx"));
            let y = parseFloat(o.circle.getAttribute("cy"));
            const dx = turretCenter.x - x;
            const dy = turretCenter.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1; //Avoid div/0
            const desiredVx = dx / dist;
            const desiredVy = dy / dist;
            vx = vx * (3 - orbitDetails.steeringStrength) + desiredVx * orbitDetails.steeringStrength;
            vy = vy * (3 - orbitDetails.steeringStrength) + desiredVy * orbitDetails.steeringStrength;
            const speed = Math.sqrt(vx * vx + vy * vy) || 1; //Avoid div/0
            vx = (vx / speed) * orbitDetails.targetTransferSpeed;
            vy = (vy / speed) * orbitDetails.targetTransferSpeed;
            if (dist < 50 || y > turretCenter.y) { //the y part is to prevent endless orbiting
                vx = 0; 
                vy = 0;  
                x = turretCenter.x;
                y = turretCenter.y;
                numOrbitersTransferred++;
            }
            x += vx;
            y += vy;
            o.circle.setAttribute("cx", x);
            o.circle.setAttribute("cy", y);
            o.circle.setAttribute("data-vx", vx);
            o.circle.setAttribute("data-vy", vy);
        });
        if (numOrbitersTransferred === orbitDetails.orbiters.length)
            orbitDetails.movementMode = "turret";
    }
}

function hideOneOrbiter() {
    let visibleOrbiters = orbitDetails.orbiters.filter(o => o.circle.style.display === "");
    if (visibleOrbiters.length === 0) return;
    visibleOrbiters[0].circle.style.display = "none";
}

function resetOrbiters() {
    for (const o of orbitDetails.orbiters) {
        o.circle.setAttribute("cx", -100);
        o.circle.setAttribute("cy", -100);
        o.circle.style.display = ""; //Make visible
    }
    orbitDetails.movementMode = "orbit";
}

function moveTurret() {
    if (isPaused()) return;

    const maxSpeed = 5;       // cap velocity
    const maxAccel = 0.05;     // cap acceleration
    const gain = 0.01;        // how strongly desiredVx responds to distance

    const turret = document.getElementById("turret");
    const vader = document.querySelector(".vader.active");
    if (vader == null) return;
    const target = getVaderCenter(vader);
    const current = getVaderCenter(turret);

    //"Step aside" from target
    const screenMidpoint = window.innerWidth / 2;
    if (target.x < screenMidpoint) 
        target.x += screenMidpoint / 4;
    else
        target.x -= screenMidpoint / 4;

    let dist = target.x - current.x;
    let vx = parseFloat(turret.getAttribute("data-vx") ?? 0);

    // Desired velocity scales with distance (asymptotic)
    let desiredVx = Math.max(-maxSpeed, Math.min(maxSpeed, dist * gain));

    // Compute acceleration toward desired velocity
    let ax = desiredVx - vx;
    ax = Math.max(-maxAccel, Math.min(maxAccel, ax)); // clamp acceleration

    // Apply acceleration
    vx += ax;

    // Optional snap-to-zero when extremely close
    if (Math.abs(dist) < 0.5 && Math.abs(vx) < 0.05) {
        vx = 0;
    }

    let left = turret.getBoundingClientRect().left;
    left += vx;
    turret.style.left = left + "px";
    turret.setAttribute("data-vx", vx);
}