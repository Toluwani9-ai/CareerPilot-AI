import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UploadCV from "./pages/UploadCV";
import JobComparison from "./pages/JobComparison";
import CareerRecommendation from "./pages/CareerRecommendation";
import LearningRoadmap from "./pages/LearningRoadmap";
import InterviewPractice from "./pages/InterviewPractice";
import CoverLetter from "./pages/CoverLetter";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload-cv" element={<UploadCV />} />
          <Route path="/job-comparison" element={<JobComparison />} />

          <Route
            path="/career-recommendations"
            element={<CareerRecommendation />}
          />

          <Route path="/learning-roadmap" element={<LearningRoadmap />} />
          <Route path="/interview-practice" element={<InterviewPractice />} />
          <Route path="/cover-letter" element={<CoverLetter />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;