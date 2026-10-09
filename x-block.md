/grill-with-docs  
开发x-block 指令，渲染一个布局行或列

由三部分组成

---

| <header slot> <body slot> <footer slot>|
----------------------------------------------------------------

<div x-block="row | column" x-block-options="{ 
      gap:<默认0>           
      center?: boolean        // body内容居中      
}">
<div x-slot:header>...</div>
<div x-slot:body>...</div>
<div x-slot:footer>...</div>
</div>

- 使用display布局, x-block默认row
- header,footer：
  min-width或min-height==0,flex-shrink=0,
  shar
- body: flex-grow=1
- header,body,footert等高或宽
- footer 内容默认居右或居底，取决于x-block=row | column
- header,body,footer容器也是display:flex, 内部成员水平或居中排列
- 支持响应式
