import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AiTraining() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Agent Training</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              AI agent training interface will be implemented here.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
