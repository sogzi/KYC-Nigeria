import Link from 'next/link';
import { requireAdminUser } from '@/lib/admin-auth';
import { adminLogout } from '@/app/actions/admin-auth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Flag,
  FileAudio,
  ScrollText,
  LogOut,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

/**
 * Protected dashboard layout.
 *
 * This file lives inside app/admin/(dashboard)/ — a Next.js route group.
 * Route groups don't change the URL, so pages here still resolve to /admin/*.
 * CRUCIALLY, app/admin/login/page.tsx is OUTSIDE this group, so it is never
 * wrapped by this layout and the redirect loop is structurally impossible.
 */

const NAV = [
  { href: '/admin',             label: 'Overview',    Icon: LayoutDashboard },
  { href: '/admin/candidates',  label: 'Candidates',  Icon: Users           },
  { href: '/admin/fact-checks', label: 'Fact Checks', Icon: CheckSquare     },
  { href: '/admin/moderation',  label: 'Moderation',  Icon: Flag            },
  { href: '/admin/speeches',    label: 'Speeches',    Icon: FileAudio       },
  { href: '/admin/audit-log',   label: 'Audit Log',   Icon: ScrollText      },
  { href: '/admin/ai-tools',    label: 'AI Tools',    Icon: Sparkles        },
] as const;

function NavLink({ href, label, Icon }: { href: string; label: string; Icon: React.ElementType }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium
                 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // requireAdminUser() redirects to /admin/login when not authenticated.
  // Because /admin/login is outside this route group, that redirect can
  // never loop back through this layout.
  const admin = await requireAdminUser();

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r bg-background shrink-0">
        <div className="flex items-center gap-2 px-4 py-5 border-b">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">KYC Admin</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} />
          ))}
        </nav>

        <div className="border-t px-4 py-4 space-y-1">
          <p className="text-xs font-medium truncate">{admin.profile.username}</p>
          <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
          <form action={adminLogout} className="pt-1">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground px-0">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-background">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">KYC Admin</span>
          </div>
          <form action={adminLogout}>
            <Button variant="ghost" size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
