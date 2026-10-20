import { Suspense } from "react";
import LoginClient from "../../components/LoginClient";

export const metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}
