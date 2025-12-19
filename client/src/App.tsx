import AppRouter from "@/router/AppRouter";
import { AuthProvider } from "@/context/AuthContext";
import { ProjectProvider } from "@/context/ProjectContext";

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <AppRouter />
      </ProjectProvider>
    </AuthProvider>
  );
}
