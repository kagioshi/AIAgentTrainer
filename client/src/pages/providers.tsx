import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Providers() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Provider Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Multi-provider configuration interface will be implemented here.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
