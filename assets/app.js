
(() => {
  const DATA = window.TOUR_DATA;
  const order = ["D1","D2","D3","D4","D5","D6"];
  let selectedDay = localStorage.getItem("tour-day") || "D1";
  let role = localStorage.getItem("tour-role") || "all";
  let map = null;
  let deferredPrompt = null;

  const fmt = new Intl.NumberFormat("ro-RO");
  const summaryGrid = document.getElementById("summaryGrid");
  const dayTabs = document.getElementById("dayTabs");
  const dayView = document.getElementById("dayView");

  function renderSummary() {
    const items = [
      [DATA.summary.days, "zile"],
      [fmt.format(DATA.summary.distance) + " km", "distanță totală"],
      [fmt.format(DATA.summary.gain) + " m", "urcare estimată"],
      [fmt.format(DATA.summary.highest) + " m", "altitudine maximă GPX"],
    ];
    summaryGrid.innerHTML = items.map(([value,label]) =>
      `<div class="summary-card"><strong>${value}</strong><span>${label}</span></div>`
    ).join("");
  }

  function renderTabs() {
    dayTabs.innerHTML = order.map(day => {
      const d = DATA.days[day];
      return `<button class="day-tab ${day === selectedDay ? "active" : ""}" role="tab" data-day="${day}">
        ${day.replace("D","Ziua ")} · ${d.finish}
      </button>`;
    }).join("");
    dayTabs.querySelectorAll(".day-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedDay = btn.dataset.day;
        localStorage.setItem("tour-day", selectedDay);
        renderTabs();
        renderDay();
      });
    });
  }

  function stopHtml(stop, type) {
    const score = type === "cyclist" && stop.score
      ? `<span class="pill score">${stop.score}/10</span>` : "";
    return `<div class="stop ${stop.restaurant ? "restaurant" : ""}">
      <div class="stop-km">${stop.km === 0 ? "START" : "KM " + Math.round(stop.km)}</div>
      <div>
        <h5>${stop.name}</h5>
        <p>${stop.note}</p>
        <div class="stop-meta">
          ${score}
          <span class="pill">${stop.duration}</span>
          <a class="maps-link" href="${stop.maps}" target="_blank" rel="noopener">Google Maps ↗</a>
        </div>
      </div>
    </div>`;
  }

  function planHtml(day, type) {
    const isCyclist = type === "cyclist";
    const title = isCyclist ? "Planul ciclistului" : "Planul familiei";
    const icon = isCyclist ? "🚴" : "🚙";
    const intro = isCyclist ? day.cyclist_intro : day.family_intro;
    const stops = isCyclist ? day.cyclist_stops : day.family_stops;
    const hidden = role !== "all" && role !== type ? "hidden" : "";
    return `<section class="plan-card" data-plan="${type}" ${hidden}>
      <div class="plan-head"><div class="plan-icon">${icon}</div><h4>${title}</h4></div>
      <p class="plan-intro">${intro}</p>
      <div class="timeline">${stops.map(s => stopHtml(s, type)).join("")}</div>
    </section>`;
  }

  function profileSvg(coords, distance) {
    const width = 620, height = 250, padX = 38, padY = 24;
    const elevations = coords.map(p => p[2]);
    const min = Math.min(...elevations), max = Math.max(...elevations);
    const usableW = width - padX * 2, usableH = height - padY * 2;
    const points = coords.map((p,i) => {
      const x = padX + usableW * i / (coords.length - 1);
      const y = padY + usableH * (1 - (p[2]-min) / Math.max(1,max-min));
      return [x,y];
    });
    const line = points.map((p,i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const area = line + ` L${points.at(-1)[0].toFixed(1)},${height-padY} L${points[0][0].toFixed(1)},${height-padY} Z`;
    const grid = [0,.5,1].map(t => {
      const y = padY + usableH*t;
      const label = Math.round(max - (max-min)*t);
      return `<line class="profile-grid" x1="${padX}" y1="${y}" x2="${width-padX}" y2="${y}"/>
              <text class="profile-label" x="2" y="${y+4}">${label} m</text>`;
    }).join("");
    const xLabels = [0,.5,1].map(t => {
      const x = padX+usableW*t;
      return `<text class="profile-label" text-anchor="${t===0?"start":t===1?"end":"middle"}" x="${x}" y="${height-3}">${Math.round(distance*t)} km</text>`;
    }).join("");
    return `<svg class="profile" viewBox="0 0 ${width} ${height}" role="img" aria-label="Profil altimetric">
      ${grid}<path class="profile-area" d="${area}"/><path class="profile-line" d="${line}"/>${xLabels}
    </svg>`;
  }

  function renderMap(dayKey) {
    if (!window.L) return;
    const route = DATA.routes[dayKey];
    if (map) map.remove();
    map = L.map("map", {scrollWheelZoom: false, zoomControl: true});
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);
    const latLngs = route.coords.map(p => [p[0], p[1]]);
    const line = L.polyline(latLngs, {color: "#1f6c4d", weight: 5, opacity: .9}).addTo(map);
    route.markers.forEach((m, index) => {
      const html = `<div class="marker-dot ${m.restaurant ? "food" : ""}">${m.restaurant ? "🍴" : index+1}</div>`;
      const icon = L.divIcon({className:"custom-marker", html, iconSize:[28,28], iconAnchor:[14,14]});
      L.marker(m.position, {icon}).addTo(map)
        .bindPopup(`<strong>${m.name}</strong><br>km ${Math.round(m.km)}<br><a href="${m.maps}" target="_blank" rel="noopener">Google Maps ↗</a>`);
    });
    map.fitBounds(line.getBounds(), {padding:[28,28]});
  }

  function renderDay() {
    const day = DATA.days[selectedDay];
    const route = DATA.routes[selectedDay];
    const dayNo = selectedDay.replace("D","");
    dayView.innerHTML = `
      <section class="day-hero">
        <span class="day-number">ZIUA ${dayNo}</span>
        <h3>${day.title}</h3>
        <p class="day-subtitle">${day.subtitle}</p>
        <div class="metric-row">
          <div class="metric"><strong>${route.metrics.distance} km</strong><span>distanță</span></div>
          <div class="metric"><strong>${fmt.format(route.metrics.gain)} m</strong><span>urcare estimată</span></div>
          <div class="metric"><strong>${fmt.format(route.metrics.maxEle)} m</strong><span>altitudine maximă</span></div>
          <div class="metric"><strong>km ${Math.round(day.lunch.km)}</strong><span>întâlnire la prânz</span></div>
        </div>
        <div class="day-actions">
          <a class="link-button primary" href="${day.maps_lunch}" target="_blank" rel="noopener">🍴 ${day.lunch.name} în Maps</a>
          <a class="link-button" href="${day.maps_family_route}" target="_blank" rel="noopener">🚙 Ruta familiei</a>
          <a class="link-button" href="${route.gpx}" download>↓ Descarcă GPX</a>
        </div>
      </section>
      <section class="visual-grid">
        <div class="map-card"><div id="map" class="map"></div></div>
        <div class="profile-card">
          <div class="card-label"><strong>Profil altimetric</strong><span>din fișierul GPX</span></div>
          ${profileSvg(route.coords, route.metrics.distance)}
        </div>
      </section>
      <section class="plan-grid">
        ${planHtml(day,"cyclist")}
        ${planHtml(day,"family")}
      </section>
      <section class="notes-grid">
        <div class="note-card"><h4>De evitat în această configurație</h4><ul>${day.avoid.map(x=>`<li>${x}</li>`).join("")}</ul></div>
        <div class="note-card"><h4>La destinația de seară</h4><ul>${day.end_activities.map(x=>`<li>${x}</li>`).join("")}</ul></div>
      </section>`;
    requestAnimationFrame(() => renderMap(selectedDay));
  }

  document.querySelectorAll(".role-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.role === role);
    btn.addEventListener("click", () => {
      role = btn.dataset.role;
      localStorage.setItem("tour-role", role);
      document.querySelectorAll(".role-btn").forEach(x => x.classList.toggle("active", x === btn));
      renderDay();
    });
  });

  const savedTheme = localStorage.getItem("tour-theme");
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  document.getElementById("themeToggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("tour-theme", next);
  });

  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById("installButton").hidden = false;
  });
  document.getElementById("installButton").addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    document.getElementById("installButton").hidden = true;
  });

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  renderSummary();
  renderTabs();
  renderDay();
})();
