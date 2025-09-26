import { RegisterForm } from "@/components/register-form"
import { Shield } from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Police Portal</h1>
          <p className="text-muted-foreground">Officer Registration</p>
        </div>

        <RegisterForm />

        <div className="text-center text-sm text-muted-foreground">
          <p>Authorized Personnel Only</p>
          <p>Contact IT Support for access issues</p>
        </div>
      </div>
    </div>
  )
}
