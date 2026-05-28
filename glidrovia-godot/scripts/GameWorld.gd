extends Node3D

# ── Glidrovia Game World — Mundo 3D jugable ───────────────────────────────────

var _player: Node
var _hud: CanvasLayer
var _chat_open: bool = false
var _chat_field: LineEdit
var _chat_log: RichTextLabel
var _messages: Array = []

func _ready() -> void:
	_build_world()
	_build_player()
	_build_hud()

# ── Mundo 3D ──────────────────────────────────────────────────────────────────

func _build_world() -> void:
	# Cielo / entorno
	var world_env = WorldEnvironment.new()
	var env = Environment.new()
	env.background_mode = Environment.BG_SKY
	var sky = Sky.new()
	var sky_mat = ProceduralSkyMaterial.new()
	sky_mat.sky_top_color     = Color("#1a237e")
	sky_mat.sky_horizon_color = Color("#4a148c")
	sky_mat.ground_horizon_color = Color("#4a148c")
	sky_mat.ground_bottom_color  = Color("#0d0d1a")
	sky.sky_material = sky_mat
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 0.6
	env.fog_enabled = true
	env.fog_density = 0.003
	env.fog_aerial_perspective = 0.3
	world_env.environment = env
	add_child(world_env)

	# Luz solar
	var sun = DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-50, 30, 0)
	sun.light_energy = 1.2
	sun.shadow_enabled = true
	add_child(sun)

	# ── Suelo ──────────────────────────────────────────────────────────────────
	var ground = StaticBody3D.new()
	add_child(ground)

	var ground_mesh = MeshInstance3D.new()
	var plane = PlaneMesh.new()
	plane.size = Vector2(200, 200)
	plane.subdivide_width = 0
	plane.subdivide_depth = 0
	ground_mesh.mesh = plane
	var ground_mat = StandardMaterial3D.new()
	ground_mat.albedo_color = Color("#1a472a")
	ground_mat.roughness = 1.0
	ground_mesh.set_surface_override_material(0, ground_mat)
	ground.add_child(ground_mesh)

	var ground_col = CollisionShape3D.new()
	var box_shape = BoxShape3D.new()
	box_shape.size = Vector3(200, 0.1, 200)
	ground_col.shape = box_shape
	ground_col.position.y = -0.05
	ground.add_child(ground_col)

	# ── Plataformas decorativas ────────────────────────────────────────────────
	_add_platform(Vector3(0, 0, 0),  Vector3(40, 0.4, 40), Color("#2d5a27"))  # Plaza central
	_add_platform(Vector3(30, 0.4, 0), Vector3(12, 0.4, 8), Color("#8B4513"))  # Plataforma lateral
	_add_platform(Vector3(-30, 0.4, 0), Vector3(12, 0.4, 8), Color("#8B4513"))
	_add_platform(Vector3(0, 0.4, 30), Vector3(8, 0.4, 12), Color("#8B4513"))
	_add_platform(Vector3(0, 0.4, -30), Vector3(8, 0.4, 12), Color("#8B4513"))

	# ── Objetos decorativos ────────────────────────────────────────────────────
	_add_box(Vector3(10, 1.0, 10),  Vector3(2, 2, 2),   Color("#2563eb"))
	_add_box(Vector3(-10, 1.0, 10), Vector3(2, 2, 2),   Color("#7c3aed"))
	_add_box(Vector3(10, 1.0, -10), Vector3(2, 2, 2),   Color("#dc2626"))
	_add_box(Vector3(-10, 1.0,-10), Vector3(2, 2, 2),   Color("#d97706"))
	_add_box(Vector3(0, 2.0, 0),    Vector3(1, 4, 1),   Color("#f59e0b"))  # Torre central

	# Escaleras decorativas
	for i in 5:
		_add_box(Vector3(float(i)*1.2 + 15, float(i)*0.3, 0), Vector3(1.0, 0.3, 4), Color("#9ca3af"))

	# Árboles simples (cilindro verde + tronco marrón)
	for pos in [Vector3(18,0,-15), Vector3(-18,0,15), Vector3(15,0,18), Vector3(-15,0,-18)]:
		_add_tree(pos)

	# Agua decorativa
	_add_water(Vector3(0, -0.1, -50), Vector3(30, 0.1, 20))

