/**
 * FLYApp Sheets API. Configure FLYAPP_SPREADSHEET_ID and FLYAPP_API_KEY in Script Properties.
 * Run setupFlyAppSheets once after editing, then deploy a new Web App version.
 */
const ENTITIES={
 User:["Users","id","email full_name role status created_date created_at avatar_url phone bio"],
 Event:["Events","id","name tagline description cover_image start_date end_date timezone venue_name venue_address city status notes show_status current_segment_id created_date created_at"],
 EventMember:["EventMembers","id","event_id user_id user_email full_name role phone status notes created_date"],
 ScheduleItem:["ScheduleItems","id","event_id title description date start_time end_time timezone location category status instructions assigned_emails audience created_date"],
 Collection:["Collections","id","event_id designer_email designer_name name season description cover_image status created_date"],
 Look:["Looks","id","event_id collection_id designer_email designer_name number name images description accessories footwear styling_instructions fitting_notes prep_status notes created_date"],
 LookAssignment:["LookAssignments","id","event_id look_id model_email model_name status fitting_notes created_date"],
 HairMakeup:["HairMakeup","id","event_id model_email model_name date start_time end_time station artist instructions reference_images status notes created_date"],
 ShowSegment:["ShowSegments","id","event_id name designer_name position model_emails look_ids status notes created_date"],
 Announcement:["Announcements","id","event_id title message audience created_by created_date"],
 Notification:["Notifications","id","user_email event_id title message type link read created_date"],
 ReadinessTask:["ReadinessTasks","id","event_id user_email title description category done due_date created_date"],
 AuditLog:["AuditLog","id","event_id actor_email actor_name action target detail created_date"],
 DesignerProfile:["DesignerProfiles","id","user_email full_name brand_name bio website instagram logo_url event_id"],
 Opportunity:["Opportunities","id","title description type location deadline status created_date created_by"],
 Application:["Applications","id","opportunity_id user_email full_name message status created_date reviewed_by"]
};
function setupFlyAppSheets(){
 const ss=ss_();
 // Ensure the expanded schema AND legacy compatibility columns exist on the same tabs.
 // Existing headers and data are preserved; missing headers are appended, never overwritten.
 Object.values(ENTITIES).forEach(c=>{
   ensureHeaders_(ss,c[0],[c[1],...c[2].split(" ")]);
 });
 const legacy={
   Users:["user_id","email","full_name","role","status","created_at"],
   Events:["event_id","event_name","event_date","location","status","created_at"],
   Schedules:["schedule_id","event_id","title","start_time","end_time","location","notes"],
   Assignments:["assignment_id","event_id","schedule_id","user_id","role","status"]
 };
 Object.entries(legacy).forEach(([name,headers])=>ensureHeaders_(ss,name,headers));
 return {
   ok:true,
   message:"FLYApp entity tabs and compatibility headers are ready; existing rows and headers were preserved.",
   tabs:Object.keys(ENTITIES).map(k=>ENTITIES[k][0]).concat(Object.keys(legacy).filter(n=>!Object.values(ENTITIES).some(c=>c[0]===n)))
 };
}
function ensureHeaders_(ss,name,wanted){
 let sheet=ss.getSheetByName(name);
 if(!sheet) sheet=ss.insertSheet(name);
 const lastColumn=sheet.getLastColumn();
 const existing=lastColumn>0
   ? sheet.getRange(1,1,1,lastColumn).getValues()[0].map(v=>String(v||"").trim())
   : [];
 if(existing.length===0||existing.every(v=>!v)){
   sheet.getRange(1,1,1,wanted.length).setValues([wanted]);
   sheet.setFrozenRows(1);
   return;
 }
 const missing=wanted.filter(header=>!existing.includes(header));
 if(missing.length){
   sheet.getRange(1,lastColumn+1,1,missing.length).setValues([missing]);
 }
 if(sheet.getFrozenRows()===0) sheet.setFrozenRows(1);
}
function doGet(e){const p=e&&e.parameter||{},a=String(p.action||"health");if(a==="health")return out_({app:"FLYApp",status:"connected"});if(!auth_(p.key))return out_({ok:false,error:"Unauthorized"});try{
 if(a==="listEvents")return out_({ok:true,data:listLegacyEvents_()});
 if(a==="listSchedules")return out_({ok:true,data:read_("Schedules").filter(r=>!p.event_id||String(r.event_id)===String(p.event_id))});
 if(a==="listRecords"){const c=cfg_(p.entity),rows=read_(c[0]).map(r=>norm_(r,c));return out_({ok:true,data:rows.filter(r=>!p.event_id||!r.event_id||String(r.event_id)===String(p.event_id))})}
 return out_({ok:false,error:"Unknown action"});
 }catch(err){return out_({ok:false,error:String(err.message||err)})}}
