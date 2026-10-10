/grill-with-docs  
开发x-block 指令，渲染一个布局行或列

以布局行为例，由三部分组成


-------------------------------------------
| <header slot> <body slot> <footer slot> |
-------------------------------------------

<div x-block="row | column" x-block-options="{ 
      gap:<默认0>          
      align?: 'center' | 'left' | 'right'        // body内容居中     
      padding?:string           // 作为于header,body,footer的padding,    
}">
<div x-slot:header>...</div>
<div x-slot:body>...</div>
<div x-slot:footer>...</div>
</div>

- 容器使用display布局,
   display:flex, align-items:center
  row布局
  padding：0
- header
  display:flex, align-items:center min-width=0,flex-shrink=0,
- body:
  display:flex, align-items:center flex-grow=1,默认居左
- footer：
  display:flex, align-items:center min-width=0,flex-shrink=0,默认居右

- header,body,footert等高与容器高一致, 均不允许换行

- 支持响应式
当footer尺寸较小时，显示一个more图标，点击后弹出一个popover，将footer内的内容移到popover内
然后增加一个类标识

当header尺寸较小时，显示一个menu图标，点击后弹出一个popover，将header内的内容移到popover内
然后增加一个类标识


- 除了body是必须的外，header和footer均是可选的
