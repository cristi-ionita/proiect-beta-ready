"use client";

import type { ReactNode } from "react";

type AuthPageShellProps = {
  children: ReactNode;
  icon?: ReactNode;
  title?: string;
};

export default function AuthPageShell({
  children,
  icon,
  title,
}: AuthPageShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6">
      <div className="w-full max-w-lg">
        {(icon || title) && (
          <div className="mb-6 flex flex-col items-center justify-center text-center">
            {icon ? (
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-white/10 text-white backdrop-blur-md">
                {icon}
              </div>
            ) : null}

            {title ? (
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {title}
              </h1>
            ) : null}
          </div>
        )}

        <div className="flex justify-center">{children}</div>
      </div>
    </main>
  );
}