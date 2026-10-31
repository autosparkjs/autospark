/**
 * autospark.layout.js 聚合入口（#5 批次 3）：布局域七指令一产物（ADR-0009 同类域组合——
 * 产物内共享、产物间零重复）。family 为家族核心（五类一闭包单工厂），container / viewport
 * 独立工厂（无家族类引用）；三者模块加载即自举（import 副作用，注册顺序无关）。
 */
import "./family";
import "./container";
import "./viewport";
