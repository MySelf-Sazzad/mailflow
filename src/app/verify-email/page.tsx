import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) return <Result title="Invalid verification link" message="The verification token is missing." />;
  const record = await prisma.emailVerificationToken.findUnique({ where: { token }, include: { user: true } });
  if (!record || record.expiresAt < new Date()) return <Result title="Link expired" message="This verification link is invalid or has expired. Register again or contact support." />;
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date(), status: "ACTIVE" } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
    prisma.auditLog.create({ data: { actorId: record.userId, action: "EMAIL_VERIFIED" } }),
  ]);
  return <Result title="Email verified" message="Your MailFlow account is active. You can now log in." success />;
}
function Result({ title, message, success=false }: { title:string; message:string; success?:boolean }) { return <main className="flex min-h-screen items-center justify-center bg-background p-6"><div className="card w-full max-w-md p-8 text-center"><div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${success?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{success?"✓":"!"}</div><h1 className="page-title">{title}</h1><p className="page-subtitle">{message}</p><Link href="/login" className="btn-primary mt-6">Go to login</Link></div></main>; }
