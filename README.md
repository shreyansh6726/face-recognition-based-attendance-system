# Face Recognition Attendance System

A modern, full-stack attendance management solution that replaces manual logs with automated facial identification. This project streamlines the process of tracking attendance by leveraging computer vision and a robust MERN architecture.

---

## Key Features

* **Facial Identification:** Automated recognition of users to log attendance.
* **Real-time Tracking:** Instant updates to the attendance database upon successful recognition.
* **Secure Dashboard:** Managed interface for viewing and exporting attendance logs.
* **Seamless Integration:** Connected via MongoDB Atlas/Compass for persistent data storage.

---

## Tech Stack

* **Frontend:** React.js, Tailwind CSS (deployed on **Vercel**)
* **Backend:** Node.js, Express.js (deployed on **Render**)
* **Database:** MongoDB (managed via **MongoDB Compass**)
* **Recognition:** [Mention library here, e.g., Face-api.js or OpenCV]

---

## Local Development

Follow these steps to get the project running on your local machine:

### 1. Prerequisites

* Node.js installed
* MongoDB Compass installed and running

### 2. Backend Setup

```bash
cd backend
npm install

```

* Create a `.env` file in the `backend` folder:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/your_db_name

```


* Start the server:
```bash
npm run dev  # Runs on http://localhost:5000

```



### 3. Frontend Setup

```bash
cd frontend
npm install

```

* Start the React app:
```bash
npm start  # Runs on http://localhost:3000

```



---

## Deployment Configuration

| Component | Platform | Status |
| --- | --- | --- |
| **Frontend** | Vercel | Production Ready |
| **Backend** | Render | Production Ready |
| **Database** | MongoDB | Cloud/Compass Managed |

> **Note:** Ensure the `cors` configuration in your Express app allows requests from your Vercel domain to prevent communication errors between the frontend and backend.

---

## System Architecture

The system works by capturing a live feed from the frontend, processing the image data through the backend recognition logic, and verifying the identity against stored profiles in the MongoDB database.

---

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page].

---
ould you like me to help you write the `deployment` section or specific `CORS` configuration code for your Express backend to ensure Vercel can talk to Render?**
