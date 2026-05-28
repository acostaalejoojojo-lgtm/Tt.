# GLIDROVIA — Proyecto Godot 4

## Cómo abrir en Godot 4

1. Abre **Godot Engine 4.3** (o superior)
2. En la pantalla de proyectos, haz click en **"Importar"**
3. Navega hasta esta carpeta `glidrovia-godot/`
4. Selecciona el archivo `project.godot`
5. Click en **"Importar y Editar"**

¡Listo! El proyecto abrirá directamente en la escena de Login.

---

## Configurar el servidor

Para conectar con tu servidor Glidrovia:

1. Abre `scripts/autoload/NetworkManager.gd`
2. Cambia la línea:
   ```gdscript
   var server_url: String = "https://gclu.worf.replit.dev"
   ```
   Por la URL de tu servidor.

También puedes cambiarlo desde el menú **Ajustes** dentro del juego.

---

## Escenas del proyecto

| Escena | Descripción |
|--------|-------------|
| `Login.tscn` | Pantalla de inicio de sesión |
| `Main.tscn` | Hub principal con navegación, juegos y perfil |
| `AvatarEditor.tscn` | Editor de avatar 3D con previsualización en tiempo real |
| `GameWorld.tscn` | Mundo 3D jugable con chat, físicas y entorno |
| `Studio.tscn` | Editor de mundos 3D — coloca objetos, elige colores |
| `Avatar3D.tscn` | Personaje bloque reutilizable (como Roblox) |
| `Player.tscn` | Controlador de jugador con cámara en tercera persona |

---

## Scripts singleton (Autoload)

| Script | Función |
|--------|---------|
| `GameManager.gd` | Estado global: usuario, avatar, navegación entre escenas |
| `NetworkManager.gd` | Peticiones HTTP al servidor Express (login, juegos, avatar) |

---

## Controles en el juego

| Tecla | Acción |
|-------|--------|
| WASD | Mover personaje |
| Espacio | Saltar |
| Shift | Correr |
| T | Abrir chat |
| ESC | Mostrar/ocultar cursor |
| Tab | Volver al menú principal |

---

## Controles en el Studio

| Acción | Control |
|--------|---------|
| Colocar objeto | Click izquierdo |
| Eliminar objeto | Click derecho |
| Rotar cámara | Botón medio del ratón / Alt + arrastrar |
| Zoom | Rueda del ratón |

---

## Requisitos

- Godot Engine **4.3 stable** o superior
- No requiere plugins adicionales
- Todos los personajes 3D se generan por código (no necesita assets externos)
