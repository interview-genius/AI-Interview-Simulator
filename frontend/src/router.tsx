import { Routes, Route, Navigate } from 'react-router-dom';
import { CodingRoundPage } from './components/coding/CodingRoundPage';
import { MLRoundPage } from './components/ml/MLRoundPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { LandingPage } from './components/setup/LandingPage';
import { AuthPage } from './components/setup/AuthPage';
import { SetupPage } from './components/setup/SetupPage';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { PrepScreen } from './components/setup/PrepScreen';
import { FeedbackPage } from './components/dashboard/FeedbackPage';
import { InterviewHistoryPage } from './components/dashboard/InterviewHistoryPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/onboarding" element={<OnboardingFlow />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/prep" element={<PrepScreen />} />
      <Route path="/coding" element={<CodingRoundPage />} />
      <Route path="/ml" element={<MLRoundPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/interviews" element={<InterviewHistoryPage />} />
      <Route path="/results" element={<FeedbackPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
