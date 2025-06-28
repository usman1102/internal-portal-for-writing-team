import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bell, TestTube, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

export function NotificationTestPanel() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTestingInProgress, setIsTestingInProgress] = useState(false);

  const updateTestResult = (name: string, status: 'success' | 'error', message: string) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        existing.status = status;
        existing.message = message;
        return [...prev];
      }
      return [...prev, { name, status, message }];
    });
  };

  const runComprehensiveTest = async () => {
    setIsTestingInProgress(true);
    setTestResults([]);

    try {
      // Test 1: Service Worker Registration
      updateTestResult('Service Worker', 'pending', 'Checking...');
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        updateTestResult('Service Worker', 'success', 'Registered and ready');
      } else {
        updateTestResult('Service Worker', 'error', 'Not supported');
      }

      // Test 2: Notification Permission
      updateTestResult('Notification Permission', 'pending', 'Checking...');
      if ('Notification' in window) {
        const permission = Notification.permission;
        if (permission === 'granted') {
          updateTestResult('Notification Permission', 'success', 'Permission granted');
        } else if (permission === 'denied') {
          updateTestResult('Notification Permission', 'error', 'Permission denied');
        } else {
          updateTestResult('Notification Permission', 'error', 'Permission not requested');
        }
      } else {
        updateTestResult('Notification Permission', 'error', 'Notifications not supported');
      }

      // Test 3: VAPID Key Retrieval
      updateTestResult('VAPID Configuration', 'pending', 'Fetching...');
      try {
        const response = await fetch('/api/vapid-public-key');
        if (response.ok) {
          const data = await response.json();
          updateTestResult('VAPID Configuration', 'success', `Key: ${data.publicKey.substring(0, 20)}...`);
        } else {
          updateTestResult('VAPID Configuration', 'error', 'Failed to fetch VAPID key');
        }
      } catch (error) {
        updateTestResult('VAPID Configuration', 'error', 'Network error');
      }

      // Test 4: Push Manager Subscription
      updateTestResult('Push Manager', 'pending', 'Checking subscription...');
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            updateTestResult('Push Manager', 'success', 'Subscription active');
          } else {
            updateTestResult('Push Manager', 'error', 'No active subscription');
          }
        } catch (error) {
          updateTestResult('Push Manager', 'error', 'Failed to check subscription');
        }
      } else {
        updateTestResult('Push Manager', 'error', 'Push Manager not supported');
      }

      // Test 5: Server Connection
      updateTestResult('Server Connection', 'pending', 'Testing API...');
      try {
        const response = await apiRequest('GET', '/api/notifications/unread-count');
        updateTestResult('Server Connection', 'success', 'API accessible');
      } catch (error) {
        updateTestResult('Server Connection', 'error', 'API connection failed');
      }

    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setIsTestingInProgress(false);
    }
  };

  const testPushMutation = useMutation({
    mutationFn: async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          registration.active.postMessage({
            type: 'TEST_PUSH'
          });
        }
      }
    },
    onSuccess: () => {
      updateTestResult('Test Notification', 'success', 'Test notification sent');
    },
    onError: (error) => {
      updateTestResult('Test Notification', 'error', 'Failed to send test notification');
    }
  });

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">✓</Badge>;
      case 'error':
        return <Badge variant="destructive">✗</Badge>;
      case 'pending':
        return <Badge variant="secondary">⏳</Badge>;
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Push Notification Test Panel
        </CardTitle>
        <CardDescription>
          Test and verify push notification functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Controls */}
        <div className="flex gap-2">
          <Button 
            onClick={runComprehensiveTest}
            disabled={isTestingInProgress}
            variant="outline"
            className="flex-1"
          >
            {isTestingInProgress ? 'Testing...' : 'Run Full Test'}
          </Button>
          
          <Button 
            onClick={() => testPushMutation.mutate()}
            disabled={testPushMutation.isPending}
            variant="outline"
          >
            <Bell className="h-4 w-4 mr-2" />
            Test Push
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Test Results:</h4>
            {testResults.map((result) => (
              <div key={result.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <span className="text-sm font-medium">{result.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">{result.message}</span>
                  {getStatusBadge(result.status)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status Summary */}
        {testResults.length > 0 && (
          <Alert>
            <AlertDescription className="text-sm">
              {testResults.filter(r => r.status === 'success').length} of {testResults.length} tests passed.
              {testResults.some(r => r.status === 'error') && ' Check failed tests above.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}