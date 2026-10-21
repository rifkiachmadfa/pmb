import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { getSessionUser } from "@/server/auth/session";

/** Header actions: "Masuk" for visitors, "Dashboard" + "Keluar" when signed in. */
export async function HeaderAccount() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <Link href="/masuk" className={buttonVariants({ size: "sm" })}>
        Masuk
      </Link>
    );
  }

  return (
    <>
      <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        Dashboard
      </Link>
      <form action={signOut}>
        <Button type="submit" variant="outline" size="sm">
          Keluar
        </Button>
      </form>
    </>
  );
}
