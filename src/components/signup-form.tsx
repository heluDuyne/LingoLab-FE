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
    lastname: z.string().min(1, { message: "Họ là bắt buộc" }),
    firstname: z.string().min(1, { message: "Tên là bắt buộc" }),
    email: z.string().email({ message: "Email không hợp lệ" }),
    password: z.string().min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" }),
    confirmPassword: z.string().min(8, { message: "Xác nhận mật khẩu phải có ít nhất 8 ký tự" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
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
      toast.success("Đăng ký thành công!");
      navigate("/signin");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Đăng ký thất bại"
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
                <h1 className='text-2xl font-bold'>Tạo tài khoản </h1>
                <p className='text-muted-foreground text-balance'>
                  Đăng ký để trở thành một người dùng của chúng tôi
                </p>
              </div>
              {/* Họ và tên*/}
              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-2'>
                  <Label htmlFor='lastname' className='block text-sm'>
                    Họ
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
                    Tên
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
                  Mật khẩu
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
                   Xác nhận mật khẩu
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
                {isLoading ? "Đang xử lý..." : "Tạo tài khoản"}
              </Button>

              <div className='text-center'>
                <p className='text-sm text-muted-foreground'>
                  Bạn đã có tài khoản?{" "}
                  <a href='/signin' className='text-primary underline'>
                    Đăng nhập
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
        Bằng cách tiếp tục, bạn đồng ý với các{" "}
        <a href='#'>Điều khoản dịch vụ</a> và <a href='#'>Chính sách bảo mật</a>
        .
      </div>
    </div>
  );
}
