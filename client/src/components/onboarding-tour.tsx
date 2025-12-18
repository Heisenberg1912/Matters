import Joyride, { type CallBackProps, type Step } from "react-joyride";

type OnboardingTourProps = {
  steps: Step[];
  run?: boolean;
  onClose?: () => void;
};

export function OnboardingTour({ steps, run = false, onClose }: OnboardingTourProps) {
  const handleCallback = (data: CallBackProps) => {
    if (data.status === "finished" || data.status === "skipped") {
      onClose?.();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      styles={{
        options: {
          primaryColor: "#cfe0ad",
          backgroundColor: "#0c0c0c",
          textColor: "#f5f5f5",
          overlayColor: "rgba(0,0,0,0.6)",
          arrowColor: "#0c0c0c"
        }
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Done",
        next: "Next",
        skip: "Skip"
      }}
      callback={handleCallback}
    />
  );
}
