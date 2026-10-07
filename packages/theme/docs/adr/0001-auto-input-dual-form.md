# 输入控件采用单类双形态，废除 auto-input-wrapper

输入控件的外观入口此前分裂为 `.auto-input`（元素）与 `.auto-input-wrapper`（容器）两个类，且容器内部为选择类控件重复实现了约 350 行样式。现收敛为单一 `.auto-input`：元素形态与容器形态由宿主标签判别（`:is(input, select, textarea)` 分流），前后缀操作件由 `.auto-input-action` 承载，容器内 label 自动处理（选择类状态联动 / 文本字段标签）。

## Considered Options

- **修饰类方案**（`.auto-input.group`）：判别直白，但重新引入第二个类名，与消除双类心智的初衷相悖。
- **`:has()` 判别**：语义最准，但兼容面窄、选择器性能差、调试不直观。

## Consequences

- 容器内表单元素一律裸化（含误带 `.auto-input` 类的），错误嵌套自动降级为正确视觉。
- checkbox / radio / range 的定制以 less mixin 维持单一源码，元素形态与容器形态共用。
- `.auto-input-wrapper` 立即删除、不保留过渡别名（包处于 1.x 早期，消费者主要是本仓库示例）。
