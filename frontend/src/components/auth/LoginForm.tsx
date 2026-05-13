import { z } from "zod";
import { useAuthStore } from "../../stores/authStore.ts";
// import { Navigate } from "react-router-dom";
import type { LoginCredentials } from "../../types/types.ts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { loginApi } from "../../features/auth/authApi.ts";
import { getMeApi } from "../../features/auth/authApi.ts";
import { useNavigate } from "react-router-dom";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// const register
export default function LoginForm() {
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
  });

  const { mutate: login, isPending } = useMutation({
    mutationFn: loginApi,

    onSuccess: async (data) => {
      setTokens(data.access_token);

      const user = await getMeApi();

      setUser(user);

      navigate("/");
    },

    onError: () => {
      setError("password", { message: "Invalid email or password" });
    },
  });

  const onSubmit = (data: LoginCredentials) => {
    login({ email: data.email, password: data.password });
  };
  return (
    <>
      {/* Limiter la largeur de la card */}
      <div className="flex items-center justify-center h-full">
        <div className="w-96 rounded-3xl px-8 py-10 bg-gray-800/70 backdrop-blur-md shadow-lg border border-gray-700">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-white mb-2">
              Welcome back!
            </h1>
            <h1 className="text-gray-200 text-sm  mb-8">
              Login to your account
            </h1>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4 relative">
              <input
                className="w-full px-4 pt-6 pb-2 rounded-2xl bg-gray-800/50 backdrop-blur-md text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-700 peer border border-gray-600/50 hover:border-gray-500 transition duration-200"
                type="text"
                id="email"
                placeholder=" "
                {...register("email")}
              />
              <label
                htmlFor="email"
                className="absolute left-4 top-4 text-white text-sm transition-all duration-200
               peer-focus:top-1 peer-focus:text-xs peer-focus:text-fuchsia-400
               peer-not-placeholder-shown:top-1 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-fuchsia-400"
              >
                Email
              </label>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="mb-4 relative">
              <input
                className="w-full px-4 pt-6 pb-2 rounded-2xl bg-gray-800/50 backdrop-blur-md text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-700 peer border border-gray-600/50 hover:border-gray-500 transition duration-200"
                type="password"
                id="password"
                placeholder=" "
                {...register("password")}
              />
              <label
                htmlFor="password"
                className="absolute left-4 top-4 text-white text-sm transition-all duration-200
               peer-focus:top-1 peer-focus:text-xs peer-focus:text-fuchsia-400
               peer-not-placeholder-shown:top-1 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-fuchsia-400"
              >
                Password
              </label>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Bouton plus sobre */}
            <button className="w-full mt-2 bg-fuchsia-700/80 hover:bg-fuchsia-600 text-white mb-4 py-3 rounded-2xl transition duration-200">
              Login
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
