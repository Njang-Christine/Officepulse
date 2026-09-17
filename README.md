# Officepulse
A platform for office attendance. The website checks their phone's location to make sure they are really at work, and then it instantly saves their arrival time. Bosses get a clear dashboard to see who is on time or late, while workers can easily check their own attendance history.

**OfficePulse** is an automated web application designed to seamlessly record employee attendance and precise arrival times the exact moment staff enter the physical office space, eliminating manual check-in friction.

**Core Objectives**

* Remove reliance on manual punch-in cards, biometric fingerprint scanners, or manual web logins.
* Provide real-time visibility for HR and management on daily workforce presence.
* Generate automated punctuality analytics and monthly attendance reports.

**Key Features**

* **Geofencing & Wi-Fi Binding:** Uses HTML5 Geolocation API combined with office network IP recognition to verify that the user is physically inside the office perimeter before logging attendance.
* **Zero-Click Automated Check-In:** Employees open the mobile-optimized web app upon arrival, and the system instantly captures their GPS coordinates, matches them against office boundaries, and logs the timestamp.
* **Grace Period & Late Flagging:** Automatically compares arrival times against scheduled shift starts, categorizing statuses as *On Time*, *Late*, or *Absent*.
* **Manager & HR Dashboard:** Displays live arrival feeds, daily attendance summaries, and downloadable CSV/PDF reports for payroll integration.
* **Employee Portal:** Allows staff to view their historical arrival logs, check remaining leave days, and submit late-arrival justifications.

**System Workflow**

* **Step 1:** Employee arrives at the office building and opens the web application on their smartphone or laptop.
* **Step 2:** The browser requests location permissions and captures the device coordinates.
* **Step 3:** The backend server validates the coordinates against predefined office geofence parameters.
* **Step 4:** If validation succeeds, the system records the exact timestamp and updates the database entry for that day, displaying a confirmation screen to the user.

**Recommended Technology Stack**

* **Frontend:** HTML5, CSS3, JavaScript (Geolocator API, Responsive UI for mobile browsers).
* **Backend:** Node.js with Express.js for handling API requests and geofence validation logic.
* **Database:** PostgreSQL with PostGIS extension for accurate spatial data and employee record management, or MongoDB for flexible document storage.
* **Deployment & Hosting:** Vercel or AWS for scalable cloud availability.

**Business Value**

* Saves administrative hours spent reconciling manual attendance logs.
* Improves accuracy by preventing buddy-punching and false check-ins.
* Enhances accountability through transparent, real-time data tracking.
