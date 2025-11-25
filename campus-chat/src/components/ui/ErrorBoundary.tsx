import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("Uncaught error in component", error, { errorInfo: errorInfo.componentStack });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          height: "100vh", 
          padding: "20px",
          textAlign: "center",
          backgroundColor: "#f8d7da",
          color: "#721c24"
        }}>
          <h1>Algo salió mal.</h1>
          <p>{this.state.error?.message || "Error desconocido"}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#721c24",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}



