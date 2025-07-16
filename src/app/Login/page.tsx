import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Login | Lotto-App" };

export default function LoginPage() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-sky-800 to-emerald-700 px-4">
      <LoginForm />
    </section>
  );
}
