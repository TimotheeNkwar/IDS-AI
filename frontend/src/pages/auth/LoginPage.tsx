import LoginForm from "../../components/auth/LoginForm";
export default function LoginPage() {
  return (
    <div className="h-screen  flex items-center justify-center">
      <div className="rounded-lg shadow-lg">
        <LoginForm />
      </div>
    </div>
  );
}
