odoo.define('@1f60159aa394dc99c206ebaff20027a6b2c97e12e831953e5e17554e1d39fe93',['@web/core/utils/patch','@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const conversationBot={constructor(comp,base){super.constructor(comp,base)
this.bot={id:false,name:''}},async updateFromJson(base){await super.updateFromJson(base)
if('bot_id'in base){this.bot=this.convertRecordField(base.bot_id)}}}
patch(ConversationModel.prototype,conversationBot)
return __exports;});;
odoo.define('@05bb6628499a395ed0ead3b6e7c5c9bd7bd257987a8f9d0ebeccdb96e5e472bc',['@web/core/utils/patch','@42ffbf6224f23aacdf6b9a6289d4e396904ef6225cba7443d521319d2137e2b6'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{Chatroom}=require('@42ffbf6224f23aacdf6b9a6289d4e396904ef6225cba7443d521319d2137e2b6')
const chatroomBot={getInitState(){return{...super.getInitState(),bots:[],bots_map:{}}},async willStart(){return Promise.all([super.willStart(),this.env.services.orm.searchRead('acrux.chat.bot',[['is_ai','=',true]],['name','color_text','ai_bot_type','seq'],{context:this.env.context}).then(data=>{this.state.bots=data.map(d=>{return{value:d.id,label:d.name}})
this.state.bots_map=data.reduce((acc,obj)=>{acc[obj.id]=obj
return acc},{})})])}}
patch(Chatroom.prototype,chatroomBot)
return __exports;});;
odoo.define('@07b0822c8f743be8abb287f44ff2bc48b950ad9fa51c18c35b84b13f27423da9',['@web/core/utils/patch','@0ac266676776f61364330bb041a16d836d8b315459e04c1a3381740f295958c7'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{Conversation}=require('@0ac266676776f61364330bb041a16d836d8b315459e04c1a3381740f295958c7')
patch(Conversation.props,{bots:{type:Object,optional:true},})
return __exports;});;
odoo.define('@ee44e1381b4f867d0197ae2b4b7b19147cf1b2694592bdb739b80feabbc090c3',['@web/core/utils/patch','@web/core/select_menu/select_menu','@web/core/l10n/translation','@222f8128b2dad460c0c9e2fb21a1f67a899c54f034d6e8fa2b79a3f441e55202'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{SelectMenu}=require('@web/core/select_menu/select_menu')
const{_t}=require('@web/core/l10n/translation')
const{ConversationList}=require('@222f8128b2dad460c0c9e2fb21a1f67a899c54f034d6e8fa2b79a3f441e55202')
const conversationListBot={getInitState(){return{...super.getInitState(),selected_bots:[],}},getFilters(){return{...super.getFilters(),filterBots:this.state.selected_bots,}},get botSelectProps(){return{choices:this.props.bots,required:false,searchable:false,multiSelect:true,onSelect:value=>{this.state.selected_bots=value
this.doLocalFilter()},value:this.state.selected_bots,placeholder:_t('AI Bot'),}},evaluateFilter(conv){return super.evaluateFilter(conv)&&(this.state.selected_bots.length===0||(conv.bot.id&&this.state.selected_bots.includes(conv.bot.id)))}}
patch(ConversationList.prototype,conversationListBot)
patch(ConversationList.props,{bots_map:{type:Object},bots:{type:Array,element:{type:Object}},})
patch(ConversationList.components,{SelectMenu})
return __exports;});;
odoo.define('@095ec8acbd5c99f403a74c5a8bb6c6d0a8b0d2b3f1f8c98092dd7f2325689ed7',['@web/core/utils/patch','@web/core/l10n/translation','@c011635ccdcd3301f40c07724a28d782d0f498e544a6747890cf878476644d9c'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{_t}=require('@web/core/l10n/translation')
const{Toolbox}=require('@c011635ccdcd3301f40c07724a28d782d0f498e544a6747890cf878476644d9c')
const toolboxBot={get botProps(){return Object.values(this.props.bots_map).filter(bot=>bot.ai_bot_type==='bot').sort((a,b)=>{if(a.seq!==b.seq){return a.seq.localeCompare(b.seq)}
return a.id-b.id})},async onBotGenerate(ev){const text=await this.env.services.orm.call('acrux.chat.bot','bot_get_ai_id',[parseInt(ev.currentTarget.dataset.id),this.props.selectedConversation.id],{context:this.env.context})
if(text){this.env.chatBus.trigger('setInputText',text)}},}
patch(Toolbox.prototype,toolboxBot)
patch(Toolbox.props,{bots_map:{type:Object},bots:{type:Array,element:{type:Object}},})
return __exports;});;
odoo.define('@0d8c9d131a8c26501e697840660589b194d4997d91b10e5821e7cc747684a0dd',['@web/views/form/form_controller','@web/core/py_js/py','@web/core/errors/error_dialogs','@web/core/l10n/translation'],function(require){'use strict';let __exports={};const{FormController}=require('@web/views/form/form_controller');const{evaluateExpr}=require('@web/core/py_js/py');const{WarningDialog}=require('@web/core/errors/error_dialogs');const{_t}=require('@web/core/l10n/translation');const BotAiFormController=__exports.BotAiFormController=class BotAiFormController extends FormController{async beforeExecuteActionButton(clickParams){const action=clickParams.name;if(action=='copy_original_definition'){if(clickParams.context){const context=evaluateExpr(clickParams.context)
if(context?.ai_type){let changes={}
const field_map={company:['ai_company_prompt','ai_company_info'],service:['ai_service_prompt','ai_service_info'],products:['ai_products_prompt','ai_products_info'],style:['ai_style_prompt','ai_style_info'],objective:['ai_objective_prompt','ai_objective_info'],}
if(field_map[context.ai_type]){changes[field_map[context.ai_type][0]]=this.model.root.data[field_map[context.ai_type][1]]}else{this.env.services.dialog.add(WarningDialog,{message:_t('Wrong context ai_type key')+' '+context.ai_type,})}
if(Object.keys(changes).length>0){this.model.root.update(changes)}}else{this.env.services.dialog.add(WarningDialog,{message:_t('Context ai_type key is missing')})}}else{this.env.services.dialog.add(WarningDialog,{message:_t('Context is missing')})}
return false;}
return super.beforeExecuteActionButton(...arguments);}}
return __exports;});;
odoo.define('@7a1850a953feb11b2234d5140186fd085a9d99a8e8ec2c134716e8e4cce14767',['@web/core/registry','@web/views/form/form_view','@0d8c9d131a8c26501e697840660589b194d4997d91b10e5821e7cc747684a0dd'],function(require){'use strict';let __exports={};const{registry}=require('@web/core/registry');const{formView}=require('@web/views/form/form_view');const{BotAiFormController}=require('@0d8c9d131a8c26501e697840660589b194d4997d91b10e5821e7cc747684a0dd');const BotAiFormView=__exports.BotAiFormView={...formView,Controller:BotAiFormController,};registry.category('views').add('bot_ai_form',BotAiFormView);return __exports;});;
