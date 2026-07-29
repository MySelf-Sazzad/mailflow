import { prisma } from "@/lib/prisma";
export default async function AuditPage(){const logs=await prisma.auditLog.findMany({include:{actor:{select:{email:true}}},orderBy:{createdAt:"desc"},take:100});return <div className="space-y-6"><h1 className="page-title">Audit logs</h1><div className="card divide-y">{logs.map(l=><article className="p-4 text-sm" key={l.id}><strong>{l.action}</strong> · {l.actor?.email??"System"} · {l.targetType} {l.targetId}<time className="float-right text-slate-500">{l.createdAt.toLocaleString()}</time></article>)}</div></div>}

