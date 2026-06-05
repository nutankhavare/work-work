import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import LoginPage from "./Auth/LoginPage";
import AuthLayout from "./Layouts/AuthLayout";
import { isLoggedIn } from "./Services/AuthService";
// import DashboardPage from "./Pages/DashboardPage";

// Auth Service
// Protected Route Component
const ProtectedRoute = ({ children }: any) => {
  if (!isLoggedIn()) {
    // If no user token, redirect to the login page
    return <Navigate to="/login" />;
  }
  return children;
};

// Public Route Component
const PublicRoute = ({ children }: any) => {
  if (isLoggedIn()) {
    // If user is logged in, redirect to the dashboard
    return <Navigate to="/dashboard" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        {/* <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        /> */}

        {/* Protected Routes inside AuthLayout */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AuthLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