func _add_platform(pos: Vector3, size: Vector3, color: Color) -> void:
	var body = StaticBody3D.new()
	body.position = pos
	add_child(body)

	var mi = MeshInstance3D.new()
	var box = BoxMesh.new()
	box.size = size
	mi.mesh = box
	var mat = StandardMaterial3D.new()
	mat.albedo_color = color
	mi.set_surface_override_material(0, mat)
	body.add_child(mi)

	var col = CollisionShape3D.new()
	var shape = BoxShape3D.new()
	shape.size = size
	col.shape = shape
	body.add_child(col)

func _add_box(pos: Vector3, size: Vector3, color: Color) -> void:
	var body = StaticBody3D.new()
	body.position = pos
	add_child(body)

	var mi = MeshInstance3D.new()
	var box = BoxMesh.new()
	box.size = size
	mi.mesh = box
	var mat = StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = 0.7
	mi.set_surface_override_material(0, mat)
	body.add_child(mi)

	var col = CollisionShape3D.new()
	var shape = BoxShape3D.new()
	shape.size = size
	col.shape = shape
	body.add_child(col)

func _add_tree(pos: Vector3) -> void:
	# Tronco
	var trunk = StaticBody3D.new()
	trunk.position = pos + Vector3(0, 1.0, 0)
	add_child(trunk)
	var trunk_mesh = MeshInstance3D.new()
	var cyl = CylinderMesh.new()
	cyl.top_radius = 0.2
	cyl.bottom_radius = 0.3
	cyl.height = 2.0
	trunk_mesh.mesh = cyl
	var trunk_mat = StandardMaterial3D.new()
	trunk_mat.albedo_color = Color("#5D3A1A")
	trunk_mesh.set_surface_override_material(0, trunk_mat)
	trunk.add_child(trunk_mesh)
	var tcol = CollisionShape3D.new()
	var tcyl = CylinderShape3D.new()
	tcyl.radius = 0.3
	tcyl.height = 2.0
	tcol.shape = tcyl
	trunk.add_child(tcol)

	# Copa
	var top = StaticBody3D.new()
	top.position = pos + Vector3(0, 3.5, 0)
	add_child(top)
	var top_mesh = MeshInstance3D.new()
	var sphere = SphereMesh.new()
	sphere.radius = 1.8
	sphere.height = 2.8
	top_mesh.mesh = sphere
	var top_mat = StandardMaterial3D.new()
	top_mat.albedo_color = Color("#1a7a2a")
	top_mesh.set_surface_override_material(0, top_mat)
	top.add_child(top_mesh)

func _add_water(pos: Vector3, size: Vector3) -> void:
	var mi = MeshInstance3D.new()
	mi.position = pos
	var plane = PlaneMesh.new()
	plane.size = Vector2(size.x, size.z)
	mi.mesh = plane
	var mat = StandardMaterial3D.new()
	mat.albedo_color = Color(0.1, 0.3, 0.8, 0.7)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.roughness = 0.1
	mat.metallic = 0.3
	mi.set_surface_override_material(0, mat)
	add_child(mi)

# ── Player ────────────────────────────────────────────────────────────────────

func _build_player() -> void:
	var player_script = load("res://scripts/Player.gd")
	_player = CharacterBody3D.new()
	_player.set_script(player_script)
	_player.position = Vector3(0, 1.5, 0)
	add_child(_player)

# ── HUD ───────────────────────────────────────────────────────────────────────

