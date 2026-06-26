import { redirect } from "next/navigation";

// Auth désactivée — /login renvoie simplement vers le dashboard.
export default function LoginPage() {
  redirect("/");
}
