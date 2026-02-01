# Support Ticket Management System

A full-stack web application for managing support tickets with role-based access control, JWT authentication, and enforced reassignment limits.

## 🎯 Project Overview

This system allows customers to raise support tickets and support agents to manage them. The application enforces a critical business rule: **each ticket can only be reassigned once**.

## 🛠 Tech Stack

### Backend
- **Node.js** with **Express.js**
- **MongoDB** with **Mongoose** ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** enabled

### Frontend
- **React 18**
- **React Router** for navigation
- **Axios** for API calls
- **Vite** for build tooling
- **Vanilla CSS** for styling

## 👥 User Roles and Permissions

### CUSTOMER
- ✅ Register and login
- ✅ Create support tickets
- ✅ View own tickets and their status
- ❌ Cannot access agent features

### AGENT
- ✅ Register and login
- ✅ View assigned tickets
- ✅ Update ticket status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- ✅ Reassign tickets to other agents (maximum once per ticket)
- ❌ Cannot access customer ticket creation

## 🔐 Authentication & Authorization

- JWT-based authentication with Bearer tokens
- All backend APIs are protected with JWT middleware
- Role-based access control enforced on both frontend and backend
- Passwords hashed with bcrypt (10 salt rounds)
- Token stored in localStorage on frontend

## 📡 API Endpoints

### Authentication Routes

#### Register User
```
POST /api/auth/register
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "CUSTOMER" | "AGENT"
}
Response: { _id, name, email, role, token }
```

#### Login User
```
POST /api/auth/login
Body: {
  "email": "john@example.com",
  "password": "password123"
}
Response: { _id, name, email, role, token }
```

### Ticket Routes (All require JWT token in Authorization header)

#### Create Ticket (Customer Only)
```
POST /api/tickets
Headers: { Authorization: "Bearer <token>" }
Body: {
  "title": "Issue with login",
  "description": "Cannot login to my account"
}
Response: Ticket object
```

#### Get Customer's Tickets (Customer Only)
```
GET /api/tickets/my-tickets
Headers: { Authorization: "Bearer <token>" }
Response: Array of ticket objects
```

#### Get Assigned Tickets (Agent Only)
```
GET /api/tickets/assigned
Headers: { Authorization: "Bearer <token>" }
Response: Array of ticket objects assigned to the agent
```

#### Get All Tickets (Agent Only)
```
GET /api/tickets/all
Headers: { Authorization: "Bearer <token>" }
Response: Array of all ticket objects
```

#### Update Ticket Status (Agent Only)
```
PUT /api/tickets/:id/status
Headers: { Authorization: "Bearer <token>" }
Body: {
  "status": "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
}
Response: Updated ticket object
```

#### Reassign Ticket (Agent Only) ⚠️ Critical
```
PUT /api/tickets/:id/reassign
Headers: { Authorization: "Bearer <token>" }
Body: {
  "newAgentId": "agent_mongodb_id"
}
Response: {
  message: "Ticket reassigned successfully",
  ticket: Updated ticket object,
  reassignmentCount: 1,
  canReassignAgain: false
}
Error (if limit reached): {
  message: "Ticket reassignment limit reached. A ticket can only be reassigned once.",
  reassignmentCount: 1
}
```

## 🗄 Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique, lowercase),
  password: String (required, hashed, min 6 chars),
  role: String (enum: ['CUSTOMER', 'AGENT'], required),
  timestamps: true
}
```

### Ticket Model
```javascript
{
  title: String (required),
  description: String (required),
  status: String (enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], default: 'OPEN'),
  customerId: ObjectId (ref: 'User', required),
  assignedAgentId: ObjectId (ref: 'User'),
  reassignmentCount: Number (default: 0, min: 0, max: 1),
  reassignmentHistory: [{
    fromAgentId: ObjectId (ref: 'User'),
    toAgentId: ObjectId (ref: 'User', required),
    reassignedAt: Date (default: Date.now)
  }],
  timestamps: true
}
```

## ⚠️ Critical Business Rule

**A support ticket can be reassigned only once.**

- The `reassignmentCount` field tracks the number of reassignments
- Maximum value is enforced at the database level (max: 1)
- Backend API validates and rejects reassignment attempts when count >= 1
- Frontend displays warning message and disables reassignment UI when limit is reached
- Reassignment history is persisted in the database with timestamps

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd support-ticket-system/backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file with:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/support-ticket-system
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

4. Start MongoDB (if using local):
```bash
mongod
```

5. Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

Server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd support-ticket-system/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file with:
```
VITE_API_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🧪 Testing the Application

### Manual Testing Flow

1. **Register Users**
   - Open `http://localhost:5173`
   - Register a customer account
   - Register two agent accounts (Agent1 and Agent2)

2. **Customer Flow**
   - Login as customer
   - Create a support ticket
   - View the ticket in "My Tickets" section

3. **Agent Flow - First Reassignment**
   - Login as Agent1
   - View assigned tickets
   - Update ticket status to "IN_PROGRESS"
   - Reassign ticket to Agent2 (first reassignment - should succeed)

4. **Agent Flow - Test Reassignment Limit** ⚠️
   - Login as Agent2
   - View the reassigned ticket
   - Notice the reassignment count is 1/1
   - Attempt to reassign to Agent1 again
   - **Expected**: Error message "Ticket has already been reassigned once"
   - Reassignment UI should show warning

### Database Verification

Connect to MongoDB and verify:
```bash
mongo
use support-ticket-system

# View users
db.users.find().pretty()

# View tickets with reassignment data
db.tickets.find().pretty()

# Check reassignment count
db.tickets.find({ reassignmentCount: { $gte: 1 } }).pretty()
```

## 📁 Project Structure

```
support-ticket-system/
├── backend/
│   ├── Config/
│   ├── Controller/
│   │   ├── authController.js
│   │   └── ticketController.js
│   ├── Database/
│   │   └── connection.js
│   ├── Middleware/
│   │   └── authMiddleware.js
│   ├── Models/
│   │   ├── userModel.js
│   │   └── ticketModel.js
│   ├── Routers/
│   │   ├── authRouter.js
│   │   └── ticketRouter.js
│   ├── Utils/
│   │   └── generateToken.js
│   ├── .env
│   ├── .env.example
│   ├── index.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── CustomerDashboard.jsx
    │   │   └── AgentDashboard.jsx
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .env
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 🌐 Deployment

### Backend Deployment (e.g., Render, Railway, Heroku)
1. Push code to GitHub
2. Connect repository to hosting platform
3. Set environment variables
4. Deploy

### Frontend Deployment (e.g., Vercel, Netlify)
1. Push code to GitHub
2. Connect repository to hosting platform
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Set environment variable: `VITE_API_URL=<your-backend-url>`
6. Deploy

## 🔒 Security Features

- Passwords hashed with bcrypt
- JWT tokens with expiration
- Protected routes with authentication middleware
- Role-based access control
- CORS enabled for cross-origin requests
- Input validation on all endpoints
- MongoDB injection protection via Mongoose

## 📝 Assignment Compliance

✅ User registration and login implemented  
✅ JWT-based authentication on all APIs  
✅ Role-based access control (CUSTOMER/AGENT)  
✅ Customers can create and view tickets  
✅ Agents can view, update, and reassign tickets  
✅ **Critical**: Reassignment limit enforced (max 1 per ticket)  
✅ All data persisted in MongoDB (no hardcoded/in-memory data)  
✅ Environment variables for sensitive configuration  
✅ Complete README with all required sections  

## 📄 License

ISC

## 👨‍💻 Author

Created for Full Stack Assignment - FSD-24
