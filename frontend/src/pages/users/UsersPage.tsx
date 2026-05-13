import { useAuthStore } from "../../stores/authStore";

export default function UsersPage() {
  const { logout } = useAuthStore();
  return (
    <div>
      <h1>Userxxxs</h1>
      <button onClick={logout}>Se déconnecter</button>;
    </div>
  );
}
