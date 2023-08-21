import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vitejs.dev/config/
export default defineConfig(({command})=>{
  if (command=="serve") {
    console.log("Don't use this for dev, run server with --ui=vite")
    process.exit();
  }

  return ({
    clearScreen: false,
    plugins: [preact()],
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
            return
          }
          warn(warning)
        }      
      }
    }
  });
});
