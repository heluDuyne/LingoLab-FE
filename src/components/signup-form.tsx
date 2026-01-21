import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/stores";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const signUpSchema = z
  .object({
    lastname: z.string().min(1, { message: "Last name is required" }),
    firstname: z.string().min(1, { message: "First name is required" }),
    email: z.string().email({ message: "Invalid email" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string().min(8, { message: "Confirm password must be at least 8 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormValues) => {
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        firstName: data.firstname,
        lastName: data.lastname,
      });
      toast.success("Registration successful!");
      navigate("/signin");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Registration failed"
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
                <h1 className='text-2xl font-bold'>Create an account</h1>
                <p className='text-muted-foreground text-balance'>
                  Sign up to become our user
                </p>
              </div>
              {/* Họ và tên*/}
              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-2'>
                  <Label htmlFor='lastname' className='block text-sm'>
                    Last Name
                  </Label>
                  <Input id='lastname' type='text' {...register("lastname")} />

                  {errors.lastname && (
                    <p className='text-xs text-destructive text-sm'>
                      {errors.lastname.message}
                    </p>
                  )}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='firstname' className='block text-sm'>
                    First Name
                  </Label>
                  <Input
                    id='firstname'
                    type='text'
                    {...register("firstname")}
                  />

                  {errors.firstname && (
                    <p className='text-xs text-destructive text-sm'>
                      {errors.firstname.message}
                    </p>
                  )}
                </div>
              </div>
              
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
                <Input
                  id='password'
                  type='password'
                  {...register("password")}
                />

                {errors.password && (
                  <p className='text-xs text-destructive text-sm'>
                    {errors.password.message}
                  </p>
                )}
              </div>
              {/* Confirm Password*/}
              <div className='flex flex-col gap-3'>
                <Label htmlFor='confirmPassword' className='block text-sm'>
                   Confirm Password
                </Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  {...register("confirmPassword")}
                />

                {errors.confirmPassword && (
                  <p className='text-xs text-destructive text-sm'>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? "Processing..." : "Create account"}
              </Button>

              <div className='text-center'>
                <p className='text-sm text-muted-foreground'>
                  Already have an account?{" "}
                  <a href='/signin' className='text-primary underline'>
                    Sign in
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
