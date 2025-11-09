const EARTH_RADIUS = 6371; // km
const EARTH_MU = 398600.4418; // km³/s²

// ✅ NEW: Earth rotation for longitude
const EARTH_ROTATION_RATE = 7.2921159e-5; // rad/s
let elapsedTime = 0;

let trackingInterval;
let currentAngle = 0;
let isTracking = false;

const satellites = {
    cartosat: { altitude: 509, inclination: 97.5, eccentricity: 0.001 },
    resourcesat: { altitude: 817, inclination: 98.7, eccentricity: 0.001 },
    insat: { altitude: 35786, inclination: 0.1, eccentricity: 0.0003 },
    astrosat: { altitude: 650, inclination: 6.0, eccentricity: 0.0017 },
    mangalyaan: { altitude: 500, inclination: 19.2, eccentricity: 0.8 },
    chandrayaan: { altitude: 384400, inclination: 21.0, eccentricity: 0.055 }
};

function loadMission(missionKey) {
    const mission = satellites[missionKey];
    if (mission) {
        document.getElementById('altitude').value = mission.altitude;
        document.getElementById('inclination').value = mission.inclination;
        document.getElementById('eccentricity').value = mission.eccentricity;
        document.getElementById('satellite').value = missionKey;
        calculateOrbit();
    }
}

function calculateOrbit() {
    const altitude = parseFloat(document.getElementById('altitude').value);
    const inclination = parseFloat(document.getElementById('inclination').value);
    const eccentricity = parseFloat(document.getElementById('eccentricity').value);

    const semiMajorAxis = EARTH_RADIUS + altitude;
    const orbitalPeriod = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / EARTH_MU) / 60;
    const orbitalVelocity = Math.sqrt(EARTH_MU / semiMajorAxis);
    const apogee = semiMajorAxis * (1 + eccentricity) - EARTH_RADIUS;
    const perigee = semiMajorAxis * (1 - eccentricity) - EARTH_RADIUS;
    const groundTrackShift = 360 * (orbitalPeriod / (24 * 60)) * Math.cos(inclination * Math.PI / 180);

    document.getElementById('orbitalPeriod').textContent = orbitalPeriod.toFixed(1);
    document.getElementById('orbitalVelocity').textContent = orbitalVelocity.toFixed(2);
    document.getElementById('apogee').textContent = apogee.toFixed(0);
    document.getElementById('perigee').textContent = perigee.toFixed(0);
    document.getElementById('groundTrack').textContent = Math.abs(groundTrackShift).toFixed(1);

    updateOrbitVisualization(altitude, eccentricity);
}

function updateOrbitVisualization(altitude, eccentricity) {
    const orbitPath = document.getElementById('orbitPath');

    const maxRadius = 180;
    const minRadius = 50;

    let orbitRadius;
    if (altitude > 10000) {
        orbitRadius = maxRadius;
    } else {
        orbitRadius = minRadius + (altitude / 1000) * ((maxRadius - minRadius) / 10);
    }

    const orbitWidth = orbitRadius * 2 * (1 + eccentricity * 0.5);
    const orbitHeight = orbitRadius * 2 * (1 - eccentricity * 0.5);

    orbitPath.style.width = orbitWidth + 'px';
    orbitPath.style.height = orbitHeight + 'px';
    orbitPath.style.borderRadius = '50%';
}

function startTracking() {
    if (isTracking) {
        stopTracking();
        return;
    }

    isTracking = true;
    const button = event.target;
    button.textContent = 'Stop Tracking';
    button.style.background = 'linear-gradient(45deg, #f44336, #d32f2f)';

    const altitude = parseFloat(document.getElementById('altitude').value);
    const satellite = document.getElementById('satellite1');
    const orbitPath = document.getElementById('orbitPath');

    trackingInterval = setInterval(() => {
        const orbitRadius = parseFloat(orbitPath.style.width) / 2;
        const centerX = 200;
        const centerY = 200;

        // Visual Orbit Animation
        const x = centerX + orbitRadius * Math.cos(currentAngle) - 4;
        const y = centerY + orbitRadius * Math.sin(currentAngle) - 4;

        satellite.style.left = x + 'px';
        satellite.style.top = y + 'px';

        const currentAlt = altitude + Math.sin(currentAngle * 3) * 50;
        document.getElementById('currentPosition').textContent = currentAlt.toFixed(0);

        // ✅ LAT/LON CALCULATION
        const inclinationRad = parseFloat(document.getElementById('inclination').value) * Math.PI / 180;
        const semiMajorAxis = EARTH_RADIUS + altitude;
        const r = semiMajorAxis;

        const x_orb = r * Math.cos(currentAngle);
        const y_orb = r * Math.sin(currentAngle);

        const x_eci = x_orb;
        const y_eci = y_orb * Math.cos(inclinationRad);
        const z_eci = y_orb * Math.sin(inclinationRad);

        const lon = Math.atan2(y_eci, x_eci) - (EARTH_ROTATION_RATE * elapsedTime);
        const lat = Math.atan2(z_eci, Math.sqrt(x_eci ** 2 + y_eci ** 2));

        let latitude = lat * (180 / Math.PI);
        let longitude = lon * (180 / Math.PI);

        longitude = ((longitude + 180) % 360) - 180;

        document.getElementById('currentLat').textContent = latitude.toFixed(2);
        document.getElementById('currentLon').textContent = longitude.toFixed(2);

        elapsedTime += 1;
        currentAngle += 0.02;
        if (currentAngle > 2 * Math.PI) currentAngle = 0;

    }, 50);
}

function stopTracking() {
    isTracking = false;
    clearInterval(trackingInterval);

    const buttons = document.querySelectorAll('button');
    buttons[1].textContent = 'Start Tracking';
    buttons[1].style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
}

document.getElementById('satellite').addEventListener('change', function () {
    const selectedSat = this.value;
    if (selectedSat !== 'custom' && satellites[selectedSat]) {
        loadMission(selectedSat);
    }
});

window.addEventListener('load', () => {
    calculateOrbit();

    const canvas = document.getElementById('orbitCanvas');
    for (let i = 0; i < 20; i++) {
        const star = document.createElement('div');
        star.style.position = 'absolute';
        star.style.width = '2px';
        star.style.height = '2px';
        star.style.background = '#fff';
        star.style.borderRadius = '50%';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.opacity = Math.random() * 0.8 + 0.2;
        star.style.boxShadow = '0 0 2px #fff';
        canvas.appendChild(star);
    }
});
