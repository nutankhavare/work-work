import { createContext, useState, useContext, type ReactNode } from "react";
import AlertMessage from "../Components/UI/AlertMessage";

type AlertType = "success" | "error" | "info" | "warning" | "message";

interface AlertState {
  message: string;
  type: AlertType;
}

interface AlertContextType {
  showAlert: (message: string, type: AlertType) => void;
}

// Create the context
const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Create the provider component
export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alert, setAlert] = useState<AlertState | null>(null);

  const showAlert = (message: string, type: AlertType) => {
    setAlert({ message, type });

    // Automatically hide the alert after 5 seconds
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  const handleClose = () => {
    setAlert(null);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {/* The AlertMessage component now lives here, at the top level */}
      {alert && <AlertMessage message={alert.message} type={alert.type} onClose={handleClose} />}
      {children}
    </AlertContext.Provider>
  );
};

// Create a custom hook to easily use the alert context in any component
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};
