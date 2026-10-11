# Kylin Router - 静态资源模块文档

> **[根目录](../../CLAUDE.md) > [src](../) > **assets** (静态资源)**

---

## 变更记录 (Changelog)

### 2026-04-04 10:12:22
- 初始化资源模块文档
- 完成资源清单记录

---

## 模块职责

**assets/** 目录存储 Kylin Router 项目的静态资源文件，包括：

- **PNG 图片**: 用于页面展示的位图资源
- **SVG 图标**: 矢量图标，支持缩放和样式定制

---

## 资源清单

### 图片资源
| 文件名 | 类型 | 尺寸 | 用途 | 优化状态 |
|--------|------|------|------|---------|
| `hero.png` | PNG | 170x179 | 主展示图 | ⚠️ 可优化 |
| `lit.svg` | SVG | 矢量 | Lit 框架图标 | ✅ 已优化 |
| `vite.svg` | SVG | 矢量 | Vite 构建工具图标 | ✅ 已优化 |

### 资源使用位置
```typescript
// src/my-element.ts 中的导入
import litLogo from './assets/lit.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
```

---

## 优化建议

### 当前状态
- ✅ SVG 图标格式正确
- ⚠️ PNG 图片未压缩
- ⚠️ 缺少 WebP 备用格式

### 推荐优化
1. **图片压缩**: 使用 TinyPNG 或 ImageOptim 压缩 `hero.png`
2. **格式转换**: 添加 WebP 版本以提升加载速度
3. **响应式图片**: 提供多种分辨率版本
4. **预加载**: 在 `index.html` 中添加 `<link rel="preload">`

---

**模块维护者：** Claude AI Architect
**最后更新：** 2026-04-04 10:12:22
**模块状态：** ✅ 文档完整
