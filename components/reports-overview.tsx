import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function ReportsOverview() {
  const categories = [
    { name: "Emergency Calls", count: 12, total: 20, color: "bg-destructive" },
    { name: "Harassment Reports", count: 8, total: 15, color: "bg-yellow-500" },
    { name: "Domestic Violence", count: 5, total: 10, color: "bg-orange-500" },
    { name: "Suspicious Activity", count: 15, total: 25, color: "bg-blue-500" },
    { name: "Safety Escorts", count: 22, total: 30, color: "bg-green-600" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => (
          <div key={category.name} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">{category.name}</span>
              <span className="text-muted-foreground">
                {category.count}/{category.total}
              </span>
            </div>
            <Progress value={(category.count / category.total) * 100} className="h-2" />
          </div>
        ))}

        <div className="pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">87%</div>
            <div className="text-sm text-muted-foreground">Resolution Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
