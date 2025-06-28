import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export function TestPushButton() {
  const handleTestPush = async () => {
    if (!('serviceWorker' in navigator)) {
      alert('Service workers not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Send test message to service worker
      if (registration.active) {
        registration.active.postMessage({
          type: 'TEST_PUSH'
        });
      }
      
      console.log('Test push notification sent via service worker');
    } catch (error) {
      console.error('Error sending test push:', error);
      alert('Error sending test push notification');
    }
  };

  return (
    <Button 
      onClick={handleTestPush}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Bell className="h-4 w-4" />
      Test Push
    </Button>
  );
}