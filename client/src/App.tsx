import AppRouter from "@/router/AppRouter";
import { AuthProvider } from "@/context/AuthContext";
import { ProjectProvider } from "@/context/ProjectContext";
import { NotificationProvider } from "@/context/NotificationContext";

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ProjectProvider>
          <AppRouter />
        </ProjectProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
