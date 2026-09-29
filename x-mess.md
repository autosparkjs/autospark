/grill-with-docs
全面升级toast轻提示为全功能的信息反馈和管理模块

autospark.toastManager-->autospark.messages

autospark.messages 负责管理所有消息，

消息 type AutoSparkMessage{
id?: string, 实例 id；同 id = 原地更新（见同 id 原地更新）。仅单次调用层生效——全局默认携带 id 会让所有 toast 同 id 互并成一条 ,
type: "none'|'success' |'warn' |'error' | 'info'
icon?: string // 可选的图标，如果指定则优先于type指定的默认图标
title:string // 原message
body?:string // 可选的完整消息体，显示在下一行，字号小一号
status?: number // 0-新消息还没有显示，1-已显示，
read?:boolean // 已读标读，当用户在消息上点击时置为已读
delay?: number // 自动关闭延迟 ms， 默认3000. 0 = sticky 永不自动关；hover 暂停 / 移出恢复（剩余时间制）
href?:string // 可选的链接，如提供时在尾随一个external图标链接。
closable？：关闭按钮（自动消失的轻提示默认不设手关钮；开启出 ×，内置 no 图标）
actions：AutoSparkAction[] // 显示在下一行，无border，link 按钮行（字符串 = 全局 action 名 / 对象 = 局部按钮）；见按钮行与关闭钮
pos?屏幕锚定位置（7 值枚举）默认center
}

autospark.messages.options={

}

const message = autospark.messages.add(message) // 快速显示一条
const message = autospark.messages.add( AutoSparkMessage) // 自定义更多信息
const message = autospark.messages.add(async ()=>Promise<AutoSparkMessage>)

autospark.messages.clear() 清空
autospark.messages.delete(message.id)
autospark.messages可枚举所有message

autospark.messages.load(url)可以用于从服务器加载messages
autospark.messages.save用于持久化

autospark.toast和toast action作为messages.add的别名保留

取消 屏幕位置与分区队列
