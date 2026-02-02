odoo.define('@2eea84aecbbe13144ab46e3f4c2dc342edbfaf665541dcf56dc9e4b64f163acc',['@web/core/utils/patch','@42ffbf6224f23aacdf6b9a6289d4e396904ef6225cba7443d521319d2137e2b6'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{Chatroom}=require('@42ffbf6224f23aacdf6b9a6289d4e396904ef6225cba7443d521319d2137e2b6')
const chatroomAccess={setup(){super.setup()
this.accessCache={}},async canHaveThisConversation(conversation){let out=await super.canHaveThisConversation(conversation)
if(out){if(!(conversation.id in this.accessCache)){const conv=await this.env.services.orm.searchRead(this.env.chatModel,[['number','=',conversation.number],['connector_id','=',conversation.connector.id]],['id','name'],{context:this.env.context,limit:1})
this.accessCache[conversation.id]=conv.length>0}
out=this.accessCache[conversation.id]}
return out}}
patch(Chatroom.prototype,chatroomAccess)
return __exports;});;
