import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/stores";
import { ROUTES } from "@/constants";
import { toast } from "sonner";
import { userApi } from "@/services/api/users";
import { uploadApi } from "@/services/api/upload";
import { authApi } from "@/services/api/auth";
import {
  User as UserIcon,
  Camera,
  Mail,
  Phone,
  Flag,
  Save,
  KeyRound,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { learnerProfileApi } from "@/services/api/learner-profiles";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const [firstName, setFirstName] = useState(
    user?.name?.split(" ")[0] || ""
  );
  const [lastName, setLastName] = useState(
    user?.name?.split(" ").slice(1).join(" ") || ""
  );
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState(""); // Removed default hardcoded phone
  const [targetBand, setTargetBand] = useState("6.0");

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Password Visibility State
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        setIsLoading(true);
        try {
          const profile = await learnerProfileApi.getProfileByUserId(user.id);
          if (profile) {
            setProfileId(profile.id);
            setFirstName(profile.firstName || user.name.split(" ")[0] || "");
            setLastName(profile.lastName || user.name.split(" ").slice(1).join(" ") || "");
            setTargetBand(profile.targetBand?.toString() || "6.0");
            setBio(profile.learningGoals || "");
            // Note: Phone and Bio aren't direct matches in LearnerProfile vs User currently, 
            // mapping Bio to LearningGoals for now.
          }
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user?.id]);

  const handleSave = async () => {
    if (!profileId || !user) return;

    setIsSaving(true);
    try {
      // 1. Update Backend Learner Profile (which verifies user update too)
      await learnerProfileApi.updateProfile(profileId, {
        firstName,
        lastName,
        targetBand: parseFloat(targetBand),
        learningGoals: bio,
      });

      // 2. Update Local User Store
      setUser({
        ...user,
        name: `${firstName} ${lastName}`.trim(),
      });

      setIsSuccessOpen(true);

    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate type and size (max 5MB)
    if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file.');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB.');
        return;
    }

    try {
        const toastId = toast.loading('Uploading avatar...');
        
        // 1. Upload to Cloudinary/Server
        const { url } = await uploadApi.uploadFile(file);
        
        // 2. Update User Profile
        const updatedUser = await userApi.updateUser(user.id, {
            avatar: url
        });

        // 3. Update Local Store
        setUser(updatedUser);
        
        toast.dismiss(toastId);
        toast.success('Avatar updated successfully!');
        
    } catch (error) {
        console.error('Failed to upload avatar', error);
        toast.error('Failed to upload avatar.');
    } finally {
        // Reset input
        e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    
    // Optimistic UI update/Confirm dialog could be added, but for now direct removal
    try {
        const toastId = toast.loading('Removing avatar...');
        
        // Update User Profile with null/empty avatar
        // Note: Backend should handle null/empty string to remove the avatar
        const updatedUser = await userApi.updateUser(user.id, {
            avatar: '' // Sending empty string to indicate removal
        });

        // Update Local Store
        setUser(updatedUser);
        
        toast.dismiss(toastId);
        toast.success('Avatar removed successfully');
        
    } catch (error) {
        console.error('Failed to remove avatar', error);
        toast.error('Failed to remove avatar');
    }
  };

  const handlePasswordChange = async () => {
     if (!currentPassword || !newPassword || !confirmPassword) {
         toast.error("Please fill in all password fields.");
         return;
     }

     if (newPassword !== confirmPassword) {
         toast.error("New passwords do not match.");
         return;
     }

     if (newPassword.length < 6) {
         toast.error("New password must be at least 6 characters long.");
         return;
     }

     try {
         const toastId = toast.loading("Changing password...");
         await authApi.changePassword({
             currentPassword,
             newPassword,
             confirmPassword
         });
         
         toast.dismiss(toastId);
         toast.success("Password changed successfully!");
         
         // Clear fields
         setCurrentPassword("");
         setNewPassword("");
         setConfirmPassword("");
         
     } catch (error: any) {
         console.error("Failed to change password", error);
         toast.error(error.response?.data?.message || "Failed to change password. Please check your current password.");
     }
  };

  const handleCancel = () => {
    navigate(ROUTES.LEARNER.DASHBOARD);
  };

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Success</DialogTitle>
            <DialogDescription>
              Profile updated successfully!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
              onClick={() => setIsSuccessOpen(false)}
            >
              OK
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Main Content */}
      <main className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-6 pt-6">
          <h2 className="text-slate-900 text-3xl font-bold tracking-tight">
            Edit Profile
          </h2>
          <p className="text-slate-500 text-base">
            Update your personal information and learning goals for your IELTS
            journey.
          </p>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row gap-6 items-center text-center sm:text-left">
              <div className="relative group">
                <div
                  className="bg-center bg-no-repeat bg-cover rounded-full w-24 h-24 border-4 border-white shadow-md bg-slate-200 flex items-center justify-center"
                  style={{
                    backgroundImage: user?.avatar
                      ? `url("${user.avatar}")`
                      : undefined,
                  }}
                >
                  {!user?.avatar && (
                    <span className="text-2xl font-bold text-slate-400">
                      {firstName?.[0] || user?.name?.[0] || "U"}
                    </span>
                  )}
                </div>
                <button
                  className="absolute bottom-0 right-0 bg-purple-600 text-white p-1.5 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
                  title="Change photo"
                  onClick={() => document.getElementById('student-avatar-upload')?.click()}
                >
                  <Camera size={16} />
                </button>
                <input 
                    type="file" 
                    id="student-avatar-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleAvatarUpload}
                />
              </div>
              <div>
                <h3 className="text-slate-900 text-xl font-bold">
                  {firstName} {lastName}
                </h3>
                <p className="text-slate-500 text-sm font-medium mt-1">
                  Student • Band {targetBand === "8.5" ? "8.5+" : targetBand}
                </p>
                <div className="flex items-center gap-1 mt-2 justify-center sm:justify-start">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    Verified Student
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                className="flex-1 sm:flex-none items-center justify-center rounded-lg px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
                onClick={handleRemoveAvatar}
              >
                Remove
              </button>
              <button className="flex-1 sm:flex-none items-center justify-center rounded-lg px-4 py-2 border border-slate-200 text-purple-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                Change Photo
              </button>
            </div>
          </div>
        </div>

        {/* Personal Info Form */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
              <UserIcon size={20} className="text-purple-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  First Name
                </label>
                <input
                  className="w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 placeholder:text-slate-400 px-4 py-2.5 transition-all text-sm border"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Last Name
                </label>
                <input
                  className="w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 placeholder:text-slate-400 px-4 py-2.5 transition-all text-sm border"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Mail size={18} />
                  </span>
                  <input
                    className="w-full rounded-lg bg-slate-100 border-slate-200 text-slate-500 pl-10 pr-4 py-2.5 text-sm border cursor-not-allowed"
                    type="email"
                    value={user?.email || ""}
                    disabled
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Phone size={18} />
                  </span>
                  <input
                    className="w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 placeholder:text-slate-400 pl-10 pr-4 py-2.5 transition-all text-sm border"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Bio & Learning Goals
                </label>
                <textarea
                  className="w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 placeholder:text-slate-400 px-4 py-2.5 transition-all text-sm resize-none border min-h-[100px]"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself and your IELTS goals..."
                  maxLength={300}
                />
                <p className="text-xs text-slate-500 text-right">
                  {bio.length}/300 characters
                </p>
              </div>
              <div className="md:col-span-2 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Flag size={18} className="text-purple-600" />
                    IELTS Target Band Score
                  </label>
                  <select
                    className="w-full rounded-lg bg-white border-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 text-slate-900 px-4 py-2.5 text-sm"
                    value={targetBand}
                    onChange={(e) => setTargetBand(e.target.value)}
                  >
                    <option value="6.0">Band 6.0</option>
                    <option value="6.5">Band 6.5</option>
                    <option value="7.0">Band 7.0</option>
                    <option value="7.5">Band 7.5</option>
                    <option value="8.0">Band 8.0</option>
                    <option value="8.5">Band 8.5+</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    This helps our AI tailor your assignments.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
              <KeyRound size={20} className="text-purple-600" />
              Password Change
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 px-4 py-2.5 text-sm border pr-10"
                    placeholder="••••••••"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 px-4 py-2.5 text-sm border pr-10"
                    placeholder="••••••••"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 px-4 py-2.5 text-sm border pr-10"
                    placeholder="••••••••"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="md:col-span-3 flex justify-end">
                  <button 
                    onClick={handlePasswordChange}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
                  >
                      Update Password
                  </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="sticky bottom-4 z-40 bg-white border border-slate-200 p-4 rounded-xl shadow-lg flex justify-end gap-3 items-center mt-4">
          <button
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="px-6 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 shadow-sm transition-colors flex items-center gap-2 shadow-purple-200"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Save size={18} />
            )}
            Save Changes
          </button>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;

