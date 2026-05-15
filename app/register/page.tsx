import { RegisterForm } from "@/components/register-form"
import { Shield } from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background bg-grid-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-primary/15 animate-glow-blue">
              <Shield className="h-10 w-10 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Station Registration
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Register your police station for the Women Safety Division
            </p>
          </div>
        </div>

        <RegisterForm />

        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            🔒 Secure Government Portal
          </p>
          <p className="text-xs text-muted-foreground/50">
            Contact IT Support for access issues
          </p>
        </div>
      </div>
    </div>
  )
}
