import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User as UserIcon, 
  Palette, 
  CreditCard, 
  Calendar,
  MapPin,
  GraduationCap,
  Mail
} from "lucide-react";

interface UserProfileDialogProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  isOwnProfile?: boolean;
}

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  dateOfBirth: z.string().optional(),
  city: z.string().optional(),
  degree: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const themes = [
  { id: "light", name: "Light", description: "Clean and bright interface" },
  { id: "dark", name: "Dark", description: "Easy on the eyes" },
  { id: "blue", name: "Blue Ocean", description: "Professional blue theme" },
  { id: "green", name: "Forest Green", description: "Nature-inspired green" },
  { id: "purple", name: "Royal Purple", description: "Creative purple theme" },
];

export function UserProfileDialog({ user, isOpen, onClose, isOwnProfile = false }: UserProfileDialogProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedTheme, setSelectedTheme] = useState("light");
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.fullName || "",
      email: user.email || "",
      dateOfBirth: user.dateOfBirth || "",
      city: user.city || "",
      degree: user.degree || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await apiRequest("PATCH", `/api/users/${user.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateThemeMutation = useMutation({
    mutationFn: async (theme: string) => {
      const res = await apiRequest("PATCH", `/api/users/${user.id}`, { theme });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Theme updated",
        description: "Your theme preference has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Theme update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleThemeChange = (theme: string) => {
    setSelectedTheme(theme);
    updateThemeMutation.mutate(theme);
  };

  const getProfileCompleteness = () => {
    const fields = [user.fullName, user.email, user.dateOfBirth, user.city, user.degree];
    const completed = fields.filter(field => field && field.trim() !== "").length;
    return Math.round((completed / fields.length) * 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            {isOwnProfile ? "My Profile" : `${user.fullName}'s Profile`}
          </DialogTitle>
          <DialogDescription>
            {isOwnProfile ? "Manage your account settings and preferences" : "View user profile information"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Profile
            </TabsTrigger>
            {isOwnProfile && (
              <>
                <TabsTrigger value="theme" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Theme
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payments
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{user.fullName}</h3>
                <p className="text-sm text-muted-foreground">
                  {user.role.replace('_', ' ')} • @{user.username}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Profile Completeness</div>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold">{getProfileCompleteness()}%</div>
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-primary rounded-full transition-all"
                      style={{ width: `${getProfileCompleteness()}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {isOwnProfile ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            Full Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Date of Birth
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            City
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Your city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="degree"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            Education/Degree
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Your degree or education background" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="w-full"
                  >
                    {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email
                  </div>
                  <p className="text-sm">{user.email || "Not provided"}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Date of Birth
                  </div>
                  <p className="text-sm">{user.dateOfBirth || "Not provided"}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    City
                  </div>
                  <p className="text-sm">{user.city || "Not provided"}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    Education
                  </div>
                  <p className="text-sm">{user.degree || "Not provided"}</p>
                </div>
              </div>
            )}
          </TabsContent>

          {isOwnProfile && (
            <>
              <TabsContent value="theme" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Choose Your Theme
                    </CardTitle>
                    <CardDescription>
                      Customize the appearance of your application
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {themes.map((theme) => (
                        <div
                          key={theme.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary ${
                            selectedTheme === theme.id ? "border-primary bg-primary/5" : "border-gray-200"
                          }`}
                          onClick={() => handleThemeChange(theme.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{theme.name}</h4>
                              <p className="text-sm text-muted-foreground">{theme.description}</p>
                            </div>
                            {selectedTheme === theme.id && (
                              <Badge variant="default">Active</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your payment methods and billing information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Payment Features Coming Soon</h3>
                      <p className="text-muted-foreground mb-4">
                        Payment functionality will be available in a future update. 
                        You'll be able to manage payment methods, view billing history, and set up automatic payments.
                      </p>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}