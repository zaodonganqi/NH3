import { createApp } from 'vue'
import App from './App.vue'
import './styles/site.css'

// Vue 应用实例负责安装全局能力并挂载根组件。
const app = createApp(App)

app.mount('#app')
