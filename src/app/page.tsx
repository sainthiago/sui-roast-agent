import { ErrorBoundary } from "@/components/error-boundary";
import { RoastPage } from "@/components/roast-page";


export default function Page() {
  return (
    <ErrorBoundary>
      <RoastPage />
    </ErrorBoundary>
  );
}
