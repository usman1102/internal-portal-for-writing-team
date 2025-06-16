
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserRole } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users } from "lucide-react";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { loginMutation, registerMutation, user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  // Registration form
  const registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    role: z.enum([UserRole.SALES, UserRole.TEAM_LEAD, UserRole.WRITER, UserRole.PROOFREADER]),
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: UserRole.WRITER,
    },
  });

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8 text-white">
          <h1 className="text-3xl font-bold mb-4 font-heading">
            WritePro: Freelance Writing Management Portal
          </h1>
          <p className="text-lg text-white/90 mb-6">
            Streamline your content creation workflow with our comprehensive management solution.
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-3">
              <div className="rounded-full bg-white/10 p-2">
                <FileText className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Efficient Task Management</h3>
                <p className="text-white/80 text-sm">
                  Create, assign, and track writing tasks with ease
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-3">
              <div className="rounded-full bg-white/10 p-2">
                <Users className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Role-Based Access</h3>
                <p className="text-white/80 text-sm">
                  Secure access for all team roles
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Login Form */}
        <Card className="backdrop-blur-md bg-white/95 border-0 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to WritePro</CardTitle>
            <CardDescription>
              Please log in to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