function doPost(e){let b;try{b=JSON.parse(e.postData.contents||"{}")}catch(_){return out_({ok:false,error:"Invalid JSON"})}if(!auth_(b.key))return out_({ok:false,error:"Unauthorized"});try{
 if(b.action==="createEvent")return out_({ok:true,data:createLegacyEvent_(b.event||{})});
 const c=cfg_(b.entity);
 if(b.action==="createRecord")return out_({ok:true,data:create_(c,b.record||{})});
 if(b.action==="updateRecord")return out_({ok:true,data:update_(c,b.id,b.record||{})});
 if(b.action==="deleteRecord")return out_({ok:true,data:delete_(c,b.id)});
 if(b.action==="bulkCreateRecords")return out_({ok:true,data:(b.records||[]).map(r=>create_(c,r))});
 return out_({ok:false,error:"Unknown action"});
 }catch(err){return out_({ok:false,error:String(err.message||err)})}}
function cfg_(name){if(!ENTITIES[name])throw Error("Unsupported entity");return ENTITIES[name]}
function ss_(){const id=PropertiesService.getScriptProperties().getProperty("FLYAPP_SPREADSHEET_ID");if(!id)throw Error("Missing FLYAPP_SPREADSHEET_ID");return SpreadsheetApp.openById(id)}
function auth_(v){const x=PropertiesService.getScriptProperties().getProperty("FLYAPP_API_KEY");if(!x||!v||String(x).length!==String(v).length)return false;let n=0;for(let i=0;i<String(x).length;i++)n|=String(x).charCodeAt(i)^String(v).charCodeAt(i);return n===0}
function read_(name){const s=ss_().getSheetByName(name);if(!s||s.getLastRow()<2)return [];const v=s.getDataRange().getValues(),h=v[0].map(String);return v.slice(1).filter(r=>r.some(x=>x!==""&&x!==null)).map(r=>{const o={};h.forEach((k,i)=>{if(k)o[k]=val_(r[i])});return o})}
function val_(v){if(v instanceof Date)return v.toISOString();if(typeof v==="string"&&/^[\[{]/.test(v)){try{return JSON.parse(v)}catch(_){}}if(v==="TRUE")return true;if(v==="FALSE")return false;return v}
function norm_(r,c){const o={...r};if(!o.id)o.id=o[c[1]]||o.event_id||o.user_id||o.schedule_id||"";return o}
function create_(c,input){const s=ss_().getSheetByName(c[0]),h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0].map(String),o={...input};o[c[1]]=String(input.id||Utilities.getUuid());delete o.id;const now=new Date().toISOString();if(h.includes("created_date")&&!o.created_date)o.created_date=now;if(h.includes("created_at")&&!o.created_at)o.created_at=now;s.appendRow(h.map(k=>ser_(o[k])));return norm_(o,c)}
function update_(c,id,input){if(!id)throw Error("id required");const s=ss_().getSheetByName(c[0]),v=s.getDataRange().getValues(),h=v[0].map(String),ix=h.indexOf(c[1]),ri=v.findIndex((r,i)=>i>0&&String(r[ix])===String(id));if(ri<0)throw Error("Record not found");Object.keys(input).forEach(k=>{if(k!=="id"&&h.includes(k))v[ri][h.indexOf(k)]=ser_(input[k])});s.getRange(ri+1,1,1,h.length).setValues([v[ri]]);return norm_(Object.fromEntries(h.map((k,i)=>[k,val_(v[ri][i])])),c)}
function delete_(c,id){const s=ss_().getSheetByName(c[0]),v=s.getDataRange().getValues(),h=v[0].map(String),ix=h.indexOf(c[1]),ri=v.findIndex((r,i)=>i>0&&String(r[ix])===String(id));if(ri<0)return{deleted:false};s.deleteRow(ri+1);return{deleted:true,id}}
function ser_(v){return v==null?"":typeof v==="object"?JSON.stringify(v):v}
function listLegacyEvents_(){return read_("Events").map(r=>({...r,id:r.id||r.event_id||"",name:r.name||r.event_name||"",start_date:r.start_date||r.event_date||"",venue_name:r.venue_name||r.location||"",status:r.status||"planning"}))}
function createLegacyEvent_(i){const s=ss_().getSheetByName("Events"),h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0].map(String),id=Utilities.getUuid(),now=new Date().toISOString(),o={id,event_id:id,name:i.name||i.event_name||"",event_name:i.name||i.event_name||"",start_date:i.start_date||i.event_date||"",event_date:i.start_date||i.event_date||"",venue_name:i.venue_name||i.location||"",location:i.venue_name||i.location||"",status:i.status||"planning",created_date:now,created_at:now};s.appendRow(h.map(k=>ser_(o[k])));return o}
function out_(x){return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON)}
