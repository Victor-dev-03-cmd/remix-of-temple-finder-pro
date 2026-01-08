import { Shield, Lock, Key } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const SecuritySettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Security Settings</h2>
        <p className="text-muted-foreground">Configure authentication and security options</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Options
          </CardTitle>
          <CardDescription>Manage security preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between opacity-60">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <Label className="text-sm font-medium">Two-Factor Authentication</Label>
              </div>
              <p className="text-xs text-muted-foreground">Require 2FA for admin accounts</p>
            </div>
            <Switch disabled />
          </div>
          <Separator />
          <div className="flex items-center justify-between opacity-60">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <Label className="text-sm font-medium">Session Timeout</Label>
              </div>
              <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
            </div>
            <Switch disabled />
          </div>
          <p className="text-sm text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
            Advanced security features coming soon. Contact support for enterprise security options.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;