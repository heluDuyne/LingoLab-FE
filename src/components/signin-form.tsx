import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import { ROUTES } from "@/constants";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const signInSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormValues) => {
    try {
      await login({
        email: data.email,
        password: data.password,
      });

      // Get user role from store after login
      const user = useAuthStore.getState().user;

      toast.success("Login successful!");

      // Navigate based on role
      if (user?.role === "teacher") {
        navigate(ROUTES.TEACHER.DASHBOARD);
      } else if (user?.role === "learner") {
        navigate(ROUTES.LEARNER.DASHBOARD);
      } else if (user?.role === "admin") {
        // Assuming admin dashboard route exists or redirecting to home for now
        navigate("/"); 
        toast.info("Admin login successful. Admin dashboard under construction.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Login failed"
      );
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className='overflow-hidden p-0 border-border'>
        <CardContent className='grid p-0 md:grid-cols-2'>
          <form className='p-6 md:p-8' onSubmit={handleSubmit(onSubmit)}>
            <div className='flex flex-col gap-6'>
              {/* Header*/}
              <div className='flex flex-col items-center gap-2 text-center'>
                <a href='/' className='mx-auto block w-fit text-center'>
                  <img src='/logo.svg' alt='logo' />
                </a>
                <h1 className='text-2xl font-bold'>Sign In</h1>
                <p className='text-muted-foreground text-balance'>
                  Login to continue using our services
                </p>
              </div>
              {/* Username*/}

              {/* Email*/}
              <div className='flex flex-col gap-3'>
                <Label htmlFor='email' className='block text-sm'>
                  Email
                </Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='m@gmail.com'
                  {...register("email")}
                />

                {errors.email && (
                  <p className='text-xs text-destructive text-sm'>
                    {errors.email.message}
                  </p>
                )}
              </div>
              {/* Password*/}
              <div className='flex flex-col gap-3'>
                <Label htmlFor='password' className='block text-sm'>
                  Password
                </Label>
                <div className='relative'>
                  <Input
                    id='password'
                    type={showPassword ? "text" : "password"}
                    placeholder='Password'
                    {...register("password")}
                    className='pr-10'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p className='text-xs text-destructive text-sm'>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              <div className='text-center'>
                <p className='text-sm text-muted-foreground'>
                  Don't have an account?{" "}
                  <a href='/signup' className='text-primary underline'>
                    Sign up
                  </a>
                </p>
              </div>
            </div>
          </form>
          <div className='bg-muted relative hidden md:block'>
            <img
              src='/placeholderSignUp.png'
              alt='Image'
              className='absolute top-1/2 -translate-y-1/2 object-cover '
            />
          </div>
        </CardContent>
      </Card>
      <div className='text-xs text-balance px-6 text-center *:[a]:hover:text-primary text-muted-foreground *[a]:underline *[a]:underline-offset-4'>
        By continuing, you agree to our{" "}
        <a href='#'>Terms of Service</a> and <a href='#'>Privacy Policy</a>
        .
      </div>
    </div>
  );
}
