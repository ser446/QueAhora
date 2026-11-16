import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";

// base "./" permite publicar la app en cualquier carpeta o dominio
export default defineConfig({base: "./", plugins: [react()]});
