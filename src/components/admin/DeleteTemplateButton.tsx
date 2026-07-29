"use client";
import { deleteAdminTemplate } from "@/app/actions";
export function DeleteTemplateButton({id}:{id:string}){return <form action={deleteAdminTemplate} onSubmit={e=>{if(!confirm("Delete this template?"))e.preventDefault()}}><input type="hidden" name="templateId" value={id}/><button className="text-sm font-semibold text-rose-600">Delete</button></form>}
