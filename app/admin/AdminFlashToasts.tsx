"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { useToast } from "@/components/ui/Toast";

function withoutKey(params: URLSearchParams, key: string) {
  const next = new URLSearchParams(params);
  next.delete(key);
  return next;
}

export function AdminFlashToasts() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  React.useEffect(() => {
    const e = params.get("error");
    if (e) {
      const errorMap: Record<string, string> = {
        invalid_login: "Invalid username or password.",
        invalid_fields: "Please fill all required fields correctly.",
        username_taken: "That username is already in use.",
        email_taken: "That email is already in use.",
        weak_password: "Password is too weak.",
        create_failed: "Could not complete the request.",
        auth_db_error: "Auth database error while creating user.",
        auth_update_failed: "Could not update the user in Auth.",
        auth_delete_failed: "Could not delete the user in Auth.",
        db_write_failed: "Could not save changes to the database.",
        db_verify_failed: "Saved, but could not verify the record.",
        forbidden: "You don’t have access to do that.",
        cannot_delete_self: "You can’t delete the account you’re signed in with.",
        user_in_use: "This user has activity linked to them. Deactivate instead of deleting.",
        missing_file: "Please choose a CSV file to import.",
        empty_file: "That CSV file is empty.",
        no_rows: "No valid rows found in the CSV.",
        import_failed: "Could not import leads.",
        call_log_failed: "Could not save call log.",
        calendar_missing: "Calendar ID missing.",
        calendar_sync_failed: "Could not sync calendar.",
        invalid: "Invalid request.",
      };
      toast({ title: errorMap[e] ?? "Something went wrong", variant: "error" });
      const next = withoutKey(params, "error");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
      return;
    }

    const t = params.get("toast");
    if (!t) return;

    const map: Record<string, { title: string; variant: "success" | "error" | "info" }> = {
      login: { title: "Signed in", variant: "success" },
      logout: { title: "Signed out", variant: "success" },
      user_created: { title: "User created", variant: "success" },
      user_updated: { title: "User updated", variant: "success" },
      user_deactivated: { title: "User deactivated", variant: "success" },
      user_reactivated: { title: "User reactivated", variant: "success" },
      user_deleted: { title: "User deleted", variant: "success" },
      lead_created: { title: "Lead created", variant: "success" },
      lead_updated: { title: "Lead updated", variant: "success" },
      import_ok: { title: "Import completed", variant: "success" },
      export_ok: { title: "Export started", variant: "success" },
      call_logged: { title: "Call saved", variant: "success" },
      audits_synced: { title: "Calendar synced", variant: "success" },
      error: { title: "Something went wrong", variant: "error" },
    };

    const item = map[t] ?? { title: t.replace(/_/g, " "), variant: "info" };
    toast({ title: item.title, variant: item.variant });

    const next = withoutKey(params, "toast");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [params, pathname, router, toast]);

  return null;
}
