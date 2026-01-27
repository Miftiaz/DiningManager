# Dining Manager Assistant - MERN Stack Application

A complete MERN (MongoDB, Express, React, Node.js) stack web application for managing dining halls with student border management, meal tracking, and feast token management.

## Features

### 1. Manager Authentication
- Register and login system
- JWT-based authentication
- Secure password hashing with bcryptjs

### 2. Manager Dashboard
- Display active dining month information
- Show next day border count
- View dining month calendar with color-coded past and upcoming days
- Quick access buttons for main features

### 3. Dining Month Setup
- Create a 30-day dining month
- Choose start date (today or future date)
- Automatic generation of dining days

### 4. Manage Border (Student Management)
- Search students by ID
- Add new students with details (ID, Name, Phone, Room No)
- View student information and payment status
- Select dining days for students
- Auto-calculate payable amounts (2 meals/day × 40 TK)
- Record paid and due amounts
- Multiple day selection support

### 5. Manage Feast Token
- List all feast token subscribers
- Search by name or student ID
- View payment status and amounts
- Track feast token costs (Remaining days × 10 TK + 100 TK)
- Manage payment status

### 6. Adjust Dining Month
- View dining month calendar
- Display past and remaining days count
- Add breaks to dining month
- Remove breaks as needed
- Visual indication of break days

## Project Structure

```
Dining Manager/
├── server/                 # Backend API
│   ├── models/            # MongoDB schemas
│   │   ├── Manager.js
│   │   ├── Student.js
│   │   ├── DiningMonth.js
│   │   ├── DiningDay.js
│   │   ├── Payment.js
│   │   └── FeastToken.js
│   ├── middleware/        # Authentication middleware
│   │   └── auth.js
│   ├── controllers/       # Business logic
│   │   ├── authController.js
│   │   ├── borderController.js
│   │   ├── feastTokenController.js
│   │   └── diningMonthController.js
│   ├── routes/           # API endpoints
│   │   ├── authRoutes.js
│   │   ├── borderRoutes.js
│   │   ├── feastTokenRoutes.js
│   │   └── diningMonthRoutes.js
│   ├── server.js         # Main server file
│   ├── package.json
│   └── .env
│
└── client/                # Frontend
    ├── src/
    │   ├── components/   # React components
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── Dashboard.js
    │   │   ├── ManageBorder.js
    │   │   ├── ManageFeastToken.js
    │   │   └── AdjustDiningMonth.js
    │   ├── utils/       # Utilities
    │   │   ├── api.js
    │   │   └── helpers.js
    │   ├── styles/      # CSS files
    │   ├── App.js
    │   └── index.js
    ├── public/
    │   └── index.html
    └── package.json
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud - MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following:
```
MONGODB_URI=mongodb://localhost:27017/dining-manager
JWT_SECRET=your_jwt_secret_key_change_in_production
PORT=5000
NODE_ENV=development
```

4. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the React app:
```bash
npm start
```

The app will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new manager
- `POST /api/auth/login` - Login manager
- `GET /api/auth/dashboard` - Get dashboard data
- `POST /api/auth/dining-month/start` - Start new dining month

### Border Management
- `GET /api/border/search?studentId=ID` - Search student
- `GET /api/border/calendar` - Get calendar for adjustment
- `POST /api/border/adjust` - Adjust student dining days

### Feast Token
- `GET /api/feast-token/list?search=term` - Get feast token subscribers
- `GET /api/feast-token/:tokenId` - Get feast token details
- `POST /api/feast-token/create` - Create new feast token
- `POST /api/feast-token/:tokenId/payment` - Update payment

### Dining Month
- `GET /api/dining-month/calendar` - Get dining month calendar
- `POST /api/dining-month/break/add` - Add break
- `POST /api/dining-month/break/remove` - Remove break

## Business Rules

- **Dining Month**: 30 days
- **Meals Per Day**: 2 meals
- **Meal Cost**: 40 TK per meal
- **Feast Token Cost**: (Remaining days × 10 TK) + 100 TK
- **Calendar Colors**: Past days in gray, upcoming days in blue

## Technology Stack

### Backend
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin requests

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Styling

## Development Notes

- All APIs are protected with JWT authentication
- Tokens are stored in localStorage on client
- MongoDB connection string should be updated for production
- JWT secret should be changed in production

## Future Enhancements

- Add payment gateway integration
- Email notifications for managers
- Student app for viewing meals
- Admin panel for system management
- Analytics and reporting
- Meal history tracking

## License

ISC