func _build_hud() -> void:
	_hud = CanvasLayer.new()
	add_child(_hud)

	# Minibar superior
	var topbar = PanelContainer.new()
	topbar.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	topbar.custom_minimum_size = Vector2(0, 44)

	var style = StyleBoxFlat.new()
	style.bg_color = Color(0, 0, 0, 0.5)
	style.content_margin_left   = 16
	style.content_margin_top    = 6
	style.content_margin_right  = 16
	style.content_margin_bottom = 6
	topbar.add_theme_stylebox_override("panel", style)

	var top_hbox = HBoxContainer.new()
	topbar.add_child(top_hbox)
	_hud.add_child(topbar)

	var game_title = Label.new()
	game_title.text = GameManager.current_game.get("title", "Glidrovia World")
	game_title.add_theme_color_override("font_color", Color.WHITE)
	game_title.add_theme_font_size_override("font_size", 14)
	game_title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_hbox.add_child(game_title)

	var user_lbl = Label.new()
	user_lbl.text = "👤 " + GameManager.get_display_name()
	user_lbl.add_theme_color_override("font_color", Color("#9ca3af"))
	user_lbl.add_theme_font_size_override("font_size", 13)
	top_hbox.add_child(user_lbl)

	var exit_btn = Button.new()
	exit_btn.text = "✕ Salir"
	var eb_style = StyleBoxFlat.new()
	eb_style.bg_color = Color(0.8, 0.1, 0.1, 0.8)
	eb_style.corner_radius_top_left    = 6
	eb_style.corner_radius_top_right   = 6
	eb_style.corner_radius_bottom_left = 6
	eb_style.corner_radius_bottom_right = 6
	exit_btn.add_theme_stylebox_override("normal", eb_style)
	exit_btn.add_theme_color_override("font_color", Color.WHITE)
	exit_btn.add_theme_font_size_override("font_size", 13)
	exit_btn.pressed.connect(func():
		Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
		GameManager.go_to_main()
	)
	top_hbox.add_child(exit_btn)

	# Chat
	var chat_container = VBoxContainer.new()
	chat_container.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT)
	chat_container.offset_bottom = -10
	chat_container.offset_left   = 10
	chat_container.offset_right  = 360
	chat_container.offset_top    = -230
	chat_container.add_theme_constant_override("separation", 4)
	_hud.add_child(chat_container)

	_chat_log = RichTextLabel.new()
	_chat_log.custom_minimum_size = Vector2(350, 160)
	_chat_log.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var log_style = StyleBoxFlat.new()
	log_style.bg_color = Color(0, 0, 0, 0.45)
	log_style.corner_radius_top_left    = 8
	log_style.corner_radius_top_right   = 8
	log_style.corner_radius_bottom_left = 8
	log_style.corner_radius_bottom_right = 8
	log_style.content_margin_left   = 10
	log_style.content_margin_top    = 8
	log_style.content_margin_right  = 10
	log_style.content_margin_bottom = 8
	_chat_log.add_theme_stylebox_override("normal", log_style)
	_chat_log.add_theme_font_size_override("normal_font_size", 13)
	_chat_log.scroll_following = true
	chat_container.add_child(_chat_log)

	_chat_field = LineEdit.new()
	_chat_field.placeholder_text = "Presiona T para chatear..."
	_chat_field.custom_minimum_size = Vector2(0, 38)
	var field_style = StyleBoxFlat.new()
	field_style.bg_color = Color(0, 0, 0, 0.6)
	field_style.border_color = Color("#2563eb")
	field_style.border_width_bottom = 1
	field_style.corner_radius_top_left    = 8
	field_style.corner_radius_top_right   = 8
	field_style.corner_radius_bottom_left = 8
	field_style.corner_radius_bottom_right = 8
	field_style.content_margin_left   = 10
	field_style.content_margin_right  = 10
	field_style.content_margin_top    = 4
	field_style.content_margin_bottom = 4
	_chat_field.add_theme_stylebox_override("normal", field_style)
	_chat_field.add_theme_color_override("font_color", Color.WHITE)
	_chat_field.add_theme_color_override("font_placeholder_color", Color("#4b5563"))
	_chat_field.add_theme_font_size_override("font_size", 13)
	_chat_field.text_submitted.connect(_send_chat)
	chat_container.add_child(_chat_field)

	# Controles hint
	var hints = Label.new()
	hints.text = "WASD: Mover  |  Espacio: Saltar  |  Shift: Correr  |  T: Chat  |  ESC: Cursor  |  Tab: Menú"
	hints.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hints.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	hints.offset_bottom = -4
	hints.offset_top    = -26
	hints.add_theme_color_override("font_color", Color(1, 1, 1, 0.4))
	hints.add_theme_font_size_override("font_size", 11)
	_hud.add_child(hints)

	_add_system_message("Bienvenido a " + GameManager.current_game.get("title", "Glidrovia World") + "!")
	_add_system_message("Presiona Tab para volver al menú principal.")

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_T:
		if not _chat_open:
			_chat_open = true
			_chat_field.placeholder_text = "Escribe un mensaje..."
			_chat_field.grab_focus()
			Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)

func _send_chat(text: String) -> void:
	if text.strip_edges().is_empty():
		return
	_chat_field.text = ""
	_add_message(GameManager.get_display_name(), text)
	_chat_open = false
	_chat_field.placeholder_text = "Presiona T para chatear..."
	_chat_field.release_focus()
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

func _add_message(user: String, text: String) -> void:
	_chat_log.append_text("[color=#2563eb][b]" + user + "[/b][/color]: " + text + "\n")

func _add_system_message(text: String) -> void:
	_chat_log.append_text("[color=#9ca3af][i]" + text + "[/i][/color]\n")
