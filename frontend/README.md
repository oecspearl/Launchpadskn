# LaunchPad SKN Frontend

## Project Overview
This is a React-based frontend for LaunchPad SKN, a comprehensive Learning Management System (LMS) that supports multiple user roles including students, instructors, and administrators.

## Features
- User Authentication (Login/Register)
- Role-based Dashboard
- Course Registration
- Course Material Management
- Assignment Submission and Grading
- Admin Course and User Management

## Prerequisites
- Node.js (v14 or later)
- npm (v6 or later)

## Setup and Installation

1. Clone the repository
```bash
git clone <repository-url>
cd lms-frontend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory and add:
```
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server
```bash
npm start
```

## Project Structure
- `src/components/`: React components
  - `auth/`: Authentication-related components
  - `admin/`: Admin dashboard and management components
  - `instructor/`: Instructor-specific components
  - `student/`: Student-specific components
- `src/contexts/`: React context providers
- `src/services/`: API service methods
- `src/utils/`: Utility functions

## Routing
- `/login`: Login page
- `/register`: Registration page
- `/admin/dashboard`: Admin dashboard
- `/instructor/dashboard`: Instructor dashboard
- `/student/dashboard`: Student dashboard

## Technologies Used
- React
- React Router
- Bootstrap
- Axios
- React Bootstrap

## Deployment
To build for production:
```bash
npm run build
```

## TODO
- Implement more robust error handling
- Add more comprehensive form validations
- Create more detailed user role management
- Implement advanced course and assignment features

## Contributing
Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the LICENSE.md file for details