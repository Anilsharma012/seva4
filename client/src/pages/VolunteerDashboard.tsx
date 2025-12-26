import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Heart, LogOut, Edit, Save, Loader2, QrCode, Smartphone } from "lucide-react";

interface VolunteerData {
  _id: string;
  email: string;
  fullName: string;
  phone: string;
  address?: string;
  city?: string;
  occupation?: string;
  skills?: string;
  availability?: string;
  qrCodeUrl?: string;
  upiId?: string;
}

export default function VolunteerDashboard() {
  const { user, logout, isVolunteer, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [volunteer, setVolunteer] = useState<VolunteerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    occupation: "",
    skills: "",
    availability: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    qrCodeUrl: "",
    upiId: "",
  });

  useEffect(() => {
    if (!authLoading && !isVolunteer) {
      navigate("/volunteer/login");
      return;
    }
    
    if (user?.id) {
      fetchVolunteerData();
    }
  }, [isVolunteer, user, authLoading, navigate]);

  const fetchVolunteerData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/volunteer/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setVolunteer(data);
        setProfileForm({
          fullName: data.fullName || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          occupation: data.occupation || "",
          skills: data.skills || "",
          availability: data.availability || "",
        });
        setPaymentForm({
          qrCodeUrl: data.qrCodeUrl || "",
          upiId: data.upiId || "",
        });
      }
    } catch (error) {
      console.error("Error fetching volunteer data:", error);
      toast({
        title: "Error",
        description: "Failed to load volunteer data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileForm.fullName.trim()) {
      toast({
        title: "Error",
        description: "Full name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/volunteer/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      if (res.ok) {
        const data = await res.json();
        setVolunteer(data);
        setIsEditingProfile(false);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePaymentDetails = async () => {
    if (!paymentForm.upiId.trim() && !paymentForm.qrCodeUrl.trim()) {
      toast({
        title: "Error",
        description: "Please provide at least UPI ID or QR Code URL",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/volunteer/payment-details", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentForm),
      });

      if (res.ok) {
        const data = await res.json();
        setVolunteer(data);
        setIsEditingPayment(false);
        toast({
          title: "Success",
          description: "Payment details updated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment details",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/volunteer/login");
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!volunteer) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Volunteer profile not found. Please contact admin.</p>
          <Button onClick={handleLogout} className="mt-4">
            Logout
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Welcome, {volunteer.fullName}!</h1>
                <p className="text-muted-foreground">स्वयंसेवक पोर्टल / Volunteer Portal</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Logout / लॉगआउट करें
            </Button>
          </div>

          {/* Profile Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Profile / आपकी प्रोफाइल</CardTitle>
              <Button
                size="sm"
                variant={isEditingProfile ? "default" : "outline"}
                onClick={() => {
                  if (isEditingProfile) {
                    handleSaveProfile();
                  } else {
                    setIsEditingProfile(true);
                  }
                }}
                disabled={isSaving}
              >
                {isEditingProfile ? (
                  <Save className="h-4 w-4 mr-2" />
                ) : (
                  <Edit className="h-4 w-4 mr-2" />
                )}
                {isEditingProfile ? "Save" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  {isEditingProfile ? (
                    <Input
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      placeholder="Full Name"
                    />
                  ) : (
                    <p className="font-medium mt-1">{volunteer.fullName}</p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium mt-1">{volunteer.email}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  {isEditingProfile ? (
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="Phone Number"
                    />
                  ) : (
                    <p className="font-medium mt-1">{volunteer.phone || "-"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">City / शहर</Label>
                  {isEditingProfile ? (
                    <Input
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      placeholder="City"
                    />
                  ) : (
                    <p className="font-medium mt-1">{volunteer.city || "-"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">Occupation / व्यवसाय</Label>
                  {isEditingProfile ? (
                    <Input
                      value={profileForm.occupation}
                      onChange={(e) => setProfileForm({ ...profileForm, occupation: e.target.value })}
                      placeholder="Occupation"
                    />
                  ) : (
                    <p className="font-medium mt-1">{volunteer.occupation || "-"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">Availability / उपलब्धता</Label>
                  {isEditingProfile ? (
                    <Input
                      value={profileForm.availability}
                      onChange={(e) => setProfileForm({ ...profileForm, availability: e.target.value })}
                      placeholder="e.g., Weekends, Full-time"
                    />
                  ) : (
                    <p className="font-medium mt-1">{volunteer.availability || "-"}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Address / पता</Label>
                {isEditingProfile ? (
                  <Textarea
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    placeholder="Full Address"
                    rows={2}
                  />
                ) : (
                  <p className="font-medium mt-1">{volunteer.address || "-"}</p>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground">Skills / कौशल</Label>
                {isEditingProfile ? (
                  <Textarea
                    value={profileForm.skills}
                    onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                    placeholder="Your skills and expertise"
                    rows={2}
                  />
                ) : (
                  <p className="font-medium mt-1">{volunteer.skills || "-"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Details Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Payment Details / भुगतान विवरण
              </CardTitle>
              <Button
                size="sm"
                variant={isEditingPayment ? "default" : "outline"}
                onClick={() => {
                  if (isEditingPayment) {
                    handleSavePaymentDetails();
                  } else {
                    setIsEditingPayment(true);
                  }
                }}
                disabled={isSaving}
              >
                {isEditingPayment ? (
                  <Save className="h-4 w-4 mr-2" />
                ) : (
                  <Edit className="h-4 w-4 mr-2" />
                )}
                {isEditingPayment ? "Save" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  <strong>Note:</strong> Add your UPI ID and QR Code URL so donors can contribute to your work.
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  UPI ID / यूपीआई आईडी
                </Label>
                {isEditingPayment ? (
                  <Input
                    value={paymentForm.upiId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
                    placeholder="your.upi@bank"
                  />
                ) : (
                  <p className="font-medium mt-1">
                    {volunteer.upiId ? (
                      <span className="text-green-600">✓ {volunteer.upiId}</span>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Code URL
                </Label>
                {isEditingPayment ? (
                  <Textarea
                    value={paymentForm.qrCodeUrl}
                    onChange={(e) => setPaymentForm({ ...paymentForm, qrCodeUrl: e.target.value })}
                    placeholder="Paste the complete image URL of your QR code"
                    rows={2}
                  />
                ) : (
                  <div className="mt-2">
                    {volunteer.qrCodeUrl ? (
                      <div className="space-y-2">
                        <p className="text-green-600">✓ QR Code uploaded</p>
                        <img src={volunteer.qrCodeUrl} alt="QR Code" className="w-32 h-32 object-contain border rounded" />
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No QR code uploaded yet</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-primary/5">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>📋 Information:</strong> Your payment details help donors and community members support your volunteer work. 
                Make sure to keep them updated. You can manage these details anytime through your dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
