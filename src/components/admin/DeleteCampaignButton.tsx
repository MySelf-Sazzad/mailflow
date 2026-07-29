"use client";
import { deleteAdminCampaign } from "@/app/actions";
export function DeleteCampaignButton({id}:{id:string}){return <form action={deleteAdminCampaign} onSubmit={e=>{if(!confirm("Delete this campaign record from MailFlow? Delivered emails cannot be recalled."))e.preventDefault()}}><input type="hidden" name="campaignId" value={id}/><button className="text-sm font-semibold text-rose-600 hover:text-rose-800">Delete record</button></form>}
