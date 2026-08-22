# ASTRA — Aadhaar Statistical Trends & Resource Analytics

ASTRA is an internal, authorized-personnel-only analytics, forecasting, and planning platform. It aggregates demographic, biometric, and resource-allocation datasets to support data-driven policy planning without exposing any personally identifiable information (PII).

---

## 🚀 Instant Browser Preview (Zero Installation)

To test ASTRA immediately without setting up databases or environment runtimes:
1. Double-click the [`index.html`](./index.html) file located in the project root.
2. Open it in any modern browser (Chrome, Edge, Firefox, Safari).
3. **Experience all core features:**
   - **Role Switching:** Swap between Administrator, Analyst, Planning Officer, and Department Officer to inspect dynamic permission restrictions.
   - **Demographic & Biometric Panels:** Render filterable charts and dataset age tables using Chart.js CDN.
   - **Ingestion Simulator:** Upload the files from the `/datasets` directory to test format verification, progress bars, and quality warnings.
   - **Predictive Forecasting:** Run simulated Prophet time-series calculations with confidence bounds.
   - **User Provisioning:** Create and suspend personnel accounts.
   - **Immutable Logs:** Trace actions dynamically recorded in the security audit trail.

---

## 🛠️ Full Production Setup & Installation

If you wish to deploy the real backend server, React SPA frontend, and Python ML microservice, follow these installation procedures:

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or higher)
- [Python](https://www.python.org/) (v3.9 or higher)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) (running locally or a MongoDB Atlas connection string)

---

### Step 1: Database Setup
1. Ensure your MongoDB server is running. (Default: `mongodb://localhost:27017`)
2. Use a client like MongoDB Compass to verify connection. The backend will automatically create the database `astra_db` and structure tables upon initial run.

---

### Step 2: Backend Configuration & Start
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` root directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/astra_db
   JWT_SECRET=astra_secret_key_123
   JWT_REFRESH_SECRET=astra_refresh_secret_key_456
   ML_SERVICE_URL=http://localhost:8000/api/v1/ml/forecast
   CORS_ORIGIN=http://localhost:3000
   ```
4. Start the server:
   - For development (with live reload):
     ```bash
     npm run dev
     ```
   - For production:
     ```bash
     npm start
     ```

---

### Step 3: Python ML Service Configuration & Start
1. Navigate to the `ml-service/` directory:
   ```bash
   cd ../ml-service
   ```
2. Create and activate a Python virtual environment (recommended):
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On MacOS/Linux:
   source venv/bin/activate
   ```
3. Install required libraries:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI microservice:
   ```bash
   python main.py
   ```
   The service will boot up on `http://localhost:8000`. You can inspect the interactive Swagger API documentation at `http://localhost:8000/docs`.

---

### Step 4: Frontend Configuration & Start
1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Boot up the Vite dev server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000`. The frontend uses Vite's proxy configs to route `/api/v1/*` requests directly to your backend on port 5000.

---

## 📊 Sample Datasets Ingestion Testing

We have provided three synthetic CSV files in the `/datasets` directory:
- [`sample_demographics.csv`](./datasets/sample_demographics.csv): Testing demographic aggregates structure.
- [`sample_biometrics.csv`](./datasets/sample_biometrics.csv): Testing biometric enrollment and update timelines.
- [`sample_resources.csv`](./datasets/sample_resources.csv): Testing historical resource planning entries (contains 12 consecutive months of kit allocations, passing the minimum 6 data-points verification threshold required by the ML Prophet model).

---

## 🔒 Security Architecture Notes
- **Data Privacy:** ASTRA does not store or process citizen-level Aadhaar card rows. The database stores aggregated counts of records by region, period, and category.
- **Access Control:** Middleware checks JWT authentication tokens and verifies user scopes against the endpoint requirements. Unauthorized actions trigger alert logs recorded in the immutable `AuditLogs` collection.
