
(function () {
  "use strict";

  /* ============================================================
     CONFIG — replace with real values from your backend
     ============================================================ */
  const OFFICE = {
    name: "HQ — Downtown",
    lat: 37.7749,       // office latitude
    lng: -122.4194,     // office longitude
    radiusMeters: 150,  // how close an employee must be to check in
  };
  const SHIFT_START_HOUR = 9;   // 9:00 AM counts as on time
  const SHIFT_START_MIN  = 0;
  const GRACE_MINUTES    = 5;   // arriving up to 5 min after start is still "on time"

  const STORAGE_KEY = "officepulse_records_v1";
  const SESSION_KEY = "officepulse_session";   // written by login.html
  const USERS_KEY   = "officepulse_users_v1";  // written by signup.html

  /* ============================================================
     SESSION — this is the seam where login.html / signup.html
     connect to this page. In production, swap this block for a
     real check against your session/token (e.g. verify a cookie
     or JWT with your API) instead of reading localStorage.
     ============================================================ */
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch (e) { return null; }
  }

  const session = getSession();
  if (!session || !session.userId) {
    window.location.href = "login.html";
    return;
  }

  const CURRENT_EMPLOYEE = { id: session.userId, name: session.name };
  const CURRENT_ROLE = session.role === "manager" ? "manager" : "employee";

  function signOut() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "login.html";
  }

  // Demo fallback roster (in case no one has signed up yet), merged
  // below with any real accounts created via signup.html.
  const DEMO_ROSTER = [
    { id: "emp_001", name: "Jordan Lee" },
    { id: "emp_002", name: "Priya Nair" },
    { id: "emp_003", name: "Marcus Webb" },
    { id: "emp_004", name: "Sofia Castillo" },
  ];

  function loadUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch (e) { return []; }
  }

  function getRoster() {
    const registered = loadUsers().map((u) => ({ id: u.id, name: u.name, role: u.role }));
    const registeredIds = new Set(registered.map((u) => u.id));
    const fallback = DEMO_ROSTER.filter((d) => !registeredIds.has(d.id));
    const roster = registered.concat(fallback);
    // Always make sure whoever is currently signed in appears on the roster.
    if (!roster.some((r) => r.id === CURRENT_EMPLOYEE.id)) {
      roster.unshift({ id: CURRENT_EMPLOYEE.id, name: CURRENT_EMPLOYEE.name, role: CURRENT_ROLE });
    }
    return roster;
  }

  /* ============================================================
     STORAGE LAYER
     Swap these two functions for real API calls, e.g.:
       saveArrival()  -> POST /api/attendance
       loadRecords()  -> GET  /api/attendance?date=...
     Everything below only talks to these two functions, so the
     rest of the app doesn't need to change when you wire up a
     real backend.
     ============================================================ */
  function loadRecords() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveArrival(record) {
    const records = loadRecords();
    records.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return record;
  }

  function seedDemoDataIfEmpty() {
    if (loadRecords().length > 0) return;
    const records = [];
    const today = new Date();
    for (let d = 6; d >= 1; d--) {
      const day = new Date(today);
      day.setDate(day.getDate() - d);
      if (day.getDay() === 0 || day.getDay() === 6) continue; // skip weekends
      DEMO_ROSTER.forEach((emp, i) => {
        // deterministic-ish variation so the demo looks alive
        const lateChance = (d + i) % 4 === 0;
        const arrival = new Date(day);
        arrival.setHours(SHIFT_START_HOUR, SHIFT_START_MIN, 0, 0);
        arrival.setMinutes(arrival.getMinutes() + (lateChance ? 12 + i * 3 : -(3 + i)));
        if (i === 3 && d === 3) return; // one absence in the sample data
        records.push({
          employeeId: emp.id,
          employeeName: emp.name,
          timestamp: arrival.toISOString(),
          status: statusFor(arrival),
          distanceMeters: Math.round(20 + Math.random() * 60),
        });
      });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  /* ============================================================
     HELPERS
     ============================================================ */
  function statusFor(dateObj) {
    const cutoff = new Date(dateObj);
    cutoff.setHours(SHIFT_START_HOUR, SHIFT_START_MIN + GRACE_MINUTES, 0, 0);
    return dateObj <= cutoff ? "ontime" : "late";
  }

  function haversineMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  function fmtDateShort(iso) {
    return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }
  function isSameDay(isoA, isoB) {
    const a = new Date(isoA), b = new Date(isoB);
    return a.toDateString() === b.toDateString();
  }
  function pillLabel(status) {
    return status === "ontime" ? "On time" : status === "late" ? "Late" : "Absent";
  }

  /* ============================================================
     LIVE CLOCK
     ============================================================ */
  const liveClockEl = document.getElementById("live-clock");
  const liveDateEl = document.getElementById("live-date");
  function tickClock() {
    const now = new Date();
    liveClockEl.textContent = now.toLocaleTimeString(undefined, { hour12: false });
    liveDateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric",
    });
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ============================================================
     GEOLOCATION + CHECK-IN
     ============================================================ */
  const locationStatusEl = document.getElementById("location-status");
  const locationStatusText = document.getElementById("location-status-text");
  const clockinBtn = document.getElementById("clockin-btn");
  const stampEl = document.getElementById("stamp");
  const stampHeadline = document.getElementById("stamp-headline");
  const stampDetail = document.getElementById("stamp-detail");

  let lastKnownDistance = null;
  let alreadyCheckedInToday = false;

  function setLocationState(state, text) {
    locationStatusEl.setAttribute("data-state", state);
    locationStatusText.textContent = text;
  }

  function refreshCheckedInState() {
    const records = loadRecords();
    const todayRecord = records.find(
      (r) => r.employeeId === CURRENT_EMPLOYEE.id && isSameDay(r.timestamp, new Date().toISOString())
    );
    if (todayRecord) {
      alreadyCheckedInToday = true;
      clockinBtn.textContent = "Already checked in";
      clockinBtn.classList.add("done");
      clockinBtn.disabled = true;
      showStamp(todayRecord);
    }
  }

  function showStamp(record) {
    stampEl.classList.add("show");
    stampEl.classList.toggle("late", record.status === "late");
    stampHeadline.textContent = record.status === "late" ? "Stamped in — late" : "Stamped in — on time";
    stampDetail.textContent =
      fmtTime(record.timestamp) + " · " + Math.round(record.distanceMeters) + "m from " + OFFICE.name;
  }

  function requestLocation() {
    if (alreadyCheckedInToday) return;
    if (!("geolocation" in navigator)) {
      setLocationState("bad", "This browser can't share location — check in isn't available.");
      clockinBtn.textContent = "Location unavailable";
      return;
    }
    setLocationState("checking", "Checking your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = haversineMeters(
          pos.coords.latitude, pos.coords.longitude, OFFICE.lat, OFFICE.lng
        );
        lastKnownDistance = dist;
        if (dist <= OFFICE.radiusMeters) {
          setLocationState("ok", "You're at " + OFFICE.name + " (" + Math.round(dist) + "m away)");
          clockinBtn.disabled = false;
          clockinBtn.textContent = "Clock in";
        } else {
          setLocationState("bad", Math.round(dist) + "m from " + OFFICE.name + " — move closer to check in");
          clockinBtn.disabled = true;
          clockinBtn.textContent = "Too far to clock in";
        }
      },
      (err) => {
        setLocationState("bad", "Location permission needed to clock in — check your browser settings.");
        clockinBtn.disabled = true;
        clockinBtn.textContent = "Location blocked";
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  clockinBtn.addEventListener("click", function () {
    if (alreadyCheckedInToday || clockinBtn.disabled) return;
    clockinBtn.disabled = true;
    clockinBtn.textContent = "Stamping…";
    const now = new Date();
    const record = {
      employeeId: CURRENT_EMPLOYEE.id,
      employeeName: CURRENT_EMPLOYEE.name,
      timestamp: now.toISOString(),
      status: statusFor(now),
      distanceMeters: lastKnownDistance == null ? 0 : lastKnownDistance,
    };
    saveArrival(record);
    alreadyCheckedInToday = true;
    clockinBtn.textContent = "Already checked in";
    clockinBtn.classList.add("done");
    showStamp(record);
    renderEmployeeHistory();
    renderAdminView();
  });

  /* ============================================================
     EMPLOYEE HISTORY
     ============================================================ */
  const employeeHistoryEl = document.getElementById("employee-history");
  document.getElementById("employee-name-label").textContent = "Signed in as " + CURRENT_EMPLOYEE.name;

  function renderEmployeeHistory() {
    const records = loadRecords()
      .filter((r) => r.employeeId === CURRENT_EMPLOYEE.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    employeeHistoryEl.innerHTML = "";
    if (records.length === 0) {
      employeeHistoryEl.innerHTML = '<div class="empty-state">No check-ins yet — clock in above once you\'re at the office.</div>';
      return;
    }
    records.slice(0, 20).forEach((r) => {
      const row = document.createElement("div");
      row.className = "record-row";
      row.innerHTML =
        '<div class="who"><span class="date">' + fmtDateShort(r.timestamp) + '</span></div>' +
        '<div class="time">' + fmtTime(r.timestamp) + '</div>' +
        '<span class="pill ' + r.status + '">' + pillLabel(r.status) + '</span>';
      employeeHistoryEl.appendChild(row);
    });
  }

  /* ============================================================
     ADMIN VIEW
     ============================================================ */
  const daySelect = document.getElementById("day-select");
  const adminRosterEl = document.getElementById("admin-roster");
  const adminDateLabel = document.getElementById("admin-date-label");
  const countOntime = document.getElementById("count-ontime");
  const countLate = document.getElementById("count-late");
  const countAbsent = document.getElementById("count-absent");

  function populateDaySelect() {
    const records = loadRecords();
    const daySet = new Map(); // dateString -> iso sample
    records.forEach((r) => {
      const d = new Date(r.timestamp);
      const key = d.toDateString();
      if (!daySet.has(key)) daySet.set(key, r.timestamp);
    });
    // always include today
    const todayKey = new Date().toDateString();
    if (!daySet.has(todayKey)) daySet.set(todayKey, new Date().toISOString());

    const sortedKeys = Array.from(daySet.keys()).sort(
      (a, b) => new Date(b) - new Date(a)
    );

    daySelect.innerHTML = "";
    sortedKeys.forEach((key) => {
      const iso = daySet.get(key);
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = key === todayKey ? "Today — " + fmtDateShort(iso) : fmtDateShort(iso);
      daySelect.appendChild(opt);
    });
    daySelect.value = todayKey;
  }

  function renderAdminView() {
    const selectedKey = daySelect.value || new Date().toDateString();
    adminDateLabel.textContent = selectedKey === new Date().toDateString()
      ? "Today, live as employees check in"
      : selectedKey;

    const records = loadRecords().filter((r) => new Date(r.timestamp).toDateString() === selectedKey);

    // Build one row per roster member: their record that day, or absent.
    const rows = getRoster().map((emp) => {
      const rec = records.find((r) => r.employeeId === emp.id);
      return rec
        ? { name: emp.name, timestamp: rec.timestamp, status: rec.status, distanceMeters: rec.distanceMeters }
        : { name: emp.name, timestamp: null, status: "absent", distanceMeters: null };
    });

    rows.sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    adminRosterEl.innerHTML = "";
    rows.forEach((r) => {
      const row = document.createElement("div");
      row.className = "record-row";
      const meta = r.distanceMeters != null ? Math.round(r.distanceMeters) + "m from " + OFFICE.name : "No check-in recorded";
      row.innerHTML =
        '<div class="who"><span class="name">' + r.name + '</span><span class="meta">' + meta + '</span></div>' +
        '<div class="time">' + (r.timestamp ? fmtTime(r.timestamp) : "—") + '</div>' +
        '<span class="pill ' + r.status + '">' + pillLabel(r.status) + '</span>';
      adminRosterEl.appendChild(row);
    });

    countOntime.textContent = rows.filter((r) => r.status === "ontime").length;
    countLate.textContent = rows.filter((r) => r.status === "late").length;
    countAbsent.textContent = rows.filter((r) => r.status === "absent").length;
  }

  daySelect.addEventListener("change", renderAdminView);

  /* ============================================================
     ACCOUNT CHIP + SIGN OUT
     ============================================================ */
  document.getElementById("account-name").textContent = CURRENT_EMPLOYEE.name;
  document.getElementById("account-role").textContent = CURRENT_ROLE === "manager" ? "Manager" : "Employee";
  document.getElementById("account-avatar").textContent = CURRENT_EMPLOYEE.name
    .split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  document.getElementById("signout-btn").addEventListener("click", signOut);

  /* ============================================================
     ROLE SWITCH — driven by the signed-in user's real role.
     Employees only ever see their own check-in view; managers get
     both, so they can check themselves in as well as see the roster.
     ============================================================ */
  const roleButtons = document.querySelectorAll(".roleswitch button");
  const roleswitchNav = document.getElementById("roleswitch-nav");
  const views = { employee: document.getElementById("view-employee"), admin: document.getElementById("view-admin") };

  function showView(role) {
    roleButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.role === role)));
    Object.values(views).forEach((v) => v.classList.remove("active"));
    views[role].classList.add("active");
  }

  if (CURRENT_ROLE === "manager") {
    roleButtons.forEach((btn) => btn.addEventListener("click", () => showView(btn.dataset.role)));
    showView("admin");
  } else {
    roleswitchNav.style.display = "none"; // employees have no roster to switch to
    showView("employee");
  }

  /* ============================================================
     INIT
     ============================================================ */
  seedDemoDataIfEmpty();
  refreshCheckedInState();
  requestLocation();
  renderEmployeeHistory();
  populateDaySelect();
  renderAdminView();
})();
