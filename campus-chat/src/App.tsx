import { Toaster } from "sonner";
import { AppRouter } from "./app/router";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const App = () => {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" richColors />
      <AppRouter />
    </ErrorBoundary>
  );
};

export default App;


