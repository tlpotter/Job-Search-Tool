import { JobFeed } from "@/components/job-feed";
import { AppHeader } from "@/components/app-header";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-base-200">
      <AppHeader />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <JobFeed />
      </div>
    </div>
  );
}
