# Digital Inward-Outward Register System

An enterprise-grade, secure record-keeping web application designed to track, manage, and verify incoming (inward) and outgoing (outward) organizational letters, files, and physical documents.

---

## 🚀 Key Features

*   **Document Tracking**: Register and track inward/outward documents including reference IDs, departments, priority, date/time, sender/receiver info, and PDF attachments.
*   **QR Code Integration**: Every document registration automatically generates a unique QR code. Print and attach QR codes to physical files for instant status lookups via the built-in webcam scanner.
*   **Access Control**: Role-based access control (RBAC). 
    *   *Administrator*: Full control over documents, system logs, backups, and user accounts.
    *   *Staff*: Manage inward and outward registers (Read-Write permissions).
*   **Locked Public Registration**: Public registration `/register` is only enabled to bootstrap the initial system administrator. Once the first account is created, public registration is locked, and new accounts must be created by the admin inside the secure dashboard.
*   **Secure SMTP Password Reset**: Implements real-world password recovery using Nodemailer to send 6-digit verification codes to the user's email.
*   **Custom Reporting**: Filter records by dates, departments, or categories and export reports directly as PDFs or Excel/CSV spreadsheets.
*   **System Integrity Utilities**: Single-click JSON backups and database restoration tools to export/restore all collections.
*   **Theme Engine**: Harmonious light and dark themes utilizing an HSL-tailored custom CSS design system.

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite), React Router DOM, Chart.js, Lucide Icons
*   **Backend**: Node.js, Express.js, MongoDB (Mongoose ORM), Nodemailer, JWT (jsonwebtoken)
*   **Styling**: Custom CSS with Glassmorphism, CSS Variables, and fluid grids (no heavy tailwind/bootstrap dependencies)

---

## 📂 Project Structure

```text
Inward-Outward-Register-System/
├── backend/
│   ├── config/             # Database connection setup
│   ├── controllers/        # Express route handler controllers
│   ├── middleware/         # Auth guards and file upload filters
│   ├── models/             # Mongoose database schemas
│   ├── routes/             # API routing mapping
│   ├── utils/              # Email transporter and helpers
│   ├── uploads/            # Local directory for PDF/Image attachments (gitignored)
│   ├── .env.example        # Environment variables template
│   ├── server.js           # Server entry file
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Modals, Sidebar, Header layout components
│   │   ├── context/        # Auth context and global state
│   │   ├── pages/          # Dashboard, Register, Tracking, Reports, User Settings
│   │   ├── utils/          # Axios configurations
│   │   ├── App.jsx         # App routes
│   │   └── main.jsx
│   └── package.json
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
*   Node.js (v18+ recommended)
*   npm (v9+ recommended)
*   MongoDB (Local community server or Atlas Cloud cluster)

---

### Step 1: Backend Setup & Configuration

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file by copying the template:
    ```bash
    cp .env.example .env
    ```
4.  Open `.env` and fill in your details:
    *   Set `MONGODB_URI` to your MongoDB connection string.
    *   Configure SMTP settings (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`) to enable password reset emails.
5.  Start the backend development server:
    ```bash
    npm run dev
    ```
    The server will start on port `5000` (`http://localhost:5000`).

---

### Step 2: Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the frontend development server:
    ```bash
    npm run dev
    ```
    The client interface will start on port `5173` (`http://localhost:5173`).

---

## 🔐 Security and Deployment Checklist

Before committing or pushing your code to GitHub:
1.  **Never commit your `.env` file**: A global root `.gitignore` is provided to keep your database credentials, JWT secrets, and email passwords safe.
2.  **Clean local uploads**: The `.gitignore` inside `backend/uploads` prevents locally uploaded PDFs or JSON backups from being pushed.
3.  **Bootstrap Admin**: The registration page (`/register`) is disabled in routing to direct users to the login screen. If you clear the database, the router will automatically direct you to setup mode to initialize the first admin.
