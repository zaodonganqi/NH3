/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // Vue 单文件组件模块默认导出可被 createApp 和组件树识别的组件类型。
  const component: DefineComponent<object, object, unknown>
  export default component
}
