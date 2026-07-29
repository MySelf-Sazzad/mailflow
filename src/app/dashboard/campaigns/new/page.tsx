import { auth } from "@/lib/auth";
import { CampaignBuilder } from "@/components/campaigns/CampaignBuilder";
import { prisma } from "@/lib/prisma";
export default async function NewCampaignPage() { const session = await auth(); const templates=await prisma.emailTemplate.findMany({where:{OR:[{userId:session!.user.id},{isSystem:true}]},select:{id:true,name:true,category:true,htmlContent:true},orderBy:{createdAt:"desc"}}); return <div className="mx-auto max-w-5xl space-y-6"><div><h1 className="page-title">Create campaign</h1><p className="page-subtitle">Each recipient receives a private, personalised email.</p></div><CampaignBuilder templates={templates} defaultSender={process.env.DEFAULT_SENDER_EMAIL ?? session?.user?.email ?? ""}/></div>; }
