@grill-with-docs 为x-slot增加传递元素绑定

<!-- 组件：两个插槽 + 固定页脚 -->
<div x-define="card">
  <header x-slot:header>默认头 · {{title}}</header>
</div>
 
<!-- 用法二：提供内容 → 按名替换 -->
<div x-component:card>
  <template x-slot:header x-slot.bind="{...}"><h3>自定义标题</h3></template>  
</div>

x-slot.bind用于为插槽元素提供额外的绑定属性

<div x-define="card">
  <header x-slot:header x-bind="{....}">默认头 · {{title}}</header>
</div>
